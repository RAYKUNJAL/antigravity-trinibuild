/**
 * Create-store path: pick a starter, Grok draft (or honest fallback),
 * preview the merchant's empty store, edit for real, publish on purpose.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { storesApi, getToken } from '../services/selfHostedApi';
import { fetchWamStatus } from '../services/wamStatus';
import { STORE_STARTERS, STARTER_IDS, resolveStarterId, defaultFaq, defaultHowSteps, type StarterId } from '../services/storeStarters';
import { normalizeWhatsappE164, type StorefrontModel } from '../services/storefrontHonesty';
import { JuvayStorefront } from '../components/storefront/JuvayStorefront';
import { SafeBoundary } from '../components/SafeBoundary';

type Step = 1 | 2 | 3 | 4;

interface DraftCopy {
  templateId: StarterId;
  hero: { headline: string; sub?: string };
  about: string;
  trustChips: string[];
  faq: Array<{ q: string; a: string }>;
  how: Array<{ title: string; body: string }>;
  agentWrote: boolean;
}

interface BuilderState {
  step: Step;
  templateId: StarterId | '';
  storeName: string;
  phone: string;
  pickupAddress: string;
  island: string;
  specialty: string;
  hours: string;
  payoutPreference: '' | 'cash_vendor_keeps' | 'wam' | 'bank_transfer';
  acceptsCashPickup: boolean;
  acceptsCod: boolean;
  whatsappE164: string;
  recommendChat: string;
  heroHeadline: string;
  heroSub: string;
  about: string;
  faq: Array<{ q: string; a: string }>;
  how: Array<{ title: string; body: string }>;
  agentWrote: boolean | null;
  agentWarning: string;
  foodAttested: boolean;
}

const emptyState = (): BuilderState => ({
  step: 1,
  templateId: '',
  storeName: '',
  phone: '',
  pickupAddress: '',
  island: 'Trinidad',
  specialty: '',
  hours: '',
  payoutPreference: '',
  acceptsCashPickup: false,
  acceptsCod: false,
  whatsappE164: '',
  recommendChat: '',
  heroHeadline: '',
  heroSub: '',
  about: '',
  faq: [],
  how: [],
  agentWrote: null,
  agentWarning: '',
  foodAttested: false,
});

async function requestDraft(payload: Record<string, unknown>): Promise<{ draft: DraftCopy; warning?: string }> {
  const token = getToken();
  const res = await fetch('/api/onboard/draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Draft failed (${res.status})`);
  return data;
}

const StoreBuilderV3: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<BuilderState>(emptyState);
  const [wamConfigured, setWamConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWamStatus().then((s) => setWamConfigured(s.configured));
    const raw = searchParams.get('template') || '';
    if (raw) {
      const id = resolveStarterId(raw);
      setState((prev) => ({
        ...prev,
        templateId: id,
        heroHeadline: prev.heroHeadline || STORE_STARTERS[id].heroHeadline,
      }));
    }
  }, [searchParams]);

  const update = useCallback((patch: Partial<BuilderState>) => {
    setState((prev) => ({ ...prev, ...patch }));
    setError(null);
  }, []);

  const go = (step: Step) => {
    setState((prev) => ({ ...prev, step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const previewModel: StorefrontModel = useMemo(() => {
    const id = (state.templateId || 'general') as StarterId;
    const starter = STORE_STARTERS[id];
    const wa = normalizeWhatsappE164(state.whatsappE164);
    return {
      templateId: id,
      storeName: state.storeName.trim() || 'Your store',
      island: state.island,
      specialty: state.specialty,
      hours: state.hours,
      pickupAddress: state.pickupAddress,
      whatsappE164: wa,
      currency: 'TT$',
      acceptsCashPickup: state.acceptsCashPickup,
      acceptsCod: state.acceptsCod,
      wamLive: wamConfigured && state.payoutPreference === 'wam',
      reviewCount: 0,
      items: [],
      hero: {
        headline: state.heroHeadline || starter.heroHeadline,
        sub: state.heroSub || [state.specialty, state.island].filter(Boolean).join(' · '),
      },
      about: state.about,
      faq: state.faq.length ? state.faq : defaultFaq({
        acceptsPickup: state.acceptsCashPickup,
        acceptsCod: state.acceptsCod,
        hours: state.hours,
        pickupAddress: state.pickupAddress,
      }),
      how: state.how.length ? state.how : defaultHowSteps({
        templateId: id,
        acceptsPickup: state.acceptsCashPickup,
        acceptsCod: state.acceptsCod,
        wamLive: wamConfigured && state.payoutPreference === 'wam',
      }),
      mode: 'merchant_preview',
    };
  }, [state, wamConfigured]);

  const applyDraft = (draft: DraftCopy, warning?: string) => {
    update({
      templateId: draft.templateId,
      heroHeadline: draft.hero?.headline || STORE_STARTERS[draft.templateId].heroHeadline,
      heroSub: draft.hero?.sub || '',
      about: draft.about || '',
      faq: draft.faq || [],
      how: draft.how || [],
      agentWrote: !!draft.agentWrote,
      agentWarning: warning || (draft.agentWrote ? '' : 'Grok is not writing this site. The form and locked copy are shown instead.'),
    });
  };

  const handleRecommend = async () => {
    if (!state.recommendChat.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await requestDraft({
        storeName: state.storeName.trim() || 'Your store',
        chat: state.recommendChat.trim(),
        templateId: state.templateId || undefined,
      });
      applyDraft(result.draft, result.warning);
      go(2);
    } catch (err: any) {
      setError(err.message || 'Could not recommend a starter.');
    } finally {
      setBusy(false);
    }
  };

  const handleDraft = async () => {
    if (!state.storeName.trim()) {
      setError('Store name is required');
      return;
    }
    if (!state.templateId) {
      setError('Pick a starter first');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await requestDraft({
        storeName: state.storeName.trim(),
        templateId: state.templateId,
        phone: state.phone,
        pickupAddress: state.pickupAddress,
        island: state.island,
        specialty: state.specialty,
        hours: state.hours,
        payoutPreference: state.payoutPreference || undefined,
        acceptsCashPickup: state.acceptsCashPickup,
        acceptsCod: state.acceptsCod,
        whatsappE164: normalizeWhatsappE164(state.whatsappE164) || undefined,
      });
      applyDraft(result.draft, result.warning);
      go(3);
    } catch (err: any) {
      setError(err.message || 'Could not build a draft.');
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!state.storeName.trim() || !state.templateId) {
      setError('Name and starter are required');
      return;
    }
    if (state.templateId === 'food' && !state.foodAttested) {
      setError('Food shops must attest to food-safety before publish.');
      return;
    }
    if (!getToken()) {
      navigate('/signup?next=/create-store');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const wa = normalizeWhatsappE164(state.whatsappE164);
      const store = await storesApi.create({
        name: state.storeName.trim(),
        description: state.about.trim() || undefined,
        category: state.templateId,
        phone: state.phone.trim() || undefined,
        whatsapp: wa || undefined,
        accepts_cod: state.acceptsCod,
        accepts_pickup: state.acceptsCashPickup,
        pickup_address: state.pickupAddress.trim() || undefined,
        island: state.island || undefined,
        template_id: state.templateId,
        theme_config: {
          template_id: state.templateId,
          business_type: state.templateId,
          hours: state.hours || undefined,
          specialty: state.specialty || undefined,
          payout_preference: state.payoutPreference || undefined,
          hero: { headline: state.heroHeadline, sub: state.heroSub },
          about: state.about,
          faq: state.faq,
          how: state.how,
          food_attestation: state.templateId === 'food' ? true : undefined,
          kitchen_check: state.templateId === 'food' && state.foodAttested ? 'auto_approved' : undefined,
          agent_wrote: state.agentWrote === true,
        },
      });
      navigate(`/store/${store.slug}`);
    } catch (err: any) {
      setError(err.message || 'Could not publish.');
    } finally {
      setBusy(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Pick a starter</h2>
        <p className="text-gray-600">Six types. Same chrome. Grok can recommend one — still one of these six.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STARTER_IDS.map((id) => {
          const s = STORE_STARTERS[id];
          const selected = state.templateId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => update({ templateId: id, heroHeadline: s.heroHeadline })}
              className={`text-left rounded-2xl border-2 p-5 min-h-[160px] transition ${
                selected ? 'border-stone-800 bg-stone-50' : 'border-gray-200 hover:border-stone-400'
              }`}
            >
              <div className="text-xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>{s.name}</div>
              <p className="text-sm text-gray-600 mt-2">{s.useWhen}</p>
              <p className="text-xs text-gray-500 mt-3">{s.heroHeadline}</p>
            </button>
          );
        })}
      </div>
      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-800">Or describe the shop and let Grok pick one of the six</label>
        <textarea
          value={state.recommendChat}
          onChange={(e) => update({ recommendChat: e.target.value })}
          rows={2}
          className="w-full rounded-xl border border-gray-300 px-3 py-3 min-h-[44px]"
          placeholder="e.g. evening roti from Tunapuna"
        />
        <button
          type="button"
          onClick={handleRecommend}
          disabled={busy || !state.recommendChat.trim()}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-stone-800 text-white font-semibold disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Recommend a starter
        </button>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!state.templateId}
          onClick={() => go(2)}
          className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-xl bg-stone-900 text-white font-semibold disabled:opacity-40"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell us about the shop</h2>
        <p className="text-gray-600">Grok prefills hero and about from this. It does not invent catalog items.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Business name *" value={state.storeName} onChange={(v) => update({ storeName: v })} placeholder="Your shop name" />
        <Field label="Phone" value={state.phone} onChange={(v) => update({ phone: v })} placeholder="868…" />
        <Field label="Pickup address" value={state.pickupAddress} onChange={(v) => update({ pickupAddress: v })} placeholder="Street, area" />
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">Island / country</span>
          <select
            value={state.island}
            onChange={(e) => update({ island: e.target.value })}
            className="w-full min-h-[44px] rounded-xl border border-gray-300 px-3"
          >
            <option>Trinidad</option>
            <option>Tobago</option>
            <option>Trinidad & Tobago</option>
          </select>
        </label>
        <Field label="Specialty (optional)" value={state.specialty} onChange={(v) => update({ specialty: v })} placeholder="roti, linen, fades…" />
        <Field label="Hours (buyer-visible, free text)" value={state.hours} onChange={(v) => update({ hours: v })} placeholder="Leave blank to hide" />
        <label className="block md:col-span-2">
          <span className="block text-sm font-medium text-gray-700 mb-2">Payout preference</span>
          <select
            value={state.payoutPreference}
            onChange={(e) => update({ payoutPreference: e.target.value as BuilderState['payoutPreference'] })}
            className="w-full min-h-[44px] rounded-xl border border-gray-300 px-3"
          >
            <option value="">Not chosen yet</option>
            <option value="cash_vendor_keeps">Cash — vendor keeps</option>
            <option value="bank_transfer">Bank transfer</option>
            {wamConfigured ? <option value="wam">Wam</option> : null}
          </select>
        </label>
        <label className="flex items-center gap-3 min-h-[44px]">
          <input type="checkbox" checked={state.acceptsCashPickup} onChange={(e) => update({ acceptsCashPickup: e.target.checked })} />
          <span>Cash on pickup</span>
        </label>
        <label className="flex items-center gap-3 min-h-[44px]">
          <input type="checkbox" checked={state.acceptsCod} onChange={(e) => update({ acceptsCod: e.target.checked })} />
          <span>Cash on delivery</span>
        </label>
        <div className="md:col-span-2">
          <Field
            label="WhatsApp E.164 (optional — only if you type it)"
            value={state.whatsappE164}
            onChange={(v) => update({ whatsappE164: v })}
            placeholder="+1868…"
          />
          <p className="text-xs text-gray-500 mt-1">We never invent a number. Button stays hidden until this is a real E.164.</p>
        </div>
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={() => go(1)} className="inline-flex items-center gap-2 min-h-[44px] px-4 text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleDraft}
          disabled={busy || !state.storeName.trim()}
          className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-xl bg-stone-900 text-white font-semibold disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Draft my store
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Preview {state.storeName || 'your store'}</h2>
        <p className="text-gray-600">
          {state.agentWrote
            ? 'Grok wrote the copy below. Edit anything. Regenerating is optional.'
            : state.agentWarning || 'Showing locked copy. The agent did not write this site.'}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <Field label="Hero headline" value={state.heroHeadline} onChange={(v) => update({ heroHeadline: v })} />
          <Field label="Hero line" value={state.heroSub} onChange={(v) => update({ heroSub: v })} />
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-2">About</span>
            <textarea value={state.about} onChange={(e) => update({ about: e.target.value })} rows={4} className="w-full rounded-xl border border-gray-300 px-3 py-3" />
          </label>
          <p className="text-xs text-gray-500">Catalog stays empty until you add a real item. No Sample Product N.</p>
        </div>
        <div className="lg:col-span-3 border border-gray-200 rounded-2xl overflow-hidden max-h-[720px] overflow-y-auto">
          <JuvayStorefront model={previewModel} />
        </div>
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={() => go(2)} className="inline-flex items-center gap-2 min-h-[44px] px-4 text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button type="button" onClick={() => go(4)} className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-xl bg-stone-900 text-white font-semibold">
          Review publish <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Publish when you choose</h2>
        <p className="text-gray-600">Preview first. Publish is a separate action. Nothing goes live until you tap Publish.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 p-5 space-y-2">
        <div className="text-2xl font-semibold">{state.storeName}</div>
        <div className="text-gray-600">{STORE_STARTERS[state.templateId as StarterId]?.name} · {state.island}</div>
        <div className="text-sm text-gray-500">{state.heroHeadline}</div>
        <div className="text-sm text-gray-500">Catalog: empty until you add a real item.</div>
      </div>
      {state.templateId === 'food' && (
        <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <input type="checkbox" checked={state.foodAttested} onChange={(e) => update({ foodAttested: e.target.checked })} className="mt-1" />
          <span className="text-sm text-amber-950">
            I attest this kitchen follows food-safety rules I am responsible for. A kitchen-check record of <code>auto_approved</code> is stored only — it does not publish the shop.
          </span>
        </label>
      )}
      <div className="flex justify-between">
        <button type="button" onClick={() => go(3)} disabled={busy} className="inline-flex items-center gap-2 min-h-[44px] px-4 text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={busy || (state.templateId === 'food' && !state.foodAttested)}
          className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-xl bg-stone-900 text-white font-semibold disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Publish store
        </button>
      </div>
    </div>
  );

  return (
    <SafeBoundary name="StoreBuilder">
      <div className="min-h-screen bg-[#f7f4ef] py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6 flex items-center justify-between text-sm text-gray-600">
            <span>Create store</span>
            <span>Step {state.step} of 4</span>
          </div>
          <div className="h-2 bg-stone-200 rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-stone-800 transition-all" style={{ width: `${(state.step / 4) * 100}%` }} />
          </div>
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              {error}
            </div>
          )}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8">
            {state.step === 1 && renderStep1()}
            {state.step === 2 && renderStep2()}
            {state.step === 3 && renderStep3()}
            {state.step === 4 && renderStep4()}
          </div>
        </div>
      </div>
    </SafeBoundary>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({
  label, value, onChange, placeholder,
}) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 mb-2">{label}</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full min-h-[44px] rounded-xl border border-gray-300 px-3"
    />
  </label>
);

const StoreBuilderWithBoundary: React.FC = () => (
  <SafeBoundary name="StoreBuilder">
    <StoreBuilderV3 />
  </SafeBoundary>
);

export default StoreBuilderWithBoundary;
export { StoreBuilderV3 };
