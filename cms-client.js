/* Public CMS adapter. The existing site remains a usable file-based preview when the API is unavailable. */
(function () {
  "use strict";
  const languages = ["ru", "kg", "en"];
  const state = { content: null, revision: null, bindings: null, loadError: false };
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);
  const clone = value => JSON.parse(JSON.stringify(value));
  const localeText = (value, locale) => typeof value === "string" ? value : String(value && value[locale] || "");
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };
  function safeUrl(value, image) {
    if (typeof value !== "string" || !value.trim() || /[\u0000-\u001f\u007f"'<>`]/.test(value) || /&#(?:x[\da-f]+|\d+);?/i.test(value)) return "";
    try {
      const parsed = new URL(value.trim(), document.baseURI);
      const protocols = image ? ["http:", "https:", "file:"] : ["http:", "https:", "file:", "mailto:", "tel:"];
      if (!protocols.includes(parsed.protocol) || parsed.username || parsed.password) return "";
      if (parsed.protocol === "file:" && location.protocol !== "file:") return "";
      return value.trim();
    } catch { return ""; }
  }
  function richHtml(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    const allowed = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "S", "UL", "OL", "LI", "A", "BLOCKQUOTE", "H2", "H3", "H4", "SUP", "SUB", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD"]);
    const forbidden = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT", "LINK", "META", "BASE"]);
    function walk(parent) {
      for (const child of Array.from(parent.childNodes)) {
        if (child.nodeType === 8) { child.remove(); continue; }
        if (child.nodeType !== 1) continue;
        if (forbidden.has(child.tagName)) { child.remove(); continue; }
        walk(child);
        if (!allowed.has(child.tagName)) { child.replaceWith(...child.childNodes); continue; }
        const href = child.tagName === "A" ? safeUrl(child.getAttribute("href")) : "";
        const blank = child.getAttribute("target") === "_blank";
        for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name);
        if (href) {
          child.setAttribute("href", href);
          if (blank) { child.target = "_blank"; child.rel = "noopener noreferrer"; }
        }
      }
    }
    walk(template.content);
    return template.innerHTML;
  }
  window.saelCmsSafeHtml = richHtml;
  window.saelCmsSafeUrl = safeUrl;
  function replace(target, value) {
    if (Array.isArray(target) && Array.isArray(value)) target.splice(0, target.length, ...clone(value));
    else if (target && value && typeof target === "object" && typeof value === "object") {
      for (const key of Object.keys(target)) delete target[key];
      Object.assign(target, clone(value));
    }
  }
  function published(item) { return !!item && item.status !== "draft" && item.enabled !== false; }
  function translated(value) {
    const result = {};
    for (const lang of languages) result[lang] = typeof value === "string" ? value : String(value?.[lang] || "");
    return result;
  }
  function servicePages(content, services) {
    const result = {};
    for (const service of services) {
      result[service.id] = {};
      for (const lang of languages) {
        const source = content?.[service.id]?.[lang] || {};
        const page = { lead: service.desc[lang], overviewTitle: service.name[lang], methodsTitle: { ru: "Методы и процедуры", kg: "Методдор жана жол-жоболор", en: "Methods and procedures" }[lang], result: service.result[lang], note: "", ...clone(source) };
        for (const key of ["overview", "sampleTags", "requirements"]) page[key] = Array.isArray(source[key]) ? source[key].map(String) : key === "overview" ? [service.method[lang]] : key === "requirements" ? [service.requirements[lang]] : [];
        page.facts = Array.isArray(source.facts) ? source.facts.filter(Array.isArray).map(item => [String(item[0] || ""), String(item[1] || "")]) : [];
        page.faq = Array.isArray(source.faq) ? source.faq.filter(Array.isArray).map(item => [String(item[0] || ""), String(item[1] || "")]) : [];
        page.methods = Array.isArray(source.methods) ? source.methods.filter(item => item && typeof item === "object").map(item => ({ title: String(item.title || ""), text: String(item.text || "") })) : [];
        result[service.id][lang] = page;
      }
    }
    return result;
  }
  function companyPages(content) {
    const result = {};
    for (const lang of languages) {
      const source = content?.[lang] || {}, page = clone(source);
      for (const key of ["title", "lead", "eyebrow", "overviewTitle", "historyTitle", "capabilitiesTitle", "equipmentTitle", "equipmentIntro", "qualityTitle", "qualityText", "ctaTitle", "ctaText"]) page[key] = String(page[key] || "");
      for (const key of ["overview", "qualityBullets"]) page[key] = Array.isArray(page[key]) ? page[key].map(String) : [];
      for (const key of ["timeline", "capabilities"]) page[key] = Array.isArray(page[key]) ? page[key].filter(Array.isArray).map(item => item.map(String)) : [];
      result[lang] = page;
    }
    return result;
  }
  window.saelCmsReady = (async function () {
    if (!["http:", "https:"].includes(location.protocol)) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch("/api/cms/public", { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) { state.loadError = true; return null; }
      const result = await response.json();
      if (!result.content || result.content.schemaVersion !== 1) { state.loadError = true; return null; }
      state.content = result.content;
      state.revision = result.revision;
      window.saelCmsContent = state.content;
      return state.content;
    } catch { state.loadError = true; return null; }
    finally { clearTimeout(timer); }
  })();
  window.saelCmsApply = function (bindings) {
    state.bindings = bindings;
    const content = state.content;
    if (!content) return false;
    for (const key of ["copy", "categories", "processSteps", "clientSteps", "faqs"]) if (own(content, key)) replace(bindings[key], content[key]);
    if (bindings.copy) {
      for (const lang of languages) {
        const localized = bindings.copy[lang] || (bindings.copy[lang] = {});
        for (const key of Object.keys(localized)) {
          localized[key] = richHtml(localized[key]);
          if (/^(serviceUi|aboutUi)\./.test(key)) { const text = document.createElement("template"); text.innerHTML = localized[key]; localized[key] = text.content.textContent; }
        }
        if (content.settings && own(content.settings.address, lang)) localized["contact.address"] = richHtml(content.settings.address[lang]);
        if (content.settings && own(content.settings.hours, lang)) localized["contact.hours"] = richHtml(content.settings.hours[lang]);
      }
    }
    if (own(content, "services")) {
      const services = content.services.filter(published).map(item => {
        const service = clone(item);
        for (const key of ["name", "desc", "method", "samples", "requirements", "result", "material"]) service[key] = translated(service[key]);
        service.category = String(service.category || "other");
        if (!["sample", "spark", "bars", "flask", "drop", "check"].includes(service.icon)) service.icon = "sample";
        return service;
      });
      replace(bindings.services, services);
      for (const lang of languages) {
        if (bindings.categories && !bindings.categories[lang]) bindings.categories[lang] = {};
        for (const item of services) if (bindings.categories?.[lang] && !own(bindings.categories[lang], item.category)) bindings.categories[lang][item.category] = item.category;
      }
      if (bindings.servicePhotos) {
        for (const item of services) bindings.servicePhotos[item.id] = safeUrl(item.photo, true) || "assets/sael-logo-mark.png";
      }
    }
    if (own(content, "priceEntries")) replace(bindings.priceEntries, content.priceEntries.filter(published));
    if (content.serviceContent || own(content, "services")) window.saelServiceContent = servicePages(content.serviceContent, bindings.services || []);
    if (content.aboutContent) window.saelAboutContent = companyPages(content.aboutContent);
    if (content.priceTranslations) window.saelPriceTranslations = clone(content.priceTranslations);
    return true;
  };
  function route() {
    const name = location.pathname.split("/").pop();
    if (name === "about.html") return { kind: "about", key: "about" };
    if (name === "service.html") { const id = new URLSearchParams(location.search).get("service"); return { kind: "service", key: "service:" + id, serviceId: id }; }
    if (name === "page.html") { const slug = new URLSearchParams(location.search).get("slug"); return { kind: "custom", key: "custom:" + slug, slug }; }
    return { kind: "home", key: "home" };
  }
  function pageFor(current) {
    return (state.content.pages || []).find(page => page.kind === current.kind && (current.kind !== "service" || page.serviceId === current.serviceId) && (current.kind !== "custom" || page.slug === current.slug));
  }
  function closeMenu() {
    if (typeof window.saelCmsSetMenuOpen === "function") window.saelCmsSetMenuOpen(false, false);
    else if (document.querySelector(".main-nav.is-open")) document.querySelector(".menu-toggle")?.click();
  }
  function isAvailableLink(value, locale) {
    if (!safeUrl(value)) return false;
    let url;
    try { url = new URL(value, document.baseURI); } catch { return false; }
    if (url.origin !== location.origin || !["http:", "https:", "file:"].includes(url.protocol)) return true;
    const file = url.pathname.split("/").pop();
    const kind = file === "about.html" ? "about" : file === "service.html" ? "service" : file === "page.html" ? "custom" : file === "index.html" || !file ? "home" : "";
    if (!kind) return true;
    const selected = pageFor({ kind, serviceId: url.searchParams.get("service"), slug: url.searchParams.get("slug") });
    if (state.content.pages && (!selected || !published(selected))) return false;
    if (kind === "service" && !(state.content.services || []).some(service => service.id === url.searchParams.get("service") && published(service))) return false;
    if (selected && !localeText(selected.title, locale)) return false;
    if (kind === "home" && url.hash) {
      const id = url.hash.slice(1), sectionId = id === "request" ? "contacts" : id === "certificates" ? "quality" : id;
      const known = ["hero", "about", "services", "quality", "equipment", "process", "clients", "requirements-band", "price", "faq", "partners", "contacts"];
      if (known.includes(sectionId) && Array.isArray(state.content.sections)) return state.content.sections.some(section => section.page === "home" && section.id === sectionId && section.enabled !== false);
    }
    return true;
  }
  function makeLink(item, locale, className) {
    const label = localeText(item.label || item.title || item.name, locale);
    let href = safeUrl(item.url);
    if (!label || !href || !isAvailableLink(href, locale)) return null;
    if (href.startsWith("#") && route().kind !== "home") href = "index.html" + href;
    const link = element("a", className, label);
    link.href = href;
    if (item.target === "_blank") { link.target = "_blank"; link.rel = "noopener noreferrer"; }
    link.addEventListener("click", closeMenu);
    return link;
  }
  function renderMenus(locale) {
    const menus = state.content.menus;
    if (!menus) return;
    for (const [key, selector] of [["header", "#main-nav"], ["footer", ".footer-links"]]) {
      if (!Array.isArray(menus[key])) continue;
      const container = document.querySelector(selector);
      if (!container) continue;
      container.replaceChildren();
      for (const item of menus[key].filter(published)) {
        const link = makeLink(item, locale);
        if (link) container.append(link);
      }
      if (key === "header" && state.content.settings?.limsUrl) {
        const captions = { ru: "LIMS кабинет ↗", kg: "LIMS кабинети ↗", en: "LIMS portal ↗" };
        const lims = makeLink({ url: state.content.settings.limsUrl, label: captions[locale], target: "_blank" }, locale, "mobile-lims-link");
        if (lims) container.append(lims);
      }
    }
  }
  function blocksNode(blocks, locale) {
    const container = element("div", "cms-blocks");
    for (const block of (blocks || []).filter(published)) {
      const text = localeText(block.text, locale);
      let node;
      if (block.type === "heading") {
        if (!text) continue;
        node = element(block.level === 3 ? "h3" : "h2", "cms-heading", text);
      } else if (block.type === "image") {
        const src = safeUrl(block.src, true);
        if (!src) continue;
        node = element("figure", "cms-image");
        const image = element("img"); image.src = src; image.alt = localeText(block.alt, locale); image.loading = "lazy"; image.decoding = "async";
        node.append(image);
        if (text) node.append(element("figcaption", "", text));
      } else if (block.type === "button") {
        node = makeLink({ label: text, url: block.url }, locale, "button button-primary cms-button");
        if (!node) continue;
      } else if (block.type === "list") {
        node = element("ul", "cms-list");
        for (const value of block.items || []) { const item = localeText(value, locale); if (item) node.append(element("li", "", item)); }
        if (!node.childNodes.length) continue;
      } else if (block.type === "quote") {
        if (!text) continue;
        node = element("blockquote", "cms-quote"); node.innerHTML = richHtml(text);
      } else {
        if (!text) continue;
        node = element("div", "cms-prose"); node.innerHTML = richHtml(text);
      }
      container.append(node);
    }
    return container;
  }
  function renderSections(current, page, locale) {
    const main = document.querySelector("main");
    if (!main) return;
    document.querySelectorAll(".cms-section-extra, .cms-page-extra, .cms-generated-section").forEach(node => node.remove());
    const applicable = (state.content.sections || []).filter(section => section.page === current.key || section.page === page?.id);
    if (!applicable.length && current.kind === "custom") return;
    const host = current.kind === "about" ? document.getElementById("about-content") : current.kind === "service" ? document.getElementById("detail-content") : main;
    if (!host) return;
    const managed = Array.from(host.children).filter(node => node.matches("section") && node.id && !node.classList.contains("cms-unavailable"));
    const tail = managed.length ? Array.from(host.children).find(node => !managed.includes(node) && !node.classList.contains("cms-page-extra")) : null;
    for (const node of managed) node.hidden = !applicable.some(section => (section.targetId || section.id) === node.id && section.enabled !== false);
    for (const section of applicable) {
      const targetId = section.targetId || section.id;
      let node = document.getElementById(targetId);
      if (node && !host.contains(node)) node = null;
      if (section.enabled === false) { if (node) node.hidden = true; continue; }
      if (!node) {
        node = element("section", "cms-section cms-generated-section");
        if (/^[a-zA-Z][a-zA-Z0-9_-]{0,119}$/.test(targetId || "")) node.id = targetId;
        const wrap = element("div", "wrap");
        const title = localeText(section.title, locale); if (title) wrap.append(element("h2", "cms-section-title", title));
        wrap.append(blocksNode(section.blocks, locale)); node.append(wrap);
      } else {
        node.hidden = false;
        if (section.blocks?.length) { const extra = element("div", "wrap cms-section-extra"); extra.append(blocksNode(section.blocks, locale)); node.append(extra); }
      }
      host.insertBefore(node, tail || null);
    }
    if (page?.blocks?.length && current.kind !== "custom") {
      const extra = element("section", "cms-page-extra cms-section"); const wrap = element("div", "wrap"); wrap.append(blocksNode(page.blocks, locale)); extra.append(wrap); main.append(extra);
    }
  }
  function renderCollections(locale) {
    const content = state.content;
    if (Array.isArray(content.documents)) document.querySelectorAll(".certificate-grid").forEach(container => {
      container.replaceChildren();
      for (const item of content.documents.filter(published)) {
        const href = safeUrl(item.url); if (!href) continue;
        const card = element("a", "certificate-card"); card.href = href; card.target = "_blank"; card.rel = "noopener noreferrer";
        const media = element("span", "certificate-image");
        if (/\.(png|jpe?g|webp)(?:[?#]|$)/i.test(href)) { const image = element("img"); image.src = href; image.alt = localeText(item.title, locale); image.loading = "lazy"; media.append(image); }
        else media.append(element("span", "cms-document-icon", "PDF"));
        card.append(media, element("b", "", localeText(item.title, locale)), element("span", "", localeText(item.caption, locale))); container.append(card);
      }
    });
    if (Array.isArray(content.partners)) document.querySelectorAll(".partners-grid").forEach(container => {
      container.replaceChildren();
      for (const item of content.partners.filter(published)) {
        const row = element("li"); const logo = safeUrl(item.logo, true); let target = row;
        if (safeUrl(item.url)) { target = element("a"); target.href = safeUrl(item.url); target.target = "_blank"; target.rel = "noopener noreferrer"; row.append(target); }
        if (logo) { const image = element("img"); image.src = logo; image.alt = ""; image.loading = "lazy"; target.append(image); }
        target.append(element("span", "", item.name || "")); container.append(row);
      }
    });
    if (Array.isArray(content.equipment)) {
      for (const selector of [".equipment-grid", ".about-equipment-grid"]) document.querySelectorAll(selector).forEach(container => {
        const home = selector === ".equipment-grid"; container.replaceChildren();
        for (const [index, item] of content.equipment.filter(item => published(item) && (!home || item.showOnHome !== false)).entries()) {
          const card = element("article", home ? "equipment-card" : "about-equipment-card");
          card.append(element("span", home ? "equip-index" : "", (home ? String(index + 1).padStart(2, "0") + " / " : "") + (item.type || "")), element("h3", "", item.model || ""), element("p", "", item.manufacturer || ""));
          if (home) card.append(element("div", "equip-rule"));
          card.append(element(home ? "span" : "small", home ? "equip-purpose" : "", localeText(item.description, locale))); container.append(card);
        }
      });
    }
  }
  function youtubeId(url) {
    try {
      const parsed = new URL(url);
      if (!["https:", "http:"].includes(parsed.protocol)) return "";
      let id = "";
      if (["youtu.be", "www.youtu.be"].includes(parsed.hostname)) id = parsed.pathname.split("/")[1];
      if (["youtube.com", "www.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(parsed.hostname)) id = parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop();
      return /^[a-zA-Z0-9_-]{11}$/.test(id || "") ? id : "";
    } catch { return ""; }
  }
  function renderSettings(locale) {
    const settings = state.content.settings || {};
    for (const [key, selector] of [["logoFull", ".brand-logo-full"], ["logoMark", ".brand-logo-mark"]]) if (own(settings, key)) document.querySelectorAll(selector).forEach(image => { const src = safeUrl(settings[key], true); if (src) image.src = src; });
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
      const secondary = link.dataset.cmsSecondary === "true" || /34251/.test(link.getAttribute("href"));
      link.dataset.cmsSecondary = String(secondary); const value = secondary ? settings.phoneSecondary : settings.phone;
      if (value === undefined) return;
      link.hidden = !value; link.textContent = value || ""; link.href = "tel:" + String(value || "").replace(/[^+0-9]/g, "");
    });
    if (own(settings, "email")) document.querySelectorAll('a[href^="mailto:"]').forEach(link => { link.textContent = settings.email; link.href = "mailto:" + String(settings.email).replace(/[\r\n?]/g, ""); link.hidden = !settings.email; });
    if (own(settings, "limsUrl")) document.querySelectorAll(".button-lims, .mobile-lims-link").forEach(link => { const href = safeUrl(settings.limsUrl); link.hidden = !href; if (href) link.href = href; });
    if (own(settings, "pricePdf")) document.querySelectorAll(".price-controls a[target]").forEach(link => { const href = safeUrl(settings.pricePdf); link.hidden = !href; if (href) link.href = href; });
    if (own(settings, "mapUrl")) document.querySelectorAll(".map-link").forEach(link => { const href = safeUrl(settings.mapUrl); link.hidden = !href; if (href) link.href = href; });
    if (own(settings, "videoUrl")) {
      document.querySelectorAll('a[href*="youtube.com/watch"], a[data-i18n="media.youtube"]').forEach(link => { const href = safeUrl(settings.videoUrl); link.hidden = !href; if (href) link.href = href; });
      const button = document.querySelector(".hero-video-open");
      if (button && !button.dataset.cmsBound) {
        button.dataset.cmsBound = "true";
        button.addEventListener("click", function (event) {
          event.preventDefault(); event.stopImmediatePropagation();
          const id = youtubeId(state.content.settings.videoUrl); if (!id) return;
          const dialog = document.getElementById("sael-video-dialog"), host = document.getElementById("sael-video-host"), shell = document.getElementById("sael-video-shell");
          if (!dialog || !host) return;
          const frame = element("iframe"); frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0"; frame.title = localeText(state.content.copy?.[locale]?.["media.title"] || "SAEL", locale); frame.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture"; frame.allowFullscreen = true; frame.referrerPolicy = "strict-origin-when-cross-origin";
          host.replaceChildren(frame); if (!dialog.open) dialog.showModal(); document.body.classList.add("video-open");
          if (shell?.requestFullscreen) { try { Promise.resolve(shell.requestFullscreen()).catch(function () {}); } catch {} }
        }, true);
      }
      if (button) { button.disabled = !youtubeId(settings.videoUrl); button.setAttribute("aria-disabled", String(button.disabled)); }
    }
    for (const item of state.content.images || []) {
      const src = safeUrl(item.src, true); if (!src || typeof item.selector !== "string") continue;
      let images; try { images = document.querySelectorAll(item.selector); } catch { continue; }
      images.forEach(image => { if (image.tagName !== "IMG") return; image.src = src; image.alt = localeText(item.alt, locale); });
    }
  }
  function unavailable(locale, untranslated) {
    const messages = {
      ru: [untranslated ? "Страница пока не переведена" : "Страница не найдена", untranslated ? "Выберите другой язык или свяжитесь с лабораторией." : "Возможно, страница была перемещена или снята с публикации.", "На главную"],
      kg: [untranslated ? "Барак азырынча которула элек" : "Барак табылган жок", untranslated ? "Башка тилди тандаңыз же лаборатория менен байланышыңыз." : "Барак жылдырылган же жарыялоодон алынган болушу мүмкүн.", "Башкы бет"],
      en: [untranslated ? "This page has not been translated yet" : "Page not found", untranslated ? "Choose another language or contact the laboratory." : "The page may have moved or is no longer published.", "Home"]
    }[locale];
    const main = document.querySelector("main"); if (!main) return;
    main.dataset.cmsUnavailable = "true";
    let notice = main.querySelector(".cms-unavailable"); if (!notice) { notice = element("section", "cms-unavailable cms-section"); main.prepend(notice); }
    notice.replaceChildren(); const wrap = element("div", "wrap"); const link = element("a", "button button-primary", messages[2]); link.href = "index.html";
    wrap.append(element("p", "eyebrow", "SAEL / " + (untranslated ? "TRANSLATION" : "404")), element("h1", "", messages[0]), element("p", "cms-page-lead", messages[1]), link); notice.append(wrap);
    document.title = messages[0] + " — " + (state.content?.settings?.siteName || "SAEL");
  }
  function renderPage(current, page, locale) {
    const main = document.querySelector("main"); if (!main) return;
    delete main.dataset.cmsUnavailable;
    main.querySelector(".cms-unavailable")?.remove();
    if (current.kind === "custom") {
      main.replaceChildren(); main.classList.add("cms-custom-page");
      const hero = element("section", "cms-page-hero"); const wrap = element("div", "wrap");
      const crumb = element("a", "cms-breadcrumb", { ru: "Главная", kg: "Башкы бет", en: "Home" }[locale]); crumb.href = "index.html";
      wrap.append(crumb, element("p", "eyebrow", state.content.settings?.siteName || "SAEL"), element("h1", "", localeText(page.title, locale)));
      const lead = localeText(page.description, locale); if (lead) wrap.append(element("p", "cms-page-lead", lead));
      hero.append(wrap); main.append(hero);
      const body = element("section", "cms-section"); const bodyWrap = element("div", "wrap"); bodyWrap.append(blocksNode(page.blocks, locale)); body.append(bodyWrap); main.append(body);
    }
    const title = localeText(page.title, locale), description = localeText(page.description, locale);
    if (title) document.title = title + " — " + (state.content.settings?.siteName || "SAEL");
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description || document.querySelector('meta[name="description"]')?.content || "");
  }
  window.saelCmsRender = function (value) {
    const locale = languages.includes(value) ? value : "ru";
    if (!state.content) {
      if (state.loadError || route().kind === "custom") {
        unavailable(locale, false);
        if (state.loadError) {
          const messages = { ru: ["Сайт временно недоступен", "Не удалось загрузить содержимое. Обновите страницу через некоторое время."], kg: ["Сайт убактылуу жеткиликсиз", "Мазмунду жүктөө мүмкүн болгон жок. Бир аздан кийин баракты жаңыртыңыз."], en: ["The website is temporarily unavailable", "The content could not be loaded. Please refresh the page in a moment."] }[locale];
          const notice = document.querySelector(".cms-unavailable"); notice.querySelector("h1").textContent = messages[0]; notice.querySelector(".cms-page-lead").textContent = messages[1]; document.title = messages[0] + " — SAEL";
        }
      }
      return;
    }
    const current = route(), page = pageFor(current);
    renderMenus(locale); renderSettings(locale); renderCollections(locale);
    const missingService = current.kind === "service" && !(state.content.services || []).some(service => service.id === current.serviceId && published(service));
    if (missingService || Array.isArray(state.content.pages) && (!page || !published(page))) { unavailable(locale, false); return; }
    if (page && !localeText(page.title, locale)) { unavailable(locale, true); return; }
    if (page) renderPage(current, page, locale);
    renderSections(current, page, locale);
    document.querySelectorAll('a[href]').forEach(link => {
      if (link.closest(".cms-unavailable")) return;
      if (!isAvailableLink(link.getAttribute("href"), locale)) { link.hidden = true; link.dataset.cmsUnavailableLink = "true"; }
      else if (link.dataset.cmsUnavailableLink) { link.hidden = false; delete link.dataset.cmsUnavailableLink; }
    });
    window.dispatchEvent(new CustomEvent("sael:cms-rendered", { detail: { locale, revision: state.revision } }));
  };
})();
