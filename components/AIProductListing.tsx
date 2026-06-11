import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, Sparkles, Check, Loader2, RefreshCw, AlertCircle,
  X, Image as ImageIcon, ArrowRight,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { aiService } from '../services/ai';
import { storeService } from '../services/storeService';

/**
 * AIProductListing
 *
 * Merchant takes/uploads a product photo → GPT-4o-mini vision generates
 * name/description/price/category/tags → merchant edits anything they want →
 * saves directly to their store's products.
 *
 * No mock data. No fake delays. The previous version had a `setTimeout(3000)`
 * and a local JS object with "Sample Product" names. This one actually calls
 * the vision model.
 *
 * Props are optional so the route-level page can mount it without knowing the
 * current store yet — we resolve that from the session.
 */

type Step = 'upload' | 'processing' | 'review' | 'saved';

interface AIProductListingProps {
  /** Store id to save the product into. If omitted we look up the logged-in user's first store. */
  storeId?: string;
  /** Called after a successful save. Receives the inserted product row. */
  onComplete?: (product: any) => void;
}

interface Draft {
  name: string;
  description: string;
  price: string; // kept as string for controlled input
  category: string;
  tags: string;  // comma-separated string for easy editing
  imageUrl: string;
  confidence: 'high' | 'medium' | 'low';
}

const CATEGORY_OPTIONS = [
  'food', 'retail', 'fashion', 'electronics', 'home',
  'beauty', 'health', 'services', 'automotive', 'books',
  'toys', 'sports', 'art', 'other',
];

