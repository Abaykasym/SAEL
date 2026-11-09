"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const cutoff=app.indexOf('\nasync function initializeSite') >= 0 ? app.indexOf('\nasync function initializeSite') : app.indexOf('\ndocument.querySelectorAll("[data-lang]');
if(cutoff<0)throw new Error("Legacy data boundary not found");
const ctx=vm.createContext({window:{},localStorage:{getItem(){return"ru";}},URLSearchParams,location:{search:""},console});
for(const f of ["price-translations.js","service-content.js","about-content.js"])vm.runInContext(fs.readFileSync(path.join(root,f),"utf8"),ctx);
vm.runInContext(app.slice(0,cutoff),ctx);
const legacy=vm.runInContext("({copy,services,servicePhotos,priceEntries,categories,processSteps,clientSteps,faqs,servicePageUi})",ctx);
const plain=value=>JSON.parse(JSON.stringify(value));
const c=plain(legacy),langs=["ru","kg","en"],loc=value=>Object.fromEntries(langs.map(l=>[l,value]));
const fromCopy=key=>Object.fromEntries(langs.map(l=>[l,c.copy[l][key]||""]));
const localized=(ru,kg,en)=>({ru,kg,en});
for(const lang of langs){c.copy[lang]["stat.samplesValue"]="350,000";for(const[key,value]of Object.entries(c.servicePageUi[lang]))c.copy[lang]["serviceUi."+key]=value;}
const aboutStart=app.indexOf("function renderAbout()");
const uiStart=app.indexOf("  const ui = {",aboutStart),inventoryStart=app.indexOf("  const inventory = [",uiStart);
if(uiStart<0||inventoryStart<0)throw new Error("Company data boundary");
const aboutUi=Object.fromEntries(langs.map(lang=>{vm.runInContext('locale="'+lang+'"',ctx);return[lang,vm.runInContext("(()=>{"+app.slice(uiStart,inventoryStart)+"return ui;})()",ctx)];}));
vm.runInContext('locale="ru"',ctx);
for(const lang of langs)for(const[key,value]of Object.entries(aboutUi[lang]))c.copy[lang]["aboutUi."+key]=value;
const inventoryEnd=app.indexOf("];",inventoryStart)+2;
const inventory=vm.runInContext("(()=>{"+app.slice(uiStart,inventoryEnd)+"return inventory;})()",ctx);
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const part=(a,b)=>index.slice(index.indexOf(a),index.indexOf(b,index.indexOf(a)));
const certificateHtml=part('<div class="certificate-grid">','</section>');
const documents=[...certificateHtml.matchAll(/<a class="certificate-card" href="([^"]+)"[\s\S]*?<b>([^<]+)<\/b><span data-i18n="([^"]+)"/g)].map((m,i)=>({id:"certificate-"+(i+1),title:loc(m[2]),url:m[1],caption:fromCopy(m[3])}));
const partnerHtml=part('<ul class="partner-grid"','</ul>');
const partners=[...partnerHtml.matchAll(/<li><img src="([^"]+)"[\s\S]*?<span>([^<]+)<\/span><\/li>/g)].map((m,i)=>({id:"partner-"+(i+1),name:m[2],logo:m[1],url:""}));
if(!partners.length){for(const m of index.matchAll(/<li><img src="(assets\/source-sael\/partners\/[^"]+)"[^>]*><span>([^<]+)<\/span><\/li>/g))partners.push({id:"partner-"+(partners.length+1),name:m[2],logo:m[1],url:""});}
const homeModels=["Optima 5300DV","Agilent 5110","Agilent 7800","ELAN DRC-e"];
const equipment=inventory.map((row,i)=>({id:"equipment-"+(i+1),type:row[0],model:row[1],manufacturer:row[2],description:Object.fromEntries(langs.map(l=>[l,aboutUi[l][row[3]]||""])),showOnHome:homeModels.includes(row[1])}));
const seed={
 schemaVersion:1,
 settings:{siteName:"SAEL",phone:"+996 3133 31925",phoneSecondary:"+996 3133 34251",email:"sael.karabalta@saelglobal.com",address:fromCopy("contact.address"),hours:fromCopy("contact.hours"),logoFull:"assets/sael-logo-full.png",logoMark:"assets/sael-logo-mark.png",pricePdf:"https://sael.kg/cb/pricelist.pdf",limsUrl:"https://sael.kg/cb",videoUrl:"https://www.youtube.com/watch?v=teQ6Iv6p5Ms",mapUrl:"https://maps.google.com/?q=SAEL+Kara-Balta+Kalinina+2"},
 copy:c.copy,services:c.services.map(s=>({...s,photo:c.servicePhotos[s.id],status:"published"})),
 priceEntries:c.priceEntries.map((p,i)=>({...p,id:"price-"+String(i+1).padStart(3,"0"),detailLocalized:{en:p.detail,...plain(ctx.window.saelPriceTranslations.details[p.detail]||{})},amountLocalized:p.amount==="По запросу"?localized("По запросу","Суроо боюнча","On request"):{en:p.amount,...plain(ctx.window.saelPriceTranslations.amounts[p.amount]||{})}})),
 categories:c.categories,priceTranslations:plain(ctx.window.saelPriceTranslations),serviceContent:plain(ctx.window.saelServiceContent),aboutContent:plain(ctx.window.saelAboutContent),processSteps:c.processSteps,clientSteps:c.clientSteps,faqs:c.faqs,
 pages:[
  {id:"home",slug:"home",kind:"home",title:localized("Главная","Башкы бет","Home"),description:localized("Независимая аналитическая лаборатория SAEL","SAEL көз карандысыз аналитикалык лабораториясы","SAEL independent analytical laboratory"),status:"published",blocks:[]},
  {id:"about",slug:"about",kind:"about",title:localized("О компании","Компания жөнүндө","About SAEL"),description:fromCopy("about.body"),status:"published",blocks:[]},
  ...c.services.map(s=>({id:"service-"+s.id,slug:s.id,kind:"service",serviceId:s.id,title:s.name,description:s.desc,status:"published",blocks:[]}))
 ],
 menus:{header:[],footer:[]},
 sections:[
  ["hero","Первый экран"],["about","О лаборатории"],["services","Услуги"],["quality","Качество и сертификаты"],["equipment","Оборудование"],["process","Как проходит анализ"],["clients","Клиентам"],["requirements-band","Требования к образцам"],["price","Прайс-лист"],["faq","Частые вопросы"],["partners","Партнёры"],["contacts","Контакты и запрос КП"]
 ].map(([id,title])=>({id,page:"home",title,enabled:true,blocks:[]})),
 documents,partners,equipment,
 images:[{id:"hero-poster",label:"Обложка видео на главной",selector:".hero-video-open img",src:"assets/sael-video-poster.jpg",alt:fromCopy("media.title")},{id:"about-photo",label:"Фотография компании",selector:"#about-photo img",src:c.servicePhotos["multi-element"],alt:loc("SAEL")}]
};
const nav=[["about","nav.about","about.html"],["services","nav.services","index.html#services"],["quality","nav.quality","index.html#quality"],["equipment","nav.equipment","index.html#equipment"],["clients","nav.clients","index.html#clients"],["price","nav.price","index.html#price"],["partners","nav.partners","index.html#partners"],["contacts","nav.contacts","index.html#contacts"]];
seed.sections.push(...[["company-overview","О компании"],["company-history","История"],["company-services","Направления"],["equipment","Оборудование"],["company-quality","Качество"],["company-next","Запрос КП"]].map(([targetId,title])=>({id:"about-"+targetId,page:"about",targetId,title,enabled:true,blocks:[]})));
for (const service of c.services) seed.sections.push(...[["detail-overview","Описание"],["detail-methods","Методы"],["detail-samples","Образцы"],["detail-pricing","Стоимость"],["detail-faq","Вопросы"],["detail-result","Результат"],["detail-next","Запрос КП"],["detail-related","Другие услуги"]].map(([targetId,title])=>({id:"service-"+service.id+"-"+targetId,page:"service-"+service.id,targetId,title,enabled:true,blocks:[]})));
seed.menus.header=nav.map(([id,key,url])=>({id:"nav-"+id,label:fromCopy(key),url,target:"_self"}));
seed.menus.footer=seed.menus.header.filter(m=>["nav-services","nav-quality","nav-price","nav-partners","nav-contacts"].includes(m.id)).map(m=>({...m,id:"footer-"+m.id}));
seed.assistant=require("../assistant-config").defaultAssistant();
fs.writeFileSync(path.join(root,"cms-seed.json"),JSON.stringify(seed,null,2)+"\n");
console.log(JSON.stringify({seedBytes:fs.statSync(path.join(root,"cms-seed.json")).size,services:seed.services.length,prices:seed.priceEntries.length,pages:seed.pages.length,sections:seed.sections.length,documents:documents.length,partners:partners.length,equipment:equipment.length,copyKeys:Object.keys(c.copy.ru).length}));

