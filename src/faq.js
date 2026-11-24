import {faqs,faqGroups} from './faq-data.js';
import {setupChat} from './chat.js';
import {db,escape} from './client.js';
import './faq.css';
const search=document.getElementById('faqSearch'),answers=document.getElementById('faqAnswers'),filters=document.getElementById('faqFilters');
let active='all';
const plain=t=>t.toLowerCase().replace(/ё/g,'е');
filters.innerHTML=[['all','Все вопросы'],...Object.entries(faqGroups)].map(([id,label])=>`<button type="button" data-faq-group="${id}" aria-pressed="${id==='all'}">${label}</button>`).join('');
function render(){const q=plain(search.value.trim());const filtered=faqs.filter(f=>(active==='all'||f.group===active)&&plain(f.question+' '+f.answer).includes(q));document.getElementById('faqCount').textContent=q?'Найдено ответов: '+filtered.length:'';answers.innerHTML=filtered.length?Object.entries(faqGroups).map(([id,label])=>{const items=filtered.filter(f=>f.group===id);return items.length?`<section class="faq-group"><p class="eyebrow">${escape(label)}</p>${items.map(f=>`<details id="faq-${f.id}" ${q?'open':''}><summary>${escape(f.question)}</summary><p>${escape(f.answer)}</p></details>`).join('')}</section>`:'';}).join(''):'<p class="empty">Пока не нашли такой вопрос. Напиши менеджеру — поможем разобраться.</p>';}
search.addEventListener('input',render);filters.onclick=e=>{const b=e.target.closest('[data-faq-group]');if(!b)return;active=b.dataset.faqGroup;filters.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();};render();
const chat=setupChat([]);document.getElementById('faqContact').onclick=()=>chat.openManager();
const {data}=await db.from('store_products').select('id,name').eq('active',true).order('created_at').limit(500);if(data)chat.setProducts(data);
const target=document.getElementById(location.hash.slice(1));if(target?.tagName==='DETAILS'){target.open=true;target.scrollIntoView({block:'center'});}
