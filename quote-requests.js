"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const REFERENCE = /^SAEL-[A-F0-9]{24}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const UNIT_LABELS = {
  sample: { one: "проба", few: "пробы", many: "проб" },
  test: { one: "испытание", few: "испытания", many: "испытаний" },
  batch: { one: "партия", few: "партии", many: "партий" }, kg: "кг", hour: "ч"
};
const ruPlural = new Intl.PluralRules("ru");
const ruNumber = new Intl.NumberFormat("ru", { maximumFractionDigits: 3 });
function formatQuantity(quantity, unit) {
  const forms = UNIT_LABELS[unit];
  const label = typeof forms === "string" ? forms : forms[ruPlural.select(quantity)];
  return ruNumber.format(quantity) + " " + label;
}

class QuoteError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function selectedAnalyses(raw, content) {
  if (raw === undefined) return [];
  let items;
  try { items = JSON.parse(raw); }
  catch { throw new QuoteError(400, "quote_items_invalid"); }
  if (!Array.isArray(items) || items.length > 150) throw new QuoteError(400, "quote_items_invalid");
  const catalogue = new Map(content.priceEntries.filter(entry => entry.enabled !== false && entry.status !== "draft").map(entry => [entry.id, entry]));
  const seen = new Set();
  return items.map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.id !== "string" ||
        Object.keys(item).some(key => !["id", "quantity", "unit"].includes(key)) || seen.has(item.id)) {
      throw new QuoteError(400, "quote_items_invalid");
    }
    seen.add(item.id);
    const entry = catalogue.get(item.id);
    if (!entry) throw new QuoteError(409, "quote_catalogue_changed");
    const { quantity, unit } = item;
    if (typeof unit !== "string" || !Object.hasOwn(UNIT_LABELS, unit)) throw new QuoteError(400, "quote_unit_invalid");
    if (typeof quantity !== "number" || quantity <= 0 || quantity > 1000000 ||
        Number(quantity.toFixed(3)) !== quantity ||
        (!["kg", "hour"].includes(unit) && !Number.isInteger(quantity))) {
      throw new QuoteError(400, "quote_quantity_invalid");
    }
    const title = typeof entry.title === "string" ? entry.title : entry.title?.ru || entry.title?.en || entry.id;
    const category = content.categories?.ru?.[entry.category] || entry.category || "";
    return { id: entry.id, code: entry.code || "", title, category, quantity, unit };
  });
}

function quoteParameters(fields, content) {
  const urgency = fields.urgency ?? "standard";
  const language = fields.language ?? "ru";
  if (urgency !== "standard" && urgency !== "urgent") throw new QuoteError(400, "urgency_invalid");
  if (!["ru", "kg", "en"].includes(language)) throw new QuoteError(400, "language_invalid");
  if (fields.request_key !== undefined && !UUID.test(fields.request_key)) throw new QuoteError(400, "request_key_invalid");
  if (fields.quote_items !== undefined) {
    if (fields.deadline) {
      const date = new Date(fields.deadline + "T00:00:00Z");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.deadline) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== fields.deadline) {
        throw new QuoteError(400, "deadline_invalid");
      }
    }
    if (fields.sample_count && (!/^\d+$/.test(fields.sample_count) || !Number.isSafeInteger(Number(fields.sample_count)) || Number(fields.sample_count) < 1)) {
      throw new QuoteError(400, "sample_count_invalid");
    }
  }
  return { urgency, language, quote_items: selectedAnalyses(fields.quote_items, content) };
}

const sha = data => crypto.createHash("sha256").update(data).digest("hex");
async function readJson(file) { return JSON.parse(await fs.readFile(file, "utf8")); }

