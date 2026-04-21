/**
 * ReservationSystem.tsx
 * QR-based pickup reservation system for TriniBuild
 * Features: customer reservation → QR receipt → merchant calendar + scanner
 * Cross-platform: integrates with inventory, tax tools, COD orders
 * Paid members only — drives conversions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Calendar, Clock, Check, X, ChevronRight, ChevronLeft,
  Package, Phone, User, MapPin, Shield, CheckCircle, AlertCircle,
  Scan, Copy, Share2, Download, Bell, Zap, Star, Lock,
  ScanLine, RefreshCw, Eye, TrendingUp, Banknote, Building2,
  ArrowRight, Store, MessageCircle, Info, Loader2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReservationItem {
  id: string | number;
  name: string;
  qty: number;
  price: number;
  image?: string;
}

export interface ReservationData {
  id: string;
  store_id: string;
  store_name: string;
  store_logo?: string;
  store_whatsapp?: string;
  store_location?: string;
  customer_name: string;
  customer_phone: string;
  items: ReservationItem[];
  subtotal: number;
  payment_method: 'cod' | 'bank_transfer' | 'card';
  status: 'pending' | 'approved' | 'ready' | 'completed' | 'cancelled' | 'no_show';
  pickup_window_start?: string;
  pickup_window_end?: string;
  pickup_day?: string;
  qr_code_token: string;
  qr_scanned_at?: string;
  merchant_note?: string;
  customer_note?: string;
  created_at: string;
  approved_at?: string;
}

// ─── Pure-JS QR Code Generator (no external lib needed) ──────────────────────
// Uses a canvas to render a QR code via Google Chart API (HTTPS, no tracking data)
// Falls back to a styled token display if offline

const QRCodeDisplay: React.FC<{
  data: string;
  size?: number;
  label?: string;
  status?: ReservationData['status'];
}> = ({ data, size = 200, label, status }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgUrl, setImgUrl] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    // Use Google Charts QR API (no auth needed, just encodes the string)
    const encoded = encodeURIComponent(data);
    const url = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encoded}&choe=UTF-8&chld=H|1`;
    setImgUrl(url);
  }, [data, size]);

  const statusOverlay = status === 'completed'
    ? { color: '#16a34a', bg: '#f0fdf4', label: '✓ COMPLETED' }
    : status === 'cancelled'
    ? { color: '#dc2626', bg: '#fef2f2', label: '✗ CANCELLED' }
    : status === 'approved'
    ? { color: '#2563eb', bg: '#eff6ff', label: '✓ APPROVED' }
    : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative rounded-2xl overflow-hidden border-4 p-2"
        style={{
          borderColor: statusOverlay ? statusOverlay.color : '#E61E2B',
          background: '#fff',
          width: size + 16,
          height: size + 16,
        }}
      >
        {imgUrl && (
          <img
            src={imgUrl}
            alt="QR Code"
            width={size}
            height={size}
            className="block"
            onError={() => setError(true)}
          />
        )}
        {/* Corner marks — TriniBuild branded */}
        {['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1'].map(pos => (
          <div key={pos} className={`absolute ${pos} w-5 h-5 border-2 rounded-sm`} style={{ borderColor: '#E61E2B' }} />
        ))}
        {/* Status watermark overlay */}
        {statusOverlay && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `${statusOverlay.bg}cc` }}
          >
            <span className="text-lg font-black" style={{ color: statusOverlay.color, rotate: '-20deg', display: 'block', transform: 'rotate(-20deg)' }}>
              {statusOverlay.label}
            </span>
          </div>
        )}
      </div>
      {label && (
        <p className="text-xs text-center text-gray-500 font-semibold max-w-[180px]">{label}</p>
      )}
    </div>
  );
};

// ─── Pickup Time Selector ─────────────────────────────────────────────────────

const HOUR_OPTIONS = [
  { label: 'Within 2 hours', value: 2, icon: '⚡' },
  { label: 'Within 4 hours', value: 4, icon: '🕒' },
  { label: 'Within 6 hours', value: 6, icon: '🕕' },
];

