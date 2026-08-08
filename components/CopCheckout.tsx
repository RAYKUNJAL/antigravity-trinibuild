// Customer Cash-on-Pickup checkout widget — pick a time window, get a
// pickup code, done. No delivery fee, still cash, still trust-first.
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, Loader2, Copy } from 'lucide-react';
import { generatePickupWindows, createPickupOrder, PickupWindow } from '../services/driverPassService';

interface CartItem { product_id: string; name: string; price: number; quantity: number }

export default function CopCheckout({ storeId, items, onDone }: { storeId: string; items: CartItem[]; onDone?: (order: any) => void }) {
    const windows = useMemo(() => generatePickupWindows(2), []);
    const grouped = useMemo(() => {
        const g: Record<string, PickupWindow[]> = {};
        windows.forEach((w) => { const day = w.label.split(' ')[0]; (g[day] ||= []).push(w); });
        return g;
    }, [windows]);

    const [selected, setSelected] = useState<PickupWindow | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [order, setOrder] = useState<any>(null);

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const vat = Math.round(subtotal * 0.125 * 100) / 100;
    const total = subtotal + vat;

    const submit = async () => {
        if (!selected || !name.trim() || !phone.trim()) { setError('Please pick a time and fill your name and phone.'); return; }
        setBusy(true); setError('');
        try {
            const o = await createPickupOrder({
                store_id: storeId, customer_name: name, customer_phone: phone,
                items, pickup_window_start: selected.start, pickup_window_end: selected.end,
            });
            setOrder(o); onDone?.(o);
        } catch (e: any) { setError(e.message); }
        setBusy(false);
    };

    if (order) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-950 border border-emerald-800 rounded-2xl p-6 text-center">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
                <h3 className="text-xl font-black mb-1">Pickup Reserved!</h3>
                <p className="text-gray-400 text-sm mb-5">Show this code at the counter — pay cash when you collect.</p>
                <div className="bg-black border border-[#FFD700]/40 rounded-xl py-4 mb-4">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Pickup Code</p>
                    <p className="text-4xl font-black tracking-[0.3em] text-[#FFD700]">{order.pickup_code}</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-1">
                    <Clock size={14} /> {new Date(order.pickup_window_start).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                </div>
                <p className="text-sm text-gray-500">Order {order.order_ref} · TT${Number(order.total_amount).toFixed(2)} due at pickup</p>
                <button onClick={() => navigator.clipboard?.writeText(order.pickup_code)} className="mt-4 flex items-center gap-1.5 mx-auto text-sm text-gray-400 hover:text-white">
                    <Copy size={13} /> Copy code
                </button>
            </motion.div>
        );
    }

    return (
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-extrabold mb-1">Cash on Pickup</h3>
            <p className="text-gray-500 text-sm mb-4">Reserve now, pay cash when you collect. No delivery fee.</p>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pick a time</p>
            {Object.entries(grouped).map(([day, slots]) => (
                <div key={day} className="mb-3">
                    <p className="text-xs text-gray-600 mb-1.5">{day}</p>
                    <div className="flex flex-wrap gap-2">
                        {slots.map((w) => (
                            <button key={w.start} onClick={() => setSelected(w)}
                                className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${selected?.start === w.start ? 'bg-[#E61E2B] border-[#E61E2B] text-white' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                                {w.label.split(' ').slice(1).join(' ')}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <div className="grid grid-cols-2 gap-3 mt-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:border-[#E61E2B] focus:outline-none" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:border-[#E61E2B] focus:outline-none" />
            </div>

            <div className="flex justify-between text-sm mt-4 pt-4 border-t border-gray-800">
                <span className="text-gray-500">Subtotal + VAT (12.5%)</span>
                <span className="font-bold">TT${total.toFixed(2)}</span>
            </div>

            <AnimatePresence>{error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-2">{error}</motion.p>}</AnimatePresence>

            <button onClick={submit} disabled={busy} className="w-full mt-4 bg-[#E61E2B] hover:bg-[#c4172f] disabled:opacity-50 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
                {busy ? <Loader2 size={16} className="animate-spin" /> : null} Reserve for Pickup
            </button>
        </div>
    );
}
