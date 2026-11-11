import {db,assertResult,escape,money,categories,currentUser} from './client.js';
import {collections,phoneFinishes,photoMarkup,finishOf} from './catalog.js';
const grid=document.getElementById('productGrid'),dialog=document.getElementById('productDialog');
let products=[],selected=null,opener=null,photoIndex=0,activeCollection='all';
function showPhoto(index){
 photoIndex=index;
 const image=selected.images[index];
 document.getElementById('productImage').innerHTML=photoMarkup(image,selected.name+' — '+(phoneFinishes[finishOf(image)]||'вид чехла'));
 document.querySelectorAll('[data-photo]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.photo)===index)));
 document.getElementById('selectedFinish').textContent=phoneFinishes[finishOf(image)]||'Фото '+(index+1);
 document.getElementById('orderProduct').href='/account.html?product='+encodeURIComponent(selected.id)+'&finish='+encodeURIComponent(finishOf(image));
}
function openProduct(product,button){
 if(!product)return;
 selected=product;opener=button;
 document.getElementById('productTitle').textContent=product.name;
 document.getElementById('productCategory').textContent=categories[product.category]||product.category;
 document.getElementById('productDescription').textContent=product.description;
 document.getElementById('imageNote').textContent=finishOf(product.images[0])?'Визуализация на iPhone 17 Pro. Оттенок на экране может отличаться от реального.':'Точный вид для твоей модели подтвердим перед заказом.';
 document.getElementById('productPrice').textContent=money(product.price);
 const models=product.compatible_models;document.getElementById('productModels').textContent=models.length?'Для '+models.join(', '):'Выбери модель iPhone при оформлении. Наличие для твоей модели подтвердим до оплаты.';
 document.getElementById('productGallery').innerHTML=product.images.map((image,index)=>`<button type="button" data-photo="${index}" aria-pressed="${index===0}" aria-label="${escape(phoneFinishes[finishOf(image)]||'Фото '+(index+1))}">${photoMarkup(image,phoneFinishes[finishOf(image)]||'Фото '+(index+1))}<span>${escape(phoneFinishes[finishOf(image)]||'Фото '+(index+1))}</span></button>`).join('');
 showPhoto(0);dialog.showModal();document.body.style.overflow='hidden';
}
document.getElementById('productGallery').onclick=event=>{const button=event.target.closest('[data-photo]');if(button&&selected)showPhoto(Number(button.dataset.photo));};
document.getElementById('closeDialog').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus();});
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
function render(category='all'){
 activeCollection=category;
 const filtered=products.filter(p=>category==='all'||p.category===category);
 document.getElementById('resultCount').textContent='Дизайнов: '+filtered.length;
 const collection=collections[category];
 document.getElementById('collectionTitle').textContent=collection?.tagline||'Один телефон. Разные настроения.';
 document.getElementById('collectionDescription').textContent=collection?.description||'Семь коллекций, чтобы выбрать свою деталь. Примерь дизайн к цвету iPhone в карточке и найди сочетание под сегодняшний образ.';
 grid.innerHTML=filtered.map(p=>`<article class="product-card"><button class="product-image" type="button" data-product="${escape(p.id)}" aria-label="Открыть ${escape(p.name)}">${photoMarkup(p.images[0],p.name)}<span class="view" aria-hidden="true">→</span></button><p class="product-category">${escape(categories[p.category]||p.category)}</p><h3><button data-product="${escape(p.id)}">${escape(p.name)}</button></h3><div class="price-row"><span>${money(p.price)}</span><button data-product="${escape(p.id)}">Выбрать →</button></div><p class="card-finishes">${p.images.some(image=>finishOf(image))?'3 цвета iPhone · посмотреть →':''}</p></article>`).join('')||'<p class="empty">В этой коллекции пока нет доступных чехлов.</p>';
 document.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===category)));
}
function selectCollection(category,scroll=false){render(category);if(scroll)document.getElementById('shop').scrollIntoView({behavior:'smooth'});}
grid.onclick=event=>{const button=event.target.closest('[data-product]');if(button)openProduct(products.find(p=>p.id===button.dataset.product),button);};
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>selectCollection(button.dataset.filter));
function renderCollections(){
 document.getElementById('collectionCards').innerHTML=Object.entries(collections).map(([key,c])=>{
  const product=products.find(p=>p.category===key);
  return `<article class="collection-card"><button type="button" data-collection="${key}" aria-label="Открыть коллекцию ${escape(c.name)}"><div class="collection-card-photo">${product?photoMarkup(product.images[0],c.name):''}</div><div class="collection-card-heading"><h3>${c.name}</h3><span aria-hidden="true">↗</span></div></button><p>${escape(c.description)}</p></article>`;
 }).join('');
 document.getElementById('collectionCards').onclick=event=>{const button=event.target.closest('[data-collection]');if(button)selectCollection(button.dataset.collection,true);};
}
try{
 products=assertResult(await db.from('store_products').select('*').eq('active',true).order('created_at').limit(500));
 products.sort((a,b)=>Number(a.legacy_id||999)-Number(b.legacy_id||999));
 render();renderCollections();
}catch{grid.innerHTML='<p>Каталог временно не загрузился. Обнови страницу или <a href="https://t.me/luka_sol">напиши нам</a>.</p>';}
const user=await currentUser();if(user)document.getElementById('accountLink').textContent='Мой кабинет →';
