import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Copy, Loader2, AlertCircle } from 'lucide-react';
import { storesApi, productsApi } from '../services/selfHostedApi';
import { fetchWamStatus } from '../services/wamStatus';
import { VERTICAL_COPY, mapStarterToTemplate, payLine, type StarterType } from '../services/storeCopyTokens';
import { track } from '../services/eventTracker';

const TYPES: { id: StarterType; label: string }[] = [
  { id: 'food', label: 'Food' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'services', label: 'Services' },
  { id: 'general', label: 'General' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'home', label: 'Home' },
];

const TEMPLATES = [
  { id: 'island-commerce', label: 'Island storefront', for: ['general', 'home', 'food'] },
  { id: 'restaurant', label: 'Menu', for: ['food'] },
  { id: 'fashion', label: 'Rack', for: ['fashion'] },
  { id: 'beauty', label: 'Chair & retail', for: ['beauty', 'services'] },
  { id: 'professional', label: 'Book / enquire', for: ['services'] },
  { id: 'ecommerce', label: 'Shop grid', for: ['general', 'home'] },
];

export const JuvayOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [area, setArea] = useState('');
  const [island, setIsland] = useState('Trinidad & Tobago');
  const [starter, setStarter] = useState<StarterType>('general');
  const [templateId, setTemplateId] = useState('island-commerce');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [acceptsPickup, setAcceptsPickup] = useState(true);
  const [acceptsCod, setAcceptsCod] = useState(true);
  const [pickupAddress, setPickupAddress] = useState('');
  const [exactCash, setExactCash] = useState(true);
  const [wamConfigured, setWamConfigured] = useState(false);
  const [wamHandle, setWamHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    fetchWamStatus().then((s) => setWamConfigured(s.configured));
  }, []);

  useEffect(() => {
    setTemplateId(mapStarterToTemplate(starter));
  }, [starter]);

  const copy = VERTICAL_COPY[starter];
  const liveUrl = slug ? `https://juvay.app/store/${slug}` : '';
  const visibleTemplates = useMemo(
    () => TEMPLATES.filter((t) => t.for.includes(starter) || t.id === 'island-commerce'),
    [starter]
  );

  const go = (n: number) => {
    setError('');
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const publish = async () => {
    if (!storeName.trim()) {
      setError('Name the store first.');
      go(1);
      return;
    }
    if (!acceptsPickup && !acceptsCod) {
      setError('Turn on cash pickup and/or cash on delivery.');
      go(4);
      return;
    }
    if (wamConfigured && !wamHandle.trim()) {
      setError('A Wam handle is required before a paid rail can go live. Or leave paid rail off.');
      go(5);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const store = await storesApi.create({
        name: storeName.trim(),
        category: starter,
        island,
        address: pickupAddress.trim() || area.trim() || undefined,
        accepts_cod: acceptsCod,
        accepts_pickup: acceptsPickup,
        pickup_address: pickupAddress.trim() || undefined,
        exact_cash_note: exactCash,
        wam_handle: wamConfigured ? wamHandle.trim() : undefined,
        template_id: templateId,
        theme_config: {
          template_id: templateId,
          starter,
          area,
          island,
          hero: copy.hero,
        },
      });
      setSlug(store.slug);
      if (productName.trim() && productPrice) {
        const price = Number(productPrice);
        await productsApi.create({
          store_id: store.id,
          name: productName.trim(),
          price: Number.isFinite(price) && price > 0 ? price : 0,
          status: 'active',
        });
      }
      track('store_created', 'merchant', { category: starter, slug: store.slug });
      go(6);
    } catch (err: any) {
      setError(err?.message || 'Could not create the store.');
    } finally {
      setSaving(false);
    }
  };

  const shell = (title: string, body: React.ReactNode, actions: React.ReactNode) => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-md mx-auto w-full px-6 py-8">
        <p className="text-xs font-semibold text-gray-400 mb-2">Juvay · step {step} of 6</p>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">{title}</h1>
        {error && (
          <p className="mb-4 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
          </p>
        )}
        {body}
        <div className="mt-8 space-y-3">{actions}</div>
        <p className="mt-8 text-center text-xs text-gray-500">
          <a href="/terms" className="hover:underline">Terms</a>
          {' · '}
          <a href="/privacy" className="hover:underline">Privacy</a>
          {' · '}
          <a href="/refund" className="hover:underline">Refunds</a>
        </p>
      </div>
    </div>
  );

  if (step === 1) {
    return shell(
      'Name your store',
      <>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Store name</label>
        <input
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="The name on the door"
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
        />
        <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Area</label>
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="{{area}}"
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
        />
        <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Island</label>
        <input
          value={island}
          onChange={(e) => setIsland(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
        />
        <p className="text-xs text-gray-500 mt-3">Six starter types next. No preview shop names are baked in.</p>
      </>,
      <button
        disabled={!storeName.trim()}
        onClick={() => go(2)}
        className="w-full bg-red-600 text-white font-bold py-3 rounded-xl disabled:opacity-40"
      >
        Continue <ArrowRight className="inline h-4 w-4" />
      </button>
    );
  }

  if (step === 2) {
    return shell(
      'Pick a type and template',
      <>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setStarter(t.id)}
              className={`p-3 rounded-xl border-2 text-sm font-semibold ${starter === t.id ? 'border-red-600 bg-red-50' : 'border-gray-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-sm font-medium text-gray-800 mb-2">{copy.hero}</p>
        <div className="space-y-2">
          {visibleTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className={`w-full text-left p-3 rounded-xl border-2 ${templateId === t.id ? 'border-red-600 bg-red-50' : 'border-gray-200'}`}
            >
              <span className="font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </>,
      <div className="flex gap-3">
        <button onClick={() => go(1)} className="flex-1 border py-3 rounded-xl font-semibold"><ArrowLeft className="inline h-4 w-4" /> Back</button>
        <button onClick={() => go(3)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold">Continue</button>
      </div>
    );
  }

  if (step === 3) {
    return shell(
      'Add one product — or skip',
      <>
        <p className="text-sm text-gray-600 mb-4">Use a real name and price. Empty catalogues stay empty.</p>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Product name</label>
        <input value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300" />
        <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Price (TTD)</label>
        <input type="number" inputMode="decimal" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300" />
      </>,
      <div className="flex gap-3">
        <button onClick={() => go(2)} className="flex-1 border py-3 rounded-xl font-semibold">Back</button>
        <button onClick={() => { setProductName(''); setProductPrice(''); go(4); }} className="flex-1 border py-3 rounded-xl font-semibold">Skip</button>
        <button onClick={() => go(4)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold">Continue</button>
      </div>
    );
  }

  if (step === 4) {
    return shell(
      'Cash pickup and COD',
      <>
        <label className="flex items-start gap-3 p-3 border rounded-xl mb-3">
          <input type="checkbox" checked={acceptsPickup} onChange={(e) => setAcceptsPickup(e.target.checked)} className="mt-1" />
          <span><strong>Cash at pickup</strong> — buyer pays when they collect.</span>
        </label>
        <label className="flex items-start gap-3 p-3 border rounded-xl mb-3">
          <input type="checkbox" checked={acceptsCod} onChange={(e) => setAcceptsCod(e.target.checked)} className="mt-1" />
          <span><strong>Cash on delivery</strong> — where you deliver.</span>
        </label>
        <label className="flex items-start gap-3 p-3 border rounded-xl mb-4">
          <input type="checkbox" checked={exactCash} onChange={(e) => setExactCash(e.target.checked)} className="mt-1" />
          <span><strong>Exact cash</strong> — please bring the listed amount.</span>
        </label>
        {acceptsPickup && (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup address</label>
            <input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="{{pickup_address}}" className="w-full px-4 py-3 rounded-xl border border-gray-300" />
          </>
        )}
        <p className="text-sm text-gray-600 mt-4">
          {payLine({
            store_name: storeName, area, island, hours: '', pickup_address: pickupAddress,
            delivery_areas: '', whatsapp: '', specialty: '',
            accepts_pickup: acceptsPickup, accepts_cod: acceptsCod, whatsapp_on: false, wam_on: false,
          }) || 'Turn on at least one cash method.'}
        </p>
      </>,
      <div className="flex gap-3">
        <button onClick={() => go(3)} className="flex-1 border py-3 rounded-xl font-semibold">Back</button>
        <button
          disabled={!acceptsPickup && !acceptsCod}
          onClick={() => (wamConfigured ? go(5) : publish())}
          className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-40"
        >
          {wamConfigured ? 'Continue' : (saving ? 'Publishing…' : 'Publish store')}
        </button>
      </div>
    );
  }

  if (step === 5 && wamConfigured) {
    return shell(
      'Wam handle for paid rail',
      <>
        <p className="text-sm text-gray-600 mb-4">
          A seller Wam handle is required before a paid (non-cash) rail can publish. Processing estimates are display-only. The charge is face amount only.
        </p>
        <input value={wamHandle} onChange={(e) => setWamHandle(e.target.value)} placeholder="Your Wam handle" className="w-full px-4 py-3 rounded-xl border border-gray-300" />
        <button onClick={() => { setWamHandle(''); publish(); }} className="mt-3 text-sm text-gray-500 underline">Skip paid rail — cash only</button>
      </>,
      <div className="flex gap-3">
        <button onClick={() => go(4)} className="flex-1 border py-3 rounded-xl font-semibold">Back</button>
        <button onClick={publish} disabled={saving} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold">
          {saving ? <Loader2 className="inline h-4 w-4 animate-spin" /> : 'Publish store'}
        </button>
      </div>
    );
  }

  return shell(
    slug ? 'Your store is live' : 'Publish your store',
    <>
      {!slug && <p className="text-sm text-gray-600">Ready to put this on a juvay.app slug you can share.</p>}
      {slug && (
        <>
          <p className="text-sm text-gray-600 mb-3">Share this HTTPS link. Empty catalogues stay empty.</p>
          <div className="flex items-center gap-2 border rounded-xl px-3 py-3 bg-white">
            <span className="flex-1 text-sm truncate">{liveUrl}</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(liveUrl)}
              className="p-2"
              aria-label="Copy store URL"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </>,
    <>
      {!slug && (
        <button onClick={publish} disabled={saving} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl">
          {saving ? 'Publishing…' : 'Publish store'}
        </button>
      )}
      {slug && (
        <a href={liveUrl} className="block w-full text-center bg-red-600 text-white font-bold py-3 rounded-xl">
          Open store <Check className="inline h-4 w-4" />
        </a>
      )}
    </>
  );
};

export default JuvayOnboarding;
