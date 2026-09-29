// stock.js - drop-in helpers. Does not change your SKUs.
const LOW_STOCK_AT = 2;

function stockStatus(p) {
  if (p.stock <= 0) return "soldout";
  if (p.stock <= LOW_STOCK_AT) return "low";
  return "in";
}

// Returns the HTML for the buy button of one product.
function buyButton(p) {
  if (stockStatus(p) === "soldout") {
    return '<button class="btn btn-soldout" disabled aria-disabled="true">Sold Out</button>';
  }
  return '<button class="btn" onclick="addToCart(\'' + p.sku + '\')">Add to Cart</button>';
}

// Call this in your add-to-cart / checkout code too, so a sold item can never be added.
function canBuy(sku, qty) {
  const p = PRODUCTS.find(x => x.sku === sku);
  return !!p && p.stock >= (qty || 1);
}
