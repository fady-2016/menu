/* Google Apps Script: واجهة قراءة عامة فقط.
 * أنشئ Google Sheet بورقة Products والأعمدة التالية بالترتيب:
 * id,name,category,price,unit,weighted,image,active
 * اربط هذا المشروع بجدول البيانات عبر Extensions > Apps Script.
 */
const SHEET_NAME = "Products";
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return json_({error: 'Missing sheet: Products'});
  const rows = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return json_([]);
  const headers = rows.shift().map(h => h.trim());
  const products = rows.filter(r => r[0] !== "").map(r => {
    const item = {};
    headers.forEach((h, i) => item[h] = r[i]);
    item.id = Number(item.id);
    item.price = Number(String(item.price).replace(/,/g, "")) || 0;
    item.weighted = String(item.weighted).toUpperCase() === "TRUE";
    item.active = String(item.active).toUpperCase() === "TRUE";
    return item;
  }).filter(p => p.active);
  return json_(products);
}
function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
