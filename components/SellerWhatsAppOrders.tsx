/**
 * Free WhatsApp new-order drafts (wa.me). Juvay does not send WhatsApp.
 */
import React, { useEffect, useState } from 'react';
import { getToken } from '../services/selfHostedApi';
import { formatTtdCents } from '../services/juvayFees';

interface Row {
  order_ref: string;
  status: string;
  total_cents: number;
  buyer_name: string;
  seller_customer_whatsapp?: string | null;
  customer_whatsapp?: string | null;
}

export const SellerWhatsAppOrders: React.FC = () => {
  const [orders, setOrders] = useState<Row[] | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch('/api/seller/orders', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) return;
        setOrders(body.orders || []);
        setNote(body.whatsapp_note || '');
      })
      .catch(() => {});
  }, []);

  if (!orders || orders.length === 0) return null;

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
      <h2 className="text-lg font-bold text-gray-900">WhatsApp your buyers</h2>
      {note && <p className="text-xs text-gray-500">{note}</p>}
      <ul className="space-y-2">
        {orders.slice(0, 10).map((o) => (
          <li key={o.order_ref} className="flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p className="font-semibold truncate">{o.order_ref} · {o.buyer_name}</p>
              <p className="text-xs text-gray-500">{o.status} · {formatTtdCents(o.total_cents)}</p>
            </div>
            {o.seller_customer_whatsapp ? (
              <a
                href={o.seller_customer_whatsapp}
                target="_blank"
                rel="noreferrer"
                className="min-h-[40px] px-3 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold inline-flex items-center"
              >
                WhatsApp
              </a>
            ) : (
              <span className="text-xs text-gray-400">No phone</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SellerWhatsAppOrders;
