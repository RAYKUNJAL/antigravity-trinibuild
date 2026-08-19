// src/services/trade.js — landed cost, route, trade rules, HS, payment provider abstraction
'use strict';
const domain = require('../domain');

// Deterministic landed-cost engine (spec 6.4). Separate from conversational AI.
function landedCost(spec) {
  return domain.landedCost(spec || {});
}

// Return a set of likely requirements given origin/destination/category.
// Always decision-support: sourced, effective-dated, never definitive.
function likelyRequirements({ origin, destination, category, hs }) {
  const items = [];
  items.push({ requirement: 'Commercial invoice', kind: 'document', confidence: 0.95, note: 'Required for all customs entries' });
  items.push({ requirement: 'Packing list', kind: 'document', confidence: 0.9 });
  if (destination && ['US','CA','GB','EU','DE','FR'].includes(String(destination).toUpperCase())) {
    items.push({ requirement: 'Importer of record assigned', kind: 'process', confidence: 0.85, note: 'Overseas buyer/agent must be importer of record' });
  }
  if (category && /food|beverage|agri|agriculture/i.test(category)) {
    items.push({ requirement: 'Phytosanitary / food safety certificate', kind: 'certification', confidence: 0.75 });
  }
  if (origin && destination && origin !== destination) {
    items.push({ requirement: 'Proof of origin (CARICOM / bilateral)', kind: 'certification', confidence: 0.7, note: 'May qualify for preferential tariff' });
  }
  if (hs) {
    items.push({ requirement: 'Verify HS classification for duty/tariff', kind: 'compliance', confidence: 0.6, hs });
  }
  return items;
}

// Payment provider abstraction (spec 11.1). Deterministic, provider-neutral.
const RAILS = {
  cod:      { name: 'Cash on Delivery', local: true, available_territories: ['TT','JM','BB','GY','LC','GD','VC','AG','BZ','DM'] },
  bank:     { name: 'Bank transfer', local: true, available_territories: ['*'] },
  wam:      { name: 'Wam wallet', local: true, available_territories: ['TT'] },
  paypal:   { name: 'PayPal', local: false, available_territories: ['*'] },
  card:     { name: 'International card', local: false, available_territories: ['*'] },
  wire:     { name: 'International wire / SWIFT', local: false, available_territories: ['*'] },
};

function availableRails({ payer_territory, buyer_is_external }) {
  const want = buyer_is_external ? ['card','paypal','wire','bank'] : ['cod','bank','wam','card'];
  return want
    .map(k => ({ method: k, ...RAILS[k], provider: RAILS[k].local ? 'regional' : 'international' }))
    .filter(r => r.available_territories.includes('*') || (payer_territory && r.available_territories.includes(String(payer_territory).toUpperCase())));
}

// External-provider interface contract (implemented per provider in later waves)
class PaymentProvider {
  constructor({ id, name }) { this.id = id; this.name = name; }
  async createPayment({ amount, currency, order_id, return_url }) { throw new Error('createPayment not implemented'); }
  async verifyWebhook({ headers, body }) { throw new Error('verifyWebhook not implemented'); }
  async capture({ payment_id }) { throw new Error('capture not implemented'); }
}

module.exports = { landedCost, likelyRequirements, availableRails, PaymentProvider, RAILS };
