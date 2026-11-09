"use strict";

const fs = require("node:fs");
const fsp = fs.promises;
const path = require("node:path");
const crypto = require("node:crypto");
const net = require("node:net");
const ID = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}";
const MAX_MESSAGES = 80;
const BODY_LIMIT = 8192;
const PRESENCE_MS = 75000;
const WAIT_MS = 120000;
const RETENTION_DAYS = Math.min(365, Math.max(1, Number(process.env.ASSISTANT_RETENTION_DAYS) || 30));
const MESSAGES = {
  not_found: "Диалог не найден или срок хранения истёк.", consent_required: "Подтвердите согласие на обработку данных диалога.",
  invalid_request: "Проверьте данные запроса.", request_too_large: "Сообщение слишком большое.", text_required: "Введите сообщение длиной до 1500 символов.",
  rate_limited: "Слишком много сообщений. Подождите немного и повторите.", assistant_disabled: "Помощник временно отключён. Свяжитесь с лабораторией напрямую.",
  conversation_closed: "Диалог завершён. Создайте новый диалог.", message_in_progress: "Предыдущее сообщение ещё обрабатывается.", conversation_limit: "Достигнут лимит сообщений диалога. Начните новый диалог.",
  contact_required: "Для обратной связи укажите email или телефон.", contact_invalid: "Проверьте имя, email и телефон.",
  staff_unavailable: "Для ответа включите статус присутствия в панели диалогов.", already_claimed: "Диалог уже принят другим сотрудником.",
  claim_required: "Сначала примите диалог в работу.", forbidden_origin: "Адрес запроса не совпадает с адресом сайта.",
  capacity_reached: "Сервис диалогов временно занят. Свяжитесь с лабораторией напрямую.", store_unavailable: "Сервис диалогов временно недоступен.",
  method_not_allowed: "Метод запроса не поддерживается."
};
const TEXT = {
  ru: { unavailable: "ИИ-помощник временно недоступен. Вы можете запросить связь со специалистом SAEL или отправить запрос на КП через форму сайта.", waiting: "Запрос передан в очередь. Сотрудник подключится после принятия диалога. Пока диалог не принят, ответ специалиста не гарантирован.", callback: "Сейчас живой оператор недоступен. Запрос на обратную связь сохранён; специалист рассмотрит его в рабочее время лаборатории.", active: "К диалогу подключился специалист SAEL.", closed: "Диалог завершён.", welcome: "Здравствуйте! Я ИИ-помощник SAEL. Помогу найти услугу и подготовить запрос. В рабочее время можно запросить подключение специалиста." },
  kg: { unavailable: "ИИ жардамчы убактылуу жеткиликсиз. SAEL адисине кайрылууну же сайттагы форма аркылуу коммерциялык сунушту сурасаңыз болот.", waiting: "Сурамыңыз кезекке коюлду. Кызматкер диалогду кабыл алгандан кийин кошулат. Кабыл алынганга чейин адистин жообу кепилденбейт.", callback: "Учурда оператор жеткиликсиз. Байланышуу сурамы сакталды; адис лабораториянын иш убактысында карап чыгат.", active: "Диалогго SAEL адиси кошулду.", closed: "Диалог аяктады.", welcome: "Саламатсызбы! Мен SAEL ИИ жардамчысымын. Кызматты таап, сурам даярдоого жардам берем. Иш убактысында адиске кошулууну сурасаңыз болот." },
  en: { unavailable: "The AI assistant is temporarily unavailable. You can request a SAEL specialist or use the website quotation form.", waiting: "Your request is queued. A specialist will join after accepting the conversation. A live reply is not guaranteed until it is accepted.", callback: "No live operator is available now. Your callback request has been saved for a specialist to review during laboratory working hours.", active: "A SAEL specialist has joined the conversation.", closed: "The conversation has ended.", welcome: "Hello! I am SAEL's AI assistant. I can help you find a service and prepare a request. During office hours you can request a specialist." }
};

