import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Check, Copy, Share2, RefreshCw, Loader2,
  UploadCloud, AlertCircle, Camera, MessageCircle,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { track } from '../services/eventTracker';

// ── Types ───────────────────────────────────────────────────────────────────

type IslandId = 'tt' | 'jm' | 'bb' | 'gy' | 'lc' | 'gd' | 'other';

interface IslandOption {
  id: IslandId;
  label: string;
  flag: string;
}

interface CategoryOption {
  id: string;
  label: string;
  emoji: string;
}

interface ColorPreset {
  id: string;
  name: string;
  hex: string;
}

// ── Static config ───────────────────────────────────────────────────────────

const ISLANDS: IslandOption[] = [
  { id: 'tt', label: 'Trinidad & Tobago', flag: '🇹🇹' },
  { id: 'jm', label: 'Jamaica', flag: '🇯🇲' },
  { id: 'bb', label: 'Barbados', flag: '🇧🇧' },
  { id: 'gy', label: 'Guyana', flag: '🇬🇾' },
  { id: 'lc', label: 'St. Lucia', flag: '🇱🇨' },
  { id: 'gd', label: 'Grenada', flag: '🇬🇩' },
  { id: 'other', label: 'Other', flag: '🌴' },
];

const CATEGORIES: CategoryOption[] = [
  { id: 'food', label: 'Food & Drinks', emoji: '🍽️' },
  { id: 'fashion', label: 'Fashion & Clothing', emoji: '👗' },
  { id: 'beauty', label: 'Beauty & Hair', emoji: '💄' },
  { id: 'services', label: 'Services', emoji: '🛠️' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
  { id: 'other', label: 'Other Products', emoji: '📦' },
];

const COLORS: ColorPreset[] = [
  { id: 'coral', name: 'Coral Red', hex: '#DC2626' },
  { id: 'ocean', name: 'Ocean Blue', hex: '#0EA5E9' },
  { id: 'sunset', name: 'Sunset Orange', hex: '#F97316' },
  { id: 'forest', name: 'Forest Green', hex: '#16A34A' },
  { id: 'golden', name: 'Golden Yellow', hex: '#EAB308' },
  { id: 'midnight', name: 'Midnight Purple', hex: '#7C3AED' },
];

const TOTAL_STEPS = 5;

// ── Helpers ─────────────────────────────────────────────────────────────────

const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6);

const islandFlair: Record<IslandId, string> = {
  tt: 'Trini',
  jm: 'Yardie',
  bb: 'Bajan',
  gy: 'Guyanese',
  lc: 'Lucian',
  gd: 'Spice Isle',
  other: 'Island',
};

const categoryFlair: Record<string, string> = {
  food: 'Flavours',
  fashion: 'Styles',
  beauty: 'Glow',
  services: 'Pros',
  electronics: 'Tech',
  other: 'Goods',
};

const generateStoreName = (category: string, island: IslandId, firstName: string): string => {
  const flair = islandFlair[island] || 'Island';
  const noun = categoryFlair[category] || 'Goods';
  const name = firstName.trim() || 'You';
  return `${flair} ${noun} by ${name}`;
};

// ── Component ───────────────────────────────────────────────────────────────

