"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const Busboy = require("busboy");
const nodemailer = require("nodemailer");

const ROOT = __dirname;
require("dotenv").config({ path: path.join(ROOT, ".env") });
const PUBLIC_ROOT = fs.existsSync(path.join(ROOT, "public", "index.html")) ? path.join(ROOT, "public") : ROOT;
const ADMIN_DIR = fs.existsSync(path.join(PUBLIC_ROOT,"admin","index.html")) ? "admin/" : "";
const { createCms } = require("./cms-server");
const cms = createCms({root:ROOT,publicRoot:PUBLIC_ROOT,seed:JSON.parse(fs.readFileSync(path.join(ROOT,"cms-seed.json"),"utf8"))});
const { createAssistant } = require("./assistant-server");
const { createAnswerer } = require("./assistant-ai");
const assistant = createAssistant({root:ROOT,getContent:cms.getContent,authorizeAdmin:cms.authorizeAdmin,answer:createAnswerer({root:ROOT}),aiConfigured:()=>!!process.env.OPENAI_API_KEY,notify:notifyAssistantHandoff});
const PORT = Number(process.env.PORT || 8020);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 1024 * 1024;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 5;
const rateBuckets = new Map();
const PUBLIC_FILES = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/service.html", ["service.html", "text/html; charset=utf-8"]],
  ["/about.html", ["about.html", "text/html; charset=utf-8"]],
  ["/about.css", ["about.css", "text/css; charset=utf-8"]],
  ["/about-content.js", ["about-content.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/service-details.css", ["service-details.css", "text/css; charset=utf-8"]],
  ["/service-content.js", ["service-content.js", "text/javascript; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/price-translations.js", ["price-translations.js", "text/javascript; charset=utf-8"]],
  ["/cms-client.js", ["cms-client.js", "text/javascript; charset=utf-8"]],
  ["/cms-public.css", ["cms-public.css", "text/css; charset=utf-8"]],
  ["/assistant-client.js", ["assistant-client.js", "text/javascript; charset=utf-8"]],
  ["/assistant.css", ["assistant.css", "text/css; charset=utf-8"]],
  ["/page.html", ["page.html", "text/html; charset=utf-8"]],
  ["/admin", [ADMIN_DIR ? "admin/index.html" : "admin.html", "text/html; charset=utf-8"]],
  ["/admin/", [ADMIN_DIR ? "admin/index.html" : "admin.html", "text/html; charset=utf-8"]],
  ["/admin/admin.css", [ADMIN_DIR+"admin.css", "text/css; charset=utf-8"]],
  ["/admin/admin.js", [ADMIN_DIR+"admin.js", "text/javascript; charset=utf-8"]],
  ["/assets/sael-logo-full.png", ["assets/sael-logo-full.png", "image/png"]],
  ["/assets/sael-logo-mark.png", ["assets/sael-logo-mark.png", "image/png"]],
  ["/assets/sael-professor.png", ["assets/sael-professor.png", "image/png"]],
  ["/assets/sael-video-poster.jpg", ["assets/sael-video-poster.jpg", "image/jpeg"]],
  ["/assets/source-sael/photos/sample-preparation.jpg", ["assets/source-sael/photos/sample-preparation.jpg", "image/jpeg"]],
  ["/assets/source-sael/photos/precious-metals.jpg", ["assets/source-sael/photos/precious-metals.jpg", "image/jpeg"]],
  ["/assets/source-sael/photos/multi-element.jpg", ["assets/source-sael/photos/multi-element.jpg", "image/jpeg"]],
  ["/assets/source-sael/photos/metallurgy.jpg", ["assets/source-sael/photos/metallurgy.jpg", "image/jpeg"]],
  ["/assets/source-sael/photos/environment.jpg", ["assets/source-sael/photos/environment.jpg", "image/jpeg"]],
  ["/assets/source-sael/photos/inspection.jpg", ["assets/source-sael/photos/inspection.jpg", "image/jpeg"]],
  ["/assets/source-sael/certificates/kca-iso-17025.png", ["assets/source-sael/certificates/kca-iso-17025.png", "image/png"]],
  ["/assets/source-sael/certificates/kca-iso-17020.png", ["assets/source-sael/certificates/kca-iso-17020.png", "image/png"]],
  ["/assets/source-sael/certificates/ukas-iso-17025.png", ["assets/source-sael/certificates/ukas-iso-17025.png", "image/png"]],
  ["/assets/source-sael/partners/kumtor.webp", ["assets/source-sael/partners/kumtor.webp", "image/webp"]],
  ["/assets/source-sael/partners/chaarat.png", ["assets/source-sael/partners/chaarat.png", "image/png"]],
  ["/assets/source-sael/partners/kazzinc.png", ["assets/source-sael/partners/kazzinc.png", "image/png"]],
  ["/assets/source-sael/partners/almalyk.jpg", ["assets/source-sael/partners/almalyk.jpg", "image/jpeg"]],
  ["/assets/source-sael/partners/kaz-minerals.png", ["assets/source-sael/partners/kaz-minerals.png", "image/png"]],
  ["/assets/source-sael/partners/polyus.png", ["assets/source-sael/partners/polyus.png", "image/png"]],
  ["/assets/source-sael/partners/rg-gold.png", ["assets/source-sael/partners/rg-gold.png", "image/png"]],
  ["/assets/source-sael/partners/alatau.png", ["assets/source-sael/partners/alatau.png", "image/png"]]
]);
const FILE_TYPES = {
  pdf: { mime: ["application/pdf"], signature: buffer => buffer.subarray(0, 5).toString("ascii") === "%PDF-" },
  xls: { mime: ["application/vnd.ms-excel", "application/x-ole-storage"], signature: isOleFile },
  doc: { mime: ["application/msword", "application/x-ole-storage"], signature: isOleFile },
  xlsx: { mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/zip", "application/x-zip-compressed"], signature: buffer => { const entries = zipEntries(buffer); return !!entries && entries.includes("[Content_Types].xml") && entries.includes("xl/workbook.xml"); } },
  docx: { mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/x-zip-compressed"], signature: buffer => { const entries = zipEntries(buffer); return !!entries && entries.includes("[Content_Types].xml") && entries.includes("word/document.xml"); } },
  zip: { mime: ["application/zip", "application/x-zip-compressed", "application/octet-stream"], signature: isZipFile }
};

class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function isOleFile(buffer) {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
}

function isZipFile(buffer) {
  return zipEntries(buffer) !== null;
}
function zipEntries(buffer) {
  if (buffer.length < 22) return null;
  for (let end = buffer.length - 22; end >= Math.max(0,buffer.length - 65557); end--) {
    if (buffer.readUInt32LE(end) !== 0x06054b50 || end + 22 + buffer.readUInt16LE(end + 20) !== buffer.length) continue;
    if (buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6)) return null;
    const count = buffer.readUInt16LE(end + 10);
    if (count !== buffer.readUInt16LE(end + 8) || count > 10000) return null;
    const size = buffer.readUInt32LE(end + 12);
    let cursor = buffer.readUInt32LE(end + 16);
    const finish = cursor + size;
    if (finish > end) return null;
    const entries = [];
    for (let i = 0; i < count; i++) {
      if (cursor + 46 > finish || buffer.readUInt32LE(cursor) !== 0x02014b50) return null;
      const length = buffer.readUInt16LE(cursor + 28);
      const next = cursor + 46 + length + buffer.readUInt16LE(cursor + 30) + buffer.readUInt16LE(cursor + 32);
      const local = buffer.readUInt32LE(cursor + 42);
      if (next > finish || local + 30 > end || buffer.readUInt32LE(local) !== 0x04034b50) return null;
      if (buffer.readUInt16LE(cursor + 8) & 1) return null;
      entries.push(buffer.subarray(cursor + 46,cursor + 46 + length).toString("utf8"));
      cursor = next;
    }
    return cursor === finish ? entries : null;
  }
  return null;
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com; form-action 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'");
}

function sendJson(res, status, body) {
  const payload = Buffer.from(JSON.stringify(body));
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Length", payload.length);
  res.end(payload);
}

function checkRateLimit(req) {
  const now = Date.now();
  for (const [ip, bucket] of rateBuckets) {
    if (now - bucket.startedAt > RATE_WINDOW_MS) rateBuckets.delete(ip);
  }
  const remote = String(req.socket.remoteAddress || "").replace(/^::ffff:/,"");
  const trusted = String(process.env.TRUST_PROXY_IPS || "").split(",").map(value => value.trim());
  const forwarded = String(req.headers["x-real-ip"] || "").trim();
  const ip = trusted.includes(remote) && net.isIP(forwarded) ? forwarded : remote || "unknown";
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.startedAt > RATE_WINDOW_MS) {
    if (rateBuckets.size >= 10000) throw new HttpError(503,"rate_limiter_busy");
    rateBuckets.set(ip, { startedAt: now, count: 1 });
    return;
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT) throw new HttpError(429, "rate_limited");
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    let parser;
    let settled = false;
    let bytes = 0;
    let chunks = [];
    const fields = Object.create(null);
    let upload = null;
    let fileCount = 0;
    let parseError = null;
    const fail = error => { if (!parseError) parseError = error; };
    const onAbort = () => finish(new HttpError(400, "request_aborted"));
    const onRequestError = () => finish(new HttpError(400, "request_error"));
    const onData = chunk => {
      bytes += chunk.length;
      if (bytes > MAX_REQUEST_SIZE) finish(new HttpError(413, "request_too_large"));
    };
    function finish(error, value) {
      if (settled) return;
      settled = true;
      req.off("aborted", onAbort);
      // Keep the error listener until the request is collected, including errors after abort.
      req.off("data", onData);
      if (error) {
        chunks.length = 0;
        if (parser) { req.unpipe(parser); parser.destroy(); }
        req.resume();
        reject(error);
      } else resolve(value);
    }
    const declared = Number(req.headers["content-length"] || 0);
    if (!Number.isFinite(declared) || declared < 0 || declared > MAX_REQUEST_SIZE) {
      finish(new HttpError(413, "request_too_large"));
      return;
    }
    try {
      parser = Busboy({headers:req.headers, limits:{fileSize:MAX_FILE_SIZE, files:1, fields:16, fieldSize:5000, parts:18, headerPairs:100}});
    } catch { finish(new HttpError(400, "invalid_multipart")); return; }
    const allowedFields = new Set(["company","person","email","phone","country","sample_count","sample_type","research","method","deadline","comment","consent","website"]);
    parser.on("field", (name,value,info) => {
      if (!allowedFields.has(name) || Object.hasOwn(fields,name) || info.valueTruncated) { fail(new HttpError(400,"invalid_form_fields")); return; }
      fields[name] = value;
    });
    parser.on("file", (name,stream,info) => {
      fileCount++;
      if (fileCount > 1 || name !== "technical_assignment") { fail(new HttpError(400,"unexpected_file")); stream.resume(); return; }
      if (!info.filename) { stream.resume(); return; }
      chunks = [];
      let fileBytes = 0;
      stream.on("data",chunk => { fileBytes += chunk.length; if (!settled && fileBytes <= MAX_FILE_SIZE) chunks.push(chunk); });
      stream.on("limit",() => fail(new HttpError(413,"file_too_large")));
      stream.on("error",() => finish(new HttpError(400,"invalid_file_stream")));
      stream.on("end",() => {
        if (settled) return;
        if (stream.truncated) { fail(new HttpError(413,"file_too_large")); return; }
        upload = {filename:info.filename,mime:info.mimeType,size:fileBytes,content:Buffer.concat(chunks)};
        chunks = [];
      });
    });
    parser.on("filesLimit",() => fail(new HttpError(400,"too_many_files")));
    parser.on("fieldsLimit",() => fail(new HttpError(400,"too_many_fields")));
    parser.on("partsLimit",() => fail(new HttpError(400,"too_many_parts")));
    parser.on("error",() => finish(new HttpError(400,"invalid_multipart")));
    parser.on("close",() => finish(parseError,{fields,upload}));
    req.on("aborted",onAbort);
    req.on("error",onRequestError);
    req.on("data",onData);
    req.pipe(parser);
  });
}