class AssistantError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }
function fail(status, code) { throw new AssistantError(status, code); }
function hash(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function equal(a, b) { const aa = Buffer.from(String(a)), bb = Buffer.from(String(b)); return aa.length === bb.length && crypto.timingSafeEqual(aa, bb); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function plain(value, max) { return String(value || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max); }
function locale(value) { return ["ru", "kg", "en"].includes(value) ? value : "ru"; }
function translated(value, fallback, max = 1500) { return Object.fromEntries(["ru", "kg", "en"].map(lang => [lang, plain(typeof value === "string" ? value : value?.[lang] || fallback[lang], max)])); }
function sourceUrl(value) {
  if (typeof value !== "string" || value.length > 1200 || /[\u0000-\u0020\\<>"'`]/.test(value) || value.startsWith("//")) return "";
  if (value.startsWith("/") || /^(?:index|about|service|page)\.html(?:[?#]|$)/.test(value)) return value;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : ""; } catch { return ""; }
}
function normalizeHours(input) {
  let timezone = typeof input?.timezone === "string" ? input.timezone : "Asia/Bishkek";
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(); } catch { timezone = "Asia/Bishkek"; }
  const weekdays = Array.isArray(input?.weekdays) ? [...new Set(input.weekdays.filter(day => Number.isInteger(day) && day >= 0 && day <= 6))] : [1, 2, 3, 4, 5];
  const valid = value => typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  return { timezone, weekdays, start: valid(input?.start) ? input.start : "08:00", end: valid(input?.end) ? input.end : "17:00" };
}
function workingHours(hours, date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: hours.timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).map(part => [part.type, part.value]));
  const weekday = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday], current = parts.hour + ":" + parts.minute;
  return hours.weekdays.includes(weekday) && hours.start < hours.end && current >= hours.start && current < hours.end;
}

function createAssistant(options) {
  const dataDir = path.join(path.resolve(process.env.CMS_DATA_DIR || path.join(options.root, "data")), "assistant");
  const storeFile = path.join(dataDir, "conversations.json"), presenceFile = path.join(dataDir, "presence.json"), lockFile = path.join(dataDir, ".write-lock");
  const ready = fsp.mkdir(dataDir, { recursive: true, mode: 0o700 }); ready.catch(() => {});
  const limit = Math.min(1000, Math.max(10, Number(process.env.ASSISTANT_MAX_CONVERSATIONS) || 200));
  const buckets = new Map(); let queue = Promise.resolve();
  const time = () => { const value = options.now ? options.now() : Date.now(); return value instanceof Date ? value.getTime() : new Date(value).getTime(); };
  const stamp = () => new Date(time()).toISOString();
  async function read(file, fallback) { try { return JSON.parse(await fsp.readFile(file, "utf8")); } catch (error) { if (error.code === "ENOENT") return clone(fallback); fail(503, "store_unavailable"); } }
  async function atomic(file, data) {
    const encoded = JSON.stringify(data); if (Buffer.byteLength(encoded) > 32 * 1024 * 1024) fail(503, "capacity_reached");
    const temp = file + ".tmp-" + crypto.randomBytes(8).toString("hex"); let handle;
    try { handle = await fsp.open(temp, "wx", 0o600); await handle.writeFile(encoded); await handle.sync(); await handle.close(); handle = null; await fsp.rename(temp, file); }
    finally { if (handle) await handle.close().catch(() => {}); await fsp.unlink(temp).catch(() => {}); }
  }
  async function lock() {
    const start = Date.now();
    for (;;) {
      try { const handle = await fsp.open(lockFile, "wx", 0o600); await handle.writeFile(JSON.stringify({ pid: process.pid, at: Date.now() })); return async () => { await handle.close(); await fsp.unlink(lockFile).catch(() => {}); }; }
      catch (error) {
        if (error.code !== "EEXIST") throw error;
        try { const data = JSON.parse(await fsp.readFile(lockFile, "utf8")); if (Date.now() - data.at > 30000) { let alive = true; try { process.kill(data.pid, 0); } catch (e) { if (e.code === "ESRCH") alive = false; } if (!alive) await fsp.unlink(lockFile).catch(() => {}); } }
        catch { try { const stat = await fsp.stat(lockFile); if (Date.now() - stat.mtimeMs > 120000) await fsp.unlink(lockFile).catch(() => {}); } catch {} }
        if (Date.now() - start > 6000) fail(503, "store_unavailable");
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
  }
  function serialized(fn) { const operation = queue.catch(() => {}).then(async () => { await ready; const release = await lock(); try { return await fn(); } finally { await release(); } }); queue = operation.catch(() => {}); return operation; }
  function withStore(fn, write = true) {
    return serialized(async () => {
      const state = await read(storeFile, { schemaVersion: 1, conversations: [] }); if (!Array.isArray(state.conversations)) fail(503, "store_unavailable");
      const before = state.conversations.length, cutoff = time() - RETENTION_DAYS * 86400000;
      state.conversations = state.conversations.filter(item => Date.parse(item.updatedAt) >= cutoff);
      // Persist expiry even when the requested, now-expired capability correctly returns 404.
      if (before !== state.conversations.length) await atomic(storeFile, state);
      const result = await fn(state);
      if (write) await atomic(storeFile, state);
      return result;
    });
  }
  async function presence() { const state = await read(presenceFile, []); if (!Array.isArray(state)) fail(503, "store_unavailable"); return state.filter(item => item.expiresAt > time()); }
  async function settings() {
    const snapshot = await options.getContent(), content = snapshot.content || snapshot, source = content.assistant || {};
    return { content, config: { enabled: source.enabled === true, title: translated(source.title, { ru: "Помощник SAEL", kg: "SAEL жардамчысы", en: "SAEL assistant" }, 200), welcome: translated(source.welcome, Object.fromEntries(Object.entries(TEXT).map(([lang, value]) => [lang, value.welcome]))), hours: normalizeHours(source.hours), phone: plain(content.settings?.phone, 80), email: plain(content.settings?.email || source.handoffEmail, 254) } };
  }
  async function availability(config, staffId) {
    const list = await presence(), isWorkingHours = workingHours(config.hours, new Date(time())), mine = staffId ? list.find(item => item.id === staffId && item.online) : null;
    const result = { isWorkingHours, staffOnline: isWorkingHours && list.some(item => item.online), online: !!mine, available: isWorkingHours && !!mine, expiresAt: mine?.expiresAt || null };
    Object.defineProperty(result, "onlineIds", { value: list.filter(item => item.online).map(item => item.id) });
    return result;
  }
  function trustedProxy(req) { const remote = String(req.socket.remoteAddress || "").replace(/^::ffff:/, ""); return String(process.env.CMS_TRUST_PROXY_IPS || process.env.TRUST_PROXY_IPS || "").split(",").map(value => value.trim()).includes(remote); }
  function ip(req) { const supplied = String(req.headers["x-real-ip"] || ""); return trustedProxy(req) && net.isIP(supplied) ? supplied : String(req.socket.remoteAddress || "unknown"); }
  function rate(key, count, window) {
    const now = time(); for (const [id, item] of buckets) if (item.expiresAt <= now) buckets.delete(id);
    const item = buckets.get(key) || { count: 0, expiresAt: now + window }; item.count++; buckets.set(key, item);
    if (item.count > count || buckets.size > 10000) fail(429, "rate_limited");
  }
  function publicOrigin(req) {
    const supplied = String(req.headers.origin || ""); if (!supplied) fail(403, "forbidden_origin");
    let expected = process.env.PUBLIC_ORIGIN || process.env.CMS_PUBLIC_ORIGIN;
    if (!expected) { const secure = !!req.socket.encrypted || (trustedProxy(req) && String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https"); expected = (secure ? "https://" : "http://") + String(req.headers.host || ""); }
    try { if (new URL(expected).origin !== supplied) fail(403, "forbidden_origin"); } catch (error) { if (error instanceof AssistantError) throw error; fail(403, "forbidden_origin"); }
  }
  async function body(req) {
    if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) fail(415, "invalid_request");
    if (Number(req.headers["content-length"]) > BODY_LIMIT) fail(413, "request_too_large");
    let bytes = 0; const chunks = [];
    try { for await (const chunk of req) { bytes += chunk.length; if (bytes > BODY_LIMIT) fail(413, "request_too_large"); chunks.push(chunk); } }
    catch (error) { if (error instanceof AssistantError) throw error; fail(400, "invalid_request"); }
    try { const value = JSON.parse(Buffer.concat(chunks).toString("utf8")); if (!value || Array.isArray(value) || typeof value !== "object") throw new Error(); return value; } catch { fail(400, "invalid_request"); }
  }
  function json(res, status, data) { const encoded = Buffer.from(JSON.stringify(data)); res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Content-Length", encoded.length); res.end(encoded); }
  function append(conversation, actor, text, extra = {}) {
    if (conversation.messages.length >= MAX_MESSAGES) fail(409, "conversation_limit");
    conversation.messages.push({ id: crypto.randomUUID(), actor, role: actor, text: plain(text, actor === "assistant" ? 4000 : 1500), createdAt: stamp(), ...extra }); conversation.updatedAt = stamp();
  }
  function visitor(state, id, req) {
    const token = String(req.headers["x-chat-token"] || ""); if (!/^[a-zA-Z0-9_-]{40,60}$/.test(token)) fail(404, "not_found");
    const conversation = state.conversations.find(item => item.id === id); if (!conversation || !equal(conversation.tokenHash, hash(token))) fail(404, "not_found"); return conversation;
  }
  function find(state, id) { const conversation = state.conversations.find(item => item.id === id); if (!conversation) fail(404, "not_found"); return conversation; }
  function view(conversation, available, admin = false) {
    const connected = conversation.status === "active" && available.onlineIds.includes(conversation.assignedTo);
    const result = { id: conversation.id, locale: conversation.locale, status: conversation.status, createdAt: conversation.createdAt, updatedAt: conversation.updatedAt, messages: conversation.messages.map(item => { const { staffId, ...message } = item; return message; }), contact: conversation.contact || null, requestedAt: conversation.requestedAt || null, staffAvailable: available.staffOnline, staffConnected: connected, isWorkingHours: available.isWorkingHours, callbackSuggested: conversation.status === "callback" || (conversation.status === "active" && !connected) || (conversation.status === "waiting" && (!available.staffOnline || time() - Date.parse(conversation.requestedAt) >= WAIT_MS)), needsHuman: !!conversation.needsHuman, mode: conversation.mode || "knowledge" };
    if (admin) { result.assignedTo = conversation.assignedTo || null; result.assignedName = conversation.assignedName || ""; result.notificationSent = !!conversation.notificationSent; }
    return result;
  }
  async function audit(event, conversationId, actorId) {
    const file = path.join(dataDir, "audit.jsonl");
    try { const stat = await fsp.stat(file).catch(() => null); if (stat?.size > 2 * 1024 * 1024) await fsp.rename(file, path.join(dataDir, "audit.previous.jsonl")); await fsp.appendFile(file, JSON.stringify({ at: stamp(), event, conversationId, actorId: actorId || null }) + "\n", { mode: 0o600 }); } catch { console.error("assistant_audit_write_failed"); }
  }
  async function aiReply(conversation, content, nonce) {
    let result;
    const abort = new AbortController(), timeout = setTimeout(() => abort.abort(), 20000); timeout.unref?.();
    try {
      if (typeof options.answer !== "function") throw new Error("not_configured");
      const history = conversation.messages.filter(item => ["user", "assistant"].includes(item.actor)).map(item => ({ actor: item.actor, role: item.actor, text: item.text }));
      const job = options.answer({ text: history.at(-1)?.text || "", locale: conversation.locale, conversation: { id: conversation.id, locale: conversation.locale, messages: history }, content, signal: abort.signal });
      result = await Promise.race([job, new Promise((_, reject) => abort.signal.addEventListener("abort", () => reject(new Error("timeout")), { once: true }))]);
    } catch { result = { text: TEXT[conversation.locale].unavailable, mode: "unavailable", needsHuman: true }; }
    finally { clearTimeout(timeout); }
    const text = plain(typeof result === "string" ? result : result?.text, 4000) || TEXT[conversation.locale].unavailable;
    const sources = Array.isArray(result?.sources) ? result.sources.slice(0, 5).map(item => ({ id: plain(item.id, 120), title: plain(item.title, 180), url: sourceUrl(item.url) })).filter(item => item.title && item.url) : [];
    return withStore(state => {
      const current = find(state, conversation.id); if (current.aiPending?.nonce !== nonce) return clone(current);
      delete current.aiPending;
      // A queued or claimed handoff always wins over an in-flight model response.
      if (current.status === "ai") { current.needsHuman = !!result?.needsHuman; current.mode = ["ai", "knowledge", "unavailable"].includes(result?.mode) ? result.mode : "ai"; append(current, "assistant", text, {sources,mode:current.mode,needsHuman:current.needsHuman}); }
      return clone(current);
    });
  }
  async function admin(req, write) {
    if (typeof options.authorizeAdmin !== "function") fail(401, "unauthorized");
    const value = await options.authorizeAdmin(req, write), user = value?.user || value;
    if (!user?.id) fail(401, "unauthorized"); return user;
  }
  async function handle(req, res, pathname) {
    const publicPath = pathname.startsWith("/api/assistant/"), adminPath = pathname.startsWith("/api/admin/assistant/");
    if (!publicPath && !adminPath) return false;
    try {
      await ready;
      if (publicPath) rate("read:" + ip(req), 240, 60000);
      const { content, config } = await settings(), available = await availability(config);
      if (pathname === "/api/assistant/config") {
        if (req.method !== "GET") fail(405, "method_not_allowed");
        const aiConfigured = typeof options.aiConfigured === "function" ? !!options.aiConfigured() : !!options.aiConfigured;
        json(res, 200, { ...config, isWorkingHours: available.isWorkingHours, staffOnline: available.staffOnline, aiConfigured }); return true;
      }
      if (pathname === "/api/assistant/conversations") {
        if (req.method !== "POST") fail(405, "method_not_allowed"); publicOrigin(req); if (!config.enabled) fail(503, "assistant_disabled"); rate("create:" + ip(req), 5, 3600000);
        const input = await body(req); if (input.consent !== true) fail(400, "consent_required");
        const token = crypto.randomBytes(32).toString("base64url"), id = crypto.randomUUID(), lang = locale(input.locale);
        const conversation = { id, tokenHash: hash(token), locale: lang, status: "ai", createdAt: stamp(), updatedAt: stamp(), consentAt: stamp(), messages: [], mode: "knowledge" };
        append(conversation, "assistant", config.welcome[lang] || TEXT[lang].welcome);
        await withStore(state => { if (state.conversations.length >= limit) fail(503, "capacity_reached"); state.conversations.push(conversation); });
        await audit("conversation_created", id); json(res, 201, { id, token, conversation: view(conversation, available) }); return true;
      }
      const publicMatch = pathname.match(new RegExp(`^/api/assistant/conversations/(${ID})(?:/(messages|handoff|close))?$`));
      if (publicMatch) {
        const [, id, action] = publicMatch;
        if (!action) {
          if (req.method !== "GET") fail(405, "method_not_allowed"); const conversation = await withStore(state => clone(visitor(state, id, req)), false); json(res, 200, { conversation: view(conversation, available) }); return true;
        }
        if (req.method !== "POST") fail(405, "method_not_allowed"); publicOrigin(req); const input = await body(req);
        if (action === "close") {
          const conversation = await withStore(state => { const current = visitor(state, id, req); if (current.status !== "closed") { current.status = "closed"; delete current.aiPending; if (current.messages.length < MAX_MESSAGES) append(current, "system", TEXT[current.locale].closed); } return clone(current); });
          await audit("visitor_closed", id); json(res, 200, { conversation: view(conversation, available) }); return true;
        }
        if (!config.enabled) fail(503, "assistant_disabled");
        if (action === "messages") {
          rate("message-ip:" + ip(req), 30, 60000); rate("message-conversation:" + id, 12, 60000);
          if (typeof input.text !== "string" || !input.text.trim() || input.text.length > 1500) fail(400, "text_required");
          if (input.clientMessageId !== undefined && (typeof input.clientMessageId !== "string" || !/^[a-zA-Z0-9_-]{1,120}$/.test(input.clientMessageId))) fail(400, "invalid_request");
          const nonce = crypto.randomUUID(); let runAi = false;
          let conversation = await withStore(state => {
            const current = visitor(state, id, req); if (current.status === "closed") fail(409, "conversation_closed");
            if (input.clientMessageId && current.messages.some(item => item.clientMessageId === input.clientMessageId)) return clone(current);
            if (current.aiPending && time() - current.aiPending.at < 30000) fail(409, "message_in_progress");
            if (current.messages.length >= MAX_MESSAGES - 1) fail(409, "conversation_limit");
            append(current, "user", input.text, input.clientMessageId ? { clientMessageId: plain(input.clientMessageId, 120) } : {});
            if (current.status === "ai") { current.aiPending = { nonce, at: time() }; runAi = true; }
            return clone(current);
          });
          if (runAi) conversation = await aiReply(conversation, content, nonce);
          json(res, 200, { conversation: view(conversation, await availability(config)) }); return true;
        }
        if (action === "handoff") {
          rate("handoff:" + id, 3, 3600000); if (input.consent !== true) fail(400, "consent_required");
          const name = plain(input.name, 120).replace(/[\r\n\t]/g, " "), email = plain(input.email, 254), phone = plain(input.phone, 80).replace(/[\r\n\t]/g, " ");
          if (!name || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) || (phone && phone.replace(/\D/g, "").length < 5)) fail(400, "contact_invalid");
          if (!available.staffOnline && !email && !phone) fail(400, "contact_required");
          let notifyNeeded = false;
          let conversation = await withStore(state => {
            const current = visitor(state, id, req); if (current.status === "closed") fail(409, "conversation_closed");
            current.contact = { name, email, phone, consentAt: stamp() }; current.handoffConsentAt = stamp(); current.requestedAt = current.requestedAt || stamp(); delete current.aiPending;
            if (current.status !== "active") { current.status = available.staffOnline ? "waiting" : "callback"; append(current, "system", TEXT[current.locale][current.status === "waiting" ? "waiting" : "callback"]); }
            notifyNeeded = !current.notificationAttemptedAt; current.notificationAttemptedAt = current.notificationAttemptedAt || stamp(); return clone(current);
          });
          let notificationSent = !!conversation.notificationSent;
          if (notifyNeeded && typeof options.notify === "function") {
            let deadline;
            const attempt = Promise.resolve().then(() => options.notify({ conversation: view(conversation, available, true), contact: conversation.contact, content })).then(result => ({ sent: result?.sent === true, pending: false }), () => { console.error("assistant_notification_failed"); return { sent: false, pending: false }; });
            const outcome = await Promise.race([attempt, new Promise(resolve => { deadline = setTimeout(() => resolve({ sent: false, pending: true }), 9000); })]);
            clearTimeout(deadline); notificationSent = outcome.sent;
            if (outcome.pending) attempt.then(result => { if (result.sent) return withStore(state => { const current = state.conversations.find(item => item.id === id); if (current) current.notificationSent = true; }); }).catch(() => console.error("assistant_notification_status_failed"));
            conversation = await withStore(state => { const current = find(state, id); current.notificationSent = notificationSent; return clone(current); });
          }
          await audit("handoff_requested", id); json(res, 200, { conversation: view(conversation, available), notificationSent }); return true;
        }
      }
      if (adminPath) {
        const user = await admin(req, !["GET", "HEAD"].includes(req.method));
        if (pathname === "/api/admin/assistant/presence") {
          if (req.method === "POST") {
            const input = await body(req); if (typeof input.online !== "boolean") fail(400, "invalid_request");
            await serialized(async () => { const list = (await presence()).filter(item => item.id !== user.id); if (input.online) list.push({ id: user.id, online: true, expiresAt: time() + PRESENCE_MS }); await atomic(presenceFile, list); });
          } else if (req.method !== "GET") fail(405, "method_not_allowed");
          json(res, 200, await availability(config, user.id)); return true;
        }
        if (pathname === "/api/admin/assistant/conversations") {
          if (req.method !== "GET") fail(405, "method_not_allowed");
          const conversations = await withStore(state => state.conversations.map(item => { const result = view(item, available, true); result.messageCount = result.messages.length; result.lastMessage = result.messages.at(-1) || null; delete result.messages; return result; }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), false);
          json(res, 200, { conversations }); return true;
        }
        const match = pathname.match(new RegExp(`^/api/admin/assistant/conversations/(${ID})(?:/(claim|messages|close))?$`));
        if (match) {
          const [, id, action] = match;
          if (!action) { if (req.method !== "GET") fail(405, "method_not_allowed"); const conversation = await withStore(state => clone(find(state, id)), false); json(res, 200, { conversation: view(conversation, available, true) }); return true; }
          if (req.method !== "POST") fail(405, "method_not_allowed"); const input = await body(req);
          // Public availability follows office hours. A connected employee may voluntarily answer an existing request later.
          if (action !== "close" && !(await availability(config, user.id)).online) fail(409, "staff_unavailable");
          const conversation = await withStore(state => {
            const current = find(state, id); if (current.status === "closed") fail(409, "conversation_closed");
            if (action === "claim") {
              if (!["waiting", "callback", "active"].includes(current.status)) fail(409, "claim_required");
              if (current.assignedTo && current.assignedTo !== user.id) fail(409, "already_claimed");
              const first = current.status !== "active"; current.assignedTo = user.id; current.assignedName = plain(user.username, 80); current.status = "active"; delete current.aiPending;
              if (first) append(current, "system", TEXT[current.locale].active);
            } else if (action === "messages") {
              if (current.status !== "active" || current.assignedTo !== user.id) fail(409, "claim_required");
              if (typeof input.text !== "string" || !input.text.trim() || input.text.length > 1500) fail(400, "text_required");
              append(current, "staff", input.text, { staffId: user.id, staffName: "Специалист SAEL" });
            } else { current.status = "closed"; delete current.aiPending; if (current.messages.length < MAX_MESSAGES) append(current, "system", TEXT[current.locale].closed); }
            return clone(current);
          });
          await audit("staff_" + action, id, user.id); json(res, 200, { conversation: view(conversation, await availability(config), true) }); return true;
        }
      }
      fail(404, "not_found");
    } catch (error) {
      if (res.writableEnded || res.destroyed) return true;
      const operational = error instanceof AssistantError || (Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 && !error.errno);
      const status = operational ? error.status : 503, code = operational && typeof error.code === "string" ? error.code : "store_unavailable";
      if (status === 429) res.setHeader("Retry-After", "60");
      if (status >= 500) console.error("assistant_operation_failed", code);
      json(res, status, { error: code, message: MESSAGES[code] || (status < 500 ? error.message : MESSAGES.store_unavailable) }); return true;
    }
  }
  const retentionTimer = setInterval(() => { withStore(() => null, false).catch(() => console.error("assistant_retention_cleanup_failed")); }, 3600000); retentionTimer.unref?.();
  ready.then(() => withStore(() => null, false)).catch(() => console.error("assistant_store_startup_failed"));
  return { handle, ready, dataDir, close() { clearInterval(retentionTimer); } };
}

module.exports = { createAssistant, normalizeHours, workingHours };
