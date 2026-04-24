import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Sparkles, Loader2, ArrowRight, X, CheckCircle2, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DEMO_SAMPLES, DemoSample } from '../data/demoSamples';
import { supabase } from '../services/supabaseClient';

/**
 * AIProductListingDemo — landing-page interactive demo.
 *
 * Design intent:
 *  - Above the fold, answers "does this actually work?" in under 6 seconds.
 *  - Click a sample → fake 2.5s skeleton → canned result (zero-cost, instant).
 *  - "Try your own photo" → real upload + real edge function call (rate-limited
 *    server-side to 5 per IP per 24h, with the OpenAI key kept server-side).
 *  - Every result card ends with a single strong CTA: "Claim your free store".
 *  - No fake countdown timers, no fake "N people just signed up" tickers.
 *
 * GA4 events fired:
 *  - demo_started       : user clicked any demo entry point
 *  - demo_completed     : a result card appeared (sample OR real)
 *  - demo_own_photo     : a real AI call was attempted
 *  - cta_clicked        : user clicked "Claim your free store" from the result
 *
 * Variant control:
 *  - Reads ?v=b from URL for an A/B variant of the headline + CTA copy.
 */

type DemoResult = DemoSample['result'];
type Phase =
  | { kind: 'idle' }
  | { kind: 'loading'; source: 'sample' | 'own'; imageUrl: string }
  | { kind: 'result'; source: 'sample' | 'own'; imageUrl: string; data: DemoResult; info?: string }
  | { kind: 'error'; message: string };

