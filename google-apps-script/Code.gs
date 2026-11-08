const SPREADSHEET_ID = "1Qk5Svjxv-1O2FC2e24zcxnXebKVme0KN6P0DRTgbDmo";
const SHEET_NAME = "Заявки";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    sheet.appendRow([
      new Date(),
      data.orderId || "",
      data.product || "",
      data.collection || "",
      data.phoneModel || "",
      data.customerName || "",
      data.contact || "",
      data.comment || "",
      "Новая",
      data.source || "FORME website"
    ]);
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON);
  }
}
function doGet() {
  return ContentService.createTextOutput("FORMÉ order endpoint is live.");
}
