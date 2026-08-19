// src/services/mail.js — Transactional email via Resend (zero-dep, fetch). Self-hosted app; email delivery via Resend API.
'use strict';
require('../env');
const RESEND_KEY = process.env.RESEND_API_KEY || '';
const FROM = process.env.EMAIL_FROM || 'Caribbean Trade <no-reply@caribbean-trade.com>';
const brand = '<span style="color:#006D77;font-weight:700">Caribbean Trade Network</span>';

async function send({ to, subject, html, text }){
  if (!RESEND_KEY) return { ok:false, error:'resend_not_configured' };
  const res = await fetch('https://api.resend.com/emails', { method:'POST',
    headers:{ 'Authorization':'Bearer '+RESEND_KEY, 'Content-Type':'application/json' },
    body: JSON.stringify({ from: FROM, to: Array.isArray(to)?to:[to], subject, html: html||'', text: text||'' }),
    signal: AbortSignal.timeout(20000) });
  const d = await res.json().catch(()=>({}));
  if (!res.ok) return { ok:false, error: d.message || `resend_http_${res.status}` };
  return { ok:true, id: d.id };
}

function shell(body){
  return `<div style="font-family:system-ui,sans-serif;color:#123b3f;max-width:560px;margin:auto">
    <div style="padding:20px 24px;background:linear-gradient(135deg,#0b8a94,#00535B);color:#fff;border-radius:12px 12px 0 0"><strong>${'Caribbean Trade Network'}</strong> · powered by R&R Digital Platform Solutions Ltd.</div>
    <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">${body}
    <p style="margin-top:24px;font-size:12px;color:#64748b">This is an automated message from ${brand}. Replies are not monitored. Visit /privacy for how we handle your data.</p></div></div>`;
}

async function sendWelcome(to, name){
  return send({ to, subject:'Welcome to Caribbean Trade Network 🎉',
    html: shell(`<h2 style="margin-top:0">Blessings, ${name||'there'}!</h2><p>Welcome to Caribbean Trade Network — where you can source verified Caribbean suppliers or sell to global buyers.</p>
      <p>Next steps:</p><ul><li><b>Find suppliers:</b> browse the directory at <a href="/browse">/browse</a></li><li><b>Get quotes:</b> post a sourcing request at <a href="/sourcing">/sourcing</a></li><li><b>Estimate costs:</b> use the <a href="/landed-cost">Landed Cost engine</a></li></ul>
      <p>If you own a business listed here, you can <b>claim it in ~3 minutes</b> to receive RFQs and list products.</p>`) });
}

async function sendRfqConfirmation(to, { product, quantity, destination }){
  return send({ to, subject:'Sourcing request received ✔',
    html: shell(`<h2 style="margin-top:0">Sourcing request received</h2><p>We got your request for <b>${product||'your product'}</b>${quantity?' ('+quantity+')':''}${destination?' destined for '+destination:''}.</p>
      <p>We'll notify matching trade-ready suppliers, and you'll receive responses in your dashboard and by email. No subscription required to start sourcing.</p>`) });
}

async function sendClaimNotified(to, businessName){
  return send({ to, subject:'Your claim request is being reviewed',
    html: shell(`<h2 style="margin-top:0">We received your claim for <b>${businessName}</b></h2><p>Our verification team is reviewing it. Once approved, you can add products, receive RFQs, and control your business information.</p>`) });
}

module.exports = { send, sendWelcome, sendRfqConfirmation, sendClaimNotified };
