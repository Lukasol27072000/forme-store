import {db,currentUser,isAdmin,assertResult,escape,money,when,statuses,safeImage,errorMessage} from './client.js';
import {insertOnce,setupSupport} from './support.js';
let mode='login',user=null,selected=null,orderId=null;
const authPanel=document.getElementById('authPanel');
const authForm=document.getElementById('authForm');
const authStatus=document.getElementById('authStatus');
const params=new URLSearchParams(location.search);
const productId=params.get('product')||sessionStorage.getItem('forme-product');
if(params.get('product'))sessionStorage.setItem('forme-product',params.get('product'));
document.querySelectorAll('[data-auth]').forEach(button=>button.onclick=()=>{
 mode=button.dataset.auth;document.querySelectorAll('[data-auth]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.getElementById('authTitle').textContent=mode==='signup'?'Твой аккаунт FORMÉ.':'С возвращением.';
 document.getElementById('authSubmit').textContent=mode==='signup'?'Создать аккаунт →':'Войти →';
 document.getElementById('password').autocomplete=mode==='signup'?'new-password':'current-password';authStatus.textContent='';
});
authForm.addEventListener('submit',async event=>{
 event.preventDefault();const button=document.getElementById('authSubmit');button.disabled=true;authStatus.textContent='Подключаемся…';
 try{
  const data=new FormData(authForm),email=data.get('email').trim(),password=data.get('password');
  if(mode==='signup'){
   const settingsResponse=await fetch('https://ubassnbaqsblpmqtzjga.supabase.co/auth/v1/settings',{headers:{apikey:'sb_publishable_-BVwT30vV-Qa5wsNj5GVfg__pxF3fp7'}});
   if(!settingsResponse.ok)throw Error('Auth settings unavailable');
   const settings=await settingsResponse.json();
   if(!settings.mailer_autoconfirm){authStatus.textContent='Регистрация пока готовится. Помощь — @luka_sol.';return;}
   const result=assertResult(await db.auth.signUp({email,password}));
   if(!result.session){assertResult(await db.auth.signInWithPassword({email,password}));}
  }else assertResult(await db.auth.signInWithPassword({email,password}));
  user=await currentUser();await showMember();
 }catch(e){authStatus.textContent=errorMessage(e);}finally{button.disabled=false;}
});
document.getElementById('logout').onclick=async()=>{const {error}=await db.auth.signOut();if(!error)location.replace('/account.html');};
async function loadOrders(){
 const rows=assertResult(await db.from('store_orders').select('*,store_order_events(*)').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100));
 document.getElementById('orders').innerHTML=rows.length?rows.map(o=>`<article class="order-card"><div class="order-summary"><img src="${escape(safeImage(o.product_image))}" alt="${escape(o.product_name)}"><div><small>№ ${escape(o.id.slice(0,8))} · ${when(o.created_at)}</small><h3>${escape(o.product_name)}</h3><p>${escape(o.phone_model)} · ${money(o.unit_price)}</p><span class="badge">${statuses[o.status]}</span></div></div><details><summary>Детали и история</summary><p>${escape(o.customer_name)} · ${escape(o.contact)}<br>${escape(o.city)}, ${escape(o.address)}</p>${o.tracking_number?`<p>Трек-номер <strong>${escape(o.tracking_number)}</strong></p>`:''}<ol class="timeline">${o.store_order_events.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)).map(e=>`<li>${statuses[e.status]} <small>${when(e.created_at)}</small></li>`).join('')}</ol></details><button class="text-button" data-support-order="${escape(o.id)}">Вопрос по заказу →</button></article>`).join(''):'<div class="empty"><h3>Здесь будут твои заказы.</h3><p>Выбери чехол в каталоге — он появится здесь после оформления.</p></div>';
 const select=document.getElementById('ticketOrder');const previous=select.value;
 select.innerHTML='<option value="">Общий вопрос</option>'+rows.map(o=>`<option value="${escape(o.id)}">№ ${escape(o.id.slice(0,8))} · ${escape(o.product_name)}</option>`).join('');select.value=previous;
}
document.getElementById('orders').addEventListener('click',event=>{
 const button=event.target.closest('[data-support-order]');if(!button)return;
 document.getElementById('ticketOrder').value=button.dataset.supportOrder;document.querySelector('#ticketForm [name=subject]').value='Вопрос по заказу № '+button.dataset.supportOrder.slice(0,8);document.getElementById('supportSection').scrollIntoView({behavior:'smooth'});
});
document.getElementById('refreshOrders').onclick=()=>loadOrders().catch(e=>{document.getElementById('ordersStatus').textContent=errorMessage(e);});
async function loadCheckout(){
 if(!productId)return;
 selected=assertResult(await db.from('store_products').select('*').eq('id',productId).eq('active',true).maybeSingle());
 if(!selected){document.getElementById('ordersStatus').textContent='Этот чехол сейчас недоступен. Выбери другой в каталоге.';return;}
 document.getElementById('checkout').hidden=false;
 document.getElementById('checkoutProduct').innerHTML=`<div class="order-summary"><img src="${escape(safeImage(selected.images[0]))}" alt="${escape(selected.name)}"><div><h2>${escape(selected.name)}</h2><p>${money(selected.price)} + доставка</p></div></div>`;
 const model=document.querySelector('#checkoutForm [name=phone_model]');
 if(selected.compatible_models.length){const select=document.createElement('select');select.name='phone_model';select.required=true;select.innerHTML='<option value="">Выбери модель</option>'+selected.compatible_models.map(m=>`<option>${escape(m)}</option>`).join('');model.replaceWith(select);}
 orderId=sessionStorage.getItem('forme-order-'+selected.id)||crypto.randomUUID();sessionStorage.setItem('forme-order-'+selected.id,orderId);
}
document.getElementById('cancelCheckout').onclick=()=>{sessionStorage.removeItem('forme-product');document.getElementById('checkout').hidden=true;history.replaceState({},'','/account.html');};
document.getElementById('checkoutForm').addEventListener('submit',async event=>{
 event.preventDefault();if(!selected)return;
 const form=event.currentTarget,button=form.querySelector('button[type=submit]'),status=document.getElementById('checkoutStatus');button.disabled=true;status.textContent='Оформляем заказ…';
 try{
  const data=new FormData(form);const row={id:orderId,user_id:user.id,product_id:selected.id,unit_price:selected.price,consent:data.get('consent')==='on'};
  for(const key of ['phone_model','customer_name','contact','city','address','comment'])row[key]=data.get(key).trim();
  if(['phone_model','customer_name','contact','city','address'].some(key=>!row[key]))throw Error('Empty fields');
  // The database freezes the current product name, photo and price atomically.
  await insertOnce('store_orders',row);
  sessionStorage.removeItem('forme-product');sessionStorage.removeItem('forme-order-'+selected.id);selected=null;document.getElementById('checkout').hidden=true;
  history.replaceState({},'','/account.html');document.getElementById('ordersStatus').textContent='Заказ получен. Подтвердим наличие и доставку в переписке.';await loadOrders();
 }catch(e){status.textContent=errorMessage(e);}finally{button.disabled=false;}
});
let supportReady=false;
async function showMember(){
 if(!user)return;
 authPanel.hidden=true;document.getElementById('memberPanel').hidden=false;document.getElementById('logout').hidden=false;document.getElementById('memberEmail').textContent=user.email;
 document.getElementById('adminLink').hidden=!(await isAdmin());
 await loadOrders();await loadCheckout();
 if(!supportReady){await setupSupport(user);supportReady=true;}
}
try{user=await currentUser();if(user)await showMember();}catch(e){authStatus.textContent=errorMessage(e);document.getElementById('ordersStatus').textContent=errorMessage(e);}
