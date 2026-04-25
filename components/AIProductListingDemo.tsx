import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Sparkles, Loader2, ArrowRight, X, CheckCircle2, AlertCircle, RefreshCw, Camera,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DEMO_SAMPLES, DemoSample } from '../data/demoSamples';
import { supabase } from '../services/supabaseClient';
import { aiService } from '../services/ai';
import { RateLimiter } from '../services/rateLimiter';
import type { ProductListingOptimized } from '../services/aiListingOptimizer';

/**
 * AIProductListingDemo — landing-page interactive demo.
 *
 * NEW (April 2026): LIVE WORKING DEMO on landing page.
 * 
 * Two modes:
 *  1. LIVE UPLOAD (anonymous, rate-limited)
 *     - Visitor uploads ANY photo
 *     - Real eBay-class AI processes it
 *     - Shows full result (all 20 fields)
 *     - CTA: "Create free store to save this listing"
 *     - Rate limit: 5 photos per IP per 24h
 *     - Cost: ~1 cent per demo
 * 
 *  2. SAMPLE TILES (zero-cost fallback)
 *     - Click a sample → fake 2.5s skeleton → canned result
 *     - Proves the concept without burning tokens
 * 
 * Design intent:
 *  - Instant proof: "I just watched it work on MY product"
 *  - Zero friction (no signup to test)
 *  - High conversion ("I already have my first listing done")
 *  - Controlled cost (rate limiter prevents abuse)
 * 
 * GA4 events fired:
 *  - demo_upload_started    : user uploaded their own photo
 *  - demo_upload_completed  : real AI returned result
 *  - demo_sample_started    : user clicked a sample tile
 *  - demo_sample_completed  : sample result appeared
 *  - demo_rate_limited      : user hit 5/day limit
 *  - cta_clicked            : user clicked "Create free store"
 *
 * Variant control:
 *  - Reads ?v=b from URL for an A/B variant of the headline + CTA copy.
 */

type DemoResult = DemoSample['result'];

// Extended to support both sample results AND live AI results
type Phase =
  | { kind: 'idle' }
  | { kind: 'loading'; source: 'sample' | 'upload'; imageUrl: string }
  | { kind: 'result'; source: 'sample'; imageUrl: string; data: DemoResult }
  | { kind: 'result'; source: 'upload'; imageUrl: string; data: ProductListingOptimized }
  | { kind: 'error'; message: string };

