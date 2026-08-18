// src/services/concierge.js — grounded trade concierge (spec 5)
// Retrieval-first, source-cited, anti-hallucination, answer contract. No model memory for rules.
'use strict';
const domain = require('../domain');
const store = require('../store');
const trade = require('./trade');

// Normalize a user query into searchable terms.
function tokens(q) {
  return String(q||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>2);
}

function searchBusinesses(q, { limit=6 }={}) {
  const t = tokens(q);
  const all = store.listBusinesses();
  return all.map(b=>{
    const blob = [b.name,b.country,b.city,b.category,b.address||''].join(' ').toLowerCase();
    const score = t.reduce((acc,w)=> acc + (blob.includes(w)?1:0), 0) + (b.state==='TRADE_VERIFIED'||b.state==='TRANSACTION_VERIFIED'?1:0);
    return { score, b };
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.b);
}

function searchProducts(q, { limit=6 }={}) {
  const t = tokens(q);
  return store._db().products.map(p=>{
    const blob=[p.title,p.description||'',p.category||'',p.origin_country||''].join(' ').toLowerCase();
    const score=t.reduce((a,w)=>a+(blob.includes(w)?1:0),0);
    return {score,p};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.p);
}

// The concierge answers from retrieved data only. It never invents prices, routes, tariffs, or schedules.
function answerQuestion(q, ctx={}) {
  const text = String(q||'').trim();
  const low = text.toLowerCase();
  const sources = [];

  // 1) Business / product discovery
  if (/find|where|supplier|vendor|source|business|buy|product|sell|who/.test(low) || /is there|are there/.test(low)) {
    const b = searchBusinesses(text);
    const p = searchProducts(text);
    const lines = [];
    if (b.length) {
      lines.push('Businesses: '+ b.map(x=>`${x.name} (${x.country}, ${x.state==='UNCLAIMED_PUBLIC_PROFILE'?'unclaimed public profile':x.label.toLowerCase()})`).join('; '));
      sources.push({ type:'directory', label:'business directory', effective:true });
    }
    if (p.length) {
      lines.push('Products: '+ p.map(x=>`${x.title} at US$${x.price_usd} (${x.origin_country})`).join('; '));
      sources.push({ type:'catalog', label:'product catalog' });
    }
    if (!b.length && !p.length) {
      return domain.answer({ text:`I couldn't find a matching supplier or product in the current directory. I can help you refine your search, or submit a sourcing request (RFQ) so verified suppliers can respond.`, confidence:0.6, next_best_action:'create_rfq' });
    }
    lines.push('Always confirm availability, pricing, certifications and export terms directly with the supplier.');
    return domain.answer({ text: lines.join('\n'), product_category: ctx.category||null, destination: ctx.destination||null, sources, confidence:0.7, next_best_action:'view_profile' });
  }

  // 2) Landed cost / true delivered cost
  if (/cost|price|landed|duty|tariff|delivered|how much|total/.test(low)) {
    const estimate = trade.landedCost({
      product_value: ctx.product_value||100, freight: ctx.freight||20, insurance: ctx.insurance||5,
      applicable_duty: ctx.duty||0, taxes_and_levies: ctx.tax||0, destination_port_charges: ctx.port||10,
      brokerage: ctx.brokerage||15, inland_delivery: ctx.inland||10, currency: ctx.currency||'USD', confidence: 0.5,
      assumptions: ['Estimate uses typical defaults. Provide product value, origin, destination, and HS code for precision.'],
    });
    return domain.answer({ text:`Estimated landed cost for a product valued at ${ctx.currency||'USD'}${ctx.product_value||100} is approximately ${ctx.currency||'USD'}${estimate.total.toFixed(2)}. This includes freight, insurance, duty, port, brokerage and inland delivery. It is an estimate, not a definitive quote.`, sources:[{type:'landed_cost',label:'deterministic landed-cost engine'}], confidence:0.5, assumptions:estimate.assumptions, next_best_action:'build_landed_cost', risk_class:'medium' });
  }

  // 3) Trade requirements / documents / compliance
  if (/requirement|document|paper|permit|certificate|compliance|customs|import|export|hs code|origin/.test(low)) {
    const reqs = trade.likelyRequirements({ origin:ctx.origin||'Caribbean', destination:ctx.destination, category:ctx.category, hs:ctx.hs });
    const text = reqs.map(r=>`- ${r.requirement}${r.note?` (${r.note})`:''}`).join('\n') + '\nThese are decision-support suggestions, not a definitive ruling. Confirm with the relevant customs authority.';
    return domain.answer({ text, jurisdiction: ctx.origin||null, destination: ctx.destination||null, sources:[{type:'trade_rules',label:'requirements engine'}], confidence:0.6, assumptions:['Suggestions only — validate with authority.'], next_best_action:'consult_authority', risk_class:'medium' });
  }

  // 4) Payment methods
  if (/pay|payment|wallet|card|how do i pay|currency|fx|transfer/.test(low)) {
    const rails = trade.availableRails({ payer_territory: ctx.territory||'TT', buyer_is_external: !!ctx.buyer_is_external });
    const list = rails.map(r=>`- ${r.name} (${r.provider})`).join('\n');
    return domain.answer({ text:`Available payment methods:${list? '\n'+list : '\n- None configured for this territory yet'}\nAvailability depends on the payer territory, currency and transaction type.`, jurisdiction: ctx.territory||null, sources:[{type:'payment_rails',label:'payment provider registry'}], confidence:0.6, next_best_action:'choose_payment' });
  }

  // 5) Platform / account / plans
  if (/plan|free|pro|trade|upgrade|price|subscription|account/.test(low)) {
    const plans = Object.values(domain.PLANS).map(p=>`- ${p.name}: US$${p.price_usd}/${p.cycle==='forever'?'forever':p.cycle} (${p.features[0]})`).join('\n');
    return domain.answer({ text:`Plans:\n${plans}`, sources:[{type:'plans',label:'pricing'}], confidence:0.9, next_best_action:'view_plans' });
  }

  // 6) Shipping / logistics / route
  if (/ship|shipping|freight|logistic|route|deliver|transit|arrive|how long/.test(low)) {
    return domain.answer({ text:'I don\'t have live carrier schedules in this build yet. I will not invent transit times. Provide origin and destination ports and I can estimate likely corridors and advise how to confirm a booking with a verified logistics provider.', sources:[], confidence:0.3, requires_confirmation:true, risk_class:'medium', next_best_action:'ask_human_or_logistics', escalation_reason:'No live route data' });
  }

  // Fallback: escalate rather than invent.
  return domain.answer({ text:'I want to help with Caribbean trade. I can find suppliers and products, estimate landed cost, list likely trade documents, explain payment methods, or walk through plans. Could you tell me what you\'re trying to source, where it\'s going, and by when?', sources:[], confidence:0.4, next_best_action:'clarify_intent' });
}

// Sourcing request structured extraction (spec 4.1 / Phase 2)
function extractRfqIntent(message, ctx={}) {
  const m=String(message||'').toLowerCase();
  const productMatch = m.match(/(?:need|looking for|source|want|buy|require)\s+(?:a|an|some)?\s*([a-z0-9 ,-]{3,60}?)(?:\s+(?:in|from|to|for|by|quantity|about|approx))?$/i);
  const qtyMatch = m.match(/(\d{1,6})\s*(kg|tonnes?|tons?|units?|boxes?|cases?|lbs?|litres?|liters?|pcs|pallet)/i);
  return {
    product: productMatch?productMatch[1].trim().replace(/\s+/g,' '): (ctx.product||null),
    quantity: qtyMatch?Number(qtyMatch[1]):(ctx.quantity||null),
    quantity_unit: qtyMatch?qtyMatch[2]:null,
    destination_country: ctx.destination||null,
    confidence: productMatch?0.6:0.3,
    needs_confirmation: !productMatch,
  };
}

module.exports = { answerQuestion, extractRfqIntent, searchBusinesses, searchProducts };