// Tiny GA4 helper — no-op if gtag isn't present
const ga = (name: string, params?: Record<string, any>) => {
  try {
    const w = window as any;
    if (typeof w.gtag === 'function') w.gtag('event', name, params || {});
  } catch { /* ignore */ }
};

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://cdprbbyptjdntcrhmwxf.supabase.co';
const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/generate-product-listing-demo`;

const CATEGORY_LABEL: Record<string, string> = {
  food: 'Food',
  retail: 'Retail',
  fashion: 'Fashion',
  electronics: 'Electronics',
  home: 'Home',
  beauty: 'Beauty',
  health: 'Health',
  services: 'Services',
  automotive: 'Automotive',
  books: 'Books',
  toys: 'Toys',
  sports: 'Sports',
  art: 'Art & Craft',
  other: 'Other',
};

export const AIProductListingDemo: React.FC = () => {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [variant, setVariant] = useState<'a' | 'b'>('a');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('v') === 'b') setVariant('b');
  }, []);

  const headline = variant === 'b'
    ? 'Photo in. Full product listing out.'
    : 'Snap a photo. AI writes the listing.';
  const sub = variant === 'b'
    ? 'Skip the "what do I even write?" part. Our AI reads the photo and fills in the name, description, price, category, and tags — all ready for your store.'
    : 'The AI reads your photo and fills in the name, description, price, category, and tags. You edit anything you want, then save to your store.';
  const ctaText = variant === 'b' ? 'Claim your free store →' : 'Start my free store →';

  const runSample = (sample: DemoSample) => {
    ga('demo_started', { source: 'sample', sample_id: sample.id });
    setPhase({ kind: 'loading', source: 'sample', imageUrl: sample.imageUrl });
    // Deliberate pause — if it resolves instantly users don't register that
    // something happened. 2.5s is the sweet spot between "fake" and "too slow".
    setTimeout(() => {
      setPhase({ kind: 'result', source: 'sample', imageUrl: sample.imageUrl, data: sample.result });
      ga('demo_completed', { source: 'sample', sample_id: sample.id });
    }, 2500);
  };

  const runOwnPhoto = async (file: File) => {
    ga('demo_started', { source: 'own' });
    ga('demo_own_photo', {});
    if (!file.type.startsWith('image/')) {
      setPhase({ kind: 'error', message: 'Please choose an image file.' });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhase({ kind: 'error', message: 'Image too large (max 8 MB).' });
      return;
    }

    const objectPreview = URL.createObjectURL(file);
    setPhase({ kind: 'loading', source: 'own', imageUrl: objectPreview });

    try {
      // 1. Upload to Supabase Storage so we have a public HTTPS URL for the AI
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `demo/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (uploadErr) throw new Error('Upload failed: ' + uploadErr.message);

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // 2. Call the edge function
      const { data: session } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      // Anon key works for public edge functions; attach any active session too
      const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
      if (anonKey) headers['apikey'] = anonKey;
      if (session?.session?.access_token) headers['Authorization'] = `Bearer ${session.session.access_token}`;
      else if (anonKey) headers['Authorization'] = `Bearer ${anonKey}`;

      const res = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image_url: publicUrl }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body?.error || 'Something went wrong. Please try again.');
      }

      setPhase({
        kind: 'result',
        source: 'own',
        imageUrl: publicUrl,
        data: {
          name: body.name,
          description: body.description,
          suggested_price_ttd: body.suggested_price_ttd,
          category: body.category,
          tags: body.tags || [],
          confidence: body.confidence || 'medium',
        },
      });
      ga('demo_completed', { source: 'own' });
    } catch (err: any) {
      console.error('demo own-photo error:', err);
      setPhase({ kind: 'error', message: err?.message || 'Could not generate listing. Please try again.' });
    }
  };

  const reset = () => setPhase({ kind: 'idle' });

  return (
    <section
      ref={sectionRef}
      className="relative py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-100"
      id="ai-demo"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-trini-red font-semibold text-xs tracking-wide uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Live AI demo
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">
            {headline}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            {sub}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ───────── IDLE: sample picker + upload ───────── */}
          {phase.kind === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-5"
            >
              <div className="text-sm text-gray-500 text-center mb-4">
                Click a sample to see the AI work — or upload your own product photo.
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {DEMO_SAMPLES.map(sample => (
                  <button
                    key={sample.id}
                    onClick={() => runSample(sample)}
                    className="group relative rounded-xl overflow-hidden border-2 border-gray-200 hover:border-trini-red transition-colors aspect-square bg-gray-50"
                  >
                    <img
                      src={sample.imageUrl}
                      alt={sample.label}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 text-white text-sm font-semibold text-left">
                      {sample.label}
                    </div>
                    <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="w-3.5 h-3.5 text-trini-red" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative flex items-center justify-center py-3">
                <div className="border-t border-gray-200 flex-1" />
                <span className="px-3 text-xs text-gray-400 uppercase tracking-wide">or</span>
                <div className="border-t border-gray-200 flex-1" />
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-trini-red hover:bg-red-50 text-gray-700 font-semibold transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Try with your own photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) runOwnPhoto(f);
                    e.target.value = '';
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                Your photo is uploaded to TriniBuild and analyzed by GPT-4o-mini. Up to 5 free tries per day.
              </p>
            </motion.div>
          )}

          {/* ───────── LOADING ───────── */}
          {phase.kind === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="grid md:grid-cols-[200px_1fr]">
                  <div className="aspect-square md:aspect-auto bg-gray-100 overflow-hidden">
                    <img src={phase.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-trini-red font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {phase.source === 'sample' ? 'Reading the photo…' : 'Reading your photo…'}
                    </div>
                    <SkeletonLine widthPct={85} heightPx={20} />
                    <SkeletonLine widthPct={60} heightPx={14} />
                    <div className="space-y-1.5 pt-2">
                      <SkeletonLine widthPct={96} />
                      <SkeletonLine widthPct={92} />
                      <SkeletonLine widthPct={78} />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <SkeletonPill />
                      <SkeletonPill />
                      <SkeletonPill />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ───────── RESULT ───────── */}
          {phase.kind === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                <div className="grid md:grid-cols-[200px_1fr]">
                  <div className="aspect-square md:aspect-auto bg-gray-100 overflow-hidden">
                    <img src={phase.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">
                        {phase.source === 'sample' ? 'Sample listing generated' : 'Listing generated by AI'}
                      </span>
                      {phase.data.confidence !== 'high' && (
                        <span className="ml-auto text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          AI confidence: {phase.data.confidence}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 leading-snug">
                      {phase.data.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm mb-3">
                      <span className="font-bold text-trini-red">
                        TT${phase.data.suggested_price_ttd.toLocaleString()}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-600">{CATEGORY_LABEL[phase.data.category] || phase.data.category}</span>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-3">
                      {phase.data.description}
                    </p>

                    {phase.data.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {phase.data.tags.map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA band */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white px-5 py-5 sm:py-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                    <div>
                      <div className="font-bold text-base sm:text-lg mb-0.5">This is what your store looks like.</div>
                      <div className="text-sm text-gray-300">
                        Your first 10 listings are free. No credit card required.
                      </div>
                    </div>
                    <Link
                      to="/signup"
                      onClick={() => ga('cta_clicked', { location: 'demo_result', source: phase.source })}
                      className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-trini-red hover:bg-red-700 text-white font-bold transition-colors whitespace-nowrap"
                    >
                      {ctaText}
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center mt-4">
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try another photo
                </button>
              </div>
            </motion.div>
          )}

          {/* ───────── ERROR ───────── */}
          {phase.kind === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-red-900 mb-1">Demo hit a snag</div>
                  <div className="text-sm text-red-700 mb-3">{phase.message}</div>
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-900"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Try again
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

const SkeletonLine: React.FC<{ widthPct?: number; heightPx?: number }> = ({ widthPct = 100, heightPx = 10 }) => (
  <div
    className="rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.4s_infinite]"
    style={{ width: `${widthPct}%`, height: heightPx }}
  />
);

const SkeletonPill: React.FC = () => (
  <div className="rounded-full bg-gray-100 h-5 w-14 animate-pulse" />
);

export default AIProductListingDemo;
