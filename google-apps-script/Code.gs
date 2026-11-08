const SPREADSHEET_ID = "1Qk5Svjxv-1O2FC2e24zcxnXebKVme0KN6P0DRTgbDmo";
function doPost(e) {
 const lock = LockService.getScriptLock();
 try {
  const d = JSON.parse(e.postData.contents);
  if (!d.orderId || !d.product || !d.customerName || !d.contact || !d.phoneModel || !d.city || !d.address || d.consent !== true) throw Error("Required fields");
  const clean = v => { const s = String(v || "").slice(0,1000); return /^[=+@-]/.test(s) ? "'" + s : s; };
  lock.waitLock(20000);
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Заявки");
  const n = sheet.getLastRow();
  const exists = n > 1 && sheet.getRange(2,2,n-1,1).createTextFinder(String(d.orderId)).matchEntireCell(true).findNext();
  if (!exists) sheet.appendRow([new Date(),clean(d.orderId),clean(d.product),clean(d.collection),clean(d.phoneModel),clean(d.customerName),clean(d.contact),clean(d.city),clean(d.address),clean(d.postcode),1290,clean(d.comment),"Новая заявка","Сайт FORMÉ",clean(d.contactChannel),"Да"]);
  return json({ok:true,orderId:d.orderId});
 } catch(err) { return json({ok:false,error:"Не удалось сохранить заявку"}); }
 finally { if(lock.hasLock()) lock.releaseLock(); }
}
function json(d) { return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return json({ok:true,service:"FORMÉ orders"}); }
