/* SAEL visitor assistant: consent-gated conversations and explicit staff handoff. */
(function () {
  "use strict";
  if (window.saelAssistantMounted || !["http:", "https:"].includes(location.protocol)) return;
  window.saelAssistantMounted = true;
  const STORAGE_KEY = "sael-assistant-session-v1", MAX_TEXT = 1500;
  const copy = {
    ru: {
      launcher: "Помощник SAEL", close: "Свернуть чат", title: "Помощник SAEL", ai: "ИИ-помощник", knowledge: "Справочник SAEL", staff: "Специалист SAEL", you: "Вы", system: "Статус обращения", sources: "Источники", welcome: "Помогу найти услугу, расценки и требования к образцам. При необходимости вопрос можно передать специалисту SAEL.",
      disclosureAi: "Это ИИ-помощник. Для подготовки ответов сообщения передаются OpenAI и сохраняются в истории обращения SAEL.", disclosureKnowledge: "Ответы подбираются из материалов SAEL. Сообщения сохраняются в истории обращения.", consent: "Согласен на обработку сообщений для ответа на мой вопрос.", question: "Ваш вопрос", placeholder: "Услуга, метод, материал или требования к образцам…", send: "Отправить", sending: "Отправляем…", thinking: "Готовим ответ…", suggestLabel: "С чего начать", suggestions: ["Как выбрать нужный анализ?", "Где посмотреть цены?", "Как подготовить и отправить образцы?"],
      human: "Связаться со специалистом", humanNeeded: "Для этого вопроса полезна консультация специалиста SAEL.", online: "Специалисты доступны", offline: "Можно оставить запрос на ответ", hours: "Время работы специалистов", bishkek: "Бишкек", weekdays: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"], contacts: "Контакты лаборатории", phone: "Позвонить", email: "Написать в лабораторию",
      handoffTitle: "Передать вопрос специалисту", handoffLive: "Запрос поступит в очередь специалистов. Ответ появится в этом чате после подключения сотрудника.", handoffOffline: "Сейчас сотрудник не подключён. Оставьте email или телефон, чтобы SAEL мог ответить в рабочее время.", name: "Ваше имя", emailField: "Email", phoneField: "Телефон", contactRequired: "Укажите email или телефон для ответа.", nameRequired: "Укажите ваше имя.", handoffConsent: "Согласен передать указанные контакты и историю обращения специалисту SAEL для ответа.", handoffSubmit: "Передать запрос", handoffSending: "Передаём…", cancel: "Отмена",
      waiting: "Запрос передан в очередь специалистов. Ответ появится здесь, когда сотрудник подключится.", active: "К диалогу подключился специалист SAEL.", staffAway: "Сейчас сотрудник не подключён. Диалог сохранён; можно оставить контакт для ответа специалиста.", callback: "Запрос сохранён. SAEL сможет ответить в рабочее время по указанным контактам.", closed: "Диалог завершён. Для нового вопроса начните новый диалог.", end: "Завершить диалог", endTitle: "Завершить этот диалог?", endDescription: "После завершения отправлять сообщения в этот диалог будет нельзя.", endConfirm: "Завершить", newChat: "Новый диалог", unavailable: "Помощник временно недоступен. Свяжитесь с лабораторией напрямую.", error: "Не удалось выполнить запрос. Попробуйте ещё раз или свяжитесь с лабораторией.", expired: "Сессия диалога истекла. Начните новый диалог и подтвердите согласие на обработку сообщений.", rateLimited: "Слишком много запросов. Попробуйте через некоторое время.", inProgress: "Предыдущий ответ ещё готовится. Подождите немного.", noQuestion: "Введите вопрос.", consentRequired: "Подтвердите согласие на обработку сообщений.", handoffConsentRequired: "Подтвердите согласие на передачу контактов специалисту.", note: "Метод, срок и итоговую стоимость подтвердит специалист SAEL.", loading: "Загружаем диалог…", notSent: "Сообщение не отправлено.", minimizeHint: "Закрытие окна сворачивает чат и сохраняет диалог в этой вкладке."
    },
    kg: {
      launcher: "SAEL жардамчысы", close: "Чатты жыйноо", title: "SAEL жардамчысы", ai: "ЖИ жардамчысы", knowledge: "SAEL маалымдамасы", staff: "SAEL адиси", you: "Сиз", system: "Кайрылуунун абалы", sources: "Булактар", welcome: "Кызматты, бааларды жана үлгүлөргө талаптарды табууга жардам берем. Зарыл болсо, суроону SAEL адисине өткөрүүгө болот.",
      disclosureAi: "Бул — ЖИ жардамчысы. Жооп даярдоо үчүн билдирүүлөр OpenAI кызматына жөнөтүлөт жана SAEL кайрылуусунун тарыхында сакталат.", disclosureKnowledge: "Жооптор SAEL материалдарынан тандалат. Билдирүүлөр кайрылуунун тарыхында сакталат.", consent: "Суроомо жооп берүү үчүн билдирүүлөрүмдү иштетүүгө макулмун.", question: "Сурооңуз", placeholder: "Кызмат, метод, материал же үлгүлөргө талаптар…", send: "Жөнөтүү", sending: "Жөнөтүлүүдө…", thinking: "Жооп даярдалууда…", suggestLabel: "Эмнеден баштоо керек", suggestions: ["Керектүү анализди кантип тандайм?", "Бааларды кайдан көрүүгө болот?", "Үлгүлөрдү кантип даярдап, жөнөтөм?"],
      human: "Адиске кайрылуу", humanNeeded: "Бул суроо боюнча SAEL адиси менен кеңешүү пайдалуу.", online: "Адистер жеткиликтүү", offline: "Жооп алуу үчүн суроо калтырсаңыз болот", hours: "Адистердин иш убактысы", bishkek: "Бишкек", weekdays: ["Жк", "Дш", "Шш", "Шр", "Бш", "Жм", "Иш"], contacts: "Лабораториянын байланыштары", phone: "Чалуу", email: "Лабораторияга жазуу",
      handoffTitle: "Суроону адиске өткөрүү", handoffLive: "Кайрылуу адистердин кезегине берилет. Кызматкер кошулганда жооп ушул чатта көрүнөт.", handoffOffline: "Азыр кызматкер чатка кошулган эмес. SAEL иш убактысында жооп бере алышы үчүн email же телефон калтырыңыз.", name: "Атыңыз", emailField: "Email", phoneField: "Телефон", contactRequired: "Жооп үчүн email же телефон көрсөтүңүз.", nameRequired: "Атыңызды көрсөтүңүз.", handoffConsent: "Жооп алуу үчүн байланыштарымды жана кайрылуунун тарыхын SAEL адисине өткөрүүгө макулмун.", handoffSubmit: "Кайрылууну өткөрүү", handoffSending: "Өткөрүлүүдө…", cancel: "Жокко чыгаруу",
      waiting: "Кайрылуу адистердин кезегине берилди. Кызматкер кошулганда жооп ушул жерде көрүнөт.", active: "Диалогго SAEL адиси кошулду.", staffAway: "Азыр кызматкер чатка кошулган эмес. Диалог сакталды; жооп үчүн байланыш калтырууга болот.", callback: "Кайрылуу сакталды. SAEL көрсөтүлгөн байланыштар аркылуу иш убактысында жооп бере алат.", closed: "Диалог аяктады. Жаңы суроо үчүн жаңы диалог баштаңыз.", end: "Диалогду аяктоо", endTitle: "Бул диалогду аяктайсызбы?", endDescription: "Аяктагандан кийин бул диалогго билдирүү жөнөтүү мүмкүн болбойт.", endConfirm: "Аяктоо", newChat: "Жаңы диалог", unavailable: "Жардамчы убактылуу жеткиликсиз. Лаборатория менен түз байланышыңыз.", error: "Сурам аткарылган жок. Кайра аракет кылыңыз же лаборатория менен байланышыңыз.", expired: "Диалогдун сессиясы бүттү. Жаңы диалог баштап, билдирүүлөрдү иштетүүгө макулдугуңузду ырастаңыз.", rateLimited: "Сурамдар өтө көп. Бир аздан кийин кайра аракет кылыңыз.", inProgress: "Мурунку жооп даярдалып жатат. Бир аз күтүңүз.", noQuestion: "Суроо жазыңыз.", consentRequired: "Билдирүүлөрдү иштетүүгө макулдугуңузду ырастаңыз.", handoffConsentRequired: "Байланыштарды адиске өткөрүүгө макулдугуңузду ырастаңыз.", note: "Методду, мөөнөттү жана акыркы бааны SAEL адиси ырастайт.", loading: "Диалог жүктөлүүдө…", notSent: "Билдирүү жөнөтүлгөн жок.", minimizeHint: "Терезени жабуу чатты жыйнайт жана диалогду ушул өтмөктө сактайт."
    },
    en: {
      launcher: "SAEL assistant", close: "Minimize chat", title: "SAEL assistant", ai: "AI assistant", knowledge: "SAEL knowledge base", staff: "SAEL specialist", you: "You", system: "Conversation status", sources: "Sources", welcome: "I can help you find services, prices and sample requirements. You can also refer your question to a SAEL specialist.",
      disclosureAi: "This is an AI assistant. Messages are sent to OpenAI to prepare replies and saved in your SAEL conversation history.", disclosureKnowledge: "Replies are selected from SAEL materials. Messages are saved in the conversation history.", consent: "I agree to the processing of my messages to answer my question.", question: "Your question", placeholder: "Service, method, material or sample requirements…", send: "Send", sending: "Sending…", thinking: "Preparing a reply…", suggestLabel: "Where to start", suggestions: ["How do I choose an analysis?", "Where can I find the prices?", "How do I prepare and send samples?"],
      human: "Contact a specialist", humanNeeded: "A SAEL specialist can help with this question.", online: "Specialists are available", offline: "You can leave a request for a reply", hours: "Specialist working hours", bishkek: "Bishkek", weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], contacts: "Laboratory contacts", phone: "Call the laboratory", email: "Email the laboratory",
      handoffTitle: "Refer your question to a specialist", handoffLive: "Your request will join the specialists’ queue. Their reply will appear here after a staff member joins.", handoffOffline: "No staff member is connected right now. Leave an email address or phone number so SAEL can reply during working hours.", name: "Your name", emailField: "Email", phoneField: "Phone", contactRequired: "Provide an email address or phone number for the reply.", nameRequired: "Enter your name.", handoffConsent: "I agree to share these contact details and the conversation history with a SAEL specialist for a reply.", handoffSubmit: "Send the request", handoffSending: "Sending…", cancel: "Cancel",
      waiting: "Your request is in the specialists’ queue. A reply will appear here when a staff member joins.", active: "A SAEL specialist has joined the conversation.", staffAway: "No staff member is connected right now. Your conversation is saved; you can leave contact details for a reply.", callback: "Your request has been saved. SAEL can reply during working hours using the contact details provided.", closed: "This conversation has ended. Start a new conversation for another question.", end: "End conversation", endTitle: "End this conversation?", endDescription: "You will no longer be able to send messages in this conversation.", endConfirm: "End conversation", newChat: "New conversation", unavailable: "The assistant is temporarily unavailable. Please contact the laboratory directly.", error: "The request could not be completed. Try again or contact the laboratory.", expired: "Your conversation session has expired. Start a new conversation and confirm your consent to message processing.", rateLimited: "Too many requests. Please try again in a moment.", inProgress: "The previous reply is still being prepared. Please wait a moment.", noQuestion: "Enter a question.", consentRequired: "Confirm your consent to message processing.", handoffConsentRequired: "Confirm your consent to share the contact details with a specialist.", note: "A SAEL specialist will confirm the method, turnaround and final price.", loading: "Loading conversation…", notSent: "The message was not sent.", minimizeHint: "Closing this window minimizes the chat and keeps the conversation in this tab."
    }
  };
  const state = { config: null, open: false, id: "", token: "", conversation: null, busy: false, creating: false, creation: null, restoring: false, poll: null, pollBusy: false, generation: 0, errorKey: "", errorText: "", consent: false, handoffOpen: false, endOpen: false, handoffBusy: false, ending: false, messageSignature: "", lastConfig: 0, form: { name: "", email: "", phone: "", consent: false } };
  const refs = {};
  function lang() { const value = typeof document!=="undefined" ? document.documentElement?.lang : "ru"; return value === "ky" || value === "kg" ? "kg" : value === "en" ? "en" : "ru"; }
  function t(key) { return copy[lang()][key] || copy.ru[key] || key; }
  function localized(value, fallback) { return typeof value === "string" ? value : value && (value[lang()] || value.ru || value.en) || fallback || ""; }
  function node(tag, className, text) { const result = document.createElement(tag); if (className) result.className = className; if (text !== undefined) result.textContent = text; return result; }
  function button(className, action) { const result = node("button", className); result.type = "button"; result.addEventListener("click", action); return result; }
  function safeSource(value) { try { const url = new URL(String(value || ""), document.baseURI); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : ""; } catch { return ""; } }
  function sessionWrite() { try { if (state.id && state.token) sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id: state.id, token: state.token })); else sessionStorage.removeItem(STORAGE_KEY); } catch {} }
  function sessionRead() { try { const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null"); if (value && typeof value.id === "string" && typeof value.token === "string" && value.id.length < 200 && value.token.length < 500) { state.id = value.id; state.token = value.token; } } catch { try { sessionStorage.removeItem(STORAGE_KEY); } catch {} } }
  function stopPolling() { if (state.poll) clearTimeout(state.poll); state.poll = null; }
  function clearConversation() { state.generation++; state.id = ""; state.token = ""; state.conversation = null; state.consent = false; state.handoffOpen = false; state.endOpen = false; state.messageSignature = ""; state.form = { name: "", email: "", phone: "", consent: false }; stopPolling(); sessionWrite(); }
  function expire() { clearConversation(); state.errorKey = "expired"; state.errorText = ""; render(); }
  function errorFor(error) { if (error.status === 429) return "rateLimited"; if (error.code === "message_in_progress") return "inProgress"; if (error.code === "consent_required") return "consentRequired"; return "error"; }
  async function request(path, options) {
    const privateCall = path.startsWith("/api/assistant/conversations/");
    const settings = { method: "GET", credentials: "omit", cache: "no-store", ...options, headers: { Accept: "application/json", ...(privateCall && state.token ? { "X-Chat-Token": state.token } : {}), ...(options?.headers || {}) } };
    if (settings.body && typeof settings.body !== "string") { settings.body = JSON.stringify(settings.body); settings.headers["Content-Type"] = "application/json"; }
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 45000);
    settings.signal = controller.signal;
    try {
      const response = await fetch(path, settings); let data = {};
      try { data = await response.json(); } catch {}
      if (!response.ok) { const error = new Error("assistant_request_failed"); error.status = response.status; error.code = data.error || data.code || ""; throw error; }
      return data;
    } finally { clearTimeout(timer); }
  }
  function acceptConversation(value) {
    const conversation = value?.conversation || value;
    if (!conversation || !Array.isArray(conversation.messages)) return;
    if (state.id && conversation.id && state.id !== conversation.id) return;
    const current = state.conversation;
    if (current && Date.parse(conversation.updatedAt) < Date.parse(current.updatedAt)) return;
    if (current && conversation.updatedAt === current.updatedAt && conversation.messages.length < current.messages.length) return;
    state.conversation = conversation; state.id = conversation.id || state.id; sessionWrite();
  }
  async function refreshConfig() { const result = await request("/api/assistant/config"); state.config = result.settings ? { ...result.settings, ...result } : result; state.lastConfig = Date.now(); }
  function staffAvailable() { if (state.conversation?.callbackSuggested || state.conversation?.status === "active" && state.conversation.staffConnected === false) return false; return typeof state.conversation?.staffAvailable === "boolean" ? state.conversation.staffAvailable : !!(state.config?.isWorkingHours && state.config?.staffOnline); }
  async function refreshConversation() {
    if (!state.id || !state.token) return;
    const generation = state.generation, id = state.id;
    try { const result = await request("/api/assistant/conversations/" + encodeURIComponent(id)); if (generation === state.generation && id === state.id) acceptConversation(result); }
    catch (error) { if ((error.status === 401 || error.status === 404) && generation === state.generation) expire(); else throw error; }
  }
  function schedulePoll() {
    stopPolling();
    if (!state.open || document.hidden || !state.id || !state.token || state.conversation?.status === "closed") return;
    state.poll = setTimeout(async function () {
      state.poll = null;
      if (!state.open || state.busy || state.handoffBusy || state.ending || state.pollBusy || document.hidden) { schedulePoll(); return; }
      state.pollBusy = true;
      try { if (Date.now() - state.lastConfig > 30000) await refreshConfig(); await refreshConversation(); render(); }
      catch { /* Keep the conversation and draft available during a temporary polling failure. */ }
      finally { state.pollBusy = false; schedulePoll(); }
    }, 5000);
  }
  function statusText() {
    const status = state.conversation?.status;
    if (["active", "waiting"].includes(status) && (state.conversation?.callbackSuggested || status === "active" && state.conversation.staffConnected === false)) return t("staffAway");
    if (["waiting", "active", "callback", "closed"].includes(status)) return t(status);
    if (state.restoring) return t("loading");
    if (state.busy) return t("thinking");
    if (state.config?.enabled === false) return t("unavailable");
    if (state.conversation?.needsHuman || state.conversation?.messages.some(message => message.needsHuman)) return t("humanNeeded");
    return "";
  }
  function hoursText() {
    const hours = state.config?.hours || {}, days = Array.isArray(hours.weekdays) ? hours.weekdays.filter(day => Number.isInteger(day) && day >= 0 && day <= 6) : [1, 2, 3, 4, 5];
    const names = t("weekdays"); const consecutive = days.length > 1 && days.every((day, index) => index === 0 || day === days[index - 1] + 1);
    const dayText = consecutive ? names[days[0]] + "–" + names[days.at(-1)] : days.map(day => names[day]).join(", ");
    return dayText + " · " + String(hours.start || "08:00") + "–" + String(hours.end || "17:00") + ", " + (hours.timezone === "Asia/Bishkek" || !hours.timezone ? t("bishkek") : hours.timezone);
  }
  function renderContacts() {
    refs.contacts.replaceChildren();
    const settings = state.config || {}, phone = String(settings.phone || "+996 3133 31925"), email = String(settings.email || "sael.karabalta@saelglobal.com");
    const title = node("p", "sael-assistant-contacts-title", t("contacts")); refs.contacts.append(title);
    const links = node("div", "sael-assistant-contact-links");
    const number = phone.replace(/[^+0-9]/g, "");
    if (/^\+?[0-9]{5,20}$/.test(number)) { const link = node("a", "", phone); link.href = "tel:" + number; link.setAttribute("aria-label", t("phone") + ": " + phone); links.append(link); }
    if (/^[^\s@?\r\n]+@[^\s@?\r\n]+\.[^\s@?\r\n]+$/.test(email)) { const link = node("a", "", email); link.href = "mailto:" + email; link.setAttribute("aria-label", t("email") + ": " + email); links.append(link); }
    refs.contacts.append(links);
  }
  function renderMessages() {
    const messages = state.conversation?.messages || [], signature = lang() + ":" + JSON.stringify(messages);
    if (state.messageSignature === signature) return;
    state.messageSignature = signature;
    const nearBottom = refs.scroll.scrollHeight - refs.scroll.scrollTop - refs.scroll.clientHeight < 140;
    refs.log.replaceChildren();
    for (const message of messages) {
      const actor = message.actor || message.role || "assistant";
      const row = node("article", "sael-assistant-message sael-assistant-message-" + (["user", "assistant", "staff", "system"].includes(actor) ? actor : "assistant"));
      const mode = message.mode || state.conversation?.mode;
      const caption = actor === "user" ? t("you") : actor === "staff" ? t("staff") : actor === "system" ? t("system") : mode === "knowledge" ? t("knowledge") : mode === "ai" ? t("ai") : t("launcher");
      const header = node("div", "sael-assistant-message-meta"); header.append(node("b", "", caption));
      const date = new Date(message.createdAt);
      if (!Number.isNaN(date.getTime())) { const stamp = node("time"); stamp.dateTime = date.toISOString(); try { stamp.textContent = new Intl.DateTimeFormat(lang() === "kg" ? "ky-KG" : lang(), { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bishkek" }).format(date); } catch { stamp.textContent = ""; } header.append(stamp); }
      const body = node("div", "sael-assistant-message-text", String(message.text || "")); row.append(header, body);
      if (Array.isArray(message.sources) && message.sources.length) {
        const sources = node("div", "sael-assistant-sources"); sources.append(node("span", "", t("sources")));
        for (const source of message.sources) { const href = safeSource(source.url); if (!href) continue; const link = node("a", "", localized(source.title, href)); link.href = href; link.target = "_blank"; link.rel = "noopener noreferrer"; sources.append(link); }
        if (sources.childNodes.length > 1) row.append(sources);
      }
      refs.log.append(row);
    }
    if (nearBottom || state.busy) refs.scroll.scrollTop = refs.scroll.scrollHeight;
  }
  function render() {
    if (!refs.root || typeof document==="undefined" || !document.documentElement) return;
    const closed = state.conversation?.status === "closed", hasConversation = !!state.conversation;
    refs.root.lang = lang() === "kg" ? "ky" : lang();
    refs.launcherLabel.textContent = t("launcher"); refs.launcher.setAttribute("aria-label", t("launcher")); refs.launcher.setAttribute("aria-expanded", String(state.open));
    refs.panel.hidden = !state.open; refs.launcher.hidden = state.open;
    refs.title.textContent = localized(state.config?.title, t("title")); refs.close.setAttribute("aria-label", t("close")); refs.close.title = t("minimizeHint");
    refs.mode.textContent = state.conversation?.status === "active" && state.conversation.staffConnected !== false ? t("staff") : state.config?.aiConfigured ? t("ai") : t("knowledge");
    refs.availability.textContent = staffAvailable() ? t("online") : t("offline"); refs.availability.classList.toggle("is-online", staffAvailable());
    refs.hoursLabel.textContent = t("hours"); refs.hours.textContent = hoursText();
    refs.welcome.textContent = localized(state.config?.welcome, t("welcome")); refs.welcome.hidden = hasConversation;
    refs.disclosure.textContent = state.config?.aiConfigured ? t("disclosureAi") : t("disclosureKnowledge"); refs.disclosure.hidden = hasConversation;
    refs.consentRow.hidden = hasConversation; refs.consentLabel.textContent = t("consent"); refs.consent.checked = state.consent;
    refs.suggestions.hidden = hasConversation; refs.suggestions.setAttribute("aria-label", t("suggestLabel"));
    if (refs.suggestions.dataset.locale !== lang()) { refs.suggestions.dataset.locale = lang(); refs.suggestions.replaceChildren(); for (const question of t("suggestions")) { const suggestion = button("sael-assistant-suggestion", function () { refs.input.value = question; inputChanged(); refs.input.focus(); }); suggestion.textContent = question; refs.suggestions.append(suggestion); } }
    const status = statusText(); refs.status.textContent = status; refs.status.hidden = !status;
    refs.error.textContent = state.errorText || (state.errorKey ? t(state.errorKey) : ""); refs.error.hidden = !refs.error.textContent;
    refs.label.textContent = t("question"); refs.input.placeholder = t("placeholder"); refs.send.textContent = state.busy ? t("sending") : t("send");
    refs.input.disabled = closed || state.restoring || state.creating || state.config?.enabled === false; refs.send.disabled = state.busy || state.creating || state.restoring || closed || state.config?.enabled === false || (!hasConversation && !state.consent) || !refs.input.value.trim();
    refs.compose.setAttribute("aria-busy", String(state.busy)); refs.counter.textContent = refs.input.value.length + " / " + MAX_TEXT; refs.note.textContent = t("note");
    refs.human.textContent = t("human"); refs.human.hidden = closed || ["active", "waiting"].includes(state.conversation?.status) && !state.conversation?.callbackSuggested && !(state.conversation?.status === "active" && state.conversation.staffConnected === false); refs.human.disabled = state.busy || state.creating || state.handoffBusy || state.restoring || state.config?.enabled === false;
    refs.end.textContent = t("end"); refs.end.hidden = !hasConversation || closed; refs.end.disabled = state.busy || state.handoffBusy || state.ending;
    refs.newChat.textContent = t("newChat"); refs.newChat.hidden = !closed;
    refs.handoff.hidden = !state.handoffOpen; refs.handoffTitle.textContent = t("handoffTitle"); refs.handoffIntro.textContent = staffAvailable() ? t("handoffLive") : t("handoffOffline");
    refs.nameLabel.textContent = t("name") + " *"; refs.emailLabel.textContent = t("emailField"); refs.phoneLabel.textContent = t("phoneField"); refs.handoffConsentLabel.textContent = t("handoffConsent");
    refs.handoffSend.textContent = state.handoffBusy ? t("handoffSending") : t("handoffSubmit"); refs.handoffSend.disabled = state.handoffBusy || state.busy; refs.handoffCancel.textContent = t("cancel");
    refs.endConfirm.hidden = !state.endOpen; refs.endTitle.textContent = t("endTitle"); refs.endDescription.textContent = t("endDescription"); refs.endAccept.textContent = t("endConfirm"); refs.endAccept.disabled = state.ending; refs.endCancel.textContent = t("cancel");
    renderContacts(); renderMessages();
  }
  function inputChanged() { state.errorKey = ""; state.errorText = ""; render(); }
  async function ensureConversation() {
    if (state.id && state.token) return true;
    if (state.creation) return state.creation;
    if (!state.consent) { state.errorKey = "consentRequired"; render(); refs.consent.focus(); return false; }
    const generation = state.generation; state.creating = true; render();
    state.creation = (async function () {
      try {
        const result = await request("/api/assistant/conversations", { method: "POST", body: { locale: lang(), consent: true } });
        if (generation !== state.generation) return false;
        if (!result.token || !(result.id || result.conversation?.id)) throw new Error("invalid_conversation_response");
        state.id = result.id || result.conversation.id; state.token = result.token; acceptConversation(result); sessionWrite(); return true;
      } finally { state.creating = false; state.creation = null; render(); }
    })();
    return state.creation;
  }
  async function sendMessage() {
    if (state.busy || state.restoring || state.conversation?.status === "closed") return;
    const text = refs.input.value.trim();
    if (!text) { state.errorKey = "noQuestion"; render(); refs.input.focus(); return; }
    if (!state.conversation && !state.consent) { state.errorKey = "consentRequired"; render(); refs.consent.focus(); return; }
    state.busy = true; state.errorKey = ""; state.errorText = ""; stopPolling(); render();
    try {
      if (!await ensureConversation()) return;
      const id = state.id, generation = state.generation;
      const result = await request("/api/assistant/conversations/" + encodeURIComponent(id) + "/messages", { method: "POST", body: { text } });
      if (generation !== state.generation || id !== state.id) return;
      acceptConversation(result); if (refs.input.value.trim() === text) refs.input.value = "";
    } catch (error) {
      if ([401, 404].includes(error.status) && state.id) expire();
      else { state.errorKey = errorFor(error); state.errorText = ""; if (error.code === "conversation_closed") { await refreshConversation().catch(function () {}); state.errorKey = "closed"; } }
    } finally { state.busy = false; render(); schedulePoll(); if (state.open && !refs.input.disabled) refs.input.focus(); }
  }
  async function openHandoff() {
    if (state.busy || state.handoffBusy) return;
    if (!state.id && !state.consent) { state.errorKey = "consentRequired"; render(); refs.consent.focus(); return; }
    state.errorKey = ""; state.errorText = "";
    try { if (!await ensureConversation()) return; state.handoffOpen = true; state.endOpen = false; render(); refs.name.focus(); }
    catch (error) { state.errorKey = errorFor(error); render(); }
  }
  async function handoff(event) {
    event.preventDefault(); if (state.handoffBusy || state.busy) return;
    state.form = { name: refs.name.value.trim(), email: refs.email.value.trim(), phone: refs.phone.value.trim(), consent: refs.handoffConsent.checked };
    if (!state.form.name) { state.errorKey = "nameRequired"; render(); refs.name.focus(); return; }
    if (!staffAvailable() && !state.form.email && !state.form.phone) { state.errorKey = "contactRequired"; render(); refs.email.focus(); return; }
    if (!state.form.consent) { state.errorKey = "handoffConsentRequired"; render(); refs.handoffConsent.focus(); return; }
    if (!refs.handoffForm.reportValidity()) return;
    state.handoffBusy = true; state.errorKey = ""; stopPolling(); render();
    try {
      const id = state.id, generation = state.generation;
      const body = { name: state.form.name, consent: true }; if (state.form.email) body.email = state.form.email; if (state.form.phone) body.phone = state.form.phone;
      const result = await request("/api/assistant/conversations/" + encodeURIComponent(id) + "/handoff", { method: "POST", body });
      if (generation !== state.generation || id !== state.id) return;
      acceptConversation(result); state.handoffOpen = false; refs.handoffConsent.checked = false; state.form.consent = false;
    } catch (error) { if ([401, 404].includes(error.status)) expire(); else state.errorKey = errorFor(error); }
    finally { state.handoffBusy = false; render(); schedulePoll(); }
  }
  async function endConversation() {
    if (!state.id || state.ending) return;
    state.ending = true; state.errorKey = ""; stopPolling(); render();
    try { const result = await request("/api/assistant/conversations/" + encodeURIComponent(state.id) + "/close", { method: "POST", body: {} }); acceptConversation(result); state.endOpen = false; state.handoffOpen = false; }
    catch (error) { if ([401, 404].includes(error.status)) expire(); else state.errorKey = errorFor(error); }
    finally { state.ending = false; render(); schedulePoll(); }
  }
  async function openPanel() {
    state.open = true; state.errorKey = ""; render();
    if (state.id && state.token && !state.conversation) {
      state.restoring = true; render();
      try { await refreshConversation(); } catch { state.errorKey = "error"; }
      finally { state.restoring = false; render(); }
    }
    if (!state.open) return;
    schedulePoll(); (state.conversation ? refs.input : refs.consent).focus();
  }
  function closePanel() { state.open = false; state.handoffOpen = false; state.endOpen = false; stopPolling(); render(); refs.launcher.focus(); }
  function build() {
    refs.root = node("div", "sael-assistant"); refs.root.id = "sael-assistant";
    refs.launcher = button("sael-assistant-launcher", openPanel); refs.launcher.setAttribute("aria-controls", "sael-assistant-panel"); refs.launcher.setAttribute("aria-haspopup", "dialog");
    const professor = node("img", "sael-assistant-professor");
    professor.alt = "";
    professor.width = 256;
    professor.height = 256;
    professor.decoding = "async";
    professor.draggable = false;
    professor.addEventListener("error", () => { professor.hidden = true; });
    professor.src = new URL("assets/sael-professor.png", document.baseURI).href;
    refs.launcherLabel = node("span", "sael-assistant-launcher-label");
    refs.launcher.append(professor, refs.launcherLabel);
    refs.panel = node("section", "sael-assistant-panel"); refs.panel.id = "sael-assistant-panel"; refs.panel.setAttribute("role", "dialog"); refs.panel.setAttribute("aria-modal", "false"); refs.panel.setAttribute("aria-labelledby", "sael-assistant-title"); refs.panel.hidden = true;
    const header = node("header", "sael-assistant-header"), brand = node("div", "sael-assistant-brand");
    const logo = node("img", "sael-assistant-logo"); logo.src = new URL("assets/sael-logo-mark.png", document.baseURI).href; logo.alt = ""; logo.width = 40; logo.height = 40;
    const heading = node("div"); refs.title = node("h2"); refs.title.id = "sael-assistant-title"; refs.mode = node("p", "sael-assistant-mode"); heading.append(refs.title, refs.mode); brand.append(logo, heading);
    refs.close = button("sael-assistant-close", closePanel); refs.close.textContent = "×"; header.append(brand, refs.close);
    refs.scroll = node("div", "sael-assistant-scroll");
    const meta = node("div", "sael-assistant-meta"); refs.availability = node("p", "sael-assistant-availability"); refs.hoursLabel = node("span", "sael-assistant-hours-label"); refs.hours = node("span"); const hours = node("p", "sael-assistant-hours"); hours.append(refs.hoursLabel, refs.hours); meta.append(refs.availability, hours);
    const intro = node("div", "sael-assistant-intro"); refs.welcome = node("p", "sael-assistant-welcome"); refs.disclosure = node("p", "sael-assistant-disclosure"); intro.append(refs.welcome, refs.disclosure);
    refs.suggestions = node("div", "sael-assistant-suggestions");
    refs.log = node("div", "sael-assistant-log"); refs.log.setAttribute("role", "log"); refs.log.setAttribute("aria-live", "polite"); refs.log.setAttribute("aria-relevant", "additions text"); refs.log.setAttribute("aria-label", "SAEL chat");
    refs.status = node("p", "sael-assistant-status"); refs.status.setAttribute("role", "status");
    refs.error = node("p", "sael-assistant-error"); refs.error.setAttribute("role", "alert");
    refs.handoff = node("section", "sael-assistant-handoff"); refs.handoff.hidden = true; refs.handoffTitle = node("h3"); refs.handoffTitle.id = "sael-assistant-handoff-title"; refs.handoff.setAttribute("aria-labelledby", refs.handoffTitle.id); refs.handoffIntro = node("p");
    refs.handoffForm = node("form", "sael-assistant-handoff-form"); refs.handoffForm.addEventListener("submit", handoff);
    function field(key, type, autocomplete, required) { const label = node("label", "sael-assistant-field"), title = node("span"), input = node("input"); input.type = type; input.name = key; input.autocomplete = autocomplete; input.maxLength = key === "name" ? 120 : key === "email" ? 254 : 60; input.required = !!required; label.append(title, input); refs[key] = input; refs[key + "Label"] = title; refs.handoffForm.append(label); }
    field("name", "text", "name", true); field("email", "email", "email", false); field("phone", "tel", "tel", false);
    const handoffConsentRow = node("label", "sael-assistant-check"); refs.handoffConsent = node("input"); refs.handoffConsent.type = "checkbox"; refs.handoffConsent.required = true; refs.handoffConsentLabel = node("span"); handoffConsentRow.append(refs.handoffConsent, refs.handoffConsentLabel);
    const handoffButtons = node("div", "sael-assistant-form-actions"); refs.handoffSend = node("button", "sael-assistant-primary"); refs.handoffSend.type = "submit"; refs.handoffCancel = button("sael-assistant-secondary", function () { state.handoffOpen = false; render(); refs.human.focus(); }); handoffButtons.append(refs.handoffSend, refs.handoffCancel); refs.handoffForm.append(handoffConsentRow, handoffButtons); refs.handoff.append(refs.handoffTitle, refs.handoffIntro, refs.handoffForm);
    refs.endConfirm = node("section", "sael-assistant-end-confirm"); refs.endConfirm.hidden = true; refs.endTitle = node("h3"); refs.endDescription = node("p"); const endButtons = node("div", "sael-assistant-form-actions"); refs.endAccept = button("sael-assistant-primary", endConversation); refs.endCancel = button("sael-assistant-secondary", function () { state.endOpen = false; render(); refs.end.focus(); }); endButtons.append(refs.endAccept, refs.endCancel); refs.endConfirm.append(refs.endTitle, refs.endDescription, endButtons);
    refs.contacts = node("div", "sael-assistant-contacts"); refs.scroll.append(meta, intro, refs.suggestions, refs.log, refs.status, refs.error, refs.handoff, refs.endConfirm, refs.contacts);
    const bottom = node("div", "sael-assistant-bottom"); refs.consentRow = node("label", "sael-assistant-check sael-assistant-message-consent"); refs.consent = node("input"); refs.consent.type = "checkbox"; refs.consent.addEventListener("change", function () { state.consent = refs.consent.checked; state.errorKey = ""; render(); }); refs.consentLabel = node("span"); refs.consentRow.append(refs.consent, refs.consentLabel);
    refs.compose = node("form", "sael-assistant-compose"); refs.compose.addEventListener("submit", function (event) { event.preventDefault(); sendMessage(); }); refs.label = node("label", "sael-assistant-input-label"); refs.label.htmlFor = "sael-assistant-input";
    refs.input = node("textarea"); refs.input.id = "sael-assistant-input"; refs.input.name = "message"; refs.input.rows = 2; refs.input.maxLength = MAX_TEXT; refs.input.addEventListener("input", inputChanged); refs.input.addEventListener("keydown", function (event) { if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); sendMessage(); } });
    const composeActions = node("div", "sael-assistant-compose-actions"); refs.counter = node("span", "sael-assistant-counter"); refs.counter.id = "sael-assistant-counter"; refs.input.setAttribute("aria-describedby", refs.counter.id); refs.send = node("button", "sael-assistant-primary"); refs.send.type = "submit"; composeActions.append(refs.counter, refs.send); refs.compose.append(refs.label, refs.input, composeActions);
    const actions = node("div", "sael-assistant-actions"); refs.human = button("sael-assistant-human", openHandoff); refs.end = button("sael-assistant-text-button", function () { state.endOpen = true; state.handoffOpen = false; render(); refs.endAccept.focus(); }); refs.newChat = button("sael-assistant-human", function () { clearConversation(); state.errorKey = ""; refs.input.value = ""; refs.name.value = ""; refs.email.value = ""; refs.phone.value = ""; refs.handoffConsent.checked = false; render(); refs.consent.focus(); }); actions.append(refs.human, refs.end, refs.newChat);
    refs.note = node("p", "sael-assistant-note"); bottom.append(refs.consentRow, refs.compose, actions, refs.note); refs.panel.append(header, refs.scroll, bottom); refs.root.append(refs.launcher, refs.panel); document.body.append(refs.root);
    refs.root.addEventListener("keydown", function (event) { if (event.key === "Escape" && state.open) { event.preventDefault(); event.stopPropagation(); closePanel(); } });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stopPolling(); else if (state.open) { refreshConfig().then(refreshConversation).then(render).catch(function () {}).finally(schedulePoll); } });
    new MutationObserver(function (changes) { if (changes.some(change => change.attributeName === "lang")) { state.messageSignature = ""; render(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    render();
  }
  async function initialize() {
    try { await refreshConfig(); if (state.config?.enabled === false) return; sessionRead(); build(); }
    catch { /* A site without this feature's API keeps its normal interface. */ }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true }); else initialize();
})();
