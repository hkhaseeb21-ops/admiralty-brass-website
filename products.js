/* =====================================================================
   Admiralty Brass Co. - product catalogue
   This is the file you edit to add, change or remove products.

   TO ADD A PRODUCT
   1. Upload the photo to GitHub in the main folder, next to this file
      (Add file > Upload files). Portrait photos (taller than wide,
      about 3:4) look best.
   2. Click the pencil icon on this file and copy one whole product block
      below, from { to the matching }, keeping the comma after it.
      Paste it at the end of the list, just before the last ];
   3. Change the sku, name, kind, price, img (the photo's exact file name, for example "vase.jpg"),
      tag, finish, base, ideal, alt and features.
   4. Click Commit changes. The site updates in about a minute.

   STOCK AND DELIVERY (per product)
   - stock: how many you have. Every piece is one-of-a-kind, so it is 1.
     When a piece sells, change it to stock:0 and it shows "Sold out".
   - weightKg: the packed weight in kilograms. Delivery is calculated from it.
     The numbers below are ESTIMATES: weigh each piece (in its box) and correct them.
   - dims (optional): add dims:{l:30,w:12,h:30} (cm, packed size) to a product
     to charge for bulky pieces. Over 120 cm or 30 kg goes to invoice/quote.
   - invoiceOnly:true (optional) forces a product to be invoiced with a delivery quote.

   NOTES
   - "kind" is the category. Use an existing one (Ship model, Bookend,
     Display case) or invent a new one such as "Vase" or "Candle holder";
     a new filter button appears automatically. Add its plural in
     CATEGORY_LABELS below (optional, "s" is added if you skip it).
   - "sku" must be unique for every product (for example ABC-014).
   - "material" is optional and defaults to "Solid brass".
   - To remove a product, delete its whole { ... }, block.
   ===================================================================== */

window.CATEGORY_LABELS = {"Ship model":"Ship models","Bookend":"Bookends","Display case":"Display cases"};

/* Featured product shown in the dark banner. Use a sku, or "" to hide it. */
window.FEATURED_SKU = "ABC-006";

/* Three photos in the top banner (left, centre, right). */
window.HERO_IMAGES = [
  {src:"trafalgar.jpg", alt:"Trafalgar, a detailed brass ship model with ladder-style masts"},
  {src:"cover.jpg", alt:"A handcrafted solid brass ship model with a Canadian flag on a hardwood base"},
  {src:"admiral.jpg", alt:"Admiral, a large brass ship model with two dhow-style sails"}
];

