/**
 * CODCheckout.tsx
 * Full Cash-on-Delivery checkout system for Juvay
 * Cash-on-delivery checkout. Rides/delivery rail is not live.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote, CreditCard, Building2, Package, Store,
  MapPin, Phone, User, ChevronRight, ChevronLeft,
  Clock, Shield, CheckCircle, Zap, AlertCircle, Info,
  Camera, Upload, Copy, Check,
  MessageCircle, Truck, Gift, ArrowRight, X, Loader2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { orderService, CreateOrderData } from '../services/orderService';
import { CheckoutRails } from './CheckoutRails';
import { fetchWamStatus } from '../services/wamStatus';
import {
  quoteAllRails,
  paymentMethodForRail,
  formatTtdCents,
  type PaymentRail,
  type FeeQuote,
} from '../services/juvayFees';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
}

export interface StoreInfo {
  id?: string;
  name: string;
  whatsapp?: string;
  location?: string;
  logo?: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
}

type PaymentMethod = PaymentRail;
type DeliveryMethod = 'standard' | 'express' | 'pickup';
type CheckoutStep = 'details' | 'delivery' | 'payment' | 'review' | 'confirmed';

interface CheckoutState {
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  landmark: string;
  notes: string;
  delivery: DeliveryMethod;
  payment: PaymentMethod;
  transferProof: string | null;
  scheduleNow: boolean;
  scheduledDate: string;
  scheduledTime: string;
  cashConfirmed: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  standard: 30,
  express: 60,
  pickup: 0,
};

const FREE_DELIVERY_THRESHOLD = 200;

// ─── Step Indicator ───────────────────────────────────────────────────────────

const StepDots: React.FC<{ step: CheckoutStep }> = ({ step }) => {
  const steps: CheckoutStep[] = ['details', 'delivery', 'payment', 'review'];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === idx ? 24 : 8,
              background: i <= idx ? '#E61E2B' : '#e5e7eb',
            }}
          />
        </React.Fragment>
      ))}
      <span className="ml-2 text-xs text-gray-400 font-semibold capitalize">{step}</span>
    </div>
  );
};

// ─── Bank Transfer Panel ──────────────────────────────────────────────────────

const BankTransferPanel: React.FC<{
  store: StoreInfo;
  amount: number;
  onProofUpload: (url: string) => void;
  proof: string | null;
}> = ({ store, amount, onProofUpload, proof }) => {
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const ref = React.useRef<HTMLInputElement>(null);

  const copyAccount = () => {
    navigator.clipboard.writeText(store.bank_account || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `transfer-proofs/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('store-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('store-assets').getPublicUrl(path);
      onProofUpload(urlData.publicUrl);
    } catch {
      // fallback: use object URL
      onProofUpload(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bank details card */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-blue-600" />
          <span className="font-black text-blue-900">Transfer Details</span>
        </div>
        <div className="space-y-3">
          {[
            store.bank_name ? ['Bank', store.bank_name] : null,
            ['Account Name', store.bank_holder || store.name],
            store.bank_account ? ['Account #', store.bank_account] : null,
            ['Amount', `TT$${amount.toFixed(2)}`],
          ].filter((row): row is [string, string] => Array.isArray(row)).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-blue-600 font-semibold">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-blue-900">{value}</span>
                {label === 'Account #' && (
                  <button onClick={copyAccount} className="text-blue-500 hover:text-blue-700">
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reference note */}
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
        <Info size={13} className="flex-shrink-0 mt-0.5" />
        Use your phone number as the transfer reference so the store can identify your payment.
      </div>

      {/* Proof upload */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
          Upload Payment Screenshot
        </p>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {proof ? (
          <div className="relative rounded-xl overflow-hidden border border-green-300">
            <img src={proof} alt="Transfer proof" className="w-full h-32 object-cover" />
            <div className="absolute top-2 right-2">
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check size={10} /> Uploaded
              </span>
            </div>
            <button
              onClick={() => ref.current?.click()}
              className="absolute bottom-2 right-2 bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded-lg shadow"
            >
              Replace
            </button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-400 hover:border-gray-400 transition-colors"
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-gray-400" />
            ) : (
              <Camera size={20} />
            )}
            <span className="text-xs font-semibold">
              {uploading ? 'Uploading…' : 'Tap to upload proof of payment'}
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

// ─── Order Summary Sidebar ────────────────────────────────────────────────────

const OrderSummary: React.FC<{
  items: CartItem[];
  deliveryFee: number;
  discount: number;
  payment: PaymentMethod;
}> = ({ items, deliveryFee, discount, payment }) => {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + deliveryFee - discount;

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Order Summary</h3>

      {/* Items */}
      <ul className="space-y-3">
        {items.map(item => (
          <li key={`${item.id}-${item.variant}`} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</p>
              <p className="text-xs text-gray-400">Qty {item.quantity}</p>
            </div>
            <p className="text-xs font-black text-gray-800">TT${(item.price * item.quantity).toFixed(2)}</p>
          </li>
        ))}
      </ul>

      <div className="h-px bg-gray-200" />

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal</span>
          <span className="font-semibold text-gray-800">TT${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Delivery</span>
          <span className={`font-semibold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-800'}`}>
            {deliveryFee === 0 ? 'FREE' : `TT$${deliveryFee}`}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span className="font-bold">−TT${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="h-px bg-gray-200" />
        <div className="flex justify-between font-black text-base">
          <span>Total</span>
          <span style={{ color: '#E61E2B' }}>TT${total.toFixed(2)}</span>
        </div>
        {(payment === 'cod' || payment === 'cash_pickup') && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-3 mt-2">
            <p className="text-xs text-green-700 font-semibold">💵 Cash to prepare</p>
            <p className="text-xl font-black text-green-800 mt-0.5">TT${total.toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-1">Have this ready for the driver</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main CODCheckout Component ───────────────────────────────────────────────

interface CODCheckoutProps {
  items: CartItem[];
  store: StoreInfo;
  onComplete: (orderId: string, method: PaymentMethod) => void;
  onBack: () => void;
}

export const CODCheckout: React.FC<CODCheckoutProps> = ({ items, store, onComplete, onBack }) => {
  const [step, setStep] = useState<CheckoutStep>('details');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CheckoutState>({
    name: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    landmark: '',
    notes: '',
    delivery: 'pickup',
    payment: 'cash_pickup',
    transferProof: null,
    scheduleNow: true,
    scheduledDate: '',
    scheduledTime: '',
    cashConfirmed: false,
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;

  const deliveryFee = useCallback(() => {
    if (form.delivery === 'pickup') return 0;
    if (isFreeDelivery && form.delivery === 'standard') return 0;
    return DELIVERY_FEES[form.delivery];
  }, [form.delivery, isFreeDelivery]);

  const deliveryFeeDollars = deliveryFee();
  const subtotalCents = Math.round(subtotal * 100);
  const deliveryFeeCents = Math.round(deliveryFeeDollars * 100);
  const [wamConfigured, setWamConfigured] = useState(false);
  const [quotes, setQuotes] = useState<Record<PaymentRail, FeeQuote>>(() =>
    quoteAllRails({ subtotalCents, deliveryFeeCents, planSlug: 'free' }).quotes
  );

  useEffect(() => {
    fetchWamStatus().then((s) => setWamConfigured(s.configured));
  }, []);

  useEffect(() => {
    const local = quoteAllRails({ subtotalCents, deliveryFeeCents, planSlug: 'free' }).quotes;
    setQuotes(local);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/orders/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            store_id: store.id,
            items: items.map((i) => ({
              product_id: i.id,
              name: i.name,
              quantity: i.quantity,
              price: i.price,
            })),
            delivery_fee: deliveryFeeDollars,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data?.quotes) {
          setQuotes(data.quotes);
          if (typeof data.wam_configured === 'boolean') setWamConfigured(data.wam_configured);
        }
      } catch {
        /* keep local quote — server is source of truth when reachable */
      }
    })();
    return () => { cancelled = true; };
  }, [subtotalCents, deliveryFeeCents, store.id, items, deliveryFeeDollars]);

  const selectedQuote = quotes[form.payment];
  const total = (selectedQuote?.total_buyer_pays_cents ?? Math.round((subtotal + deliveryFeeDollars) * 100)) / 100;

  const update = (key: keyof CheckoutState, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 'details':
        return !!(form.name.trim() && form.phone.trim() && form.address.trim() && form.city.trim());
      case 'delivery':
        return true;
      case 'payment':
        if (form.payment === 'cod' || form.payment === 'cash_pickup') return form.cashConfirmed;
        if (form.payment === 'wam_wallet' || form.payment === 'wam_card') return wamConfigured;
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  }, [step, form, wamConfigured]);

  const stepOrder: CheckoutStep[] = ['details', 'delivery', 'payment', 'review'];

  const goNext = () => {
    const idx = stepOrder.indexOf(step);
    if (idx < stepOrder.length - 1) setStep(stepOrder[idx + 1]);
  };

  const goBack = () => {
    const idx = stepOrder.indexOf(step);
    if (idx > 0) setStep(stepOrder[idx - 1]);
    else onBack();
  };

  const placeOrder = async () => {
    setSubmitting(true);
    setError('');
    try {
      const rail: PaymentRail = form.payment;
      const paymentMethod = paymentMethodForRail(rail);
      const fulfillment = form.delivery === 'pickup' ? 'pickup' : 'delivery';
      const payload = {
        store_id: store.id,
        items: items.map((i) => ({
          product_id: String(i.id),
          productId: String(i.id),
          quantity: i.quantity,
          price: i.price,
          name: i.name,
        })),
        payment_method: paymentMethod,
        payment_rail: rail,
        fulfillment,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: `${form.address}${form.landmark ? ` (near ${form.landmark})` : ''}, ${form.city}`,
        delivery_fee: deliveryFeeDollars,
        notes: form.notes || undefined,
      };

      let order: { id?: string; order_ref?: string; order_number?: string } | null = null;
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          // Fall back to the legacy cash path only when store_orders is not migrated,
          // and only for cash rails — never pretend a Wam charge succeeded.
          const migr = res.status === 503 && /not migrated/i.test(String(data.error || ''));
          if (!migr || paymentMethod === 'wam') {
            throw new Error(data.error || `Checkout failed (${res.status})`);
          }
          const orderData: CreateOrderData = {
            storeId: store.id!,
            items: items.map(i => ({
              productId: String(i.id),
              quantity: i.quantity,
              price: i.price,
              name: i.name,
            })),
            shippingAddress: {
              name: form.name,
              phone: form.phone,
              street: form.address + (form.landmark ? ` (near ${form.landmark})` : ''),
              city: form.city,
            },
            paymentMethod: paymentMethod === 'cash_pickup' ? 'cod' : 'cod',
            deliveryOption: form.delivery === 'express' ? 'express' :
                            form.delivery === 'pickup' ? 'pickup' : 'standard',
            notes: form.notes,
            email: '',
          };
          const legacy = await orderService.createOrder(orderData);
          order = legacy;
        } else {
          order = data.order || data;
        }
      } catch (err: any) {
        throw err;
      }

      const orderLabel = order?.order_ref || order?.order_number || (order?.id ? String(order.id) : '');
      const payLabel =
        rail === 'wam_wallet' ? 'Wam wallet (awaiting payment — a charge does not fulfill the order)' :
        rail === 'wam_card' ? 'Card via Wam (awaiting payment — a charge does not fulfill the order)' :
        rail === 'cash_pickup' ? 'Cash pickup' : 'Cash on delivery';

      // WhatsApp confirmation
      if (store.whatsapp) {
        const msg = [
          `🛒 *New Order from Juvay*`,
          `Order: ${orderLabel || 'pending'}`,
          `Customer: ${form.name} · ${form.phone}`,
          `Deliver to: ${form.address}, ${form.city}`,
          `Items: ${items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`,
          `Total: ${formatTtdCents(selectedQuote?.total_buyer_pays_cents ?? Math.round(total * 100))}`,
          `Payment: ${payLabel}`,
          `Delivery: ${form.delivery}`,
        ].join('\n');
        window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      setStep('confirmed');
      onComplete(orderLabel || String(Date.now()), form.payment);
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step renderers ─────────────────────────────────────────────────────────

  const renderDetails = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">Your Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: 'name', label: 'Full Name', placeholder: 'John Mohammed', icon: User },
          { key: 'phone', label: 'Phone Number', placeholder: '868-XXX-XXXX', icon: Phone, type: 'tel' },
        ].map(({ key, label, placeholder, icon: Icon, type }) => (
          <div key={key}>
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5 block">{label}</label>
            <div className="relative">
              <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={type || 'text'}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={e => update(key as keyof CheckoutState, e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5 block">
          WhatsApp Number <span className="text-gray-300 font-normal">(if different)</span>
        </label>
        <div className="relative">
          <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="tel"
            placeholder="Leave blank if same as phone"
            value={form.whatsapp}
            onChange={e => update('whatsapp', e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all bg-white"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5 block">Delivery Address</label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Street address or village"
            value={form.address}
            onChange={e => update('address', e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5 block">City / Town</label>
          <input
            type="text"
            placeholder="Port of Spain"
            value={form.city}
            onChange={e => update('city', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5 block">
            Landmark <span className="text-gray-300 font-normal">(opt)</span>
          </label>
          <input
            type="text"
            placeholder="Near BP gas station"
            value={form.landmark}
            onChange={e => update('landmark', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5 block">
          Order Notes <span className="text-gray-300 font-normal">(optional)</span>
        </label>
        <textarea
          rows={2}
          placeholder="Special instructions, apartment number, gate code…"
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-white"
        />
      </div>
    </div>
  );

  const renderDelivery = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">Choose Delivery</h2>

      {/* Standard delivery */}
      <DeliveryOption
        selected={form.delivery === 'standard'}
        onSelect={() => update('delivery', 'standard')}
        icon={Truck}
        title="Standard Delivery"
        subtitle="2–4 days · Island-wide"
        price={isFreeDelivery ? 'FREE' : 'TT$30'}
        freeNote={isFreeDelivery ? 'Free because order > TT$200' : undefined}
        eta="2–4 days"
      />

      <DeliveryOption
        selected={form.delivery === 'express'}
        onSelect={() => update('delivery', 'express')}
        icon={Zap}
        title="Express Delivery"
        subtitle="Next working day"
        price="TT$60"
        eta="Tomorrow"
        accent
      />

      <DeliveryOption
        selected={form.delivery === 'pickup'}
        onSelect={() => update('delivery', 'pickup')}
        icon={Store}
        title="Store Pickup"
        subtitle={store.location ? `Collect from ${store.location}` : 'Collect from store'}
        price="FREE"
        eta="2 hours"
      />

      {/* Schedule */}
      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Delivery Time</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { val: true, label: 'As soon as possible', icon: Zap },
            { val: false, label: 'Schedule for later', icon: Clock },
          ].map(({ val, label, icon: Icon }) => (
            <button
              key={String(val)}
              onClick={() => update('scheduleNow', val)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all"
              style={form.scheduleNow === val
                ? { borderColor: '#E61E2B', background: '#FEF2F2', color: '#E61E2B' }
                : { borderColor: '#e5e7eb', color: '#6b7280' }
              }
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        {!form.scheduleNow && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={form.scheduledDate}
              onChange={e => update('scheduledDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
            <select
              value={form.scheduledTime}
              onChange={e => update('scheduledTime', e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="">Select time</option>
              {['8:00–10:00 AM','10:00 AM–12:00 PM','12:00–2:00 PM','2:00–4:00 PM','4:00–6:00 PM','6:00–8:00 PM'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );

  const renderPayment = () => (
    <CheckoutRails
      quotes={quotes}
      selected={form.payment}
      onSelect={(rail) => {
        update('payment', rail);
        if (rail !== 'cod' && rail !== 'cash_pickup') update('cashConfirmed', false);
      }}
      wamConfigured={wamConfigured}
      cashConfirmed={form.cashConfirmed}
      onCashConfirmed={(v) => update('cashConfirmed', v)}
    />
  );

  const renderReview = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-900">Review Order</h2>

        {/* Sections */}
        {[
          {
            title: 'Deliver to',
            items: [
              [form.name, form.phone],
              [`${form.address}${form.landmark ? `, near ${form.landmark}` : ''}`, form.city],
            ]
          },
          {
            title: 'Delivery',
            items: [
              [
                form.delivery === 'express' ? 'Express Delivery' :
                form.delivery === 'pickup' ? 'Store Pickup' : 'Standard Delivery',
                form.scheduleNow ? 'As soon as possible' : `${form.scheduledDate} ${form.scheduledTime}`
              ]
            ]
          },
          {
            title: 'Payment',
            items: [[
              form.payment === 'wam_wallet' ? 'Wam wallet' :
              form.payment === 'wam_card' ? 'Card via Wam' :
              form.payment === 'cash_pickup' ? 'Cash pickup' : 'Cash on delivery',
              form.payment === 'wam_wallet' || form.payment === 'wam_card'
                ? `You pay ${formatTtdCents(selectedQuote?.total_buyer_pays_cents ?? Math.round(total * 100))} — awaiting payment`
                : `Prepare ${formatTtdCents(selectedQuote?.total_buyer_pays_cents ?? Math.round(total * 100))} cash`
            ]]
          }
        ].map(section => (
          <div key={section.title} className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{section.title}</p>
            {section.items.map(([a, b], i) => (
              <div key={i} className="flex justify-between items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-800">{a}</span>
                <span className="text-xs text-gray-500 text-right">{b}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Items preview */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Items ({items.reduce((s, i) => s + i.quantity, 0)})</p>
          <div className="flex flex-wrap gap-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-gray-100">
                <span className="text-xs font-bold text-gray-700">{item.quantity}×</span>
                <span className="text-xs text-gray-600">{item.name}</span>
                <span className="text-xs font-black" style={{ color: '#E61E2B' }}>TT${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 font-semibold">{error}</p>
          </div>
        )}
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'details': return renderDetails();
      case 'delivery': return renderDelivery();
      case 'payment': return renderPayment();
      case 'review': return renderReview();
      default: return null;
    }
  };

  if (step === 'confirmed') return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

        {/* Main form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <StepDots step={step} />


          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={15} /> {step === 'details' ? 'Back to Cart' : 'Back'}
            </button>
            {step !== 'review' ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={goNext}
                disabled={!canProceed()}
                className="flex-1 py-3 rounded-xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{ background: '#E61E2B' }}
              >
                Continue <ChevronRight size={15} />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={placeOrder}
                disabled={submitting || !canProceed()}
                className="flex-1 py-3 rounded-xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                style={{ background: submitting ? '#9ca3af' : '#E61E2B' }}
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Placing Order…</>
                ) : (
                  <>Place Order <ArrowRight size={15} /></>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="lg:sticky lg:top-24">
          <OrderSummary
            items={items}
            deliveryFee={deliveryFee()}
            discount={0}
            payment={form.payment}
          />
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 justify-center">
            <Shield size={12} />
            Secure checkout by Juvay
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Small Delivery Option component ─────────────────────────────────────────

const DeliveryOption: React.FC<{
  selected: boolean;
  onSelect: () => void;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  price: string;
  eta: string;
  accent?: boolean;
  freeNote?: string;
}> = ({ selected, onSelect, icon: Icon, title, subtitle, price, eta, accent, freeNote }) => (
  <motion.button
    onClick={onSelect}
    whileTap={{ scale: 0.98 }}
    className="w-full text-left rounded-2xl border-2 p-4 transition-all"
    style={selected
      ? { borderColor: '#E61E2B', background: '#FEF2F2' }
      : { borderColor: '#e5e7eb', background: '#fff' }
    }
  >
    <div className="flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: selected ? '#FEE2E2' : '#f3f4f6' }}
      >
        <Icon size={18} style={{ color: selected ? '#E61E2B' : '#6b7280' }} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gray-900">{title}</span>
          {accent && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">FAST</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        {freeNote && <p className="text-xs text-green-600 font-semibold mt-0.5">{freeNote}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-black text-sm" style={{ color: price === 'FREE' ? '#16a34a' : '#E61E2B' }}>{price}</p>
        <p className="text-xs text-gray-400">{eta}</p>
      </div>
    </div>
  </motion.button>
);
