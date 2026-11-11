import { createClient } from '@supabase/supabase-js';
import {collections} from './catalog.js';
export const db = createClient('https://ubassnbaqsblpmqtzjga.supabase.co','sb_publishable_-BVwT30vV-Qa5wsNj5GVfg__pxF3fp7');
export const statuses = {pending:'Ожидает подтверждения',confirmed:'Подтверждён',shipped:'Отправлен',delivered:'Доставлен',cancelled:'Отменён'};
export const categories = Object.fromEntries(Object.entries(collections).map(([key,value])=>[key,value.name]));
export const money = value => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:2}).format(value/100);
export const escape = value => String(value??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const when = value => new Date(value).toLocaleString('ru-RU');
export function safeImage(value) {
 try { const url=new URL(value,location.origin); return url.protocol==='https:'||url.origin===location.origin?url.href:''; } catch { return ''; }
}
export function assertResult(result) { if(result.error) throw result.error; return result.data; }
export async function currentUser() { const {data,error}=await db.auth.getUser(); if(error) return null; return data.user; }
export async function isAdmin() { return assertResult(await db.rpc('store_is_admin')); }
export function errorMessage(error) {
 const text=error?.message||'';
 if(/Price changed/i.test(text)) return 'Цена изменилась. Обнови страницу и проверь сумму перед оформлением.';
 if(/Product unavailable|Unsupported phone model/i.test(text)) return 'Чехол или выбранная модель сейчас недоступны. Обнови страницу.';
 if(/Invalid login credentials/i.test(text)) return 'Проверь почту и пароль.';
 if(/Email not confirmed/i.test(text)) return 'Подтверди почту по ссылке из письма.';
 if(/rate limit|too many/i.test(text)) return 'Слишком много попыток. Попробуй немного позже.';
 if(/provider is not enabled|Unsupported provider/i.test(text)) return 'Вход через Google готовится. Войди по почте и паролю.';
 if(/email.*(sending|delivery)|Error sending confirmation/i.test(text)) return 'Письмо пока не удалось отправить. Обратись в поддержку @luka_sol.';
 return 'Не удалось выполнить действие. Попробуй ещё раз.';
}
