"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { PassThrough } = require("node:stream");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { createCms, validateContent } = require("../cms-server");

function translated(value) { return { ru: value, kg: value, en: value }; }
function seed() {
  return {
    schemaVersion: 1, settings: { siteName: "SAEL" }, copy: translated({ "hero.title": "Test<br><em>SAEL</em>" }),
    services: [{ id: "public-service", status: "published", name: translated("Published") }, { id: "draft-service", status: "draft", name: translated("Do not expose") }],
    priceEntries: [], categories: translated({}), priceTranslations: {},
    serviceContent: { "public-service": { ru: { lead: "Public" } }, "draft-service": { ru: { lead: "Hidden draft body" } } },
    aboutContent: {}, processSteps: translated([]), clientSteps: translated([]), faqs: translated([]),
    pages: [{ id: "home", slug: "home", kind: "home", status: "published", title: translated("Home"), blocks: [] }, { id: "private-page", slug: "private-page", kind: "custom", status: "draft", title: translated("Private"), blocks: [{ id: "private-block", type: "text", text: translated("Draft page body") }] }],
    menus: { header: [{ id: "home-link", label: translated("Home"), url: "/", target: "_self" }], footer: [] },
    sections: [{ id: "hero", page: "home", targetId: "hero", enabled: true, title: "Hero", blocks: [] }],
    documents: [], partners: [], equipment: [], images: []
  };
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
async function readAsset(file) {
  const root = path.join(__dirname, "..");
  try { return await fs.readFile(path.join(root, "assets", file)); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    return fs.readFile(path.join(root, "public", "assets", file));
  }
}
function totp(secret, shift = 0) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let acc = 0, bits = 0; const bytes = [];
  for (const char of secret) { acc = (acc << 5) | alphabet.indexOf(char); bits += 5; if (bits >= 8) { bits -= 8; bytes.push((acc >>> bits) & 255); } }
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + shift));
  const digest = crypto.createHmac("sha1", Buffer.from(bytes)).update(counter).digest(), offset = digest[19] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, "0");
}
async function fixture(t) {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "sael-cms-test-"));
  const previous = { CMS_DATA_DIR: process.env.CMS_DATA_DIR, CMS_SETUP_TOKEN: process.env.CMS_SETUP_TOKEN, PUBLIC_ORIGIN: process.env.PUBLIC_ORIGIN, CMS_PUBLIC_ORIGIN: process.env.CMS_PUBLIC_ORIGIN, NODE_ENV: process.env.NODE_ENV };
  process.env.CMS_DATA_DIR = path.join(folder, "private"); process.env.CMS_SETUP_TOKEN = "test-bootstrap-code-" + "x".repeat(32); delete process.env.PUBLIC_ORIGIN; delete process.env.CMS_PUBLIC_ORIGIN; delete process.env.NODE_ENV;
  const cms = createCms({ root: folder, publicRoot: path.join(folder, "public"), seed: seed() });
  const origin = "http://127.0.0.1:8020";
  t.after(async () => { assert(path.resolve(folder).startsWith(path.join(path.resolve(os.tmpdir()), "sael-cms-test-"))); await fs.rm(folder, { recursive: true, force: true }); for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  const state = { cookie: "", csrf: "", origin, cms, folder };
  state.request = async (url, method = "GET", data, extra = {}) => {
    const headers = { Origin: origin, ...(state.cookie ? { Cookie: state.cookie } : {}), ...(state.csrf ? { "X-CSRF-Token": state.csrf } : {}), ...extra };
    let body;
    if (data !== undefined) { if (data instanceof FormData) body = data; else { body = JSON.stringify(data); headers["Content-Type"] = "application/json"; } }
    const encoded = new Request(origin + url, { method, headers, body });
    const buffer = Buffer.from(await encoded.arrayBuffer()), request = new PassThrough();
    request.method = method; request.url = url; request.headers = Object.fromEntries(encoded.headers); request.headers.host = "127.0.0.1:8020"; request.socket = { remoteAddress: "127.0.0.1" };
    const response = { statusCode: 200, headers: new Headers(), writableEnded: false, destroyed: false, setHeader(key, value) { this.headers.set(key, value); }, end(value) { this.body = Buffer.isBuffer(value) ? value : Buffer.from(value || ""); this.writableEnded = true; } };
    queueMicrotask(() => request.end(buffer));
    if (!await cms.handle(request, response, new URL(url, origin).pathname)) { response.statusCode = 404; response.end(); }
    const text = response.body.toString(); let json; try { json = JSON.parse(text); } catch {}
    return { status: response.statusCode, headers: response.headers, text, json };
  };
  state.loginResponse = response => { state.cookie = response.headers.get("set-cookie").split(";")[0]; state.csrf = response.json.csrfToken; };
  return state;
}

test("content schema rejects executable HTML, dangerous protocols, prototype keys and duplicate slugs", () => {
  assert.doesNotThrow(() => validateContent(seed()));
  for (const html of ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "<img src=x onerror=alert(1)", '<a href="jav&#x61;script:alert(1)">bad</a>', '<a href="java&Tab;script:alert(1)">bad</a>', '<span style="background:url(x)">bad</span>']) {
    const data = seed(); data.copy.ru.bad = html; assert.throws(() => validateContent(data), /invalid_content/);
  }
  const polluted = JSON.parse(JSON.stringify(seed()).replace('"siteName":"SAEL"', '"siteName":"SAEL","__proto__":{"admin":true}'));
  assert.throws(() => validateContent(polluted), /invalid_content/);
  const duplicate = seed(); duplicate.pages[1].slug = "home"; assert.throws(() => validateContent(duplicate), /invalid_content/);
  const script = seed(); script.menus.header[0].url = "javascript:alert(1)"; assert.throws(() => validateContent(script), /invalid_content/);
  const asset = seed(); asset.images.push({ id: "bad-image", src: "mailto:test@example.test" }); assert.throws(() => validateContent(asset), /invalid_content/);
});

