/**
 * Grok onboarding draft — copy only. No products. No invented SKUs.
 * Used by POST /api/onboard/draft. Testable without Express.
 */

const STARTER_IDS = ['food', 'fashion', 'services', 'general', 'beauty', 'home', 'electronics', 'auto'];

const HERO = {
  food: 'Cooked this morning. Ready when you reach.',
  fashion: 'Pieces you can try. Prices you can see.',
  services: 'Book a time. Pay cash when you come.',
  general: 'Shop local. Cash or pickup.',
  beauty: 'Shades and kits. Cash on pickup.',
  home: 'Furniture you can see. Price on the piece.',
  electronics: 'Phones and gadgets. Price on the piece.',
  auto: 'Parts and accessories. Ask if it fits.',
};

const FAQ_PAY_LINE =
  'Cash when you collect, or cash on delivery if that option is on. We do not ask for PayPal.';

function isStarterId(value) {
  return STARTER_IDS.includes(value);
}

function recommendFromText(text) {
  const t = String(text || '').toLowerCase();
  if (/\b(roti|doubles|food|cook|bake|menu|kitchen|lunch|dinner|breakfast)\b/.test(t)) return 'food';
  if (/\b(dress|fashion|cloth|boutique|apparel|wear|garment)\b/.test(t)) return 'fashion';
  if (/\b(barber|salon|fade|chair|book|repair|lesson|service)\b/.test(t)) return 'services';
  if (/\b(lipstick|makeup|cosmetic|shade|serum|kit|skincare)\b/.test(t)) return 'beauty';
  if (/\b(sofa|table|furniture|mattress|home decor)\b/.test(t)) return 'home';
  if (/\b(phone|laptop|gadget|electronics|storage|pixel)\b/.test(t)) return 'electronics';
  if (/\b(auto|car|parts|brake|tyre|tire|vehicle)\b/.test(t)) return 'auto';
  return 'general';
}

function validateOnboardInput(body) {
  const name = String(body?.storeName || body?.name || '').trim();
  if (!name) return { error: 'Store name is required' };
  let templateId = String(body?.templateId || body?.type || '').trim();
  if (templateId && !isStarterId(templateId)) {
    return { error: 'templateId must be one of food, fashion, services, general, beauty, home, electronics, auto' };
  }
  if (!templateId) {
    templateId = recommendFromText(body?.chat || body?.specialty || name);
  }
  const payout = String(body?.payoutPreference || '').trim();
  if (payout && !['cash_vendor_keeps', 'wam', 'bank_transfer'].includes(payout)) {
    return { error: 'payoutPreference must be cash_vendor_keeps, wam, or bank_transfer' };
  }
  return {
    input: {
      storeName: name,
      templateId,
      phone: String(body?.phone || '').trim(),
      pickupAddress: String(body?.pickupAddress || '').trim(),
      island: String(body?.island || body?.country || '').trim(),
      area: String(body?.area || '').trim(),
      hours: String(body?.hours || '').trim(),
      specialty: String(body?.specialty || '').trim(),
      payoutPreference: payout || '',
      acceptsCashPickup: !!body?.acceptsCashPickup,
      acceptsCod: !!body?.acceptsCod,
      whatsappE164: String(body?.whatsappE164 || '').trim(),
      chat: String(body?.chat || '').trim(),
    },
  };
}

function tokenMap(input) {
  return {
    store_name: input.storeName,
    area: input.area,
    island: input.island,
    hours: input.hours,
    next_open: '',
    pickup_address: input.pickupAddress,
    delivery_areas: '',
    whatsapp: input.whatsappE164,
    specialty: input.specialty,
    currency: 'TT$',
  };
}

function fill(template, tokens) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => tokens[key] || '');
}

function fallbackAbout(input) {
  const tokens = tokenMap(input);
  const where = [input.area, input.island].filter(Boolean).join(', ');
  const spec = input.specialty ? ` ${input.specialty}.` : '';
  const loc = where ? ` ${where}.` : '';
  return `${input.storeName}.${spec}${loc} ${HERO[input.templateId]}`.replace(/\s+/g, ' ').trim();
}

function fallbackTrust(input) {
  const chips = [];
  if (input.acceptsCashPickup) chips.push('Cash / pickup');
  if (input.acceptsCod) chips.push('Cash on delivery');
  if (input.hours) chips.push(input.hours);
  if (input.whatsappE164) chips.push('WhatsApp');
  return chips;
}

