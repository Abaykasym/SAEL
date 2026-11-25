"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { setTimeout: delay } = require("node:timers/promises");
const { createQuoteStore, quoteParameters, formatQuantity } = require("../quote-requests");
const seed = require("../cms-seed.json");

const first = seed.priceEntries[0];
const second = seed.priceEntries[1];
const line = { id: first.id, quantity: 12, unit: "sample" };

test("quote selection uses the published catalogue, bounded quantities, units and valid dates", () => {
  const selected = items => quoteParameters({ quote_items: JSON.stringify(items) }, seed);
  const result = selected([line, { id: second.id, quantity: 2.125, unit: "kg" }]);
  assert.equal(result.quote_items[0].title, first.title.ru);
  assert.equal(result.quote_items[0].code, first.code);
  assert.equal(result.quote_items[1].quantity, 2.125);
  assert.equal(formatQuantity(1, "sample"), "1 проба");
  assert.equal(formatQuantity(2, "batch"), "2 партии");
  assert.equal(formatQuantity(4.125, "kg"), "4,125 кг");
  assert.deepEqual(quoteParameters({}, null), { urgency: "standard", language: "ru", quote_items: [] });
  for (const [items, code] of [
    [[line, line], "quote_items_invalid"], [[{ ...line, title: "client-supplied" }], "quote_items_invalid"],
    [[{ ...line, id: "missing" }], "quote_catalogue_changed"], [[{ ...line, unit: "invalid" }], "quote_unit_invalid"],
    ...[0, -1, 1000001, 2.5, "4"].map(quantity => [[{ ...line, quantity }], "quote_quantity_invalid"]),
    [[{ ...line, quantity: 0.0009, unit: "kg" }], "quote_quantity_invalid"]
  ]) assert.throws(() => selected(items), { code });
  for (const flag of [{ enabled: false }, { status: "draft" }]) {
    assert.throws(() => quoteParameters({ quote_items: JSON.stringify([line]) }, { priceEntries: [{ ...first, ...flag }] }), { code: "quote_catalogue_changed" });
  }
  assert.throws(() => quoteParameters({ quote_items: "[]", deadline: "2027-02-31" }, seed), { code: "deadline_invalid" });
  assert.throws(() => quoteParameters({ urgency: "other" }, seed), { code: "urgency_invalid" });
});

test("concurrent retries of one quote produce one receipt and one staff notification opportunity", async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sael-quote-store-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const store = createQuoteStore(dir);
  const fields = { company: "test", person: "test", ...quoteParameters({ quote_items: JSON.stringify([line]) }, seed) };
  const key = randomUUID();
  const saved = await Promise.all([store.accept(fields, null, key), store.accept(fields, null, key)]);
  assert.equal(saved[0].reference, saved[1].reference);
  assert.equal(saved.filter(item => item.created).length, 1);
  const { reference } = saved[0];
  await assert.rejects(store.accept({ ...fields, company: "different request" }, null, key), { code: "quote_key_conflict" });
  assert.deepEqual(await fs.readdir(path.join(dir, "quote-requests")), [reference]);
  assert.equal((await store.detail(reference)).delivery, "pending");
  await store.markDelivery(reference, "failed");
  assert.equal((await store.list(1)).requests[0].delivery, "failed");
});

