"use strict";

// These labels also seed the CMS. Published translations can override them.
window.saelQuoteText = {
  ru: {
    title: "Запрос коммерческого предложения", analyses: "Исследования и объём работ",
    help: "Выберите анализы и укажите объём для каждой позиции. Если метод ещё не выбран, опишите задачу или приложите ТЗ.",
    find: "Поиск по названию или коду", searchHint: "Золото, Au-ICP21", all: "Все направления",
    found: "Найдено позиций", selected: "Позиций в заявке", add: "В заявку", remove: "Убрать",
    added: "Добавлено в заявку", removed: "Удалено из заявки", open: "Открыть заявку", quantity: "Количество", unit: "Единица объёма",
    sample: "Проба", test: "Испытание", batch: "Партия", kg: "кг", hour: "Час",
    description: "Задача или исследования вне списка", conditions: "Образцы и сроки", sampleTotal: "Всего образцов в партии",
    priority: "Срочность", standard: "В обычном порядке", urgent: "Требуется срочно", date: "Желаемая дата результата",
    urgentHint: "Специалист проверит возможность ускоренного анализа и укажет срок в предложении.",
    wishes: "Дополнительные пожелания", wishesHint: "Например, формат отчёта или особые условия передачи проб", contact: "Кому направить предложение",
    missing: "Выберите хотя бы один анализ, опишите задачу или приложите техническое задание.",
    changed: "Каталог изменился. Проверьте выбранные позиции по актуальному прайсу и повторите отправку. Нужную услугу также можно описать в поле для задачи.",
    unavailable: "Отсутствует в актуальном прайсе",
    invalidVolume: "Проверьте объём и единицу измерения в выбранных позициях.",
    tooMany: "В одну заявку можно включить до 150 позиций.", rateLimit: "Слишком много отправок подряд. Повторите попытку позже.",
    accepted: "Заявка принята. Специалист SAEL свяжется с вами.", reference: "Номер заявки"
  },
  kg: {
    title: "Коммерциялык сунушка өтүнмө", analyses: "Изилдөөлөр жана иштин көлөмү",
    help: "Анализдерди тандап, ар бири үчүн көлөмүн көрсөтүңүз. Эгер ыкманы тандай элек болсоңуз, тапшырмаңызды жазыңыз же техникалык тапшырманы тиркеңиз.",
    find: "Аталышы же коду боюнча издөө", searchHint: "Алтын, Au-ICP21", all: "Бардык багыттар",
    found: "Табылган позициялар", selected: "Өтүнмөдөгү позициялар", add: "Кошуу", remove: "Алып салуу",
    added: "Өтүнмөгө кошулду", removed: "Өтүнмөдөн алынды", open: "Өтүнмөнү ачуу", quantity: "Саны же көлөмү", unit: "Өлчөө бирдиги",
    sample: "Үлгү", test: "Сыноо", batch: "Партия", kg: "кг", hour: "Саат",
    description: "Тапшырма же тизмеде жок изилдөөлөр", conditions: "Үлгүлөр жана мөөнөттөр", sampleTotal: "Партиядагы үлгүлөрдүн жалпы саны",
    priority: "Шашылыштыгы", standard: "Кадимки тартипте", urgent: "Шашылыш", date: "Жыйынтык керек болгон күн",
    urgentHint: "Адис анализди тездетүү мүмкүнчүлүгүн текшерип, мөөнөтүн сунушта көрсөтөт.",
    wishes: "Кошумча өтүнүчтөр", wishesHint: "Мисалы, отчёттун форматы же үлгүлөрдү өткөрүп берүү шарттары", contact: "Сунушту кимге жөнөтөбүз",
    missing: "Жок дегенде бир анализди тандаңыз, тапшырмаңызды жазыңыз же техникалык тапшырманы тиркеңиз.",
    changed: "Каталог өзгөрдү. Тандалган позицияларды учурдагы прейскуранттан текшерип, кайра жөнөтүңүз. Кызматты тапшырма талаасында да сүрөттөсөңүз болот.",
    unavailable: "Учурдагы прейскурантта жок",
    invalidVolume: "Тандалган позициялардын көлөмүн жана өлчөө бирдигин текшериңиз.",
    tooMany: "Бир өтүнмөгө 150гө чейин позиция кошсо болот.", rateLimit: "Кыска убакытта өтө көп өтүнмө жөнөтүлдү. Кийинчерээк кайра аракет кылыңыз.",
    accepted: "Өтүнмө кабыл алынды. SAEL адиси сиз менен байланышат.", reference: "Өтүнмөнүн номери"
  },
  en: {
    title: "Request a quotation", analyses: "Analyses and quantities",
    help: "Select analyses and enter the quantity for each. If you need help choosing a method, describe the task or attach your specifications.",
    find: "Search by name or code", searchHint: "Gold, Au-ICP21", all: "All categories",
    found: "Matching items", selected: "Items in your request", add: "Add to request", remove: "Remove",
    added: "Added to request", removed: "Removed from request", open: "View request", quantity: "Quantity", unit: "Unit of quantity",
    sample: "Sample", test: "Test", batch: "Batch", kg: "kg", hour: "Hour",
    description: "Project details or analyses outside the list", conditions: "Samples and timing", sampleTotal: "Total samples in shipment",
    priority: "Priority", standard: "Standard", urgent: "Urgent", date: "Preferred results date",
    urgentHint: "A specialist will check availability for expedited analysis and confirm the turnaround in your quotation.",
    wishes: "Additional requirements", wishesHint: "For example, reporting format or special sample delivery requirements", contact: "Quotation recipient",
    missing: "Choose at least one analysis, describe your task or attach a specification.",
    changed: "The catalogue has changed. Check your selection against the current price list and send again. You can also describe the service in the project details.",
    unavailable: "Unavailable in the current price list",
    invalidVolume: "Check the quantity and unit for each selected item.",
    tooMany: "A request can include up to 150 items.", rateLimit: "Too many requests in a short time. Please try again later.",
    accepted: "Request received. A SAEL specialist will contact you.", reference: "Request number"
  }
};

