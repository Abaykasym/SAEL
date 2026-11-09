"use strict";

const fs = require("node:fs");
const fsp = fs.promises;
const path = require("node:path");
const crypto = require("node:crypto");
const net = require("node:net");
const { promisify } = require("node:util");
const Busboy = require("busboy");
const scrypt = promisify(crypto.scrypt);
const { defaultAssistant } = require("./assistant-config");

const COOKIE = "sael_cms_session";
const MAX_BODY = 3 * 1024 * 1024;
const MAX_MEDIA = 10 * 1024 * 1024;
const SESSION_MS = 8 * 60 * 60 * 1000;
const TOP_LEVEL = new Set(["schemaVersion", "settings", "copy", "services", "priceEntries", "categories", "priceTranslations", "serviceContent", "aboutContent", "processSteps", "clientSteps", "faqs", "pages", "menus", "sections", "documents", "partners", "equipment", "images"]);
const COLLECTIONS = ["services", "priceEntries", "pages", "sections", "documents", "partners", "equipment", "images"];
TOP_LEVEL.add("assistant");
const OBJECTS = ["settings", "copy", "categories", "priceTranslations", "serviceContent", "aboutContent", "processSteps", "clientSteps", "faqs", "menus"];
const FORMATTING = new Set(["p", "br", "em", "strong", "b", "i", "u", "s", "ul", "ol", "li", "a", "blockquote", "h2", "h3", "h4", "sup", "sub", "code", "span", "table", "thead", "tbody", "tr", "th", "td"]);
const MESSAGES = {
  invalid_json: "Не удалось прочитать данные запроса.", invalid_content: "Проверьте структуру и содержимое материала.",
  revision_conflict: "Материал уже изменён в другой вкладке. Обновите данные перед сохранением.",
  unauthorized: "Войдите в панель администратора.", invalid_credentials: "Неверные данные для входа или код подтверждения.",
  forbidden_origin: "Запрос отклонён: адрес страницы не совпадает с адресом сайта.", csrf_invalid: "Сессия обновилась. Перезагрузите страницу и повторите действие.",
  https_required: "Для входа на хостинге настройте HTTPS и PUBLIC_ORIGIN.", rate_limited: "Слишком много попыток. Повторите через 15 минут.",
  password_weak: "Пароль должен содержать от 12 до 128 символов.", username_invalid: "Логин: от 3 до 80 букв, цифр, точек, дефисов или подчёркиваний.",
  setup_unavailable: "Первичная настройка недоступна. Проверьте CMS_SETUP_TOKEN в закрытых настройках сервера.", setup_complete: "Администратор уже создан. Используйте вход.",
  setup_token_invalid: "Неверный код первичной настройки.", upload_type: "Разрешены изображения JPG, PNG, WebP и документы PDF.",
  file_too_large: "Размер файла превышает 10 МБ.", request_too_large: "Запрос превышает допустимый размер.", empty_file: "Выбран пустой файл.",
  invalid_multipart: "Не удалось прочитать загружаемый файл.", media_not_found: "Файл не найден.",
  media_in_use: "Файл используется на сайте. Сначала замените или удалите ссылки на него в материалах.",
  media_storage_full: "Достигнут лимит медиатеки. Удалите неиспользуемые файлы или увеличьте CMS_MEDIA_LIMIT_MB.",
  totp_invalid: "Неверный шестизначный код подтверждения.", totp_pending: "Сначала создайте ключ двухфакторной аутентификации.",
  backup_not_found: "Резервная версия не найдена. Возможно, она уже заменена более новой копией.",
  store_busy: "Хранилище занято. Повторите сохранение.", store_invalid: "Хранилище недоступно. Обратитесь к администратору сервера.",
  method_not_allowed: "Метод запроса не поддерживается.", not_found: "Адрес не найден."
};

