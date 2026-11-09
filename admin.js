"use strict";
(function () {
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => (prefix || "item") + "-" + (globalThis.crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10));
  const langs = ["ru", "kg", "en"];
  const state = { content:null, revision:null, csrf:"", user:null, view:"overview", lang:"ru", item:null, menu:"header", sectionPage:"all", dirty:false, busy:false, query:"", copyGroup:"hero", media:[], mediaPath:null, setup:false, setupAvailable:false, totpSecret:null, totpUrl:null, pendingDraft:null };
  const nav = [
    ["overview","Обзор","◫","РАБОЧЕЕ ПРОСТРАНСТВО"],["pages","Страницы","▤"],["sections","Разделы страниц","▥"],["menus","Меню и навигация","☷"],["copy","Тексты сайта","T"],
    ["assistant","ИИ-помощник","✦","ОБЩЕНИЕ С КЛИЕНТАМИ"],["assistantInbox","Диалоги","◌"],
    ["services","Услуги","⚗","МАТЕРИАЛЫ ЛАБОРАТОРИИ"],["priceEntries","Прайс-лист","≡"],["faqs","Частые вопросы","?"],["documents","Документы","▱"],["equipment","Оборудование","⌘"],["partners","Партнёры","◇"],
    ["media","Медиатека","▧","НАСТРОЙКИ"],["images","Изображения сайта","▣"],["aboutContent","О компании","◎"],["processSteps","Этапы анализа","↗"],["clientSteps","Шаги для клиентов","→"],["settings","Общие настройки","⚙"],["backups","История и восстановление","↶"]
  ];
  const labels = { id:"Идентификатор",schemaVersion:"Версия структуры",title:"Заголовок",name:"Название",label:"Подпись",description:"Описание",desc:"Краткое описание",text:"Текст",body:"Текст",lead:"Вступительный текст",slug:"Адрес страницы",status:"Публикация",kind:"Тип страницы",serviceId:"Связанная услуга",blocks:"Содержимое раздела",category:"Направление",icon:"Значок",method:"Метод / технология",methods:"Методы и процедуры",methodsTitle:"Заголовок блока методов",samples:"Образцы",sampleTags:"Виды образцов",requirements:"Требования к образцам",result:"Результат для клиента",material:"Материал",photo:"Фотография",src:"Изображение",alt:"Описание изображения (alt)",url:"Ссылка",href:"Ссылка",target:"Открытие ссылки",page:"Страница",enabled:"Показывать раздел",code:"Код услуги",detail:"Метод / параметры — исходный текст",amount:"Стоимость — исходный текст",detailLocalized:"Метод / параметры на сайте",amountLocalized:"Стоимость на сайте",caption:"Подпись",logo:"Логотип",type:"Тип",model:"Модель",manufacturer:"Производитель",showOnHome:"Показывать на главной",selector:"Область на сайте",sourceUrl:"Источник",facts:"Ключевые показатели",overviewTitle:"Заголовок описания",overview:"Описание",note:"Дополнительные условия",faq:"Частые вопросы",equipmentTitle:"Заголовок оборудования",equipmentIntro:"Вступление об оборудовании",historyTitle:"Заголовок истории",history:"История",capabilitiesTitle:"Направления деятельности",capabilities:"Направления деятельности",qualityTitle:"Заголовок о качестве",qualityText:"Текст о качестве",qualityBullets:"Принципы качества",ctaTitle:"Заголовок призыва к действию",ctaText:"Текст призыва к действию",siteName:"Название сайта",phone:"Основной телефон",phoneSecondary:"Дополнительный телефон",email:"Электронная почта",address:"Почтовый адрес",hours:"Режим работы",logoFull:"Полный логотип",logoMark:"Компактный логотип",pricePdf:"Прайс-лист PDF",limsUrl:"LIMS кабинет",videoUrl:"Видео YouTube",mapUrl:"Карта",items:"Пункты списка",level:"Уровень заголовка" };
  const groupLabels = { hero:"Первый экран",about:"О лаборатории",stat:"Показатели",services:"Услуги",service:"Карточки услуг",quality:"Качество",equipment:"Оборудование",process:"Порядок анализа",clients:"Клиентам",sample:"Подготовка образцов",price:"Прайс-лист",quote:"Коммерческое предложение",faq:"Частые вопросы",contact:"Контакты",form:"Форма запроса КП",footer:"Подвал сайта",nav:"Меню",search:"Поиск",detail:"Страницы услуг",serviceUi:"Подписи на страницах услуг",aboutUi:"Подписи страницы компании",partners:"Партнёры",certificates:"Сертификаты",media:"Видео",brand:"Логотип",menu:"Мобильное меню",language:"Переключение языков",visual:"Визуальные подписи" };
  const specialLabels = { "hero.title":"Главный заголовок","hero.lead":"Основное описание","hero.sub":"Дополнительное описание","hero.cta":"Кнопка запроса КП","hero.price":"Кнопка прайса","contact.address":"Адрес лаборатории","contact.hours":"Режим работы","footer.legal":"Юридическое название","nav.cta":"Кнопка запроса КП","partners.title":"Заголовок партнёров","topline":"Верхняя строка сайта","skip":"Ссылка перехода к содержимому" };
  class ApiError extends Error { constructor(message, status, code) { super(message); this.status=status; this.code=code; } }
  function safeUrl(value, mediaOnly) {
    const url=String(value||"").trim();
    if (!url || /[\u0000-\u001f\u007f]/.test(url) || url.startsWith("//") || /^(?:javascript|data|vbscript|file):/i.test(url)) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !(mediaOnly ? /^https?:/i : /^(https?:|mailto:|tel:)/i).test(url)) return "";
    return mediaOnly&&!url.startsWith("/")&&!/^[a-z][a-z0-9+.-]*:/i.test(url)?"/"+url.replace(/^\.\//,""):url;
  }
  function titleFor(view) { return view==="assistantKnowledge"?"База знаний помощника":view==="priceCategories"?"Направления прайса":nav.find(item=>item[0]===view)?.[1] || view; }
  function labelFor(key) { return labels[key] || specialLabels[key] || String(key).replace(/([a-z])([A-Z])/g,"$1 $2"); }
  function local(value) { return value && typeof value==="object" && !Array.isArray(value) ? value[state.lang] || value.ru || value.en || "" : value; }
  function read(path) { return path.reduce((value,key)=>value == null ? undefined : value[key],state.content); }
  function write(path,value) {
    let object=state.content;for(let i=0;i<path.length-1;i++){const key=path[i];if(["__proto__","prototype","constructor"].includes(String(key)))return;object=object[key];if(object==null)return;}
    const key=path[path.length-1];if(["__proto__","prototype","constructor"].includes(String(key)))return;object[key]=value;
    if(path[0]==="copy"&&path.length===3&&["contact.address","contact.hours"].includes(path[2])){
      const name=path[2]==="contact.address"?"address":"hours";state.content.settings[name]=state.content.settings[name]||{};state.content.settings[name][path[1]]=value;
    }
    if(path[0]==="settings"&&path.length===3&&["address","hours"].includes(path[1])){
      const name=path[1]==="address"?"contact.address":"contact.hours";if(state.content.copy?.[path[2]])state.content.copy[path[2]][name]=value;
    }
  }
  function pathAttr(path) { return esc(JSON.stringify(path)); }
  function toast(message,error) { const el=$("#toast"); el.textContent=message; el.classList.toggle("error",!!error); el.hidden=false; clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.hidden=true,5000); }
  async function api(url, options) {
    options=options||{};
    const headers=new Headers(options.headers||{});
    if(options.body && !(options.body instanceof FormData)) { headers.set("Content-Type","application/json"); options.body=JSON.stringify(options.body); }
    if(state.csrf && !["GET","HEAD"].includes(options.method||"GET"))headers.set("X-CSRF-Token",state.csrf);
    const response=await fetch(url,{...options,headers,credentials:"same-origin",cache:"no-store"});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) {
      if(response.status===401 && state.content) { if(state.dirty)state.pendingDraft={content:clone(state.content),revision:state.revision};state.content=null;showAuth({setupRequired:false}); }
      throw new ApiError(data.message || ({401:"Войдите в панель заново.",403:"Действие не разрешено. Обновите страницу и войдите заново.",409:"Содержимое изменилось на сервере.",413:"Файл слишком большой. Максимум — 10 МБ.",429:"Слишком много попыток. Повторите позже."}[response.status]) || "Не удалось выполнить действие. Проверьте соединение и повторите.",response.status,data.error);
    }
    return data;
  }
  function setDirty() { state.editSequence=(state.editSequence||0)+1;state.dirty=true;updateSaveState(); }
  function updateSaveState(message,error) {
    $("#save-button").disabled=!state.dirty||state.busy;
    $("#save-state").textContent=message || (state.busy?"Сохраняем…":state.dirty?"Есть несохранённые изменения":"Все изменения сохранены");
    $("#save-state").classList.toggle("dirty",state.dirty&&!error);
    $("#save-state").classList.toggle("error",!!error);
    $("#revision-label").textContent="Версия "+(state.revision==null?"—":String(state.revision));
  }
  function languageSwitch() { return '<div class="lang-switch" role="group" aria-label="Язык редактирования">'+langs.map(lang=>'<button type="button" data-action="language" data-lang="'+lang+'" class="'+(lang===state.lang?"active":"")+'" aria-pressed="'+(lang===state.lang)+'">'+lang.toUpperCase()+'</button>').join("")+'</div>'; }
  function drawNav() {
    $("#sidebar-nav").innerHTML=nav.map(([id,name,icon,group])=>(group?'<p class="nav-group-label">'+esc(group)+'</p>':"")+'<button type="button" class="nav-item '+((state.view===id||id==="assistant"&&state.view==="assistantKnowledge")?"active":"")+'" data-action="navigate" data-view="'+id+'" '+((state.view===id||id==="assistant"&&state.view==="assistantKnowledge")?'aria-current="page"':"")+'><span class="nav-icon" aria-hidden="true">'+icon+'</span><span>'+esc(name)+'</span>'+(["pages","services","priceEntries","documents","equipment","partners"].includes(id)?'<span class="nav-count">'+(state.content?.[id]?.length||0)+'</span>':"")+'</button>').join("");
  }
  function showAuth(session) {
    stopOperatorRuntime(false);
    state.setup=!!session.setupRequired;state.setupAvailable=!!session.setupAvailable;
    document.querySelectorAll("dialog[open]").forEach(dialog=>dialog.close());
    $("#boot-screen").hidden=true;$("#admin-app").hidden=true;$("#auth-screen").hidden=false;
    $("#auth-title").textContent=state.setup?"Первый администратор":"Вход в панель";
    $("#auth-description").textContent=state.setup ? (state.setupAvailable?"Введите код настройки из закрытых параметров сервера и создайте личную учётную запись.":"Доступ ещё не настроен. Задайте CMS_SETUP_TOKEN длиной не менее 32 символов в закрытых переменных сервера, перезапустите приложение и обновите страницу.") : "Введите данные администратора сайта.";
    $("#setup-token-wrap").hidden=!state.setup||!state.setupAvailable;
    $("#setup-token").required=state.setup&&state.setupAvailable;
    if(!state.setup)$("#setup-token").value="";
    $("#auth-password").autocomplete=state.setup?"new-password":"current-password";
    $("#auth-password").minLength=state.setup?12:1;
    $("#setup-password-hint").hidden=!state.setup;
    $("#auth-code-wrap").hidden=state.setup;
    $("#auth-submit").textContent=state.setup?"Создать администратора":"Войти";
    $("#auth-submit").disabled=state.setup&&!state.setupAvailable;
    $("#auth-error").hidden=true;
    if(!state.setup)$("#auth-username").focus();
  }
  async function enterApp(session) {
    state.csrf=session.csrfToken||state.csrf;state.user=session.user||state.user;
    const result=await api("/api/admin/content");if(!result.content||typeof result.content!=="object")throw new Error("Сервер не вернул содержимое сайта.");
    state.content=result.content;state.revision=result.revision;state.dirty=false;
    if(state.pendingDraft){if(confirm("Восстановить несохранённые изменения из этого окна?")){state.content=state.pendingDraft.content;state.revision=state.pendingDraft.revision;state.dirty=true;}state.pendingDraft=null;}
    $("#boot-screen").hidden=true;$("#auth-screen").hidden=true;$("#admin-app").hidden=false;
    $("#account-name").textContent=state.user?.username||state.user?.name||"Администратор";
    drawNav();render();updateSaveState();
  }
  async function save() {
    if(!state.dirty||state.busy)return;
    const sequence=state.editSequence||0,snapshot=clone(state.content);
    state.busy=true;updateSaveState();
    try { const result=await api("/api/admin/content",{method:"PUT",body:{content:snapshot,revision:state.revision}});state.revision=result.revision;if((state.editSequence||0)===sequence){state.content=result.content||state.content;state.dirty=false;toast("Изменения сохранены. Сайт обновлён.");}else{state.dirty=true;toast("Предыдущие изменения сохранены. Сохраните также новые правки.");}drawNav(); }
    catch(error) { if(error.status===409&&error.code==="revision_conflict")$("#conflict-dialog").showModal();else toast(error.message,true);updateSaveState("Не удалось сохранить",true); }
    finally { state.busy=false;updateSaveState(); }
  }
  function closeSidebar() { document.body.classList.remove("sidebar-open");$("#sidebar-toggle").setAttribute("aria-expanded","false");$("#sidebar-shade").hidden=true;$(".admin-main").inert=false; }
  function navigate(view) { if(state.view==="assistantInbox"&&view!=="assistantInbox")stopOperatorRuntime(false);state.view=view;state.item=null;state.query="";drawNav();render();closeSidebar();$("#workspace").focus(); }
  function render() {
    $("#view-title").textContent=titleFor(state.view);
    $("#view-eyebrow").textContent=state.view==="overview"?"ПАНЕЛЬ УПРАВЛЕНИЯ":state.view==="settings"?"ПАРАМЕТРЫ САЙТА":"РЕДАКТИРОВАНИЕ КОНТЕНТА";
    const workspace=$("#workspace");
    if(state.view==="overview")workspace.innerHTML=overview();
    else if(state.view==="assistant"){workspace.innerHTML=assistantEditor();refreshAssistantConfig();}
    else if(state.view==="assistantInbox"){workspace.innerHTML=inboxEditor();startOperatorRuntime();}
    else if(state.view==="backups"){workspace.innerHTML='<div id="backups-workspace"><p class="media-loading">Загружаем историю изменений…</p></div>';loadBackups();}
    else if(state.view==="media") { workspace.innerHTML='<div id="media-workspace"><p class="media-loading">Загружаем файлы…</p></div>';loadMedia(false); }
    else if(state.view==="copy")workspace.innerHTML=copyEditor();
    else if(["settings","aboutContent","processSteps","clientSteps"].includes(state.view))workspace.innerHTML=rootEditor(state.view);
    else if(state.view==="priceCategories")workspace.innerHTML=categoryEditor();
    else if(state.item!==null)workspace.innerHTML=recordEditor();
    else workspace.innerHTML=collection();
  }
  function overview() {
    const c=state.content,missing=c.pages?.filter(p=>p.status==="published"&&!langs.every(lang=>p.title?.[lang])).length||0;
    return '<section class="welcome-panel"><div><p class="eyebrow">ВАШ САЙТ · SAEL</p><h2>Всё начинается с содержания.</h2><p>Обновляйте страницы и услуги, управляйте прайсом и документами. Все изменения сохраняются одной кнопкой и сразу появляются на сайте.</p></div><div class="welcome-mark" aria-hidden="true">Sa</div></section>'+
    '<div class="stat-grid">'+[["pages","Страницы сайта"],["services","Направления услуг"],["priceEntries","Позиций в прайсе"],["documents","Документы"]].map(([key,name])=>'<button type="button" class="stat-card" data-action="navigate" data-view="'+key+'"><strong>'+(c[key]?.length||0)+'</strong><span>'+name+' <span aria-hidden="true" >↗</span></span></button>').join("")+'</div>'+
    '<div class="overview-grid"><section class="panel"><h3>Быстрые действия</h3><div class="quick-grid">'+[["pages","＋","Добавить страницу","new-page"],["copy","T","Изменить тексты","navigate"],["priceEntries","≡","Обновить прайс","navigate"],["media","▧","Загрузить документ или фото","navigate"],["menus","☷","Настроить меню","navigate"],["settings","⚙","Обновить контакты","navigate"]].map(([view,icon,name,action])=>'<button type="button" class="quick-action" data-action="'+action+'" data-view="'+view+'"><span aria-hidden="true">'+icon+'</span>'+name+'</button>').join("")+'</div></section><section class="panel"><h3>Перед публикацией</h3><div class="check-row"><span class="check-dot"></span><div>Изменения сохраняются на сервере.<br><span class="muted">Закрытие браузера не удалит сохранённые материалы.</span></div></div><div class="check-row"><span class="check-dot '+(missing?"warning":"")+'"></span><div>Проверьте версии RU / KG / EN.<br><span class="muted">'+(missing?"Есть опубликованные страницы без заголовков на всех языках.":"Заполните перевод для каждого нового материала.")+'</span></div></div><div class="check-row"><span class="check-dot warning"></span><div>Сохраните резервную копию перед большими правками.<br><button type="button" class="text-button" data-action="export">Скачать копию контента</button></div></div><div class="check-row"><span class="check-dot"></span><div>Просматривайте результат на сайте.<br><a class="button-link" href="/" target="_blank" rel="noopener">Открыть главную ↗</a></div></div></section></div>';
  }
  function collectionPath() { if(state.view==="assistantKnowledge")return["assistant","knowledge"];if(state.view==="menus")return["menus",state.menu];if(state.view==="faqs")return["faqs",state.lang];return[state.view]; }
  function records() { return read(collectionPath())||[]; }
  function recordName(item,index) { if(Array.isArray(item))return String(item[0]||"Новый вопрос");return String(local(item.title)||local(item.name)||local(item.label)||item.model||item.id||"Материал "+(index+1)); }
  function statusBadge(item) { const status=item.status || (item.enabled===false?"draft":"published");return '<span class="status-pill '+(status==="draft"?"draft":"")+'">'+(status==="draft"?"Черновик / скрыто":"Опубликовано")+'</span>'; }
  function completeness(item) { const value=item.title||item.name||item.label;return value&&typeof value==="object"?'<span class="lang-completeness">'+langs.map(lang=>'<span class="'+(!value[lang]?"missing":"")+'">'+lang.toUpperCase()+'</span>').join("")+'</span>':""; }
  function collection() {
    if(state.view==="assistantKnowledge")ensureAssistant();
    const sectionFilter=state.view==="sections"?'<select id="section-page-filter" aria-label="Страница разделов"><option value="all">Все страницы</option>'+(state.content.pages||[]).map(page=>'<option value="'+esc(page.id)+'" '+(state.sectionPage===page.id?"selected":"")+'>'+esc(local(page.title)||page.slug||page.id)+'</option>').join("")+'</select>':"";
    const extras=state.view==="assistantKnowledge"?assistantTabs("knowledge")+'<div class="knowledge-intro"><div><p class="eyebrow">ОБУЧЕНИЕ НА МАТЕРИАЛАХ SAEL</p><h2>Утверждённые ответы для клиентов</h2><p>Помощник использует услуги, прайс и FAQ сайта. Добавьте сюда дополнительные ответы и инструкции для посетителей. Опубликованные материалы попадут в базу знаний после сохранения.</p></div><span class="knowledge-symbol" aria-hidden="true">✦</span></div>':state.view==="menus"?'<div class="tabs"><button type="button" data-action="menu-tab" data-menu="header" class="'+(state.menu==="header"?"active":"")+'">Верхнее меню</button><button type="button" data-action="menu-tab" data-menu="footer" class="'+(state.menu==="footer"?"active":"")+'">Меню в подвале</button></div>':state.view==="priceEntries"?'<div class="tabs"><button type="button" class="active">Позиции прайса</button><button type="button" data-action="navigate" data-view="priceCategories">Направления</button></div>':"";
    const notes={sections:"Порядок строк определяет порядок разделов на выбранной странице. Выключенный раздел скрыт на сайте. В новые разделы можно добавлять заголовки, текст, изображения и кнопки.",menus:"Добавляйте ссылки на страницы и разделы сайта. Используйте стрелки для изменения порядка пунктов.",pages:"Создавайте новые страницы, редактируйте заголовки и содержание. Черновики не публикуются на сайте.",faqs:"Вопросы и ответы редактируются отдельно для каждого языка.",images:"Заменяйте фотографии и логотипы в указанных областях сайта через медиатеку.",services:"Редактор включает карточку услуги и подробное содержание её страницы.",priceEntries:"Цены, коды и условия задаются для каждой позиции. Направления можно менять во вкладке «Направления»."};
    return extras+'<div class="toolbar"><div class="toolbar-left">'+sectionFilter+'<input id="collection-search" class="search-input" type="search" placeholder="Найти материал…" aria-label="Найти материал" value="'+esc(state.query)+'"></div><div class="toolbar-right">'+languageSwitch()+'<button type="button" class="button primary small" data-action="new-record">＋ Добавить</button></div></div>'+(notes[state.view]?'<p class="toolbar-note">'+notes[state.view]+'</p>':"")+
    (records().length?'<table class="collection-table"><thead><tr><th class="order-cell">№</th><th>'+ (state.view==="faqs"?"Вопрос":"Название") +'</th><th class="hide-mobile">Языки / статус</th><th class="action-column"></th></tr></thead><tbody id="record-rows">'+recordRows()+'</tbody></table><p class="collection-caption">Всего: '+records().length+'. Изменения порядка и удаления вступят в силу после сохранения.</p>':'<div class="empty-state"><h3>Здесь пока нет материалов</h3><p>Добавьте первую запись и заполните её содержание на нужных языках.</p><button type="button" class="button primary" data-action="new-record">Добавить материал</button></div>');
  }
  function recordRows() {
    return records().map((item,index)=>{if(state.view==="sections"&&state.sectionPage!=="all"&&item.page!==state.sectionPage)return "";const name=recordName(item,index),sub=item.slug?"/"+item.slug:item.url||item.code||item.category||item.selector||"",photo=safeUrl(item.photo||item.logo||item.src,true),query=(name+" "+sub).toLocaleLowerCase("ru");
      return '<tr data-record-row data-search="'+esc(query)+'"><td class="order-cell">'+String(index+1).padStart(2,"0")+'</td><td><div class="record-title-cell">'+(photo?'<img class="record-thumb" src="'+esc(photo)+'" alt="">':"")+'<div><button type="button" class="record-title" data-action="edit-record" data-index="'+index+'">'+esc(name)+'</button>'+(sub?'<small class="record-subtitle">'+esc(sub)+'</small>':"")+'</div></div></td><td class="hide-mobile">'+(Array.isArray(item)?"":completeness(item)+(item.status||Object.hasOwn(item,"enabled")?" "+statusBadge(item):""))+'</td><td><div class="row-actions"><button class="move-row" type="button" data-action="move-record" data-index="'+index+'" data-direction="-1" aria-label="Поднять '+esc(name)+'" '+(index===0?"disabled":"")+'>↑</button><button class="move-row" type="button" data-action="move-record" data-index="'+index+'" data-direction="1" aria-label="Опустить '+esc(name)+'" '+(index===records().length-1?"disabled":"")+'>↓</button><button class="edit-button" type="button" data-action="edit-record" data-index="'+index+'">Изменить</button><button type="button" data-action="duplicate-record" data-index="'+index+'" aria-label="Дублировать '+esc(name)+'">⧉</button><button type="button" data-action="delete-record" data-index="'+index+'" aria-label="Удалить '+esc(name)+'">×</button></div></td></tr>';
    }).join("");
  }
  function previewUrl(item) {
    if(state.view==="services")return"/service.html?service="+encodeURIComponent(item.id);
    if(state.view!=="pages")return"";
    if(item.kind==="home")return"/";if(item.kind==="about")return"/about.html";if(item.kind==="service")return"/service.html?service="+encodeURIComponent(item.serviceId||"");
    return"/page.html?slug="+encodeURIComponent(item.slug||"");
  }
  function recordEditor() {
    const list=records(),item=list[state.item];if(!item){state.item=null;return collection();}
    const path=[...collectionPath(),state.item],preview=previewUrl(item);
    const asideKeys=Array.isArray(item)?[]:["id","status","slug","kind","serviceId"].filter(key=>Object.hasOwn(item,key));
    const mainKeys=Array.isArray(item)?null:Object.keys(item).filter(key=>!asideKeys.includes(key));
    const main=Array.isArray(item)?field(item,path,state.view==="faqs"?"Вопрос и ответ":"Материал",0):mainKeys.map(key=>field(item[key],[...path,key],key==="title"&&state.view==="sections"&&!String(item.id).startsWith("cms-")?"Название раздела в панели":labelFor(key),0)).join("");
    let extra="";
    if(state.view==="services"&&state.content.serviceContent?.[item.id])extra='<section class="editor-card"><h2>Подробная страница услуги</h2><p class="editor-help">Описание, методы, требования, показатели и вопросы для выбранного языка.</p>'+field(state.content.serviceContent[item.id],["serviceContent",item.id],"Содержание страницы",0)+'</section>';
    if(state.view==="sections")extra=nativeSectionEditor(item);
    if(state.view==="pages"&&item.kind!=="custom")extra='<section class="editor-card"><h2>Разделы этой страницы</h2><p class="editor-help">Стандартная страница состоит из отдельных разделов. Откройте их, чтобы изменить тексты, порядок и видимость, добавить новые блоки.</p><button type="button" class="button" data-action="page-sections" data-id="'+esc(item.id)+'">Редактировать разделы</button></section>';
    return '<div class="editor-topline"><button type="button" class="text-button" data-action="back-list">← '+esc(titleFor(state.view))+'</button><div class="toolbar-right">'+languageSwitch()+(preview?'<a class="button-link" href="'+esc(preview)+'" target="_blank" rel="noopener">Открыть страницу ↗</a>':"")+'</div></div><div class="editor-layout"><div class="editor-main"><section class="editor-card"><h2>'+esc(recordName(item,state.item))+'</h2>'+main+'</section>'+extra+'</div><aside class="editor-aside"><section class="editor-card"><h3>Свойства материала</h3>'+asideKeys.map(key=>field(item[key],[...path,key],labelFor(key),0)).join("")+'<p class="translation-note">Переключайте RU / KG / EN для редактирования переводов. Сохраните изменения кнопкой в верхней части панели.</p></section><section class="editor-card"><h3>Действия</h3><button type="button" class="text-button" data-action="duplicate-record" data-index="'+state.item+'">Создать копию</button><hr class="section-divider"><button type="button" class="text-button" data-action="delete-record" data-index="'+state.item+'">Удалить материал</button></section></aside></div>';
  }
  function nativeSectionEditor(section) {
    const target=section.targetId||section.id,lang=state.lang,page=state.content.pages.find(page=>page.id===section.page);
    let fields="",links=[];
    if(section.page==="home"){
      const prefixes={hero:["hero","media"],about:["about","stat"],services:["services","service"],quality:["quality","certificates"],equipment:["equipment"],process:["process"],clients:["clients"],"requirements-band":["sample"],price:["price","quote"],faq:["faq"],partners:["partners"],contacts:["contact","form"]}[target];
      if(!prefixes)return"";
      fields=Object.entries(state.content.copy?.[lang]||{}).filter(([key])=>prefixes.includes(key.split(".")[0])&&!(target==="contacts"&&["contact.address","contact.hours"].includes(key))).map(([key,value])=>'<div class="copy-key">'+esc(key)+'</div>'+copyField(key,value,["copy",lang,key],specialLabels[key]||labelFor(key.slice(key.indexOf(".")+1)))).join("");
      if(target==="contacts")fields=["address","hours","phone","phoneSecondary","email"].map(key=>field(state.content.settings[key],["settings",key],labelFor(key),0)).join("")+fields;
      if(target==="process")fields+=field(state.content.processSteps[lang],["processSteps",lang],"Этапы анализа",0);
      if(target==="clients")fields+=field(state.content.clientSteps[lang],["clientSteps",lang],"Шаги для клиентов",0);
      if(target==="faq")fields+=field(state.content.faqs[lang],["faqs",lang],"Вопросы и ответы",0);
      const destination={services:"services",quality:"documents",equipment:"equipment",price:"priceEntries",partners:"partners"}[target];if(destination)links.push(destination);
    }else if(page?.kind==="about"){
      const keys={"company-overview":["overviewTitle","overview"],"company-history":["historyTitle","timeline"],"company-services":["capabilitiesTitle","capabilities"],equipment:["equipmentTitle","equipmentIntro"],"company-quality":["qualityTitle","qualityText","qualityBullets"]}[target];
      if(!keys)return"";fields=keys.filter(key=>Object.hasOwn(state.content.aboutContent[lang],key)).map(key=>field(state.content.aboutContent[lang][key],["aboutContent",lang,key],labelFor(key),0)).join("");if(target==="equipment")links.push("equipment");
    }else if(page?.kind==="service"){
      const keys={"detail-overview":["overviewTitle","overview","facts"],"detail-methods":["methodsTitle","methods"],"detail-samples":["sampleTags","requirements"],"detail-pricing":["note"],"detail-faq":["faq"]}[target],detail=state.content.serviceContent?.[page.serviceId]?.[lang];
      if(!keys||!detail)return"";fields=keys.filter(key=>Object.hasOwn(detail,key)).map(key=>field(detail[key],["serviceContent",page.serviceId,lang,key],labelFor(key),0)).join("");if(target==="detail-pricing")links.push("priceEntries");
    }
    if(!fields&&!links.length)return"";
    return '<section class="editor-card"><h2>Содержание раздела · '+lang.toUpperCase()+'</h2><p class="editor-help">Изменения этих полей обновляют существующий раздел. Дополнительные блоки из редактора выше появятся после его основного содержания.</p>'+fields+(links.length?'<hr class="section-divider"><div class="field-tools">'+links.map(view=>'<button type="button" class="button small" data-action="navigate" data-view="'+view+'">Управлять: '+esc(titleFor(view))+' →</button>').join("")+'</div>':"")+'</section>';
  }
  function rootEditor(key) {
    const descriptions={settings:"Общие контакты, логотипы и ссылки используются по всему сайту.",aboutContent:"История компании, направления деятельности и система качества. Выберите язык для редактирования.",processSteps:"Порядок шагов соответствует порядку показа на главной странице.",clientSteps:"Эти шаги показываются в блоке «Как начать работу»."};
    return '<div class="toolbar"><p class="toolbar-note">'+(descriptions[key]||"")+'</p><div class="toolbar-right">'+languageSwitch()+'</div></div><div class="settings-grid"><section class="editor-card">'+field(state.content[key],[key],titleFor(key),0)+'</section></div>';
  }
  function copyEditor() {
    const copy=state.content.copy?.[state.lang]||{},groups=[...new Set(Object.keys(copy).map(key=>key.split(".")[0]))];
    if(state.copyGroup!=="all"&&!groups.includes(state.copyGroup))state.copyGroup=groups[0]||"all";
    return '<div class="toolbar"><div class="toolbar-left"><select id="copy-group" aria-label="Группа текстов"><option value="all">Все группы</option>'+groups.map(group=>'<option value="'+esc(group)+'" '+(state.copyGroup===group?"selected":"")+'>'+esc(groupLabels[group]||group)+'</option>').join("")+'</select><input id="copy-search" class="search-input" type="search" placeholder="Найти текст или подпись…" aria-label="Поиск по текстам"></div><div class="toolbar-right">'+languageSwitch()+'</div></div><p class="toolbar-note">Редактируйте заголовки, описания, подписи и кнопки. Форматирование доступно в текстовых полях; результат можно проверить в предпросмотре.</p><div id="copy-fields">'+Object.keys(copy).filter(key=>state.copyGroup==="all"||key.split(".")[0]===state.copyGroup).map(key=>'<section class="text-entry" data-copy-entry data-search="'+esc((key+" "+copy[key]).toLocaleLowerCase("ru"))+'"><p class="copy-key">'+esc(key)+'</p>'+copyField(key,copy[key],["copy",state.lang,key],specialLabels[key]||labelFor(key.slice(key.indexOf(".")+1)))+'</section>').join("")+'</div>';
  }
  function managedCopyCollection(key) { return /^equipment\.p[1-4]$/.test(key)?"equipment":/^quality\.cert(?:Alt)?(?:Kca17025|Kca17020|Ukas17025)$/.test(key)?"documents":""; }
  function copyField(key,value,path,label) {
    const view=managedCopyCollection(key);
    return view?'<div class="inline-notice">Этот материал редактируется в разделе «'+esc(titleFor(view))+'».<br><button type="button" class="text-button" data-action="navigate" data-view="'+view+'">Открыть '+esc(titleFor(view))+' →</button></div>':field(value,path,label,0,true);
  }
  function categoryEditor() {
    const categories=state.content.categories?.[state.lang]||{};
    return '<div class="tabs"><button type="button" data-action="navigate" data-view="priceEntries">Позиции прайса</button><button type="button" class="active">Направления</button></div><div class="toolbar"><p class="toolbar-note">Название направления показывается в услугах и фильтре прайса.</p><div class="toolbar-right">'+languageSwitch()+'<button type="button" class="button primary small" data-action="new-category">＋ Направление</button></div></div><div class="settings-grid">'+Object.entries(categories).map(([key,value])=>'<section class="text-entry">'+field(value,["categories",state.lang,key],"Название направления",0)+'<div class="field-tools"><small class="muted">'+esc(key)+'</small><button type="button" class="text-button" data-action="delete-category" data-key="'+esc(key)+'">Удалить направление</button></div></section>').join("")+'</div>';
  }
  function isLocalized(value) { return value && typeof value==="object"&&!Array.isArray(value)&&langs.some(lang=>Object.hasOwn(value,lang)); }
  function field(value,path,label,depth,rich) {
    const key=String(path[path.length-1]),binding=pathAttr(path),id="field-"+(++field.counter);
    if(typeof value==="boolean")return '<div class="editor-field"><label class="checkbox-field" for="'+id+'"><input id="'+id+'" type="checkbox" data-path="'+binding+'" data-value-type="boolean" '+(value?"checked":"")+'>'+esc(label)+'</label></div>';
    if(Array.isArray(value)){
      if(typeof path[path.length-1]==="number"&&value.length===2&&(path.includes("faqs")||path.includes("faq")||path.includes("facts")||path.includes("history")||path.includes("capabilities")||path[0]==="processSteps")){
        const pairLabels=path.includes("faqs")||path.includes("faq")?["Вопрос","Ответ"]:path.includes("facts")?["Значение","Подпись"]:["Заголовок","Описание"];
        return '<div class="editor-field">'+value.map((item,index)=>field(item,[...path,index],pairLabels[index],depth+1)).join("")+'</div>';
      }
      return arrayField(value,path,label,depth);
    }
    if(value&&typeof value==="object") {
      if(isLocalized(value)) {
        const rest=Object.keys(value).filter(k=>!langs.includes(k));
        return '<div class="editor-field"><p class="field-separator-label">'+esc(label)+' <small class="muted">· '+state.lang.toUpperCase()+'</small></p>'+field(value[state.lang]??"",[...path,state.lang],typeof value[state.lang]==="object"?"Содержание":label,depth+1,rich)+rest.map(k=>field(value[k],[...path,k],labelFor(k),depth+1)).join("")+'</div>';
      }
      const fields=Object.entries(value).map(([k,v])=>field(v,[...path,k],labelFor(k),depth+1)).join("");
      return depth===0?fields:'<details class="nested-group" '+(depth<2?"open":"")+'><summary>'+esc(label)+'</summary><div class="nested-fields">'+fields+'</div></details>';
    }
    const readonly=["id","kind","serviceId","targetId"].includes(key),number=typeof value==="number",text=String(value??""),hint=key==="id"?"Служебный идентификатор сохраняет связи материалов.":key==="slug"?"Латинские буквы, цифры и дефисы, например sample-requirements.":"";
    let control="";
    if(key==="status")control='<select id="'+id+'" data-path="'+binding+'"><option value="published" '+(text==="published"?"selected":"")+'>Опубликовано</option><option value="draft" '+(text==="draft"?"selected":"")+'>Черновик</option></select>';
    else if(key==="target")control='<select id="'+id+'" data-path="'+binding+'"><option value="_self" '+(text!=="_blank"?"selected":"")+'>В текущей вкладке</option><option value="_blank" '+(text==="_blank"?"selected":"")+'>В новой вкладке</option></select>';
    else if(key==="page"&&path[0]==="sections")control='<select id="'+id+'" data-path="'+binding+'">'+(state.content.pages||[]).map(page=>'<option value="'+esc(page.id)+'" '+(text===page.id?"selected":"")+'>'+esc(local(page.title)||page.slug||page.id)+'</option>').join("")+'</select>';
    else if(key==="category")control='<select id="'+id+'" data-path="'+binding+'">'+Object.entries(state.content.categories?.ru||{}).map(([cat,name])=>'<option value="'+esc(cat)+'" '+(text===cat?"selected":"")+'>'+esc(state.content.categories?.[state.lang]?.[cat]||name)+'</option>').join("")+'</select>';
    else if(key==="level")control='<select id="'+id+'" data-path="'+binding+'" data-value-type="number"><option value="2" '+(Number(value)===2?"selected":"")+'>H2 — заголовок раздела</option><option value="3" '+(Number(value)===3?"selected":"")+'>H3 — подзаголовок</option></select>';
    else if(key==="type"&&path.includes("blocks"))control='<input id="'+id+'" value="'+esc(text)+'" readonly>';
    else {
      const mediaKey=/^(src|photo|logo|logoFull|logoMark|pricePdf)$/.test(key),urlKey=mediaKey||/^(url|href|videoUrl|limsUrl|mapUrl|sourceUrl)$/.test(key);
      const multiline=!readonly&&!urlKey&&!number&&(rich||path[0]==="assistant"&&path.includes("knowledge")&&path.includes("text")||path.includes("blocks")&&path.includes("text")||text.length>100||/\n/.test(text)||/^(text|body|lead|desc|description|overview|result|requirements|note|caption|qualityText|ctaText|equipmentIntro)$/.test(key));
      if(multiline) {
        const formatted=!!rich||path.includes("blocks")&&path.includes("text");
        control=(formatted?'<div class="format-toolbar" data-format-for="'+id+'"><button type="button" data-action="format" data-format="strong" data-field="'+id+'" aria-label="Полужирный"><b>B</b></button><button type="button" data-action="format" data-format="em" data-field="'+id+'" aria-label="Курсив"><i>I</i></button><button type="button" data-action="format" data-format="p" data-field="'+id+'">¶</button><button type="button" data-action="format" data-format="br" data-field="'+id+'">↵</button><button type="button" data-action="format" data-format="a" data-field="'+id+'">Ссылка</button><button type="button" class="preview-toggle" data-action="preview" data-field="'+id+'">Предпросмотр</button></div>':"")+'<textarea id="'+id+'" data-path="'+binding+'" rows="'+(text.length>400?6:3)+'">'+esc(text)+'</textarea>';
      } else if(mediaKey)control='<div class="image-field-row"><input id="'+id+'" value="'+esc(text)+'" data-path="'+binding+'" placeholder="/uploads/файл"><button type="button" class="button small" data-action="pick-media" data-path="'+binding+'">Выбрать файл</button></div>'+(safeUrl(text,true)&&!/\.(pdf|docx?|xlsx?|zip)(?:[?#]|$)/i.test(text)?'<img class="field-image-preview" src="'+esc(safeUrl(text,true))+'" alt="">':"");
      else control='<input id="'+id+'" '+(number?'type="number" step="any" data-value-type="number"':key==="email"?'type="email"':'type="text"')+' value="'+esc(text)+'" data-path="'+binding+'" '+(readonly?"readonly":"")+' '+(key==="slug"?'pattern="[a-z0-9][a-z0-9-]*"':"")+'>';
      if(urlKey&&!mediaKey&&key!=="sourceUrl")control+='<div class="field-tools"><button type="button" class="text-button" data-action="pick-media" data-path="'+binding+'">Выбрать файл из медиатеки</button></div>';
    }
    return '<div class="editor-field"><label for="'+id+'"><span class="field-name"><span>'+esc(label)+'</span></span>'+control+(hint?'<small>'+hint+'</small>':"")+'</label></div>';
  }
  field.counter=0;
  function arrayField(value,path,label,depth) {
    const binding=pathAttr(path),key=String(path[path.length-1]),block=key==="blocks";
    const inner=value.map((item,index)=>'<div class="repeater-item"><div class="repeater-heading"><span>'+esc(Array.isArray(item)&&path.includes("faqs")?(index===0?"Вопрос":"Ответ"):(item&&typeof item==="object"?(local(item.title)||item.type||"Пункт")+" "+(index+1):"Пункт "+(index+1)))+'</span><div class="row-actions"><button type="button" data-action="array-move" data-path="'+binding+'" data-index="'+index+'" data-direction="-1" aria-label="Поднять пункт" '+(index===0?"disabled":"")+'>↑</button><button type="button" data-action="array-move" data-path="'+binding+'" data-index="'+index+'" data-direction="1" aria-label="Опустить пункт" '+(index===value.length-1?"disabled":"")+'>↓</button><button type="button" data-action="array-remove" data-path="'+binding+'" data-index="'+index+'" aria-label="Удалить пункт">×</button></div></div><div class="repeater-fields">'+field(item,[...path,index],path.includes("faqs")?(index===0?"Вопрос":"Ответ"):"Содержание",depth+1,block)+'</div></div>').join("");
    return '<div class="editor-field"><p class="field-separator-label">'+esc(label)+'</p><div class="repeater">'+(inner||'<p class="repeater-empty">Пока нет пунктов.</p>')+'</div><div class="repeater-add">'+(block?'<select aria-label="Тип нового блока" data-block-select="'+esc(JSON.stringify(path))+'"><option value="text">Текст</option><option value="heading">Заголовок</option><option value="image">Изображение</option><option value="button">Кнопка</option><option value="list">Список</option><option value="quote">Цитата</option></select>':"")+'<button type="button" class="button small" data-action="array-add" data-path="'+binding+'">＋ '+(block?"Добавить блок":"Добавить пункт")+'</button></div></div>';
  }
  function blank(value,key) { if(key==="id")return uid("item");if(typeof value==="boolean")return true;if(typeof value==="number")return 0;if(typeof value==="string")return "";if(Array.isArray(value))return[];if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,blank(v,k)]));return""; }
  function blockTemplate(type) { const item={id:uid("block"),type,text:{ru:"",kg:"",en:""}};if(type==="heading")item.level=2;if(type==="image"){item.src="";item.alt={ru:"",kg:"",en:""};}if(type==="button")item.url="";if(type==="list")item.items=[{ru:"",kg:"",en:""}];return item; }
  function newItem() {
    const localized=(text)=>({ru:text||"",kg:"",en:""});
    const id=uid(state.view==="sections"?"cms":state.view==="services"?"service":"item");
    if(state.view==="assistantKnowledge")return{id,title:localized("Новый ответ"),text:localized(""),tags:"",status:"draft"};
    if(state.view==="pages")return{id,slug:"new-page-"+Date.now().toString(36),kind:"custom",title:localized("Новая страница"),description:localized(""),status:"draft",blocks:[]};
    if(state.view==="sections")return{id,page:state.sectionPage!=="all"?state.sectionPage:(state.content.pages.find(page=>page.kind==="home")?.id||"home"),title:localized("Новый раздел"),enabled:true,blocks:[]};
    if(state.view==="menus")return{id,label:localized("Новый пункт"),url:"/",target:"_self"};
    if(state.view==="services")return{id,icon:"flask",category:Object.keys(state.content.categories?.ru||{})[0]||"prep",name:localized("Новая услуга"),desc:localized(""),method:localized(""),samples:localized(""),requirements:localized(""),result:localized(""),material:localized(""),photo:"",status:"draft"};
    if(state.view==="priceEntries")return{id,category:Object.keys(state.content.categories?.ru||{})[0]||"prep",title:localized("Новая позиция"),code:"",detail:"",amount:"",detailLocalized:localized(""),amountLocalized:localized("")};
    if(state.view==="faqs")return["Новый вопрос",""];
    if(state.view==="documents")return{id,title:localized("Новый документ"),url:"",caption:localized("")};
    if(state.view==="partners")return{id,name:"Новый партнёр",logo:"",url:""};
    if(state.view==="equipment")return{id,type:"",model:"Новое оборудование",manufacturer:"",description:localized(""),showOnHome:true};
    if(state.view==="images")return{id,label:"Новое изображение",selector:"",src:"",alt:localized("")};
    return records()[0]?{...blank(records()[0]),id}:{id,title:localized("Новый материал")};
  }
  function ensurePriceLocales(item) {
    if(state.view!=="priceEntries")return;
    if(!item.detailLocalized)item.detailLocalized={ru:state.content.priceTranslations?.details?.[item.detail]?.ru||item.detail||"",kg:state.content.priceTranslations?.details?.[item.detail]?.kg||item.detail||"",en:item.detail||""};
    if(!item.amountLocalized)item.amountLocalized={ru:state.content.priceTranslations?.amounts?.[item.amount]?.ru||item.amount||"",kg:state.content.priceTranslations?.amounts?.[item.amount]?.kg||item.amount||"",en:item.amount||""};
  }
  function addRecord() {
    let list=read(collectionPath());if(!Array.isArray(list)){write(collectionPath(),[]);list=read(collectionPath());}
    const item=newItem();list.push(item);
    if(state.view==="services") {
      state.content.serviceContent=state.content.serviceContent||{};
      const first=Object.values(state.content.serviceContent).find(v=>v&&v.ru);
      state.content.serviceContent[item.id]=first?blank(first):{ru:{lead:"",overviewTitle:"",overview:[],facts:[],methodsTitle:"",methods:[],sampleTags:[],requirements:[],result:"",note:"",faq:[]},kg:{},en:{}};
      if(first)state.content.serviceContent[item.id].sourceUrl="";
      attachServicePage(item);
    }
    state.item=list.length-1;ensurePriceLocales(item);setDirty();drawNav();render();
  }
  function attachServicePage(service,sourceServiceId) {
    const sourcePage=state.content.pages.find(page=>page.kind==="service"&&page.serviceId===(sourceServiceId||""))||state.content.pages.find(page=>page.kind==="service");
    let templates=sourcePage?(state.content.sections||[]).filter(section=>section.page===sourcePage.id):[];
    if(!templates.length)templates=[["detail-overview","Описание"],["detail-methods","Методы"],["detail-samples","Образцы"],["detail-result","Результат"],["detail-pricing","Стоимость"],["detail-faq","Вопросы"],["detail-next","Запрос КП"],["detail-related","Другие услуги"]].map(([targetId,title])=>({targetId,title,enabled:true,blocks:[]}));
    const page={id:uid("page"),slug:service.id,kind:"service",serviceId:service.id,title:clone(service.name),description:clone(service.desc),status:service.status||"draft",blocks:[]};
    state.content.pages.push(page);state.content.sections=state.content.sections||[];
    state.content.sections.push(...templates.map(template=>({...clone(template),id:uid("section"),page:page.id,targetId:template.targetId||template.id,blocks:(template.blocks||[]).map(block=>({...clone(block),id:uid("block")}))})));
    return page;
  }
  function duplicateRecord(index) {
    const list=records(),original=list[index];if(!original)return;
    const item=clone(original);
    if(!Array.isArray(item)) {
      const oldId=item.id;item.id=uid(state.view==="sections"?"cms":"item");if(item.slug)item.slug+="-copy-"+Date.now().toString(36);
      const name=item.title||item.name||item.label;if(typeof name==="string"){if(item.title)item.title+=" — копия";else if(item.name)item.name+=" — копия";else item.label+=" — копия";}else if(name?.ru)name.ru+=" — копия";
      if(item.status)item.status="draft";
      if(state.view==="pages"&&item.kind!=="custom"){item.kind="custom";delete item.serviceId;item.slug="new-page-"+Date.now().toString(36);}
      if(state.view==="sections"){delete item.targetId;if(typeof item.title==="string")item.title={ru:item.title,kg:"",en:""};}
      if(state.view==="services") {state.content.serviceContent[item.id]=clone(state.content.serviceContent[oldId]||{});attachServicePage(item,oldId);}
      if(item.blocks)item.blocks.forEach(block=>block.id=uid("block"));
    }
    list.splice(index+1,0,item);state.item=index+1;setDirty();drawNav();render();toast("Копия создана. Сохраните изменения после редактирования.");
  }
  function deleteRecord(index) {
    const list=records(),item=list[index];if(!item)return;
    const linkedService=state.view==="pages"&&item.kind==="service";
    if(!confirm("Удалить «"+recordName(item,index)+"»?"+(state.view==="services"?" Будет также удалена связанная страница услуги и её разделы.":linkedService?" Будет также удалена связанная услуга, её содержание и разделы.":"")+" Удаление вступит в силу после сохранения. Предыдущую сохранённую версию можно восстановить в истории."))return;
    if(state.view==="services"||linkedService){
      const serviceId=linkedService?item.serviceId:item.id,pageIds=state.content.pages.filter(page=>page.kind==="service"&&page.serviceId===serviceId).map(page=>page.id);
      delete state.content.serviceContent?.[serviceId];state.content.pages=state.content.pages.filter(page=>!(page.kind==="service"&&page.serviceId===serviceId));state.content.sections=state.content.sections.filter(section=>!pageIds.includes(section.page));
      if(linkedService)state.content.services=state.content.services.filter(service=>service.id!==serviceId);else list.splice(index,1);
    }else{if(state.view==="pages")state.content.sections=state.content.sections.filter(section=>section.page!==item.id);list.splice(index,1);}
    state.item=null;setDirty();drawNav();render();
  }
  function templateForArray(path,list) {
    const key=String(path[path.length-1]);
    if(path[0]==="processSteps"||path[0]==="faqs")return["",""];
    if(key==="methods")return{title:"",text:""};
    if(key==="facts"||key==="faq"||key==="history"||key==="capabilities")return["",""];
    if(key==="items")return{ru:"",kg:"",en:""};
    if(list.length)return blank(list[0]);
    return"";
  }
  function richPreview(value) {
    const doc=new DOMParser().parseFromString(String(value),"text/html");
    const allowed=new Set(["P","BR","STRONG","B","EM","I","UL","OL","LI","A","H2","H3","BLOCKQUOTE"]);
    for(const node of [...doc.body.querySelectorAll("*")]) {
      if(["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","SVG","MATH","FORM","INPUT","BUTTON","IMG","LINK","META"].includes(node.tagName)){node.remove();continue;}
      if(!allowed.has(node.tagName)){node.replaceWith(...node.childNodes);continue;}
      const href=node.tagName==="A"?safeUrl(node.getAttribute("href"),false):"";
      for(const attr of [...node.attributes])node.removeAttribute(attr.name);
      if(href){node.setAttribute("href",href);node.setAttribute("target","_blank");node.setAttribute("rel","noopener noreferrer");}
    }
    return doc.body.innerHTML;
  }
  async function loadMedia(dialog) {
    try { const result=await api("/api/admin/media");state.media=result.media||[];const target=dialog?$("#media-dialog-content"):$("#media-workspace");if(target)target.innerHTML=mediaView(dialog); }
    catch(error){const target=dialog?$("#media-dialog-content"):$("#media-workspace");if(target)target.innerHTML='<p class="global-error">'+esc(error.message)+'</p>';}
  }
  function mediaView(dialog) {
    return '<div class="upload-box"><div><h3>Добавить файл</h3><p>JPG, PNG, WebP или PDF · до 10 МБ</p></div><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" data-media-upload="'+(dialog?"dialog":"workspace")+'" aria-label="Загрузить файл"></div><div class="media-toolbar"><p class="toolbar-note">Файлов: '+state.media.length+'</p><input class="search-input" type="search" data-media-search placeholder="Поиск по имени файла…" aria-label="Поиск файлов"></div>'+(state.media.length?'<div class="media-grid">'+state.media.map(file=>{
      const url=safeUrl(file.url,true),image=/^image\//.test(file.mime),alt=local(file.alt)||"";
      return '<article class="media-card" data-media-card data-search="'+esc((file.filename+" "+alt).toLocaleLowerCase("ru"))+'"><div class="media-visual">'+(image&&url?'<img src="'+esc(url)+'" alt="'+esc(alt)+'" loading="lazy">':'<span class="file-badge">PDF</span>')+'</div><div class="media-info"><strong>'+esc(file.filename)+'</strong><small>'+esc(file.mime)+' · '+formatBytes(file.size)+'</small><label>Описание / alt<input type="text" value="'+esc(alt)+'" data-media-alt="'+esc(file.id)+'" maxlength="500"></label><div class="row-actions">'+(dialog?'<button type="button" data-action="select-media" data-id="'+esc(file.id)+'">Выбрать</button>':"")+'<button type="button" data-action="save-media-alt" data-id="'+esc(file.id)+'">Сохранить alt</button><button type="button" data-action="copy-media" data-id="'+esc(file.id)+'">Ссылка</button><button type="button" data-action="delete-media" data-id="'+esc(file.id)+'">Удалить</button></div><p class="media-url">'+esc(file.url)+'</p></div></article>';
    }).join("")+'</div>':'<div class="empty-state"><h3>Медиатека пока пуста</h3><p>Загрузите фотографии, логотипы или PDF. Затем выберите их в редакторе материала.</p></div>');
  }
  function formatBytes(size) { return Number(size)>=1048576?(Number(size)/1048576).toFixed(1)+" МБ":Math.max(1,Math.round(Number(size)/1024))+" КБ"; }
  function displayDate(value) { const date=new Date(value);return Number.isFinite(date.getTime())?date.toLocaleString("ru-RU",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"Дата не указана"; }
  async function loadBackups() {
    try{
      const result=await api("/api/admin/backups");state.backups=result.backups||[];
      const target=$("#backups-workspace");if(!target)return;
      target.innerHTML='<div class="toolbar"><p class="toolbar-note">Автоматически сохраняются последние 10 версий содержимого.</p><div class="toolbar-right"><button type="button" class="button small" data-action="refresh-backups">Обновить историю</button><button type="button" class="button small" data-action="export">Скачать текущую копию</button></div></div><div class="inline-notice">Восстановление заменяет тексты, структуру и настройки сайта, создавая новую версию. Текущее сохранённое содержимое также попадёт в историю. Файлы медиатеки хранятся отдельно: для полной резервной копии используйте резервное копирование хостинга.</div>'+
      (state.backups.length?'<table class="collection-table"><thead><tr><th>Версия</th><th>Дата сохранения</th><th class="hide-mobile">Размер</th><th></th></tr></thead><tbody>'+state.backups.map(backup=>'<tr><td><strong>№ '+esc(backup.revision)+'</strong><small class="record-subtitle">'+esc(backup.id)+'</small></td><td>'+esc(displayDate(backup.updatedAt||backup.createdAt))+'</td><td class="hide-mobile">'+formatBytes(backup.size)+'</td><td><button type="button" class="button small" data-action="restore-backup" data-id="'+esc(backup.id)+'">Восстановить</button></td></tr>').join("")+'</tbody></table>':'<div class="empty-state"><h3>История пока пуста</h3><p>Предыдущая версия будет сохранена автоматически после первого изменения содержимого сайта.</p></div>');
    }catch(error){const target=$("#backups-workspace");if(target)target.innerHTML='<p class="global-error">'+esc(error.message)+'</p>';}
  }
  async function pickMedia(path) {state.mediaPath=path;$("#media-dialog-content").innerHTML='<p class="media-loading">Загружаем файлы…</p>';$("#media-dialog").showModal();await loadMedia(true);}
  async function upload(file,dialog,input) {
    if(!file)return;if(file.size>10*1024*1024){toast("Размер файла превышает 10 МБ.",true);return;}
    const form=new FormData();form.append("file",file);input.disabled=true;
    try{await api("/api/admin/media",{method:"POST",body:form});toast("Файл загружен.");await loadMedia(dialog);}
    catch(error){toast(error.message,true);input.disabled=false;input.value="";}
  }
  function exportContent() { const blob=new Blob([JSON.stringify({revision:state.revision,exportedAt:new Date().toISOString(),content:state.content},null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="sael-content-"+new Date().toISOString().slice(0,10)+".json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast("Копия контента скачана."); }
  async function openAccount() { $("#account-dialog").showModal();$("#password-form").reset();$("#password-message").hidden=true;state.totpSecret=null;state.totpUrl=null;await refreshTotp(); }
  function ensureAssistant() {
    const defaults={enabled:true,title:{ru:"Помощник SAEL",kg:"SAEL жардамчысы",en:"SAEL assistant"},welcome:{ru:"Здравствуйте! Чем можем помочь?",kg:"Саламатсызбы! Кантип жардам бере алабыз?",en:"Hello! How can we help?"},instructions:"",hours:{timezone:"Asia/Bishkek",weekdays:[1,2,3,4,5],start:"08:00",end:"17:00"},handoffEmail:"sael.karabalta@saelglobal.com",knowledge:[]};
    const value=state.content.assistant||{};
    state.content.assistant={...defaults,...value,hours:{...defaults.hours,...(value.hours||{})},knowledge:Array.isArray(value.knowledge)?value.knowledge:[]};
    return state.content.assistant;
  }
  function assistantTabs(active) {
    return '<div class="tabs assistant-tabs"><button type="button" data-action="navigate" data-view="assistant" class="'+(active==="settings"?"active":"")+'">Настройки помощника</button><button type="button" data-action="navigate" data-view="assistantKnowledge" class="'+(active==="knowledge"?"active":"")+'">База знаний и обучение</button><button type="button" data-action="navigate" data-view="assistantInbox">Диалоги с клиентами ↗</button></div>';
  }
  function assistantTextarea(value,path,label,hint,rows) {
    const id="assistant-field-"+(++field.counter);
    return '<div class="editor-field"><label for="'+id+'">'+esc(label)+'<textarea id="'+id+'" data-path="'+pathAttr(path)+'" rows="'+(rows||4)+'" maxlength="10000">'+esc(value)+'</textarea>'+(hint?'<small>'+esc(hint)+'</small>':"")+'</label></div>';
  }
  function assistantEditor() {
    const a=ensureAssistant(),days=[[1,"Пн"],[2,"Вт"],[3,"Ср"],[4,"Чт"],[5,"Пт"],[6,"Сб"],[0,"Вс"]];
    return assistantTabs("settings")+'<div class="toolbar"><p class="toolbar-note">Помогайте посетителям выбрать услугу и передавайте сложные вопросы специалисту.</p>'+languageSwitch()+'</div><div class="assistant-settings-grid"><div><section class="editor-card"><h2>Помощник на сайте</h2>'+field(a.enabled,["assistant","enabled"],"Показывать помощника посетителям",0)+field(a.title,["assistant","title"],"Название помощника",0)+assistantTextarea(a.welcome[state.lang]||"",["assistant","welcome",state.lang],"Первое сообщение · "+state.lang.toUpperCase(),"Приветствие, которое посетитель увидит при открытии чата.",3)+'</section><section class="editor-card"><h2>Правила общения</h2>'+assistantTextarea(a.instructions,["assistant","instructions"],"Как отвечать клиентам","Опишите желаемый тон общения, порядок уточняющих вопросов и ситуации, в которых нужно пригласить специалиста.",7)+'<div class="assistant-note">Услуги, цены и FAQ берутся из материалов сайта. Дополнительные утверждённые ответы добавляются в базу знаний.</div><button type="button" class="button" data-action="navigate" data-view="assistantKnowledge">Открыть базу знаний →</button></section></div><aside><section class="editor-card"><h2>Подключение ИИ</h2><div id="assistant-config-status" role="status"><p class="muted">Проверяем настройки сервера…</p></div><button type="button" class="text-button" data-action="assistant-refresh-config">Проверить состояние</button></section><section class="editor-card"><h2>Рабочее время специалистов</h2><p class="editor-help">В эти часы чат может предложить живое общение, если оператор включил приём обращений в разделе «Диалоги».</p><div class="assistant-weekdays" role="group" aria-label="Рабочие дни">'+days.map(([day,name])=>'<label><input type="checkbox" data-assistant-day="'+day+'" '+(a.hours.weekdays.includes(day)?"checked":"")+'><span>'+name+'</span></label>').join("")+'</div><div class="assistant-hours"><label>С<input type="time" data-path="'+pathAttr(["assistant","hours","start"])+'" value="'+esc(a.hours.start)+'"></label><label>До<input type="time" data-path="'+pathAttr(["assistant","hours","end"])+'" value="'+esc(a.hours.end)+'"></label></div><label>Часовой пояс<input type="text" data-path="'+pathAttr(["assistant","hours","timezone"])+'" value="'+esc(a.hours.timezone)+'" placeholder="Asia/Bishkek"></label><label>Почта для обращений<input type="email" data-path="'+pathAttr(["assistant","handoffEmail"])+'" value="'+esc(a.handoffEmail)+'"></label></section><section class="editor-card"><h3>Передача специалисту</h3><p class="editor-help">В рабочее время подключённый оператор увидит запрос в диалогах. Если специалист недоступен, посетитель сможет оставить контакты для ответа.</p><button type="button" class="button" data-action="navigate" data-view="assistantInbox">Открыть диалоги</button></section></aside></div>';
  }
  async function refreshAssistantConfig() {
    const target=$("#assistant-config-status");
    try{
      const config=await api("/api/assistant/config");state.assistantConfig=config;
      if(!target||state.view!=="assistant")return;
      target.innerHTML='<div class="assistant-config-line"><span class="connection-dot '+(config.aiConfigured?"online":"")+'"></span><strong>'+(config.aiConfigured?"Ключ ИИ задан на сервере":"Ключ ИИ пока не задан")+'</strong></div><p class="editor-help">'+(config.aiConfigured?"Проверьте ответы помощника в тестовом диалоге на сайте.":"Для ответов ИИ задайте OPENAI_API_KEY в закрытых переменных Plesk и перезапустите приложение.")+'</p><p class="field-hint">Ключ хранится на сервере. Здесь отображается только состояние настройки.</p>';
    }catch(error){if(target&&state.view==="assistant")target.innerHTML='<p class="form-message error">'+esc(error.message)+'</p>';}
  }
  function inboxIsVisible() { return !!state.content&&state.view==="assistantInbox"&&document.visibilityState!=="hidden"; }
  function conversationStatus(status) { return({ai:"Отвечает помощник",waiting:"Ожидает специалиста",callback:"Нужен обратный звонок",active:"Специалист в диалоге",closed:"Завершён"})[status]||"Диалог"; }
  function inboxEditor() {
    state.inboxConversations=state.inboxConversations||[];state.inboxDrafts=state.inboxDrafts||{};
    return '<section class="operator-banner"><div><p class="eyebrow">ОПЕРАТОРСКАЯ</p><h2>Разговор продолжается с вами.</h2><p>Принимайте обращения, смотрите историю и отвечайте посетителям прямо из панели.</p></div><span class="operator-banner-symbol" aria-hidden="true">◌</span></section><section class="operator-presence-card"><div id="operator-presence" role="status">'+operatorPresenceMarkup()+'</div><label class="operator-availability"><input id="operator-online" type="checkbox" '+(state.operatorWanted?"checked":"")+'><span><strong>Принимать обращения</strong><small>Пока открыт этот раздел в активной вкладке</small></span></label></section><p class="operator-presence-help">При выходе из раздела или переключении вкладки приём временно отключается. Вне рабочих часов можно отвечать на уже оставленные обращения, но посетителям предлагается оставить контакты.</p><div class="operator-workspace"><aside class="operator-list-panel"><div class="operator-list-toolbar"><div><h3>Обращения <span id="operator-conversation-count">'+state.inboxConversations.length+'</span></h3><button type="button" class="icon-button" data-action="operator-refresh" aria-label="Обновить диалоги">↻</button></div><input id="operator-search" type="search" placeholder="Имя, телефон или сообщение…" aria-label="Поиск диалогов" value="'+esc(state.inboxQuery||"")+'"><select id="operator-status-filter" aria-label="Статус диалогов"><option value="attention">Нужен специалист</option><option value="all">Все диалоги</option><option value="active">В работе</option><option value="closed">Завершённые</option></select></div><div id="operator-list" class="operator-list"><p class="media-loading">Загружаем диалоги…</p></div><p id="operator-poll-status" class="operator-poll-status" role="status">Обновляем каждые 5 секунд, пока раздел открыт.</p></aside><section id="operator-conversation" class="operator-conversation-panel" aria-label="Выбранный диалог"><div class="operator-empty"><span aria-hidden="true">◌</span><h3>Выберите обращение</h3><p>Здесь появятся история разговора, контакты клиента и поле ответа специалиста.</p></div></section></div>';
  }
  function operatorPresenceMarkup() {
    const presence=state.operatorPresence||{},paused=state.operatorWanted&&!inboxIsVisible(),connected=state.operatorWanted&&inboxIsVisible()&&!state.operatorPresenceError&&presence.online;
    const heading=state.operatorPresenceBusy?"Обновляем подключение…":paused?"Приём приостановлен":connected?"Вы подключены к диалогам":"Вы не принимаете новые обращения";
    const schedule=presence.isWorkingHours===true?"Сейчас рабочее время":presence.isWorkingHours===false?"Сейчас вне рабочего времени":"Рабочее время проверяется на сервере";
    const availability=connected&&presence.available?"Посетители могут запросить специалиста.":connected?"Вы подключены. Новым посетителям предлагается оставить контакты.":"Включите приём, когда готовы отвечать.";
    return '<div class="operator-connection"><span class="connection-dot '+(connected?"online":"")+'"></span><div><strong>'+heading+'</strong><p>'+esc(schedule)+' · '+esc(availability)+'</p></div></div>'+(state.operatorPresenceError?'<p class="operator-inline-error">'+esc(state.operatorPresenceError)+'</p>':"");
  }
  function updateOperatorPresence() {
    const target=$("#operator-presence");if(target)target.innerHTML=operatorPresenceMarkup();
    const input=$("#operator-online");if(input){input.checked=!!state.operatorWanted;input.disabled=!!state.operatorPresenceBusy;}
  }
  async function postOperatorPresence(online,options) {
    const result=await api("/api/admin/assistant/presence",{method:"POST",body:{online:!!online},...(options||{})});
    state.operatorPresence=result;state.operatorPresenceError="";return result;
  }
  async function setOperatorAvailability(online) {
    if(online&&!inboxIsVisible())return;
    state.operatorWanted=!!online;state.operatorPresenceBusy=true;updateOperatorPresence();
    try{
      await postOperatorPresence(online);
      if(online&&(!inboxIsVisible()||!state.operatorWanted)){state.operatorPostedOnline=false;await postOperatorPresence(false);}
      else state.operatorPostedOnline=!!online;
    }
    catch(error){state.operatorWanted=false;state.operatorPostedOnline=false;state.operatorPresenceError=error.message;}
    finally{state.operatorPresenceBusy=false;updateOperatorPresence();scheduleOperatorHeartbeat();}
  }
  function scheduleOperatorHeartbeat() {
    clearInterval(state.operatorHeartbeat);state.operatorHeartbeat=null;
    if(!state.operatorWanted||!inboxIsVisible())return;
    state.operatorHeartbeat=setInterval(async()=>{
      if(!state.operatorWanted||!inboxIsVisible()||state.operatorPresenceBusy)return;
      try{await postOperatorPresence(true);if(!inboxIsVisible()||!state.operatorWanted){state.operatorPostedOnline=false;await postOperatorPresence(false);}else state.operatorPostedOnline=true;}
      catch(error){state.operatorPresenceError=error.message;}
      updateOperatorPresence();
    },30000);
  }
  function stopOperatorRuntime(keepWanted,options) {
    clearInterval(state.operatorPoll);clearInterval(state.operatorHeartbeat);state.operatorPoll=null;state.operatorHeartbeat=null;
    state.inboxEpoch=(state.inboxEpoch||0)+1;
    if(!keepWanted)state.operatorWanted=false;
    const posted=state.operatorPostedOnline;state.operatorPostedOnline=false;
    if(posted&&state.csrf)postOperatorPresence(false,options).catch(()=>{}).finally(updateOperatorPresence);
    updateOperatorPresence();
  }
  function startOperatorRuntime() {
    clearInterval(state.operatorPoll);clearInterval(state.operatorHeartbeat);state.inboxEpoch=(state.inboxEpoch||0)+1;
    if(!inboxIsVisible())return;
    const epoch=state.inboxEpoch;state.inboxPollBusy=false;
    if($("#operator-status-filter"))$("#operator-status-filter").value=state.inboxFilter||"attention";
    refreshInbox(epoch);
    state.operatorPoll=setInterval(()=>refreshInbox(epoch),5000);
    if(state.operatorWanted)setOperatorAvailability(true);else updateOperatorPresence();
  }
  function inboxCurrent(epoch) { return inboxIsVisible()&&state.inboxEpoch===epoch; }
  async function refreshInbox(epoch) {
    epoch=epoch===undefined?state.inboxEpoch:epoch;
    if(!inboxCurrent(epoch)||state.inboxPollBusy)return;state.inboxPollBusy=true;
    try{
      const result=await api("/api/admin/assistant/conversations");if(!inboxCurrent(epoch))return;
      state.inboxConversations=result.conversations||[];renderInboxList();
      try{const presence=await api("/api/admin/assistant/presence");if(inboxCurrent(epoch)&&!state.operatorPresenceBusy){state.operatorPresence=presence;updateOperatorPresence();}}catch(error){if(inboxCurrent(epoch)){state.operatorPresenceError=error.message;updateOperatorPresence();}}
      if(state.inboxSelectedId)await refreshSelectedConversation(state.inboxSelectedId,epoch);
      if(inboxCurrent(epoch)&&$("#operator-poll-status"))$("#operator-poll-status").textContent="Обновлено "+new Date().toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})+" · обновляем каждые 5 секунд";
    }catch(error){if(inboxCurrent(epoch)&&$("#operator-poll-status"))$("#operator-poll-status").textContent=error.message;}
    finally{if(state.inboxEpoch===epoch)state.inboxPollBusy=false;}
  }
  function renderInboxList() {
    const target=$("#operator-list");if(!target)return;
    const all=state.inboxConversations||[],query=String(state.inboxQuery||"").toLocaleLowerCase("ru"),filter=state.inboxFilter||"attention";
    const list=all.filter(conversation=>{
      const contact=conversation.contact||{},last=typeof conversation.lastMessage==="string"?conversation.lastMessage:conversation.lastMessage?.text||"";
      const matches=[contact.name,contact.email,contact.phone,last,conversation.id].join(" ").toLocaleLowerCase("ru").includes(query);
      return matches&&(filter==="all"||filter==="attention"&&["waiting","callback","active"].includes(conversation.status)||conversation.status===filter);
    }).sort((a,b)=>({waiting:0,callback:0,active:1,ai:2,closed:3}[a.status]??4)-({waiting:0,callback:0,active:1,ai:2,closed:3}[b.status]??4)||new Date(b.updatedAt)-new Date(a.updatedAt));
    if($("#operator-conversation-count"))$("#operator-conversation-count").textContent=String(all.length);
    target.innerHTML=list.length?list.map(conversation=>{
      const contact=conversation.contact||{},name=contact.name||"Посетитель",last=typeof conversation.lastMessage==="string"?conversation.lastMessage:conversation.lastMessage?.text||"Сообщений пока нет";
      return '<button type="button" class="operator-list-item '+(conversation.id===state.inboxSelectedId?"selected":"")+'" data-action="operator-select" data-id="'+esc(conversation.id)+'"><span class="operator-list-item-top"><strong>'+esc(name)+'</strong><time>'+esc(new Date(conversation.updatedAt||conversation.createdAt).toLocaleDateString("ru-RU",{day:"2-digit",month:"short"}))+'</time></span><span class="operator-status operator-status-'+esc(conversation.status)+'">'+esc(conversationStatus(conversation.status))+'</span><span class="operator-list-preview">'+esc(String(last).slice(0,130))+'</span><span class="operator-list-item-bottom"><span>'+esc((conversation.locale||"ru").toUpperCase())+' · № '+esc(String(conversation.id).slice(-8))+'</span><span>'+Number(conversation.messageCount||0)+' сообщ.</span></span></button>';
    }).join(""):'<div class="operator-list-empty"><strong>Обращений пока нет</strong><p>'+(filter==="attention"?"Запросы специалиста и оставленные контакты появятся здесь. Другие разговоры доступны в фильтре «Все диалоги».":"Измените фильтр или поисковый запрос.")+'</p></div>';
  }
  async function refreshSelectedConversation(id,epoch,force) {
    const result=await api("/api/admin/assistant/conversations/"+encodeURIComponent(id));
    if(!inboxCurrent(epoch)||state.inboxSelectedId!==id)return;
    const conversation=result.conversation;if(!conversation)return;
    state.inboxDetails=state.inboxDetails||{};state.inboxDetails[id]=conversation;
    const signature=JSON.stringify([conversation.status,conversation.assignedTo,conversation.assignedName,conversation.contact,conversation.messages]);
    if(force||state.inboxDetailSignature!==signature){state.inboxDetailSignature=signature;renderConversation(conversation);}
  }
  async function selectConversation(id) {
    state.inboxSelectedId=id;state.inboxDetailSignature="";renderInboxList();
    $("#operator-conversation").innerHTML='<p class="media-loading">Загружаем историю диалога…</p>';
    try{await refreshSelectedConversation(id,state.inboxEpoch,true);}catch(error){if(state.inboxSelectedId===id&&$("#operator-conversation"))$("#operator-conversation").innerHTML='<p class="global-error">'+esc(error.message)+'</p>';}
  }
  function operatorOwns(conversation) {
    return conversation.status==="active"&&(!conversation.assignedTo&&!conversation.assignedName||conversation.assignedTo===state.user?.id||conversation.assignedName===state.user?.username||conversation.assignedName===state.user?.name);
  }
  function operatorMessage(message,contact) {
    const actor=message.actor||message.role||"system",who=({user:contact.name||"Посетитель",assistant:"Помощник SAEL",staff:"Специалист SAEL",system:"Событие"})[actor]||"Сообщение";
    const sources=Array.isArray(message.sources)?message.sources.filter(source=>safeUrl(source.url,true)).map(source=>'<a href="'+esc(safeUrl(source.url,true))+'" target="_blank" rel="noopener noreferrer">'+esc(local(source.title)||"Источник")+' ↗</a>').join(""):"";
    return '<article class="operator-message operator-message-'+esc(["user","assistant","staff","system"].includes(actor)?actor:"system")+'"><div class="operator-message-meta"><strong>'+esc(who)+'</strong><time>'+esc(new Date(message.createdAt).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"}))+'</time></div><p>'+esc(message.text)+'</p>'+(sources?'<div class="operator-message-sources">'+sources+'</div>':"")+'</article>';
  }
  function renderConversation(conversation) {
    const host=$("#operator-conversation");if(!host||state.inboxSelectedId!==conversation.id)return;
    const previous=$("#operator-reply"),focused=document.activeElement===previous,selection=focused?[previous.selectionStart,previous.selectionEnd]:null,messages=$("#operator-messages"),nearBottom=!messages||messages.scrollHeight-messages.scrollTop-messages.clientHeight<80,oldScroll=messages?.scrollTop||0;
    const contact=conversation.contact||{},own=operatorOwns(conversation),closed=conversation.status==="closed",assigned=conversation.assignedName||"",draft=state.inboxDrafts?.[conversation.id]||"";
    host.innerHTML='<header class="operator-conversation-header"><div><p class="eyebrow">ДИАЛОГ № '+esc(String(conversation.id).slice(-8))+' · '+esc((conversation.locale||"ru").toUpperCase())+'</p><h3>'+esc(contact.name||"Посетитель сайта")+'</h3><span class="operator-status operator-status-'+esc(conversation.status)+'">'+esc(conversationStatus(conversation.status))+'</span>'+(assigned?'<p class="operator-assigned">Специалист: '+esc(assigned)+'</p>':"")+'</div><div class="operator-conversation-actions">'+(!closed&&conversation.status!=="active"?'<button type="button" class="button primary small" data-action="operator-claim" data-id="'+esc(conversation.id)+'">Принять диалог</button>':"")+(!closed?'<button type="button" class="button small" data-action="operator-close" data-id="'+esc(conversation.id)+'">Завершить</button>':"")+'</div></header><div class="operator-contact-card">'+(contact.name||contact.phone||contact.email?'<span><small>Контактное лицо</small><strong>'+esc(contact.name||"Не указано")+'</strong></span><span><small>Телефон</small><strong>'+esc(contact.phone||"Не указан")+'</strong></span><span><small>Email</small><strong>'+esc(contact.email||"Не указан")+'</strong></span>':'<p>Контакты ещё не оставлены. Они появятся здесь после согласия посетителя.</p>')+'</div><div id="operator-messages" class="operator-messages" role="log" aria-label="История диалога" aria-live="polite">'+(conversation.messages||[]).map(message=>operatorMessage(message,contact)).join("")+'</div><form id="operator-reply-form" class="operator-reply-form" data-conversation-id="'+esc(conversation.id)+'"><label for="operator-reply">Ответ специалиста</label><textarea id="operator-reply" data-conversation-id="'+esc(conversation.id)+'" rows="3" maxlength="1500" placeholder="'+(own?"Напишите ответ клиенту…":closed?"Этот диалог завершён.":"Сначала примите диалог, чтобы ответить.")+'" '+(!own||state.operatorSendingId===conversation.id?"disabled":"")+'>'+esc(draft)+'</textarea><div class="operator-reply-bottom"><p>'+(own?"Ответ будет отправлен посетителю от имени специалиста SAEL.":closed?"История сохранена для просмотра.":conversation.status==="active"?"Диалог уже принят другим специалистом.":"Нажмите «Принять диалог», чтобы подключиться к разговору.")+'</p><button type="submit" class="button primary small" '+(!own||state.operatorSendingId===conversation.id?"disabled":"")+'>'+(state.operatorSendingId===conversation.id?"Отправляем…":"Отправить ответ")+" →"+'</button></div><p id="operator-reply-error" class="operator-inline-error" role="alert" hidden></p></form>';
    const nextMessages=$("#operator-messages");if(nextMessages)nextMessages.scrollTop=nearBottom?nextMessages.scrollHeight:oldScroll;
    if(focused&&own){const input=$("#operator-reply");input.focus();if(selection)input.setSelectionRange(...selection);}
  }
  async function changeConversation(id,action) {
    if(action==="close"&&!confirm("Завершить этот диалог? История сообщений сохранится."))return;
    const result=await api("/api/admin/assistant/conversations/"+encodeURIComponent(id)+"/"+action,{method:"POST",body:{}});
    if(state.inboxSelectedId===id&&result.conversation){state.inboxDetails=state.inboxDetails||{};state.inboxDetails[id]=result.conversation;state.inboxDetailSignature="";renderConversation(result.conversation);}
    await refreshInbox(state.inboxEpoch);
  }
  async function sendOperatorReply(form) {
    const id=form.dataset.conversationId,input=form.querySelector("textarea"),text=String(input?.value||"").trim();
    if(!id||!text||state.operatorSendingId)return;
    state.inboxDrafts=state.inboxDrafts||{};state.inboxDrafts[id]=input.value;state.operatorSendingId=id;input.disabled=true;form.querySelector('button[type="submit"]').disabled=true;
    try{
      const result=await api("/api/admin/assistant/conversations/"+encodeURIComponent(id)+"/messages",{method:"POST",body:{text}});
      if(String(state.inboxDrafts[id]||"").trim()===text)state.inboxDrafts[id]="";
      if(state.inboxSelectedId===id&&result.conversation){state.inboxDetails=state.inboxDetails||{};state.inboxDetails[id]=result.conversation;state.inboxDetailSignature="";}
      toast("Ответ отправлен посетителю.");
    }catch(error){
      toast(error.message,true);
    }finally{
      state.operatorSendingId=null;
      if(state.inboxSelectedId===id&&state.inboxDetails?.[id])renderConversation(state.inboxDetails[id]);
      refreshInbox(state.inboxEpoch);
    }
  }
  async function refreshTotp() {
    const target=$("#totp-section");if(!target)return;
    try{const result=await api("/api/admin/totp/status");target.innerHTML='<h3>Двухэтапная проверка</h3><p class="muted">'+(result.enabled?"Включена. Для входа нужен код приложения-аутентификатора.":"Дополнительная защита входа одноразовым кодом из приложения-аутентификатора.")+'</p><label>Текущий пароль<input id="totp-password" type="password" autocomplete="current-password"></label>'+(result.enabled?'<label>Код из приложения<input id="totp-disable-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6"></label><button type="button" class="button" data-action="totp-disable">Отключить проверку</button>':'<button type="button" class="button" data-action="totp-setup">Настроить проверку</button><div id="totp-enroll"></div>');}
    catch(error){target.innerHTML='<p class="muted">'+esc(error.message)+'</p>';}
  }
  async function onAction(button) {
    const action=button.dataset.action,index=Number(button.dataset.index),path=button.dataset.path?JSON.parse(button.dataset.path):null;
    if(state.restoring){toast("Дождитесь завершения восстановления.");return;}
    if(action==="navigate")return navigate(button.dataset.view);
    if(action==="assistant-refresh-config")return refreshAssistantConfig();
    if(action==="operator-refresh")return refreshInbox(state.inboxEpoch);
    if(action==="operator-select")return selectConversation(button.dataset.id);
    if(action==="operator-claim")return changeConversation(button.dataset.id,"claim");
    if(action==="operator-close")return changeConversation(button.dataset.id,"close");
    if(action==="page-sections"){state.sectionPage=button.dataset.id;return navigate("sections");}
    if(action==="language"){state.lang=button.dataset.lang;render();return;}
    if(action==="new-page"){navigate("pages");addRecord();return;}
    if(action==="new-record")return addRecord();
    if(action==="back-list"){state.item=null;render();return;}
    if(action==="menu-tab"){state.menu=button.dataset.menu;state.item=null;render();return;}
    if(action==="edit-record"){state.item=index;ensurePriceLocales(records()[index]);render();return;}
    if(action==="duplicate-record")return duplicateRecord(index);
    if(action==="delete-record")return deleteRecord(index);
    if(action==="move-record"){const list=records(),next=index+Number(button.dataset.direction);if(next<0||next>=list.length)return;[list[index],list[next]]=[list[next],list[index]];setDirty();render();return;}
    if(action==="array-remove"){const list=read(path);list.splice(index,1);setDirty();render();return;}
    if(action==="array-move"){const list=read(path),next=index+Number(button.dataset.direction);if(next<0||next>=list.length)return;[list[index],list[next]]=[list[next],list[index]];setDirty();render();return;}
    if(action==="array-add"){
      const list=read(path);if(!Array.isArray(list))return;
      if(path[path.length-1]==="blocks"){const select=button.parentElement.querySelector("select");list.push(blockTemplate(select?.value||"text"));}
      else list.push(templateForArray(path,list));
      setDirty();render();return;
    }
    if(action==="new-category"){
      const key=prompt("Код направления: латинские буквы, цифры и дефисы (например, water-analysis).");if(key===null)return;
      if(!/^[a-z][a-z0-9-]{1,49}$/.test(key)||["constructor","prototype","__proto__"].includes(key)){toast("Используйте код длиной 2–50 символов: латинские буквы, цифры и дефисы.",true);return;}
      if(Object.hasOwn(state.content.categories.ru,key)){toast("Такой код направления уже существует.",true);return;}
      const name=prompt("Название направления на русском:");if(!name?.trim())return;
      for(const lang of langs)state.content.categories[lang][key]=lang==="ru"?name.trim():"";
      setDirty();render();return;
    }
    if(action==="delete-category"){
      const key=button.dataset.key;if((state.content.services||[]).some(item=>item.category===key)||(state.content.priceEntries||[]).some(item=>item.category===key)){toast("Сначала перенесите услуги и позиции прайса из этого направления.",true);return;}
      if(!confirm("Удалить направление на всех трёх языках?"))return;for(const lang of langs)delete state.content.categories[lang][key];setDirty();render();return;
    }
    if(action==="format"){
      const input=document.getElementById(button.dataset.field);if(!input)return;
      let before="",after="",selection=input.value.slice(input.selectionStart,input.selectionEnd),format=button.dataset.format;
      if(format==="br")before="<br>";else if(format==="a"){const url=prompt("Адрес ссылки:");if(url===null)return;const safe=safeUrl(url,false);if(!safe){toast("Укажите обычную ссылку https://, адрес страницы, mailto: или tel:.",true);return;}before='<a href="'+safe.replace(/"/g,"&quot;")+'">';after="</a>";}else{before="<"+format+">";after="</"+format+">";}
      const start=input.selectionStart,end=input.selectionEnd;input.value=input.value.slice(0,start)+before+selection+after+input.value.slice(end);write(JSON.parse(input.dataset.path),input.value);setDirty();input.focus();input.setSelectionRange(start+before.length,start+before.length+selection.length);return;
    }
    if(action==="preview"){
      const input=document.getElementById(button.dataset.field);if(!input)return;
      let preview=input.parentElement.querySelector(".rich-preview");if(preview){preview.remove();input.hidden=false;button.textContent="Предпросмотр";return;}
      preview=document.createElement("div");preview.className="rich-preview";preview.innerHTML=richPreview(input.value);input.hidden=true;input.insertAdjacentElement("afterend",preview);button.textContent="Редактировать";return;
    }
    if(action==="pick-media")return pickMedia(path);
    if(action==="select-media"){
      const file=state.media.find(item=>item.id===button.dataset.id);if(!file||!state.mediaPath)return;write(state.mediaPath,file.url);setDirty();$("#media-dialog").close();render();return;
    }
    if(action==="copy-media"){const file=state.media.find(item=>item.id===button.dataset.id);if(!file)return;try{await navigator.clipboard.writeText(file.url);toast("Ссылка скопирована.");}catch{prompt("Скопируйте адрес файла:",file.url);}return;}
    if(action==="save-media-alt"){
      const file=state.media.find(item=>item.id===button.dataset.id),input=[...document.querySelectorAll("[data-media-alt]")].find(input=>input.dataset.mediaAlt===button.dataset.id&&input.closest("dialog")?.open!==false);if(!file||!input)return;
      const alt=typeof file.alt==="object"?{...file.alt,[state.lang]:input.value}:input.value;await api("/api/admin/media/"+encodeURIComponent(file.id),{method:"PATCH",body:{alt}});file.alt=alt;toast("Описание файла сохранено.");return;
    }
    if(action==="delete-media"){
      const file=state.media.find(item=>item.id===button.dataset.id);if(!file)return;
      if(JSON.stringify(state.content).includes(file.url)){toast("Файл используется на сайте. Сначала замените его в материалах и сохраните изменения.",true);return;}
      if(!confirm("Удалить файл «"+file.filename+"» из медиатеки?"))return;
      await api("/api/admin/media/"+encodeURIComponent(file.id),{method:"DELETE"});toast("Файл удалён.");await loadMedia($("#media-dialog").open);return;
    }
    if(action==="export")return exportContent();
    if(action==="refresh-backups")return loadBackups();
    if(action==="restore-backup"){
      if(state.dirty){toast("Сначала сохраните текущие изменения кнопкой вверху панели. После этого можно восстановить выбранную версию.",true);return;}
      const backup=state.backups?.find(item=>item.id===button.dataset.id);if(!backup)return;
      if(!confirm("Восстановить версию № "+backup.revision+" от "+displayDate(backup.updatedAt||backup.createdAt)+"? Текущее содержимое сайта будет заменено и сохранено в истории."))return;
      state.restoring=true;state.busy=true;$("#workspace").inert=true;updateSaveState("Восстанавливаем версию…");
      try{
        const result=await api("/api/admin/backups/"+encodeURIComponent(backup.id)+"/restore",{method:"POST",body:{revision:state.revision}});
        state.content=result.content;state.revision=result.revision;state.dirty=false;state.item=null;drawNav();render();toast("Версия восстановлена. Сайт обновлён.");
      }catch(error){if(error.status===409&&error.code==="revision_conflict")$("#conflict-dialog").showModal();else toast(error.message,true);}
      finally{state.restoring=false;state.busy=false;$("#workspace").inert=false;updateSaveState();}
      return;
    }
    if(action==="reload-server"){if(!confirm("Заменить несохранённые изменения актуальной версией с сервера? Сначала скачайте свою копию, если она нужна."))return;const result=await api("/api/admin/content");state.content=result.content;state.revision=result.revision;state.dirty=false;state.item=null;$("#conflict-dialog").close();drawNav();render();updateSaveState();return;}
    if(action==="totp-setup"){
      const currentPassword=$("#totp-password").value;if(!currentPassword){toast("Введите текущий пароль.",true);return;}
      const result=await api("/api/admin/totp/setup",{method:"POST",body:{currentPassword}});state.totpSecret=result.secret;state.totpUrl=result.otpauthUrl;
      $("#totp-enroll").innerHTML='<div class="inline-notice"><p>В приложении Google Authenticator, Microsoft Authenticator или другом TOTP-аутентификаторе добавьте аккаунт вручную и введите ключ:</p><input readonly value="'+esc(result.secret)+'" aria-label="Секретный ключ аутентификатора"><p class="field-hint">Не передавайте этот ключ другим людям. Сохраните его в защищённом хранилище для восстановления доступа.</p></div><label>Код из приложения<input id="totp-enable-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}"></label><button type="button" class="button primary" data-action="totp-enable">Подтвердить и включить</button>';return;
    }
    if(action==="totp-enable"){await api("/api/admin/totp/enable",{method:"POST",body:{code:$("#totp-enable-code").value}});state.totpSecret=null;state.totpUrl=null;toast("Двухэтапная проверка включена.");await refreshTotp();return;}
    if(action==="totp-disable"){await api("/api/admin/totp/disable",{method:"POST",body:{currentPassword:$("#totp-password").value,code:$("#totp-disable-code").value}});toast("Двухэтапная проверка отключена.");await refreshTotp();return;}
  }
  document.addEventListener("click",event=>{
    const close=event.target.closest("[data-close-dialog]");if(close){document.getElementById(close.dataset.closeDialog)?.close();return;}
    const button=event.target.closest("[data-action]");if(!button)return;
    event.preventDefault();Promise.resolve(onAction(button)).catch(error=>toast(error.message,true));
  });
  document.addEventListener("input",event=>{
    const input=event.target;
    if(input.id==="operator-reply"){state.inboxDrafts=state.inboxDrafts||{};state.inboxDrafts[input.dataset.conversationId]=input.value;return;}
    if(input.id==="operator-search"){state.inboxQuery=input.value;renderInboxList();return;}
    if(input.dataset.path&&!input.readOnly) {
      const path=JSON.parse(input.dataset.path),previous=read(path),type=input.dataset.valueType,value=type==="boolean"?input.checked:type==="number"?Number(input.value):input.value;write(path,value);
      if(path[0]==="services"){
        const service=state.content.services[path[1]],page=state.content.pages.find(page=>page.kind==="service"&&page.serviceId===service.id);
        if(page){if(path[2]==="status")page.status=service.status;if(path[2]==="name")page.title=clone(service.name);if(path[2]==="desc")page.description=clone(service.desc);}
        if(path[2]==="desc"&&langs.includes(path[3])){const detail=state.content.serviceContent?.[service.id]?.[path[3]];if(detail&&(!detail.lead||detail.lead===previous))detail.lead=value;}
      }
      if(path[0]==="pages"){
        const page=state.content.pages[path[1]],service=page.kind==="service"&&state.content.services.find(service=>service.id===page.serviceId);
        if(service){if(path[2]==="status")service.status=page.status;if(path[2]==="title")service.name=clone(page.title);if(path[2]==="description"){service.desc=clone(page.description);const detail=state.content.serviceContent?.[service.id]?.[path[3]];if(detail&&(!detail.lead||detail.lead===previous))detail.lead=value;}}
        if(page.kind==="about"&&langs.includes(path[3])){const about=state.content.aboutContent?.[path[3]];if(about&&path[2]==="title")about.title=value;if(about&&path[2]==="description")about.lead=value;}
      }
      setDirty();return;
    }
    if(input.id==="collection-search"){state.query=input.value;const query=input.value.toLocaleLowerCase("ru");document.querySelectorAll("[data-record-row]").forEach(row=>row.hidden=!row.dataset.search.includes(query));}
    if(input.id==="copy-search"){const query=input.value.toLocaleLowerCase("ru");document.querySelectorAll("[data-copy-entry]").forEach(entry=>entry.hidden=!entry.dataset.search.includes(query));}
    if(Object.hasOwn(input.dataset,"mediaSearch")){const query=input.value.toLocaleLowerCase("ru");const scope=input.closest("dialog")||$("#workspace");scope.querySelectorAll("[data-media-card]").forEach(card=>card.hidden=!card.dataset.search.includes(query));}
  });
  document.addEventListener("change",event=>{
    const input=event.target;
    if(input.id==="operator-online"){setOperatorAvailability(input.checked).catch(error=>toast(error.message,true));return;}
    if(input.id==="operator-status-filter"){state.inboxFilter=input.value;renderInboxList();return;}
    if(Object.hasOwn(input.dataset,"assistantDay")){
      const assistant=ensureAssistant(),day=Number(input.dataset.assistantDay);
      assistant.hours.weekdays=input.checked?[...new Set([...assistant.hours.weekdays,day])].sort((a,b)=>a-b):assistant.hours.weekdays.filter(value=>value!==day);
      setDirty();return;
    }
    if(input.id==="copy-group"){state.copyGroup=input.value;render();}
    if(input.id==="section-page-filter"){state.sectionPage=input.value;render();}
    if(Object.hasOwn(input.dataset,"mediaUpload"))upload(input.files[0],input.dataset.mediaUpload==="dialog",input).catch(error=>toast(error.message,true));
  });
  $("#save-button").addEventListener("click",save);
  document.addEventListener("submit",event=>{if(event.target.id==="operator-reply-form"){event.preventDefault();sendOperatorReply(event.target).catch(error=>toast(error.message,true));}});
  document.addEventListener("visibilitychange",()=>{if(state.view!=="assistantInbox")return;if(document.visibilityState==="hidden")stopOperatorRuntime(true);else startOperatorRuntime();});
  window.addEventListener("pagehide",()=>stopOperatorRuntime(false,{keepalive:true}));
  $("#sidebar-toggle").addEventListener("click",()=>{const open=!document.body.classList.contains("sidebar-open");document.body.classList.toggle("sidebar-open",open);$("#sidebar-shade").hidden=!open;$("#sidebar-toggle").setAttribute("aria-expanded",String(open));$(".admin-main").inert=open;if(open)$("#admin-sidebar a")?.focus();});
  $("#sidebar-shade").addEventListener("click",closeSidebar);
  $("#account-button").addEventListener("click",()=>openAccount().catch(error=>toast(error.message,true)));
  $("#auth-form").addEventListener("submit",async event=>{
    event.preventDefault();const button=$("#auth-submit"),errorBox=$("#auth-error");button.disabled=true;errorBox.hidden=true;
    try{
      const body={username:$("#auth-username").value.trim(),password:$("#auth-password").value,code:$("#auth-code")?.value||""};if(state.setup)body.token=$("#setup-token").value.trim();
      const result=await api(state.setup?"/api/admin/setup":"/api/admin/login",{method:"POST",body});state.setup=false;$("#auth-form").reset();state.csrf=result.csrfToken||"";await enterApp(result);
    }catch(error){errorBox.textContent=error.message;errorBox.hidden=false;}
    finally{button.disabled=state.setup&&!state.setupAvailable;}
  });
  $("#password-form").addEventListener("submit",async event=>{
    event.preventDefault();const form=event.currentTarget,fields=new FormData(form),message=$("#password-message");message.hidden=true;
    if(state.dirty){message.textContent="Сначала закройте это окно и сохраните изменения содержимого сайта.";message.className="form-message error";message.hidden=false;return;}
    if(fields.get("newPassword")!==fields.get("repeatPassword")){message.textContent="Новые пароли не совпадают.";message.className="form-message error";message.hidden=false;return;}
    try{await api("/api/admin/password",{method:"POST",body:{currentPassword:fields.get("currentPassword"),newPassword:fields.get("newPassword")}});form.reset();$("#account-dialog").close();state.content=null;state.csrf="";showAuth({setupRequired:false});toast("Пароль изменён. Войдите с новым паролем.");}
    catch(error){message.textContent=error.message;message.className="form-message error";message.hidden=false;}
  });
  $("#logout-button").addEventListener("click",async()=>{
    if(state.dirty&&!confirm("Выйти без сохранения изменений?"))return;
    stopOperatorRuntime(false);
    try{await api("/api/admin/logout",{method:"POST",body:{}});$("#account-dialog").close();state.content=null;state.csrf="";state.dirty=false;showAuth({setupRequired:false});}catch(error){toast(error.message,true);}
  });
  $("#account-dialog").addEventListener("close",()=>{state.totpSecret=null;state.totpUrl=null;$("#totp-section")?.replaceChildren();});
  document.addEventListener("keydown",event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="s"&&state.content){event.preventDefault();save();}if(event.key==="Escape")closeSidebar();});
  window.addEventListener("beforeunload",event=>{if(state.dirty){event.preventDefault();event.returnValue="";}});
  window.addEventListener("resize",()=>{if(window.innerWidth>760)closeSidebar();});
  async function boot(){try{const session=await api("/api/admin/session");if(session.authenticated)await enterApp(session);else showAuth(session);}catch(error){$("#boot-screen").innerHTML='<span class="brand-mark"><img src="/assets/sael-logo-mark.png" alt="SAEL"></span><p>'+esc(error.message)+'</p><p>Проверьте, что сайт запущен через server.js, затем обновите страницу.</p>';}}
  boot();
})();

