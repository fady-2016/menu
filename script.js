const CONFIG = window.HANAA_CONFIG || {};
const CASHIER_WHATSAPP = CONFIG.CASHIER_WHATSAPP || "201114642261";
const demoProducts = [
 {id:1,name:"كفتة مشوية",category:"المشويات",price:400,unit:"كجم",weighted:true,image:"images/kofta.svg",active:true},
 {id:2,name:"طرب",category:"المشويات",price:650,unit:"كجم",weighted:true,image:"images/tarb.svg",active:true},
 {id:3,name:"سجق مشوي",category:"المشويات",price:380,unit:"كجم",weighted:true,image:"images/sausage.svg",active:true},
 {id:4,name:"فتة كوارع",category:"الفتة",price:220,unit:"طبق",weighted:false,image:"images/fatta.svg",active:true},
 {id:5,name:"رغيف حواوشي",category:"السندوتشات",price:90,unit:"رغيف",weighted:false,image:"images/hawawshi.svg",active:true},
 {id:6,name:"طاجن لحمة",category:"الطواجن",price:260,unit:"طاجن",weighted:false,image:"images/fatta.svg",active:true},
 {id:7,name:"سلطة خضراء",category:"السلطات",price:40,unit:"طبق",weighted:false,image:"images/salad.svg",active:true}
];
let productsData=[], selectedCategory="الكل", cart=[];
const $=id=>document.getElementById(id);
const money=n=>Number(n).toLocaleString("ar-EG",{maximumFractionDigits:2})+" ج.م";
function bool(v){return v===true||String(v).toUpperCase()==="TRUE"||String(v)==="1";}
function normalize(row){return {id:Number(row.id),name:String(row.name||""),category:String(row.category||"أخرى"),price:Number(row.price)||0,unit:String(row.unit||"قطعة"),weighted:bool(row.weighted),image:String(row.image||"images/kofta.svg"),active:row.active===undefined?true:bool(row.active)};}
function parseCSV(text){
 const rows=[];let row=[],cell="",quoted=false;
 for(let i=0;i<text.length;i++){const ch=text[i];
   if(ch==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}
   else if(ch==='"'){quoted=!quoted;}
   else if(ch===','&&!quoted){row.push(cell);cell="";}
   else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()!==""))rows.push(row);row=[];cell="";}
   else cell+=ch;
 }
 if(cell!==""||row.length){row.push(cell);if(row.some(v=>v.trim()!==""))rows.push(row);}
 if(rows.length<2)throw Error("ملف CSV فارغ أو لا يحتوي على أصناف");
 const headers=rows.shift().map(h=>h.replace(/^\uFEFF/,"").trim().toLowerCase());
 return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,(values[i]||"").trim()])));
}
async function loadProducts(){
 const status=$("status");
 if(CONFIG.SHEETS_API_URL){
   try{
     const r=await fetch(CONFIG.SHEETS_API_URL,{cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);
     const body=await r.text();let data;
     try{data=JSON.parse(body);if(!Array.isArray(data))throw Error("JSON is not an array");}
     catch(_){data=parseCSV(body);}
     productsData=data.map(normalize).filter(p=>p.active&&p.name);
     if(!productsData.length)throw Error("لم يتم العثور على أصناف نشطة؛ تحقق من أسماء الأعمدة active وname.");
     status.textContent="تم تحميل الأسعار والأصناف من Google Sheets.";
   }
   catch(e){console.error(e);productsData=demoProducts.map(normalize);status.textContent="تعذر قراءة CSV المنشور؛ يتم عرض بيانات تجريبية. تأكد من نشر الجدول للعامة ومن أسماء الأعمدة.";}
 }else{productsData=demoProducts.map(normalize);status.textContent="وضع تجريبي: أضف رابط Google Sheets في config.js لتفعيل البيانات المشتركة.";}
 renderCategories();renderProducts();renderCart();
}
function renderCategories(){const cats=["الكل",...new Set(productsData.map(p=>p.category))];$("categories").innerHTML=cats.map(c=>`<button class="category-btn ${c===selectedCategory?"active":""}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");$("categories").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{selectedCategory=b.dataset.category;renderCategories();renderProducts();}));}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderProducts(){const q=$("search").value.trim().toLocaleLowerCase("ar");const list=productsData.filter(p=>(selectedCategory==="الكل"||p.category===selectedCategory)&&p.name.toLocaleLowerCase("ar").includes(q));if(!list.length){$("products").innerHTML="<p>لا توجد أصناف مطابقة.</p>";return;}
 $("products").innerHTML=list.map(p=>`<article class="product-card"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'"><div class="product-info"><h3>${escapeHtml(p.name)}</h3><p class="muted-text">${escapeHtml(p.category)}</p><div class="price">${money(p.price)} <span class="unit">/ ${escapeHtml(p.unit)}</span></div><label for="qty-${p.id}">الكمية</label><select class="field quantity-select" id="qty-${p.id}">${p.weighted?'<option value="0.5">نصف كيلو</option><option value="1" selected>1 كيلو</option><option value="1.5">1.5 كيلو</option><option value="2">2 كيلو</option>':'<option value="1">1 '+escapeHtml(p.unit)+'</option><option value="2">2 '+escapeHtml(p.unit)+'</option><option value="3">3 '+escapeHtml(p.unit)+'</option><option value="4">4 '+escapeHtml(p.unit)+'</option>'}</select><button class="add-btn" data-id="${p.id}">أضف إلى السلة</button></div></article>`).join("");
 $("products").querySelectorAll(".add-btn").forEach(b=>b.addEventListener("click",()=>{const p=productsData.find(x=>x.id===Number(b.dataset.id));const quantity=Number($("qty-"+p.id).value);const found=cart.find(x=>x.id===p.id&&x.quantity===quantity);if(found)found.count++;else cart.push({id:p.id,name:p.name,price:p.price,unit:p.unit,quantity,count:1});renderCart();}));}
function renderCart(){const el=$("cart-items");if(!cart.length)el.innerHTML='<p class="muted">السلة فارغة حاليًا.</p>';else el.innerHTML=cart.map((it,i)=>`<div class="cart-line"><div><strong>${escapeHtml(it.name)}</strong><br><small>الكمية: ${it.quantity} ${escapeHtml(it.unit)} × ${it.count}</small><br><small>سعر الوحدة: ${money(it.price)}</small><br><strong>الإجمالي: ${money(it.price*it.quantity*it.count)}</strong></div><button type="button" data-remove="${i}">حذف</button></div>`).join("");el.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{cart.splice(Number(b.dataset.remove),1);renderCart();}));$("cart-total").textContent=money(cart.reduce((s,x)=>s+x.price*x.quantity*x.count,0));}
$("search").addEventListener("input",renderProducts);
function toggleFields(){const delivery=$("order-type").value==="توصيل";$("delivery-fields").hidden=!delivery;$("table-field").hidden=delivery;}
$("order-type").addEventListener("change",toggleFields);toggleFields();
$("order-form").addEventListener("submit",e=>{e.preventDefault();if(!cart.length){alert("أضف صنفًا إلى السلة أولًا.");return;}const type=$("order-type").value,name=$("customer-name").value.trim(),address=$("customer-address").value.trim(),table=$("table-number").value.trim(),notes=$("notes").value.trim();if(type==="توصيل"&&(!name||!address)){alert("أدخل اسم العميل والعنوان.");return;}if(type!=="توصيل"&&!table){alert("أدخل رقم الطاولة.");return;}let msg="*طلب جديد - مطعم هناء*\nنوع الطلب: "+type+"\n";msg+=type==="توصيل"?`اسم العميل: ${name}\nالعنوان: ${address}\n`:`رقم الطاولة: ${table}\n`;msg+="\n*تفاصيل الفاتورة*\n";cart.forEach((x,i)=>{msg+=`${i+1}. ${x.name}\nالكمية: ${x.quantity} ${x.unit} × ${x.count}\nسعر الوحدة: ${money(x.price)}\nإجمالي الصنف: ${money(x.price*x.quantity*x.count)}\n\n`;});msg+=`*الإجمالي: ${money(cart.reduce((s,x)=>s+x.price*x.quantity*x.count,0))}*\n`;if(notes)msg+="ملاحظات: "+notes+"\n";window.open(`https://wa.me/${CASHIER_WHATSAPP}?text=${encodeURIComponent(msg)}`,"_blank","noopener");});
loadProducts();
