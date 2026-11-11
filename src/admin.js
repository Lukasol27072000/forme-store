import {photoMarkup,phoneFinishes,finishOf} from './catalog.js';
import {db,currentUser,isAdmin,assertResult,escape,money,when,statuses,categories,safeImage,errorMessage} from './client.js';
import {setupSupport} from './support.js';
const access=document.getElementById('accessStatus');
let products=[],images=[];
const productForm=document.getElementById('productForm');
async function loadOrders(){
 let query=db.from('store_orders').select('*').order('created_at',{ascending:false}).limit(200);
 const filter=document.getElementById('orderFilter').value;if(filter!=='all')query=query.eq('status',filter);
 const orders=assertResult(await query);
 document.getElementById('orders').innerHTML=orders.length?orders.map(o=>`<article class="order-card"><div class="panel-heading"><div><small>№ ${escape(o.id.slice(0,8))} · ${when(o.created_at)}</small><h3>${escape(o.product_name)}</h3><p>${escape(o.phone_model)} · ${money(o.unit_price)}</p></div><span class="badge">${statuses[o.status]}</span></div><p>${escape(o.customer_name)} · ${escape(o.contact)}<br>${escape(o.city)}, ${escape(o.address)}</p>${o.comment?`<p class="customer-comment">${escape(o.comment)}</p>`:''}<form class="order-update" data-order="${escape(o.id)}"><label>Статус<select name="status">${Object.entries(statuses).map(([key,label])=>`<option value="${key}" ${key===o.status?'selected':''}>${label}</option>`).join('')}</select></label><label>Трек-номер<input name="tracking_number" value="${escape(o.tracking_number)}" maxlength="150"></label><button class="button" type="submit">Сохранить</button><p role="status" class="notice"></p></form></article>`).join(''):'<p class="empty">Заказов с таким статусом пока нет.</p>';
}
document.getElementById('orders').addEventListener('submit',async event=>{
 const form=event.target.closest('[data-order]');if(!form)return;event.preventDefault();const button=form.querySelector('button');button.disabled=true;
 try{const data=new FormData(form);assertResult(await db.from('store_orders').update({status:data.get('status'),tracking_number:data.get('tracking_number').trim()}).eq('id',form.dataset.order).select().single());await loadOrders();}catch(e){form.querySelector('[role=status]').textContent=errorMessage(e);}finally{button.disabled=false;}
});
function showImages(){
 document.getElementById('productImages').innerHTML=images.map((url,index)=>`<div>${photoMarkup(url,phoneFinishes[finishOf(url)]||`Фото ${index+1}`)}<button type="button" data-remove-image="${index}" class="text-button">Убрать из карточки</button>${index===0?'<small>Главное фото</small>':`<button type="button" data-main-image="${index}" class="text-button">Сделать главным</button>`}</div>`).join('');
}
document.getElementById('productImages').onclick=event=>{
 const remove=event.target.closest('[data-remove-image]'),main=event.target.closest('[data-main-image]');
 if(remove)images.splice(Number(remove.dataset.removeImage),1);
 if(main){const index=Number(main.dataset.mainImage);images.unshift(images.splice(index,1)[0]);}
 showImages();
};
function editProduct(product=null){
 productForm.reset();productForm.hidden=false;
 for(const key of ['id','name','category','description'])productForm.elements[key].value=product?.[key]??(key==='category'?'azul':'');
 productForm.elements.price.value=product?product.price/100:1290;
 productForm.elements.compatible_models.value=product?.compatible_models.join('\n')||'';
 productForm.elements.active.checked=product?.active??true;productForm.elements.reference_image.checked=product?.reference_image??false;
 images=[...(product?.images||[])];showImages();document.getElementById('productStatus').textContent='';document.getElementById('productFormTitle').textContent=product?'Редактировать чехол':'Новый чехол';productForm.scrollIntoView({behavior:'smooth'});
}
async function loadProducts(){
 products=assertResult(await db.from('store_products').select('*').order('created_at').limit(500));
 document.getElementById('adminProducts').innerHTML=products.map(p=>`<button class="admin-product" data-product="${escape(p.id)}">${photoMarkup(p.images[0],p.name)}<span><strong>${escape(p.name)}</strong><small>${money(p.price)} · ${p.active?'На витрине':'Скрыт'}</small></span><span>Изменить →</span></button>`).join('');
}
document.getElementById('adminProducts').onclick=event=>{const button=event.target.closest('[data-product]');if(button)editProduct(products.find(p=>p.id===button.dataset.product));};
document.getElementById('newProduct').onclick=()=>editProduct();
document.getElementById('cancelProduct').onclick=()=>{productForm.hidden=true;};
productForm.addEventListener('submit',async event=>{
 event.preventDefault();const button=productForm.querySelector('button[type=submit]'),status=document.getElementById('productStatus');button.disabled=true;status.textContent='Сохраняем…';
 try{
  const data=new FormData(productForm),files=data.getAll('photos').filter(file=>file.size>0);
  if(images.length+files.length>10)throw Error('Не больше 10 фотографий на товар.');
  for(const file of files){if(file.size>5242880||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Нужны JPEG, PNG или WebP до 5 МБ.');}
  const price=Math.round(Number(data.get('price'))*100);if(!Number.isSafeInteger(price)||price<100)throw Error('Укажи корректную цену.');
  const name=data.get('name').trim();if(!name)throw Error('Укажи название.');
  for(const file of files){
   const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];const path=`catalog/${crypto.randomUUID()}.${ext}`;
   assertResult(await db.storage.from('store-products').upload(path,file,{contentType:file.type,upsert:false}));
   images.push(db.storage.from('store-products').getPublicUrl(path).data.publicUrl);
  }
  // Clear successfully uploaded files before retrying a failed database write.
  productForm.elements.photos.value='';showImages();
  if(!images.length)throw Error('Добавь хотя бы одно фото.');
  const row={name,category:data.get('category'),description:data.get('description').trim(),price,images:[...images],compatible_models:[...new Set(data.get('compatible_models').split('\n').map(x=>x.trim()).filter(Boolean))],active:data.get('active')==='on',reference_image:data.get('reference_image')==='on',updated_at:new Date().toISOString()};
  const id=data.get('id')||crypto.randomUUID();productForm.elements.id.value=id;
  assertResult(await db.from('store_products').upsert({...row,id},{onConflict:'id'}).select().single());
  status.textContent='Сохранено. Изменения доступны на витрине.';await loadProducts();
 }catch(e){status.textContent=/^(Нужны|Укажи|Добавь|Не больше)/.test(e.message)?e.message:errorMessage(e);}finally{button.disabled=false;}
});
const refresh=()=>loadOrders().catch(e=>{document.getElementById('ordersStatus').textContent=errorMessage(e);});
document.getElementById('refreshOrders').onclick=refresh;document.getElementById('orderFilter').onchange=refresh;
document.getElementById('logout').onclick=async()=>{assertResult(await db.auth.signOut());location.replace('/account.html');};
try{
 const user=await currentUser();
 if(!user){access.innerHTML='Войди в свой аккаунт для управления магазином. <a href="/account.html">Войти →</a>';}
 else if(!(await isAdmin()))access.textContent='У этого аккаунта нет прав администратора. Обратись к владельцу магазина.';
 else{access.hidden=true;document.getElementById('adminPanel').hidden=false;document.getElementById('adminLink').hidden=false;document.getElementById('logout').hidden=false;await Promise.all([loadOrders(),loadProducts(),setupSupport(user,true)]);}
}catch(e){access.textContent=errorMessage(e);}
