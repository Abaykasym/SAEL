"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {buildKnowledge,retrieve}=require("../assistant-knowledge");
const seed=require("../cms-seed.json"),clone=value=>JSON.parse(JSON.stringify(value)),localized=value=>({ru:value,kg:value,en:value});
function hide(content,page,target,remove=false){const row=content.sections.find(section=>section.page===page&&(section.targetId||section.id)===target);assert(row,"known section "+page+"/"+target);if(remove)content.sections=content.sections.filter(section=>section!==row);else row.enabled=false;}
function serialized(content,lang="ru"){return JSON.stringify(buildKnowledge(content,lang));}

test("all 105 public prices and exact codes remain available in each language",()=>{
 for(const lang of ["ru","kg","en"]){const docs=buildKnowledge(seed,lang),prices=docs.filter(doc=>doc.kind==="price");assert.equal(prices.length,105);assert(prices.some(doc=>doc.text.includes("USD 6.30")));assert(retrieve(seed,"P5a",lang).some(doc=>doc.kind==="price"));assert(docs.every(doc=>doc.title&&doc.text));}
});
test("draft pages, services, documents, equipment, prices and training are excluded",()=>{
 const content=clone(seed);content.pages.push({id:"draftpage",slug:"draftpage",kind:"custom",title:localized("Secret draft"),description:localized("DRAFT_PAGE_SECRET"),status:"draft",blocks:[]});
 content.services[0].status="draft";content.serviceContent.preparation.ru.lead="DRAFT_SERVICE_SECRET";
 content.documents[0].status="draft";content.documents[0].caption=localized("DRAFT_DOCUMENT_SECRET");
 content.equipment[0].status="draft";content.equipment[0].description=localized("DRAFT_EQUIPMENT_SECRET");
 content.priceEntries[0].status="draft";content.priceEntries[0].amount="DRAFT_PRICE_SECRET";
 content.assistant.knowledge.push({id:"draft",title:localized("Draft"),text:localized("DRAFT_TRAINING_SECRET"),status:"draft"});
 const data=serialized(content);for(const marker of ["DRAFT_PAGE_SECRET","DRAFT_SERVICE_SECRET","DRAFT_DOCUMENT_SECRET","DRAFT_EQUIPMENT_SECRET","DRAFT_PRICE_SECRET","DRAFT_TRAINING_SECRET"])assert(!data.includes(marker),marker);assert(!buildKnowledge(content).some(doc=>doc.id==="service-preparation"));
});
test("hidden and deleted home sections do not re-enter retrieval via copy or FAQ",()=>{
 for(const remove of [false,true]){const content=clone(seed);content.copy.ru["about.body"]="HIDDEN_ABOUT_SECRET";content.copy.ru["quality.body"]="HIDDEN_QUALITY_SECRET";content.faqs.ru=[["Hidden","HIDDEN_FAQ_SECRET"]];content.processSteps.ru=[["Hidden","HIDDEN_PROCESS_SECRET"]];content.clientSteps.ru=["HIDDEN_CLIENT_SECRET"];content.documents[0].caption.ru="HIDDEN_CERTIFICATE_SECRET";content.partners[0].name="HIDDEN_PARTNER_SECRET";
  for(const target of ["about","quality","faq","process","clients","partners"])hide(content,"home",target,remove);
  const data=serialized(content);for(const marker of ["HIDDEN_ABOUT_SECRET","HIDDEN_QUALITY_SECRET","HIDDEN_FAQ_SECRET","HIDDEN_PROCESS_SECRET","HIDDEN_CLIENT_SECRET","HIDDEN_CERTIFICATE_SECRET","HIDDEN_PARTNER_SECRET"])assert(!data.includes(marker),marker+" deleted="+remove);
 }
});
test("service body evidence follows each visible section while hero remains public",()=>{
 const fields=[["detail-overview","overview","SERVICE_OVERVIEW_SECRET"],["detail-methods","methods","SERVICE_METHOD_SECRET"],["detail-samples","requirements","SERVICE_SAMPLE_SECRET"],["detail-faq","faq","SERVICE_FAQ_SECRET"],["detail-result","result","SERVICE_RESULT_SECRET"]];
 for(const[target,key,marker]of fields){for(const remove of [false,true]){const content=clone(seed),detail=content.serviceContent.preparation.ru;detail[key]=key==="methods"?[{title:"Hidden",text:marker}]:key==="faq"?[["Hidden",marker]]:key==="result"?marker:[marker];detail.lead="PUBLIC_HERO_MARKER";hide(content,"service-preparation",target,remove);const data=serialized(content);assert(!data.includes(marker),target);assert(data.includes("PUBLIC_HERO_MARKER"));}}
});
test("only three visible service price examples survive when home price is hidden",()=>{
 const content=clone(seed);hide(content,"home","price",true);const visible=new Set();for(const service of content.services){const page=content.pages.find(page=>page.kind==="service"&&page.serviceId===service.id&&page.status==="published");if(!page)continue;const catalog=content.priceEntries.filter(item=>item.category===service.category);for(const item of(service.id==="metallurgy"?catalog.slice(-3):catalog.slice(0,3)))visible.add("price-"+item.id);}
 const prices=buildKnowledge(content).filter(doc=>doc.kind==="price");assert.equal(prices.length,visible.size);assert(prices.every(doc=>visible.has(doc.id)&&doc.url.startsWith("service.html?service=")));
 const preparation=content.priceEntries.filter(item=>item.category==="prep");preparation[0].detail="HIDDEN_METHOD_COLUMN_SECRET";preparation[3].amount="HIDDEN_NONEXAMPLE_PRICE_SECRET";
 const data=serialized(content);assert(!data.includes("HIDDEN_METHOD_COLUMN_SECRET"));assert(!data.includes("HIDDEN_NONEXAMPLE_PRICE_SECRET"));
 for(const service of content.services){const page=content.pages.find(page=>page.kind==="service"&&page.serviceId===service.id);if(page)hide(content,page.id,"detail-pricing",true);}
 assert.equal(buildKnowledge(content).filter(doc=>doc.kind==="price").length,0);
});
test("about body, home equipment subset and shared footer use actual publication",()=>{
 const content=clone(seed);content.aboutContent.ru.lead="PUBLIC_COMPANY_HERO";content.aboutContent.ru.timeline=[["Hidden", "Hidden", "HIDDEN_COMPANY_HISTORY"]];hide(content,"about","company-history",true);hide(content,"about","equipment");
 const hidden=content.equipment.find(item=>item.showOnHome===false);assert(hidden);hidden.description.ru="HIDDEN_EQUIPMENT_EXTRA";
 hide(content,"home","contacts",true);const docs=buildKnowledge(content),data=JSON.stringify(docs);assert(data.includes("PUBLIC_COMPANY_HERO"));assert(!data.includes("HIDDEN_COMPANY_HISTORY"));assert(!data.includes("HIDDEN_EQUIPMENT_EXTRA"));assert(docs.some(doc=>doc.id==="contacts"&&doc.text.includes(content.settings.email)));assert(!docs.find(doc=>doc.id==="contacts").url.includes("#contacts"));
 hide(content,"home","equipment");assert(!buildKnowledge(content).some(doc=>doc.kind==="equipment"));
});
test("custom page and section blocks respect locale, publication and enabled state",()=>{
 const content=clone(seed);content.pages.push({id:"custom",kind:"custom",slug:"guide",title:localized("Public guide"),description:localized("PUBLIC_GUIDE"),status:"published",blocks:[{id:"one",type:"text",text:localized("PUBLIC_BLOCK")},{id:"two",type:"text",status:"draft",text:localized("DRAFT_BLOCK_SECRET")},{id:"three",type:"text",enabled:false,text:localized("HIDDEN_BLOCK_SECRET")}]});
 content.sections.push({id:"guide-section",page:"custom",title:localized("Section"),enabled:true,blocks:[{id:"extra",type:"list",items:[localized("PUBLIC_LIST_ITEM")]}]},{id:"hidden-section",page:"custom",title:localized("Hidden"),enabled:false,blocks:[{id:"hidden",type:"text",text:localized("HIDDEN_SECTION_SECRET")}]});
 let data=serialized(content);assert(data.includes("PUBLIC_GUIDE"));assert(data.includes("PUBLIC_BLOCK"));assert(data.includes("PUBLIC_LIST_ITEM"));for(const marker of ["DRAFT_BLOCK_SECRET","HIDDEN_BLOCK_SECRET","HIDDEN_SECTION_SECRET"])assert(!data.includes(marker));
 content.pages.at(-1).title.en="";data=serialized(content,"en");assert(!data.includes("PUBLIC_GUIDE"));assert(!data.includes("PUBLIC_LIST_ITEM"));
 content.pages.at(-1).status="draft";assert(!serialized(content).includes("PUBLIC_GUIDE"));
});
test("approved assistant-only training is available without a bogus request-form citation",()=>{
 const content=clone(seed);content.assistant.instructions="PRIVATE_INSTRUCTION_SECRET";content.assistant.knowledge.push({id:"approved",title:localized("Требования к упаковке ABC"),text:localized("APPROVED_TRAINING_BODY"),tags:"упаковка",status:"published"},{id:"hidden",title:localized("Hidden"),text:localized("PRIVATE_TRAINING_DRAFT"),status:"draft"});
 const docs=buildKnowledge(content),approved=docs.find(doc=>doc.id==="knowledge-approved");assert(approved);assert.equal(approved.url,"");assert.equal(approved.kind,"approved");assert(retrieve(content,"Требования к упаковке ABC","ru").some(doc=>doc.id==="knowledge-approved"));assert(!JSON.stringify(docs).includes("PRIVATE_INSTRUCTION_SECRET"));assert(!JSON.stringify(docs).includes("PRIVATE_TRAINING_DRAFT"));
});
test("generic price, service-choice and sample questions select relevant sources in RU/KG/EN",()=>{
 const questions={ru:["Как выбрать нужный анализ?","Где посмотреть цены?","Как подготовить и отправить образцы?"],kg:["Керектүү анализди кантип тандайм?","Бааларды кайдан көрүүгө болот?","Үлгүлөрдү кантип даярдап, жөнөтөм?"],en:["How do I choose an analysis?","Where can I find the prices?","How do I prepare and send samples?"]};
 for(const[lang,list]of Object.entries(questions)){assert.equal(retrieve(seed,list[0],lang)[0].id,"overview-services");assert.equal(retrieve(seed,list[1],lang)[0].id,"overview-prices");const samples=retrieve(seed,list[2],lang);assert.equal(samples[0].id,"overview-samples");assert(samples.some(doc=>doc.id==="service-preparation"));}
 assert.equal(retrieve(seed,"несуществующий флюороквантовый параметр","ru").length,0);assert.equal(retrieve(seed,"the and how","en").length,0);
});
