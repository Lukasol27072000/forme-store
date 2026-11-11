import {escape,money} from './client.js';
import {phoneFinishes,photoMarkup,finishOf} from './catalog.js';
const slots=[0,1,2,3,5,6,7,8];
const finishIndexes={silver:0,'deep-blue':1,'cosmic-orange':2};
export function setupPhoneEdits(allProducts,openProduct){
 const section=document.getElementById('phone-edits'),board=document.getElementById('editBoard'),summary=document.getElementById('editSummary');
 const available=new Map(allProducts.filter(p=>p.kind!=='bundle').map(p=>[p.id,p]));
 const bundles=allProducts.filter(p=>p.kind==='bundle'&&p.bundle_product_ids?.length===8&&p.bundle_product_ids.every(id=>available.has(id)));
 let finish='silver';
 function render(){
  const bundle=bundles.find(b=>b.bundle_finish===finish);
  section.querySelectorAll('[data-edit-finish]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.editFinish===finish)));
  if(!bundle){board.innerHTML='<p class="empty">Эта подборка сейчас обновляется. Другие дизайны доступны в каталоге.</p>';summary.innerHTML='';return;}
  const items=bundle.bundle_product_ids.map(id=>available.get(id));
  const centerIndex=finishIndexes[finish],width=615,center=[343,891,1437][centerIndex];
  const phone=`https://forme-store-luka-sol.vercel.app/catalog/iphone-finishes.webp#view=${center-width/2},24,${width},820,1774,887`;
  const cells=items.map((product,index)=>{
   const image=product.images.find(url=>finishOf(url)===finish)||product.images[0];
   return `<button class="edit-case" style="grid-area:${Math.floor(slots[index]/3)+1}/${slots[index]%3+1}" type="button" data-edit-product="${escape(product.id)}" aria-label="Выбрать ${escape(product.name)} — ${escape(money(product.price))}"><span class="edit-case-photo">${photoMarkup(image,product.name+' на '+phoneFinishes[finish])}</span><span class="edit-case-name">${escape(product.name)}</span><span class="edit-case-price">${money(product.price)} <span aria-hidden="true">↗</span></span></button>`;
  });
  board.innerHTML=cells.join('')+`<div class="edit-phone">${photoMarkup(phone,'iPhone 17 Pro — '+phoneFinishes[finish])}<p>iPhone 17 Pro<br><strong>${phoneFinishes[finish]}</strong></p></div>`;
  const individual=items.reduce((sum,p)=>sum+p.price,0);
  summary.innerHTML=`<p class="eyebrow">THE PHONE WARDROBE / 8 CASES</p><h3>${escape(bundle.name.replace(' — 8 чехлов',''))}</h3><p>${escape(bundle.description)}</p><p class="edit-instruction">Нажми на любой чехол, чтобы заказать его отдельно. Или забери всю подборку.</p><div class="edit-total">${individual>bundle.price?`<del>${money(individual)}</del>`:''}<strong>${money(bundle.price)}</strong><span>за все 8 чехлов · доставка отдельно</span></div><a class="button full" href="/account.html?product=${encodeURIComponent(bundle.id)}&finish=${encodeURIComponent(finish)}">Заказать все 8 <span>→</span></a><p class="edit-disclaimer">Восемь чехлов для одной выбранной модели. Телефон в комплект не входит. Наличие и совместимость согласуем до оплаты.</p><details class="edit-contents"><summary>Что входит в набор</summary><ol>${items.map(p=>`<li>${escape(p.name)} <span>1 шт.</span></li>`).join('')}</ol></details>`;
 }
 board.onclick=event=>{const button=event.target.closest('[data-edit-product]');if(button)openProduct(available.get(button.dataset.editProduct),button,finish);};
 section.querySelectorAll('[data-edit-finish]').forEach(button=>button.onclick=()=>{finish=button.dataset.editFinish;render();});
 render();
}
