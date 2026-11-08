'use strict';
const labels={azul:'AZUL', 'evil-eye':'EVIL EYE',ocean:'OCEAN',racetrack:'RACETRACK',leopard:'LEOPARD'};
const descriptions={azul:'Синий рисунок. Выразительная деталь для повседневного образа.','evil-eye':'Графичный символ и синие акценты.',ocean:'Морское настроение в синей палитре.',racetrack:'Дизайн с настроением автоспорта.',leopard:'Леопардовый принт как личный акцент.'};
const dialog=document.getElementById('productDialog');
const form=document.getElementById('orderForm');
const review=document.getElementById('orderReview');
const grid=document.getElementById('productGrid');
let products=[],selected=null,opener=null,message='',pendingOrder=null,sending=false;
const modelSelect=document.getElementById('phoneModel');
function cardFor(p){
 const card=document.createElement('article');card.className='product-card';card.dataset.category=p.category;
 const button=document.createElement('button');button.className='product-image';button.type='button';button.setAttribute('aria-label',`Открыть ${p.name}`);
 const img=document.createElement('img');img.src=p.image;img.alt=p.reference?`Пример коллекции ${labels[p.category]} — точное фото ${p.name} уточняется`:`Чехол ${p.name}`;img.loading='lazy';img.width=600;img.height=750;button.append(img);
 if(p.reference){const badge=document.createElement('span');badge.className='reference';badge.textContent='Фото уточняется';button.append(badge)}
 const arrow=document.createElement('span');arrow.className='view';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');button.append(arrow);button.addEventListener('click',()=>openProduct(p,button));
 const category=document.createElement('p');category.className='product-category';category.textContent=labels[p.category];
 const title=document.createElement('h3');const titleButton=document.createElement('button');titleButton.textContent=p.name;titleButton.addEventListener('click',()=>openProduct(p,titleButton));title.append(titleButton);
 const row=document.createElement('div');row.className='price-row';const price=document.createElement('span');price.textContent='1 290 ₽';const choose=document.createElement('button');choose.textContent='Выбрать →';choose.setAttribute('aria-label',`Выбрать ${p.name}`);choose.addEventListener('click',()=>openProduct(p,choose));row.append(price,choose);card.append(button,category,title,row);return card;
}
function openProduct(p,button){selected=p;opener=button;document.getElementById('productTitle').textContent=p.name;document.getElementById('productCategory').textContent=labels[p.category];document.getElementById('productDescription').textContent=descriptions[p.category];const img=document.getElementById('productImage');img.src=p.image;img.alt=p.reference?'Пример коллекции. Точное фото уточняется.':p.name;document.getElementById('imageNote').textContent=p.reference?'На фото — пример коллекции. Запросим точное фото этого варианта до оплаты.':'Точный вид для твоей модели подтвердим перед заказом.';review.hidden=true;form.hidden=false;pendingOrder=null;document.getElementById('sendOrder').disabled=false;document.getElementById('sendStatus').textContent='';document.getElementById('copyStatus').textContent='';dialog.showModal();document.body.style.overflow='hidden';dialog.scrollTop=0}
function closeProduct(){dialog.close()}
document.getElementById('closeDialog').addEventListener('click',closeProduct);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeProduct()}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus()});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));let count=0;grid.querySelectorAll('.product-card').forEach(c=>{c.hidden=button.dataset.filter!=='all'&&c.dataset.category!==button.dataset.filter;if(!c.hidden)count++});document.getElementById('resultCount').textContent=`Дизайнов: ${count}`}));
form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity()||!selected)return;const data=new FormData(form);for(const key of ['phoneModel','name','city','address','contact']){const field=form.elements.namedItem(key);field.setCustomValidity(data.get(key).trim()?'':'Заполни это поле');if(!field.reportValidity())return}pendingOrder={orderId:crypto.randomUUID(),productId:selected.id,product:selected.name,collection:labels[selected.category],phoneModel:data.get('phoneModel').trim(),customerName:data.get('name').trim(),contact:data.get('contact').trim(),contactChannel:data.get('contactChannel'),city:data.get('city').trim(),address:data.get('address').trim(),comment:data.get('comment').trim(),consent:data.get('consent')==='on'};message=`Здравствуйте! Хочу уточнить заказ FORMÉ.\n\nДизайн: ${selected.name}\nМодель: ${data.get('phoneModel')}\nЧехол: 1 290 ₽\nДоставка: стоимость и срок уточнить\nИмя: ${data.get('name').trim()}\nКонтакт: ${data.get('contact').trim()} (${data.get('contactChannel')})\nГород: ${data.get('city').trim()}\nАдрес / пункт выдачи: ${data.get('address').trim()}${data.get('comment').trim()?'\nПожелания: '+data.get('comment').trim():''}${selected.reference?'\nНужно точное фото выбранного варианта.':''}\n\nПожалуйста, подтвердите наличие, совместимость и итоговую стоимость.`;document.getElementById('reviewText').textContent=message;document.getElementById('telegramOrder').href='https://t.me/FORME_CASE?text='+encodeURIComponent(message);form.hidden=true;review.hidden=false;document.getElementById('sendOrder').focus()});
form.addEventListener('input',event=>event.target.setCustomValidity?.(''));
document.getElementById('editOrder').addEventListener('click',()=>{review.hidden=true;form.hidden=false;modelSelect.focus()});
document.getElementById('copyOrder').addEventListener('click',async()=>{const status=document.getElementById('copyStatus');try{await navigator.clipboard.writeText(message);status.textContent='Текст скопирован. Вставь его в чат FORMÉ.'}catch{status.textContent='Выдели и скопируй текст заявки выше.'}});
fetch('products.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json()}).then(data=>{products=data;grid.replaceChildren(...products.map(cardFor))}).catch(()=>{const p=document.createElement('p');p.textContent='Каталог не загрузился. Обнови страницу или напиши нам в Telegram: @FORME_CASE.';grid.append(p)});

document.getElementById('sendOrder').addEventListener('click',async()=>{
 if(sending||!pendingOrder)return;
 const button=document.getElementById('sendOrder'),status=document.getElementById('sendStatus');
 sending=true;button.disabled=true;document.getElementById('editOrder').disabled=true;status.textContent='Отправляем заявку…';
 try{
  const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pendingOrder),signal:AbortSignal.timeout(30000)});
  const result=await response.json();
  if(!response.ok||result.ok!==true||result.orderId!==pendingOrder.orderId)throw Error('save');
  status.textContent='Заявка получена! Номер: '+result.orderId+'. Свяжемся по указанному контакту для подтверждения.';
  button.textContent='Заявка отправлена ✓';pendingOrder=null;
 }catch{
  status.textContent='Не удалось подтвердить получение. Повтори отправку или свяжись с нами в Telegram. Повторная отправка этой заявки не создаст дубль.';button.disabled=false;
 }finally{sending=false;document.getElementById('editOrder').disabled=false;}
});