const FIELD_LIMITS = {
  company: 200, person: 160, email: 254, phone: 80, country: 100, sample_count: 20,
  sample_type: 500, research: 5000, method: 500, deadline: 200, comment: 3000
};

function validateRequest(fields, upload) {
  const normalized = Object.create(null);
  for (const [name, limit] of Object.entries(FIELD_LIMITS)) {
    const value = String(fields[name] || "").trim();
    if (value.length > limit) throw new HttpError(400, "field_too_long");
    normalized[name] = value;
  }
  if (!normalized.company || !normalized.person || !normalized.email || !normalized.phone || !normalized.research) {
    throw new HttpError(400, "required_fields_missing");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized.email)) throw new HttpError(400, "invalid_email");
  if (fields.consent !== "yes") throw new HttpError(400, "consent_required");

  if (upload) {
    const extension = path.extname(upload.filename).slice(1).toLowerCase();
    const policy = FILE_TYPES[extension];
    const mime = String(upload.mime || "").toLowerCase();
    if (!policy || (mime !== "application/octet-stream" && !policy.mime.includes(mime))) throw new HttpError(415, "unsupported_file_type");
    if (!upload.size) throw new HttpError(400,"empty_file");
    if (upload.size > MAX_FILE_SIZE) throw new HttpError(413, "file_too_large");
    if (!policy.signature(upload.content)) throw new HttpError(415, "invalid_file_content");
    const name = path.basename(upload.filename.replace(/\\/g, "/"));
    upload.filename = name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120) || `technical-assignment.${extension}`;
    upload.extension = extension;
  }
  return normalized;
}

