/* Shared by every page: cart, product details, checkout. Edit prices in shipping.js and products in products.js. */
document.body.insertAdjacentHTML("beforeend", `
<dialog id="qv" aria-labelledby="qvName">
  <button class="x" id="qvClose" aria-label="Close details">&times;</button>
  <div class="qvg">
    <div class="qvt" id="qvThumbs"></div>
    <img id="qvImg" alt="">
    <div class="qvb">
      <p class="kind" id="qvKind"></p>
      <h2 id="qvName"></h2>
      <p class="tag" id="qvTag"></p>
      <ul id="qvFeat"></ul>
      <p class="price" id="qvPrice"></p>
      <details class="spec"><summary>Specifications</summary><dl id="qvSpec"></dl></details>
      <div id="qvOpts"></div>
      <div class="buy">
        <div class="qty"><button id="qvMinus" aria-label="Fewer">&minus;</button><span id="qvQty" aria-live="polite">1</span><button id="qvPlus" aria-label="More">+</button></div>
        <button class="btn" id="qvAdd">Add to cart</button>
      </div>
      <p class="note" id="qvMsg" role="status" style="margin:4px 0 0"></p>
    </div>
  </div>
</dialog>

<!-- cart and checkout -->
<dialog id="drawer" aria-label="Cart">
  <div class="dh"><h3 id="dTitle">Cart</h3><button class="x" id="dClose" aria-label="Close cart">&times;</button></div>
  <div class="db" id="dBody"></div>
  <div class="df" id="dFoot"></div>
</dialog>
`);
document.head.insertAdjacentHTML("beforeend", `<style>
#qv .qvg{position:relative}
#qv .qvt{position:absolute;top:14px;left:14px;z-index:2;display:flex;flex-direction:column;gap:6px}
#qv .qvt:empty{display:none}
#qv .qvt button{width:42px;height:56px;padding:0;border:2px solid rgba(255,255,255,.55);border-radius:8px;overflow:hidden;background:#fff;cursor:pointer;opacity:.85}
#qv .qvt button[aria-current="true"]{border-color:#d4af6a;opacity:1}
#qv .qvt img{width:100%;height:100%;min-height:0;aspect-ratio:auto;object-fit:cover;display:block;border-radius:0}
</style>`);
/* payEndpoint, web3formsKey and domain are set in config.js - edit them there, not here. */
const SITE = Object.assign({web3formsKey:"", payEndpoint:"", domain:"admiraltybrassco.com", payAddons:false, confirmEndpoint:""}, window.SITE || {});
const mail = n => n + "@" + SITE.domain;
const $ = s => document.querySelector(s);
const money = n => "$" + n + " CAD";
/* ---------- delivery fee calculator ----------
   DO NOT edit the numbers below to change prices. This block is only a
   fallback used if shipping.js fails to load. The real, editable prices
   live in shipping.js (window.SHIPPING) - edit that file instead, so
   there is only one place your delivery fees are set. */
