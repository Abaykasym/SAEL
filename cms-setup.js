"use strict";

// Generates a short-lived bootstrap secret without placing passwords in shell history.
// The first web setup consumes its purpose permanently once an administrator exists.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = __dirname;
require("dotenv").config({ path: path.join(root, ".env") });
const dataDir = path.resolve(process.env.CMS_DATA_DIR || path.join(root, "data"));
const authFile = path.join(dataDir, "auth.json");
if (fs.existsSync(authFile)) {
  let auth;
  try { auth = JSON.parse(fs.readFileSync(authFile, "utf8")); } catch { console.error("Хранилище администратора недоступно. Настройка остановлена."); process.exit(1); }
  if (auth.users?.length) { console.log("Администратор уже создан. Откройте /admin для входа. Сброс доступа выполняйте только после резервного копирования закрытого хранилища."); process.exit(0); }
}
const envFile = path.join(root, ".env");
const token = crypto.randomBytes(32).toString("base64url");
const existing = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
const next = existing.replace(/^CMS_SETUP_TOKEN=.*(?:\r?\n|$)/gm, "").replace(/\s*$/, "") + "\nCMS_SETUP_TOKEN=" + token + "\n";
fs.writeFileSync(envFile, next, { mode: 0o600 });
console.log("Код первичной настройки записан в закрытый .env рядом с server.js.");
console.log("Перезапустите приложение, откройте /admin и введите значение CMS_SETUP_TOKEN из .env.");
console.log("Если CMS_SETUP_TOKEN задан в переменных Plesk, используйте значение из Plesk: переменные окружения имеют приоритет над .env.");
