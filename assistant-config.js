"use strict";
function defaultAssistant() {
 return {
  enabled:true,
  title:{ru:"Помощник SAEL",kg:"SAEL жардамчысы",en:"SAEL assistant"},
  welcome:{ru:"Здравствуйте! Помогу найти услугу, уточнить требования к образцам и разобраться в прайсе. Если понадобится специалист, предложу передать ему диалог.",kg:"Саламатсызбы! Кызматты табууга, үлгүлөргө талаптарды жана бааларды тактоого жардам берем. Керек болсо, сүйлөшүүнү адиске өткөрүүнү сунуштайм.",en:"Hello! I can help you find a service, understand sample requirements and explore the price list. If needed, I can offer to pass the conversation to a specialist."},
  instructions:"Отвечай по утверждённым материалам SAEL. Не придумывай сроки, пределы обнаружения, область аккредитации или окончательную стоимость. Для сложных технических задач и индивидуального расчёта предложи сотрудника SAEL.",
  hours:{timezone:"Asia/Bishkek",weekdays:[1,2,3,4,5],start:"08:00",end:"17:00"},
  handoffEmail:"sael.karabalta@saelglobal.com",
  knowledge:[]
 };
}
module.exports={defaultAssistant};

