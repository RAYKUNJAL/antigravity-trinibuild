// src/services/chatbot.js — Branded Caribbean-accent AI assistant ("Kai") on Grok/xAI.
// Handles customer service, onboarding, logistics & shipping questions. Grounded in
// platform context; falls back to a deterministic reply when Grok is unavailable.
'use strict';
require('../env');
const store = require('../store');

const XAI = { key: process.env.XAI_API_KEY || '', base: process.env.XAI_BASE_URL || 'https://api.x.ai/v1', model: process.env.XAI_MODEL || 'grok-4-fast' };

function buildContext(){
  const db = store._db();
  const cats = require('../../data/sources/categories.json');
  const businesses = store.listBusinesses();
  const byCountry = {};
  for (const b of businesses) byCountry[b.country] = (byCountry[b.country]||0)+1;
  const topCountries = Object.entries(byCountry).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([c,n])=>`${c} (${n})`).join(', ');
  return {
    platform: 'Caribbean Trade Network (operated by R&R Digital Platform Solutions Ltd.)',
    businesses: businesses.length,
    countries: Object.keys(byCountry).length,
    top_markets: topCountries,
    categories: cats.map(c=>c.label).join(', '),
    open_rfqs: (db.rfqs||[]).filter(r=>r.status==='open').length,
    products: (db.products||[]).length,
    ads_campaigns: (db.ads||[]).length,
    pages: { directory:'/browse', landed_cost:'/landed-cost', sourcing:'/sourcing', plans:'/plans', advertise:'/advertise', register:'/signup' },
  };
}

const SYSTEM = `You are Kai, the friendly AI assistant for Caribbean Trade Network, operated by R&R Digital Platform Solutions Ltd. Speak with a warm, light Caribbean (Trinidadian) accent and cadence — you can use gentle island phrasing like "ent", "leh me tell you", "sweet", "no worries at all" — but always stay clear, professional, and helpful for international buyers too.

Help with four things:
1. CUSTOMER SERVICE — how the platform works, accounts, claims, disputes, escrow, payments.
2. ONBOARDING — creating an account, claiming a business (takes ~3 minutes), adding products, verification.
3. LOGISTICS & SHIPPING — freight, landed cost, CARICOM Certificate of Origin, incoterms, duties/taxes, port handling.
4. SOURCING — finding suppliers, posting an RFQ, matching to trade-ready suppliers.

GROUND EVERY FACTUAL CLAIM in the PLATFORM CONTEXT below. Never invent business names, prices, capabilities, certifications, or trade rules that are not in the context. If something is not in the context or you are unsure, say so honestly and point the user to the right page or to support@kunjaldigital.com. Keep answers concise (2-5 sentences), warm, and actionable.`;

async function callGrok(messages, timeout=45000){
  const controller = new AbortController(); const to = setTimeout(()=>controller.abort(), timeout);
  const res = await fetch(`${XAI.base}/chat/completions`, { method:'POST',
    headers:{ 'Authorization':'Bearer '+XAI.key, 'Content-Type':'application/json' },
    body: JSON.stringify({ model:XAI.model, max_tokens:500, temperature:0.5, messages }),
    signal: controller.signal });
  clearTimeout(to);
  const d = await res.json();
  const c = d.choices && d.choices[0] && d.choices[0].message && (d.choices[0].message.content || d.choices[0].message.reasoning);
  if(!c) throw new Error((d.error&&d.error.message)||'no content');
  return { reply: c, model: d.model || XAI.model };
}

function fallbackReply(message){
  const m = String(message||'').toLowerCase();
  if (/onboard|sign ?up|account|register|join/.test(m)) return "Sweet — to get started, head to /signup and create a free account. It's free to browse and post sourcing requests. If you have a business listed, you can claim it in about 3 minutes from the directory. Leh me know if you need a hand!";
  if (/claim/.test(m)) return "To claim your business, find your listing in the directory (/browse), open it, and tap 'Claim this business'. You'll confirm your identity with a phone, business email, or registration doc, then add products and receive RFQs. Free plan includes one claimed business and up to 10 product listings.";
  if (/ship|freight|logistic|deliver|landed|cost|duty|import|incoterm|coo|caricom/.test(m)) return "No worries — our Landed Cost engine (/landed-cost) estimates the full delivered cost across Caribbean routes: freight, insurance, duty, VAT/GCT, and port handling. CARICOM Certificate of Origin can zero out duty between members. Enter your origin, destination, HS code, and quantities to get an estimate.";
  if (/supplier|source|buy|rfq|procure|find/.test(m)) return "You can search 8,777 trade-ready businesses across the Caribbean in the directory (/browse) by category and country. Post a sourcing request (/sourcing) and matching suppliers can respond with quotes. All public/unclaimed listings are clearly labeled so you know what's verified.";
  if (/plan|price|cost.*month|upgrade|pro|trade|subscription/.test(m)) return "We keep it simple: Free to start (browse + sourcing requests), Pro at US$44/month to win and manage export orders (quote & sell on RFQs), and Trade at US$149/month to run multi-market operations at scale (FX, API, account manager). See /plans for the full breakdown.";
  return "Ent, I'm not 100% sure on that one — but I can point you the right way. Try the directory (/browse) to find suppliers, the Landed Cost engine (/landed-cost) for shipping estimates, or contact support@kunjaldigital.com and we'll sort you out. What exactly are you trying to do?";
}

async function chat(message, history=[]){
  const context = buildContext();
  const messages = [
    { role:'system', content: SYSTEM + '\n\nPLATFORM CONTEXT (JSON):\n' + JSON.stringify(context) },
    ...(history||[]).slice(-8).map(m=>m.role && m.content ? m : null).filter(Boolean),
    { role:'user', content: message },
  ];
  if (!XAI.key) return { source:'catalog-fallback', model:'rules', reply: fallbackReply(message) };
  try { const r = await callGrok(messages); return { source:'grok', model:r.model, reply:r.reply }; }
  catch(e){ return { source:'catalog-fallback', model:'rules', warning:e.message, reply: fallbackReply(message) }; }
}

module.exports = { chat, buildContext, SYSTEM, XAI };