async function localApp(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sael-quote-http-"));
  const token = randomUUID();
  // The test transport writes only local files and never opens an SMTP connection.
  const bootstrap = [
    'const fs = require("node:fs/promises"), path = require("node:path");',
    'require("nodemailer").createTransport = () => ({async sendMail(mail) {',
    'if (mail.subject.includes("SMTP-OFFLINE")) throw new Error("Test failure");',
    'await fs.appendFile(path.join(process.env.CMS_DATA_DIR, "mail.jsonl"), JSON.stringify(mail) + "\\n"); }});',
    'require("./server");'
  ].join("\n");
  const proc = spawn(process.execPath, ["-e", bootstrap], {
    cwd: path.join(__dirname, ".."), windowsHide: true,
    env: { ...process.env, NODE_ENV: "test", PORT: "0", SAEL_BIND_HOST: "127.0.0.1", CMS_DATA_DIR: dir,
      PUBLIC_ORIGIN: "", CMS_PUBLIC_ORIGIN: "", CMS_SETUP_TOKEN: token, SMTP_HOST: "test.invalid",
      SMTP_USER: "test", SMTP_PASS: "test", SAEL_FROM: "lab@example.invalid", SAEL_QUOTE_TO: "staff@example.invalid" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  t.after(async () => {
    if (proc.exitCode === null && proc.signalCode === null) { const exited = once(proc, "exit"); proc.kill(); await exited; }
    await fs.rm(dir, { recursive: true, force: true });
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  let output = "";
  try {
    while (!/localhost:\d+/.test(output)) {
      const [chunk] = await once(proc.stdout, "data", { signal: controller.signal });
      output += chunk;
    }
  } finally { clearTimeout(timer); }
  const origin = "http://127.0.0.1:" + output.match(/localhost:(\d+)/)[1];
  async function adminPost(url, payload, session = {}) {
    return fetch(origin + url, {
      method: "POST", headers: { origin, "content-type":"application/json", ...session }, body: JSON.stringify(payload)
    });
  }
  async function submit(input = {}, attachment = false) {
    const form = new FormData();
    const values = { company: "Lab sample", person: "Test", email: "client@example.invalid", phone: "+996000000000", consent: "yes", ...input };
    for (const [name, value] of Object.entries(values)) form.set(name, value);
    if (attachment) form.set("technical_assignment", new Blob(["%PDF-test"], { type:"application/pdf" }), typeof attachment === "string" ? attachment : "task.pdf");
    return fetch(origin + "/api/quote-request", { method:"POST", body: form });
  }
  return { origin, dir, token, adminPost, submit };
}

test("multipart submission reaches private inbox, staff email, localized confirmation and authenticated attachment download", async t => {
  const app = await localApp(t);
  const username = "test-admin", password = randomUUID();
  const setup = await app.adminPost("/api/admin/setup", { token: app.token, username, password });
  assert.equal(setup.status, 200);
  const cookie = setup.headers.get("set-cookie").split(";")[0];
  const headers = { cookie, "x-csrf-token": (await setup.json()).csrfToken };
  const url = app.origin + "/api/admin/quote-requests";
  const payload = { quote_items: JSON.stringify([line]), urgency: "urgent", comment: "Bilingual report",
    deadline: "2027-03-05", language: "en", request_key: randomUUID() };
  const response = await app.submit(payload, true);
  assert.equal(response.status, 200);
  const { reference } = await response.json();
  assert.match(reference, /^SAEL-[A-F0-9]{24}$/);
  const again = await app.submit(payload, true);
  assert.equal((await again.json()).reference, reference);
  assert.equal((await fetch(url)).status, 401);
  const createManager = await app.adminPost("/api/admin/users", { username:"manager", password, role:"assistant_manager" }, headers);
  assert.equal(createManager.status, 201);
  const manager = await app.adminPost("/api/admin/login", { username:"manager", password });
  const managerHeaders = { cookie: manager.headers.get("set-cookie").split(";")[0] };
  for (const target of [url, url + "/" + reference, url + "/" + reference + "/attachment"]) {
    assert.equal((await fetch(target, { headers:managerHeaders })).status, 403);
  }
  const inbox = await (await fetch(url, { headers })).json();
  assert.equal(inbox.total, 1);
  assert.equal(inbox.requests[0].urgency, "urgent");
  const detail = await fetch(url + "/" + reference, { headers });
  assert.equal(detail.headers.get("cache-control"), "no-store");
  const record = (await detail.json()).request;
  assert.equal(record.fields.quote_items[0].title, first.title.ru);
  assert.equal(record.fields.deadline, payload.deadline);
  assert.equal(record.fields.comment, payload.comment);
  assert.equal(record.attachment.filename, "task.pdf");
  const attachment = await fetch(url + "/" + reference + "/attachment", { headers });
  assert.equal(attachment.headers.get("content-disposition"), 'attachment; filename="task.pdf"');
  assert.equal(await attachment.text(), "%PDF-test");
  const mails = (await fs.readFile(path.join(app.dir, "mail.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
  assert.equal(mails.length, 2);
  assert.ok(mails[0].text.includes(first.title.ru));
  assert.ok(mails[0].text.includes("12 проб") && mails[0].text.includes("срочно") && mails[0].text.includes(payload.comment));
  assert.ok(mails[1].subject.includes("SAEL received") && mails[1].text.includes(reference));
  assert.equal((await app.submit({ quote_items: "[]", research: "" })).status, 400);
  const fileName = "Задание №2 үлгү.pdf";
  const brief = await app.submit({ quote_items: "[]", company:"SMTP-OFFLINE" }, fileName);
  assert.equal(brief.status, 200);
  const offline = (await brief.json()).reference;
  const fileResponse = await fetch(url + "/" + offline + "/attachment", { headers });
  assert.ok(fileResponse.headers.get("content-disposition").endsWith("filename*=UTF-8''" + encodeURIComponent(fileName)));
  assert.equal(await fileResponse.text(), "%PDF-test");
  let delivery;
  for (let attempt = 0; attempt < 20; attempt++) {
    delivery = (await (await fetch(url + "/" + offline, { headers })).json()).request.delivery;
    if (delivery !== "pending") break;
    await delay(10);
  }
  assert.equal(delivery, "failed");
  assert.equal((await app.submit({ research:"Legacy text request", deadline:"By agreement" })).status, 200);
});
