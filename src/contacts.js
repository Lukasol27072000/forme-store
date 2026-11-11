export function normalizeContact(kind,input){
 let value=String(input||'').trim();
 if(kind==='telegram'){
  value=value.replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i,'').replace(/^@/,'').replace(/\/+$/,'');
  if(!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value))throw Error('Укажи Telegram в формате @username: от 5 до 32 латинских букв, цифр или знаков _.');
  return '@'+value;
 }
 value=value.replace(/[\s().-]/g,'');
 if(/^8\d{10}$/.test(value))value='+7'+value.slice(1);else if(/^\d+$/.test(value))value='+'+value;
 if(kind!=='phone'||!/^\+[1-9]\d{6,14}$/.test(value))throw Error('Укажи телефон с кодом страны, например +7 999 123-45-67.');
 return value;
}
export function contactHref(kind,value){
 try{const valid=normalizeContact(kind,value);return kind==='telegram'?'https://t.me/'+valid.slice(1):'tel:'+valid;}catch{return '';}
}
export function contactFields(form){
 const kind=form.elements.contact_kind,value=form.elements.contact;
 const refresh=()=>{value.placeholder=kind.value==='telegram'?'@username или https://t.me/username':'+7 999 123-45-67';value.inputMode=kind.value==='phone'?'tel':'text';value.autocomplete=kind.value==='phone'?'tel':'off';};
 kind.addEventListener('change',refresh);refresh();
}