function mailConfiguration() {
  const port = Number(process.env.SMTP_PORT || 587);
  const config = {
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    from: process.env.SAEL_FROM,
    to: process.env.SAEL_QUOTE_TO
  };
  if (!config.host || !config.from || !config.to || !config.auth) throw new HttpError(503, "mail_not_configured");
  return config;
}

function requestText(fields) {
  return [
    "Новая заявка на коммерческое предложение с сайта SAEL",
    "",
    `Компания: ${fields.company}`,
    `Контактное лицо: ${fields.person}`,
    `Email: ${fields.email}`,
    `Телефон: ${fields.phone}`,
    `Страна: ${fields.country || "—"}`,
    `Количество образцов: ${fields.sample_count || "—"}`,
    `Тип образцов: ${fields.sample_type || "—"}`,
    `Необходимые исследования: ${fields.research}`,
    `Предполагаемый метод: ${fields.method || "—"}`,
    `Желаемый срок: ${fields.deadline || "—"}`,
    `Комментарий: ${fields.comment || "—"}`
  ].join("\n");
}

async function deliverRequest(fields, upload) {
  const mail = mailConfiguration();
  const transporter = nodemailer.createTransport({
    host: mail.host,
    port: mail.port,
    secure: mail.secure,
    requireTLS: !mail.secure,
    auth: mail.auth,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  });
  const safeCompany = fields.company.replace(/[\r\n]+/g, " ").slice(0, 100);
  const attachments = upload ? [{ filename: upload.filename, content: upload.content, contentType: upload.mime }] : [];
  await transporter.sendMail({
    from: mail.from,
    to: mail.to,
    replyTo: { name: fields.person.replace(/[\r\n]+/g, " "), address: fields.email },
    subject: `Заявка на КП — ${safeCompany}`,
    text: requestText(fields),
    attachments
  });

  try {
    await transporter.sendMail({
      from: mail.from,
      to: fields.email,
      subject: "Запрос на коммерческое предложение принят — SAEL",
      text: `Здравствуйте, ${fields.person}!\n\nМы получили ваш запрос на коммерческое предложение${upload ? " и техническое задание" : ""}. Специалист SAEL рассмотрит данные и свяжется с вами.\n\nС уважением,\nSAEL`
    });
  } catch {
    console.error("customer_confirmation_failed");
  }
}

