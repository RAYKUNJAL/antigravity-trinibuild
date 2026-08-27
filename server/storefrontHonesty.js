/** CommonJS mirror of services/storefrontHonesty.ts for node tests. Keep in sync. */

const BLOCKS = {
  food: ['hero', 'trust', 'featured_combo', 'menu', 'how', 'sticky', 'faq', 'footer'],
  fashion: ['hero', 'trust', 'lookbook', 'grid', 'how', 'sticky', 'faq', 'footer'],
  services: ['hero', 'trust', 'service_list', 'how', 'sticky', 'faq', 'footer'],
  general: ['hero', 'trust', 'featured', 'grid', 'how', 'sticky', 'faq', 'footer'],
  beauty: ['hero', 'trust', 'featured', 'grid', 'how', 'sticky', 'faq', 'footer'],
  home: ['hero', 'trust', 'featured', 'grid', 'how', 'sticky', 'faq', 'footer'],
};

function liveItems(model) {
  return (model.items || []).filter((item) => item && String(item.name || '').trim());
}

function featuredItems(model) {
  const live = liveItems(model);
  const marked = live.filter((item) => item.featured);
  const pool = marked.length ? marked : live;
  if (model.templateId === 'home') {
    return pool.filter((item) => item.price != null && Number.isFinite(Number(item.price))).slice(0, 1);
  }
  return pool.slice(0, 3);
}

function catalogEmpty(model) {
  return liveItems(model).length === 0;
}

function normalizeWhatsappE164(raw) {
  if (!raw) return '';
  const compact = String(raw).trim().replace(/[^\d+]/g, '');
  return /^\+\d{8,15}$/.test(compact) ? compact : '';
}

function showWhatsApp(model) {
  return !!normalizeWhatsappE164(model.whatsappE164);
}

function showOrderCta(model) {
  if (model.templateId === 'food' && model.isOpen === false) return false;
  return true;
}

function reviewBadge(reviewCount) {
  const n = Number(reviewCount || 0);
  if (!Number.isFinite(n) || n <= 0) return { kind: 'new', label: 'New' };
  return { kind: 'count', label: `${n} review${n === 1 ? '' : 's'}` };
}

function realTrustChips(model) {
  const chips = [];
  if (model.acceptsCashPickup) chips.push('Cash / pickup');
  if (model.acceptsCod) chips.push('Cash on delivery');
  if (model.deliveryAreas) chips.push(model.deliveryAreas);
  if (model.hours) chips.push(model.hours);
  if (showWhatsApp(model)) chips.push('WhatsApp');
  return chips;
}

function shouldRenderBlock(block, model) {
  const allowed = BLOCKS[model.templateId] || [];
  if (!allowed.includes(block)) return false;
  if (block === 'hero' || block === 'footer' || block === 'sticky') return true;
  if (block === 'trust') return realTrustChips(model).length > 0;
  if (block === 'featured' || block === 'featured_combo') return featuredItems(model).length > 0;
  if (['lookbook', 'menu', 'grid', 'service_list'].includes(block)) return liveItems(model).length > 0;
  if (block === 'how') return Array.isArray(model.how) && model.how.length > 0;
  if (block === 'faq') return Array.isArray(model.faq) && model.faq.length > 0;
  return false;
}

function closedFoodNextOpen(model) {
  if (model.templateId !== 'food' || model.isOpen !== false) return '';
  return model.nextOpen ? `Opens ${model.nextOpen}` : 'Closed';
}

module.exports = {
  liveItems,
  featuredItems,
  catalogEmpty,
  normalizeWhatsappE164,
  showWhatsApp,
  showOrderCta,
  reviewBadge,
  realTrustChips,
  shouldRenderBlock,
  closedFoodNextOpen,
};
