import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { StallQrSign, StallSignActions } from '../components/StallQrSign';
import { storesApi } from '../services/selfHostedApi';
import { storeService } from '../services/storeService';

export default function StallSignPage() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        let data: any = await storeService.getStoreBySlug(slug);
        if (!data) {
          const hosted = await storesApi.getBySlug(slug).catch(() => null);
          data = hosted?.store || null;
        }
        if (!cancelled) {
          if (!data) setError('Store not found.');
          else setStore(data);
        }
      } catch {
        if (!cancelled) setError('Could not load this shop.');
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (!slug) return <p className="p-8 text-center">Missing store.</p>;
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-gray-700">{error}</p>
        <Link to="/dashboard" className="mt-4 text-red-600 font-semibold">Back to dashboard</Link>
      </div>
    );
  }
  if (!store) return <p className="p-8 text-center text-gray-500">Loading sign…</p>;

  return (
    <>
      <Helmet>
        <title>{`Stall sign · ${store.name} · Juvay`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <style>{`
        @media print {
          nav, footer, .print\\:hidden, .island-nav { display: none !important; }
          body { background: #fff; }
        }
      `}</style>
      <div className="min-h-screen bg-gray-100 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          <StallSignActions slug={slug} />
          <StallQrSign
            storeName={store.name}
            slug={slug}
            acceptsCashPickup={store.accepts_pickup !== false}
            acceptsCod={!!store.accepts_cod}
          />
          <p className="text-center text-xs text-gray-500 print:hidden">
            Hang this at the stall. Buyers scan to open your Juvay shop. No paid QR kit required.
          </p>
        </div>
      </div>
    </>
  );
}