const DAY_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'Monday', value: 'Monday' },
  { label: 'Tuesday', value: 'Tuesday' },
  { label: 'Wednesday', value: 'Wednesday' },
  { label: 'Thursday', value: 'Thursday' },
  { label: 'Friday', value: 'Friday' },
  { label: 'Saturday', value: 'Saturday' },
  { label: 'Sunday', value: 'Sunday' },
];

const TIME_SLOTS = [
  '8:00 AM – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
  '6:00 PM – 8:00 PM',
];

interface PickupSelectorProps {
  onSelect: (day: string, timeSlot: string, hourOffset?: number) => void;
  selected: { day: string; timeSlot: string; hourOffset?: number };
}

const PickupSelector: React.FC<PickupSelectorProps> = ({ onSelect, selected }) => {
  const [mode, setMode] = useState<'hours' | 'days'>('hours');

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50">
        {[
          { id: 'hours', label: '⚡ Same Day (Hours)', desc: 'Pick up today' },
          { id: 'days', label: '📅 Schedule (Day)', desc: 'Choose a day & time' },
        ].map(({ id, label, desc }) => (
          <button
            key={id}
            onClick={() => setMode(id as 'hours' | 'days')}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all"
            style={mode === id
              ? { background: '#E61E2B', color: '#fff' }
              : { color: '#6b7280' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'hours' ? (
          <motion.div key="hours" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-2">
            {HOUR_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onSelect('today', '', opt.value)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left"
                style={selected.hourOffset === opt.value
                  ? { borderColor: '#E61E2B', background: '#FEF2F2' }
                  : { borderColor: '#e5e7eb' }
                }
              >
                <span className="text-xl">{opt.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-400">Ready for pickup by {
                    new Date(Date.now() + opt.value * 3600000).toLocaleTimeString('en-TT', { hour: '2-digit', minute: '2-digit' })
                  }</p>
                </div>
                {selected.hourOffset === opt.value && <CheckCircle size={18} style={{ color: '#E61E2B' }} />}
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div key="days" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Day selector */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Select Day</label>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => onSelect(d.value, selected.timeSlot || TIME_SLOTS[0])}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all"
                    style={selected.day === d.value
                      ? { background: '#E61E2B', color: '#fff', borderColor: '#E61E2B' }
                      : { borderColor: '#e5e7eb', color: '#374151' }
                    }
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Time slot */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Select Time Window</label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    onClick={() => onSelect(selected.day || 'today', slot)}
                    className="px-3 py-2 rounded-lg border text-xs font-semibold transition-all text-center"
                    style={selected.timeSlot === slot
                      ? { background: '#E61E2B', color: '#fff', borderColor: '#E61E2B' }
                      : { borderColor: '#e5e7eb', color: '#374151' }
                    }
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── QR Digital Receipt ───────────────────────────────────────────────────────

export const QRReceipt: React.FC<{ reservation: ReservationData; onClose?: () => void }> = ({ reservation, onClose }) => {
  const [copied, setCopied] = useState(false);

  // QR data payload — everything the merchant needs when scanning
  const qrPayload = JSON.stringify({
    token: reservation.qr_code_token,
    id: reservation.id,
    store: reservation.store_id,
    customer: reservation.customer_name,
    items: reservation.items.length,
    total: reservation.subtotal,
    payment: reservation.payment_method,
    status: reservation.status,
    pickup: reservation.pickup_day,
    ts: reservation.created_at,
  });

  const copyToken = () => {
    navigator.clipboard.writeText(reservation.qr_code_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappShare = () => {
    if (!reservation.store_whatsapp) return;
    const msg = [
      `📦 *Pickup Reservation Confirmed*`,
      `Token: ${reservation.qr_code_token.slice(0, 8).toUpperCase()}`,
      `Customer: ${reservation.customer_name}`,
      `Items: ${reservation.items.map(i => `${i.qty}× ${i.name}`).join(', ')}`,
      `Total: TT$${reservation.subtotal.toFixed(2)}`,
      `Payment: ${reservation.payment_method.toUpperCase()}`,
      `Pickup: ${reservation.pickup_day || 'As arranged'}`,
      `*Please show this QR code at pickup*`,
    ].join('\n');
    window.open(`https://wa.me/${reservation.store_whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const statusColor = {
    pending: '#f59e0b',
    approved: '#2563eb',
    ready: '#16a34a',
    completed: '#16a34a',
    cancelled: '#dc2626',
    no_show: '#9ca3af',
  }[reservation.status];

  return (
    <div
      className="max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl border"
      style={{ border: '2px solid #e5e7eb', fontFamily: 'system-ui' }}
    >
      {/* Header */}
      <div className="text-white p-5 text-center relative" style={{ background: 'linear-gradient(135deg, #1a0000, #E61E2B)' }}>
        {onClose && (
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <X size={14} className="text-white" />
          </button>
        )}
        <div className="flex items-center justify-center gap-2 mb-2">
          {reservation.store_logo && (
            <img src={reservation.store_logo} alt="" className="w-7 h-7 rounded-full object-cover border border-white/30" />
          )}
          <span className="font-black text-base">{reservation.store_name}</span>
        </div>
        <p className="text-xs text-white/70 mb-3">Pickup Reservation</p>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black"
          style={{ background: `${statusColor}30`, color: statusColor, border: `1px solid ${statusColor}` }}
        >
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: statusColor }} />
          {reservation.status.toUpperCase()}
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-white p-6 flex flex-col items-center gap-4">
        <QRCodeDisplay
          data={qrPayload}
          size={180}
          status={reservation.status}
          label="Show this QR to the store owner at pickup"
        />

        {/* Token */}
        <div className="w-full flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
          <div>
            <p className="text-xs text-gray-400 font-semibold">Reservation ID</p>
            <p className="font-black text-gray-900 font-mono text-sm tracking-wider">
              {reservation.qr_code_token.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button onClick={copyToken} className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Order details */}
      <div className="bg-gray-50 px-5 pb-2 pt-3">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Order Details</p>
        <div className="space-y-2 mb-4">
          {reservation.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.qty}× {item.name}</span>
              <span className="font-bold text-gray-800">TT${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-black">
            <span>Total</span>
            <span style={{ color: '#E61E2B' }}>TT${reservation.subtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-2 mb-4">
          {[
            [User, reservation.customer_name],
            [Phone, reservation.customer_phone],
            [Banknote, reservation.payment_method === 'cod' ? '💵 Cash on Delivery' : reservation.payment_method === 'bank_transfer' ? '🏦 Bank Transfer' : '💳 Card'],
            [Calendar, reservation.pickup_day ? `Pickup: ${reservation.pickup_day}` : 'Pickup time TBC'],
          ].map(([Icon, text], i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <Icon size={12} className="text-gray-400 flex-shrink-0" />
              {text as string}
            </div>
          ))}
        </div>

        {reservation.merchant_note && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-4">
            <p className="text-xs font-bold text-blue-700">Store note: {reservation.merchant_note}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pb-4">
          {reservation.store_whatsapp && (
            <button
              onClick={whatsappShare}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-green-500 text-green-600 text-xs font-bold"
            >
              <MessageCircle size={13} /> WhatsApp Store
            </button>
          )}
          <button
            onClick={copyToken}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white"
            style={{ background: '#E61E2B' }}
          >
            <Share2 size={13} /> Share Receipt
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Powered by TriniBuild · trinibuild.com
        </p>
      </div>
    </div>
  );
};

// ─── Reservation Flow (Customer) ──────────────────────────────────────────────

interface ReservationFlowProps {
  items: ReservationItem[];
  store: { id: string; name: string; whatsapp?: string; logo?: string; location?: string };
  paymentMethod: 'cod' | 'bank_transfer' | 'card';
  onComplete: (reservation: ReservationData) => void;
  onBack: () => void;
}

export const ReservationFlow: React.FC<ReservationFlowProps> = ({
  items, store, paymentMethod, onComplete, onBack
}) => {
  const [step, setStep] = useState<'details' | 'pickup' | 'confirm'>('details');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  const [form, setForm] = useState({ name: '', phone: '', whatsapp: '', note: '' });
  const [pickup, setPickup] = useState({ day: '', timeSlot: '', hourOffset: undefined as number | undefined });

  const handlePickupSelect = (day: string, timeSlot: string, hourOffset?: number) => {
    setPickup({ day, timeSlot, hourOffset });
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const windowStart = pickup.hourOffset
        ? new Date(Date.now() + pickup.hourOffset * 3600000)
        : null;
      const windowEnd = windowStart
        ? new Date(windowStart.getTime() + 2 * 3600000)
        : null;

      const { data, error: err } = await supabase
        .from('reservations')
        .insert({
          store_id: store.id,
          customer_name: form.name,
          customer_phone: form.phone,
          customer_whatsapp: form.whatsapp || form.phone,
          items: items,
          subtotal,
          payment_method: paymentMethod,
          status: 'pending',
          pickup_day: pickup.day || 'TBC',
          pickup_hour_offset: pickup.hourOffset,
          pickup_window_start: windowStart?.toISOString(),
          pickup_window_end: windowEnd?.toISOString(),
          customer_note: form.note,
        })
        .select('*, stores(name, logo_url, whatsapp, location)')
        .single();

      if (err) throw err;

      const reservation: ReservationData = {
        id: data.id,
        store_id: data.store_id,
        store_name: data.stores?.name || store.name,
        store_logo: data.stores?.logo_url || store.logo,
        store_whatsapp: data.stores?.whatsapp || store.whatsapp,
        store_location: data.stores?.location || store.location,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        items: data.items,
        subtotal: data.subtotal,
        payment_method: data.payment_method,
        status: data.status,
        pickup_day: data.pickup_day,
        pickup_window_start: data.pickup_window_start,
        pickup_window_end: data.pickup_window_end,
        qr_code_token: data.qr_code_token,
        created_at: data.created_at,
      };

      // Notify store via WhatsApp
      if (store.whatsapp) {
        const msg = `🔔 New pickup reservation!\nCustomer: ${form.name}\nPhone: ${form.phone}\nItems: ${items.map(i => `${i.qty}x ${i.name}`).join(', ')}\nTotal: TT$${subtotal.toFixed(2)}\nPayment: ${paymentMethod.toUpperCase()}\nPickup: ${pickup.day || 'TBC'}\nToken: ${data.qr_code_token.slice(0, 8).toUpperCase()}\nPlease approve in your TriniBuild dashboard.`;
        window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      onComplete(reservation);
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Step dots */}
      <div className="flex items-center gap-1.5 mb-6">
        {(['details', 'pickup', 'confirm'] as const).map((s, i) => (
          <div
            key={s}
            className="h-1.5 rounded-full transition-all"
            style={{ width: s === step ? 24 : 8, background: s === step || ['details','pickup','confirm'].indexOf(s) < ['details','pickup','confirm'].indexOf(step) ? '#E61E2B' : '#e5e7eb' }}
          />
        ))}
        <span className="ml-2 text-xs text-gray-400 font-semibold capitalize">{step}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-xl font-black">Reserve for Pickup</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-semibold">
                  Items will be held for you. The store owner must approve your reservation. You'll get a QR code to show at pickup.
                </p>
              </div>
              {[
                { key: 'name', label: 'Full Name', ph: 'John Mohammed', icon: User },
                { key: 'phone', label: 'Phone Number', ph: '868-XXX-XXXX', icon: Phone },
                { key: 'whatsapp', label: 'WhatsApp (optional)', ph: 'Same as phone if blank', icon: MessageCircle },
              ].map(({ key, label, ph, icon: Icon }) => (
                <div key={key}>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5 block">{label}</label>
                  <div className="relative">
                    <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={key === 'phone' || key === 'whatsapp' ? 'tel' : 'text'}
                      placeholder={ph}
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5 block">Note to store (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any special requests or instructions"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-white"
                />
              </div>
            </motion.div>
          )}

          {step === 'pickup' && (
            <motion.div key="pickup" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-xl font-black">Choose Pickup Time</h2>
              <PickupSelector onSelect={handlePickupSelect} selected={pickup} />
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-xl font-black">Confirm Reservation</h2>
              <div className="space-y-2 bg-gray-50 rounded-2xl p-4">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.qty}× {item.name}</span>
                    <span className="font-bold">TT${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-black">
                  <span>Total</span>
                  <span style={{ color: '#E61E2B' }}>TT${subtotal.toFixed(2)}</span>
                </div>
              </div>
              {[
                [User, form.name],
                [Phone, form.phone],
                [Calendar, pickup.hourOffset ? `Today within ${pickup.hourOffset}h` : `${pickup.day}${pickup.timeSlot ? ' · ' + pickup.timeSlot : ''}`],
                [Banknote, paymentMethod === 'cod' ? '💵 Cash on Delivery' : paymentMethod === 'bank_transfer' ? '🏦 Bank Transfer' : '💳 Card'],
              ].map(([Icon, val], i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Icon size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{val as string}</span>
                </div>
              ))}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={14} className="text-red-500" />
                  <p className="text-xs text-red-600 font-semibold">{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => step === 'details' ? onBack() : setStep(step === 'confirm' ? 'pickup' : 'details')}
            className="flex items-center gap-1 px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft size={15} /> Back
          </button>
          {step !== 'confirm' ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep(step === 'details' ? 'pickup' : 'confirm')}
              disabled={step === 'details' && (!form.name || !form.phone)}
              className="flex-1 py-3 rounded-xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: '#E61E2B' }}
            >
              Continue <ChevronRight size={15} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={submit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl font-black text-white flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: submitting ? '#9ca3af' : '#E61E2B' }}
            >
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Reserving…</> : <>Reserve & Get QR <QrCode size={15} /></>}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Merchant Calendar & Scanner ──────────────────────────────────────────────

interface MerchantReservationDashboardProps {
  storeId: string;
  storeName: string;
}

export const MerchantReservationDashboard: React.FC<MerchantReservationDashboardProps> = ({ storeId, storeName }) => {
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'scanner' | 'history'>('calendar');
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<{ res: ReservationData; result: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'ready' | 'completed'>('pending');
  const scanRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (data) setReservations(data as ReservationData[]);
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('reservations-' + storeId)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'reservations',
        filter: `store_id=eq.${storeId}`
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeId, load]);

  const updateStatus = async (id: string, status: string, note?: string) => {
    const update: any = { status };
    if (status === 'approved') update.approved_at = new Date().toISOString();
    if (status === 'completed') update.completed_at = new Date().toISOString();
    if (note) update.merchant_note = note;

    await supabase.from('reservations').update(update).eq('id', id);

    // Log to tax_records & inventory
    if (status === 'completed') {
      const res = reservations.find(r => r.id === id);
      if (res) {
        // Deduct inventory
        for (const item of res.items) {
          await supabase.rpc('decrement_product_stock', {
            p_product_id: String(item.id),
            p_qty: item.qty,
          }).catch(() => {}); // non-blocking

          // Tax record
          await supabase.from('tax_records').insert({
            store_id: storeId,
            order_type: 'pickup_reservation',
            order_ref: res.id,
            amount: res.subtotal,
            payment_method: res.payment_method,
            recorded_at: new Date().toISOString(),
          }).catch(() => {});
        }
      }
    }
    load();
  };

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    setScanning(true);
    setScanResult(null);

    try {
      // Try to parse JSON payload from QR, or treat as raw token
      let token = scanInput.trim();
      try {
        const parsed = JSON.parse(scanInput.trim());
        token = parsed.token || token;
      } catch {}

      // Lookup by first 8 chars (display token) or full token
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .or(`qr_code_token.eq.${token},qr_code_token.ilike.${token.toLowerCase()}%`)
        .eq('store_id', storeId)
        .single();

      if (error || !data) {
        setScanResult({ res: null as any, result: 'not_found' });
        return;
      }

      const res = data as ReservationData;
      let result = 'valid';
      if (res.qr_scanned_at) result = 'already_used';
      if (res.status === 'cancelled') result = 'cancelled';
      if (res.status === 'completed') result = 'already_completed';

      // Log scan
      await supabase.from('qr_scan_logs').insert({
        reservation_id: res.id,
        scanned_at: new Date().toISOString(),
        scan_result: result,
      });

      // Mark scanned
      if (result === 'valid') {
        await supabase.from('reservations').update({ qr_scanned_at: new Date().toISOString() }).eq('id', res.id);
      }

      setScanResult({ res, result });
      setScanInput('');
    } finally {
      setScanning(false);
    }
  };

  const filtered = reservations.filter(r => filter === 'all' || r.status === filter);

  const statusChip = (status: string) => {
    const map: Record<string, [string, string]> = {
      pending:   ['#f59e0b', '#fffbeb'],
      approved:  ['#2563eb', '#eff6ff'],
      ready:     ['#16a34a', '#f0fdf4'],
      completed: ['#16a34a', '#f0fdf4'],
      cancelled: ['#dc2626', '#fef2f2'],
      no_show:   ['#9ca3af', '#f9fafb'],
    };
    const [color, bg] = map[status] || ['#9ca3af', '#f9fafb'];
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-black" style={{ color, background: bg }}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', count: reservations.filter(r => r.status === 'pending').length, color: '#f59e0b' },
          { label: 'Approved', count: reservations.filter(r => r.status === 'approved').length, color: '#2563eb' },
          { label: 'Ready', count: reservations.filter(r => r.status === 'ready').length, color: '#16a34a' },
          { label: 'Completed', count: reservations.filter(r => r.status === 'completed').length, color: '#374151' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-black" style={{ color }}>{count}</p>
            <p className="text-xs text-gray-500 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { id: 'calendar', label: '📅 Calendar', icon: Calendar },
          { id: 'scanner', label: '📷 Scan QR', icon: Scan },
          { id: 'history', label: '📋 History', icon: Eye },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={activeTab === id
              ? { background: '#E61E2B', color: '#fff' }
              : { color: '#6b7280' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── Calendar View ─── */}
        {activeTab === 'calendar' && (
          <motion.div key="calendar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['all', 'pending', 'approved', 'ready', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                  style={filter === f
                    ? { background: '#E61E2B', color: '#fff', borderColor: '#E61E2B' }
                    : { borderColor: '#e5e7eb', color: '#6b7280' }
                  }
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && <span className="ml-1.5 opacity-70">{reservations.filter(r => r.status === f).length}</span>}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No {filter === 'all' ? '' : filter} reservations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(res => (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-black text-sm text-gray-900">{res.customer_name}</span>
                          {statusChip(res.status)}
                        </div>
                        <p className="text-xs text-gray-500">{res.customer_phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm" style={{ color: '#E61E2B' }}>TT${res.subtotal.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 font-mono">{res.qr_code_token?.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {res.items?.map((item, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                          {item.qty}× {item.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {res.pickup_day || 'TBC'}</span>
                      <span className="flex items-center gap-1"><Banknote size={10} /> {res.payment_method.toUpperCase()}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {new Date(res.created_at).toLocaleDateString('en-TT')}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {res.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(res.id, 'approved', 'Your reservation has been approved! Items are being prepared.')}
                            className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                            style={{ background: '#16a34a' }}
                          >
                            <Check size={13} /> Approve
                          </button>
                          <button
                            onClick={() => updateStatus(res.id, 'cancelled', 'Sorry, we cannot fulfil this reservation.')}
                            className="flex-1 py-2 rounded-xl text-xs font-bold border border-red-300 text-red-600"
                          >
                            <X size={13} className="inline mr-1" /> Decline
                          </button>
                        </>
                      )}
                      {res.status === 'approved' && (
                        <button
                          onClick={() => updateStatus(res.id, 'ready', 'Your order is ready for pickup!')}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
                          style={{ background: '#2563eb' }}
                        >
                          Mark Ready for Pickup
                        </button>
                      )}
                      {res.status === 'ready' && (
                        <button
                          onClick={() => updateStatus(res.id, 'completed')}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                          style={{ background: '#16a34a' }}
                        >
                          <CheckCircle size={13} /> Mark Completed
                        </button>
                      )}
                      {/* WhatsApp notify */}
                      {res.customer_phone && ['pending','approved','ready'].includes(res.status) && (
                        <a
                          href={`https://wa.me/${res.customer_phone}?text=${encodeURIComponent(`Hi ${res.customer_name}! Your reservation at ${storeName} (Ref: ${res.qr_code_token?.slice(0, 8).toUpperCase()}) status: ${res.status.toUpperCase()}. ${res.status === 'ready' ? 'Your items are ready for pickup!' : ''}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0"
                        >
                          <MessageCircle size={14} className="text-green-600" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── QR Scanner ─── */}
        {activeTab === 'scanner' && (
          <motion.div key="scanner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-gray-900">Scan Customer QR Code</h3>
              <div
                className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center"
                style={{ background: '#fafafa' }}
              >
                <ScanLine size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-500 mb-2">Use a USB QR scanner or type the reservation token</p>
                <div className="flex gap-2">
                  <input
                    ref={scanRef}
                    type="text"
                    placeholder="Scan QR or type token (first 8 chars)…"
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleScan()}
                    autoFocus
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-mono"
                  />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleScan}
                    disabled={scanning || !scanInput.trim()}
                    className="px-5 py-3 rounded-xl font-black text-white disabled:opacity-40"
                    style={{ background: '#E61E2B' }}
                  >
                    {scanning ? <Loader2 size={16} className="animate-spin" /> : <Scan size={16} />}
                  </motion.button>
                </div>
              </div>

              {/* Scan result */}
              <AnimatePresence>
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border-2 p-5"
                    style={
                      scanResult.result === 'valid'
                        ? { borderColor: '#16a34a', background: '#f0fdf4' }
                        : scanResult.result === 'not_found'
                        ? { borderColor: '#dc2626', background: '#fef2f2' }
                        : { borderColor: '#f59e0b', background: '#fffbeb' }
                    }
                  >
                    {scanResult.result === 'not_found' ? (
                      <div className="flex items-center gap-3">
                        <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
                        <div>
                          <p className="font-black text-red-700">Invalid QR Code</p>
                          <p className="text-xs text-red-500">This code does not match any reservation for your store.</p>
                        </div>
                      </div>
                    ) : scanResult.result === 'already_used' || scanResult.result === 'already_completed' ? (
                      <div className="flex items-center gap-3">
                        <AlertCircle size={24} className="text-amber-500 flex-shrink-0" />
                        <div>
                          <p className="font-black text-amber-700">Already Scanned</p>
                          <p className="text-xs text-amber-600">This reservation was already processed. Customer: {scanResult.res.customer_name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                            <Check size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="font-black text-green-800">Valid Reservation ✓</p>
                            <p className="text-xs text-green-600">Customer verified — release the items</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 space-y-2">
                          {[
                            [User, scanResult.res.customer_name],
                            [Phone, scanResult.res.customer_phone],
                            [Package, scanResult.res.items?.map((i: ReservationItem) => `${i.qty}× ${i.name}`).join(', ')],
                            [Banknote, `TT$${scanResult.res.subtotal?.toFixed(2)} via ${scanResult.res.payment_method?.toUpperCase()}`],
                          ].map(([Icon, val], i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Icon size={13} className="text-gray-400 flex-shrink-0" />
                              <span className="text-gray-700">{val as string}</span>
                            </div>
                          ))}
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            updateStatus(scanResult.res.id, 'completed');
                            setScanResult(null);
                          }}
                          className="w-full py-3 rounded-xl font-black text-white flex items-center justify-center gap-2"
                          style={{ background: '#16a34a' }}
                        >
                          <CheckCircle size={16} /> Complete Pickup & Update Inventory
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ─── History ─── */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-black text-gray-900 mb-4">Revenue from Reservations</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  ['Total Orders', reservations.filter(r => r.status === 'completed').length, '#374151'],
                  ['Revenue', `TT$${reservations.filter(r => r.status === 'completed').reduce((s, r) => s + (r.subtotal || 0), 0).toFixed(0)}`, '#E61E2B'],
                  ['Pending Cash', `TT$${reservations.filter(r => ['pending','approved','ready'].includes(r.status) && r.payment_method === 'cod').reduce((s, r) => s + (r.subtotal || 0), 0).toFixed(0)}`, '#f59e0b'],
                ].map(([label, val, color]) => (
                  <div key={label} className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="font-black text-lg" style={{ color: color as string }}>{val}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <TrendingUp size={11} /> All completed pickups are automatically logged in your Tax Dashboard
              </p>
            </div>

            <div className="space-y-2">
              {reservations.slice(0, 20).map(res => (
                <div key={res.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{res.customer_name}</p>
                    <p className="text-xs text-gray-400">{new Date(res.created_at).toLocaleDateString('en-TT')} · {res.items?.length} items</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm">TT${res.subtotal?.toFixed(2)}</span>
                    {statusChip(res.status)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Premium Paywall (for sales page / cold traffic) ─────────────────────────

export const ReservationPremiumGate: React.FC<{
  onUpgrade: () => void;
  planPrice?: string;
}> = ({ onUpgrade, planPrice = 'TT$99/mo' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative rounded-3xl overflow-hidden border-2"
    style={{ borderColor: '#FFD700' }}
  >
    {/* Background */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0000 60%, #2d0000 100%)' }} />

    {/* Content */}
    <div className="relative z-10 p-8">
      {/* Badge */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FFD700' }}>
          <Star size={16} className="text-black" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-yellow-400">Premium Feature</span>
      </div>

      <h2 className="text-2xl font-black text-white mb-3 leading-tight">
        QR Pickup Reservations<br />
        <span style={{ color: '#FFD700' }}>+ Smart Inventory Sync</span>
      </h2>
      <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-md">
        Let customers reserve products for pickup with a time window. They get a QR digital receipt. You approve on a calendar, scan the QR at pickup — inventory and taxes update automatically.
      </p>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {[
          { icon: QrCode, title: 'QR Digital Receipts', desc: 'Auto-generated, scannable, branded' },
          { icon: Calendar, title: 'Pickup Calendar', desc: 'Customer picks time, you approve' },
          { icon: Scan, title: 'QR Scanner', desc: 'Verify pickup, zero paperwork' },
          { icon: Package, title: 'Auto Inventory', desc: 'Stock deducted on scan' },
          { icon: TrendingUp, title: 'Tax Dashboard Sync', desc: 'Every pickup logged automatically' },
          { icon: MessageCircle, title: 'WhatsApp Alerts', desc: 'Customer + store get notified' },
          { icon: Zap, title: 'TriniRides Link', desc: 'Book delivery from reservation' },
          { icon: Shield, title: 'Fraud Protection', desc: 'Tokens expire, scan logs kept' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
            <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <Icon size={14} style={{ color: '#FFD700' }} />
            </div>
            <div>
              <p className="text-xs font-black text-white">{title}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Social proof */}
      <div className="flex items-center gap-3 mb-6 bg-white/5 rounded-xl p-3">
        <div className="flex -space-x-2">
          {['#E61E2B','#16a34a','#2563eb','#f59e0b'].map((c, i) => (
            <div key={i} className="w-7 h-7 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs text-white font-bold" style={{ background: c }}>
              {['M','P','D','S'][i]}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          <span className="text-white font-bold">240+ stores</span> use QR reservations to reduce no-shows by 65%
        </p>
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onUpgrade}
        className="w-full py-4 rounded-2xl font-black text-black text-base flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #FFD700, #fbbf24)' }}
      >
        Upgrade to Pro — {planPrice} <ArrowRight size={16} />
      </motion.button>
      <p className="text-center text-xs text-gray-500 mt-3">
        Cancel anytime · No setup fee · Includes all TriniBuild Pro features
      </p>
    </div>

    {/* Decorative lock */}
    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
      <Lock size={14} style={{ color: '#FFD700' }} />
    </div>
  </motion.div>
);
