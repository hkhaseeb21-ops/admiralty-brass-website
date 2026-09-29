/* =====================================================================
   Admiralty Brass Co. - prices and delivery settings
   ONE file controls the website AND the payment/email worker, so the
   numbers a customer sees are always the numbers they are charged.

   HOW TO CHANGE A PRICE
   Click the pencil icon, change the number, click Commit changes.
   Keep the quotes, colons and commas exactly as they are.

   zones -> fee        delivery fee in whole dollars (CAD) for that area
   weight.includedKg   the zone fee covers this many kg (about one piece)
   weight.extraPerKg   each extra whole kg above that adds this many dollars
   weight.maxKg        an item heavier than this is invoiced with a delivery quote
   weight.maxSideCm    an item longer than this (cm) is invoiced with a delivery quote
   addons              price of each add-on, per piece
   hstPercent          tax rate for Canadian orders
   leadDays            made-to-order time shown for sold-out / bulk requests
   ===================================================================== */
window.SHIPPING = {
  "leadDays": 15,
  "hstPercent": 13,
  "bulkAt": 5,
  "addons": { "engrave": 5, "gift": 5 },
  "weight": { "includedKg": 2, "extraPerKg": 3, "defaultKg": 1, "maxKg": 30, "maxSideCm": 120, "volDivisor": 5000 },
  "zones": {
    "GTA":   { "name": "Toronto, Mississauga and Hamilton area", "fee": 21 },
    "ON":    { "name": "Rest of Ontario", "fee": 28 },
    "QC":    { "name": "Quebec", "fee": 25 },
    "PRA":   { "name": "Manitoba, Saskatchewan, Alberta", "fee": 33 },
    "BC":    { "name": "British Columbia", "fee": 34 },
    "ATL":   { "name": "Atlantic Canada (NB, NS, PE, NL)", "fee": 33 },
    "NORTH": { "name": "Yukon, Northwest Territories, Nunavut", "fee": 45 },
    "US":    { "name": "United States", "fee": 28 }
  },
  "postal": { "A":"ATL","B":"ATL","C":"ATL","E":"ATL","G":"QC","H":"QC","J":"QC","K":"ON","L":"GTA","M":"GTA","N":"ON","P":"ON","R":"PRA","S":"PRA","T":"PRA","V":"BC","X":"NORTH","Y":"NORTH" }
};