const SHIP_DEFAULT = {
  /* Weight-based extra: each whole kg above includedKg adds extraPerKg.
     Products can set weightKg and dims:{l,w,h} (cm) in products.js.
     The zone fee covers the first 2 kg (one typical piece). No weightKg set = defaultKg (1 kg).
     Bigger than maxKg or maxSideCm (or invoiceOnly:true) = no automatic fee, invoice + quote instead. */
  weight: {includedKg:2, extraPerKg:3, defaultKg:1, maxKg:30, maxSideCm:120, volDivisor:5000},
  bulkAt: 5,
  zones: {
    GTA:   {name:"Toronto, Mississauga and Hamilton area", fee:21},
    ON:    {name:"Rest of Ontario", fee:28},
    QC:    {name:"Quebec", fee:25},
    PRA:   {name:"Manitoba, Saskatchewan, Alberta", fee:33},
    BC:    {name:"British Columbia", fee:34},
    ATL:   {name:"Atlantic Canada (NB, NS, PE, NL)", fee:33},
    NORTH: {name:"Yukon, Northwest Territories, Nunavut", fee:45},
    US:    {name:"United States", fee:28}
  },
  postal: {A:"ATL",B:"ATL",C:"ATL",E:"ATL",G:"QC",H:"QC",J:"QC",K:"ON",L:"GTA",M:"GTA",N:"ON",P:"ON",R:"PRA",S:"PRA",T:"PRA",V:"BC",X:"NORTH",Y:"NORTH"}
};
const SHIP = Object.assign({}, SHIP_DEFAULT, window.SHIPPING || {});
SHIP.weight = Object.assign({}, SHIP_DEFAULT.weight, SHIP.weight || {});
const HST = typeof SHIP.hstPercent === "number" ? SHIP.hstPercent : 13;
const LEAD_DAYS = SHIP.leadDays || 15;
function shipQuote(country, postal, pieces){
  let z = null, err = "";
  if(country === "Canada"){
    const p = postal.trim().toUpperCase();
    if(!p) err = "Enter your postal code to see your delivery fee.";
    else if(!/^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/.test(p) || !SHIP.postal[p[0]]) err = "Enter a valid Canadian postal code, like M5V 2T6.";
    else z = SHIP.postal[p[0]];
  } else if(country === "United States"){
    if(!/^\d{5}(-\d{4})?$/.test(postal.trim())) err = "Enter your 5-digit ZIP code to see your delivery fee.";
    else z = "US";
  } else err = "We currently ship to Canada and the United States only.";
  if(!z) return {err};
  const zone = SHIP.zones[z], info = cartShipInfo();
  if(info.manual) return {zone: zone.name, manual: true, fee: 0};
  return {zone: zone.name, fee: zone.fee + SHIP.weight.extraPerKg * Math.max(0, Math.ceil(info.kg) - SHIP.weight.includedKg)};
}
function cartShipInfo(){
  const W = SHIP.weight; let actual = 0, vol = 0, manual = false;
  CART.forEach(c => {
    const p = bySku(c.sku); if(!p) return;
    const kg = typeof p.weightKg === "number" ? p.weightKg : W.defaultKg;
    actual += kg * c.qty;
    if(p.dims){ vol += p.dims.l * p.dims.w * p.dims.h / W.volDivisor * c.qty; if(Math.max(p.dims.l, p.dims.w, p.dims.h) > W.maxSideCm) manual = true; }
    if(kg > W.maxKg || p.invoiceOnly) manual = true;
  });
  return {kg: Math.max(actual, vol), manual};
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- catalogue ---------- */
const PRODUCTS = window.PRODUCTS || [];
const bySku = s => PRODUCTS.find(p => p.sku === s);
/* Stock: every piece is one-of-a-kind. Add stock:0 to a product in products.js when it sells.
   Products with no stock value count as 1 in stock. */
const stockOf = p => typeof p.stock === "number" ? p.stock : 1;
const soldOut = p => stockOf(p) < 1;
let cartMsg = "";
const outMsg = p => `Out of stock: we only have ${stockOf(p)} of ${esc(p.name)}. Need more? <a href="mailto:sales@admiraltybrassco.com">Contact sales</a> for a bulk order.`;

/* ---------- cart state ---------- */
let CART = [];
try{ CART = JSON.parse(localStorage.getItem("ab_cart") || "[]").filter(c => bySku(c.sku) && Number.isInteger(c.qty) && c.qty > 0).map(c => ({sku:c.sku, qty:Math.min(c.qty, stockOf(bySku(c.sku))), engrave:!!c.engrave, engText:String(c.engText||"").slice(0,40), gift:!!c.gift})).filter(c => c.qty > 0); }catch(e){ CART = []; }
const save = () => { try{ localStorage.setItem("ab_cart", JSON.stringify(CART)); }catch(e){} };
const count = () => CART.reduce((a,c) => a + c.qty, 0);
const ADDON = Object.assign({engrave:5, gift:5, wrap:6}, SHIP.addons || {});
const merch = () => CART.reduce((a,c) => a + bySku(c.sku).price * c.qty, 0);
const engTot = () => CART.reduce((a,c) => a + (c.engrave ? ADDON.engrave * c.qty : 0), 0);
const giftTot = () => CART.reduce((a,c) => a + (c.gift ? ADDON.gift * c.qty : 0), 0);
const extras = () => engTot() + giftTot();
const extrasOf = c => (c.engrave ? ADDON.engrave : 0) * c.qty + (c.gift ? ADDON.gift : 0) * c.qty;
const subtotal = () => merch() + extras();
const sumRows = () => { const r = (a,v) => `<div class="sumrow" style="font-weight:400;font-size:15px"><span>${a}</span><span>${v}</span></div>`; return (extras() ? r("Items", money(merch())) + (engTot() ? r("Wood engraving", money(engTot())) : "") + (giftTot() ? r("Premium gift packing", money(giftTot())) : "") : "") + r("Subtotal", money(subtotal())); };
const optsHTML = (o, k) => `<div class="opts">
  <label class="orow"><input type="checkbox" data-o="engrave" data-k="${k}" ${o.engrave ? "checked" : ""}><span><b>+$5</b> Engraving on wood<small>Custom text on a wooden plate, per piece</small></span></label>
  ${o.engrave ? `<input class="engtxt" data-o="engText" data-k="${k}" maxlength="40" aria-label="Text to engrave" placeholder="Text to engrave (max 40 characters)" value="${esc(o.engText || "")}">` : ""}
  <label class="orow"><input type="checkbox" data-o="gift" data-k="${k}" ${o.gift ? "checked" : ""}><span><b>+$5</b> Premium gift packing<small>Presentation box, per piece</small></span></label>
</div>`;
function setOpt(k, key, val, quiet){
  if(k === "qv"){ QVO[key] = val; if(!quiet) renderQvOpts(); return; }
  const c = CART.find(x => x.sku === k); if(!c) return;
  c[key] = val; save(); if(!quiet) viewCart();
}
document.addEventListener("change", e => { const t = e.target, o = t.dataset && t.dataset.o; if(o === "engrave" || o === "gift") setOpt(t.dataset.k, o, t.checked); });
document.addEventListener("input", e => { const t = e.target; if(t.dataset && t.dataset.o === "engText") setOpt(t.dataset.k, "engText", t.value, true); });
function refreshBadge(){ const n = count(), el = $("#cartCount"); el.textContent = n; el.classList.toggle("on", n > 0); $("#cartOpen").setAttribute("aria-label", "Open cart, " + n + " item" + (n===1?"":"s")); }
function addToCart(sku, q, o){
  const p = bySku(sku), it = CART.find(c => c.sku === sku), want = (it ? it.qty : 0) + q;
  if(want > stockOf(p)){ cartMsg = outMsg(p); return false; }
  if(it){ it.qty = want; if(o) Object.assign(it, o); } else CART.push(Object.assign({sku, qty:q}, o || {}));
  save(); refreshBadge(); return true;
}

/* ---------- page render ---------- */
/* hero photos */
if($("#lineup")){
  $("#lineup").innerHTML = (window.HERO_IMAGES || []).slice(0,3).map(h => `<img src="${esc(h.src)}" alt="${esc(h.alt||"")}">`).join("");
  if(!(window.HERO_IMAGES||[]).length) $("#lineup").remove();
}

/* featured product */
const feat = bySku(window.FEATURED_SKU || "");
if(feat && $("#flagship")){
  $("#flagship").hidden = false;
  $("#flHead").textContent = feat.headline || feat.name;
  $("#flTag").textContent = feat.desc || feat.tag;
  $("#flPrice").textContent = money(feat.price);
  $("#flagImg").src = feat.img; $("#flagImg").alt = feat.alt;
  if(soldOut(feat)){ $("#flAdd").disabled = true; $("#flAdd").textContent = "Sold out"; }
  $("#flAdd").onclick = () => { addToCart(feat.sku, 1); openDrawer("cart"); };
  $("#flOpen").onclick = () => openQV(feat.sku);
}

/* categories are built from the products themselves */
const KINDS = [...new Set(PRODUCTS.map(p => p.kind))];
const kindLabel = k => (window.CATEGORY_LABELS && window.CATEGORY_LABELS[k]) || (k + "s");
if($("#collLede")) $("#collLede").textContent = PRODUCTS.length + (PRODUCTS.length === 1 ? " piece" : " pieces") + ", each handcrafted in brass.";
if($("#seg")) $("#seg").innerHTML = ["All", ...KINDS].map((k,i) => `<button data-f="${esc(k)}" aria-pressed="${i===0}">${esc(k==="All" ? "All" : kindLabel(k))}</button>`).join("");
if($("#seg") && KINDS.length < 2) $("#seg").parentElement.hidden = true;
$("#footShop").innerHTML = KINDS.map(k => `<li><a href="shop.html?cat=${encodeURIComponent(k)}">${esc(kindLabel(k))}</a></li>`).join("");

function renderGrid(f){
  const list = PRODUCTS.filter(p => f === "All" || p.kind === f);
  $("#grid").innerHTML = list.map(p => `
    <article class="tile${soldOut(p) ? " sold" : ""}">
      <button class="pic" data-open="${p.sku}" aria-label="View details for ${esc(p.name)}"><img src="${esc(p.img)}" alt="${esc(p.alt)}" loading="lazy"></button>
      <div class="body">
        <p class="kind">${esc(p.kind)}</p>
        <h3>${esc(p.name)}</h3>
        <p class="tag">${esc(p.tag)}</p>
        <p class="price">${money(p.price)}</p>
        ${soldOut(p) ? '<p class="avail out">Sold out</p>' : stockOf(p) <= 3 ? '<p class="avail">Only ' + stockOf(p) + ' available</p>' : ''}
        <div class="row">${soldOut(p) ? '<button class="btn sm" disabled>Out of stock</button>' : '<button class="btn sm" data-add="' + p.sku + '">Add to cart</button>'}<button class="link sm" data-open="${p.sku}">Details</button></div>
      </div>
    </article>`).join("");
}
function setFilter(f){
  document.querySelectorAll("#seg button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.f === f)));
  renderGrid(f);
}
if($("#grid")){ const want = new URLSearchParams(location.search).get("cat"); setFilter(KINDS.includes(want) ? want : "All"); }
if($("#seg")) $("#seg").addEventListener("click", e => { const b = e.target.closest("button[data-f]"); if(b) setFilter(b.dataset.f); });
document.querySelectorAll("[data-jump]").forEach(a => a.addEventListener("click", () => setFilter(a.dataset.jump)));

document.addEventListener("click", e => {
  const o = e.target.closest("[data-open]"); if(o){ openQV(o.dataset.open); return; }
  const a = e.target.closest("[data-add]"); if(a){ addToCart(a.dataset.add, 1); openDrawer("cart"); }
});

/* ---------- details dialog ---------- */
const qv = $("#qv"); let qvP = null, qvN = 1, QVO = {};
const renderQvOpts = () => { $("#qvOpts").innerHTML = optsHTML(QVO, "qv"); };
function openQV(sku){
  qvP = bySku(sku); qvN = 1; QVO = {engrave:false, engText:"", gift:false}; renderQvOpts();
  $("#qvImg").src = qvP.img; $("#qvImg").alt = qvP.alt;
  const fitPic = main => { const im = $("#qvImg"); im.style.objectFit = main ? "" : "contain"; im.style.background = main ? "" : "#fff"; }; fitPic(true);
  const pics = [qvP.img].concat(qvP.imgs || []);
  $("#qvThumbs").innerHTML = pics.length < 2 ? "" : pics.map((src, i) => `<button type="button" data-src="${esc(src)}" aria-label="Photo ${i + 1} of ${pics.length}" ${i === 0 ? 'aria-current="true"' : ""}><img src="${esc(src)}" alt=""></button>`).join("");
  $("#qvThumbs").onclick = e => { const b = e.target.closest("button"); if(!b) return; $("#qvImg").src = b.dataset.src; fitPic(b.dataset.src === qvP.img); $("#qvThumbs").querySelectorAll("button").forEach(x => x.removeAttribute("aria-current")); b.setAttribute("aria-current", "true"); };
  $("#qvKind").textContent = qvP.kind; $("#qvName").textContent = qvP.name; $("#qvTag").textContent = qvP.tag;
  $("#qvFeat").innerHTML = qvP.features.map(f => "<li>" + esc(f) + "</li>").join("");
  $("#qvPrice").textContent = money(qvP.price); $("#qvQty").textContent = 1;
  $("#qvSpec").innerHTML = [["Finish",qvP.finish],["Material",qvP.material||"Solid brass"],["Base",qvP.base],["Size (L x W x H)",qvP.dims ? qvP.dims.l + " x " + qvP.dims.w + " x " + qvP.dims.h + " cm" : ""],["Ideal for",qvP.ideal],["Item number",qvP.sku]]
    .filter(r => r[1])
    .map(r => `<div><dt>${r[0]}</dt><dd>${esc(r[1])}</dd></div>`).join("");
  qv.querySelector("details").open = false;
  $("#qvMsg").innerHTML = "";
  const out = soldOut(qvP);
  $("#qvAdd").disabled = out; $("#qvAdd").textContent = out ? "Sold out" : "Add to cart";
  $("#qvMinus").disabled = $("#qvPlus").disabled = out;
  qv.showModal();
}
$("#qvClose").onclick = () => qv.close();
qv.addEventListener("click", e => { if(e.target === qv) qv.close(); });
$("#qvMinus").onclick = () => { if(qvN > 1){ qvN--; $("#qvQty").textContent = qvN; } };
$("#qvPlus").onclick = () => { if(qvN >= stockOf(qvP)){ $("#qvMsg").innerHTML = outMsg(qvP); return; } if(qvN < 20){ qvN++; $("#qvQty").textContent = qvN; } };
$("#qvAdd").onclick = () => { if(QVO.engrave && !QVO.engText.trim()){ $("#qvMsg").textContent = "Enter the text for your wood engraving, or untick it."; return; } addToCart(qvP.sku, qvN, Object.assign({}, QVO)); qv.close(); openDrawer("cart"); };

/* ---------- drawer ---------- */
const drawer = $("#drawer"), dBody = $("#dBody"), dFoot = $("#dFoot"), dTitle = $("#dTitle");
let lastOrder = null;
function openDrawer(view){ if(!drawer.open) drawer.showModal(); ({cart:viewCart, checkout:viewCheckout})[view](); }
$("#cartOpen").onclick = () => openDrawer("cart");
$("#dClose").onclick = () => drawer.close();
drawer.addEventListener("click", e => { if(e.target === drawer) drawer.close(); });

function viewCart(){
  drawer.classList.remove("wide");
  dTitle.textContent = "Cart";
  if(!CART.length){
    dBody.innerHTML = `<p class="empty">Your cart is empty.</p>`;
    dFoot.innerHTML = `<button class="btn block" id="keep">Browse the collection</button>`;
    $("#keep").onclick = () => { if($("#grid")){ drawer.close(); $("#grid").scrollIntoView({behavior:"smooth"}); } else location.href = "shop.html"; };
    return;
  }
  const msg = cartMsg ? `<div class="status bad stockmsg">${cartMsg}</div>` : ""; cartMsg = "";
  dBody.innerHTML = msg + CART.map(c => { const p = bySku(c.sku); return `
    <div class="line">
      <img src="${esc(p.img)}" alt="">
      <div>
        <div class="nm">${esc(p.name)}</div><div class="sub">${esc(p.kind)}, ${money(p.price)} each</div>
        <div class="qty"><button data-q="${c.sku}" data-d="-1" aria-label="Fewer ${esc(p.name)}">&minus;</button><span>${c.qty}</span><button data-q="${c.sku}" data-d="1" aria-label="More ${esc(p.name)}">+</button></div>
        <button class="rm" data-rm="${c.sku}">Remove</button>
      </div>
      <div class="nm">${money(p.price * c.qty + extrasOf(c))}</div>${optsHTML(c, c.sku)}
    </div>`; }).join("");
  dFoot.innerHTML = `${sumRows()}
    <p class="note" style="margin:0">Your delivery fee is calculated automatically at checkout from your address and the weight and size of your order. ${HST}% HST is added at checkout. You won't be charged until you pay.</p>
    ${cartShipInfo().manual ? '<p class="note" style="margin:0"><strong>Large or heavy item:</strong> delivery for this order is quoted individually. At checkout, send an order request and we will email you an invoice.</p>' : ''}
    ${count() >= SHIP.bulkAt ? '<p class="note" style="margin:0">Ordering several pieces? <a href="mailto:sales@admiraltybrassco.com">Contact sales</a> for bulk arrangements.</p>' : ''}
    <button class="btn block" id="toCheckout">Check out</button>`;
  $("#toCheckout").onclick = () => viewCheckout();
}
dBody.addEventListener("click", e => {
  const q = e.target.closest("[data-q]"), r = e.target.closest("[data-rm]");
  if(q){ const it = CART.find(c => c.sku === q.dataset.q); if(it.qty + Number(q.dataset.d) > stockOf(bySku(it.sku))){ cartMsg = outMsg(bySku(it.sku)); viewCart(); return; } it.qty += Number(q.dataset.d); if(it.qty < 1) CART = CART.filter(c => c !== it); if(it && it.qty > 20) it.qty = 20; save(); refreshBadge(); viewCart(); }
  if(r){ CART = CART.filter(c => c.sku !== r.dataset.rm); save(); refreshBadge(); viewCart(); }
});

function viewCheckout(){
  if(!CART.length){ viewCart(); return; }
  dTitle.textContent = "Checkout"; drawer.classList.add("wide");
  dBody.innerHTML = `<button class="back" id="back">&lsaquo; Back to cart</button>
  <form class="formstack" id="ship" novalidate>
    <h4 class="step"><span>1</span>Shipping address</h4>
    <div class="field"><label for="fName">Full name</label><input id="fName" autocomplete="name" required><div class="err" id="eName"></div></div>
    <div class="field"><label for="fEmail">Email</label><input id="fEmail" type="email" autocomplete="email" required><div class="err" id="eEmail"></div></div>
    <div class="field"><label for="fPhone">Phone (optional)</label><input id="fPhone" type="tel" autocomplete="tel"></div>
    <div class="field"><label for="fAddr">Street address</label><input id="fAddr" autocomplete="street-address" required><div class="err" id="eAddr"></div></div>
    <div class="two">
      <div class="field"><label for="fCity">City</label><input id="fCity" autocomplete="address-level2" required><div class="err" id="eCity"></div></div>
      <div class="field"><label for="fProv">Province or state</label><input id="fProv" autocomplete="address-level1"></div>
    </div>
    <div class="two">
      <div class="field"><label for="fPost">Postal or ZIP code</label><input id="fPost" autocomplete="postal-code" required><div class="err" id="ePost"></div></div>
      <div class="field"><label for="fCountry">Country</label><select id="fCountry" autocomplete="country-name"><option value="Canada">Canada</option><option value="United States">United States</option></select></div>
    </div>
    <h4 class="step"><span>2</span>Billing address</h4>
    <label class="same"><input type="checkbox" id="fSame" checked> Billing address is the same as shipping</label>
    <div id="billBox" class="formstack" hidden>
      <div class="field"><label for="bName">Name on card</label><input id="bName" autocomplete="cc-name"><div class="err" id="eBName"></div></div>
      <div class="field"><label for="bAddr">Billing street address</label><input id="bAddr" autocomplete="billing street-address"><div class="err" id="eBAddr"></div></div>
      <div class="two">
        <div class="field"><label for="bCity">City</label><input id="bCity" autocomplete="billing address-level2"><div class="err" id="eBCity"></div></div>
        <div class="field"><label for="bProv">Province or state</label><input id="bProv" autocomplete="billing address-level1"></div>
      </div>
      <div class="two">
        <div class="field"><label for="bPost">Postal or ZIP code</label><input id="bPost" autocomplete="billing postal-code"><div class="err" id="eBPost"></div></div>
        <div class="field"><label for="bCountry">Country</label><select id="bCountry"><option value="Canada">Canada</option><option value="United States">United States</option></select></div>
      </div>
    </div>
    <h4 class="step"><span>3</span>Order details</h4>
    <div class="field"><label for="fNote">Notes (optional)</label><textarea id="fNote" style="min-height:80px"></textarea></div>
    <div class="field"><label for="fOcc">This order is for</label><select id="fOcc"><option>Personal use</option><option>Gift</option><option>Corporate</option></select></div>
    <div class="field" id="occBox" hidden><label for="fOccTxt" id="occLbl"></label><input id="fOccTxt" maxlength="200"></div>
    <div id="giftBox" hidden style="display:grid;gap:10px">
      <label class="same"><input type="checkbox" id="gWrap"> Gift wrap this order <span class="note" style="margin-left:4px">(+${ADDON.wrap} per order)</span></label>
      <label class="same"><input type="checkbox" id="gHide"> Hide prices on the packing slip</label>
    </div>
    <h4 class="step"><span>4</span>Payment</h4>
    <div class="paybox"><b>Credit or debit card.</b> You enter your card details on Stripe's secure payment page, never on our site. We email your invoice and receipt to the address above once payment goes through.</div>
    <div class="hp" aria-hidden="true"><label>Leave this empty<input id="fBot" tabindex="-1" autocomplete="off"></label></div>
    <div id="fStatus" role="status"></div>
  </form>`;
  dFoot.innerHTML = `<div class="osum"><strong>Order summary</strong>${CART.map(c => { const p = bySku(c.sku); return `<div class="oi"><span>${c.qty} &times; ${esc(p.name)}</span><span>${money(p.price * c.qty + extrasOf(c))}</span></div>`; }).join("")}${sumRows()}
    <div class="sumrow" id="wrapRow" hidden><span>Gift wrap</span><span id="wrapAmt"></span></div>
    <div class="sumrow"><span>Delivery</span><span id="shipAmt">Enter postal code</span></div>
    <div class="sumrow"><span id="taxLbl">HST (${HST}%)</span><span id="taxAmt">-</span></div>
    <div class="sumrow" style="font-weight:600"><span>Order total</span><span id="totAmt">${money(subtotal())}</span></div></div>
    <p class="note" style="margin:0" id="payNote">Pay by card now. If you prefer an invoice, send an order request and our team will check it and email you the invoice. No payment is taken until you pay.</p>
    <button class="btn block" id="pay" hidden>Place your order and pay</button>
    <button class="btn ghost block" id="send">Email me an invoice instead</button>`;
  const PAYNOTE = $("#payNote").textContent;
  const refreshShip = () => {
    const q = shipQuote($("#fCountry").value, $("#fPost").value, count());
    $("#shipAmt").textContent = q.err ? "Enter postal code" : q.manual ? "Quoted on invoice" : money(q.fee);
    const wrapOn = $("#fOcc").value === "Gift" && $("#gWrap").checked, wrap = wrapOn ? ADDON.wrap : 0;
    $("#wrapRow").hidden = !wrapOn; $("#wrapAmt").textContent = money(wrap);
    const fee = q.err ? 0 : q.fee, base = subtotal() + fee + wrap;
    const tax = $("#fCountry").value === "Canada" ? Math.round(base * HST) / 100 : 0;
    const m2 = n => "$" + n.toFixed(2) + " CAD";
    $("#taxAmt").textContent = q.err ? "-" : q.manual ? "On invoice" : (tax ? m2(tax) : "None");
    $("#totAmt").textContent = q.manual ? "Quoted on invoice" : m2(base + tax);
    $("#payNote").textContent = q.manual ? "One or more items are large or heavy and need a custom delivery quote. Send an order request and our team will email you an invoice with delivery and HST." : PAYNOTE;
    if(!q.manual && extras() > 0 && !SITE.payAddons) $("#payNote").textContent = "Orders with engraving or gift packing are confirmed by invoice. Send your order request and we'll email a full cost breakdown and payment details.";
    $("#ePost").textContent = ""; $("#fPost").removeAttribute("aria-invalid");
    $("#pay").hidden = !SITE.payEndpoint || !!q.manual || (extras() > 0 && !SITE.payAddons);
  };
  $("#pay").onclick = payNow;
  ["fPost","fCountry"].forEach(id => { $("#"+id).addEventListener("input", refreshShip); $("#"+id).addEventListener("change", refreshShip); });
  refreshShip();
  $("#fOcc").onchange = () => { const v = $("#fOcc").value; $("#occBox").hidden = v === "Personal use"; $("#occLbl").textContent = v === "Gift" ? "Gift message (we'll include it with the gift)" : "Company name and PO reference"; $("#giftBox").hidden = v !== "Gift"; if(v !== "Gift"){ $("#gWrap").checked = false; $("#gHide").checked = false; } refreshShip(); };
  $("#gWrap").onchange = refreshShip;
  $("#back").onclick = viewCart;
  $("#fSame").onchange = () => { $("#billBox").hidden = $("#fSame").checked; };
  $("#send").onclick = submitOrder;
  $("#ship").addEventListener("submit", e => { e.preventDefault(); submitOrder(); });
  setTimeout(() => $("#fName").focus(), 30);
}

const m2 = n => "$" + n.toFixed(2) + " CAD";
function breakdown(f, q){
  const rows = CART.map(c => { const p = bySku(c.sku); return {p, qty:c.qty, item:p.price * c.qty, eng:c.engrave ? ADDON.engrave * c.qty : 0, engText:c.engrave ? String(c.engText).trim() : "", gift:c.gift ? ADDON.gift * c.qty : 0}; });
  const sum = k => rows.reduce((a, r) => a + r[k], 0);
  const b = {rows, items:sum("item"), eng:sum("eng"), gift:sum("gift"), wrap:f.gWrap ? ADDON.wrap : 0};
  b.sub = b.items + b.eng + b.gift + b.wrap; b.ship = q.manual ? null : q.fee;
  b.tax = b.ship === null ? null : f.country === "Canada" ? Math.round((b.sub + b.ship) * HST) / 100 : 0;
  b.total = b.ship === null ? null : b.sub + b.ship + b.tax;
  return b;
}
function orderText(id, f, q, forCustomer){
  const b = breakdown(f, q);
  const lines = b.rows.map(r => `${r.qty} x ${r.p.name} (${r.p.sku}): ${m2(r.item)}` + (r.eng ? `\n    + Wood engraving "${r.engText}": ${m2(r.eng)}` : "") + (r.gift ? `\n    + Premium gift packing: ${m2(r.gift)}` : ""));
  const cost = [`Items: ${m2(b.items)}`, b.eng ? `Wood engraving: ${m2(b.eng)}` : "", b.gift ? `Premium gift packing: ${m2(b.gift)}` : "", b.wrap ? `Gift wrap: ${m2(b.wrap)}` : "", `Subtotal: ${m2(b.sub)}`,
    `Delivery (${q.zone}): ${b.ship === null ? "to be quoted on your invoice (large or heavy item)" : m2(b.ship)}`,
    b.tax === null ? `Delivery and ${HST}% HST will be added on your invoice` : f.country === "Canada" ? `HST (${HST}%): ${m2(b.tax)}` : "HST: not applicable (United States)",
    b.total === null ? "" : `TOTAL: ${m2(b.total)}`].filter(Boolean).join("\n");
  const occ = f.occ && f.occ !== "Personal use" ? `\nOrder type: ${f.occ}${f.occTxt ? " - " + f.occTxt : ""}${f.occ === "Gift" ? `\nGift wrap: ${f.gWrap ? "yes" : "no"}\nHide prices on packing slip: ${f.gHide ? "yes" : "no"}` : ""}` : "";
  const ship = `${f.name}\n${f.addr}\n${f.city}${f.prov ? ", " + f.prov : ""} ${f.post}\n${f.country}`;
  if(forCustomer) return `Hi ${f.name.split(" ")[0]},\n\nThank you for choosing Admiralty Brass Co. Your order request ${id} is with our team, and we truly appreciate your support of our artisans in Moradabad.\n\nYour order\n${lines.join("\n")}\n\nCost breakdown\n${cost}${occ}\n\nShip to\n${ship}\n\nWhat happens next: we'll check your order and email your invoice. Once it's paid, your order ships from Ontario by Canada Post. Questions? Reply to this email or write to ${mail("support")} and quote ${id}.\n\nWith thanks,\nAdmiralty Brass Co.`;
  return `Order request ${id}${occ}\n\n${lines.join("\n")}\n\nCost breakdown\n${cost}\n\nShip to:\n${ship}\n\nBilling: ${f.sameBill ? "same as shipping" : [f.bill.name, f.bill.addr, f.bill.city + (f.bill.prov ? ", " + f.bill.prov : "") + " " + f.bill.post, f.bill.country].join(", ")}\nEmail: ${f.email}\nPhone: ${f.phone || "-"}\nNotes: ${f.note || "-"}`;
}
async function sendCustomer(to, subject, text){
  if(!SITE.confirmEndpoint) return false;
  try{ const r = await fetch(SITE.confirmEndpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({to, subject, text})}); return r.ok; }catch(e){ return false; }
}
async function sendToTeam(payload){
  if(!SITE.web3formsKey) return null;
  try{
    const r = await fetch("https://api.web3forms.com/submit", {method:"POST", headers:{"Content-Type":"application/json", "Accept":"application/json"}, body: JSON.stringify(Object.assign({access_key: SITE.web3formsKey}, payload))});
    const d = await r.json(); return !!d.success;
  }catch(e){ return false; }
}
function collect(){
  const v = id => $(id).value.trim();
  const f = {name:v("#fName"), email:v("#fEmail"), phone:v("#fPhone"), addr:v("#fAddr"), city:v("#fCity"), prov:v("#fProv"), post:v("#fPost"), country:v("#fCountry"), note:v("#fNote"), occ:$("#fOcc").value, occTxt:v("#fOccTxt")};
  f.gWrap = f.occ === "Gift" && $("#gWrap").checked;
  f.gHide = f.occ === "Gift" && $("#gHide").checked;
  f.sameBill = $("#fSame").checked;
  f.bill = f.sameBill ? {name:f.name, addr:f.addr, city:f.city, prov:f.prov, post:f.post, country:f.country} : {name:v("#bName"), addr:v("#bAddr"), city:v("#bCity"), prov:v("#bProv"), post:v("#bPost"), country:$("#bCountry").value};
  const bad = [];
  const flag = (inp, err, msg) => { $(inp).setAttribute("aria-invalid", "true"); $(err).textContent = msg; bad.push(inp); };
  ["#fName","#fEmail","#fAddr","#fCity","#fPost"].forEach(i => { $(i).removeAttribute("aria-invalid"); });
  ["#eName","#eEmail","#eAddr","#eCity","#ePost"].forEach(i => { $(i).textContent = ""; });
  if(!f.name) flag("#fName","#eName","Enter your full name.");
  if(!/^\S+@\S+\.\S+$/.test(f.email)) flag("#fEmail","#eEmail","Enter a valid email so we can send your receipt.");
  if(!f.addr) flag("#fAddr","#eAddr","Enter your street address.");
  if(!f.city) flag("#fCity","#eCity","Enter your city.");
  ["#bName","#bAddr","#bCity","#bPost"].forEach(i => $(i).removeAttribute("aria-invalid"));
  ["#eBName","#eBAddr","#eBCity","#eBPost"].forEach(i => $(i).textContent = "");
  if(!f.sameBill){
    if(!f.bill.name) flag("#bName","#eBName","Enter the name on the card.");
    if(!f.bill.addr) flag("#bAddr","#eBAddr","Enter your billing address.");
    if(!f.bill.city) flag("#bCity","#eBCity","Enter your billing city.");
    if(!f.bill.post) flag("#bPost","#eBPost","Enter your billing postal or ZIP code.");
  }
  const q = shipQuote(f.country, f.post, count());
  if(q.err) flag("#fPost","#ePost",q.err);
  $("#fStatus").innerHTML = "";
  if(CART.some(c => c.engrave && !String(c.engText).trim())){ $("#fStatus").innerHTML = '<div class="status bad">Enter the text for your wood engraving, or untick it in your cart.</div>'; return null; }
  if(bad.length){ $(bad[0]).focus(); return null; }
  if($("#fBot").value) return null;
  return {f, q};
}
async function payNow(){
  const c = collect(); if(!c) return;
  if(c.q.manual){ $("#fStatus").innerHTML = `<div class="status bad">This order needs a custom delivery quote. Please send an order request and we'll invoice you.</div>`; return; }
  const btn = $("#pay"); btn.disabled = true; btn.textContent = "Opening secure payment...";
  const id = "AB-" + Date.now().toString(36).toUpperCase().slice(-6);
  try{
    const r = await fetch(SITE.payEndpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({items: CART.map(x => ({sku:x.sku, qty:x.qty, engrave:!!x.engrave, engText:x.engrave ? x.engText.trim() : "", giftPack:!!x.gift})), addons: ADDON, customer: c.f, orderId: id})});
    const d = await r.json();
    if(!r.ok || !d.url) throw new Error(d.error || "failed");
    location.href = d.url;
  }catch(e){
    btn.disabled = false; btn.textContent = "Place your order and pay";
    $("#fStatus").innerHTML = `<div class="status bad">${esc(e.message && e.message !== "failed" ? e.message : "We couldn't start the payment.")} You can also send an order request and we'll invoice you.</div>`;
  }
}
async function submitOrder(){
  const c = collect(); if(!c) return;
  const {f, q} = c;

  const btn = $("#send"); btn.disabled = true; btn.textContent = "Sending...";
  const id = "AB-" + Date.now().toString(36).toUpperCase().slice(-6);
  const text = orderText(id, f, q, false);
  const res = await sendToTeam({subject:"New order request " + id, from_name:"Admiralty Brass website", name:f.name, email:f.email, phone:f.phone, message:text, botcheck:""});
  if(res === false){
    btn.disabled = false; btn.textContent = "Send order request";
    $("#fStatus").innerHTML = `<div class="status bad">We couldn't send your request. Check your connection and try again, or <a href="mailto:${mail("orders")}?subject=${encodeURIComponent("Order request " + id)}&body=${encodeURIComponent(text)}">email it to us instead</a>.</div>`;
    return;
  }
  const custMailed = res === null ? false : await sendCustomer(f.email, "Your Admiralty Brass Co. order " + id + ": thank you", orderText(id, f, q, true));
  lastOrder = {id, f, text, viaEmail: res === null, ship: q, b: breakdown(f, q), custMailed};
  if(res === null){ location.href = `mailto:${mail("orders")}?subject=${encodeURIComponent("Order request " + id)}&body=${encodeURIComponent(text)}`; }
  CART = []; save(); refreshBadge(); viewDone();
}
function viewDone(){
  const o = lastOrder; dTitle.textContent = o.viaEmail ? "One more step" : "Order request sent";
  const b = o.b, rw = (a, v, c) => `<div${c ? ' class="' + c + '"' : ""}><span>${a}</span><span>${v}</span></div>`;
  const recap = '<div class="rc">' + b.rows.map(r => rw(r.qty + " &times; " + esc(r.p.name), m2(r.item)) + (r.eng ? rw("+ Wood engraving &ldquo;" + esc(r.engText) + "&rdquo;", m2(r.eng), "sub2") : "") + (r.gift ? rw("+ Premium gift packing", m2(r.gift), "sub2") : "")).join("") + (b.wrap ? rw("Gift wrap", m2(b.wrap)) : "") + rw("Subtotal", m2(b.sub)) + rw("Delivery", b.ship === null ? "On invoice" : m2(b.ship)) + (b.tax === null ? rw("HST", "On invoice") : o.f.country === "Canada" ? rw("HST (" + HST + "%)", m2(b.tax)) : "") + (b.total === null ? "" : rw("Total", m2(b.total), "tot")) + '</div>';
  dBody.innerHTML = `<div class="done">
    <h3>${o.viaEmail ? "Send the email to finish." : "Thank you, " + esc(o.f.name.split(" ")[0]) + "."}</h3>${o.viaEmail ? "" : "<p style=\"margin:0 0 8px;color:var(--slate)\">We're grateful you chose handcrafted brass.</p>"}
    <div class="oid">${o.id}</div>
    <p style="margin:0 0 14px;color:var(--slate)">${o.viaEmail ? "Your email app should have opened with your order filled in. Press send and we'll receive it." : "We've received your order request." + (o.custMailed ? " A copy of this cost breakdown is on its way to " + esc(o.f.email) + "." : " Below is your cost breakdown; our team has the same copy.")}</p>
    <div class="recap">${recap}</div>
    <p style="margin:0"><strong>What happens next</strong></p>
    <ul><li>Our team will check your order and email an invoice to ${esc(o.f.email)} with delivery and ${HST}% HST.</li><li>Once it's paid, your order ships from Ontario by Canada Post.</li><li>Questions? Email <a href="mailto:${mail("support")}">${mail("support")}</a> and quote ${o.id}.</li></ul>
  </div>`;
  dFoot.innerHTML = (o.viaEmail ? `<a class="btn block" href="mailto:${mail("orders")}?subject=${encodeURIComponent("Order request " + o.id)}&body=${encodeURIComponent(o.text)}">Open the email again</a>` : `<button class="btn ghost block" id="prt">Print receipt</button>`) + `<button class="btn ${o.viaEmail ? "ghost " : ""}block" id="cont">Continue shopping</button>`;
  $("#cont").onclick = () => drawer.close();
  if(!o.viaEmail) $("#prt").onclick = () => printReceipt(o);
}
function printReceipt(o){
  const b = o.b, f = o.f, row = (a, v, bold) => `<tr${bold ? ' class="tot"' : ""}><td>${a}</td><td>${v}</td></tr>`;
  const items = b.rows.map(r => row(r.qty + " &times; " + esc(r.p.name) + ` (${esc(r.p.sku)})`, m2(r.item)) +
    (r.eng ? row("&nbsp;&nbsp;+ Wood engraving &ldquo;" + esc(r.engText) + "&rdquo;", m2(r.eng)) : "") +
    (r.gift ? row("&nbsp;&nbsp;+ Premium gift packing", m2(r.gift)) : "")).join("");
  const rows = items + (b.wrap ? row("Gift wrap", m2(b.wrap)) : "") + row("Subtotal", m2(b.sub)) +
    row("Delivery" + (o.ship.zone ? " (" + esc(o.ship.zone) + ")" : ""), b.ship === null ? "On invoice" : m2(b.ship)) +
    (b.tax === null ? row("HST", "On invoice") : f.country === "Canada" ? row("HST (" + HST + "%)", m2(b.tax)) : "") +
    (b.total === null ? "" : row("Total", m2(b.total), true));
  const addr = [f.name, f.addr, f.city + (f.prov ? ", " + f.prov : "") + " " + f.post, f.country].map(esc).join("<br>");
  const gift = f.occ === "Gift" ? `<p><strong>Gift order.</strong> ${f.gWrap ? "Gift wrapped. " : ""}${f.gHide ? "Prices hidden on packing slip." : ""}${f.occTxt ? "<br>Message: &ldquo;" + esc(f.occTxt) + "&rdquo;" : ""}</p>` : "";
  const w = open("", "_blank"); if(!w) return;
  w.document.write(`<title>Order ${o.id}</title><style>body{font:14px/1.5 Arial,sans-serif;padding:32px;max-width:640px;margin:auto;color:#111}.rh{display:flex;justify-content:space-between;border-bottom:2px solid #8a5f1c;padding-bottom:12px;margin-bottom:16px}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:5px 0;vertical-align:top}td:last-child{text-align:right;white-space:nowrap}tr.tot td{font-weight:700;border-top:1px solid #ccc;padding-top:10px}h5{margin:18px 0 4px;color:#666;font-size:13px}</style>
    <div class="rh"><div><strong>Admiralty Brass Co.</strong><br><span style="color:#666">Ontario, Canada</span></div><div style="text-align:right"><strong>Order request</strong><br>${esc(o.id)}<br><span style="color:#666">${new Date().toLocaleDateString("en-CA",{year:"numeric",month:"long",day:"numeric"})}</span></div></div>
    <h5>Ship to</h5><p>${addr}</p>${gift}<h5>Order details</h5><table>${rows}</table>
    <p style="color:#666;margin-top:20px">Questions? Email ${mail("support")} and quote ${o.id}.</p>`);
  w.document.close(); w.print();
}
if(/[?&]paid=1/.test(location.search)){
  CART = []; save(); history.replaceState(null, "", location.pathname);
  dTitle.textContent = "Payment received";
  dBody.innerHTML = `<div class="done"><h3>Thank you for your order.</h3><p style="margin:0 0 14px;color:var(--slate)">Your payment went through and Stripe has emailed you a receipt. We'll pack your order and ship it from Ontario by Canada Post.</p><p style="margin:0">Questions? Email <a href="mailto:${mail("support")}">${mail("support")}</a>.</p></div>`;
  dFoot.innerHTML = `<button class="btn block" id="cont">Continue shopping</button>`;
  $("#cont").onclick = () => drawer.close();
  drawer.showModal();
}
refreshBadge();
