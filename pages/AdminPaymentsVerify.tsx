// Admin Payment Verification — /admin/payments
// One screen to turn payments into active customers: pending driver-pass
// payments (PayPal/bank/WAM) + merchant subscription bank payments.
// View proof → Verify (activates pass/plan instantly) or Reject.
import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { activatePassFromPayment } from '../services/driverPassService';

export default function AdminPaymentsVerify() {
    const [driverPays, setDriverPays] = useState<any[]>([]);
    const [subPays, setSubPays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [msg, setMsg] = useState('');

    const load = async () => {
        setLoading(true);
        const [d, s] = await Promise.all([
            supabase.from('driver_pass_payments').select('*').in('status', ['submitted', 'pending']).order('created_at', { ascending: false }).limit(50),
            supabase.from('bank_subscription_payments').select('*').eq('status', 'submitted').order('created_at', { ascending: false }).limit(50),
        ]);
        setDriverPays(d.data || []); setSubPays(s.data || []); setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

    const verifyDriver = async (p: any) => {
        setBusyId(p.id);
        try { await activatePassFromPayment(p.id); flash(`✅ Pass activated — ${p.reference_code}`); await load(); }
        catch (e: any) { flash('❌ ' + e.message); }
        setBusyId(null);
    };

    const rejectRow = async (table: string, id: string) => {
        setBusyId(id);
        await supabase.from(table).update({ status: 'rejected' }).eq('id', id);
        flash('Rejected'); await load(); setBusyId(null);
    };

    const verifySub = async (p: any) => {
        setBusyId(p.id);
        try {
            await supabase.from('bank_subscription_payments').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('id', p.id);
            await supabase.from('user_plan_subscriptions').upsert({
                user_id: p.user_id, plan_slug: p.plan_slug, source: 'bank_pay',
                bank_payment_reference: p.reference_code,
            }, { onConflict: 'user_id' });
            flash(`✅ ${p.plan_slug.toUpperCase()} plan activated — ${p.reference_code}`); await load();
        } catch (e: any) { flash('❌ ' + e.message); }
        setBusyId(null);
    };

    const Row = ({ p, onVerify, table }: any) => (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
                <p className="font-mono font-bold text-[#FFD700] text-sm">{p.reference_code}</p>
                <p className="text-sm text-gray-300">{p.plan_slug} · TT${Number(p.amount_ttd).toFixed(2)} · {(p.method || 'bank').toUpperCase()}</p>
                <p className="text-xs text-gray-600">{new Date(p.created_at).toLocaleString()} · status: {p.status}</p>
            </div>
            {p.proof_url
                ? <a href={p.proof_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-semibold"><ExternalLink size={14} /> Proof</a>
                : <span className="text-xs text-gray-600">no proof yet</span>}
            <button onClick={() => onVerify(p)} disabled={busyId === p.id}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-sm font-bold px-4 py-2 rounded-lg">
                {busyId === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Verify
            </button>
            <button onClick={() => rejectRow(table, p.id)} disabled={busyId === p.id}
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-red-900 text-sm font-bold px-3 py-2 rounded-lg">
                <XCircle size={14} /> Reject
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black">Payment Verification</h1>
                        <p className="text-gray-400 text-sm mt-1">Verify a payment → the pass/plan activates instantly. This is the revenue switch.</p>
                    </div>
                    <button onClick={load} className="bg-gray-800 hover:bg-gray-700 p-2.5 rounded-lg"><RefreshCw size={16} /></button>
                </div>
                {msg && <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 mb-4 text-sm font-semibold">{msg}</div>}
                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-900 rounded-xl animate-pulse" />)}</div>
                ) : (
                    <>
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Driver Pass Payments ({driverPays.length})</h2>
                        <div className="space-y-3 mb-8">
                            {driverPays.length === 0 && <p className="text-gray-600 text-sm">No pending driver payments.</p>}
                            {driverPays.map((p) => <Row key={p.id} p={p} onVerify={verifyDriver} table="driver_pass_payments" />)}
                        </div>
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Merchant Subscription Payments ({subPays.length})</h2>
                        <div className="space-y-3">
                            {subPays.length === 0 && <p className="text-gray-600 text-sm">No pending subscription payments.</p>}
                            {subPays.map((p) => <Row key={p.id} p={p} onVerify={verifySub} table="bank_subscription_payments" />)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