function fallbackHow(input) {
  const browse = input.templateId === 'food' ? 'See the menu' : input.templateId === 'services' ? 'Pick a service' : 'Browse the shop';
  const action = input.templateId === 'food' ? 'Place your order' : input.templateId === 'services' ? 'Book a time' : 'Ask for the piece';
  const pay = [
    input.acceptsCashPickup ? 'cash when you collect' : null,
    input.acceptsCod ? 'cash on delivery if we deliver to you' : null,
  ].filter(Boolean);
  return [
    { title: `1. ${browse}`, body: 'What is listed is what is for sale. Empty means nothing is listed yet.' },
    { title: `2. ${action}`, body: input.templateId === 'services' ? 'A time you can keep. No fake reviews.' : 'Message or order from this page.' },
    { title: '3. Pay on the live rails', body: (pay.length ? pay.join(', or ') : 'Pay in a way this shop has turned on') + '.' },
  ];
}

function fallbackFaq(input) {
  const faq = [{ q: 'How do I pay?', a: FAQ_PAY_LINE }];
  if (input.pickupAddress || input.acceptsCashPickup || input.acceptsCod) {
    const bits = [];
    if (input.pickupAddress) bits.push(`Pickup at ${input.pickupAddress}.`);
    else if (input.acceptsCashPickup) bits.push('Pickup is on.');
    if (input.acceptsCod) bits.push('Cash on delivery if that option is on for your area.');
    faq.push({ q: 'Pickup or delivery?', a: bits.join(' ') || 'Ask the shop.' });
  }
  if (input.hours) faq.push({ q: 'When are you open?', a: input.hours });
  if (faq.length < 3) faq.push({ q: 'Do you take PayPal?', a: 'No. Cash when you collect, or cash on delivery if that option is on.' });
  return faq.slice(0, 3);
}

function buildFallbackDraft(input) {
  const tokens = tokenMap(input);
  return {
    templateId: input.templateId,
    hero: {
      headline: HERO[input.templateId],
      sub: fill([input.specialty, input.island].filter(Boolean).join(' · '), tokens),
    },
    about: fallbackAbout(input),
    trustChips: fallbackTrust(input),
    faq: fallbackFaq(input),
    how: fallbackHow(input),
    agentWrote: false,
  };
}

function sanitizeDraft(raw, input) {
  const draft = raw && typeof raw === 'object' ? raw : {};
  const templateId = isStarterId(draft.templateId) ? draft.templateId : input.templateId;
  const hero = draft.hero && typeof draft.hero === 'object' ? draft.hero : {};
  const faq = Array.isArray(draft.faq)
    ? draft.faq
        .filter((row) => row && row.q && row.a)
        .slice(0, 3)
        .map((row) => ({ q: String(row.q).slice(0, 160), a: String(row.a).slice(0, 400) }))
    : fallbackFaq(input);
  const how = Array.isArray(draft.how)
    ? draft.how
        .filter((row) => row && row.title && row.body)
        .slice(0, 3)
        .map((row) => ({ title: String(row.title).slice(0, 80), body: String(row.body).slice(0, 280) }))
    : fallbackHow(input);
  const trustChips = Array.isArray(draft.trustChips)
    ? draft.trustChips.map((c) => String(c || '').trim()).filter(Boolean).slice(0, 6)
    : fallbackTrust(input);

  const clean = {
    templateId,
    hero: {
      headline: String(hero.headline || HERO[templateId]).slice(0, 120),
      sub: String(hero.sub || '').slice(0, 160),
    },
    about: String(draft.about || fallbackAbout({ ...input, templateId })).slice(0, 600),
    trustChips,
    faq,
    how,
    agentWrote: draft.agentWrote === true,
  };
  return clean;
}

function stripProducts(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const { products, items, catalog, skus, ...rest } = obj;
  return rest;
}

function grokConfigured() {
  return !!(process.env.LLM_API_KEY || '').trim();
}

