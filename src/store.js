import {faqs} from './faq-data.js';
import './faq.css';
import {setupChat} from './chat.js';
import {setupPhoneEdits} from './edits.js';
import {db,assertResult,escape,money,categories,currentUser} from './client.js';
import {collections,phoneFinishes,photoMarkup,finishOf} from './catalog.js';
const grid=document.getElementById('productGrid'),dialog=document.getElementById('productDialog');
const homeFaq=document.querySelector('.faq');
if(homeFaq)homeFaq.innerHTML='<div class="home-faq-heading"><h3>Вопросы и ответы</h3><a href="/faq.html">Все ответы ↗</a></div>'+['delivery-cost','delivery-time','payment','returns'].map(id=>{const f=faqs.find(x=>x.id===id);return `<details><summary>${escape(f.question)}</summary><p>${escape(f.answer)}</p></details>`;}).join('');
let chat=null;
let products=[],selected=null,opener=null,photoIndex=0,activeCollection='all';
function showPhoto(index){
 photoIndex=index;
 const image=selected.images[index];
 document.getElementById('productImage').innerHTML=photoMarkup(image,selected.name+' — '+(phoneFinishes[finishOf(image)]||'вид чехла'));
 document.querySelectorAll('[data-photo]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.photo)===index)));
 document.getElementById('selectedFinish').textContent=phoneFinishes[finishOf(image)]||'Фото '+(index+1);
 document.getElementById('orderProduct').href='/account.html?product='+encodeURIComponent(selected.id)+'&finish='+encodeURIComponent(finishOf(image));
}
function openProduct(product,button,finish='silver'){
 if(!product)return;
 selected=product;opener=button;
 document.getElementById('productTitle').textContent=product.name;
 document.getElementById('productImage').setAttribute('tabindex','0');
 document.getElementById('productImage').setAttribute('aria-label','Фото чехла. Листай влево и вправо для смены цвета iPhone.');
 document.getElementById('productCategory').textContent=categories[product.category]||product.category;
 document.getElementById('productDescription').textContent=product.description;
 document.getElementById('imageNote').textContent=finishOf(product.images[0])?'Визуализация на iPhone 17 Pro. Оттенок на экране может отличаться от реального.':'Точный вид для твоей модели подтвердим перед заказом.';
 document.getElementById('productPrice').textContent=money(product.price);
 document.getElementById('buyPrice').textContent=money(product.price);
 const models=product.compatible_models;document.getElementById('productModels').textContent=models.length?'Для '+models.join(', '):'Выбери модель iPhone при оформлении. Наличие для твоей модели подтвердим до оплаты.';
 document.getElementById('productGallery').innerHTML=product.images.map((image,index)=>`<button type="button" data-photo="${index}" aria-pressed="${index===0}" aria-label="${escape(phoneFinishes[finishOf(image)]||'Фото '+(index+1))}">${photoMarkup(image,phoneFinishes[finishOf(image)]||'Фото '+(index+1))}<span>${escape(phoneFinishes[finishOf(image)]||'Фото '+(index+1))}</span></button>`).join('');

 showPhoto(Math.max(0,product.images.findIndex(image=>finishOf(image)===finish)));dialog.showModal();document.body.style.overflow='hidden';
}
document.getElementById('productGallery').addEventListener('click',event=>{const button=event.target.closest('[data-photo]');if(button&&selected)showPhoto(Number(button.dataset.photo));});
document.getElementById('closeDialog').addEventListener('click',()=>dialog.close());
document.getElementById('askProduct').addEventListener('click',()=>{if(!selected)return;const p=selected;dialog.close();chat?.open(p);});
dialog.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus();});
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
function render(category='all'){
 activeCollection=category;
 const query=document.getElementById('catalogSearch').value.trim().toLocaleLowerCase('ru');
 const filtered=products.filter(p=>(category==='all'||p.category===category)&&(!query||(p.name+' '+(categories[p.category]||'')+' '+p.description).toLocaleLowerCase('ru').includes(query)));
 document.getElementById('resultCount').textContent='Дизайнов: '+filtered.length;
 const collection=collections[category];
 document.getElementById('collectionTitle').textContent=collection?.tagline||'Один телефон. Разные настроения.';
 document.getElementById('collectionDescription').textContent=collection?.description||'Семь коллекций, чтобы выбрать свою деталь. Примерь дизайн к цвету iPhone в карточке и найди сочетание под сегодняшний образ.';
 grid.innerHTML=filtered.map(p=>`<article class="product-card"><button class="product-image" type="button" data-product="${escape(p.id)}" aria-label="Открыть ${escape(p.name)}">${photoMarkup(p.images[0],p.name)}<span class="view" aria-hidden="true">→</span></button><p class="product-category">${escape(categories[p.category]||p.category)}</p><h3><button data-product="${escape(p.id)}">${escape(p.name)}</button></h3><div class="price-row"><span>${money(p.price)}</span><button data-product="${escape(p.id)}">Выбрать →</button></div><p class="card-finishes">${p.images.some(image=>finishOf(image))?'Примерить к цвету iPhone ↗':''}</p></article>`).join('')||'<p class="empty">Ничего не нашли. Попробуй другое название или коллекцию.</p>';
 document.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===category)));
}
function selectCollection(category,scroll=false){render(category);if(scroll)document.getElementById('shop').scrollIntoView({behavior:'smooth'});}
grid.addEventListener('click',event=>{const button=event.target.closest('[data-product]');if(button)openProduct(products.find(p=>p.id===button.dataset.product),button);});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>selectCollection(button.dataset.filter)));
function renderCollections(){
 document.getElementById('collectionCards').innerHTML=Object.entries(collections).map(([key,c])=>{
  const product=products.find(p=>p.category===key);
  return `<article class="collection-card"><button type="button" data-collection="${key}" aria-label="Открыть коллекцию ${escape(c.name)}"><div class="collection-card-photo">${product?photoMarkup(product.images[0],c.name):''}</div><div class="collection-card-heading"><h3>${c.name}</h3><span aria-hidden="true">↗</span></div></button><p>${escape(c.description)}</p></article>`;
 }).join('');
 document.getElementById('collectionCards').addEventListener('click',event=>{const button=event.target.closest('[data-collection]');if(button)selectCollection(button.dataset.collection,true);});
}
const menu=document.getElementById('menuDialog');
 document.getElementById('openMenu').addEventListener('click',()=>{menu.showModal();document.body.style.overflow='hidden';});
 document.getElementById('closeMenu').addEventListener('click',()=>menu.close());
 menu.addEventListener('close',()=>{document.body.style.overflow='';});
 menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));
 document.getElementById('catalogSearch').addEventListener('input',()=>render(activeCollection));
 let touchStart=null;
 const photo=document.getElementById('productImage');
 photo.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};});
 photo.addEventListener('pointerup',e=>{if(!touchStart||!selected)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)showPhoto((photoIndex+(dx<0?1:-1)+selected.images.length)%selected.images.length);});
 photo.addEventListener('pointercancel',()=>{touchStart=null;});
 dialog.addEventListener('keydown',e=>{if(!selected||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();showPhoto((photoIndex+(e.key==='ArrowRight'?1:-1)+selected.images.length)%selected.images.length);}});
 function setupHero(){
  const chosen=['azul','racetrack','ocean','leopard'].map(category=>products.find(p=>p.category===category)).filter(Boolean);
  if(!chosen.length)return;
  const rail=document.getElementById('heroRail');let active=0,scheduled=false;
  rail.innerHTML=chosen.map((p,i)=>`<div class="hero-slide"><div class="hero-photo">${photoMarkup(p.images[0],p.name)}</div></div>`).join('');
  const first=rail.querySelector('img');if(first){first.loading='eager';first.setAttribute('fetchpriority','high');}
  function update(){active=Math.min(chosen.length-1,Math.max(0,Math.round(rail.scrollLeft/rail.clientWidth)));const p=chosen[active];document.getElementById('heroCollection').textContent='THE '+(categories[p.category]||p.category).toUpperCase()+' EDIT';document.getElementById('heroName').textContent=p.name;document.getElementById('heroPrice').textContent=money(p.price);document.getElementById('heroPage').textContent=String(active+1).padStart(2,'0')+' / '+String(chosen.length).padStart(2,'0');}
  rail.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{update();scheduled=false;});}},{passive:true});
  const move=step=>rail.scrollTo({left:((active+step+chosen.length)%chosen.length)*rail.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  document.getElementById('heroPrev').addEventListener('click',()=>move(-1));document.getElementById('heroNext').addEventListener('click',()=>move(1));
  const choose=document.getElementById('heroChoose');choose.disabled=false;choose.addEventListener('click',()=>openProduct(chosen[active],choose));update();
 }
try{
 const allProducts=assertResult(await db.from('store_products').select('*').eq('active',true).order('created_at').limit(500));
 chat=setupChat(allProducts);
 products=allProducts.filter(p=>p.kind!=='bundle');
 setupPhoneEdits(allProducts,openProduct);
 products.sort((a,b)=>Number(a.legacy_id||999)-Number(b.legacy_id||999));
 render();renderCollections();setupHero();
}catch{chat??=setupChat([]);grid.innerHTML='<p>Каталог временно не загрузился. Обнови страницу или <a href="https://t.me/luka_sol">напиши нам</a>.</p>';}
const user=await currentUser();if(user)document.getElementById('accountLink').setAttribute('aria-label','Мой кабинет');
