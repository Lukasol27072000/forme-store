import {db,assertResult,escape,when,money,statuses,errorMessage} from './client.js';
import {contactHref} from './contacts.js';
export async function setupCustomers(){
 const list=document.getElementById('customerList'),status=document.getElementById('customersStatus');
 const previous=document.getElementById('customersPrevious'),next=document.getElementById('customersNext');
 let offset=0,search='',request=0;
 async function load(){
  const current=++request;status.textContent='Загружаем пользователей…';
  previous.disabled=true;next.disabled=true;
  try{
   const result=assertResult(await db.rpc('store_list_customers',{search_text:search,page_size:50,page_offset:offset}));
   if(current!==request)return;
   document.getElementById('customersCount').textContent='Найдено аккаунтов: '+result.total;
   document.getElementById('customersPage').textContent=result.total?`${offset+1}–${Math.min(offset+50,result.total)} из ${result.total}`:'0';
   list.innerHTML=result.items.length?result.items.map(customer=>{
    const href=contactHref(customer.contact_kind,customer.contact);
    return `<article class="customer-card"><div class="customer-heading"><div><h3>${escape(customer.full_name||'Имя не указано')}</h3><a href="mailto:${encodeURIComponent(customer.email||'')}">${escape(customer.email||'Почта не указана')}</a></div>${customer.is_admin?'<span class="badge">Администратор</span>':''}</div><dl class="customer-data"><div><dt>Контакт</dt><dd>${href?`<a href="${escape(href)}" ${customer.contact_kind==='telegram'?'target="_blank" rel="noopener"':''}>${escape(customer.contact)} →</a>`:'Ещё не указан'}</dd></div><div><dt>Регистрация</dt><dd>${when(customer.created_at)}</dd></div><div><dt>Последний вход</dt><dd>${customer.last_sign_in_at?when(customer.last_sign_in_at):'Ещё не входил'}</dd></div><div><dt>Заказов</dt><dd>${Number(customer.orders_count)||0}</dd></div></dl><button class="text-button" type="button" data-customer-orders="${escape(customer.id)}" aria-expanded="false">Посмотреть заказы →</button><div class="customer-orders" hidden></div></article>`;
   }).join(''):'<p class="empty">Пользователей по этому запросу пока нет.</p>';
   previous.disabled=offset===0;next.disabled=offset+50>=result.total;status.textContent='';
  }catch(error){if(current===request){status.textContent=errorMessage(error);list.innerHTML='';}}
 }
 document.getElementById('customerSearch').onsubmit=event=>{event.preventDefault();search=new FormData(event.currentTarget).get('query').trim();offset=0;load();};
 document.getElementById('refreshCustomers').onclick=()=>load();
 previous.onclick=()=>{offset=Math.max(0,offset-50);load();};next.onclick=()=>{offset+=50;load();};
 list.onclick=async event=>{
  const button=event.target.closest('[data-customer-orders]');if(!button)return;
  const target=button.parentElement.querySelector('.customer-orders');
  if(button.getAttribute('aria-expanded')==='true'){target.hidden=true;button.setAttribute('aria-expanded','false');return;}
  target.hidden=false;target.textContent='Загружаем заказы…';button.disabled=true;button.setAttribute('aria-expanded','true');
  try{
   const orders=assertResult(await db.from('store_orders').select('id,created_at,product_name,phone_model,unit_price,status,customer_name,contact,city,address,tracking_number,comment,bundle_snapshot').eq('user_id',button.dataset.customerOrders).order('created_at',{ascending:false}).limit(100));
   target.innerHTML=orders.length?orders.map(order=>`<article class="customer-order"><div class="customer-heading"><strong>${escape(order.product_name)}</strong><span class="badge">${escape(statuses[order.status]||order.status)}</span></div><p>${when(order.created_at)} · ${escape(order.phone_model)} · ${money(order.unit_price)}</p><p>${escape(order.customer_name)} · ${escape(order.contact)}<br>${escape(order.city)}, ${escape(order.address)}</p>${order.tracking_number?`<p>Трек-номер: ${escape(order.tracking_number)}</p>`:''}${order.comment?`<p>${escape(order.comment)}</p>`:''}${order.bundle_snapshot?.length?`<p>В наборе: ${order.bundle_snapshot.map(item=>escape(item.name)).join(', ')}</p>`:''}</article>`).join(''):'<p class="muted">У этого пользователя пока нет заказов.</p>';
  }catch(error){target.textContent=errorMessage(error);}finally{button.disabled=false;}
 };
 await load();
}