function createQuoteStore(dataDir) {
  const base = path.join(dataDir, "quote-requests");
  function directory(reference) {
    if (!REFERENCE.test(reference)) throw new QuoteError(404, "quote_not_found");
    return path.join(base, reference);
  }
  async function status(reference) {
    try { return (await readJson(path.join(directory(reference), "notification.json"))).delivery; }
    catch (error) { if (error.code === "ENOENT") return "pending"; throw error; }
  }
  async function detail(reference) {
    try {
      const { fingerprint, ...record } = await readJson(path.join(directory(reference), "request.json"));
      return { ...record, delivery: await status(reference) };
    } catch (error) {
      if (error.code === "ENOENT") throw new QuoteError(404, "quote_not_found");
      throw error;
    }
  }

  async function accept(fields, upload, key) {
    const reference = "SAEL-" + sha((key || crypto.randomUUID()).toLowerCase()).slice(0, 24).toUpperCase();
    const destination = directory(reference);
    const attachment = upload ? { filename: upload.filename, mime: upload.mime, size: upload.size } : null;
    const choices = fields.quote_items.map(({ id, quantity, unit }) => ({ id, quantity, unit }));
    const fingerprint = sha(JSON.stringify([{ ...fields, quote_items: choices }, attachment, upload ? sha(upload.content) : null]));
    await fs.mkdir(base, { recursive: true, mode: 0o700 });
    const temp = await fs.mkdtemp(path.join(base, ".saving-"));
    try {
      const record = { reference, receivedAt: new Date().toISOString(), fields, attachment, fingerprint };
      if (upload) await fs.writeFile(path.join(temp, "attachment"), upload.content, { mode: 0o600 });
      await fs.writeFile(path.join(temp, "request.json"), JSON.stringify(record), { mode: 0o600 });
      try { await fs.rename(temp, destination); }
      catch (error) {
        // An identical retry can arrive on another worker before the first response reaches the browser.
        if (!["EEXIST", "ENOTEMPTY", "EPERM", "EACCES"].includes(error.code)) throw error;
        let previous;
        try { previous = await readJson(path.join(destination, "request.json")); }
        catch (readError) { if (readError.code === "ENOENT") throw error; throw readError; }
        if (previous.fingerprint !== fingerprint) throw new QuoteError(409, "quote_key_conflict");
        return { reference, created: false };
      }
      return { reference, created: true };
    } finally {
      // Only leaf files in our freshly allocated staging directory can exist here.
      for (const leaf of ["attachment", "request.json"]) {
        await fs.unlink(path.join(temp, leaf)).catch(error => { if (error.code !== "ENOENT") throw error; });
      }
      await fs.rmdir(temp).catch(error => { if (error.code !== "ENOENT") throw error; });
    }
  }
  async function markDelivery(reference, delivery) {
    const dir = directory(reference);
    const temp = path.join(dir, ".notification-" + crypto.randomUUID());
    try {
      await fs.writeFile(temp, JSON.stringify({ delivery }), { flag: "wx", mode: 0o600 });
      await fs.rename(temp, path.join(dir, "notification.json"));
    } finally { await fs.unlink(temp).catch(error => { if (error.code !== "ENOENT") throw error; }); }
  }
  async function list(page) {
    let entries;
    try { entries = await fs.readdir(base, { withFileTypes: true }); }
    catch (error) { if (error.code === "ENOENT") return { requests: [], page, total: 0 }; throw error; }
    const ordered = [];
    const refs = entries.filter(entry => entry.isDirectory() && REFERENCE.test(entry.name));
    for (let start = 0; start < refs.length; start += 32) {
      ordered.push(...await Promise.all(refs.slice(start, start + 32).map(async ({ name }) => ({
        name, time: (await fs.stat(path.join(directory(name), "request.json"))).mtimeMs
      }))));
    }
    ordered.sort((a, b) => b.time - a.time || a.name.localeCompare(b.name));
    const requests = await Promise.all(ordered.slice((page - 1) * 50, page * 50).map(async ({ name }) => {
      const { reference, receivedAt, delivery, fields } = await detail(name);
      return { reference, receivedAt, delivery, company: fields.company, person: fields.person, urgency: fields.urgency };
    }));
    return { requests, page, total: refs.length };
  }
  async function download(reference) {
    const { attachment } = await detail(reference);
    if (!attachment) throw new QuoteError(404, "quote_attachment_not_found");
    return { ...attachment, data: await fs.readFile(path.join(directory(reference), "attachment")) };
  }
  return { accept, detail, list, download, markDelivery };
}

module.exports = { QuoteError, quoteParameters, createQuoteStore, formatQuantity };
