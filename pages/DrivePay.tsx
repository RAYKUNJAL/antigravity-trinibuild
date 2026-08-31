import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDriveSubscription, startDriveSubWam } from '../services/ridesApi';

/**
 * /drive/pay — Wam subscription when a price exists. No invented TTD price.
 */
export const DrivePay: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState('');
  const [checkout, setCheckout] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchDriveSubscription().then(setStatus).catch((e) => setError(e.message));
  }, []);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await startDriveSubWam(phone);
      setCheckout(data);
    } catch (err: any) {
      setError(err.message || 'Subscription checkout is not available');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Driver subscription</h1>
        <p className="text-gray-600 mb-4">
          {status?.copy || 'Checking whether a subscription price is set on this origin…'}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Wam is wam.com, not WhatsApp. Paying does not list you. A person confirms. Not pay→fulfill.
        </p>
        {status?.priceSet ? (
          <p className="text-sm text-gray-700 mb-4">Face amount is set in admin/env. Juvay does not print a TTD price here from code.</p>
        ) : (
          <p className="text-sm text-gray-700 mb-4">No price is set. Apply still works. Go-online stays blocked.</p>
        )}
        <form onSubmit={pay} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Phone on your application
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          </label>
          <button type="submit" disabled={busy || !status?.priceSet} className="w-full min-h-[44px] rounded-xl bg-stone-900 text-white font-semibold disabled:opacity-40">
            {busy ? 'Working…' : 'Start Wam checkout'}
          </button>
        </form>
        {error ? <p className="text-sm text-red-700 mt-3">{error}</p> : null}
        {checkout?.payment ? (
          <div className="mt-4 text-sm text-gray-700 space-y-2">
            <p>Face TT cents: {checkout.payment.faceCents}. Amount charged equals face.</p>
            <a href="https://wam.com" className="underline font-semibold" target="_blank" rel="noreferrer">Pay on wam.com</a>
            <p>{checkout.copy}</p>
          </div>
        ) : null}
        <p className="mt-6 text-sm"><Link to="/drive" className="underline">Back to apply</Link></p>
      </div>
    </div>
  );
};