async function notifyAssistantHandoff({conversation,contact,content}) {
  let mail;
  try { mail=mailConfiguration(); } catch { return {sent:false}; }
  const recipient=content.assistant?.handoffEmail||mail.to;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(recipient)) return {sent:false};
  const transporter=nodemailer.createTransport({host:mail.host,port:mail.port,secure:mail.secure,requireTLS:!mail.secure,auth:mail.auth,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000});
  const origin=process.env.PUBLIC_ORIGIN||process.env.CMS_PUBLIC_ORIGIN||"";
  const transcript=(conversation.messages||[]).slice(-30).map(message=>`${message.actor||message.role}: ${message.text}`).join("\n\n");
  try {
    await transporter.sendMail({from:mail.from,to:recipient,...(contact.email?{replyTo:{name:contact.name,address:contact.email}}:{}),subject:"Обращение из помощника SAEL — "+String(contact.name||"Посетитель").replace(/[\r\n]/g," ").slice(0,80),text:["Посетитель попросил связаться с сотрудником SAEL и согласился передать контакты и диалог.",`Имя: ${contact.name}`,`Email: ${contact.email||"—"}`,`Телефон: ${contact.phone||"—"}`,`Статус: ${conversation.status}`,origin?`Панель сотрудника: ${origin}/admin/`:"Диалог доступен в панели сайта /admin/ → Диалоги.","",transcript].join("\n")});
    return {sent:true};
  } catch { console.error("assistant_handoff_notification_failed"); return {sent:false}; }
}

