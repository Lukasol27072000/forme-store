import { db,assertResult,escape,when,errorMessage } from './client.js';
export async function insertOnce(table,row) {
 const result=await db.from(table).insert(row).select().single();
 if(!result.error) return result.data;
 const existing=await db.from(table).select('*').eq('id',row.id).maybeSingle();
 if(existing.data) return existing.data;
 throw result.error;
}
export async function setupSupport(user,admin=false) {
 const list=document.getElementById('ticketList');
 const form=document.getElementById('ticketForm');
 const messageForm=document.getElementById('messageForm');
 const stateButton=document.getElementById('ticketState');
 let selected=null,tickets=[],draftTicket=null,draftMessage=null;
 if(admin) form.hidden=true;
 async function loadTickets(){
  tickets=assertResult(await db.from('store_tickets').select('*').order('created_at',{ascending:false}).limit(200));
  list.innerHTML=tickets.length?tickets.map(t=>`<button class="ticket" data-ticket="${escape(t.id)}"><span>${escape(t.subject)}</span><small>${t.status==='open'?'Открыто':'Закрыто'} · ${when(t.created_at)}</small></button>`).join(''):'<p class="empty">Обращений пока нет.</p>';
 }
 async function loadMessages(){
  if(!selected) return;
  const messages=assertResult(await db.from('store_messages').select('*').eq('ticket_id',selected.id).order('created_at').limit(500));
  document.getElementById('conversationTitle').textContent=selected.subject;
  document.getElementById('conversation').hidden=false;
  document.getElementById('messages').innerHTML=messages.map(m=>`<article class="message ${m.sender_id===user.id?'own':''}"><small>${m.sender_id===user.id?'Ты':admin?'Клиент':'FORMÉ'} · ${when(m.created_at)}</small><p>${escape(m.body)}</p></article>`).join('')||'<p class="muted">Напиши первое сообщение.</p>';
  messageForm.hidden=selected.status==='closed';
  stateButton.hidden=!admin;
  stateButton.textContent=selected.status==='closed'?'Открыть обращение':'Закрыть обращение';
 }
 async function refresh(){ await loadTickets(); if(selected){selected=tickets.find(t=>t.id===selected.id)||null; await loadMessages();} }
 list.addEventListener('click',async event=>{
  const button=event.target.closest('[data-ticket]');if(!button)return;
  selected=tickets.find(t=>t.id===button.dataset.ticket);
  try{await loadMessages();}catch(e){document.getElementById('messageStatus').textContent=errorMessage(e);}
 });
 document.getElementById('refreshSupport').onclick=()=>refresh().catch(e=>{document.getElementById('ticketStatus').textContent=errorMessage(e);});
 form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;
  const status=document.getElementById('ticketStatus');status.textContent='Отправляем…';
  try{
   const data=new FormData(form);
   if(!data.get('subject').trim()||!data.get('body').trim())throw Error('Empty message');
   draftTicket??=crypto.randomUUID();
   const ticket=await insertOnce('store_tickets',{id:draftTicket,user_id:user.id,subject:data.get('subject').trim(),order_id:data.get('order_id')||null});
   draftMessage??=crypto.randomUUID();
   await insertOnce('store_messages',{id:draftMessage,ticket_id:ticket.id,sender_id:user.id,body:data.get('body').trim()});
   selected=ticket;draftTicket=null;draftMessage=null;form.reset();status.textContent='Сообщение отправлено. Ответ появится здесь.';await refresh();
  }catch(e){status.textContent=errorMessage(e);}finally{button.disabled=false;}
 });
 let replyId=null;
 messageForm.addEventListener('submit',async event=>{
  event.preventDefault();if(!selected)return;
  const button=messageForm.querySelector('button');button.disabled=true;
  const status=document.getElementById('messageStatus');
  try{
   const body=new FormData(messageForm).get('body').trim();if(!body)throw Error('Empty message');
   replyId??=crypto.randomUUID();
   await insertOnce('store_messages',{id:replyId,ticket_id:selected.id,sender_id:user.id,body});
   replyId=null;messageForm.reset();status.textContent='Отправлено.';await loadMessages();
  }catch(e){status.textContent=errorMessage(e);}finally{button.disabled=false;}
 });
 stateButton.onclick=async()=>{
  if(!selected)return;stateButton.disabled=true;
  try{assertResult(await db.from('store_tickets').update({status:selected.status==='open'?'closed':'open'}).eq('id',selected.id).select().single());await refresh();}catch(e){document.getElementById('messageStatus').textContent=errorMessage(e);}finally{stateButton.disabled=false;}
 };
 const timer=setInterval(()=>{if(!document.hidden&&selected) refresh().catch(()=>{});},15000);
 window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
 await loadTickets();
}
