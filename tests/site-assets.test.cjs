"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { siteImagePath, renderSiteAssets } = require("../site-assets");

const template = [
  "<!doctype html>",
  "<head>",
  '<link rel="icon" type="image/svg+xml" href="assets/sael-logo-mark.svg">',
  '<link rel="preload" as="image" type="image/webp" href="assets/sael-professor-kg.webp" fetchpriority="low">',
  "</head>",
].join("\n");

test("existing sites keep their bundled images unless administrators choose replacements", () => {
  assert.equal(renderSiteAssets(template, { settings: {}, assistant: { enabled: true } }, "https://sael.test"), template);
  assert.equal(renderSiteAssets(template, { assistant: { enabled: false, avatar: "/uploads/portrait.png" } }, "https://sael.test"), template);
});

test("favicon, social card and assistant portrait are served in the HTML", () => {
  const html = renderSiteAssets(template, {
    settings: { favicon: "/uploads/icon.png", shareImage: "assets/cover.JPG" },
    assistant: { enabled: true, avatar: "/uploads/portrait.jpeg" },
  }, "https://sael.test");
  assert.ok(html.includes('<link rel="icon" type="image/png" href="/uploads/icon.png">'));
  assert.ok(html.includes('<meta property="og:image" content="https://sael.test/assets/cover.JPG">'));
  assert.ok(html.includes('<link rel="preload" as="image" type="image/jpeg" href="/uploads/portrait.jpeg" fetchpriority="low">'));
  assert.ok(!html.includes("sael-professor-kg.webp"));
});

test("new image fields only accept raster images on the site", () => {
  for (const value of ["https://example.com/face.webp", "/uploads/../assets/face.webp", "//assets/a.png",
    "/uploads/dir.name/png", "/uploads/a.svg", "/uploads/a.pdf", "/uploads/face.png?x=1", '/uploads/a.png"']) {
    assert.equal(siteImagePath(value), "", value);
  }
  assert.equal(siteImagePath("assets/images/sael_logo.webp"), "/assets/images/sael_logo.webp");
});
