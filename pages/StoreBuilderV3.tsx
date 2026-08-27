/**
 * Create-store path: pick a starter, Grok draft (or honest fallback),
 * preview the merchant's empty store, edit for real, publish on purpose.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { storesApi, getToken } from '../services/selfHostedApi';
import { fetchWamStatus } from '../services/wamStatus';
import { STORE_STARTERS, STARTER_IDS, ISLAND, resolveStarterId, defaultFaq, defaultHowSteps, type StarterId } from '../services/storeStarters';
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
  heroImage: string;
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
  heroImage: '',
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

async function requestPatch(payload: Record<string, unknown>): Promise<{
  proposed: DraftCopy & { hours?: string };
  changedFields: string[];
  conflicts: string[];
  agentWrote: boolean;
  warning?: string;
}> {
  const token = getToken();
  const res = await fetch('/api/onboard/patch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Patch failed (${res.status})`);
  return data;
}

const StoreBuilderV3: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<BuilderState>(emptyState);
  const [wamConfigured, setWamConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patchChat, setPatchChat] = useState('');
  const [proposed, setProposed] = useState<{
    heroHeadline: string;
    heroSub: string;
    about: string;
    hours: string;
    changedFields: string[];
    conflicts: string[];
    warning?: string;
  } | null>(null);

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
        image: state.heroImage || undefined,
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

  const handlePatch = async () => {
    if (!patchChat.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await requestPatch({
        instruction: patchChat.trim(),
        templateId: state.templateId || 'general',
        current: {
          templateId: state.templateId,
          hero: { headline: state.heroHeadline, sub: state.heroSub, image: state.heroImage },
          about: state.about,
          hours: state.hours,
        },
        locked: {
          headline: state.heroHeadline,
          about: state.about,
          hours: state.hours,
        },
      });
      if (!result.changedFields?.length) {
        setProposed(null);
        setError(result.warning || 'Grok did not change any copy. Your text is unchanged.');
        return;
      }
      setProposed({
        heroHeadline: result.proposed?.hero?.headline || state.heroHeadline,
        heroSub: result.proposed?.hero?.sub || state.heroSub,
        about: result.proposed?.about || state.about,
        hours: result.proposed?.hours || state.hours,
        changedFields: result.changedFields,
        conflicts: result.conflicts || [],
        warning: result.warning,
      });
    } catch (err: any) {
      setError(err.message || 'Could not propose a change.');
    } finally {
      setBusy(false);
    }
  };

  const applyProposed = () => {
    if (!proposed) return;
    update({
      heroHeadline: proposed.heroHeadline,
      heroSub: proposed.heroSub,
      about: proposed.about,
      hours: proposed.hours,
    });
    setProposed(null);
    setPatchChat('');
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
          hero: { headline: state.heroHeadline, sub: state.heroSub, image: state.heroImage || undefined },
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
    <div style={{ display: 'grid', gap: 28 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 400, margin: '0 0 8px' }}>
          Pick a starter
        </h2>
        <p style={{ color: '#6b6256', maxWidth: '40ch', margin: '0 auto' }}>
          Eight starters. Same chrome. Grok can recommend one — still one of these eight.
        </p>
      </div>
      <div className="juvay-pick-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {STARTER_IDS.map((id) => {
          const s = STORE_STARTERS[id];
          const selected = state.templateId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => update({ templateId: id, heroHeadline: s.heroHeadline })}
              style={{
                textAlign: 'left',
                border: selected ? '2px solid #141414' : '1px solid #e6dfd4',
                background: ISLAND.sand,
                padding: 0,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              <div style={{ height: 22, background: '#f3efe8', display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d9d3c8' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d9d3c8' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d9d3c8' }} />
              </div>
              <div style={{ height: 140, overflow: 'hidden', position: 'relative', background: s.palette.heroBg }}>
                <img src={s.heroImage} alt="" width={640} height={360} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {s.heroLayout === 'split' ? (
                  <div style={{ position: 'absolute', left: 10, top: 12, color: s.palette.heroText, fontFamily: s.palette.headingFont, fontSize: 16, maxWidth: '46%' }}>
                    {s.heroHeadline}
                  </div>
                ) : (
                  <div style={{ position: 'absolute', left: 12, bottom: 12, color: s.palette.heroText, fontFamily: s.palette.headingFont, fontSize: 18 }}>
                    {s.name}
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 12px 14px' }}>
                <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 16 }}>{s.name}</div>
                <p style={{ margin: '4px 0 0', color: '#6b6256', fontSize: 13 }}>{s.useWhen}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ borderTop: '1px solid #e6dfd4', paddingTop: 18, display: 'grid', gap: 10 }}>
        <label style={{ fontSize: 14 }}>Or describe the shop and let Grok pick one of the eight</label>
        <textarea
          value={state.recommendChat}
          onChange={(e) => update({ recommendChat: e.target.value })}
          rows={2}
          style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: 12 }}
          placeholder="e.g. evening roti from Tunapuna"
        />
        <button
          type="button"
          onClick={handleRecommend}
          disabled={busy || !state.recommendChat.trim()}
          style={{ minHeight: 44, width: 220, border: 'none', background: ISLAND.mango, color: ISLAND.mangoInk, fontWeight: 700, cursor: 'pointer' }}
        >
          {busy ? 'Working…' : 'Recommend a starter'}
        </button>
      </div>
      <div style={{ position: 'sticky', bottom: 0, zIndex: 12, background: ISLAND.sand, borderTop: '1px solid #e6dfd4', padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          disabled={!state.templateId}
          onClick={() => go(2)}
          style={{ minHeight: 44, minWidth: 140, border: 'none', background: '#141414', color: ISLAND.sand, fontWeight: 600, cursor: 'pointer', opacity: state.templateId ? 1 : 0.4 }}
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 400, margin: '0 0 8px' }}>Tell us about the shop</h2>
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
      <div style={{ position: 'sticky', bottom: 0, zIndex: 12, background: ISLAND.sand, borderTop: '1px solid #e6dfd4', padding: '12px 0', display: 'flex', justifyContent: 'space-between' }}>
        <button type="button" onClick={() => go(1)} style={{ minHeight: 44, background: 'none', border: 'none', color: '#3d3429' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleDraft}
          disabled={busy || !state.storeName.trim()}
          style={{ minHeight: 44, minWidth: 140, border: 'none', background: '#141414', color: ISLAND.sand, fontWeight: 600, opacity: state.storeName.trim() ? 1 : 0.4 }}
        >
          {busy ? 'Working…' : 'Draft my store'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 400, margin: '0 0 8px' }}>
          Preview {state.storeName || 'your store'}
        </h2>
        <p style={{ color: '#6b6256', maxWidth: '42ch' }}>
          {state.agentWrote
            ? 'Grok wrote the copy below. Click text to edit. Regenerating is optional.'
            : state.agentWarning || 'Showing locked copy. The agent did not write this site.'}
        </p>
      </div>
      <div className="juvay-preview-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: 20 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <Field label="Hero headline" value={state.heroHeadline} onChange={(v) => update({ heroHeadline: v })} />
          <Field label="Hero line" value={state.heroSub} onChange={(v) => update({ heroSub: v })} />
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>About</span>
            <textarea value={state.about} onChange={(e) => update({ about: e.target.value })} rows={4} style={{ width: '100%', minHeight: 88, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: 12 }} />
          </label>
          <p style={{ margin: 0, fontSize: 12, color: '#6b6256' }}>Click the headline or about on the preview to edit. Tap the hero to upload a photo. Catalog stays empty until you add a real item.</p>
          <div style={{ borderTop: '1px solid #e6dfd4', paddingTop: 12, display: 'grid', gap: 8 }}>
            <label style={{ fontSize: 14 }}>Ask Grok to propose a change</label>
            <textarea
              value={patchChat}
              onChange={(e) => setPatchChat(e.target.value)}
              rows={2}
              style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: 12 }}
              placeholder="e.g. shorter headline, keep my about"
            />
            <button
              type="button"
              onClick={handlePatch}
              disabled={busy || !patchChat.trim()}
              style={{ minHeight: 44, border: 'none', background: ISLAND.mango, color: ISLAND.mangoInk, fontWeight: 700, cursor: 'pointer' }}
            >
              {busy ? 'Working…' : 'Propose change'}
            </button>
            {proposed ? (
              <div style={{ border: '1px solid #cfc8bc', padding: 12, display: 'grid', gap: 8, background: '#fff' }}>
                <div style={{ fontSize: 13, color: '#6b6256' }}>
                  Proposed: {proposed.changedFields.join(', ')}
                  {proposed.conflicts.length ? ` — you already wrote ${proposed.conflicts.join(', ')}` : ''}
                </div>
                {proposed.changedFields.includes('hero.headline') ? <div><strong>Headline</strong> {proposed.heroHeadline}</div> : null}
                {proposed.changedFields.includes('about') ? <div><strong>About</strong> {proposed.about}</div> : null}
                {proposed.changedFields.includes('hours') ? <div><strong>Hours</strong> {proposed.hours}</div> : null}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={applyProposed} style={{ minHeight: 44, padding: '0 14px', border: 'none', background: '#141414', color: ISLAND.sand }}>Apply this patch</button>
                  <button type="button" onClick={() => setProposed(null)} style={{ minHeight: 44, padding: '0 14px', border: '1px solid #141414', background: 'transparent' }}>Keep mine</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div style={{ border: '1px solid #e6dfd4', maxHeight: 720, overflow: 'auto' }}>
          <JuvayStorefront
            model={previewModel}
            editor={{
              onFieldChange: (field, value) => {
                if (field === 'headline') update({ heroHeadline: value });
                if (field === 'sub') update({ heroSub: value });
                if (field === 'about') update({ about: value });
              },
              onHeroUpload: (dataUrl) => update({ heroImage: dataUrl }),
            }}
          />
        </div>
      </div>
      <div style={{ position: 'sticky', bottom: 0, zIndex: 12, background: ISLAND.sand, borderTop: '1px solid #e6dfd4', padding: '12px 0', display: 'flex', justifyContent: 'space-between' }}>
        <button type="button" onClick={() => go(2)} style={{ minHeight: 44, background: 'none', border: 'none', color: '#3d3429' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button type="button" onClick={() => go(4)} style={{ minHeight: 44, minWidth: 140, border: 'none', background: '#141414', color: ISLAND.sand, fontWeight: 600 }}>
          Review publish
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div>
        <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 400, margin: '0 0 8px' }}>Publish when you choose</h2>
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
      <div style={{ minHeight: '100vh', background: ISLAND.sand, color: '#1a1a1a', fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap" />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px 64px' }}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6256' }}>
            <span>Create store</span>
            <span>Step {state.step} of 4</span>
          </div>
          <div style={{ height: 2, background: '#e6dfd4', marginBottom: 24 }}>
            <div style={{ height: '100%', background: '#141414', width: `${(state.step / 4) * 100}%` }} />
          </div>
          {error && (
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, border: '1px solid #e6dfd4', padding: 12, fontSize: 14 }}>
              <AlertCircle className="w-4 h-4 mt-0.5" />
              {error}
            </div>
          )}
          <div style={{ background: ISLAND.sand }}>
            {state.step === 1 && renderStep1()}
            {state.step === 2 && renderStep2()}
            {state.step === 3 && renderStep3()}
            {state.step === 4 && renderStep4()}
          </div>
        </div>
        <style>{`
          @media (max-width: 900px) {
            .juvay-pick-grid { grid-template-columns: 1fr !important; }
            .juvay-preview-split { grid-template-columns: 1fr !important; }
          }
        `}</style>
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
      style={{ width: '100%', minHeight: 44, border: '1px solid #cfc8bc', background: ISLAND.sand, padding: '0 12px' }}
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