export const AIProductListing: React.FC<AIProductListingProps> = ({
  storeId: propStoreId,
  onComplete,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [resolvedStoreId, setResolvedStoreId] = useState<string | null>(propStoreId ?? null);
  const [resolvedStoreName, setResolvedStoreName] = useState<string | null>(null);
  const [resolvedStoreCategory, setResolvedStoreCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Resolve the merchant's store once on mount if we weren't given one
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (propStoreId) {
        // Fetch store name/category for better AI hints
        const { data } = await supabase
          .from('stores')
          .select('id, name, category')
          .eq('id', propStoreId)
          .single();
        if (!cancelled && data) {
          setResolvedStoreName(data.name);
          setResolvedStoreCategory(data.category);
        }
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: stores } = await supabase
        .from('stores')
        .select('id, name, category')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (cancelled) return;
      if (stores && stores.length) {
        setResolvedStoreId(stores[0].id);
        setResolvedStoreName(stores[0].name);
        setResolvedStoreCategory(stores[0].category);
      }
    })();
    return () => { cancelled = true; };
  }, [propStoreId]);

  const pickFile = (file: File | null) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image is too large (max 8 MB). Try a smaller photo.');
      return;
    }
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Could not prepare image for AI analysis.'));
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!imageFile) return;
    if (!resolvedStoreId) {
      setError('We could not find a store on your account. Create a store first, then come back.');
      return;
    }
    setError(null);
    setStep('processing');

    try {
      const localImageUrl = await fileToDataUrl(imageFile);

      // Ask the backend vision gateway to describe the product before storage upload.
      const ai = await aiService.generateProductFromImage(localImageUrl, {
        storeName: resolvedStoreName ?? undefined,
        storeCategory: resolvedStoreCategory ?? undefined,
      });

      setDraft({
        name: ai.name,
        description: ai.description,
        price: String(ai.suggested_price_ttd || ''),
        category: CATEGORY_OPTIONS.includes(ai.category) ? ai.category : 'other',
        tags: ai.tags.join(', '),
        imageUrl: imagePreview || localImageUrl,
        confidence: ai.confidence,
      });
      setStep('review');
    } catch (err: any) {
      console.error('AI lister error:', err);
      setError(err?.message || 'Something went wrong generating the listing.');
      setStep('upload');
    }
  };

  const handleSave = async () => {
    if (!draft || !resolvedStoreId) return;
    setError(null);
    setSaving(true);
    try {
      const priceNum = Number(draft.price);
      const tagList = draft.tags.split(',').map(t => t.trim()).filter(Boolean);
      let productImageUrl = draft.imageUrl;

      if (imageFile) {
        const ext = (imageFile.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${resolvedStoreId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(path, imageFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: imageFile.type,
          });
        if (uploadErr) throw new Error('Upload failed: ' + uploadErr.message);

        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
        productImageUrl = urlData.publicUrl;
      }

      // Use storeService.addProduct so all the column-mapping stays in one place.
      const product = await storeService.addProduct(resolvedStoreId, {
        name: draft.name,
        description: draft.description,
        base_price: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 0,
        stock: 1, // merchant can edit from the inventory list after save
        category: draft.category,
        image_url: productImageUrl,
        status: 'active',
      } as any);

      // Also stamp tags directly (addProduct doesn't currently pass tags)
      if (product?.id && tagList.length > 0) {
        await supabase.from('products').update({ tags: tagList }).eq('id', product.id);
      }

      setStep('saved');
      if (onComplete && product) onComplete(product);
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err?.message || 'Could not save the product. Try again?');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageFile(null);
    setDraft(null);
    setError(null);
    setStep('upload');
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      {/* Store context banner */}
      {resolvedStoreName && (
        <div className="mb-4 text-sm text-gray-600">
          Saving to <span className="font-bold text-gray-900">{resolvedStoreName}</span>
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* ───────── UPLOAD STEP ───────── */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm"
          >
            <h2 className="text-xl font-black text-gray-900 mb-2">Snap or upload a product photo</h2>
            <p className="text-gray-600 text-sm mb-6">
              Our AI will write the listing — name, description, price suggestion, category, and tags.
              You can edit everything before saving.
            </p>

            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                  <img src={imagePreview} alt="product preview" className="w-full max-h-96 object-contain" />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 rounded-full bg-black/70 hover:bg-black text-white w-9 h-9 flex items-center justify-center"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleGenerate}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E61E2B] hover:bg-[#C41E3A] text-white font-bold transition-colors disabled:opacity-50"
                    disabled={!resolvedStoreId}
                  >
                    <Sparkles className="w-5 h-5" /> Generate listing with AI
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-3 rounded-xl border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold"
                  >
                    Change photo
                  </button>
                </div>
                {!resolvedStoreId && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    You need to create a store first before you can save AI-generated products.
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#E61E2B] hover:bg-red-50 transition-colors"
                >
                  <Camera className="w-8 h-8 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Take photo</span>
                  <span className="text-xs text-gray-500">Use your camera</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#E61E2B] hover:bg-red-50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Upload file</span>
                  <span className="text-xs text-gray-500">JPG / PNG, up to 8 MB</span>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <input
              ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </motion.div>
        )}

        {/* ───────── PROCESSING STEP ───────── */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
              <Loader2 className="w-8 h-8 text-[#E61E2B] animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reading the photo…</h3>
            <p className="text-sm text-gray-600">Usually takes 3–8 seconds.</p>
          </motion.div>
        )}

        {/* ───────── REVIEW STEP ───────── */}
        {step === 'review' && draft && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-gray-900">Review & edit</h2>
                <p className="text-sm text-gray-600">
                  Change anything that doesn't look right.
                  {draft.confidence !== 'high' && (
                    <span className="ml-1 text-amber-700">
                      AI confidence: <span className="font-semibold">{draft.confidence}</span> — double-check the details.
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="w-4 h-4" /> Start over
              </button>
            </div>

            <div className="grid md:grid-cols-[180px_1fr] gap-5">
              {/* Image preview */}
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
                <img src={draft.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>

              {/* Fields */}
              <div className="space-y-4">
                <Field label="Product name">
                  <input
                    type="text" value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E61E2B]"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price (TT$)">
                    <input
                      type="number" inputMode="decimal" min="0" step="0.01"
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E61E2B]"
                    />
                  </Field>
                  <Field label="Category">
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E61E2B]"
                    >
                      {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </div>

            <Field label="Description">
              <textarea
                rows={5} value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E61E2B]"
              />
            </Field>

            <Field label="Tags" hint="Comma-separated. Helps customers find this product in search.">
              <input
                type="text" value={draft.tags}
                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                placeholder="e.g. unlocked, 256gb, apple"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E61E2B]"
              />
            </Field>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !draft.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E61E2B] hover:bg-[#C41E3A] text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {saving ? 'Saving…' : 'Add to my store'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ───────── SAVED STEP ───────── */}
        {step === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Product added!</h3>
            <p className="text-sm text-gray-600 mb-6">It's live in your store now.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E61E2B] hover:bg-[#C41E3A] text-white font-semibold"
              >
                <ImageIcon className="w-4 h-4" /> Add another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
    {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
  </div>
);

export default AIProductListing;