window.saelCreateQuoteBuilder = function ({form, entries, categories, language, translate}) {
  const selected = new Map();
  const units = ["sample", "test", "kg", "hour", "batch"];
  const picker = form.querySelector("#quote-picker");
  const search = form.querySelector("#quote-search");
  const category = form.querySelector("#quote-category");
  const results = form.querySelector("#quote-matches");
  const selection = form.querySelector("#quote-selection");
  const lines = form.querySelector("#quote-lines");
  const announcement = form.querySelector("#quote-announcement");
  const urgency = form.elements.urgency;
  const priceLink = document.getElementById("price-selection-link");
  const text = key => translate("rfq." + key);
  const title = item => item.title?.[language()] || item.title?.ru || item.code || item.id;
  const entryFor = id => entries.find(item => item.id === id);
  const availableCategories = () => [...new Set(entries.filter(item => item.id).map(item => item.category))];
  const categoryName = key => categories[language()]?.[key] || categories.ru?.[key] || key;
  const node = (tag, value = "", className = "") => {
    const el = document.createElement(tag);
    if (value) el.textContent = value;
    if (className) el.className = className;
    return el;
  };
  const option = (label, value) => new Option(label, value);
  function action(label, item, className) {
    const button = node("button", label, className);
    button.type = "button";
    button.dataset.quoteItem = item.id;
    button.setAttribute("aria-label", label + " · " + title(item));
    return button;
  }
  function itemName(item) {
    const name = node("div", "", "quote-item-name");
    name.append(node("strong", title(item)));
    if (item.code) name.append(node("small", item.code));
    return name;
  }
  function renderMatches() {
    const term = search.value.trim().toLocaleLowerCase();
    results.hidden = !term && !category.value;
    results.replaceChildren();
    if (results.hidden) return;
    const matches = entries.filter(item => item.id && (!category.value || item.category === category.value) &&
      (!term || [title(item), item.code, categoryName(item.category)].join(" ").toLocaleLowerCase().includes(term)));
    results.append(node("p", matches.length ? text("found") + " · " + matches.length : translate("price.empty"), "quote-result-count"));
    if (!matches.length) return;
    const list = node("ul", "", "quote-result-list");
    for (const item of matches) {
      const row = node("li");
      const added = selected.has(item.id);
      const button = action(text(added ? "remove" : "add"), item, "quote-action");
      if (added) button.classList.add("is-selected");
      row.append(itemName(item), button);
      list.append(row);
    }
    results.append(list);
  }
  function labeledControl(caption, field, item) {
    const label = node("label");
    field.setAttribute("aria-label", caption + " · " + title(item));
    label.append(node("span", caption), field);
    return label;
  }
  function restrictQuantity(input, unit) {
    const fractional = unit === "kg" || unit === "hour";
    input.step = fractional ? "0.001" : "1";
    input.min = input.step;
    input.inputMode = fractional ? "decimal" : "numeric";
  }
  function renderLines() {
    selection.hidden = !selected.size;
    document.getElementById("quote-selected-title").textContent = text("selected") + " · " + selected.size;
    lines.replaceChildren();
    for (const [id, line] of selected) {
      const row = node("li", "", "quote-line");
      const publishedItem = entryFor(id);
      if (publishedItem) line.item = publishedItem;
      const heading = node("div", "", "quote-line-head");
      heading.append(itemName(line.item), action(text("remove"), line.item, "quote-remove"));
      const quantity = node("input");
      quantity.dataset.quantity = id;
      quantity.type = "number";
      quantity.max = "1000000";
      quantity.required = true;
      restrictQuantity(quantity, line.unit);
      quantity.value = line.quantity;
      const unit = node("select");
      unit.dataset.unit = id;
      unit.replaceChildren(...units.map(value => option(text(value), value)));
      unit.value = line.unit;
      const controls = node("div", "", "quote-line-controls");
      controls.append(labeledControl(text("quantity"), quantity, line.item), labeledControl(text("unit"), unit, line.item));
      row.append(heading);
      if (!publishedItem) row.append(node("p", text("unavailable"), "quote-unavailable"));
      row.append(controls);
      lines.append(row);
    }
  }
  function syncPrice() {
    if (priceLink) {
      priceLink.hidden = !selected.size || priceLink.dataset.cmsUnavailableLink === "true";
      priceLink.textContent = text("open") + " (" + selected.size + ") →";
    }
    document.querySelectorAll(".table-request[data-quote-item]").forEach(link => {
      const item = entryFor(link.dataset.quoteItem);
      if (!item) return;
      const alreadySelected = selected.has(item.id);
      const label = text(alreadySelected ? "open" : "add");
      if (alreadySelected) link.removeAttribute("role");
      else link.setAttribute("role", "button");
      link.textContent = label;
      link.setAttribute("aria-label", label + " · " + title(item));
    });
  }
  function toggle(id) {
    const current = selected.get(id);
    const item = current?.item || entryFor(id);
    if (!item) return;
    if (current) selected.delete(id);
    else {
      if (selected.size >= 150) { announcement.textContent = text("tooMany"); return; }
      selected.set(id, {item, unit: "sample", quantity: "1"});
    }
    renderLines();
    renderMatches();
    syncPrice();
    announcement.textContent = text(current ? "removed" : "added") + " · " + title(item);
  }
  function render() {
    const active = document.activeElement;
    const focusedList = lines.contains(active) ? lines : results.contains(active) ? results : null;
    const focusedKey = focusedList && ["quantity", "unit", "quoteItem"].find(key => active.dataset[key]);
    const focusedId = focusedKey && active.dataset[focusedKey];
    picker.hidden = !entries.some(item => item.id);
    const saved = category.value;
    category.replaceChildren(option(text("all"), ""), ...availableCategories().map(key => option(categoryName(key), key)));
    category.value = saved;
    renderMatches();
    renderLines();
    syncPrice();
    document.getElementById("quote-urgent-hint").hidden = urgency.value !== "urgent";
    if (focusedId) {
      const replacement = [...focusedList.querySelectorAll("input,select,button")].find(field => field.dataset[focusedKey] === focusedId);
      (replacement || search).focus({preventScroll:true});
    }
  }

  search.addEventListener("input", renderMatches);
  category.addEventListener("change", renderMatches);
  results.addEventListener("click", event => {
    const button = event.target.closest("button[data-quote-item]");
    if (!button) return;
    const id = button.dataset.quoteItem;
    toggle(id);
    Array.from(results.querySelectorAll("button")).find(candidate => candidate.dataset.quoteItem === id)?.focus({preventScroll: true});
  });
  lines.addEventListener("input", event => {
    const id = event.target.dataset.quantity;
    if (selected.has(id)) selected.get(id).quantity = event.target.value;
  });
  lines.addEventListener("change", event => {
    const id = event.target.dataset.unit;
    if (!selected.has(id)) return;
    selected.get(id).unit = event.target.value;
    restrictQuantity(event.target.closest("li").querySelector("input"), event.target.value);
  });
  lines.addEventListener("click", event => {
    const button = event.target.closest("button[data-quote-item]");
    if (!button) return;
    const index = [...lines.children].indexOf(button.closest("li"));
    toggle(button.dataset.quoteItem);
    (lines.children[Math.min(index, lines.children.length - 1)]?.querySelector("button") || search).focus();
  });
  const priceTable = document.getElementById("price-body");
  priceTable?.addEventListener("keydown", event => {
    if (event.key !== " " || !event.target.matches('.table-request[role="button"]')) return;
    event.preventDefault();
    event.target.click();
  });
  priceTable?.addEventListener("click", event => {
    const link = event.target.closest(".table-request[data-quote-item]");
    if (!link || !link.dataset.quoteItem || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (form.querySelector('button[type="submit"]').disabled) { event.preventDefault(); return; }
    if (!selected.has(link.dataset.quoteItem)) {
      event.preventDefault();
      toggle(link.dataset.quoteItem);
    }
  });
  urgency.addEventListener("change", () => {
    document.getElementById("quote-urgent-hint").hidden = urgency.value !== "urgent";
  });
  return {
    render, syncPrice,
    hasUnavailable: () => [...selected.keys()].some(id => !entryFor(id)),
    items: () => Array.from(selected, ([id, line]) => ({id, quantity: Number(line.quantity), unit: line.unit})),
    reset() { selected.clear(); category.value = ""; search.value = ""; announcement.textContent = ""; render(); },
    chooseCategory(key) { if (availableCategories().includes(key)) { category.value = key; renderMatches(); } }
  };
};
