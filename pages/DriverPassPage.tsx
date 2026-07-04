// Driver Pass — the driver's wallet screen.
// Shows trial/earn-first/active status, ride-count progress toward the
// weekly threshold, and the WAM / bank-deposit payment flow with
// reference code + receipt upload. Zero commission, always.
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Upload, CheckCircle2, Copy } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import {
    getPassPlans, getMyPass, startFreeTrial, checkDriverAccess,
    requestPassPayment, submitPassProof, getMyPassPayments, PassPlan,
} from '../services/driverPassService';

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function DriverPassPage() {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<PassPlan[]>([]);
    const [pass, setPass] = useState<any>(null);
    const [access, setAccess] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [payFlow, setPayFlow] = useState<{ plan: PassPlan; method: 'wam' | 'bank'; payment?: any; instructions?: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const refresh = async () => {
        try {
            const [p, mp, acc, pays] = await Promise.all([getPassPlans(), getMyPass(), checkDriverAccess(), getMyPassPayments()]);
            setPlans(p.filter((x) => x.slug !== 'trial'));
            setPass(mp); setAccess(acc); setPayments(pays);
        } catch (e: any) { setError(e.message); }
        setLoading(false);
    };
    useEffect(() => { refresh(); }, []);

    const trial = async () => { setBusy(true); try { await startFreeTrial(); await refresh(); } catch (e: any) { setError(e.message); } setBusy(false); };

    const startPay = async (plan: PassPlan, method: 'wam' | 'bank') => {
        setBusy(true); setError('');
        try {
            const res = await requestPassPayment(plan.slug, method);
            setPayFlow({ plan, method, payment: res.payment, instructions: res.instructions });
        } catch (e: any) { setError(e.message); }
        setBusy(false);
    };

    const uploadProof = async (file: File) => {
        if (!payFlow?.payment) return;
        setUploading(true); setError('');
        try {
            const path = `driver-pass/${payFlow.payment.reference_code}-${Date.now()}.${file.name.split('.').pop()}`;
            const { error: ue } = await supabase.storage.from('bank-transfer-proofs').upload(path, file);
            if (ue) throw ue;
            const { data: { publicUrl } } = supabase.storage.from('bank-transfer-proofs').getPublicUrl(path);
            await submitPassProof(payFlow.payment.reference_code, publicUrl, payFlow.method === 'bank' ? 'Bank deposit' : 'WAM');
            setPayFlow(null); await refresh();
        } catch (e: any) { setError(e.message); }
        setUploading(false);
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-full max-w-lg px-5 space-y-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-900 rounded-2xl animate-pulse" />)}
            </div>
        </div>
    );

    const stateColors: Record<string, string> = {
        trial: 'from-emerald-600 to-emerald-800', active: 'from-emerald-600 to-emerald-800',
        grace: 'from-amber-600 to-amber-800', expired: 'from-red-700 to-red-900', none: 'from-gray-700 to-gray-900',
    };
    const rides = pass?.rides_completed_this_period ?? 0;
    const threshold = 10;
    const earnFirst = pass?.mode === 'earn_first';

    return (
        <div className="min-h-screen bg-black text-white px-4 py-8">
            <div className="max-w-lg mx-auto">
                <motion.div {...fade}>
                    <h1 className="text-3xl font-black mb-1">Driver Pass</h1>
                    <p className="text-gray-400 mb-6">You keep <span className="text-[#FFD700] font-bold">100% of every fare</span>. No commission. Ever.</p>
                </motion.div>

                {error && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

                {/* Status card */}
                <motion.div {...fade} className={`rounded-3xl p-6 bg-gradient-to-br ${stateColors[access?.state || 'none']} mb-6`}>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
                        {access?.state === 'trial' ? 'Free Trial' : access?.state === 'grace' ? 'Grace Period' : access?.state === 'active' ? (earnFirst ? 'Earn-First Week' : 'Pass Active') : access?.state === 'expired' ? 'Pass Expired' : 'Not Started'}
                    </p>
                    <p className="text-xl font-extrabold leading-snug">{access?.message}</p>
                    {access?.daysLeft != null && <p className="mt-2 text-sm opacity-90">{access.daysLeft} day{access.daysLeft === 1 ? '' : 's'} remaining</p>}
                    {access?.state === 'none' && (
                        <button onClick={trial} disabled={busy}
                            className="mt-4 bg-white text-black font-extrabold px-6 py-3 rounded-xl flex items-center gap-2">
                            {busy ? <Loader2 size={16} className="animate-spin" /> : '🚗'} Start 30-Day Free Trial
                        </button>
                    )}
                </motion.div>

                {/* Earn-before-pay progress */}
                {earnFirst && (
                    <motion.div {...fade} className="bg-gray-950 border border-gray-800 rounded-2xl p-5 mb-6">
                        <div className="flex justify-between items-baseline mb-2">
                            <p className="font-bold">This week: free until {threshold} rides</p>
                            <p className="text-sm text-gray-400">{rides}/{threshold}</p>
                        </div>
                        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#E61E2B] to-[#FFD700] transition-all"
                                style={{ width: `${Math.min(100, (rides / threshold) * 100)}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {rides < threshold
                                ? `${threshold - rides} more ride${threshold - rides === 1 ? '' : 's'} before your weekly pass is due. Slow week? You pay nothing.`
                                : 'Threshold reached — your weekly pass is due by Sunday. You keep driving in the meantime.'}
                        </p>
                    </motion.div>
                )}

                {/* Pay flow */}
                {payFlow?.payment ? (
                    <motion.div {...fade} className="bg-gray-950 border border-[#FFD700]/40 rounded-2xl p-5 mb-6">
                        <p className="font-extrabold text-lg mb-1">{payFlow.method === 'wam' ? 'Pay by WAM' : 'Pay at any bank'}</p>
                        <p className="text-sm text-gray-300 mb-4">{payFlow.instructions}</p>
                        <div className="bg-black border border-gray-700 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
                            <span className="font-mono font-bold text-[#FFD700]">{payFlow.payment.reference_code}</span>
                            <button onClick={() => navigator.clipboard?.writeText(payFlow.payment.reference_code)} className="text-gray-400 hover:text-white"><Copy size={16} /></button>
                        </div>
                        <label className="block">
                            <span className="sr-only">Upload receipt</span>
                            <div className="border-2 border-dashed border-gray-700 hover:border-[#E61E2B] rounded-xl p-6 text-center cursor-pointer transition-colors">
                                {uploading ? <Loader2 className="animate-spin mx-auto" /> : (<><Upload className="mx-auto mb-2 text-gray-500" size={22} />
                                    <p className="text-sm font-semibold">Upload your {payFlow.method === 'wam' ? 'WAM screenshot' : 'teller slip'}</p>
                                    <p className="text-xs text-gray-500 mt-1">Verified within 1–2 business days</p></>)}
                            </div>
                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadProof(e.target.files[0])} />
                        </label>
                        <button onClick={() => setPayFlow(null)} className="mt-3 text-sm text-gray-500 hover:text-white">Cancel</button>
                    </motion.div>
                ) : (
                    /* Plans */
                    <div className="space-y-3 mb-8">
                        {plans.map((p) => (
                            <motion.div key={p.slug} {...fade} className={`rounded-2xl border p-5 ${p.tier === 'pro' ? 'border-[#FFD700]/50 bg-[#FFD700]/5' : 'border-gray-800 bg-gray-950'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-extrabold">{p.name} {p.tier === 'pro' && <span className="text-[#FFD700] text-xs font-bold ml-1">POPULAR</span>}</p>
                                        <p className="text-2xl font-black mt-0.5">TT${Number(p.price_ttd).toFixed(0)}<span className="text-sm text-gray-500 font-semibold">/{p.period}</span></p>
                                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                            {((p as any).services || []).map((s: string) => (
                                                <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                                                    {s === 'rideshare' ? '🚗 Rides' : s === 'delivery' ? '🛵 Delivery' : '📦 Courier'}
                                                </span>
                                            ))}
                                        </div>
                                        {p.free_ride_threshold != null && <p className="text-xs text-emerald-400 font-semibold mt-1">Free until {p.free_ride_threshold} rides/week</p>}
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button onClick={() => startPay(p, 'wam')} disabled={busy} className="bg-[#E61E2B] hover:bg-[#c4172f] text-sm font-bold px-4 py-2 rounded-lg">Pay by WAM</button>
                                        <button onClick={() => startPay(p, 'bank')} disabled={busy} className="bg-gray-800 hover:bg-gray-700 text-sm font-bold px-4 py-2 rounded-lg">Pay at Bank</button>
                                    </div>
                                </div>
                                <ul className="mt-3 space-y-1">
                                    {(p.features || []).map((f, i) => <li key={i} className="text-sm text-gray-400 flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />{f}</li>)}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Payment history */}
                {payments.length > 0 && (
                    <div className="border-t border-gray-800 pt-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment History</p>
                        {payments.slice(0, 5).map((p) => (
                            <div key={p.id} className="flex justify-between items-center py-2.5 border-b border-gray-900 text-sm">
                                <div>
                                    <p className="font-mono text-gray-300">{p.reference_code}</p>
                                    <p className="text-xs text-gray-600">{new Date(p.created_at).toLocaleDateString()} · {p.method.toUpperCase()}</p>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.status === 'verified' ? 'bg-emerald-950 text-emerald-400' : p.status === 'submitted' ? 'bg-amber-950 text-amber-400' : p.status === 'rejected' ? 'bg-red-950 text-red-400' : 'bg-gray-900 text-gray-400'}`}>
                                    {p.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