// Tiny GA4 helper — no-op if gtag isn't present
const ga = (name: string, params?: Record<string, any>) => {
  try {
    const w = window as any;
    if (typeof w.gtag === 'function') w.gtag('event', name, params || {});
  } catch { /* ignore */ }
};

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; resetAt: number } | null>(null);
  
  const sectionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    ga('demo_sample_started', { sample_id: sample.id });
    setPhase({ kind: 'loading', source: 'sample', imageUrl: sample.imageUrl });
    // Deliberate pause — if it resolves instantly users don't register that
    // something happened. 2.5s is the sweet spot between "fake" and "too slow".
    setTimeout(() => {
      setPhase({ kind: 'result', source: 'sample', imageUrl: sample.imageUrl, data: sample.result });
      ga('demo_sample_completed', { sample_id: sample.id });
    }, 2500);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhase({ kind: 'error', message: 'Please upload an image file (JPG, PNG, WebP, etc.)' });
      return;
    }

    // Validate file size (3MB max to keep costs down)
    if (file.size > 3 * 1024 * 1024) {
      setPhase({ kind: 'error', message: 'Image too large (max 3MB). Try a smaller photo or compress it.' });
      return;
    }

    setImageFile(file);
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadPreview(URL.createObjectURL(file));
  };

  const runLiveUpload = async () => {
    if (!imageFile) return;

    // Check rate limit FIRST
    const limit = RateLimiter.checkLimit();
    if (!limit.allowed) {
      const resetTime = RateLimiter.formatResetTime(limit.resetAt);
      setPhase({
        kind: 'error',
        message: `You've used all 5 free demos today. Try again in ${resetTime}, or create a free store for unlimited AI listings.`,
      });
      ga('demo_rate_limited', { resetAt: limit.resetAt });
      return;
    }

    setPhase({ kind: 'loading', source: 'upload', imageUrl: uploadPreview! });
    ga('demo_upload_started', {});

    try {
      // 1. Upload to Supabase Storage (demo bucket, public read)
      const ext = (imageFile.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `demo/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadErr) {
        throw new Error('Upload failed: ' + uploadErr.message);
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      // 2. Call the real eBay-class AI optimizer
      const listing = await aiService.generateProductFromImage(publicUrl, {
        merchantNote: 'Landing page demo upload',
      });

      // 3. Record the upload (increment rate limit counter)
      RateLimiter.recordUpload();
      const newLimit = RateLimiter.checkLimit();
      setRateLimitInfo({ remaining: newLimit.remaining, resetAt: newLimit.resetAt });

      // 4. Show result
      setPhase({ kind: 'result', source: 'upload', imageUrl: publicUrl, data: listing });
      ga('demo_upload_completed', { confidence: listing.confidence });

    } catch (err: any) {
      console.error('Live upload error:', err);
      setPhase({ 
        kind: 'error', 
        message: err?.message || 'AI processing failed. Try again or use a different photo.' 
      });
    }
  };

  const reset = () => {
    setPhase({ kind: 'idle' });
    setImageFile(null);
    if (uploadPreview) {
      URL.revokeObjectURL(uploadPreview);
      setUploadPreview(null);
    }
  };

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
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
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
                <span className="px-3 text-xs text-gray-400 uppercase tracking-wide">or try with your own photo</span>
                <div className="border-t border-gray-200 flex-1" />
              </div>

              {/* Live Upload Box */}
              <div className="max-w-md mx-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
                />
                
                {!uploadPreview ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-3 px-6 py-8 rounded-2xl border-2 border-dashed border-gray-300 hover:border-trini-red hover:bg-red-50 transition-all duration-200 group"
                  >
                    <div className="w-14 h-14 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                      <Camera className="w-7 h-7 text-trini-red" />
                    </div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-gray-900 mb-1">
                        Upload your product photo
                      </p>
                      <p className="text-sm text-gray-500">
                        See our AI create a full listing — no signup needed
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Max 3MB • JPG, PNG, WebP
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                      <img
                        src={uploadPreview}
                        alt="Upload preview"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={reset}
                        className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <button
                      onClick={runLiveUpload}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-trini-red hover:bg-red-600 text-white font-semibold transition-colors shadow-sm"
                    >
                      <Sparkles className="w-5 h-5" />
                      Generate listing with AI
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    {rateLimitInfo && rateLimitInfo.remaining < 5 && (
                      <p className="text-xs text-center text-gray-500">
                        {rateLimitInfo.remaining} free {rateLimitInfo.remaining === 1 ? 'demo' : 'demos'} remaining today
                      </p>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 text-center">
                Creating a free store unlocks the AI lister for your own photos — no limit.
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
                      Reading the photo…
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
                        {phase.source === 'upload' ? 'AI listing generated from your photo' : 'Sample listing generated'}
                      </span>
                      {phase.data.confidence && phase.data.confidence !== 'high' && (
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

                    {/* Warnings (live uploads only) */}
                    {phase.source === 'upload' && phase.data.warnings && phase.data.warnings.length > 0 && (
                      <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        {phase.data.warnings.map((warn, i) => (
                          <p key={i} className="text-xs text-amber-800">{warn}</p>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-3">
                      {phase.data.description}
                    </p>

                    {/* Item Specifics (live uploads only) */}
                    {phase.source === 'upload' && (
                      <div className="mb-3 space-y-2">
                        {(phase.data.brand || phase.data.model || phase.data.condition || phase.data.size || phase.data.color || phase.data.material) && (
                          <div className="text-xs text-gray-600 space-y-1">
                            {phase.data.brand && <div><span className="font-semibold">Brand:</span> {phase.data.brand}</div>}
                            {phase.data.model && <div><span className="font-semibold">Model:</span> {phase.data.model}</div>}
                            {phase.data.condition && <div><span className="font-semibold">Condition:</span> {phase.data.condition}</div>}
                            {phase.data.size && <div><span className="font-semibold">Size:</span> {phase.data.size}</div>}
                            {phase.data.color && <div><span className="font-semibold">Color:</span> {phase.data.color}</div>}
                            {phase.data.material && <div><span className="font-semibold">Material:</span> {phase.data.material}</div>}
                          </div>
                        )}
                        {phase.data.detected_text && (
                          <div className="text-xs text-gray-500">
                            <span className="font-semibold">Detected text:</span> {phase.data.detected_text}
                          </div>
                        )}
                      </div>
                    )}

                    {phase.data.tags && phase.data.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {phase.data.tags.map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            #{tag}
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
