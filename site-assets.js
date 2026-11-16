"use strict";

const imageTypes = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  webp: "image/webp",
};

function siteImagePath(value) {
  if (typeof value !== "string" || value.length > 500) return "";
  const path = value.startsWith("/") ? value.slice(1) : value;
  const parts = path.split("/");
  if (!["assets", "uploads"].includes(parts[0]) || parts.length < 2) return "";
  if (!parts.every(part => /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(part))) return "";
  const filename = parts.at(-1);
  const extension = filename.split(".").at(-1).toLowerCase();
  return filename.includes(".") && Object.hasOwn(imageTypes, extension) ? "/" + path : "";
}

function imageType(path) {
  return imageTypes[path.split(".").at(-1).toLowerCase()];
}

function renderSiteAssets(html, content, origin) {
  const favicon = siteImagePath(content.settings?.favicon);
  const shareImage = siteImagePath(content.settings?.shareImage);
  const avatar = content.assistant?.enabled === false ? "" : siteImagePath(content.assistant?.avatar);
  if (favicon) {
    html = html.replace(/<link\b[^>]*\brel="icon"[^>]*>/i,
      '<link rel="icon" type="' + imageType(favicon) + '" href="' + favicon + '">');
  }
  if (avatar) {
    html = html.replace(/<link\b[^>]*\bhref="assets\/sael-professor-kg\.webp"[^>]*>/i,
      '<link rel="preload" as="image" type="' + imageType(avatar) + '" href="' + avatar + '" fetchpriority="low">');
  }
  if (shareImage && origin) {
    const url = new URL(shareImage, origin).href;
    html = html.replace(/<\/head>/i, '  <meta property="og:image" content="' + url + '">\n' +
      '  <meta name="twitter:card" content="summary_large_image">\n' +
      '  <meta name="twitter:image" content="' + url + '">\n</head>');
  }
  return html;
}

module.exports = { siteImagePath, renderSiteAssets };