test("bootstrap, hashed sessions, CSRF, revision conflict, persistence, media and two-factor authentication", async t => {
  const f = await fixture(t), password = "This-is-test-Password-42";
  let response = await f.request("/api/admin/session"); assert.equal(response.json.setupRequired, true); assert.equal(response.json.setupAvailable, true);
  response = await f.request("/api/admin/content"); assert.equal(response.status, 401);
  response = await f.request("/api/admin/setup", "POST", { token: "wrong", username: "admin", password }); assert.equal(response.status, 403);
  response = await f.request("/api/admin/setup", "POST", { token: process.env.CMS_SETUP_TOKEN, username: "admin", password }); assert.equal(response.status, 200); f.loginResponse(response);
  assert.match(response.headers.get("set-cookie"), /HttpOnly; SameSite=Strict/); assert.doesNotMatch(response.headers.get("set-cookie"), /; Secure/);
  response = await f.request("/api/admin/setup", "POST", { token: process.env.CMS_SETUP_TOKEN, username: "again", password }); assert.equal(response.status, 409);
  const stored = await fs.readFile(path.join(f.cms.dataDir, "auth.json"), "utf8"); assert(!stored.includes(password)); assert(!stored.includes(f.cookie.split("=")[1]));
  response = await f.request("/api/cms/public"); assert.equal(response.status, 200); assert.equal(response.json.content.pages.length, 1); assert.equal(response.json.content.services.length, 1); assert(!response.text.includes("Hidden draft body")); assert(!response.text.includes("Draft page body"));
  let snapshot = (await f.request("/api/admin/content")).json; const revision = snapshot.revision; snapshot.content.copy.ru["hero.title"] = "Edited";
  response = await f.request("/api/admin/content", "PUT", snapshot, { "X-CSRF-Token": "wrong" }); assert.equal(response.status, 403);
  response = await f.request("/api/admin/content", "PUT", snapshot, { Origin: "https://evil.example" }); assert.equal(response.status, 403);
  response = await f.request("/api/admin/content", "PUT", snapshot); assert.equal(response.status, 200); assert.equal(response.json.revision, revision + 1); snapshot = response.json;
  response = await f.request("/api/admin/content", "PUT", { content: snapshot.content, revision }); assert.equal(response.status, 409); assert.equal(response.json.error, "revision_conflict");
  const fresh = createCms({ root: f.folder, publicRoot: path.join(f.folder, "public"), seed: seed() }); assert.equal((await fresh.getContent()).content.copy.ru["hero.title"], "Edited"); assert((await fs.readdir(path.join(f.cms.dataDir, "backups"))).length > 0);
  const bad = new FormData(); bad.set("file", new Blob(["<html>unsafe</html>"], { type: "image/png" }), "fake.png"); response = await f.request("/api/admin/media", "POST", bad); assert.equal(response.status, 415);
  const upload = new FormData(), png = await readAsset("sael-logo-mark.png"); upload.set("file", new Blob([png], { type: "image/png" }), "company.png");
  response = await f.request("/api/admin/media", "POST", upload); assert.equal(response.status, 201); const media = response.json.media; assert.match(media.url, /^\/uploads\/[a-f0-9-]+\.png$/); assert(!response.text.includes("storageName"));
  response = await f.request(media.url); assert.equal(response.status, 200); assert.equal(response.headers.get("content-type"), "image/png");
  snapshot.content.images.push({ id: "new-image", src: media.url, alt: translated("Logo") }); response = await f.request("/api/admin/content", "PUT", snapshot); assert.equal(response.status, 200); snapshot = response.json;
  response = await f.request("/api/admin/media/" + media.id, "DELETE"); assert.equal(response.status, 409); assert.equal(response.json.error, "media_in_use");
  snapshot.content.images = []; response = await f.request("/api/admin/content", "PUT", snapshot); assert.equal(response.status, 200); snapshot = response.json;
  response = await f.request("/api/admin/media/" + media.id, "PATCH", { alt: translated("Updated logo") }); assert.equal(response.status, 200); assert.equal(response.json.media.alt.ru, "Updated logo");
  response = await f.request("/api/admin/media/" + media.id, "DELETE"); assert.equal(response.status, 200); assert.equal((await f.request(media.url)).status, 404);
  response = await f.request("/uploads/../../auth.json"); assert.equal(response.status, 404);
  response = await f.request("/api/admin/totp/setup", "POST", { currentPassword: password }); assert.equal(response.status, 200); const secret = response.json.secret; assert.match(response.json.otpauthUrl, /^otpauth:\/\/totp\//);
  response = await f.request("/api/admin/totp/enable", "POST", { code: totp(secret, -1) }); assert.equal(response.status, 200);
  response = await f.request("/api/admin/login", "POST", { username: "admin", password }); assert.equal(response.status, 401);
  response = await f.request("/api/admin/login", "POST", { username: "admin", password, code: totp(secret) }); assert.equal(response.status, 200);
  response = await f.request("/api/admin/login", "POST", { username: "admin", password, code: totp(secret) }); assert.equal(response.status, 401);
  response = await f.request("/api/admin/totp/disable", "POST", { currentPassword: password, code: totp(secret, 1) }); assert.equal(response.status, 200); assert.equal(response.json.enabled, false);
  response = await f.request("/api/admin/password", "POST", { currentPassword: password, newPassword: "Second-test-Password-456" }); assert.equal(response.status, 200);
  response = await f.request("/api/admin/content"); assert.equal(response.status, 401);
  response = await f.request("/api/admin/login", "POST", { username: "admin", password: "Second-test-Password-456" }); assert.equal(response.status, 200); f.loginResponse(response);
  const audit = await fs.readFile(path.join(f.cms.dataDir, "audit.jsonl"), "utf8"); assert(!audit.includes(password)); assert(!audit.includes(secret)); assert(audit.includes("content_saved"));
  response = await f.request("/api/admin/logout", "POST", {}); assert.equal(response.status, 200); assert.equal((await f.request("/api/admin/content")).status, 401);
});

test("setup disabled without bootstrap secret and auth requests rate-limited", async t => {
  const f = await fixture(t); delete process.env.CMS_SETUP_TOKEN;
  let response = await f.request("/api/admin/session"); assert.equal(response.json.setupAvailable, false);
  response = await f.request("/api/admin/setup", "POST", { token: "x", username: "admin", password: "test-password-with-length" }); assert.equal(response.status, 503);
  for (let i = 0; i < 9; i++) { response = await f.request("/api/admin/login", "POST", { username: "admin", password: "invalid" }); assert.equal(response.status, 401); }
  response = await f.request("/api/admin/login", "POST", { username: "admin", password: "invalid" }); assert.equal(response.status, 429); assert.equal(response.headers.get("retry-after"), "900");
});

test("simultaneous stale writes produce one save and one conflict", async t => {
  const f = await fixture(t); let response = await f.request("/api/admin/setup", "POST", { token: process.env.CMS_SETUP_TOKEN, username: "admin", password: "This-is-test-Password-42" }); f.loginResponse(response);
  const snapshot = (await f.request("/api/admin/content")).json, one = clone(snapshot), two = clone(snapshot); one.content.settings.siteName = "One"; two.content.settings.siteName = "Two";
  const results = await Promise.all([f.request("/api/admin/content", "PUT", one), f.request("/api/admin/content", "PUT", two)]); assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
});

test("draft about/home bodies and unpublished section blocks are excluded from public response", async t => {
  const f = await fixture(t); f.loginResponse(await f.request("/api/admin/setup", "POST", { token: process.env.CMS_SETUP_TOKEN, username: "admin", password: "This-is-test-Password-42" }));
  const snapshot = (await f.request("/api/admin/content")).json;
  snapshot.content.pages[0].status = "draft";
  snapshot.content.pages.push({ id: "about", slug: "about", kind: "about", status: "draft", title: translated("Private company title"), blocks: [] });
  snapshot.content.aboutContent = { ru: { lead: "Private company body" } };
  snapshot.content.copy.ru["hero.title"] = "Private hero body";
  snapshot.content.sections[0].blocks = [{ id: "secret", type: "text", text: translated("Private home section") }];
  snapshot.content.sections.push({ id: "disabled", page: "home", enabled: false, blocks: [{ id: "hidden", type: "text", text: translated("Private disabled section") }] });
  assert.equal((await f.request("/api/admin/content", "PUT", snapshot)).status, 200);
  const response = await f.request("/api/cms/public"); assert.equal(response.status, 200);
  for (const text of ["Private company title", "Private company body", "Private hero body", "Private home section", "Private disabled section"]) assert(!response.text.includes(text), text);
});

test("production requires HTTPS configuration and emits Secure cookie for configured public HTTPS origin", async t => {
  const f = await fixture(t); process.env.NODE_ENV = "production";
  const setup = { token: process.env.CMS_SETUP_TOKEN, username: "admin", password: "This-is-test-Password-42" };
  assert.equal((await f.request("/api/admin/setup", "POST", setup)).status, 426);
  process.env.PUBLIC_ORIGIN = "https://admin.example.test";
  assert.equal((await f.request("/api/admin/setup", "POST", setup)).status, 403);
  const response = await f.request("/api/admin/setup", "POST", setup, { Origin: "https://admin.example.test" });
  assert.equal(response.status, 200); assert.match(response.headers.get("set-cookie"), /; Secure/);
});

test("backups restore deleted pages with CSRF, conflict checks and a new revision", async t => {
  const f = await fixture(t); f.loginResponse(await f.request("/api/admin/setup", "POST", { token: process.env.CMS_SETUP_TOKEN, username: "admin", password: "This-is-test-Password-42" }));
  let snapshot = (await f.request("/api/admin/content")).json;
  snapshot.content.pages.push({ id: "recover-page", slug: "recover-page", kind: "custom", status: "published", title: translated("Recover this page"), blocks: [] });
  let response = await f.request("/api/admin/content", "PUT", snapshot); assert.equal(response.status, 200); snapshot = response.json;
  const recoveryRevision = snapshot.revision;
  snapshot.content.pages = snapshot.content.pages.filter(page => page.id !== "recover-page"); response = await f.request("/api/admin/content", "PUT", snapshot); assert.equal(response.status, 200); snapshot = response.json;
  const deletedRevision = snapshot.revision;
  const backups = (await f.request("/api/admin/backups")).json.backups, chosen = backups.find(item => item.revision === recoveryRevision); assert(chosen); assert(chosen.size > 0); assert(!Object.hasOwn(chosen, "content"));
  const url = "/api/admin/backups/" + chosen.id + "/restore";
  response = await f.request(url, "POST", { revision: deletedRevision }, { "X-CSRF-Token": "invalid" }); assert.equal(response.status, 403);
  response = await f.request(url, "POST", { revision: recoveryRevision }); assert.equal(response.status, 409);
  response = await f.request(url, "POST", { revision: deletedRevision }); assert.equal(response.status, 200); assert.equal(response.json.revision, deletedRevision + 1); assert(response.json.content.pages.some(page => page.id === "recover-page")); snapshot = response.json;
  assert((await f.request("/api/admin/backups")).json.backups.some(item => item.revision === deletedRevision));
  assert.equal((await f.request("/api/admin/backups/content-0000000001-1234567890123.json/restore", "POST", { revision: snapshot.revision })).status, 404);
  assert.equal((await f.request("/api/admin/backups/../../auth.json/restore", "POST", { revision: snapshot.revision })).status, 404);
  for (let i = 0; i < 12; i++) { snapshot.content.settings.siteName = "Revision " + i; response = await f.request("/api/admin/content", "PUT", snapshot); assert.equal(response.status, 200); snapshot = response.json; }
  assert.equal((await f.request("/api/admin/backups")).json.backups.length, 10);
  assert((await fs.readFile(path.join(f.cms.dataDir, "audit.jsonl"), "utf8")).includes("content_restored"));
});

test("a transient file lock retries atomic replacement without deleting saved content",async t=>{
 const state=await fixture(t),rename=fs.rename.bind(fs);let blocked=0;
 t.mock.method(fs,"rename",async(...args)=>{if(blocked<2){blocked++;const error=new Error("simulated temporary scanner lock");error.code="EPERM";throw error;}return rename(...args);});
 const initial=await state.cms.getContent();assert.equal(initial.revision,1);assert.equal(blocked,2);
 const disk=JSON.parse(await fs.readFile(path.join(state.folder,"private","content.json"),"utf8"));assert.equal(disk.revision,1);assert.equal(disk.content.schemaVersion,1);
});