async function handleQuoteRequest(req, res) {
  try {
    checkRateLimit(req);
    mailConfiguration();
    const contentType = String(req.headers["content-type"] || "");
    if (!contentType.toLowerCase().startsWith("multipart/form-data;")) throw new HttpError(415, "multipart_required");
    const { fields, upload } = await parseMultipart(req);
    if (String(fields.website || "").trim()) {
      sendJson(res, 200, { ok: true });
      return;
    }
    const normalized = validateRequest(fields, upload);
    await deliverRequest(normalized, upload);
    sendJson(res, 200, { ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status >= 500) console.error(error.code);
      sendJson(res, error.status, { ok: false, error: error.code });
      return;
    }
    console.error("quote_request_delivery_failed");
    sendJson(res, 502, { ok: false, error: "delivery_failed" });
  }
}

function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }
  const entry = PUBLIC_FILES.get(pathname);
  if (!entry) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not found");
    return;
  }
  const [filename, type] = entry;
  const filePath = path.join(PUBLIC_ROOT, filename);
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.statusCode = 500;
      res.end("Server error");
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", pathname.startsWith("/admin") ? "no-store" : /\.(html|js|css)$/.test(filename) ? "no-cache" : "public, max-age=300");
    res.setHeader("Content-Length", content.length);
    if (req.method === "HEAD") res.end();
    else res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  setSecurityHeaders(res);
  let pathname;
  try {
    pathname = new URL(req.url, "http://localhost").pathname;
  } catch {
    sendJson(res, 400, { error: "invalid_url" });
    return;
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin")) {
    res.setHeader("X-Robots-Tag","noindex, nofollow, noarchive");
    res.setHeader("Cache-Control","no-store");
  }
  try { if (await assistant.handle(req,res,pathname)) return; if (await cms.handle(req,res,pathname)) return; }
  catch { console.error("cms_route_failed"); if (!res.headersSent) sendJson(res,503,{ok:false,error:"cms_unavailable"}); else res.end(); return; }
  if (pathname === "/api/quote-request") {
    if (req.method !== "POST") {
      sendJson(res, 405, { ok: false, error: "method_not_allowed" });
      return;
    }
    void handleQuoteRequest(req, res);
    return;
  }
  serveStatic(req, res, pathname);
});

server.headersTimeout = 15000;
server.requestTimeout = 30000;
server.listen(PORT, () => console.log(`SAEL site listening on http://localhost:${PORT}`));