export const JuvayOnboarding: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [fadeKey, setFadeKey] = useState(0);

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [island, setIsland] = useState<IslandId>('tt');

  // Step 2
  const [category, setCategory] = useState<string>('');

  // Step 3
  const [storeName, setStoreName] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [color, setColor] = useState<ColorPreset>(COLORS[0]);

  // Step 4
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');
  const [live, setLive] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 5
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImageUrl, setProductImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Re-trigger fade animation whenever step changes
  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [step]);

  // Keep AI suggestion in sync with choices
  useEffect(() => {
    if (category && firstName) {
      setAiSuggestion(generateStoreName(category, island, firstName));
    }
  }, [category, island, firstName]);

  const canContinueStep1 = firstName.trim().length > 0;
  const canContinueStep2 = !!category;
  const canContinueStep3 = storeName.trim().length > 0;

  const goNext = () => {
    if (step === 1) {
      track('onboarding_step', 'onboarding', { step: 1, island });
    } else if (step === 2) {
      track('onboarding_step', 'onboarding', { step: 2, category });
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const useSuggestion = () => setStoreName(aiSuggestion);

  const refreshSuggestion = () => {
    const base = generateStoreName(category, island, firstName);
    const suffixes = ['', ' Co.', ' Boutique', ' & Co', ' Hub'];
    const pick = suffixes[Math.floor(Math.random() * suffixes.length)];
    setAiSuggestion(base + pick);
  };

  // ── Step 4: actually create the store ────────────────────────────────────
  const createStore = async (): Promise<void> => {
    setCreating(true);
    setCreateError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCreateError('You must be logged in to create a store.');
        setCreating(false);
        return;
      }

      const slug = generateSlug(storeName);

      const { data, error } = await supabase.from('stores').insert({
        owner_id: user.id,
        name: storeName,
        slug,
        category,
        island,
        status: 'active',
        color_scheme: { primary: color.hex },
        theme_config: { template_id: 'island-commerce', business_type: category },
      }).select().single();

      if (error || !data) {
        setCreateError('Could not create store, try again');
        setCreating(false);
        return;
      }

      setStoreSlug(slug);
      setStoreId(data.id);
      setLive(true);
      track('store_created', 'merchant', { store_id: data.id, category, island });
    } catch (err) {
      console.error('store creation error', err);
      setCreateError('Could not create store, try again');
    } finally {
      setCreating(false);
    }
  };

  // Auto-kick store creation when arriving at step 4
  useEffect(() => {
    if (step === 4 && !creating && !live && !createError && !storeSlug) {
      const t = setTimeout(() => {
        createStore();
      }, 1500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const storeUrl = useMemo(() => `juvay.app/store/${storeSlug}`, [storeSlug]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(`https://${storeUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Check out my store on Juvay: https://${storeUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // ── Step 5: product image upload ─────────────────────────────────────────
  const handleImagePick = async (file: File | null) => {
    if (!file) return;
    if (!storeId) {
      setPublishError('Finish creating your store first.');
      return;
    }
    setUploadingImage(true);
    setPublishError(null);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
      setProductImageUrl(pub.publicUrl);
      setProductImage(file);
    } catch (err: any) {
      setPublishError(err?.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const publishProduct = async () => {
    if (!storeId) {
      setPublishError('No store found.');
      return;
    }
    if (!productName.trim() || !productPrice) {
      setPublishError('Add a product name and price.');
      return;
    }
    setPublishing(true);
    setPublishError(null);
    try {
      const priceNum = Number(productPrice);
      const slug = generateSlug(productName);
      const { error } = await supabase.from('products').insert({
        store_id: storeId,
        name: productName.trim(),
        slug,
        description: '',
        base_price: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 0,
        image_url: productImageUrl || null,
        images: productImageUrl ? [productImageUrl] : [],
        status: 'active',
      });
      if (error) throw new Error(error.message);
      track('product_published', 'merchant', { store_id: storeId, first_product: true });
      navigate('/store-builder');
    } catch (err: any) {
      setPublishError(err?.message || 'Could not publish product.');
    } finally {
      setPublishing(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────

  const ProgressBar = () => (
    <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 z-20">
      <div
        className="h-full bg-white transition-all duration-500 ease-out"
        style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
      />
    </div>
  );

  const BackButton = () => (
    <button
      onClick={goBack}
      className="flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors"
    >
      <ArrowLeft className="h-4 w-4 mr-1" /> Back
    </button>
  );

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const Step1 = (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-orange-500 flex flex-col">
      <ProgressBar />
      <div
        key={fadeKey}
        className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full animate-fade-in"
      >
        <h1 className="text-5xl font-extrabold text-white text-center tracking-tight">JUVAY</h1>
        <p className="text-center text-white/90 mt-2 mb-10 text-lg">
          The Caribbean Commerce Platform
        </p>

        <label className="block text-white font-semibold mb-2">What's your name?</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="e.g. Marcus"
          className="w-full px-4 py-4 rounded-xl text-lg text-gray-900 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30"
        />

        <label className="block text-white font-semibold mt-6 mb-2">Your island</label>
        <div className="relative">
          <select
            value={island}
            onChange={(e) => setIsland(e.target.value as IslandId)}
            className="w-full appearance-none px-4 py-4 pr-10 rounded-xl text-lg text-gray-900 bg-white shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30"
          >
            {ISLANDS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.flag} {opt.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
        </div>

        <button
          onClick={goNext}
          disabled={!canContinueStep1}
          className="mt-10 w-full bg-white text-red-600 font-bold text-lg py-4 rounded-xl shadow-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          Let's Build Your Store →
        </button>
      </div>
    </div>
  );

  // ── Step 2 ────────────────────────────────────────────────────────────────
  const Step2 = (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between px-6 pt-6 max-w-md mx-auto w-full">
        <BackButton />
        <span className="text-xs font-semibold text-gray-400">Step {step} of {TOTAL_STEPS}</span>
      </div>
      <div
        key={fadeKey}
        className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full animate-fade-in"
      >
        <h2 className="text-2xl font-extrabold text-gray-900">What do you sell?</h2>
        <p className="text-gray-500 mb-6">Pick the one that fits best — you can change later.</p>

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((c) => {
            const selected = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 p-5 transition-all active:scale-[0.97] ${
                  selected
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-4xl mb-2">{c.emoji}</span>
                <span className={`text-sm font-semibold text-center ${selected ? 'text-red-700' : 'text-gray-700'}`}>
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={goNext}
          disabled={!canContinueStep2}
          className="mt-8 w-full bg-red-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          Continue →
        </button>
      </div>
    </div>
  );

  // ── Step 3 ────────────────────────────────────────────────────────────────
  const Step3 = (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between px-6 pt-6 max-w-md mx-auto w-full">
        <BackButton />
        <span className="text-xs font-semibold text-gray-400">Step {step} of {TOTAL_STEPS}</span>
      </div>
      <div
        key={fadeKey}
        className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full animate-fade-in"
      >
        <h2 className="text-2xl font-extrabold text-gray-900">Name your store</h2>
        <p className="text-gray-500 mb-6">This is what customers will see.</p>

        <label className="block text-gray-700 font-semibold mb-2">What's your store called?</label>
        <input
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="e.g. Trini Flavours by Marcus"
          className="w-full px-4 py-4 rounded-xl text-lg border border-gray-300 focus:outline-none focus:ring-4 focus:ring-red-200"
        />

        {aiSuggestion && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={useSuggestion}
              className="flex-1 flex items-center text-left bg-red-50 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-100 transition-colors"
            >
              <span className="text-xs text-red-700 font-semibold mr-1">AI suggests:</span>
              <span className="text-sm text-gray-800 truncate">{aiSuggestion}</span>
            </button>
            <button
              onClick={refreshSuggestion}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              aria-label="Refresh suggestion"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        )}

        <label className="block text-gray-700 font-semibold mt-6 mb-2">Pick your brand color</label>
        <div className="grid grid-cols-6 gap-2">
          {COLORS.map((c) => {
            const selected = color.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setColor(c)}
                className={`h-12 w-full rounded-xl flex items-center justify-center transition-all ${
                  selected ? 'ring-4 ring-offset-2 ring-gray-400' : ''
                }`}
                style={{ backgroundColor: c.hex }}
                aria-label={c.name}
              >
                {selected && <Check className="h-5 w-5 text-white" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">{color.name}</p>

        <button
          onClick={goNext}
          disabled={!canContinueStep3}
          className="mt-8 w-full bg-red-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          My store is ready →
        </button>
      </div>
    </div>
  );

  // ── Step 4 ────────────────────────────────────────────────────────────────
  const Step4 = (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between px-6 pt-6 max-w-md mx-auto w-full">
        <BackButton />
        <span className="text-xs font-semibold text-gray-400">Step {step} of {TOTAL_STEPS}</span>
      </div>
      <div
        key={fadeKey}
        className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-md mx-auto w-full animate-fade-in text-center"
      >
        {creating && (
          <>
            <Loader2 className="h-16 w-16 text-red-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-gray-900">Creating your store...</h2>
            <p className="text-gray-500 mt-2">Hang tight, this only takes a moment.</p>
          </>
        )}

        {createError && (
          <>
            <AlertCircle className="h-16 w-16 text-red-600 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900">Could not create store</h2>
            <p className="text-gray-500 mt-2 mb-6">{createError}</p>
            <button
              onClick={() => {
                setCreateError(null);
                setCreating(false);
                setStoreSlug('');
                setStep(3);
              }}
              className="bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700"
            >
              Try again
            </button>
          </>
        )}

        {live && !creating && !createError && (
          <>
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-bounce">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Your store is LIVE! 🎉</h2>

            <div className="mt-6 w-full">
              <p className="text-sm text-gray-500 mb-1">Your store URL</p>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-3">
                <span className="flex-1 text-left text-sm text-gray-800 truncate">{storeUrl}</span>
                <button
                  onClick={copyUrl}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Copy URL"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-600" />}
                </button>
              </div>
            </div>

            <button
              onClick={shareWhatsApp}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-600 transition-all"
            >
              <MessageCircle className="h-5 w-5" /> Share on WhatsApp
            </button>

            <button
              onClick={goNext}
              className="mt-4 w-full bg-red-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-red-700 transition-all active:scale-[0.98]"
            >
              Add your first product →
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ── Step 5 ────────────────────────────────────────────────────────────────
  const Step5 = (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between px-6 pt-6 max-w-md mx-auto w-full">
        <BackButton />
        <span className="text-xs font-semibold text-gray-400">Step {step} of {TOTAL_STEPS}</span>
      </div>
      <div
        key={fadeKey}
        className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full animate-fade-in"
      >
        <h2 className="text-2xl font-extrabold text-gray-900">Add your first product</h2>
        <p className="text-gray-500 mb-6">Takes 60 seconds. Your customers are waiting.</p>

        <label className="block text-gray-700 font-semibold mb-2">Product name</label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="e.g. Pepper Sauce 250ml"
          className="w-full px-4 py-4 rounded-xl text-lg border border-gray-300 focus:outline-none focus:ring-4 focus:ring-red-200"
        />

        <label className="block text-gray-700 font-semibold mt-4 mb-2">Price (TTD)</label>
        <input
          type="number"
          inputMode="decimal"
          value={productPrice}
          onChange={(e) => setProductPrice(e.target.value)}
          placeholder="e.g. 25.00"
          className="w-full px-4 py-4 rounded-xl text-lg border border-gray-300 focus:outline-none focus:ring-4 focus:ring-red-200"
        />

        <label className="block text-gray-700 font-semibold mt-4 mb-2">Product photo</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImagePick(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-8 hover:border-red-400 hover:bg-red-50 transition-colors"
        >
          {uploadingImage ? (
            <Loader2 className="h-8 w-8 text-red-600 animate-spin mb-2" />
          ) : productImageUrl ? (
            <img src={productImageUrl} alt="product" className="h-20 w-20 object-cover rounded-lg" />
          ) : (
            <Camera className="h-8 w-8 text-gray-400 mb-2" />
          )}
          <span className="text-sm text-gray-600">
            {uploadingImage ? 'Uploading...' : productImageUrl ? 'Change photo' : 'Tap to upload'}
          </span>
        </button>

        {publishError && (
          <p className="mt-3 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" /> {publishError}
          </p>
        )}

        <button
          onClick={publishProduct}
          disabled={publishing || !productName.trim() || !productPrice}
          className="mt-6 w-full bg-red-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {publishing ? 'Publishing...' : 'Publish it!'}
        </button>

        <button
          onClick={() => navigate('/store-builder')}
          className="mt-3 text-sm text-gray-500 font-medium hover:text-gray-700"
        >
          I'll add products later →
        </button>
      </div>
    </div>
  );

  // ── Step switch ───────────────────────────────────────────────────────────
  if (step === 1) return Step1;
  if (step === 2) return Step2;
  if (step === 3) return Step3;
  if (step === 4) return Step4;
  return Step5;
};

export default JuvayOnboarding;
