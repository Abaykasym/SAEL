"use strict";

/* Retrieval contains public, currently visible material and explicitly published assistant knowledge. */
const LANGUAGES = ["ru", "kg", "en"];
const STOP = new Set(["как","для","что","это","или","мне","вас","ли","по","на","вы","мы","где","можно","посмотреть","нужно","the","and","what","how","for","can","you","are","with","where","find","do","does","is","of","to","in","my","me","бир","менен","кантип","кайдан","көрүүгө","болот"]);
function plain(value) {
  return String(value ?? "").replace(/<(script|style|iframe|object)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ").replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos);/g, entity => ({ "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" })[entity])
    .replace(/\s+/g, " ").trim();
}
function text(value, locale) { return plain(typeof value === "string" ? value : value?.[locale] || ""); }
function publicItem(item) { return !!item && item.status !== "draft" && item.enabled !== false; }
function flatten(value, locale) {
  if (typeof value === "string" || typeof value === "number") return plain(value);
  if (Array.isArray(value)) return value.map(item => flatten(item, locale)).filter(Boolean).join(" · ");
  if (!value || typeof value !== "object") return "";
  if (LANGUAGES.some(lang => Object.hasOwn(value, lang))) return text(value, locale);
  return Object.entries(value).filter(([key]) => !["sourceUrl", "id", "url", "src", "photo", "status", "enabled"].includes(key)).map(([, item]) => flatten(item, locale)).filter(Boolean).join(" · ");
}
function tokens(value) {
  const words = plain(value).toLowerCase().replace(/ё/g, "е").match(/[\p{L}\p{N}]+/gu) || [];
  return [...new Set(words.filter(word => word.length > 1 && !STOP.has(word)).map(word => /^[а-яa-z]{6,}$/u.test(word) ? word.slice(0, 5) : word))];
}
function visibleBlocks(blocks, locale) {
  return (Array.isArray(blocks) ? blocks : []).filter(publicItem).map(block => [text(block.text, locale), block.type === "list" ? flatten(block.items, locale) : "", block.type === "image" ? text(block.alt, locale) : ""].filter(Boolean).join(" · ")).filter(Boolean).join(" · ");
}
function pageUrl(page) {
  if (!page) return "";
  if (page.kind === "home") return "index.html";
  if (page.kind === "about") return "about.html";
  if (page.kind === "service") return "service.html?service=" + encodeURIComponent(page.serviceId || "");
  if (page.kind === "custom") return "page.html?slug=" + encodeURIComponent(page.slug || "");
  return "";
}
function buildKnowledge(content = {}, requestedLocale = "ru") {
  const locale = LANGUAGES.includes(requestedLocale) ? requestedLocale : "ru", docs = [], copy = content.copy?.[locale] || {}, settings = content.settings || {};
  const pages = (content.pages || []).filter(page => publicItem(page) && page.status === "published" && text(page.title, locale));
  const sections = Array.isArray(content.sections) ? content.sections : [];
  const home = pages.find(page => page.kind === "home"), about = pages.find(page => page.kind === "about");
  const aliases = page => [page.id, page.kind === "service" ? "service:" + page.serviceId : page.kind === "custom" ? "custom:" + page.slug : page.kind];
  function sectionFor(page, targetId) { return page ? sections.filter(section => aliases(page).includes(section.page) && (section.targetId || section.id) === targetId).at(-1) : null; }
  function visible(page, targetId) { return publicItem(sectionFor(page, targetId)); }
  function add(id, title, body, url, kind = "site", tags = "") {
    title = plain(title); body = plain(body);
    if (!title || !body) return;
    docs.push({ id, title, text: body.slice(0, 9000), url: typeof url === "string" ? url : "", kind, tokens: tokens(title + " " + tags + " " + body), titleTokens: tokens(title) });
  }
  const group = prefix => Object.entries(copy).filter(([key]) => key.startsWith(prefix + ".") && !/(?:cta|link|eyebrow|placeholder|sending|success|error|demo|endpoint|status|\.th\d|\.choose|\.empty|\.prompt|\.code|\.filter|\.search|\.request)/i.test(key)).map(([, value]) => plain(value)).filter(Boolean).join(" · ");
  const servicePages = new Map();
  const services = (content.services || []).filter(service => {
    const page = pages.find(page => page.kind === "service" && page.serviceId === service.id);
    if (!publicItem(service) || !page) return false;
    servicePages.set(service.id, page); return true;
  });
  // Contact details are visible in the shared footer even if the home contact section is hidden.
  const contactUrl = visible(home, "contacts") ? "index.html#contacts" : pageUrl(home || about || pages[0]);
  add("contacts", { ru: "Контакты и режим работы SAEL", kg: "SAEL байланыштары жана иш убактысы", en: "SAEL contact details and office hours" }[locale], [text(settings.address, locale), text(settings.hours, locale), settings.phone, settings.phoneSecondary, settings.email].filter(Boolean).join(" · "), contactUrl, "contact", "адрес контакты телефон почта график часы address contacts phone email opening working hours дарек байланыш телефон иш убактысы");
  if (home) {
    const groups = [["hero", "hero"], ["about", "about"], ["services", "services"], ["quality", "quality"], ["equipment", "equipment"], ["process", "process"], ["clients", "clients"], ["samples", "requirements-band"], ["price", "price"], ["faq", "faq"], ["partners", "partners"], ["contact", "contacts"]];
    for (const [prefix, target] of groups) {
      if (!visible(home, target)) continue;
      const extras = prefix === "about" ? Object.entries(copy).filter(([key]) => key.startsWith("stat.")).map(([, value]) => plain(value)).join(" · ") : prefix === "process" ? flatten(content.processSteps?.[locale], locale) : prefix === "clients" ? flatten(content.clientSteps?.[locale], locale) : "";
      add("home-" + prefix, plain(copy[prefix + ".title"] || prefix), [group(prefix), extras].filter(Boolean).join(" · "), "index.html#" + target);
    }
    if (visible(home, "services")) {
      add("overview-services", plain(copy["services.title"]) || { ru: "Как выбрать анализ SAEL", kg: "SAEL анализин кантип тандоо керек", en: "Choosing a SAEL analysis" }[locale], [plain(copy["services.intro"]), ...services.map(service => text(service.name, locale) + ": " + text(service.desc, locale))].filter(Boolean).join(" · "), "index.html#services", "overview", "выбор выбрать подобрать анализ направление услуги choose select analysis service services керектүү анализди кантип тандайм кызмат кызматтар тандоо");
    }
    if (visible(home, "price")) {
      add("overview-prices", plain(copy["price.title"]) || { ru: "Прайс-лист SAEL", kg: "SAEL баалары", en: "SAEL price list" }[locale], [plain(copy["price.intro"]), plain(copy["price.filter"]), plain(copy["price.note"]), settings.pricePdf ? plain(copy["price.pdf"]) : ""].filter(Boolean).join(" · "), "index.html#price", "overview", "цена цены прайс расценки стоимость посмотреть price prices pricing rates cost costs pricelist баа баалар бааларды баасы нарк");
    }
    if (visible(home, "requirements-band")) add("overview-samples", plain(copy["samples.title"]) || { ru: "Подготовка и отправка образцов", kg: "Үлгүлөрдү даярдоо жана жөнөтүү", en: "Preparing and sending samples" }[locale], group("samples"), "index.html#requirements-band", "overview", "образцы пробы подготовить отправить упаковка prepare preparation send shipment samples sample packaging үлгү үлгүлөрдү даярдап даярдоо жөнөтөм жөнөтүү");
    if (visible(home, "faq")) for (const [index, pair] of (content.faqs?.[locale] || []).entries()) if (Array.isArray(pair)) add("faq-" + index, pair[0], pair[1], "index.html#faq", "faq");
    if (visible(home, "partners")) add("partners", plain(copy["partners.title"]) || "SAEL", (content.partners || []).filter(publicItem).map(item => plain(item.name)).join(" · "), "index.html#partners", "site", "partners clients партнёры клиенты өнөктөштөр кардарлар");
    if (visible(home, "contacts")) add("quote-request", plain(copy["form.eyebrow"] || copy["form.title"]), [plain(copy["form.fileNote"]), plain(copy["form.attach"]), plain(copy["quote.body"])].filter(Boolean).join(" · "), "index.html#request", "site", "техническое задание вложение файл размер запрос предложение technical specification attachment file size quote request document техникалык тапшырма файл өлчөм сунуш");
  }
  for (const service of services) {
    const page = servicePages.get(service.id), details = content.serviceContent?.[service.id]?.[locale] || {}, url = pageUrl(page);
    const body = [text(service.desc, locale), plain(details.lead), flatten(details.facts, locale)];
    if (visible(page, "detail-overview")) body.push(plain(details.overviewTitle), Array.isArray(details.overview) ? flatten(details.overview, locale) : text(service.method, locale));
    if (visible(page, "detail-methods")) body.push(plain(details.methodsTitle), flatten(details.methods, locale));
    if (visible(page, "detail-samples")) body.push(text(service.samples, locale), flatten(details.sampleTags, locale), Array.isArray(details.requirements) ? flatten(details.requirements, locale) : text(service.requirements, locale), plain(details.note));
    if (visible(page, "detail-result")) body.push(plain(details.result) || text(service.result, locale));
    if (visible(page, "detail-faq")) body.push(flatten(details.faq, locale));
    add("service-" + service.id, text(service.name, locale) || text(page.title, locale), body.filter(Boolean).join(" · "), url, "service", service.category);
  }
  const allPrices = (content.priceEntries || []).filter(publicItem), homePrices = visible(home, "price"), priceAccess = new Map();
  if (homePrices) for (const item of allPrices) priceAccess.set(item, "index.html?category=" + encodeURIComponent(item.category || "") + "#price");
  else for (const service of services) {
    const page = servicePages.get(service.id); if (!visible(page, "detail-pricing")) continue;
    const catalog = allPrices.filter(item => item.category === service.category), examples = service.id === "metallurgy" ? catalog.slice(-3) : catalog.slice(0, 3);
    for (const item of examples) if (!priceAccess.has(item)) priceAccess.set(item, pageUrl(page) + "#detail-pricing");
  }
  for (const [item, url] of priceAccess) {
    const detail = homePrices ? text(item.detailLocalized, locale) || text(content.priceTranslations?.details?.[item.detail], locale) || (locale === "en" ? plain(item.detail) : "") : "";
    const amount = text(item.amountLocalized, locale) || text(content.priceTranslations?.amounts?.[item.amount], locale) || plain(item.amount);
    add("price-" + (item.id || item.code || allPrices.indexOf(item)), text(item.title, locale), [plain(item.code), detail, amount, "USD", plain(copy["price.note"])].filter(Boolean).join(" · "), url, "price", plain(item.code));
  }
  if (about) {
    const details = content.aboutContent?.[locale] || {}, body = [plain(details.lead)];
    for (const [key, label] of [["registration", "one"], ["opening", "two"], ["samples", "three"]]) body.push([plain(copy["stat." + key + "Value"]), plain(copy["stat." + label])].filter(Boolean).join(" "));
    add("about", plain(details.title) || text(about.title, locale), body.filter(Boolean).join(" · "), "about.html");
    const map = [["company-overview", ["overviewTitle", "overview"]], ["company-history", ["historyTitle", "timeline"]], ["company-services", ["capabilitiesTitle", "capabilities"]], ["equipment", ["equipmentTitle", "equipmentIntro"]], ["company-quality", ["qualityTitle", "qualityText", "qualityBullets"]], ["company-next", ["ctaTitle", "ctaText"]]];
    for (const [target, keys] of map) if (visible(about, target)) {
      const values = keys.map(key => key === "capabilities" && Array.isArray(details[key]) ? flatten(details[key].map(item => Array.isArray(item) ? item.slice(0, 2) : item), locale) : flatten(details[key], locale));
      add("about-" + target, plain(details[keys[0]]) || text(about.title, locale), values.join(" · "), "about.html#" + target);
    }
  }
  const homeQuality = visible(home, "quality");
  if (homeQuality) for (const doc of (content.documents || []).filter(publicItem)) add("document-" + doc.id, text(doc.title, locale), text(doc.caption, locale), doc.url || "index.html#certificates", "document", "ISO 17025 17020 аккредитация сертификат certificate accreditation аттестат");
  const homeEquipment = visible(home, "equipment"), aboutEquipment = visible(about, "equipment");
  if (homeEquipment || aboutEquipment) for (const item of (content.equipment || []).filter(publicItem)) {
    if (!aboutEquipment && item.showOnHome === false) continue;
    add("equipment-" + item.id, plain(item.model), [plain(item.type), plain(item.manufacturer), text(item.description, locale)].filter(Boolean).join(" · "), aboutEquipment ? "about.html#equipment" : "index.html#equipment", "equipment");
  }
  for (const page of pages) {
    const blocks = visibleBlocks(page.blocks, locale);
    if (page.kind === "custom") add("page-" + page.id, text(page.title, locale), [text(page.description, locale), blocks].filter(Boolean).join(" · "), pageUrl(page));
    else if (blocks) add("page-blocks-" + page.id, text(page.title, locale), blocks, pageUrl(page));
    for (const section of sections.filter(section => aliases(page).includes(section.page) && publicItem(section))) {
      const body = visibleBlocks(section.blocks, locale); if (!body) continue;
      const target = section.targetId || section.id;
      // Duplicate target IDs follow the last record, exactly as the public renderer does.
      if (sectionFor(page, target) !== section) continue;
      add("section-" + section.id, text(section.title, locale) || text(page.title, locale), body, pageUrl(page) + "#" + encodeURIComponent(target));
    }
  }
  for (const article of content.assistant?.knowledge || []) if (publicItem(article) && article.status === "published") add("knowledge-" + article.id, text(article.title, locale), text(article.text, locale), "", "approved", plain(article.tags));
  return docs;
}
function retrieve(content, question, locale = "ru") {
  const source = plain(question), lower = source.toLowerCase();
  const specific = /(?:золот|алтын|gold|серебр|silver|күмүш|платин|platin|паллад|pallad|ICP[\s-]?(?:MS|AES|OES)|пробоподготов|sample preparation|metallurg|металлург|эколог|environment|inspection|инспек|флотац|flotat|выщелач|leach|\b(?:Au|Ag|Pt|Pd)\b|\bP\d[a-z]?\b|\b[FM]\d{2,}\b)/iu.test(source);
  const priceIntent = /(?:цен[аыуе]|прайс|расцен|стоимост|\bprices?\b|pricing|price[\s-]?list|\bcosts?\b|\brates?\b|баа|баасы|баалар)/iu.test(source);
  const sampleIntent = /(?:подгот|отправ|упаков|маркир|транспорт|prepare|preparation|send|ship|packag|label|даярд|жөнөт|таңгак)/iu.test(source) && /(?:проб|образ|sample|үлг)/iu.test(source);
  const choiceIntent = /(?:выбра|подобра|choos|select|танда|керектүү.*анализ)/iu.test(source) && !specific;
  const contactIntent = /(?:адрес|телефон|почт|\bemail\b|\baddress\b|\bcontacts?\b|\bphone\b|дарек|байланыш|где.{0,30}(?:наход|лаборат|sael)|where.{0,30}(?:laborator|sael)|кайдасыздар|кайда.{0,30}(?:лаборат|sael)|(?:лаборат|sael).{0,30}кайда)/iu.test(source);
  const hoursIntent = /(?:режим|график|час[ыа]|когда.{0,15}работ|opening|working hours|office hours|иш\s*убак)/iu.test(source);
  let aliases = "";
  if (contactIntent || hoursIntent) aliases += " address contacts hours график адрес телефон";
  if (priceIntent) aliases += " price prices прайс цены баа баалар бааларды";
  if (sampleIntent) aliases += " samples sample prepare preparation отправить образцы үлгүлөрдү даярдоо жөнөтүү";
  if (choiceIntent) aliases += " choose analysis услуги анализ тандоо";
  if (/(?:золот|алтын|\bgold\b|\bau\b)/iu.test(source)) aliases += " золото алтын gold Au";
  const query = tokens(lower + aliases), minimum = query.length > 2 ? 1.5 : 1;
  if (!query.length) return [];
  return buildKnowledge(content, locale).map(doc => {
    const hits = query.filter(word => doc.tokens.includes(word)).length;
    let score = query.reduce((sum, word) => sum + (doc.tokens.includes(word) ? word.length < 3 ? .5 : doc.titleTokens.includes(word) ? 1.5 : 1 : 0), 0);
    if (doc.kind === "approved" && score) score += .25;
    if (priceIntent && !specific && doc.id === "overview-prices") score += 7;
    if (sampleIntent && doc.id === "overview-samples") score += 4;
    if (sampleIntent && doc.id === "service-preparation") score += 3;
    if (choiceIntent && doc.id === "overview-services") score += 7;
    if ((contactIntent || hoursIntent) && doc.id === "contacts") score += 5;
    return { ...doc, score, hits };
  }).filter(doc => doc.score >= minimum && doc.hits >= (query.length > 2 ? 2 : 1)).sort((a, b) => b.score - a.score).slice(0, 6);
}
module.exports = { buildKnowledge, retrieve };
