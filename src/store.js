import {db,assertResult,escape,money,categories,safeImage,currentUser} from './client.js';
const grid=document.getElementById('productGrid'),dialog=document.getElementById('productDialog');
let products=[],selected=null,opener=null;
function openProduct(product,button){
 selected=product;opener=button;
 document.getElementById('productTitle').textContent=product.name;
 document.getElementById('productCategory').textContent=categories[product.category];
 document.getElementById('productDescription').textContent=product.description;
 document.getElementById('productImage').src=safeImage(product.images[0]);document.getElementById('productImage').alt=product.name;
 document.getElementById('imageNote').textContent=product.reference_image?'На фото пример коллекции. Точный вид подтвердим до оплаты.':'Точный вид для твоей модели подтвердим перед заказом.';
 document.getElementById('productPrice').textContent=money(product.price);
 const models=product.compatible_models;document.getElementById('productModels').textContent=models.length?'Для '+models.join(', '):'Укажи точную модель iPhone при оформлении. Совместимость подтвердим перед заказом.';
 document.getElementById('productGallery').innerHTML=product.images.map((image,index)=>`<button type="button" data-photo="${index}" aria-label="Фото ${index+1}"><img src="${escape(safeImage(image))}" alt="Фото ${index+1}"></button>`).join('');
 document.getElementById('orderProduct').href='/account.html?product='+encodeURIComponent(product.id);dialog.showModal();document.body.style.overflow='hidden';
}
document.getElementById('productGallery').onclick=event=>{const button=event.target.closest('[data-photo]');if(button&&selected)document.getElementById('productImage').src=safeImage(selected.images[Number(button.dataset.photo)]);};
document.getElementById('closeDialog').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus();});
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
function render(category='all'){
 const filtered=products.filter(p=>category==='all'||p.category===category);
 document.getElementById('resultCount').textContent='Дизайнов: '+filtered.length;
 grid.innerHTML=filtered.map(p=>`<article class="product-card"><button class="product-image" type="button" data-product="${escape(p.id)}" aria-label="Открыть ${escape(p.name)}"><img src="${escape(safeImage(p.images[0]))}" alt="${escape(p.name)}" loading="lazy" width="600" height="750">${p.reference_image?'<span class="reference">Фото уточняется</span>':''}<span class="view" aria-hidden="true">→</span></button><p class="product-category">${escape(categories[p.category])}</p><h3><button data-product="${escape(p.id)}">${escape(p.name)}</button></h3><div class="price-row"><span>${money(p.price)}</span><button data-product="${escape(p.id)}">Выбрать →</button></div></article>`).join('')||'<p class="empty">В этой коллекции пока нет доступных чехлов.</p>';
}
grid.onclick=event=>{const button=event.target.closest('[data-product]');if(button)openProduct(products.find(p=>p.id===button.dataset.product),button);};
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render(button.dataset.filter);});
try{products=assertResult(await db.from('store_products').select('*').eq('active',true).order('created_at').limit(500));render();}catch{grid.innerHTML='<p>Каталог временно не загрузился. Обнови страницу или <a href="https://t.me/luka_sol">напиши нам</a>.</p>';}
const user=await currentUser();if(user)document.getElementById('accountLink').textContent='Мой кабинет →';