async function callGrok(input) {
  const key = (process.env.LLM_API_KEY || '').trim();
  if (!key) return null;
  const endpoint = (process.env.LLM_API_URL || 'https://api.x.ai/v1/chat/completions').trim();
  const model = (process.env.LLM_MODEL || 'grok-4-fast').trim();
  const system = [
    'You write store copy for Juvay, a Trinidad & Tobago commerce tool.',
    'Return JSON only: { templateId, hero: { headline, sub }, about, trustChips, faq, how }.',
    'templateId must be one of food|fashion|services|general|beauty|home|electronics|auto.',
    'Use these locked headlines unless the merchant already wrote one:',
    'food: Cooked this morning. Ready when you reach.',
    'fashion: Pieces you can try. Prices you can see.',
    'services: Book a time. Pay cash when you come.',
    'general: Shop local. Cash or pickup.',
    'beauty: Shades and kits. Cash on pickup.',
    'home: Furniture you can see. Price on the piece.',
    'electronics: Phones and gadgets. Price on the piece.',
    'auto: Parts and accessories. Ask if it fits.',
    'FAQ pay line must be: ' + FAQ_PAY_LINE,
    'Do not invent products, prices, SKUs, shop names, stars, hours, WhatsApp numbers, or payment rails.',
    'Do not mention PayPal, Linx, Michelin, free shipping, subscribe and save, or TriniBuild.',
    'trustChips only from facts the merchant supplied (cash/pickup, COD, hours, WhatsApp if they typed E.164).',
    'how is exactly 3 steps matching live rails they opted into.',
    'faq is exactly 3 honest questions.',
    'Copy only. Never include products, items, catalog, or skus.',
  ].join(' ');

  const user = JSON.stringify({
    storeName: input.storeName,
    templateId: input.templateId,
    phone: input.phone,
    pickupAddress: input.pickupAddress,
    island: input.island,
    area: input.area,
    hours: input.hours,
    specialty: input.specialty,
    payoutPreference: input.payoutPreference,
    acceptsCashPickup: input.acceptsCashPickup,
    acceptsCod: input.acceptsCod,
    whatsappProvided: !!input.whatsappE164,
    chat: input.chat,
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 900,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Grok error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const jsonText = content.replace(/^```json\s*|```$/g, '').trim();
  const parsed = JSON.parse(jsonText);
  parsed.agentWrote = true;
  return parsed;
}

async function buildOnboardDraft(body) {
  const checked = validateOnboardInput(body || {});
  if (checked.error) return { error: checked.error, status: 400 };
  const input = checked.input;
  if (!grokConfigured()) {
    return { draft: stripProducts(sanitizeDraft({ ...buildFallbackDraft(input), agentWrote: false }, input)) };
  }
  try {
    const grok = await callGrok(input);
    return { draft: stripProducts(sanitizeDraft({ ...grok, agentWrote: true }, input)) };
  } catch (err) {
    return {
      draft: stripProducts(sanitizeDraft({ ...buildFallbackDraft(input), agentWrote: false }, input)),
      warning: 'Grok did not write this draft. The form and locked copy are shown instead.',
      detail: err.message,
    };
  }
}

function currentCopy(bodyCurrent, templateId) {
  const current = bodyCurrent && typeof bodyCurrent === 'object' ? bodyCurrent : {};
  const hero = current.hero && typeof current.hero === 'object' ? current.hero : {};
  return {
    templateId: isStarterId(current.templateId) ? current.templateId : templateId,
    hero: {
      headline: String(hero.headline || HERO[templateId] || '').slice(0, 120),
      sub: String(hero.sub || '').slice(0, 160),
      image: String(hero.image || '').slice(0, 2_000_000),
    },
    about: String(current.about || '').slice(0, 600),
    hours: String(current.hours || '').slice(0, 160),
    trustChips: Array.isArray(current.trustChips)
      ? current.trustChips.map((c) => String(c || '').trim()).filter(Boolean).slice(0, 6)
      : [],
  };
}

function validatePatchInput(body) {
  const instruction = String(body?.instruction || '').trim();
  if (!instruction) return { error: 'instruction is required' };
  if (instruction.length > 500) return { error: 'instruction is too long' };
  let templateId = String(body?.templateId || body?.current?.templateId || '').trim();
  if (templateId && !isStarterId(templateId)) {
    return { error: 'templateId must be one of food, fashion, services, general, beauty, home, electronics, auto' };
  }
  if (!templateId) templateId = 'general';
  const locked = body?.locked && typeof body.locked === 'object' ? body.locked : {};
  return {
    input: {
      instruction,
      templateId,
      current: currentCopy(body?.current, templateId),
      locked: {
        headline: String(locked.headline || '').trim(),
        about: String(locked.about || '').trim(),
        hours: String(locked.hours || '').trim(),
      },
    },
  };
}

const STARTER_HERO_RE = /^\/templates\/heroes\/(food|fashion|services|general|beauty|home|electronics|auto)\.(jpg|png)$/;

function allowedProposedHeroImage(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (value === '') return '';
  if (STARTER_HERO_RE.test(value)) return value;
  return null;
}

function merchantOwnedImage(value) {
  const img = String(value || '').trim();
  return !!img && !STARTER_HERO_RE.test(img);
}

function mergePatch(current, rawPatch) {
  const patch = rawPatch && typeof rawPatch === 'object' ? rawPatch : {};
  const hero = patch.hero && typeof patch.hero === 'object' ? patch.hero : {};
  const nextImage = allowedProposedHeroImage(hero.image);
  const next = {
    templateId: current.templateId,
    hero: {
      headline: hero.headline != null ? String(hero.headline).slice(0, 120) : current.hero.headline,
      sub: hero.sub != null ? String(hero.sub).slice(0, 160) : current.hero.sub,
      image: nextImage !== null ? nextImage : current.hero.image,
    },
    about: patch.about != null ? String(patch.about).slice(0, 600) : current.about,
    hours: patch.hours != null ? String(patch.hours).slice(0, 160) : current.hours,
    trustChips: Array.isArray(patch.trustChips)
      ? patch.trustChips.map((c) => String(c || '').trim()).filter(Boolean).slice(0, 6)
      : current.trustChips,
  };
  const changedFields = [];
  if (next.hero.headline !== current.hero.headline) changedFields.push('hero.headline');
  if (next.hero.sub !== current.hero.sub) changedFields.push('hero.sub');
  if (next.hero.image !== current.hero.image) changedFields.push('hero.image');
  if (next.about !== current.about) changedFields.push('about');
  if (next.hours !== current.hours) changedFields.push('hours');
  if (JSON.stringify(next.trustChips) !== JSON.stringify(current.trustChips)) changedFields.push('trustChips');
  const conflicts = [];
  if (changedFields.includes('hero.headline') && current.hero.headline) conflicts.push('hero.headline');
  if (changedFields.includes('hero.image') && merchantOwnedImage(current.hero.image)) conflicts.push('hero.image');
  if (changedFields.includes('about') && current.about) conflicts.push('about');
  if (changedFields.includes('hours') && current.hours) conflicts.push('hours');
  if (changedFields.includes('trustChips') && current.trustChips.length) conflicts.push('trustChips');
  const shown = {
    hero: { headline: next.hero.headline, sub: next.hero.sub, image: next.hero.image },
    about: next.about,
    hours: next.hours,
    trustChips: next.trustChips,
  };
  return { proposed: stripProducts(next), changedFields, conflicts, patch: stripProducts(shown) };
}

async function callGrokPatch(input) {
  const key = (process.env.LLM_API_KEY || '').trim();
  if (!key) return null;
  const endpoint = (process.env.LLM_API_URL || 'https://api.x.ai/v1/chat/completions').trim();
  const model = (process.env.LLM_MODEL || 'grok-4-fast').trim();
  const system = [
    'You propose store copy patches for Juvay.',
    'Return JSON only: { hero?: { headline?, sub?, image? }, about?, hours?, trustChips? }.',
    'Only include fields the merchant asked to change.',
    'Do not invent products, prices, SKUs, WhatsApp, payment rails, or shop names.',
    'Do not mention PayPal, Linx, Michelin, free shipping, or TriniBuild.',
    'Do not include products, items, catalog, or skus.',
    'hero.image may only be empty (clear merchant photo) or a starter path /templates/heroes/{food|fashion|services|general|beauty|home|electronics|auto}.jpg.',
    'If the merchant already wrote a field, you may propose a rewrite but the client will show the patch first.',
  ].join(' ');
  const user = JSON.stringify({
    instruction: input.instruction,
    templateId: input.templateId,
    current: {
      hero: { headline: input.current.hero.headline, sub: input.current.hero.sub },
      about: input.current.about,
      hours: input.current.hours,
      trustChips: input.current.trustChips,
    },
    lockedMerchantText: input.locked,
  });
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Grok error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const jsonText = content.replace(/^```json\s*|```$/g, '').trim();
  return JSON.parse(jsonText);
}

async function buildOnboardPatch(body) {
  const checked = validatePatchInput(body || {});
  if (checked.error) return { error: checked.error, status: 400 };
  const input = checked.input;
  if (!grokConfigured()) {
    const empty = mergePatch(input.current, {});
    return {
      ...empty,
      agentWrote: false,
      warning: 'Grok is not writing this change. Nothing was overwritten.',
    };
  }
  try {
    const grok = await callGrokPatch(input);
    const merged = mergePatch(input.current, grok);
    return { ...merged, agentWrote: true };
  } catch (err) {
    const empty = mergePatch(input.current, {});
    return {
      ...empty,
      agentWrote: false,
      warning: 'Grok did not write this change. Your copy is unchanged.',
      detail: err.message,
    };
  }
}

module.exports = {
  STARTER_IDS,
  HERO,
  FAQ_PAY_LINE,
  isStarterId,
  recommendFromText,
  validateOnboardInput,
  buildFallbackDraft,
  sanitizeDraft,
  stripProducts,
  allowedProposedHeroImage,
  grokConfigured,
  buildOnboardDraft,
  validatePatchInput,
  mergePatch,
  currentCopy,
  buildOnboardPatch,
};
