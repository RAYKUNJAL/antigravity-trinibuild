/**
 * Honest vision listing — photo in, { name, description, tags[] } out.
 * Used by POST /api/onboard/vision. Never a price, sku, qty, or products[].
 */

const STARTER_IDS = ['food', 'fashion', 'services', 'general', 'beauty', 'home', 'electronics', 'auto'];

const NO_KEY_WARNING = 'Vision is not writing this listing. Type the name and price yourself.';
const FAIL_WARNING = 'Vision did not write this listing. Type the name and price yourself.';

const BANNED_NAME = new RegExp(
  [
    'sample product',
    'premium quartz',
    'quartz timepiece',
    'classic edition',
    "mama'?s roti",
    'fade kings',
    'isle mode',
    'techport',
    'glow tt',
    'sole trini',
    'casa tt',
    'auto zone tt',
    'vitallife',
    "raj'?s doubles",
    'saveur',
    'michelin',
    'veilux',
    "bloom'?s tea",
  ].join('|'),
  'i'
);

const PRICE_RE = /tt\$\s*[\d,]+|suggested[_ ]price|price[_ ]ttd/i;

function grokConfigured() {
  return !!(process.env.LLM_API_KEY || '').trim();
}

function emptyDraft() {
  return { name: '', description: '', tags: [] };
}

function isStarterId(value) {
  return STARTER_IDS.includes(String(value || ''));
}

function normalizeImage(raw) {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (!s) return '';
  if (s.startsWith('data:image/')) {
    const compact = s.replace(/\s/g, '');
    if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(compact)) return '';
    if (compact.length < 40) return '';
    return compact;
  }
  const b64 = s.replace(/\s/g, '');
  if (/^[A-Za-z0-9+/=]+$/.test(b64) && b64.length > 32) {
    return `data:image/jpeg;base64,${b64}`;
  }
  return '';
}

function validateVisionInput(body) {
  const image = normalizeImage(body?.image || body?.dataUrl || body?.photo);
  if (!image) return { error: 'Image is required', status: 400 };
  if (image.length > 6_000_000) return { error: 'Image is too large', status: 400 };
  const templateId = String(body?.templateId || '').trim();
  if (templateId && !isStarterId(templateId)) {
    return { error: 'templateId must be one of food, fashion, services, general, beauty, home, electronics, auto', status: 400 };
  }
  return {
    input: {
      image,
      templateId: isStarterId(templateId) ? templateId : '',
      storeName: String(body?.storeName || body?.name || '').trim().slice(0, 80),
    },
  };
}

function stripForbiddenKeys(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  const {
    price, suggested_price, suggested_price_ttd, sku, qty, quantity, stock,
    products, items, catalog, skus,
    ...rest
  } = obj;
  return rest;
}

function cleanTag(raw) {
  const tag = String(raw || '').trim().slice(0, 40);
  if (!tag) return '';
  if (PRICE_RE.test(tag) || BANNED_NAME.test(tag)) return '';
  return tag;
}

function sanitizeVisionDraft(raw) {
  const src = stripForbiddenKeys(raw && typeof raw === 'object' ? raw : {});
  let name = String(src.name || src.title || '').trim().slice(0, 120);
  let description = String(src.description || '').trim().slice(0, 600);
  if (BANNED_NAME.test(name) || PRICE_RE.test(name)) name = '';
  if (BANNED_NAME.test(description)) description = '';
  description = description.replace(/tt\$\s*[\d,]+(\.\d+)?/gi, '').replace(/\s+/g, ' ').trim();
  const tags = Array.isArray(src.tags)
    ? src.tags.map(cleanTag).filter(Boolean).slice(0, 8)
    : [];
  return { name, description, tags };
}

function honestNoWrite(warning) {
  return {
    agentWrote: false,
    warning,
    draft: emptyDraft(),
  };
}

async function callGrokVision(input) {
  const key = (process.env.LLM_API_KEY || '').trim();
  if (!key) return null;
  const endpoint = (process.env.LLM_API_URL || 'https://api.x.ai/v1/chat/completions').trim();
  const model = (process.env.LLM_VISION_MODEL || process.env.LLM_MODEL || 'grok-4-fast').trim();
  const system = [
    'You draft ONE product listing from a photo for a Trinidad & Tobago shop on Juvay.',
    'Return JSON only: { "name": string, "description": string, "tags": string[] }.',
    'Name what you actually see. Do not invent a brand, shop, SKU, price, or stock count.',
    'Description: what the photo shows. No price. No TT$. No qty. No SKU.',
    'tags: 0-8 short factual words from the photo. No prices.',
    'NEVER include price, suggested_price, sku, qty, stock, products, or items.',
    'NEVER use Sample Product, Premium Quartz, Quartz Timepiece, or a luxury watch demo.',
    'Never mention PayPal, free shipping, subscribe and save, or TriniBuild.',
    'If the photo is unclear, return empty name and description rather than guessing.',
  ].join(' ');
  const hint = [
    input.storeName ? `Store name (do not copy as the product name): ${input.storeName}` : '',
    input.templateId ? `Starter: ${input.templateId}` : '',
    'Draft name, description, and tags from this photo only.',
  ].filter(Boolean).join(' ');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: [
            { type: 'text', text: hint },
            { type: 'image_url', image_url: { url: input.image } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Vision error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const jsonText = content.replace(/^```json\s*|```$/g, '').trim();
  return JSON.parse(jsonText);
}

async function buildOnboardVision(body) {
  const checked = validateVisionInput(body || {});
  if (checked.error) return { error: checked.error, status: checked.status || 400 };
  const input = checked.input;
  if (!grokConfigured()) {
    return honestNoWrite(NO_KEY_WARNING);
  }
  try {
    const raw = await callGrokVision(input);
    const draft = sanitizeVisionDraft(raw);
    if (!draft.name) {
      return honestNoWrite(FAIL_WARNING);
    }
    return { agentWrote: true, draft };
  } catch (err) {
    return {
      ...honestNoWrite(FAIL_WARNING),
      detail: err.message,
    };
  }
}

module.exports = {
  NO_KEY_WARNING,
  FAIL_WARNING,
  grokConfigured,
  emptyDraft,
  normalizeImage,
  validateVisionInput,
  sanitizeVisionDraft,
  stripForbiddenKeys,
  callGrokVision,
  buildOnboardVision,
};
