/**
 * Guest checkout for a Juvay storefront. Name + phone required.
 * Uses CheckoutRails (fee quotes). Cash pickup and COD work without Wam.
 * Online Wam rails disable when not configured. A charge does not fulfill.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { CheckoutRails } from '../CheckoutRails';
import {
  quoteAllRails,
  type FeeQuote,
  type PaymentRail,
  paymentMethodForRail,
} from '../../services/juvayFees';
import { fetchWamStatus } from '../../services/wamStatus';
import type { SelectedModifier } from '../../services/productModifiers';
import type { StorefrontItem, StorefrontModel, StorefrontVariant } from '../../services/storefrontHonesty';
import { formatSelectedModifiers, sumModifierDeltas } from '../../services/productModifiers';

export interface CheckoutLine {
  item: StorefrontItem;
  variant?: StorefrontVariant;
  qty: number;
  note?: string;
  selectedModifiers?: SelectedModifier[];
}

function lineCents(line: CheckoutLine): number {
  const unit = (Number(line.variant?.price ?? line.item.price) || 0) + sumModifierDeltas(line.selectedModifiers);
  return Math.round(unit * 100) * Math.max(1, line.qty);
}

function apiItems(lines: CheckoutLine[]) {
  return lines.map((l) => ({
    id: l.item.id,
    product_id: l.item.id,
    name: l.item.name,
    qty: l.qty,
    quantity: l.qty,
    price: Number(l.variant?.price ?? l.item.price) || 0,
    price_cents: Math.round(((Number(l.variant?.price ?? l.item.price) || 0) + sumModifierDeltas(l.selectedModifiers)) * 100),
    variant: l.variant || undefined,
    selected_modifiers: l.selectedModifiers || undefined,
    note: l.note || undefined,
  }));
}

export const StoreCheckout: React.FC<{
  model: StorefrontModel;
  lines: CheckoutLine[];
  onBack: () => void;
  onPlaced: (result: { order_ref: string; vendor_whatsapp: string | null; note?: string }) => void;
  colors?: { accent: string; accentText: string; text: string; muted: string; border: string; surface: string };
}> = ({ model, lines, onBack, onPlaced, colors }) => {
  const subtotalCents = lines.reduce((s, l) => s + lineCents(l), 0);
  const acceptsPickup = model.acceptsCashPickup !== false;
  const acceptsCod = !!model.acceptsCod;
  const defaultRail: PaymentRail = acceptsPickup ? 'cash_pickup' : acceptsCod ? 'cod' : 'wam_wallet';
  const [rail, setRail] = useState<PaymentRail>(defaultRail);
  const [wamOn, setWamOn] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [apiQuotes, setApiQuotes] = useState<Record<PaymentRail, FeeQuote> | null>(null);

  const local = useMemo(
    () => quoteAllRails({ subtotalCents, planSlug: 'free', deliveryFeeCents: 0 }),
    [subtotalCents],
  );
  const quotes = apiQuotes || local.quotes;

  useEffect(() => {
    fetchWamStatus().then((s) => setWamOn(!!s.configured)).catch(() => setWamOn(false));
    if (!model.storeId) return;
    fetch('/api/orders/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ store_id: model.storeId, subtotal_cents: subtotalCents, delivery_fee_cents: 0 }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (body?.quotes) setApiQuotes(body.quotes);
        if (typeof body?.wam_configured === 'boolean') setWamOn(body.wam_configured);
      })
      .catch(() => { /* keep client quotes */ });
  }, [model.storeId, subtotalCents]);

  // Drop online/COD rails the shop does not accept.
  useEffect(() => {
    if (rail === 'cash_pickup' && !acceptsPickup) setRail(acceptsCod ? 'cod' : 'wam_wallet');
    if (rail === 'cod' && !acceptsCod) setRail(acceptsPickup ? 'cash_pickup' : 'wam_wallet');
  }, [rail, acceptsPickup, acceptsCod]);

  const visibleQuotes = useMemo(() => {
    const q = { ...quotes };
    if (!acceptsPickup) delete (q as any).cash_pickup;
    if (!acceptsCod) delete (q as any).cod;
    return q as Record<PaymentRail, FeeQuote>;
  }, [quotes, acceptsPickup, acceptsCod]);

  const place = async () => {
    setError('');
    const buyerName = name.trim();
    const buyerPhone = phone.trim();
    if (!buyerName || !buyerPhone) {
      setError('Name and phone are required so the shop can reach you. No account needed.');
      return;
    }
    if ((rail === 'cod' || rail === 'cash_pickup') && !cashConfirmed) {
      setError('Please confirm you will have cash ready.');
      return;
    }
    if ((rail === 'wam_wallet' || rail === 'wam_card') && !wamOn) {
      setError('Online Wam pay is not configured on this host. Use cash pickup or cash on delivery.');
      return;
    }
    if (rail === 'cod' && !address.trim()) {
      setError('An address is needed for cash on delivery.');
      return;
    }
    if (!model.storeId) {
      setError('This shop cannot take an in-app order yet. Use WhatsApp if the shop listed a number.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          store_id: model.storeId,
          items: apiItems(lines),
          payment_rail: rail,
          payment_method: paymentMethodForRail(rail),
          fulfillment: rail === 'cash_pickup' || rail === 'wam_wallet' || rail === 'wam_card'
            ? (rail === 'cod' ? 'delivery' : 'pickup')
            : 'delivery',
          delivery_fee_cents: 0,
          customer_name: buyerName,
          customer_phone: buyerPhone,
          customer_email: email.trim() || undefined,
          customer_address: address.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Order failed (${res.status})`);
      const order = body.order || {};
      const ref = order.order_ref || order.orderRef;
      if (!ref) throw new Error('Order was recorded but no reference came back.');
      const mods = (l: CheckoutLine) => {
        const m = formatSelectedModifiers(l.selectedModifiers);
        return `${l.item.name} x${l.qty}${m ? ` (${m})` : ''}`;
      };
      const wa = model.whatsappE164
        ? `https://wa.me/${model.whatsappE164.replace('+', '')}?text=${encodeURIComponent(
          `New Juvay order ${ref} for ${model.storeName}: ${lines.map(mods).join('; ')}.`,
        )}`
        : null;
      onPlaced({ order_ref: ref, vendor_whatsapp: wa, note: body.note });
    } catch (e: any) {
      setError(e.message || 'Could not place the order.');
    } finally {
      setBusy(false);
    }
  };

  const input: React.CSSProperties = {
    width: '100%',
    minHeight: 44,
    border: `1px solid ${colors?.border || '#e5e7eb'}`,
    background: colors?.surface || '#fff',
    color: colors?.text || '#111',
    padding: '0 12px',
    borderRadius: 10,
    fontSize: 15,
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-gray-600">← Back to cart</button>
      <h2 className="text-lg font-black text-gray-900">Checkout</h2>
      <p className="text-xs text-gray-500">No account needed. We use your phone to confirm the order with the shop.</p>
      <label className="block text-sm text-gray-700">
        Your name
        <input style={input} className="mt-1" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
      </label>
      <label className="block text-sm text-gray-700">
        Phone (WhatsApp if you have it)
        <input style={input} className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" required />
      </label>
      <label className="block text-sm text-gray-700">
        Email (optional, for your receipt)
        <input style={input} className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
      </label>
      {(rail === 'cod') && (
        <label className="block text-sm text-gray-700">
          Delivery address
          <input style={input} className="mt-1" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
        </label>
      )}
      {model.prepMinutes != null && model.prepMinutes > 0 && (
        <p className="text-sm text-gray-700">Usually ready in about {model.prepMinutes} minutes — an estimate from the shop.</p>
      )}
      {model.pickupAddress && (rail === 'cash_pickup' || rail === 'wam_wallet' || rail === 'wam_card') && (
        <p className="text-sm text-gray-700"><strong>Pickup</strong> · {model.pickupAddress}</p>
      )}
      {Object.keys(visibleQuotes).length > 0 && quotes[rail] && (
        <CheckoutRails
          quotes={visibleQuotes}
          selected={rail}
          onSelect={setRail}
          wamConfigured={wamOn}
          cashConfirmed={cashConfirmed}
          onCashConfirmed={setCashConfirmed}
        />
      )}
      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="button"
        onClick={place}
        disabled={busy}
        className="w-full min-h-[48px] rounded-xl font-bold text-white disabled:opacity-50"
        style={{ background: colors?.accent || '#111' }}
      >
        {busy ? 'Placing order…' : 'Place order'}
      </button>
      <p className="text-xs text-gray-500">
        A charge does not fulfill the order. Online Wam pay is offered only when configured.
      </p>
    </div>
  );
};

export default StoreCheckout;
