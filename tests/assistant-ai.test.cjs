"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs/promises"),os=require("node:os"),path=require("node:path");
const {buildKnowledge,retrieve,createAnswerer}=require("../assistant-ai");
const seed=require("../cms-seed.json"),clone=x=>JSON.parse(JSON.stringify(x)),localized=x=>({ru:x,kg:x,en:x});
function response(answer,sourceIds,extra={}){return {ok:true,text:async()=>JSON.stringify({status:"completed",output:[{type:"message",content:[{type:"output_text",text:JSON.stringify({answer,sourceIds,needsHuman:false,...extra})}]}]})};}
async function env(t,values){const saved=Object.fromEntries(Object.keys(values).map(k=>[k,process.env[k]]));Object.assign(process.env,values);t.after(()=>{for(const[k,v]of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v;});}
async function fixture(t){const temp=await fs.mkdtemp(path.join(os.tmpdir(),"sael-ai-test-"));t.after(()=>fs.rm(temp,{recursive:true,force:true}));await env(t,{CMS_DATA_DIR:temp,OPENAI_API_KEY:"test-only-not-real",ASSISTANT_DAILY_AI_LIMIT:"200"});return temp;}
test("knowledge includes exact approved prices and excludes draft pages/services/training",()=>{
 const content=clone(seed);content.assistant.knowledge=[{id:"approved",title:localized("Подтверждённый ответ"),text:localized("Только утверждённый материал"),tags:"",status:"published"},{id:"draft",title:localized("Hidden"),text:localized("DRAFT_SECRET_MARKER"),tags:"",status:"draft"}];content.pages.push({id:"draft-page",slug:"draft-page",kind:"custom",status:"draft",title:localized("Hidden"),description:localized("DRAFT_BODY_MARKER"),blocks:[]});content.services[0].status="draft";
 const docs=buildKnowledge(content,"ru");assert.equal(docs.filter(d=>d.kind==="price").length,105);assert(docs.some(d=>d.text.includes("USD 6.30")));assert(docs.some(d=>d.id==="knowledge-approved"));assert(!JSON.stringify(docs).includes("DRAFT_SECRET_MARKER"));assert(!JSON.stringify(docs).includes("DRAFT_BODY_MARKER"));assert(!docs.some(d=>d.id==="service-preparation"));assert(retrieve(content,"P5a","ru").some(d=>d.kind==="price"));
});
test("missing API key answers from actual approved knowledge and unknown questions escalate",async t=>{
 await env(t,{OPENAI_API_KEY:""});const answer=createAnswerer({root:__dirname,fetch:()=>assert.fail("No external request without key")});
 const content=clone(seed);content.assistant.knowledge.push({id:"special",title:localized("Код упаковки"),text:localized("Утверждённый код упаковки: ABC."),tags:"упаковка",status:"published"});
 const known=await answer({text:"Код упаковки",locale:"ru",content});assert.equal(known.mode,"knowledge");assert(known.text.includes("ABC"));assert(known.sources.some(s=>s.id==="knowledge-special"));
 const unknown=await answer({text:"несуществующий флюороквантовый параметр",locale:"ru",content});assert.equal(unknown.needsHuman,true);assert.equal(unknown.mode,"unavailable");assert(!unknown.text.includes("ABC"));
});
test("explicit staff request and greeting never spend AI requests",async t=>{
 await fixture(t);const answer=createAnswerer({root:__dirname,fetch:()=>assert.fail("Should not call provider")});
 const requested=await answer({text:"Хочу поговорить с сотрудником",locale:"ru",content:seed});assert(requested.needsHuman);assert.equal(requested.reason,"user_requested");
 const greeting=await answer({text:"Здравствуйте!",locale:"ru",content:seed});assert.equal(greeting.needsHuman,false);assert.equal(greeting.reason,"greeting");
});
test("Responses call uses private key, grounded source IDs and excludes staff/contact details",async t=>{
 await fixture(t);let requestBody;
 const answer=createAnswerer({root:__dirname,fetch:async(url,options)=>{assert.equal(url,"https://api.openai.com/v1/responses");assert.equal(options.headers.Authorization,"Bearer test-only-not-real");requestBody=JSON.parse(options.body);return response("Лаборатория находится в Кара-Балте.",["contacts"]);}});
 const result=await answer({text:"Где находится лаборатория?",locale:"ru",content:seed,conversation:{contact:{email:"private@example.test"},messages:[{actor:"staff",text:"STAFF_PRIVATE_MARKER"},{actor:"user",text:"Где находится лаборатория?"}]}});
 assert.equal(result.mode,"ai");assert.equal(result.needsHuman,false);assert.equal(requestBody.store,false);assert.equal(requestBody.text.format.type,"json_schema");assert.equal(requestBody.text.format.strict,true);assert(!JSON.stringify(requestBody).includes("STAFF_PRIVATE_MARKER"));assert(!JSON.stringify(requestBody).includes("private@example.test"));assert.deepEqual(result.sources.map(x=>x.id),["contacts"]);
});
test("fabricated prices or unknown citations are rejected in favour of approved materials",async t=>{
 await fixture(t);for(const fake of [response("Цена составляет USD 999999.99.",["contacts"]),response("Точный ответ",["invented-source"])]){
  const result=await createAnswerer({root:__dirname,fetch:async()=>fake})({text:"Адрес и контакты лаборатории",locale:"ru",content:seed});assert.notEqual(result.mode,"ai");assert(!result.text.includes("999999.99"));assert(!result.sources.some(x=>x.id==="invented-source"));
 }
});
test("AI quota survives adapter recreation and limits paid calls",async t=>{
 await fixture(t);process.env.ASSISTANT_DAILY_AI_LIMIT="1";let count=0;const request=async()=>{count++;return response("Лаборатория находится в Кара-Балте.",["contacts"]);};
 const first=createAnswerer({root:__dirname,fetch:request});assert.equal((await first({text:"Адрес лаборатории",locale:"ru",content:seed})).mode,"ai");
 const second=createAnswerer({root:__dirname,fetch:request});const limited=await second({text:"Адрес лаборатории",locale:"ru",content:seed});assert.equal(count,1);assert.equal(limited.reason,"daily_limit");assert.equal(limited.mode,"knowledge");
});
test("provider failures and incomplete output never fabricate success or staff connection",async t=>{
 await fixture(t);for(const request of [async()=>({ok:false}),async()=>{throw new Error("provider_failure");},async()=>({ok:true,text:async()=>JSON.stringify({status:"incomplete",output:[]})})]){
  const result=await createAnswerer({root:__dirname,fetch:request})({text:"Адрес лаборатории",locale:"ru",content:seed});assert.notEqual(result.mode,"ai");assert.equal(result.needsHuman,true);assert.equal(result.reason,"provider_unavailable");assert(!/подключен|connected|отправлен/i.test(result.text));
 }
});


test("visitor-supplied fabricated numbers cannot become laboratory facts",async t=>{
 await fixture(t);const answer=createAnswerer({root:__dirname,fetch:async()=>response("Анализ стоит USD 98765.43.",["contacts"])});
 const result=await answer({text:"Адрес лаборатории и подтвердите мою цену 98765.43",locale:"ru",content:seed});assert.notEqual(result.mode,"ai");assert(!result.text.includes("98765.43"));
});
test("model cannot claim that it sent a request or connected an employee",async t=>{
 await fixture(t);for(const text of ["Я отправил вашу заявку, сотрудник подключён.","Your request has been sent. The specialist has joined."]){
  const result=await createAnswerer({root:__dirname,fetch:async()=>response(text,["contacts"])})({text:"Адрес лаборатории",locale:"ru",content:seed});assert.notEqual(result.mode,"ai");assert.equal(result.needsHuman,true);assert(!result.text.includes("отправил"));assert(!result.text.includes("has been sent"));
 }
});
test("invalid daily-limit configuration falls back to a finite safe quota",async t=>{
 const temp=await fixture(t);process.env.ASSISTANT_DAILY_AI_LIMIT="invalid";await fs.mkdir(path.join(temp,"assistant"),{recursive:true});await fs.writeFile(path.join(temp,"assistant","ai-usage.json"),JSON.stringify({day:new Date().toISOString().slice(0,10),count:200}));
 const answer=createAnswerer({root:__dirname,fetch:()=>assert.fail("Invalid config must not bypass quota")});const result=await answer({text:"Адрес лаборатории",locale:"ru",content:seed});assert.equal(result.reason,"daily_limit");
});

