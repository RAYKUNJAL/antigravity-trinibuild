/**
 * Wam helpers — fail closed. Env NAME only: WAM_API_KEY
 * Never invent a key. Never add processing into amountCents.
 * Webhook does not fulfil an order.
 */
const crypto = require('crypto');

function wamApiKey() {
  return (process.env.WAM_API_KEY || '').trim();
}

function isWamConfigured() {
  return wamApiKey().length > 0;
}

function timingSafeEqualHex(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function expectedSignature(rawBody) {
  return crypto.createHmac('sha256', wamApiKey()).update(rawBody).digest('hex');
}

function headerSignature(req) {
  const raw = req.headers['x-wam-signature'] || req.headers['x-webhook-signature'] || '';
  return String(raw).replace(/^sha256=/i, '').trim();
}

function verifyWamSignature(req, rawBody) {
  if (!isWamConfigured()) return false;
  const got = headerSignature(req);
  if (!got) return false;
  return timingSafeEqualHex(got, expectedSignature(rawBody));
}

module.exports = {
  wamApiKey,
  isWamConfigured,
  expectedSignature,
  headerSignature,
  verifyWamSignature,
};
