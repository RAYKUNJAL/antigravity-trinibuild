/**
 * CODCheckout.tsx
 * Full Cash-on-Delivery checkout system for TriniBuild
 * Includes TriniRides delivery integration as a shipping option
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote, CreditCard, Building2, Car, Package, Store,
  MapPin, Phone, User, ChevronRight, ChevronLeft,
  Clock, Shield, CheckCircle, Zap, AlertCircle, Info,
  Camera, Upload, Copy, Check, Navigation, Star,
  MessageCircle, Truck, Gift, ArrowRight, X, Loader2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { orderService, CreateOrderData } from '../services/orderService';

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

type PaymentMethod = 'cod' | 'bank_transfer' | 'card';
type DeliveryMethod = 'trinirides' | 'standard' | 'express' | 'pickup';
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

interface TriniRidesDriver {
  id: string;
  name: string;
  rating: number;
  trips: number;
  vehicle: string;
  eta: number; // minutes
  distance: number; // km
  photo?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  trinirides: 0,  // calculated dynamically
  standard: 30,
  express: 60,
  pickup: 0,
};

const FREE_DELIVERY_THRESHOLD = 200;

// Mock nearby TriniRides drivers (would come from ridesService in production)
const MOCK_DRIVERS: TriniRidesDriver[] = [
  { id: 'd1', name: 'Marcus A.', rating: 4.9, trips: 847, vehicle: 'Toyota Corolla', eta: 8, distance: 2.1 },
  { id: 'd2', name: 'Priya S.', rating: 4.8, trips: 1203, vehicle: 'Nissan Tiida', eta: 12, distance: 3.4 },
  { id: 'd3', name: 'Devon W.', rating: 4.7, trips: 562, vehicle: 'Honda Fit', eta: 15, distance: 4.2 },
];

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

// ─── COD Trust Badge ──────────────────────────────────────────────────────────

const CODTrustBadge: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl p-4 mb-6"
    style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1.5px solid #86efac' }}
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
        <Shield size={18} className="text-white" />
      </div>
      <div>
        <p className="text-sm font-black text-green-800 mb-1">
          ✅ Most Popular in Trinidad — 9 in 10 customers choose Cash on Delivery
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {['Inspect before paying', 'Verified drivers', 'WhatsApp updates', 'Easy returns'].map(t => (
            <span key={t} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{t}</span>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

// ─── TriniRides Delivery Panel ────────────────────────────────────────────────

const TriniRidesPanel: React.FC<{
  selected: boolean;
  onSelect: () => void;
  fee: number;
  drivers: TriniRidesDriver[];
  selectedDriver: TriniRidesDriver | null;
  onSelectDriver: (d: TriniRidesDriver) => void;
}> = ({ selected, onSelect, fee, drivers, selectedDriver, onSelectDriver }) => (
  <div>
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left rounded-2xl border-2 p-4 transition-all mb-0"
      style={selected
        ? { borderColor: '#000', background: '#000', color: '#fff' }
        : { borderColor: '#e5e7eb', background: '#fff' }
      }
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: selected ? '#FFD700' : '#f3f4f6' }}
        >
          <Car size={20} style={{ color: selected ? '#000' : '#6b7280' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm">TriniRides Delivery</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-black"
              style={{ background: '#FFD700', color: '#000' }}
            >
              FASTEST
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: selected ? 'rgba(255,255,255,0.7)' : '#6b7280' }}>
            Real-time GPS tracking · Verified drivers · Live WhatsApp updates
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-black text-sm" style={{ color: selected ? '#FFD700' : '#E61E2B' }}>
            TT${fee}
          </p>
          <p className="text-xs" style={{ color: selected ? 'rgba(255,255,255,0.6)' : '#9ca3af' }}>
            ~{drivers[0]?.eta ?? 15} min
          </p>
        </div>
      </div>
    </motion.button>

    {/* Driver selection — shown when TriniRides selected */}
    <AnimatePresence>
      {selected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="mt-3 space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
              Available Drivers Nearby
            </p>
            {drivers.map(driver => (
              <motion.button
                key={driver.id}
                onClick={() => onSelectDriver(driver)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                style={selectedDriver?.id === driver.id
                  ? { borderColor: '#E61E2B', background: '#FEF2F2' }
                  : { borderColor: '#e5e7eb', background: '#fafafa' }
                }
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-sm font-black text-gray-600">
                  {driver.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{driver.name}</p>
                  <p className="text-xs text-gray-500">{driver.vehicle}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-xs text-amber-600 font-bold">
                      <Star size={10} fill="#d97706" /> {driver.rating}
                    </span>
                    <span className="text-xs text-gray-400">{driver.trips.toLocaleString()} trips</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black" style={{ color: '#E61E2B' }}>{driver.eta} min</p>
                  <p className="text-xs text-gray-400">{driver.distance} km away</p>
                  {selectedDriver?.id === driver.id && (
                    <CheckCircle size={14} className="ml-auto mt-1" style={{ color: '#E61E2B' }} />
                  )}
                </div>
              </motion.button>
            ))}
            <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <Navigation size={12} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-semibold">
                Driver will be GPS-tracked from pickup to your door. You'll receive WhatsApp updates.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

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
            ['Bank', store.bank_name || 'Republic Bank TT'],
            ['Account Name', store.bank_holder || store.name],
            ['Account #', store.bank_account || '1234567890'],
            ['Amount', `TT$${amount.toFixed(2)}`],
          ].map(([label, value]) => (
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
        {payment === 'cod' && (
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
  const [nearbyDrivers] = useState<TriniRidesDriver[]>(MOCK_DRIVERS);
  const [selectedDriver, setSelectedDriver] = useState<TriniRidesDriver | null>(null);

  const [form, setForm] = useState<CheckoutState>({
    name: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    landmark: '',
    notes: '',
    delivery: 'trinirides',
    payment: 'cod',
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
    if (form.delivery === 'trinirides') {
      // TriniRides fee: base TT$25 + TT$4/km from nearest driver
      const driver = selectedDriver ?? nearbyDrivers[0];
      return driver ? Math.round(25 + driver.distance * 4) : 35;
    }
    if (isFreeDelivery && form.delivery === 'standard') return 0;
    return DELIVERY_FEES[form.delivery];
  }, [form.delivery, selectedDriver, nearbyDrivers, isFreeDelivery]);

  const total = subtotal + deliveryFee();

  const update = (key: keyof CheckoutState, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 'details':
        return !!(form.name.trim() && form.phone.trim() && form.address.trim() && form.city.trim());
      case 'delivery':
        if (form.delivery === 'trinirides' && !selectedDriver) return false;
        return true;
      case 'payment':
        if (form.payment === 'cod') return form.cashConfirmed;
        if (form.payment === 'bank_transfer') return !!form.transferProof;
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  }, [step, form, selectedDriver]);

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
        paymentMethod: form.payment,
        deliveryOption: form.delivery === 'trinirides' ? 'express' :
                        form.delivery === 'express' ? 'express' :
                        form.delivery === 'pickup' ? 'pickup' : 'standard',
        notes: [
          form.notes,
          form.delivery === 'trinirides' && selectedDriver
            ? `TriniRides driver: ${selectedDriver.name} (${selectedDriver.vehicle})`
            : '',
          form.payment === 'bank_transfer' && form.transferProof
            ? `Transfer proof uploaded: ${form.transferProof}`
            : '',
        ].filter(Boolean).join(' | '),
        email: '',
      };

      const order = await orderService.createOrder(orderData);

      // WhatsApp confirmation
      if (store.whatsapp) {
        const driver = form.delivery === 'trinirides' && selectedDriver ? selectedDriver : null;
        const msg = [
          `🛒 *New Order from TriniBuild*`,
          `Order: ${order.order_number || 'TRN-' + Date.now()}`,
          `Customer: ${form.name} · ${form.phone}`,
          `Deliver to: ${form.address}, ${form.city}`,
          `Items: ${items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`,
          `Total: TT$${total.toFixed(2)}`,
          `Payment: ${form.payment === 'cod' ? '💵 Cash on Delivery' : form.payment === 'bank_transfer' ? '🏦 Bank Transfer' : '💳 Card'}`,
          `Delivery: ${form.delivery === 'trinirides' ? `🚗 TriniRides (${driver?.name ?? 'TBA'})` : form.delivery}`,
        ].join('\n');
        window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      setStep('confirmed');
      onComplete(order.order_number || String(order.id), form.payment);
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

      {/* TriniRides — first and featured */}
      <TriniRidesPanel
        selected={form.delivery === 'trinirides'}
        onSelect={() => update('delivery', 'trinirides')}
        fee={form.delivery === 'trinirides' ? deliveryFee() : (() => {
          const driver = nearbyDrivers[0];
          return driver ? Math.round(25 + driver.distance * 4) : 35;
        })()}
        drivers={nearbyDrivers}
        selectedDriver={selectedDriver}
        onSelectDriver={setSelectedDriver}
      />

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
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-900">Payment Method</h2>

      {/* COD — STAR of the show */}
      <div className="relative">
        <motion.button
          onClick={() => update('payment', 'cod')}
          whileTap={{ scale: 0.98 }}
          className="w-full text-left rounded-2xl border-2 p-4 transition-all"
          style={form.payment === 'cod'
            ? { borderColor: '#16a34a', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }
            : { borderColor: '#e5e7eb', background: '#fff' }
          }
        >
          <div className="absolute -top-3 left-4">
            <span className="bg-green-500 text-white text-xs font-black px-3 py-0.5 rounded-full shadow">
              ⭐ MOST POPULAR
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Banknote size={24} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-black text-gray-900">💵 Cash on Delivery</p>
              <p className="text-xs text-gray-500 mt-0.5">Pay with cash or Linx card when driver arrives</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {['Inspect items first', 'No card needed', 'Safe & secure'].map(t => (
                  <span key={t} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.button>

        {/* Cash confirmation checkbox */}
        <AnimatePresence>
          {form.payment === 'cod' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 rounded-2xl bg-green-50 border border-green-200 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-green-800">Cash to have ready:</p>
                  <p className="text-2xl font-black text-green-700">TT${total.toFixed(2)}</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <div
                    onClick={() => update('cashConfirmed', !form.cashConfirmed)}
                    className="w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center cursor-pointer transition-all"
                    style={form.cashConfirmed
                      ? { background: '#16a34a', borderColor: '#16a34a' }
                      : { borderColor: '#9ca3af' }
                    }
                  >
                    {form.cashConfirmed && <Check size={11} className="text-white" />}
                  </div>
                  <span className="text-xs text-green-700 font-semibold leading-relaxed">
                    I confirm I'll have TT${total.toFixed(2)} ready in cash or Linx when the driver arrives.
                    I understand I can inspect items before paying.
                  </span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bank Transfer */}
      <div>
        <motion.button
          onClick={() => update('payment', 'bank_transfer')}
          whileTap={{ scale: 0.98 }}
          className="w-full text-left rounded-2xl border-2 p-4 transition-all mb-3"
          style={form.payment === 'bank_transfer'
            ? { borderColor: '#3b82f6', background: '#eff6ff' }
            : { borderColor: '#e5e7eb', background: '#fff' }
          }
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 size={22} className="text-blue-600" />
            </div>
            <div>
              <p className="font-black text-gray-900">🏦 Bank Transfer / Linx Online</p>
              <p className="text-xs text-gray-500 mt-0.5">Transfer to store's account, upload proof</p>
            </div>
          </div>
        </motion.button>

        <AnimatePresence>
          {form.payment === 'bank_transfer' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <BankTransferPanel
                store={store}
                amount={total}
                onProofUpload={(url) => update('transferProof', url)}
                proof={form.transferProof}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card (WiPay) */}
      <motion.button
        onClick={() => update('payment', 'card')}
        whileTap={{ scale: 0.98 }}
        className="w-full text-left rounded-2xl border-2 p-4 transition-all"
        style={form.payment === 'card'
          ? { borderColor: '#7c3aed', background: '#faf5ff' }
          : { borderColor: '#e5e7eb', background: '#fff' }
        }
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <CreditCard size={22} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-black text-gray-900">💳 Card / WiPay</p>
            <p className="text-xs text-gray-500 mt-0.5">Visa, Mastercard via WiPay secure gateway</p>
          </div>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">2% fee</span>
        </div>
      </motion.button>
    </div>
  );

  const renderReview = () => {
    const driver = form.delivery === 'trinirides' && selectedDriver ? selectedDriver : null;
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
                form.delivery === 'trinirides' ? `TriniRides${driver ? ` · ${driver.name}` : ''}` :
                form.delivery === 'express' ? 'Express Delivery' :
                form.delivery === 'pickup' ? 'Store Pickup' : 'Standard Delivery',
                form.scheduleNow ? 'As soon as possible' : `${form.scheduledDate} ${form.scheduledTime}`
              ]
            ]
          },
          {
            title: 'Payment',
            items: [[
              form.payment === 'cod' ? '💵 Cash on Delivery' :
              form.payment === 'bank_transfer' ? '🏦 Bank Transfer' : '💳 Card / WiPay',
              form.payment === 'cod' ? `Prepare TT$${total.toFixed(2)} cash` :
              form.payment === 'bank_transfer' ? (form.transferProof ? '✓ Proof uploaded' : 'No proof uploaded') :
              'Pay via WiPay checkout'
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

          {step === 'payment' && <CODTrustBadge />}

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
            Secure checkout by TriniBuild
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
