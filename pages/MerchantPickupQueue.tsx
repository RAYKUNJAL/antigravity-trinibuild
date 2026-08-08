// Merchant Pickup Queue — /merchant/pickups
// Filters by time window (Now / Today / Upcoming / Overdue), verifies the
// customer's 4-digit code at the counter, marks cash collected.
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertTriangle, RefreshCw, Loader2, Package } from 'lucide-react';
import { getPickupOrders, completePickup } from '../services/driverPassService';
import { getMyStores } from '../services/siteBuilderService';

type Filter = 'now' | 'today' | 'upcoming' | 'overdue' | 'all';
const FILTERS: { key: Filter; label: string; icon: any }[] = [
    { key: 'now', label: 'Ready Now', icon: Clock },
    { key: 'today', label: 'Today', icon: Clock },
    { key: 'upcoming', label: 'Upcoming', icon: Clock },
    { key: 'overdue', label: 'Overdue', icon: AlertTriangle },
    { key: 'all', label: 'All', icon: Package },
];

export default function MerchantPickupQueue() {
    const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
    const [storeId, setStoreId] = useState('');
    const [filter, setFilter] = useState<Filter>('now');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
    const [busyId, setBusyId] = useState<string | null>(null);
    const [err, setErr] = useState<Record<string, string>>({});

    useEffect(() => { getMyStores().then((s) => { setStores(s as any); if (s[0]) setStoreId((s[0] as any).id); }); }, []);

    const load = async () => {
        if (!storeId) return;
        setLoading(true);
        try { setOrders(await getPickupOrders(storeId, filter)); } catch { setOrders([]); }
        setLoading(false);
    };
    useEffect(() => { load(); }, [storeId, filter]);

    const handOver = async (orderId: string) => {
        const code = codeInputs[orderId];
        setBusyId(orderId); setErr((e) => ({ ...e, [orderId]: '' }));
        try { await completePickup(orderId, code); await load(); }
        catch (e: any) { setErr((prev) => ({ ...prev, [orderId]: e.message })); }
        setBusyId(null);
    };

    const windowLabel = (o: any) => {
        const s = new Date(o.pickup_window_start), e = new Date(o.pickup_window_end);
        const day = s.toDateString() === new Date().toDateString() ? 'Today' : s.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        return `${day} · ${s.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}–${e.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    };

    const overdueNow = (o: any) => new Date(o.pickup_window_end) < new Date() && !o.picked_up_at;

    return (
        <div className="min-h-screen bg-black text-white px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-3xl font-black">Pickup Queue</h1>
                        <p className="text-gray-400 text-sm mt-1">Cash on Pickup — verify the code, collect cash, done.</p>
                    </div>
                    <button onClick={load} className="bg-gray-800 hover:bg-gray-700 p-2.5 rounded-lg"><RefreshCw size={16} /></button>
                </div>

                {stores.length > 1 && (
                    <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 mb-4 text-sm">
                        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                )}

                <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
                    {FILTERS.map((f) => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${filter === f.key ? 'bg-[#E61E2B] text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
                            <f.icon size={14} /> {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-900 rounded-xl animate-pulse" />)}</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-16 text-gray-600">
                        <Package size={40} className="mx-auto mb-3 opacity-40" />
                        <p>No pickups in this filter.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((o) => (
                            <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className={`rounded-2xl border p-4 ${o.picked_up_at ? 'border-emerald-800 bg-emerald-950/30' : overdueNow(o) ? 'border-red-800 bg-red-950/20' : 'border-gray-800 bg-gray-950'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold">{o.customer_name} <span className="text-gray-500 font-normal text-sm">· {o.order_ref}</span></p>
                                        <p className="text-xs text-gray-500">{o.customer_phone}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${o.picked_up_at ? 'bg-emerald-900 text-emerald-300' : overdueNow(o) ? 'bg-red-900 text-red-300' : 'bg-gray-800 text-gray-300'}`}>
                                        {o.picked_up_at ? 'Collected' : overdueNow(o) ? 'Overdue' : windowLabel(o)}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400 mb-3">
                                    {(o.items || []).map((it: any, i: number) => <span key={i}>{it.quantity}× {it.name}{i < o.items.length - 1 ? ', ' : ''}</span>)}
                                </div>
                                <div className="flex justify-between items-center text-sm mb-3">
                                    <span className="text-gray-500">Total due at counter</span>
                                    <span className="font-black text-[#FFD700]">TT${Number(o.total_amount).toFixed(2)}</span>
                                </div>
                                {!o.picked_up_at && (
                                    <div className="flex gap-2">
                                        <input value={codeInputs[o.id] || ''} maxLength={4} placeholder="4-digit code"
                                            onChange={(e) => setCodeInputs((c) => ({ ...c, [o.id]: e.target.value.replace(/\D/g, '') }))}
                                            className="flex-1 bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-center font-mono font-bold tracking-widest text-lg focus:border-[#E61E2B] focus:outline-none" />
                                        <button onClick={() => handOver(o.id)} disabled={busyId === o.id || (codeInputs[o.id] || '').length !== 4}
                                            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 font-bold px-5 rounded-lg">
                                            {busyId === o.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Collect
                                        </button>
                                    </div>
                                )}
                                {err[o.id] && <p className="text-red-400 text-xs mt-2">{err[o.id]}</p>}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