class CmsError extends Error {
  constructor(status, code, extra) { super(code); this.status = status; this.code = code; this.extra = extra || {}; }
}
function fail(status, code, extra) { throw new CmsError(status, code, extra); }
function object(value) { return !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function hash(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function equal(a, b) { const aa = Buffer.from(String(a)), bb = Buffer.from(String(b)); return aa.length === bb.length && crypto.timingSafeEqual(aa, bb); }
function random() { return crypto.randomBytes(32).toString("base64url"); }
function inside(parent, child) { const relative = path.relative(parent, child); return relative === "" || (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative)); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function safeName(value) { return String(value || "file").replace(/[\r\n\x00-\x1f\\/]/g, "_").slice(0, 160); }
function safeUrl(value) {
  if (typeof value !== "string" || value.length > 4000 || /[\x00-\x20\\]/.test(value) || value.startsWith("//")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return /^(https?:|mailto:|tel:)/i.test(value);
  return !value.split(/[/?#]/).includes("..");
}
function safeAssetUrl(value) { return safeUrl(value) && (!/^[a-z][a-z0-9+.-]*:/i.test(value) || /^https?:/i.test(value)); }
function checkText(value) {
  if (value.length > 10000) fail(400, "invalid_content");
  const decoded = value.replace(/&#(?:x([a-f0-9]+)|(\d+));?/gi, (_, hex, dec) => String.fromCodePoint(Math.min(parseInt(hex || dec, hex ? 16 : 10) || 0, 0x10ffff))).replace(/&colon;/gi, ":").replace(/&(?:tab|newline);/gi, "").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
  for (const match of decoded.matchAll(/<\s*\/?\s*([a-z][a-z0-9:-]*)\b[^>]*(?:>|$)/gi)) {
    if (!match[0].endsWith(">")) fail(400, "invalid_content");
    if (!FORMATTING.has(match[1].toLowerCase())) fail(400, "invalid_content");
    if (/\s(?:on[a-z]+|style|srcdoc|xmlns)\s*=/i.test(match[0])) fail(400, "invalid_content");
    for (const attr of match[0].matchAll(/\s(?:href|src|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
      if (!safeUrl((attr[1] || attr[2] || attr[3] || "").replace(/[\t\r\n]/g, ""))) fail(400, "invalid_content");
    }
  }
}
function validateContent(content) {
  if (!object(content) || content.schemaVersion !== 1) fail(400, "invalid_content");
  if (Object.keys(content).some(key => !TOP_LEVEL.has(key))) fail(400, "invalid_content");
  let nodes = 0;
  function walk(value, depth) {
    if (++nodes > 100000 || depth > 24) fail(400, "invalid_content");
    if (typeof value === "string") { checkText(value); return; }
    if (value === null || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return;
    if (Array.isArray(value)) { if (value.length > 10000) fail(400, "invalid_content"); value.forEach(item => walk(item, depth + 1)); return; }
    if (!object(value)) fail(400, "invalid_content");
    for (const [key, item] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key) || key.length > 1000) fail(400, "invalid_content");
      if (key === "url" && item && !safeUrl(item)) fail(400, "invalid_content");
      if (["src", "logo", "photo", "logoFull", "logoMark", "pricePdf", "limsUrl", "videoUrl", "mapUrl", "sourceUrl"].includes(key) && item && !safeAssetUrl(item)) fail(400, "invalid_content");
      walk(item, depth + 1);
    }
  }
  walk(content, 0);
  if (Buffer.byteLength(JSON.stringify(content)) > MAX_BODY) fail(413, "request_too_large");
  OBJECTS.forEach(key => { if (!object(content[key])) fail(400, "invalid_content"); });
  for (const key of COLLECTIONS) {
    if (!Array.isArray(content[key]) || content[key].length > 5000) fail(400, "invalid_content");
    const ids = new Set();
    content[key].forEach(item => {
      if (!object(item) || typeof item.id !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/.test(item.id) || ids.has(item.id)) fail(400, "invalid_content");
      ids.add(item.id);
    });
  }
  for (const lang of ["ru", "kg", "en"]) {
    if (!object(content.copy[lang]) || !object(content.categories[lang]) || !Array.isArray(content.faqs[lang]) || !Array.isArray(content.clientSteps[lang]) || !Array.isArray(content.processSteps[lang])) fail(400, "invalid_content");
  }
  const slugs = new Set();
  function blocks(items) {
    if (!Array.isArray(items) || items.length > 200) fail(400, "invalid_content");
    const ids = new Set();
    items.forEach(item => {
      if (!object(item) || typeof item.id !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/.test(item.id) || ids.has(item.id) || !["text", "heading", "image", "button", "list", "quote"].includes(item.type)) fail(400, "invalid_content");
      ids.add(item.id);
      if (item.level !== undefined && ![2, 3].includes(item.level)) fail(400, "invalid_content");
    });
  }
  content.pages.forEach(page => {
    if (typeof page.slug !== "string" || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(page.slug) || slugs.has(page.slug) || !["home", "about", "service", "custom"].includes(page.kind) || !["published", "draft"].includes(page.status)) fail(400, "invalid_content");
    slugs.add(page.slug); blocks(page.blocks);
  });
  content.sections.forEach(section => { if (typeof section.enabled !== "boolean") fail(400, "invalid_content"); blocks(section.blocks); });
  for (const name of ["header", "footer"]) {
    if (!Array.isArray(content.menus[name]) || content.menus[name].length > 100) fail(400, "invalid_content");
    const ids = new Set();
    content.menus[name].forEach(item => { if (!object(item) || typeof item.id !== "string" || ids.has(item.id) || !["_self", "_blank"].includes(item.target) || !safeUrl(item.url)) fail(400, "invalid_content"); ids.add(item.id); });
  }
  if (content.assistant !== undefined) {
    const assistant=content.assistant;
    if (!object(assistant) || typeof assistant.enabled!=="boolean" || typeof assistant.instructions!=="string" || !Array.isArray(assistant.knowledge) || assistant.knowledge.length>500) fail(400,"invalid_content");
    if (Object.keys(assistant).some(key=>!["enabled","title","welcome","instructions","hours","handoffEmail","knowledge"].includes(key))) fail(400,"invalid_content");
    for (const name of ["title","welcome"]) if (!object(assistant[name]) || ["ru","kg","en"].some(lang=>typeof assistant[name][lang]!=="string")) fail(400,"invalid_content");
    if (typeof assistant.handoffEmail!=="string" || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(assistant.handoffEmail)) fail(400,"invalid_content");
    const hours=assistant.hours;
    if (!object(hours) || !Array.isArray(hours.weekdays) || hours.weekdays.length>7 || hours.weekdays.some(day=>!Number.isInteger(day)||day<0||day>6) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hours.end) || hours.start>=hours.end) fail(400,"invalid_content");
    try { new Intl.DateTimeFormat("en",{timeZone:hours.timezone}).format(); } catch { fail(400,"invalid_content"); }
    const ids=new Set();
    for (const article of assistant.knowledge) {
      if (!object(article) || typeof article.id!=="string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/.test(article.id) || ids.has(article.id) || !["published","draft"].includes(article.status) || typeof article.tags!=="string") fail(400,"invalid_content");
      ids.add(article.id);
      for (const name of ["title","text"]) if (!object(article[name]) || ["ru","kg","en"].some(lang=>typeof article[name][lang]!=="string")) fail(400,"invalid_content");
    }
  }
  return content;
}

async function passwordHash(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 128) fail(400, "password_weak");
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt}$${derived.toString("hex")}`;
}
async function passwordMatches(password, encoded) {
  if (typeof password !== "string" || password.length > 128 || typeof encoded !== "string") return false;
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt" || parts[1] !== "16384" || !/^[a-f0-9]{32}$/.test(parts[4]) || !/^[a-f0-9]{128}$/.test(parts[5])) return false;
  const derived = await scrypt(password, parts[4], 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return equal(derived.toString("hex"), parts[5]);
}
function base32(buffer) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let bits = 0, acc = 0, out = "";
  for (const byte of buffer) { acc = (acc << 8) | byte; bits += 8; while (bits >= 5) { bits -= 5; out += alphabet[(acc >>> bits) & 31]; } }
  if (bits) out += alphabet[(acc << (5 - bits)) & 31];
  return out;
}
function decode32(text) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let bits = 0, acc = 0; const out = [];
  for (const char of text) { const n = alphabet.indexOf(char); if (n < 0) return Buffer.alloc(0); acc = (acc << 5) | n; bits += 5; if (bits >= 8) { bits -= 8; out.push((acc >>> bits) & 255); } }
  return Buffer.from(out);
}
function totpStep(secret, code, previous = -1) {
  if (!/^\d{6}$/.test(String(code || ""))) return null;
  const step = Math.floor(Date.now() / 30000), key = decode32(secret);
  for (const n of [step - 1, step, step + 1]) {
    if (n <= previous) continue;
    const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(n));
    const digest = crypto.createHmac("sha1", key).update(b).digest(), offset = digest[19] & 15;
    const expected = String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, "0");
    if (equal(expected, String(code))) return n;
  }
  return null;
}

function createCms(options) {
  const root = path.resolve(options.root), publicRoot = path.resolve(options.publicRoot || root);
  const dataDir = path.resolve(process.env.CMS_DATA_DIR || path.join(root, "data"));
  if (publicRoot !== root && inside(publicRoot, dataDir)) throw new Error("CMS_DATA_DIR must be outside the public document root");
  const files = { content: path.join(dataDir, "content.json"), auth: path.join(dataDir, "auth.json"), media: path.join(dataDir, "media.json") };
  const backupDir = path.join(dataDir, "backups"), mediaDir = path.join(dataDir, "media"), lockPath = path.join(dataDir, ".write-lock");
  const buckets = new Map(); let queue = Promise.resolve();
  const ready = Promise.all([fsp.mkdir(dataDir, { recursive: true, mode: 0o700 }), fsp.mkdir(backupDir, { recursive: true, mode: 0o700 }), fsp.mkdir(mediaDir, { recursive: true, mode: 0o700 })]);
  // Preserve the rejection for callers while preventing an idle startup from leaking an unhandled rejection.
  ready.catch(() => {});
  async function read(file, fallback) {
    try { return JSON.parse(await fsp.readFile(file, "utf8")); }
    catch (error) { if (error.code === "ENOENT") return typeof fallback === "function" ? fallback() : clone(fallback); fail(503, "store_invalid"); }
  }
  async function atomic(file, data) {
    const temp = file + ".tmp-" + crypto.randomBytes(8).toString("hex"); let fd;
    try {
      fd = await fsp.open(temp, "wx", 0o600); await fd.writeFile(JSON.stringify(data, null, 2)); await fd.sync(); await fd.close(); fd = null;
      // Windows scanners/readers can briefly hold a destination file. Preserve the old file and retry the atomic replacement.
      for(let attempt=0;;attempt++){
        try{await fsp.rename(temp,file);break;}
        catch(error){if(attempt>=5||!["EPERM","EBUSY","EACCES"].includes(error.code))throw error;await new Promise(resolve=>setTimeout(resolve,50*(attempt+1)));}
      }
    }
    finally { if (fd) await fd.close().catch(() => {}); await fsp.unlink(temp).catch(() => {}); }
  }
  async function lock() {
    const started = Date.now();
    for (;;) {
      try { const fd = await fsp.open(lockPath, "wx", 0o600); await fd.writeFile(JSON.stringify({ pid: process.pid, at: Date.now() })); return async () => { await fd.close(); await fsp.unlink(lockPath).catch(() => {}); }; }
      catch (error) {
        if (error.code !== "EEXIST") throw error;
        try {
          const info = JSON.parse(await fsp.readFile(lockPath, "utf8"));
          if (Date.now() - info.at > 30000) { let alive = true; try { process.kill(info.pid, 0); } catch (e) { if (e.code === "ESRCH") alive = false; } if (!alive) await fsp.unlink(lockPath).catch(() => {}); }
        } catch { try { const stat=await fsp.stat(lockPath); if(Date.now()-stat.mtimeMs>120000)await fsp.unlink(lockPath).catch(()=>{}); } catch {} }
        if (Date.now() - started > 6000) fail(503, "store_busy");
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
  }
  function mutate(fn) {
    const operation = queue.catch(() => {}).then(async () => { await ready; const unlock = await lock(); try { return await fn(); } finally { await unlock(); } });
    queue = operation.catch(() => {}); return operation;
  }
  async function audit(actor, event, detail) {
    const file = path.join(dataDir, "audit.jsonl");
    try {
      const stat = await fsp.stat(file).catch(() => null);
      if (stat && stat.size > 5 * 1024 * 1024) await fsp.rename(file, path.join(dataDir, "audit.previous.jsonl"));
      await fsp.appendFile(file, JSON.stringify({ at: new Date().toISOString(), actor: actor || "system", event, detail: detail || {} }) + "\n", { mode: 0o600 });
    } catch { console.error("cms_audit_write_failed"); }
  }
  async function auth() { const state = await read(files.auth, { schemaVersion: 1, users: [], sessions: [] }); if (!Array.isArray(state.users) || !Array.isArray(state.sessions)) fail(503, "store_invalid"); return state; }
  function seedEnvelope() { const content = clone(typeof options.seed === "function" ? options.seed() : options.seed); validateContent(content); return { schemaVersion: 1, revision: 1, updatedAt: new Date().toISOString(), content }; }
  async function content() {
    await ready;
    if (!fs.existsSync(files.content)) await mutate(async () => { if (!fs.existsSync(files.content)) await atomic(files.content, seedEnvelope()); });
    const state = await read(files.content, null);
    if (!state || !object(state.content) || !Number.isSafeInteger(state.revision)) fail(503, "store_invalid");
    if (!state.content.assistant) state.content.assistant=defaultAssistant();
    return state;
  }
  function proxyTrusted(req) { const list = String(process.env.CMS_TRUST_PROXY_IPS || process.env.TRUST_PROXY_IPS || "").split(",").map(v => v.trim()); return list.includes(String(req.socket.remoteAddress || "").replace(/^::ffff:/, "")); }
  function configuredOrigin() {
    const raw = process.env.PUBLIC_ORIGIN || process.env.CMS_PUBLIC_ORIGIN;
    if (!raw) return null;
    try { const url = new URL(raw); if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error(); return url.origin; }
    catch { fail(503, "store_invalid"); }
  }
  function secure(req) { return !!req.socket.encrypted || (proxyTrusted(req) && String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https") || String(configuredOrigin() || "").startsWith("https:"); }
  function hostOrigin(req) {
    try { const value = new URL((secure(req) ? "https://" : "http://") + String(req.headers.host || "")); if (!value.hostname || value.username || value.password || value.pathname !== "/") throw new Error(); return value.origin; }
    catch { fail(403, "forbidden_origin"); }
  }
  function origin(req) {
    const expected = configuredOrigin() || hostOrigin(req), actual = String(req.headers.origin || "");
    if (!equal(actual, expected)) fail(403, "forbidden_origin");
    const url = new URL(expected), remote = String(req.socket.remoteAddress || "").replace(/^::ffff:/, "");
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && ["127.0.0.1", "::1"].includes(remote) && process.env.NODE_ENV !== "production";
    if (!secure(req) && !local) fail(426, "https_required");
  }
  function ip(req) { const forwarded = String(req.headers["x-real-ip"] || ""); return proxyTrusted(req) && net.isIP(forwarded) ? forwarded : String(req.socket.remoteAddress || "unknown"); }
  function rate(req) {
    const now = Date.now(); for (const [key, item] of buckets) if (now - item.at > 900000) buckets.delete(key);
    const key = ip(req), entry = buckets.get(key) || { at: now, count: 0 }; entry.count++; buckets.set(key, entry);
    if (entry.count > 10 || buckets.size > 10000) fail(429, "rate_limited");
  }
  function cookie(req, res, token, clear = false) { res.setHeader("Set-Cookie", `${COOKIE}=${clear ? "" : token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : SESSION_MS / 1000}${secure(req) ? "; Secure" : ""}`); }
  function token(req) { const match = String(req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-zA-Z0-9_-]{30,100})(?:;|$)`)); return match ? match[1] : ""; }
  async function session(req, write) {
    const state = await auth(), key = token(req), item = key && state.sessions.find(s => equal(s.hash, hash(key)) && s.expiresAt > Date.now());
    const user = item && state.users.find(u => u.id === item.userId);
    if (!user) fail(401, "unauthorized");
    if (write) { origin(req); if (!equal(String(req.headers["x-csrf-token"] || ""), item.csrfToken)) fail(403, "csrf_invalid"); }
    return { state, item, user };
  }
  function newSession(state, user) {
    const value = random(), item = { hash: hash(value), userId: user.id, csrfToken: random(), createdAt: Date.now(), expiresAt: Date.now() + SESSION_MS };
    state.sessions = state.sessions.filter(s => s.expiresAt > Date.now()).slice(-49); state.sessions.push(item); return { value, item };
  }
  function userView(user) { return { id: user.id, username: user.username, role: user.role || "admin", totpEnabled: !!user.totpSecret }; }
  function json(res, status, body) { const payload = Buffer.from(JSON.stringify(body)); res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Content-Length", payload.length); res.end(payload); }
  async function body(req) {
    if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) fail(415, "invalid_json");
    if (Number(req.headers["content-length"]) > MAX_BODY) fail(413, "request_too_large");
    const chunks = []; let size = 0;
    try { for await (const chunk of req) { size += chunk.length; if (size > MAX_BODY) fail(413, "request_too_large"); chunks.push(chunk); } }
    catch (error) { if (error instanceof CmsError) throw error; fail(400, "invalid_json"); }
    try { const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")); if (!object(parsed)) throw new Error(); return parsed; } catch { fail(400, "invalid_json"); }
  }
  async function backup(previous) {
    await atomic(path.join(backupDir, `content-${String(previous.revision).padStart(10, "0")}-${Date.now()}.json`), previous);
    const names = (await fsp.readdir(backupDir)).filter(name => /^content-\d+-\d+\.json$/.test(name)).sort();
    for (const name of names.slice(0, -10)) await fsp.unlink(path.join(backupDir, name));
  }
  async function parseUpload(req) {
    return new Promise((resolve, reject) => {
      let parser, settled = false, chosen = null, seen = 0, size = 0, error; const chunks = [];
      function finish(err) { if (settled) return; settled = true; req.off("data", onData); req.off("aborted", onAbort); if (err) { chunks.length = 0; if (parser) { req.unpipe(parser); parser.destroy(); } req.resume(); reject(err); } else resolve(chosen); }
      function onData(chunk) { size += chunk.length; if (size > MAX_MEDIA + 65536) finish(new CmsError(413, "file_too_large")); }
      function onAbort() { finish(new CmsError(400, "invalid_multipart")); }
      if (Number(req.headers["content-length"]) > MAX_MEDIA + 65536) { finish(new CmsError(413, "file_too_large")); return; }
      try { parser = Busboy({ headers: req.headers, limits: { files: 1, fields: 0, fileSize: MAX_MEDIA, parts: 2 } }); }
      catch { finish(new CmsError(400, "invalid_multipart")); return; }
      parser.on("file", (field, stream, info) => {
        if (++seen > 1 || field !== "file" || !info.filename) { error = new CmsError(400, "invalid_multipart"); stream.resume(); return; }
        let count = 0; stream.on("data", part => { count += part.length; if (!settled && count <= MAX_MEDIA) chunks.push(part); });
        stream.on("limit", () => { error = new CmsError(413, "file_too_large"); }); stream.on("error", onAbort);
        stream.on("end", () => { if (!settled) chosen = { content: Buffer.concat(chunks), filename: safeName(info.filename), mime: info.mimeType }; });
      });
      for (const event of ["filesLimit", "fieldsLimit", "partsLimit"]) parser.on(event, () => { error = new CmsError(400, "invalid_multipart"); });
      parser.on("error", onAbort); parser.on("close", () => finish(error || (!chosen ? new CmsError(400, "invalid_multipart") : null)));
      req.on("data", onData); req.on("aborted", onAbort); req.on("error", onAbort); req.pipe(parser);
    });
  }
  function uploadType(upload) {
    const b = upload.content; if (!b.length) fail(400, "empty_file");
    const ext = path.extname(upload.filename).toLowerCase(), mime = String(upload.mime).toLowerCase();
    const types = [
      { ext: ".jpg", exts: [".jpg", ".jpeg"], mime: "image/jpeg", valid: b.length > 4 && b[0] === 255 && b[1] === 216 && b[2] === 255 },
      { ext: ".png", exts: [".png"], mime: "image/png", valid: b.length >= 24 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && b.subarray(12, 16).toString() === "IHDR" },
      { ext: ".webp", exts: [".webp"], mime: "image/webp", valid: b.length >= 16 && b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
      { ext: ".pdf", exts: [".pdf"], mime: "application/pdf", valid: b.subarray(0, 5).toString() === "%PDF-" }
    ];
    const type = types.find(item => item.exts.includes(ext) && item.valid && [item.mime, "application/octet-stream"].includes(mime));
    if (!type) fail(415, "upload_type"); return type;
  }
  async function media() { const list = await read(files.media, []); if (!Array.isArray(list)) fail(503, "store_invalid"); return list; }
  function mediaView(item) { const { storageName, ...view } = item; return view; }

  async function handle(req, res, pathname) {
    if (!pathname.startsWith("/api/admin/") && pathname !== "/api/cms/public" && !pathname.startsWith("/uploads/")) return false;
    try {
      await ready;
      if (pathname.startsWith("/uploads/")) {
        if (!["GET", "HEAD"].includes(req.method)) fail(405, "method_not_allowed");
        const name = pathname.slice(9); if (!/^[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/.test(name)) fail(404, "media_not_found");
        const item = (await media()).find(m => m.storageName === name); if (!item) fail(404, "media_not_found");
        const data = await fsp.readFile(path.join(mediaDir, name)).catch(() => fail(404, "media_not_found"));
        res.statusCode = 200; res.setHeader("Content-Type", item.mime); res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
        if (item.mime === "application/pdf") res.setHeader("Content-Disposition", `attachment; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent(item.filename)}`);
        res.setHeader("Content-Length", data.length); res.end(req.method === "HEAD" ? undefined : data); return true;
      }
      if (pathname === "/api/cms/public") {
        if (req.method !== "GET") fail(405, "method_not_allowed");
        const state = await content(), published = clone(state.content);
        delete published.assistant;
        published.pages = published.pages.filter(p => p.status === "published");
        published.services = published.services.filter(s => s.status !== "draft" && !state.content.pages.some(p => p.kind === "service" && p.serviceId === s.id && p.status === "draft"));
        const ids = new Set(published.services.map(s => s.id)); for (const key of Object.keys(published.serviceContent)) if (!ids.has(key)) delete published.serviceContent[key];
        const draftPages = new Set(state.content.pages.filter(p => p.status === "draft").flatMap(p => [p.id, p.slug]));
        for (const section of published.sections) {
          if (!section.enabled || section.status === "draft" || draftPages.has(section.page)) section.blocks = [];
        }
        if (state.content.pages.some(p => p.kind === "about" && p.status === "draft")) published.aboutContent = {};
        if (state.content.pages.some(p => p.kind === "home" && p.status === "draft")) {
          for (const lang of ["ru", "kg", "en"]) {
            for (const key of Object.keys(published.copy[lang])) if (/^(hero|about|stat|services|quality|equipment|process|clients|price|quote|faq|partners)\./.test(key)) delete published.copy[lang][key];
          }
        }
        json(res, 200, { content: published, revision: state.revision, updatedAt: state.updatedAt }); return true;
      }
      if (pathname === "/api/admin/session" && req.method === "GET") {
        const state = await auth(); let current; try { current = await session(req, false); } catch (error) { if (!(error instanceof CmsError) || error.status !== 401) throw error; }
        json(res, 200, current ? { authenticated: true, setupRequired: false, setupAvailable: false, csrfToken: current.item.csrfToken, user: userView(current.user) } : { authenticated: false, setupRequired: !state.users.length, setupAvailable: !state.users.length && String(process.env.CMS_SETUP_TOKEN || "").length >= 32 }); return true;
      }
      if (["/api/admin/setup", "/api/admin/login"].includes(pathname)) {
        if (req.method !== "POST") fail(405, "method_not_allowed"); origin(req); rate(req); const input = await body(req);
        const result = await mutate(async () => {
          const state = await auth(); let user;
          if (pathname.endsWith("/setup")) {
            if (state.users.length) fail(409, "setup_complete"); const setup = String(process.env.CMS_SETUP_TOKEN || "");
            if (setup.length < 32) fail(503, "setup_unavailable"); if (!equal(String(input.token || ""), setup)) fail(403, "setup_token_invalid");
            if (typeof input.username !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,79}$/.test(input.username)) fail(400, "username_invalid");
            user = { id: crypto.randomUUID(), username: input.username, passwordHash: await passwordHash(input.password), role: "admin", createdAt: new Date().toISOString() }; state.users.push(user);
          } else {
            user = state.users.find(item => String(item.username).toLowerCase() === String(input.username || "").toLowerCase());
            if (!user || !await passwordMatches(input.password, user.passwordHash)) fail(401, "invalid_credentials");
            if (user.totpSecret) { const step = totpStep(user.totpSecret, input.code, user.totpLastStep); if (step === null) fail(401, "invalid_credentials"); user.totpLastStep = step; }
          }
          const created = newSession(state, user); await atomic(files.auth, state); await audit(user.username, pathname.endsWith("/setup") ? "admin_created" : "login"); return { user, ...created };
        });
        cookie(req, res, result.value); json(res, 200, { ok: true, csrfToken: result.item.csrfToken, user: userView(result.user) }); return true;
      }
      const current = await session(req, !["GET", "HEAD"].includes(req.method));
      if (pathname === "/api/admin/logout" && req.method === "POST") {
        await mutate(async () => { const state = await auth(); state.sessions = state.sessions.filter(item => item.hash !== current.item.hash); await atomic(files.auth, state); await audit(current.user.username, "logout"); });
        cookie(req, res, "", true); json(res, 200, { ok: true }); return true;
      }
      if (pathname === "/api/admin/backups") {
        if (req.method !== "GET") fail(405, "method_not_allowed");
        const names = (await fsp.readdir(backupDir)).filter(name => /^content-\d+-\d+\.json$/.test(name)).sort().reverse();
        const backups = [];
        for (const id of names) {
          const file = path.join(backupDir, id);
          try {
            const [raw, stat] = await Promise.all([fsp.readFile(file, "utf8"), fsp.stat(file)]);
            const snapshot = JSON.parse(raw);
            if (Number.isSafeInteger(snapshot.revision) && typeof snapshot.updatedAt === "string" && object(snapshot.content)) backups.push({ id, revision: snapshot.revision, updatedAt: snapshot.updatedAt, createdAt: stat.mtime.toISOString(), size: stat.size });
          } catch { /* A concurrent save may rotate a backup between listing and reading it. */ }
        }
        json(res, 200, { backups }); return true;
      }
      const restore = pathname.match(/^\/api\/admin\/backups\/(content-\d{1,16}-\d{10,17}\.json)\/restore$/);
      if (restore) {
        if (req.method !== "POST") fail(405, "method_not_allowed");
        const input = await body(req); if (!Number.isSafeInteger(input.revision)) fail(400, "invalid_content");
        await content();
        const state = await mutate(async () => {
          const previous = await read(files.content, null); if (!previous || previous.revision !== input.revision) fail(409, "revision_conflict", { revision: previous?.revision });
          const snapshot = await read(path.join(backupDir, restore[1]), null); if (!snapshot || !object(snapshot.content)) fail(404, "backup_not_found");
          validateContent(snapshot.content);
          const next = { schemaVersion: 1, revision: previous.revision + 1, updatedAt: new Date().toISOString(), content: clone(snapshot.content) };
          await backup(previous); await atomic(files.content, next); await audit(current.user.username, "content_restored", { sourceRevision: snapshot.revision, revision: next.revision }); return next;
        });
        json(res, 200, { content: state.content, revision: state.revision, updatedAt: state.updatedAt }); return true;
      }
      if (pathname === "/api/admin/content") {
        if (req.method === "GET") { const state = await content(); json(res, 200, { content: state.content, revision: state.revision, updatedAt: state.updatedAt }); return true; }
        if (req.method !== "PUT") fail(405, "method_not_allowed"); const input = await body(req); validateContent(input.content);
        if (!Number.isSafeInteger(input.revision)) fail(400, "invalid_content"); await content();
        const state = await mutate(async () => {
          const previous = await read(files.content, null); if (!previous || previous.revision !== input.revision) fail(409, "revision_conflict", { revision: previous?.revision });
          const next = { schemaVersion: 1, revision: previous.revision + 1, updatedAt: new Date().toISOString(), content: input.content };
          await backup(previous); await atomic(files.content, next); await audit(current.user.username, "content_saved", { revision: next.revision }); return next;
        }); json(res, 200, { content: state.content, revision: state.revision, updatedAt: state.updatedAt }); return true;
      }
      if (pathname === "/api/admin/password" && req.method === "POST") {
        const input = await body(req), encoded = await passwordHash(input.newPassword);
        await mutate(async () => { const state = await auth(), user = state.users.find(u => u.id === current.user.id); if (!user || !await passwordMatches(input.currentPassword, user.passwordHash)) fail(401, "invalid_credentials"); user.passwordHash = encoded; state.sessions = []; await atomic(files.auth, state); await audit(user.username, "password_changed"); });
        cookie(req, res, "", true); json(res, 200, { ok: true }); return true;
      }
      if (pathname === "/api/admin/totp/status" && req.method === "GET") { json(res, 200, { enabled: !!current.user.totpSecret }); return true; }
      if (pathname.startsWith("/api/admin/totp/") && req.method === "POST") {
        const input = await body(req);
        const answer = await mutate(async () => {
          const state = await auth(), user = state.users.find(u => u.id === current.user.id); if (!user) fail(401, "unauthorized");
          if (pathname.endsWith("/setup")) {
            if (!await passwordMatches(input.currentPassword, user.passwordHash)) fail(401, "invalid_credentials");
            user.totpPending = { secret: base32(crypto.randomBytes(20)), at: Date.now() }; await atomic(files.auth, state);
            return { secret: user.totpPending.secret, otpauthUrl: `otpauth://totp/${encodeURIComponent("SAEL:" + user.username)}?secret=${user.totpPending.secret}&issuer=SAEL&algorithm=SHA1&digits=6&period=30` };
          }
          if (pathname.endsWith("/enable")) {
            if (!user.totpPending || Date.now() - user.totpPending.at > 600000) fail(400, "totp_pending");
            const step = totpStep(user.totpPending.secret, input.code); if (step === null) fail(400, "totp_invalid");
            user.totpSecret = user.totpPending.secret; user.totpLastStep = step; delete user.totpPending;
          } else if (pathname.endsWith("/disable")) {
            if (!await passwordMatches(input.currentPassword, user.passwordHash)) fail(401, "invalid_credentials");
            if (!user.totpSecret || totpStep(user.totpSecret, input.code, user.totpLastStep) === null) fail(400, "totp_invalid");
            delete user.totpSecret; delete user.totpLastStep; delete user.totpPending;
          } else fail(404, "not_found");
          state.sessions = state.sessions.filter(s => s.hash === current.item.hash); await atomic(files.auth, state); await audit(user.username, "totp_changed", { enabled: !!user.totpSecret }); return { ok: true, enabled: !!user.totpSecret };
        }); json(res, 200, answer); return true;
      }
      if (pathname === "/api/admin/media") {
        if (req.method === "GET") { json(res, 200, { media: (await media()).map(mediaView) }); return true; }
        if (req.method !== "POST") fail(405, "method_not_allowed");
        const upload = await parseUpload(req), type = uploadType(upload), id = crypto.randomUUID(), storageName = id + type.ext;
        const record = { id, storageName, url: "/uploads/" + storageName, filename: upload.filename, mime: type.mime, size: upload.content.length, alt: "", createdAt: new Date().toISOString() };
        await mutate(async () => {
          const list = await media(), limit = Math.max(10, Math.min(Number(process.env.CMS_MEDIA_LIMIT_MB) || 512, 10240)) * 1024 * 1024;
          if (list.length >= 5000 || list.reduce((sum, item) => sum + item.size, 0) + record.size > limit) fail(413, "media_storage_full");
          await fsp.writeFile(path.join(mediaDir, storageName), upload.content, { flag: "wx", mode: 0o600 }); list.push(record); await atomic(files.media, list); await audit(current.user.username, "media_uploaded", { id, size: record.size });
        }); json(res, 201, { media: mediaView(record) }); return true;
      }
      const match = pathname.match(/^\/api\/admin\/media\/([a-f0-9-]{36})$/);
      if (match) {
        if (!["PATCH", "DELETE"].includes(req.method)) fail(405, "method_not_allowed"); const input = req.method === "PATCH" ? await body(req) : null;
        if (req.method === "DELETE") await content();
        if (input) { if (input.alt !== undefined) { if (typeof input.alt === "string") checkText(input.alt); else if (object(input.alt)) { for (const lang of ["ru", "kg", "en"]) { if (typeof input.alt[lang] !== "string") fail(400, "invalid_content"); checkText(input.alt[lang]); } } else fail(400, "invalid_content"); } }
        const record = await mutate(async () => {
          const list = await media(), index = list.findIndex(item => item.id === match[1]); if (index < 0) fail(404, "media_not_found"); const item = list[index];
          if (req.method === "PATCH") { if (input.alt !== undefined) item.alt = input.alt; if (input.filename !== undefined) item.filename = safeName(input.filename); await atomic(files.media, list); await audit(current.user.username, "media_updated", { id: item.id }); return item; }
          const state = await read(files.content, null); if (!state || JSON.stringify(state.content).includes(item.url)) fail(409, "media_in_use");
          list.splice(index, 1); await atomic(files.media, list); await fsp.unlink(path.join(mediaDir, item.storageName)).catch(error => { if (error.code !== "ENOENT") console.error("cms_media_cleanup_failed"); }); await audit(current.user.username, "media_deleted", { id: item.id }); return null;
        }); json(res, 200, record ? { media: mediaView(record) } : { ok: true }); return true;
      }
      fail(404, "not_found");
    } catch (error) {
      if (res.writableEnded || res.destroyed) return true;
      if (error instanceof CmsError) { if (error.status === 429) res.setHeader("Retry-After", "900"); json(res, error.status, { error: error.code, message: MESSAGES[error.code] || error.code, ...error.extra }); }
      else { console.error("cms_operation_failed", error.code || error.name, error.syscall || ""); json(res, 500, { error: "store_invalid", message: MESSAGES.store_invalid }); }
      return true;
    }
  }
  return { handle, dataDir, ready, getContent: content, validateContent, authorizeAdmin:async(req,write)=>userView((await session(req,!!write)).user) };
}

module.exports = { createCms, validateContent, passwordHash, passwordMatches, CmsError };