window.PRODUCTS = [
 {sku:"ABC-001", name:"Mariner", kind:"Ship model", price:75, stock:1, weightKg:1.5, img:"mariner.jpg", tag:"Diamond-cut sails with a Canadian flag.",
  finish:"Antique brass", base:"Varnished hardwood", ideal:"Housewarmings, collector gifts",
  alt:"Mariner, a solid brass ship model with diamond-cut sails and a Canadian flag on a hardwood base",
  features:["Diamond-cut sail detailing, hand-finished in solid brass","Canadian flag accent","Weighted hardwood base for stable display","Made in small batches, so no two are exactly alike"]},
 {sku:"ABC-002", name:"Meridian", kind:"Ship model", price:70, stock:1, weightKg:1.5, img:"meridian.jpg", tag:"Ribbon sails in polished brass.",
  finish:"Polished brass", base:"Varnished hardwood", ideal:"Housewarmings, office decor",
  alt:"Meridian, a polished brass ship model with bold ribbon-style sails on a hardwood base",
  features:["Bold ribbon-style sails in polished brass","Hand-shaped hull and rigging","An old-world nautical look for shelves and mantels"]},
 {sku:"ABC-003", name:"Clipper", kind:"Ship model", price:85, stock:1, weightKg:1.5, img:"clipper.jpg", tag:"Fan-shaped sails and a full profile.",
  finish:"Brass", base:"Varnished hardwood", ideal:"Birthdays, retirements, housewarmings",
  alt:"Clipper, a solid brass ship model with wide fan-shaped sails on a hardwood base",
  features:["Wide fan-shaped sails for a dramatic silhouette","Weighted hardwood base keeps it stable and shelf-ready","A timeless centrepiece for a study, office or living room"]},
 {sku:"ABC-004", name:"Horizon", kind:"Ship model", price:80, stock:1, weightKg:1.5, img:"horizon.jpg", tag:"Sails hand-textured like rippling water.",
  finish:"Brass", base:"Varnished hardwood", ideal:"Housewarmings, corporate gifts",
  alt:"Horizon, a brass ship model with hand-textured wave-pattern sails on a hardwood base",
  features:["Hand-textured, wave-patterned sails","Fully hand-rigged masts and lines","A polished finish suited to formal display spaces"]},
 {sku:"ABC-005", name:"Argent", kind:"Ship model", price:85, stock:1, weightKg:1.5, img:"argent.jpg", tag:"The one in silver-tone.",
  finish:"Silver-tone brass", base:"Varnished hardwood", ideal:"Anniversaries, collector gifts",
  alt:"Argent, a silver-tone brass ship model on a hardwood base",
  features:["A rare silver-tone finish, unique in the collection","Fully hand-rigged, one piece at a time","A cooler, more contemporary take on the nautical look"]},
 {sku:"ABC-006", name:"Admiral", headline:"The Admiral.", kind:"Ship model", price:110, stock:1, weightKg:2.5, img:"admiral.jpg", tag:"Two dhow sails. Our largest piece.",
  finish:"Brass", base:"Varnished hardwood", ideal:"Retirements, milestone gifts",
  alt:"Admiral, our largest brass ship model, with two sweeping dhow-style sails on a hardwood base",
  features:["Our largest piece, with two sweeping dhow-style sails","A substantial weighted base to match its scale","A statement centrepiece for large shelves and entryways"]},
 {sku:"ABC-007", name:"Beacon", kind:"Ship model", price:70, stock:1, weightKg:1.5, img:"beacon.jpg", tag:"Raised on a brass pedestal.",
  finish:"Brass", base:"Brass pedestal on a hardwood base", ideal:"Housewarmings, gifts",
  alt:"Beacon, a brass ship model raised on a pedestal above a hardwood base",
  features:["Raised on a pedestal so it stands out on any surface","Compact profile that suits narrow shelves and side tables","Hand-finished brass hull and rigging"]},
 {sku:"ABC-008", name:"Odyssey", kind:"Ship model", price:75, stock:1, weightKg:1.5, img:"odyssey.jpg", tag:"A weathered finish and hanging anchor.",
  finish:"Antique brass", base:"Varnished hardwood", ideal:"Housewarmings, gifts for sailors",
  alt:"Odyssey, an antique brass ship model with a weathered finish and hanging anchor",
  features:["Weathered, antiqued brass for a well-travelled look","Hanging anchor detail adds character","Hand-shaped on a hardwood base"]},
 {sku:"ABC-013", name:"Trafalgar", kind:"Ship model", price:85, stock:1, weightKg:1.5, img:"trafalgar.jpg", tag:"Ladder masts and fine chain rigging.",
  finish:"Brass", base:"Varnished hardwood", ideal:"Anniversaries, collector gifts",
  alt:"Trafalgar, a detailed brass ship model with ladder-style masts and fine chain rigging",
  features:["Our most detailed rigging, with ladder-style masts and fine chains","Made for collectors who want maximum detail","Fully hand-finished in small batches"]},
 {sku:"ABC-009", name:"Compass", kind:"Bookend", price:70, stock:1, weightKg:2, img:"compass.jpg", tag:"A bookend topped with a brass ship.",
  finish:"Brass", base:"Wood bookend", ideal:"Housewarmings, office gifts",
  alt:"Compass, a wood bookend topped with a brass ship and compass emblem",
  features:["A working bookend with a brass ship and compass emblem","Sold singly. Contact sales if you would like a matching pair","Everyday function with hand-finished brass craft"]},
 {sku:"ABC-010", name:"Anchor", kind:"Bookend", price:70, stock:1, weightKg:2, img:"anchor.jpg", tag:"An anchor-and-wreath emblem.",
  finish:"Antique brass", base:"Wood bookend", ideal:"Housewarmings, graduation gifts",
  alt:"Anchor, a wood bookend with a brass ship and an anchor-and-wreath emblem",
  features:["A brass vessel paired with an anchor-and-wreath emblem","A vintage study and library look","Sold singly. Contact sales if you would like a matching pair"]},
 {sku:"ABC-011", name:"Lattice", kind:"Display case", price:85, stock:1, weightKg:2, img:"lattice.jpg", tag:"A fine lattice sail, under acrylic.",
  finish:"Brass", base:"Acrylic case on a hardwood base", ideal:"Anniversaries, heirloom gifts",
  alt:"Lattice, a brass sailboat with a finely patterned sail inside a clear acrylic display case",
  features:["Arrives in a protective acrylic case, dust-free and shelf-ready","Finely patterned lattice sail","Built for long-term display"]},
 {sku:"ABC-012", name:"Gallery", kind:"Display case", price:80, stock:1, weightKg:2.5, img:"gallery.jpg", tag:"Triple-mast rigging in a tall case.",
  finish:"Brass", base:"Tall acrylic case on a hardwood base", ideal:"Retirements, collector gifts",
  alt:"Gallery, a triple-mast brass ship model inside a tall acrylic display case",
  features:["A taller acrylic case to suit the triple-mast rigging","More elaborate rigging than our standard pieces","A museum-style presentation"]}
];
