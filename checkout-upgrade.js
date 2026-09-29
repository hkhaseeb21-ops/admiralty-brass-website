/* Admiralty Brass Co. checkout upgrade
   Add ONE line to index.html, right after the main <script> block, before </body>:
   <script src="checkout-upgrade.js"></script>
   Edit the three prices below. All amounts are whole CAD dollars. */
(function(){
const ENG_FEE = 12;      /* engraving, per piece */
const ENG_MAX = 30;      /* max engraving characters */
const WRAP_FEE = 6;      /* gift wrap, per order */

const PROV = {
  "Canada": "AB BC MB NB NL NS NT NU ON PE QC SK YT".split(" "),
  "United States": "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ")
};
const m2 = n => "$" + n.toFixed(2) + " CAD";
const v = id => $("#" + id).value.trim();
const engN = () => CART.reduce((a,c) => a + (c.eng != null ? c.qty : 0), 0);
const engT = () => engN() * ENG_FEE;
const lineTotal = c => bySku(c.sku).price * c.qty + (c.eng != null ? ENG_FEE * c.qty : 0);
const postOk = (c, p) => c === "Canada" ? /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(p) : /^\d{5}(-\d{4})?$/.test(p);

const css = document.createElement("style");
css.textContent = `
#drawer{width:min(560px,100%)}
.blk{border:1px solid var(--line);border-radius:16px;padding:18px;display:grid;gap:14px;margin-bottom:16px}
.blk h4{margin:0;font-size:16px;font-weight:600;letter-spacing:-.01em}
.chk{display:flex;gap:10px;align-items:flex-start;font-size:15px;cursor:pointer}
.chk input{width:18px;height:18px;margin-top:2px;accent-color:var(--brass);flex:none}
.chk small{display:block;color:var(--slate);font-size:13px}
.sub-fields{display:grid;gap:14px}
.engin{font:inherit;font-size:15px;width:100%;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin-top:8px}
.engin:focus{outline:none;border-color:var(--brass);box-shadow:0 0 0 3px color-mix(in srgb,var(--brass) 25%,transparent)}
.pz{margin:10px 0 2px}
.bd{width:100%;border-collapse:collapse;font-size:14px}
.bd td{padding:6px 0;vertical-align:top}
.bd td:last-child{text-align:right;white-space:nowrap;padding-left:12px}
.bd .mut td{color:var(--slate);font-size:13px;padding-top:0}
.bd .sep td{border-top:1px solid var(--line);padding-top:10px}
.bd .tot td{font-weight:600;font-size:17px}
.rcpt h5{margin:18px 0 6px;font-size:13px;color:var(--slate);font-weight:600}
.rcpt .rh{display:flex;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:2px solid var(--brass);font-size:14px}
.rcpt .two{margin-top:4px;font-size:14px;line-height:1.5}
.giftbox{background:var(--fog);border-radius:12px;padding:12px 14px;font-size:14px;margin-top:14px}
`;
document.head.appendChild(css);

/* ---------- cart with engraving ---------- */
window.addToCart = function(sku, q, eng){
  eng = eng == null ? null : eng;
  const it = CART.find(c => c.sku === sku && (c.eng == null ? null : c.eng) === eng);
  if(it) it.qty = Math.min(20, it.qty + q); else CART.push({sku, qty:q, eng});
  save(); refreshBadge();
};
function cartFoot(){
  dFoot.innerHTML = `<div class="sumrow"><span>Subtotal</span><span>${money(subtotal())}</span></div>` +
    (engT() ? `<div class="sumrow" style="font-weight:400;font-size:15px"><span>Engraving (${engN()} &times; $${ENG_FEE})</span><span>${money(engT())}</span></div>` : "") +
    `<p class="note" style="margin:0">Delivery is calculated from your address and 13% HST is added at checkout. You won't be charged until you pay.</p>
    <button class="btn block" id="toCheckout">Check out</button>`;
  $("#toCheckout").onclick = () => viewCheckout();
}
window.viewCart = function(){
  dTitle.textContent = "Cart";
  if(!CART.length){
    dBody.innerHTML = `<p class="empty">Your cart is empty.</p>`;
    dFoot.innerHTML = `<button class="btn block" id="keep">Browse the collection</button>`;
    $("#keep").onclick = () => { drawer.close(); location.hash = "#collection"; };
    return;
  }
  dBody.innerHTML = CART.map((c,i) => { const p = bySku(c.sku), on = c.eng != null; return `
    <div class="line">
      <img src="${esc(p.img)}" alt="">
      <div>
        <div class="nm">${esc(p.name)}</div><div class="sub">${esc(p.kind)}, ${money(p.price)} each</div>
        <div class="qty"><button data-qi="${i}" data-d="-1" aria-label="Fewer ${esc(p.name)}">&minus;</button><span>${c.qty}</span><button data-qi="${i}" data-d="1" aria-label="More ${esc(p.name)}">+</button></div>
        <button class="rm" data-ri="${i}">Remove</button>
        <label class="chk" style="margin-top:10px;font-size:14px"><input type="checkbox" data-et="${i}" ${on ? "checked" : ""}><span>Add engraving <small>+$${ENG_FEE} per piece</small></span></label>
        <input class="engin" data-ei="${i}" maxlength="${ENG_MAX}" placeholder="Text to engrave (max ${ENG_MAX} characters)" value="${on ? esc(c.eng) : ""}" ${on ? "" : "hidden"} aria-label="Engraving text for ${esc(p.name)}">
      </div>
      <div class="nm" id="lt${i}">${money(lineTotal(c))}</div>
    </div>`; }).join("");
  cartFoot();
};
dBody.addEventListener("click", e => {
  const q = e.target.closest("[data-qi]"), r = e.target.closest("[data-ri]");
  if(q){ const i = +q.dataset.qi, it = CART[i]; it.qty = Math.max(0, Math.min(20, it.qty + +q.dataset.d)); if(!it.qty) CART.splice(i, 1); save(); refreshBadge(); viewCart(); }
  if(r){ CART.splice(+r.dataset.ri, 1); save(); refreshBadge(); viewCart(); }
});
dBody.addEventListener("change", e => {
  const t = e.target.closest("[data-et]"); if(!t) return;
  const i = +t.dataset.et, inp = dBody.querySelector(`[data-ei="${i}"]`);
  CART[i].eng = t.checked ? "" : null; inp.hidden = !t.checked; inp.value = "";
  if(t.checked) inp.focus();
  save(); $("#lt" + i).textContent = money(lineTotal(CART[i])); cartFoot();
});
dBody.addEventListener("input", e => {
  const t = e.target.closest("[data-ei]"); if(!t) return;
  CART[+t.dataset.ei].eng = t.value; save();
});

/* ---------- engraving option on the product dialog ---------- */
const pz = document.createElement("div"); pz.className = "pz";
pz.innerHTML = `<label class="chk"><input type="checkbox" id="pzOn"><span>Add engraving <small>+$${ENG_FEE} per piece. Engraved to order, so please check the spelling.</small></span></label>
  <input class="engin" id="pzTxt" maxlength="${ENG_MAX}" placeholder="Text to engrave (max ${ENG_MAX} characters)" hidden aria-label="Engraving text"><div class="err" id="pzErr"></div>`;
qv.querySelector(".buy").before(pz);
$("#pzOn").onchange = e => { $("#pzTxt").hidden = !e.target.checked; if(e.target.checked) $("#pzTxt").focus(); };
const _open = openQV;
window.openQV = function(s){ _open(s); $("#pzOn").checked = false; $("#pzTxt").hidden = true; $("#pzTxt").value = ""; $("#pzErr").textContent = ""; };
$("#qvAdd").onclick = () => {
  const on = $("#pzOn").checked, t = $("#pzTxt").value.trim();
  if(on && !t){ $("#pzErr").textContent = "Enter the text you want engraved."; $("#pzTxt").focus(); return; }
  addToCart(qvP.sku, qvN, on ? t : null); qv.close(); openDrawer("cart");
};

/* ---------- totals and itemized breakdown ---------- */
function T(country, post, wrap){
  const q = shipQuote(country, post, count()), ok = !q.err;
  const sub = subtotal(), eng = engT(), wr = wrap ? WRAP_FEE : 0, ship = ok ? q.fee : 0, pre = sub + eng + wr + ship;
  const tax = country === "Canada" ? Math.round(pre * 13) / 100 : 0;
  return {q, ok, sub, eng, wr, ship, pre, tax, total: pre + tax, country};
}
function bd(t, lines){
  let h = lines.map(l => `<tr><td>${l.q} &times; ${esc(l.p.name)}<br><span style="color:var(--slate);font-size:13px">${esc(l.p.sku)}, ${money(l.p.price)} each</span></td><td>${m2(l.p.price * l.q)}</td></tr>` +
    (l.eng != null ? `<tr class="mut"><td>Engraving: &ldquo;${esc(l.eng)}&rdquo; (${l.q} &times; $${ENG_FEE})</td><td>${m2(ENG_FEE * l.q)}</td></tr>` : "")).join("");
  h += `<tr class="sep"><td>Items subtotal</td><td>${m2(t.sub + t.eng)}</td></tr>`;
  if(t.wr) h += `<tr><td>Gift wrap</td><td>${m2(t.wr)}</td></tr>`;
  h += `<tr><td>Delivery${t.ok ? `<br><span style="color:var(--slate);font-size:13px">${esc(t.q.zone)}, Canada Post</span>` : ""}</td><td>${t.ok ? m2(t.ship) : "Enter postal code"}</td></tr>`;
  h += `<tr class="sep"><td>Total before tax</td><td>${t.ok ? m2(t.pre) : "-"}</td></tr>`;
  h += `<tr><td>${t.country === "Canada" ? "HST (13%)" : "Tax"}</td><td>${t.ok ? (t.tax ? m2(t.tax) : "None") : "-"}</td></tr>`;
  h += `<tr class="sep tot"><td>Order total</td><td>${t.ok ? m2(t.total) : "-"}</td></tr>`;
  return `<table class="bd">${h}</table>`;
}
const cartLines = () => CART.map(c => ({p:bySku(c.sku), q:c.qty, eng:c.eng}));

/* ---------- checkout ---------- */
function addr(p, billing){
  const a = billing ? "billing " : "shipping ";
  return `<div class="field"><label for="${p}Name">Full name</label><input id="${p}Name" autocomplete="${a}name"><div class="err" id="e${p}Name"></div></div>
  <div class="field"><label for="${p}A1">Street address</label><input id="${p}A1" autocomplete="${a}address-line1" placeholder="Street number and name"><div class="err" id="e${p}A1"></div></div>
  <div class="field"><label for="${p}A2">Apartment, suite or unit (optional)</label><input id="${p}A2" autocomplete="${a}address-line2"></div>
  <div class="two">
    <div class="field"><label for="${p}City">City</label><input id="${p}City" autocomplete="${a}address-level2"><div class="err" id="e${p}City"></div></div>
    <div class="field"><label for="${p}Prov" id="${p}ProvL">Province</label><select id="${p}Prov" autocomplete="${a}address-level1"></select><div class="err" id="e${p}Prov"></div></div>
  </div>
  <div class="two">
    <div class="field"><label for="${p}Post">Postal or ZIP code</label><input id="${p}Post" autocomplete="${a}postal-code"><div class="err" id="e${p}Post"></div></div>
    <div class="field"><label for="${p}Country">Country</label><select id="${p}Country" autocomplete="${a}country-name"><option>Canada</option><option>United States</option></select></div>
  </div>`;
}
function fillProv(p){
  const c = $("#" + p + "Country").value;
  $("#" + p + "Prov").innerHTML = `<option value="">Select</option>` + PROV[c].map(x => `<option>${x}</option>`).join("");
  $("#" + p + "ProvL").textContent = c === "Canada" ? "Province" : "State";
}
window.viewCheckout = function(){
  if(!CART.length){ viewCart(); return; }
  dTitle.textContent = "Checkout";
  dBody.innerHTML = `<button class="back" id="back">&lsaquo; Back to cart</button>
  <form id="ship" novalidate>
    <div class="blk"><h4>1. Contact</h4>
      <div class="field"><label for="fEmail">Email (for your receipt)</label><input id="fEmail" type="email" autocomplete="email"><div class="err" id="efEmail"></div></div>
      <div class="field"><label for="fPhone">Phone (optional)</label><input id="fPhone" type="tel" autocomplete="tel"></div>
    </div>
    <div class="blk"><h4>2. Shipping address</h4>${addr("s", false)}
      <div class="field"><label for="sInst">Delivery instructions (optional)</label><textarea id="sInst" style="min-height:64px" placeholder="Buzzer code, leave at door, and so on"></textarea></div>
    </div>
    <div class="blk"><h4>3. Billing address</h4>
      <label class="chk"><input type="checkbox" id="sameBill" checked><span>Same as shipping address</span></label>
      <div class="sub-fields" id="billBox" hidden>${addr("b", true)}</div>
    </div>
    <div class="blk"><h4>4. Gift options</h4>
      <label class="chk"><input type="checkbox" id="isGift"><span>This order is a gift <small>Ship it straight to the recipient's address above.</small></span></label>
      <div class="sub-fields" id="giftBox" hidden>
        <label class="chk"><input type="checkbox" id="gWrap" checked><span>Gift wrap <small>+$${WRAP_FEE} per order</small></span></label>
        <label class="chk"><input type="checkbox" id="gHide" checked><span>Hide prices on the packing slip</span></label>
        <div class="field"><label for="gMsg">Gift message (optional)</label><textarea id="gMsg" maxlength="200" style="min-height:80px" placeholder="Up to 200 characters"></textarea></div>
      </div>
    </div>
    <div class="blk"><h4>5. Review your order</h4><div id="sumBox"></div></div>
    <div class="hp" aria-hidden="true"><label>Leave this empty<input id="fBot" tabindex="-1" autocomplete="off"></label></div>
    <div id="fStatus" role="status"></div>
  </form>`;
  dFoot.innerHTML = `<div class="sumrow" style="font-weight:600"><span>Order total</span><span id="totAmt"></span></div>
    <p class="note" style="margin:0">Pay by card now, or send an order request and we'll email you an invoice. Nothing is charged until you pay.</p>
    <button class="btn block" id="pay" hidden>Pay now by card</button>
    <button class="btn ghost block" id="send">Send order request</button>`;
  fillProv("s"); fillProv("b");
  const refresh = () => {
    const t = T($("#sCountry").value, $("#sPost").value, $("#isGift").checked && $("#gWrap").checked);
    $("#sumBox").innerHTML = bd(t, cartLines());
    $("#totAmt").textContent = t.ok ? m2(t.total) : "Enter postal code";
    $("#pay").hidden = !SITE.payEndpoint;
  };
  $("#sCountry").onchange = () => { fillProv("s"); refresh(); };
  $("#bCountry").onchange = () => fillProv("b");
  $("#sPost").addEventListener("input", refresh);
  $("#gWrap").onchange = refresh;
  $("#sameBill").onchange = e => { $("#billBox").hidden = e.target.checked; };
  $("#isGift").onchange = e => { $("#giftBox").hidden = !e.target.checked; refresh(); };
  $("#pay").onclick = payNow; $("#send").onclick = submitOrder; $("#back").onclick = viewCart;
  $("#ship").addEventListener("submit", e => { e.preventDefault(); submitOrder(); });
  refresh(); setTimeout(() => $("#fEmail").focus(), 30);
};

const rd = p => ({name:v(p+"Name"), a1:v(p+"A1"), a2:v(p+"A2"), city:v(p+"City"), prov:v(p+"Prov"), post:v(p+"Post"), country:v(p+"Country")});
window.collect = function(){
  const bad = [], flag = (id, msg) => { $("#"+id).setAttribute("aria-invalid", "true"); $("#e"+id).textContent = msg; bad.push(id); };
  dBody.querySelectorAll("[aria-invalid]").forEach(x => x.removeAttribute("aria-invalid"));
  dBody.querySelectorAll(".err").forEach(x => x.textContent = "");
  $("#fStatus").innerHTML = "";
  const miss = CART.findIndex(c => c.eng != null && !c.eng.trim());
  if(miss >= 0){ $("#fStatus").innerHTML = `<div class="status bad">Enter the engraving text for ${esc(bySku(CART[miss].sku).name)}, or go back to the cart and remove the engraving.</div>`; return null; }
  const contact = {email:v("fEmail"), phone:v("fPhone")};
  if(!/^\S+@\S+\.\S+$/.test(contact.email)) flag("fEmail", "Enter a valid email so we can send your receipt.");
  const check = (a, p) => {
    if(!a.name) flag(p+"Name", "Enter the full name.");
    if(!a.a1) flag(p+"A1", "Enter the street address.");
    if(!a.city) flag(p+"City", "Enter the city.");
    if(!a.prov) flag(p+"Prov", "Select your " + (a.country === "Canada" ? "province." : "state."));
  };
  const s = rd("s"); check(s, "s");
  const q = shipQuote(s.country, s.post, count()); if(q.err) flag("sPost", q.err);
  const same = $("#sameBill").checked, b = same ? s : rd("b");
  if(!same){ check(b, "b"); if(!postOk(b.country, b.post)) flag("bPost", "Enter a valid postal or ZIP code."); }
  if(bad.length){ $("#" + bad[0]).focus(); return null; }
  if($("#fBot").value) return null;
  const gift = $("#isGift").checked ? {on:true, wrap:$("#gWrap").checked, hide:$("#gHide").checked, msg:v("gMsg")} : {on:false};
  return {s, b, same, contact, gift, q, inst:v("sInst"), t:T(s.country, s.post, gift.on && gift.wrap)};
};

const adrT = a => [a.name, a.a1 + (a.a2 ? ", " + a.a2 : ""), a.city + ", " + a.prov + " " + a.post.toUpperCase(), a.country].join("\n");
const adrH = a => adrT(a).split("\n").map(esc).join("<br>");
function orderText(id, d){
  const L = cartLines().map(l => `${l.q} x ${l.p.name} (${l.p.sku}) - ${m2(l.p.price * l.q)}` + (l.eng != null ? `\n   Engraving: "${l.eng}" (${l.q} x $${ENG_FEE})` : "")).join("\n");
  const t = d.t;
  return `Order request ${id}\n\n${L}\n\nItems subtotal: ${m2(t.sub + t.eng)}${t.wr ? "\nGift wrap: " + m2(t.wr) : ""}\nDelivery (${d.q.zone}): ${m2(t.ship)}\nTotal before tax: ${m2(t.pre)}\n${d.s.country === "Canada" ? "HST (13%) will be added on the invoice" : "No tax"}\n\nGIFT: ${d.gift.on ? "Yes. Wrap: " + (d.gift.wrap ? "yes" : "no") + ". Hide prices: " + (d.gift.hide ? "yes" : "no") + ". Message: " + (d.gift.msg || "-") : "No"}\n\nSHIP TO:\n${adrT(d.s)}\nInstructions: ${d.inst || "-"}\n\nBILL TO:\n${d.same ? "Same as shipping" : adrT(d.b)}\n\nEmail: ${d.contact.email}\nPhone: ${d.contact.phone || "-"}`;
}
window.payNow = async function(){
  const d = collect(); if(!d) return;
  const btn = $("#pay"); btn.disabled = true; btn.textContent = "Opening secure payment...";
  const id = "AB-" + Date.now().toString(36).toUpperCase().slice(-6);
  const legacy = {name:d.s.name, email:d.contact.email, phone:d.contact.phone, addr:d.s.a1 + (d.s.a2 ? ", " + d.s.a2 : ""), city:d.s.city, prov:d.s.prov, post:d.s.post, country:d.s.country, note:d.inst};
  try{
    const r = await fetch(SITE.payEndpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({items: CART.map(x => ({sku:x.sku, qty:x.qty, engraving:x.eng || null})), customer: legacy, shipping:d.s, billing:d.b, gift:d.gift, orderId:id})});
    const j = await r.json();
    if(!r.ok || !j.url) throw new Error(j.error || "failed");
    location.href = j.url;
  }catch(e){
    btn.disabled = false; btn.textContent = "Pay now by card";
    $("#fStatus").innerHTML = `<div class="status bad">${esc(e.message && e.message !== "failed" ? e.message : "We couldn't start the payment.")} You can also send an order request and we'll invoice you.</div>`;
  }
};
window.submitOrder = async function(){
  const d = collect(); if(!d) return;
  const btn = $("#send"); btn.disabled = true; btn.textContent = "Sending...";
  const id = "AB-" + Date.now().toString(36).toUpperCase().slice(-6), text = orderText(id, d);
  const res = await sendToTeam({subject:"New order request " + id, from_name:"Admiralty Brass website", name:d.s.name, email:d.contact.email, phone:d.contact.phone, message:text, botcheck:""});
  if(res === false){
    btn.disabled = false; btn.textContent = "Send order request";
    $("#fStatus").innerHTML = `<div class="status bad">We couldn't send your request. Check your connection and try again, or <a href="mailto:${mail("orders")}?subject=${encodeURIComponent("Order request " + id)}&body=${encodeURIComponent(text)}">email it to us instead</a>.</div>`;
    return;
  }
  lastOrder = {id, d, text, viaEmail: res === null, lines: cartLines(), date: new Date().toLocaleDateString("en-CA", {year:"numeric", month:"long", day:"numeric"})};
  if(res === null) location.href = `mailto:${mail("orders")}?subject=${encodeURIComponent("Order request " + id)}&body=${encodeURIComponent(text)}`;
  CART = []; save(); refreshBadge(); viewDone();
};

