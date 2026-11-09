"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs/promises"), path = require("node:path"), os = require("node:os"), { PassThrough } = require("node:stream");
const { createAssistant, normalizeHours, workingHours } = require("../assistant-server");

function content() { return { settings: { phone: "+996313331925", email: "lab@example.test" }, assistant: { enabled: true, title: { ru: "Помощник", kg: "Жардамчы", en: "Assistant" }, welcome: { ru: "Я ИИ-помощник SAEL", kg: "ИИ жардамчы", en: "I am SAEL AI" }, hours: { timezone: "Asia/Bishkek", weekdays: [1, 2, 3, 4, 5], start: "08:00", end: "17:00" }, instructions: "PRIVATE INSTRUCTIONS", knowledge: [{ id: "secret", status: "draft", text: { ru: "PRIVATE DRAFT KNOWLEDGE" } }] } }; }
async function fixture(t, extra = {}) {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "sael-assistant-test-")), old = { CMS_DATA_DIR: process.env.CMS_DATA_DIR, PUBLIC_ORIGIN: process.env.PUBLIC_ORIGIN, CMS_PUBLIC_ORIGIN: process.env.CMS_PUBLIC_ORIGIN };
  process.env.CMS_DATA_DIR = folder; delete process.env.PUBLIC_ORIGIN; delete process.env.CMS_PUBLIC_ORIGIN;
  let clock = Date.parse("2026-11-09T04:00:00Z"); const notifications = [], calls = [], data = content();
  const options = { root: folder, getContent: async () => ({ content: data }), now: () => clock, aiConfigured: () => true,
    authorizeAdmin: async (req, write) => { if (req.headers.authorization !== "Bearer test-admin") throw Object.assign(new Error("unauthorized"), { status: 401, code: "unauthorized" }); if (write && req.headers["x-csrf-token"] !== "test-csrf") throw Object.assign(new Error("csrf_invalid"), { status: 403, code: "csrf_invalid" }); return { id: req.headers["x-staff-id"] || "staff-1", username: "private-admin@example.test", role: "admin" }; },
    answer: async input => { calls.push(input); return { text: "Ответ на основе знаний", sources: [{ id: "service", title: "Услуга", url: "/service.html?service=preparation" }, { id: "evil", title: "Bad", url: "javascript:alert(1)" }], mode: "ai", role: "staff" }; },
    notify: async input => { notifications.push(input); return { sent: true }; }, ...extra };
  const assistant = createAssistant(options), instances = [assistant];
  const api = { assistant, data, notifications, calls, options, setTime: value => { clock = typeof value === "number" ? value : Date.parse(value); }, advance: ms => { clock += ms; }, restart() { const next = createAssistant(options); instances.push(next); return next; } };
  api.request = async (url, method = "GET", input, headers = {}, selected = assistant) => {
    const request = new PassThrough(); request.method = method; request.url = url; request.socket = { remoteAddress: "127.0.0.1" }; request.headers = { host: "127.0.0.1:8020", origin: "http://127.0.0.1:8020", ...headers };
    const bytes = input === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(input)); if (input !== undefined) request.headers["content-type"] = "application/json";
    const response = { statusCode: 200, headers: new Headers(), writableEnded: false, destroyed: false, setHeader(k, v) { this.headers.set(k, v); }, end(v) { this.body = Buffer.isBuffer(v) ? v : Buffer.from(v || ""); this.writableEnded = true; } };
    queueMicrotask(() => request.end(bytes));
    const handled = await selected.handle(request, response, new URL(url, "http://local").pathname); if (!handled) { response.statusCode = 404; response.end(); }
    const text = response.body.toString(); let json; try { json = JSON.parse(text); } catch {}
    return { status: response.statusCode, json, text, headers: response.headers };
  };
  api.create = async (locale = "ru") => { const response = await api.request("/api/assistant/conversations", "POST", { locale, consent: true }); assert.equal(response.status, 201); return { ...response.json, headers: { "x-chat-token": response.json.token } }; };
  api.admin = { authorization: "Bearer test-admin", "x-csrf-token": "test-csrf" };
  t.after(async () => { instances.forEach(instance => instance.close()); await Promise.all(instances.map(instance => instance.ready)); await new Promise(resolve => setTimeout(resolve, 30)); assert(path.resolve(folder).startsWith(path.join(path.resolve(os.tmpdir()), "sael-assistant-test-"))); await fs.rm(folder, { recursive: true, force: true }); for (const [key, value] of Object.entries(old)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  return api;
}

test("working hours use Bishkek weekdays and exclude evening and weekend", () => {
  const hours = normalizeHours({ timezone: "Asia/Bishkek", weekdays: [1, 2, 3, 4, 5], start: "08:00", end: "17:00" });
  assert(workingHours(hours, new Date("2026-11-09T02:00:00Z"))); // Monday 08:00
  assert(!workingHours(hours, new Date("2026-11-09T11:00:00Z"))); // Monday 17:00
  assert(!workingHours(hours, new Date("2026-11-08T04:00:00Z"))); // Sunday 10:00
  assert.equal(normalizeHours({ timezone: "invalid" }).timezone, "Asia/Bishkek");
});

test("private visitor tokens, consent, model identity and persistence", async t => {
  const f = await fixture(t);
  let response = await f.request("/api/assistant/config"); assert.equal(response.status, 200); assert.equal(response.json.isWorkingHours, true); assert.equal(response.json.staffOnline, false); assert.equal(response.json.aiConfigured, true); assert(!response.text.includes("PRIVATE"));
  response = await f.request("/api/assistant/conversations", "GET"); assert.equal(response.status, 405);
  response = await f.request("/api/assistant/conversations", "POST", { locale: "ru" }); assert.equal(response.status, 400);
  const one = await f.create(), two = await f.create("en"), base = "/api/assistant/conversations/" + one.id;
  assert.equal((await f.request(base)).status, 404); assert.equal((await f.request(base, "GET", undefined, two.headers)).status, 404);
  assert.equal((await f.request(base + "?token=" + one.token)).status, 404);
  response = await f.request(base + "/messages", "POST", { text: "Как подготовить образцы?" }, one.headers); assert.equal(response.status, 200);
  const answer = response.json.conversation.messages.at(-1); assert.equal(answer.actor, "assistant"); assert.equal(answer.role, "assistant"); assert.equal(answer.sources.length, 1); assert.equal(f.calls.length, 1); assert.equal(f.notifications.length, 0); assert(!response.text.includes("private-admin"));
  const raw = await fs.readFile(path.join(f.assistant.dataDir, "conversations.json"), "utf8"); assert(!raw.includes(one.token)); assert(!raw.includes(two.token));
  const restarted = f.restart(); response = await f.request(base, "GET", undefined, one.headers, restarted); assert.equal(response.status, 200); assert.equal(response.json.conversation.messages.at(-1).text, "Ответ на основе знаний");
  response = await f.request(base + "/messages", "POST", { text: "x".repeat(1501) }, one.headers); assert.equal(response.status, 400);
  response = await f.request(base + "/close", "POST", {}, one.headers); assert.equal(response.status, 200); assert.equal(response.json.conversation.status, "closed");
  assert.equal((await f.request(base + "/messages", "POST", { text: "after close" }, one.headers)).status, 409);
});

test("live invitations require office hours, presence, consent and explicit staff claim", async t => {
  const f = await fixture(t), one = await f.create(), base = "/api/assistant/conversations/" + one.id, staff = "/api/admin/assistant/conversations/" + one.id;
  assert.equal((await f.request("/api/admin/assistant/conversations")).status, 401);
  assert.equal((await f.request("/api/admin/assistant/presence", "POST", { online: true }, { authorization: "Bearer test-admin" })).status, 403);
  let response = await f.request("/api/admin/assistant/presence", "POST", { online: true }, f.admin); assert.equal(response.json.available, true);
  response = await f.request(base + "/handoff", "POST", { name: "Visitor", email: "visitor@example.test" }, one.headers); assert.equal(response.status, 400); assert.equal(f.notifications.length, 0);
  response = await f.request(base + "/handoff", "POST", { name: "Visitor", email: "visitor@example.test", consent: true }, one.headers); assert.equal(response.status, 200); assert.equal(response.json.conversation.status, "waiting"); assert.equal(response.json.notificationSent, true); assert.equal(f.notifications.length, 1);
  response = await f.request(base + "/messages", "POST", { text: "Жду специалиста" }, one.headers); assert.equal(response.status, 200); assert.equal(f.calls.length, 0);
  assert.equal((await f.request(staff + "/messages", "POST", { text: "Ответ" }, f.admin)).status, 409);
  response = await f.request(staff + "/claim", "POST", {}, f.admin); assert.equal(response.status, 200); assert.equal(response.json.conversation.status, "active");
  assert.equal((await f.request(staff + "/claim", "POST", {}, { ...f.admin, "x-staff-id": "staff-2" })).status, 409);
  response = await f.request(staff + "/messages", "POST", { text: "Здравствуйте, я специалист SAEL" }, f.admin); assert.equal(response.status, 200);
  response = await f.request(base, "GET", undefined, one.headers); assert.equal(response.json.conversation.messages.at(-1).actor, "staff"); assert(!response.text.includes("private-admin@example.test")); assert(!response.text.includes("staff-1"));
  f.advance(76000); response = await f.request("/api/assistant/config"); assert.equal(response.json.staffOnline, false);
  response = await f.request(base, "GET", undefined, one.headers); assert.equal(response.json.conversation.callbackSuggested, true); assert.equal(response.json.conversation.staffConnected, false);
  assert.equal((await f.request(staff + "/messages", "POST", { text: "Offline answer" }, f.admin)).status, 409);
  response = await f.request(staff + "/close", "POST", {}, f.admin); assert.equal(response.json.conversation.status, "closed");
});

test("closed-hour requests save callbacks accurately and notifications are consent-scoped", async t => {
  const f = await fixture(t, { notify: async () => ({ sent: false }) }); f.setTime("2026-11-08T04:00:00Z");
  await f.request("/api/admin/assistant/presence", "POST", { online: true }, f.admin);
  const one = await f.create(), base = "/api/assistant/conversations/" + one.id;
  let response = await f.request("/api/assistant/config"); assert.equal(response.json.isWorkingHours, false); assert.equal(response.json.staffOnline, false);
  response = await f.request(base + "/handoff", "POST", { name: "Visitor", consent: true }, one.headers); assert.equal(response.status, 400); assert.equal(response.json.error, "contact_required");
  response = await f.request(base + "/handoff", "POST", { name: "Visitor", phone: "+996555123456", consent: true }, one.headers); assert.equal(response.status, 200); assert.equal(response.json.notificationSent, false); assert.equal(response.json.conversation.status, "callback"); assert.equal(response.json.conversation.callbackSuggested, true);
  response = await f.request("/api/admin/assistant/conversations", "GET", undefined, f.admin); assert.equal(response.json.conversations[0].contact.phone, "+996555123456"); assert(!Object.hasOwn(response.json.conversations[0], "messages"));
  response = await f.request("/api/admin/assistant/conversations/" + one.id + "/claim", "POST", {}, f.admin); assert.equal(response.status, 200); assert.equal(response.json.conversation.status, "active");
  response = await f.request("/api/admin/assistant/conversations/" + one.id + "/messages", "POST", { text: "Специалист ответил вне рабочего времени" }, f.admin); assert.equal(response.status, 200);
  response = await f.request(base, "GET", undefined, one.headers); assert.equal(response.json.conversation.messages.at(-1).actor, "staff"); assert.equal(response.json.conversation.staffConnected, true);
  response = await f.request("/api/assistant/config"); assert.equal(response.json.staffOnline, false); assert.equal(response.json.isWorkingHours, false); assert(!response.text.includes("staff-1"));
});

test("an explicit handoff wins over a model response already in progress", async t => {
  let resolveAnswer, started; const beginning = new Promise(resolve => { started = resolve; });
  const f = await fixture(t, { answer: async () => { started(); return new Promise(resolve => { resolveAnswer = resolve; }); } });
  const one = await f.create(), base = "/api/assistant/conversations/" + one.id;
  await f.request("/api/admin/assistant/presence", "POST", { online: true }, f.admin);
  const answer = f.request(base + "/messages", "POST", { text: "Question", clientMessageId: "msg-1" }, one.headers); await beginning;
  let response = await f.request(base + "/messages", "POST", { text: "Question", clientMessageId: "msg-1" }, one.headers); assert.equal(response.status, 200); assert.equal(response.json.conversation.messages.filter(item => item.actor === "user").length, 1);
  response = await f.request(base + "/handoff", "POST", { name: "Visitor", email: "visitor@example.test", consent: true }, one.headers); assert.equal(response.json.conversation.status, "waiting");
  resolveAnswer({ text: "This late AI response must not appear", mode: "ai" }); response = await answer; assert.equal(response.status, 200); assert.equal(response.json.conversation.status, "waiting"); assert(!response.text.includes("This late AI response"));
});

test("rate limits, retention and failure fallback remain honest", async t => {
  const f = await fixture(t, { answer: async () => { throw new Error("PRIVATE PROVIDER SECRET"); } }), one = await f.create(), base = "/api/assistant/conversations/" + one.id;
  let response = await f.request(base + "/messages", "POST", { text: "Question" }, one.headers); assert.equal(response.status, 200); assert.equal(response.json.conversation.mode, "unavailable"); assert.equal(response.json.conversation.needsHuman, true); assert(!response.text.includes("PRIVATE"));
  for (let i = 0; i < 11; i++) assert.equal((await f.request(base + "/messages", "POST", { text: "Question " + i }, one.headers)).status, 200);
  response = await f.request(base + "/messages", "POST", { text: "Too many" }, one.headers); assert.equal(response.status, 429);
  f.advance(31 * 86400000); response = await f.request(base, "GET", undefined, one.headers); assert.equal(response.status, 404);
  const raw = await fs.readFile(path.join(f.assistant.dataDir, "conversations.json"), "utf8"); assert(!raw.includes(one.id));
});

test("an abandoned partial lock from a crashed process is recovered", async t => {
  const f = await fixture(t), one = await f.create(), lock = path.join(f.assistant.dataDir, ".write-lock");
  await fs.writeFile(lock, "{partial"); const old = new Date(Date.now() - 180000); await fs.utimes(lock, old, old);
  const response = await f.request("/api/assistant/conversations/" + one.id + "/messages", "POST", { text: "Recovery check" }, one.headers); assert.equal(response.status, 200);
});
