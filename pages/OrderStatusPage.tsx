/**
 * Order confirmation + status. Guest-friendly (order ref in the URL).
 * WhatsApp to the vendor is a wa.me draft. Reorder reloads the shop cart via query.
 * Review form only after the order is completed. 0 reviews is not shown as stars.
 */
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { formatTtdCents } from '../services/juvayFees';

interface Tracked {
  order_ref: string;
  store_name: string | null;
  store_slug: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  fulfillment: string;
  items: any[];
  total_cents: number;
  buyer_name: string;
  buyer_phone_masked: string;
  can_review: boolean;
  has_review: boolean;
  customer_whatsapp: string | null;
  vendor_whatsapp: string | null;
  note?: string;
  fulfill: boolean;
}

function itemLines(items: any[]): string {
  if (!Array.isArray(items)) return '';
  return items.map((l) => {
    const name = l.name || l.item_name || 'Item';
    const qty = l.qty || l.quantity || 1;
    return `${name} ×${qty}`;
  }).join(', ');
}

export default function OrderStatusPage() {
  const { orderRef } = useParams<{ orderRef: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Tracked | null>(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [phone, setPhone] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  const load = () => {
    if (!orderRef) return;
    fetch(`/api/store-orders/track/${encodeURIComponent(orderRef)}`, { headers: { Accept: 'application/json' } })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || 'Order not found');
        setOrder(data);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => { load(); }, [orderRef]);

  const submitReview = async () => {
    if (!order || !orderRef) return;
    setReviewMsg('');
    const r = await fetch(`/api/orders/${encodeURIComponent(orderRef)}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ order_ref: orderRef, buyer_phone: phone, rating, body }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setReviewMsg(data.error || 'Could not save the review.');
      return;
    }
    setReviewMsg('Thank you. Your review is on the shop.');
    load();
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-black text-gray-900">Order not found</h1>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
        <Link to="/" className="mt-4 text-red-600 font-semibold">Back to Juvay</Link>
      </div>
    );
  }
  if (!order) return <p className="p-8 text-center text-gray-500">Loading order…</p>;

  const slug = order.store_slug;
  const reorder = () => {
    if (!slug) return;
    try {
      const key = `juvay.reorder.v1.${slug}`;
      sessionStorage.setItem(key, JSON.stringify(order.items || []));
    } catch { /* ignore */ }
    navigate(`/store/${slug}?reorder=${encodeURIComponent(order.order_ref)}`);
  };

  return (
    <>
      <Helmet>
        <title>{`Order ${order.order_ref} · Juvay`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-red-600">Order confirmed</p>
          <h1 className="text-2xl font-black text-gray-900">{order.order_ref}</h1>
          <p className="text-sm text-gray-600">
            {order.store_name || 'Shop'} · {order.status.replace(/_/g, ' ')}
          </p>
          <p className="text-sm text-gray-700">{itemLines(order.items)}</p>
          <p className="text-lg font-black">You pay {formatTtdCents(order.total_cents)}</p>
          <p className="text-xs text-gray-500">
            {order.fulfillment === 'pickup' ? 'Cash on pickup' : order.payment_method === 'cod' ? 'Cash on delivery' : 'Payment recorded'}.
            A charge does not fulfill the order. Status updates here as the shop works on it.
          </p>
          {order.customer_whatsapp && (
            <a
              href={order.customer_whatsapp}
              className="block w-full min-h-[48px] rounded-xl bg-emerald-600 text-white font-bold text-center leading-[48px]"
              target="_blank"
              rel="noreferrer"
            >
              Tell the shop on WhatsApp
            </a>
          )}
          <p className="text-xs text-gray-500">
            That button opens a WhatsApp draft. Juvay does not send the message for you.
          </p>
          <div className="flex flex-wrap gap-3">
            {slug && (
              <button type="button" onClick={reorder} className="min-h-[44px] px-4 rounded-xl border border-gray-300 text-sm font-semibold">
                Order again
              </button>
            )}
            {slug && (
              <Link to={`/store/${slug}`} className="min-h-[44px] px-4 rounded-xl border border-gray-300 text-sm font-semibold inline-flex items-center">
                Back to shop
              </Link>
            )}
          </div>

          {order.can_review && !order.has_review && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h2 className="font-bold text-gray-900">Leave a review</h2>
              <p className="text-xs text-gray-500">Only for this completed order. Use the phone you placed it with.</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`min-h-[44px] min-w-[44px] rounded-lg border text-sm font-bold ${rating === n ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200'}`}
                    aria-label={`${n} out of 5`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <input
                className="w-full min-h-[44px] rounded-lg border border-gray-200 px-3"
                placeholder="Phone on the order"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <textarea
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                rows={3}
                placeholder="What should other buyers know? (optional)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <button
                type="button"
                disabled={!rating || !phone.trim()}
                onClick={submitReview}
                className="min-h-[44px] px-4 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-50"
              >
                Submit review
              </button>
              {reviewMsg && <p className="text-sm text-gray-700">{reviewMsg}</p>}
            </div>
          )}
          {order.has_review && (
            <p className="text-sm text-gray-600">You already reviewed this order. Thank you.</p>
          )}
        </div>
      </div>
    </>
  );
}
