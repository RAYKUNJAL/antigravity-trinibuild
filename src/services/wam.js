// src/services/wam.js — Wam Pay integration (Trinidad & Tobago digital payments)
// Native fetch/crypto — no npm SDK dependency. Server-authoritative amounts in TTD cents.
// CRITICAL: only the HMAC-signed webhook marks an order paid. Never trust a client redirect.
'use strict';
const crypto = require('node:crypto');

const WAM_BUSINESS_ID = process.env.WAM_BUSINESS_ID || '';
const WAM_API_KEY = process.env.WAM_API_KEY || '';
const WAM_WEBHOOK_SECRET = process.env.WAM_WEBHOOK_SECRET || '';
const WAM_ENVIRONMENT = process.env.WAM_ENVIRONMENT || 'production';
const WAM_API_BASE = process.env.WAM_API_BASE || 'https://api.wam.money';
const WAM_CHECKOUT_BASE = process.env.WAM_CHECKOUT_BASE || 'https://billing.wam.money';
const WAM_PUBLIC_ORIGIN = process.env.WAM_PUBLIC_ORIGIN || '';

function configured() { return !!(WAM_BUSINESS_ID && WAM_API_KEY && WAM_WEBHOOK_SECRET); }

// Create a payment intent. Amount is server-computed in TTD cents; never accept client amounts.
async function createPaymentIntent({ amountTtd, orderReference, description, returnUrl }) {
  if (!configured()) throw new Error('wam_not_configured');
  const payload = {
    businessId: WAM_BUSINESS_ID,
    amount: Math.round(Number(amountTtd) * 100), // cents
    currency: 'TTD',
    orderReference: orderReference,
    description: description || '',
  };
  if (returnUrl) payload.returnUrl = returnUrl;
  const res = await fetch(`${WAM_API_BASE}/v1/payment-intents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': WAM_API_KEY },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Wam createPaymentIntent ${res.status}: ${data.message || JSON.stringify(data)}`);
  return {
    paymentId: data.paymentId || data.id,
    checkoutUrl: data.checkoutUrl || `${WAM_CHECKOUT_BASE}/pay/invoice/${data.paymentId || data.id}`,
    status: data.status || 'created',
  };
}

// Verify an HMAC-signed Wam webhook. Canonical string is `${timestamp}.${payload}`.
function verifyWebhook({ body, signature, timestamp }) {
  if (!WAM_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac('sha256', WAM_WEBHOOK_SECRET).update(`${timestamp}.${body}`).digest('hex');
  const provided = String(signature || '');
  if (provided.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}

// Map a verified Wam event to our payment state machine.
function parseEvent(body) {
  try { return JSON.parse(body); } catch { return {}; }
}
function eventStatus(event) {
  const t = String(event.event_type || event.type || '').toLowerCase();
  if (t.includes('succeeded') || t.includes('completed') || t === 'payment.completed') return 'PAID';
  if (t.includes('failed') || t.includes('rejected')) return 'FAILED';
  if (t.includes('refund')) return 'REFUNDED';
  return 'PENDING';
}

module.exports = { configured, createPaymentIntent, verifyWebhook, parseEvent, eventStatus, WAM_API_BASE };