/* ---------- receipt ---------- */
window.viewDone = function(){
  const o = lastOrder, d = o.d;
  dTitle.textContent = o.viaEmail ? "One more step" : "Order request sent";
  dBody.innerHTML = `<div class="done">
    <h3>${o.viaEmail ? "Send the email to finish." : "Thank you, " + esc(d.s.name.split(" ")[0]) + "."}</h3>
    <p style="margin:0 0 16px;color:var(--slate)">${o.viaEmail ? "Your email app should have opened with your order filled in. Press send and we'll receive it." : "We've received your order request. Our team will check it and email an invoice to " + esc(d.contact.email) + " with final delivery and tax details. Your order ships from Ontario by Canada Post once the invoice is paid."}</p>
    <div class="rcpt" id="rcpt">
      <div class="rh"><div><strong>Admiralty Brass Co.</strong><br><span class="note">Ontario, Canada</span></div><div style="text-align:right"><strong>Order request</strong><br>${o.id}<br><span class="note">${o.date}</span></div></div>
      <div class="two"><div><h5>Ship to</h5>${adrH(d.s)}</div><div><h5>Bill to</h5>${d.same ? "Same as shipping" : adrH(d.b)}</div></div>
      ${d.gift.on ? `<div class="giftbox"><strong>Gift order</strong><br>${d.gift.wrap ? "Gift wrapped. " : ""}${d.gift.hide ? "Prices hidden on packing slip." : ""}${d.gift.msg ? "<br>Message: &ldquo;" + esc(d.gift.msg) + "&rdquo;" : ""}</div>` : ""}
      <h5>Order details</h5>${bd(d.t, o.lines)}
    </div>
    <p class="note" style="margin-top:14px">Questions? Email <a href="mailto:${mail("support")}">${mail("support")}</a> and quote ${o.id}.</p>
  </div>`;
  dFoot.innerHTML = (o.viaEmail ? `<a class="btn block" href="mailto:${mail("orders")}?subject=${encodeURIComponent("Order request " + o.id)}&body=${encodeURIComponent(o.text)}">Open the email again</a>` : "") +
    `<button class="btn ghost block" id="prt">Print receipt</button><button class="btn block" id="cont">Continue shopping</button>`;
  $("#cont").onclick = () => drawer.close();
  $("#prt").onclick = () => {
    const w = open("", "_blank"); if(!w) return;
    w.document.write(`<title>Order ${o.id}</title><style>body{font:14px/1.5 Arial,sans-serif;padding:32px;max-width:640px;margin:auto;color:#111}.rh{display:flex;justify-content:space-between;border-bottom:2px solid #8a5f1c;padding-bottom:12px}.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}h5{margin:16px 0 4px;color:#666}table{width:100%;border-collapse:collapse}td{padding:5px 0;vertical-align:top}td:last-child{text-align:right;white-space:nowrap}.sep td{border-top:1px solid #ccc}.tot td{font-weight:700}.mut td{color:#666;font-size:12px}.note{color:#666}.giftbox{background:#f5f5f7;padding:10px 12px;margin-top:12px}</style>` + $("#rcpt").outerHTML);
    w.document.close(); w.print();
  };
};
})();
