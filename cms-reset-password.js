"use strict";

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { createCms } = require("./cms-server");

async function main() {
  const [, , username, ...extra] = process.argv;
  if (!username || extra.length) {
    throw new Error("usage");
  }
  const root = __dirname;
  require("dotenv").config({ path: path.join(root, ".env") });
  const publicRoot = fs.existsSync(path.join(root, "public", "index.html")) ? path.join(root, "public") : root;
  const cms = createCms({ root, publicRoot, allowHostPasswordReset: true });
  const input = path.join(cms.dataDir, ".sael-reset-password");
  const handle = await fsp.open(input, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  let password;
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.nlink !== 1 || stat.size > 600) throw new Error("invalid_file");
    await handle.chmod(0o600);
    password = (await handle.readFile("utf8")).replace(/^\uFEFF/, "").replace(/\r?\n$/, "");
  } finally {
    await handle.close();
  }
  // Consume the input before updating authentication, including on a failed reset.
  await fsp.unlink(input);
  if (/[\r\n\0]/.test(password)) throw new Error("invalid_file");
  const result = await cms.resetAdminPasswordFromHost(username, password);
  console.log("Пароль администратора изменён. Его предыдущие сеансы завершены.");
  if (result.totpEnabled) console.log("Для входа по-прежнему нужен код из приложения-аутентификатора.");
}

main().catch(error => {
  const messages = {
    usage: "Укажите только логин: npm run admin:reset -- <логин>.",
    ENOENT: "Файл .sael-reset-password не найден в закрытой папке данных CMS.",
    invalid_file: "В закрытом файле должна быть одна строка с новым паролем.",
    password_weak: "Новый пароль должен содержать от 12 до 128 символов.",
    username_invalid: "Проверьте формат логина или email.",
    user_not_found: "Активный администратор с таким логином не найден.",
    store_busy: "Хранилище занято. Создайте файл пароля заново и повторите попытку."
  };
  console.error(messages[error.code || error.message] || "Сброс не выполнен. Проверьте закрытую папку данных CMS и права приложения.");
  process.exitCode = 1;
});
