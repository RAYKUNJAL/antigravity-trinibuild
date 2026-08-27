/**
 * Same-origin Wam checkout. Never reads or sends a key.
 * amountCents must equal face. fulfill is always false.
 */
import { getToken } from './selfHostedApi';

export async function startWamCheckout(opts: {
  amountCents: number;
  faceCents: number;
  purpose: string;
  storeId?: string;
}) {
  const face = Number(opts.faceCents);
  const charged = Number(opts.amountCents);
  if (!Number.isFinite(face) || face <= 0) {
    throw new Error('Face amount required');
  }
  if (charged !== face) {
    throw new Error('amountCents must equal face only — processing is display-only');
  }
  const token = getToken();
  if (!token) {
    throw new Error('Sign in to use Wam');
  }
  const res = await fetch('/api/wam/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amountCents: face,
      faceCents: face,
      purpose: opts.purpose,
      storeId: opts.storeId,
      idempotencyKey: crypto.randomUUID?.() || `wam-${Date.now()}`,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Wam checkout failed (${res.status})`);
  return { ...data, fulfill: false as const };
}
