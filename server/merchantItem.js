/**
 * Honest merchant item — typed name + TT$ price. Optional sku. Typed qty or empty.
 * Empty SKU is valid. Empty qty does not claim stock. 0 = sold out.
 */

function parseQty(raw) {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (text === '') return null;
  if (!/^\d+$/.test(text)) return { error: 'qty must be a whole number, or empty' };
  const n = Number(text);
  if (!Number.isInteger(n) || n < 0) return { error: 'qty must be a whole number, or empty' };
  return n;
}

function validateMerchantItem(body) {
  const name = String(body?.name || '').trim();
  if (!name) return { error: 'Item name is required', status: 400 };
  if (/sample product/i.test(name)) return { error: 'Item name is required', status: 400 };
  const priceRaw = body?.price;
  if (priceRaw == null || String(priceRaw).trim() === '') {
    return { error: 'Price TT$ is required', status: 400 };
  }
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return { error: 'Price TT$ is required', status: 400 };
  }
  const qtyParsed = parseQty(body?.qty ?? body?.stock);
  if (qtyParsed && typeof qtyParsed === 'object' && qtyParsed.error) {
    return { error: qtyParsed.error, status: 400 };
  }
  const sku = String(body?.sku || body?.code || '').trim().slice(0, 80);
  const variant = String(body?.variant || '').trim().slice(0, 80);
  const description = String(body?.description || '').trim().slice(0, 600);
  const image = String(body?.image || body?.image_url || '').trim();
  return {
    item: {
      name,
      price,
      qty: typeof qtyParsed === 'number' ? qtyParsed : null,
      sku,
      variant,
      description,
      image,
    },
  };
}

function itemStockLabel(item) {
  const qty = item && item.qty;
  if (qty === 0) return 'Sold out';
  if (qty != null && Number.isFinite(Number(qty)) && Number(qty) > 0) {
    return `${Number(qty)} on hand`;
  }
  return '';
}

function itemIsSellable(item) {
  if (!item) return false;
  if (item.qty === 0) return false;
  if (item.inStock === false) return false;
  return true;
}

module.exports = {
  parseQty,
  validateMerchantItem,
  itemStockLabel,
  itemIsSellable,
};
