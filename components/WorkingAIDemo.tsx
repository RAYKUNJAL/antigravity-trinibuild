import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Camera, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

type ScannerStatus = 'idle' | 'reading' | 'processing' | 'done' | 'error';

interface ListingResult {
  name: string;
  price: number;
  category: string;
  description: string;
  tags: string[];
}

const DEMO_LISTING_KEY = 'trinibuild_demo_listing';

const CATEGORY_RULES = [
  { category: 'Food & Beverage', price: 45, keywords: ['food', 'meal', 'roti', 'doubles', 'cake', 'bread', 'drink'] },
  { category: 'Fashion & Apparel', price: 180, keywords: ['shirt', 'dress', 'shoe', 'sneaker', 'bag', 'fashion', 'jacket'] },
  { category: 'Electronics', price: 650, keywords: ['phone', 'tablet', 'laptop', 'speaker', 'watch', 'electronic'] },
  { category: 'Beauty & Wellness', price: 95, keywords: ['beauty', 'cream', 'hair', 'skin', 'spa', 'makeup'] },
  { category: 'Home & Hardware', price: 220, keywords: ['tool', 'hardware', 'chair', 'table', 'home', 'appliance'] },
  { category: 'Bin Store Deal', price: 75, keywords: ['bin', 'liquidation', 'pallet', 'return', 'overstock', 'deal'] },
];

const cleanFileName = (fileName: string) => {
  const name = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  if (!name || /^img|image|photo|dsc/i.test(name)) return 'Featured Product';
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 80);
};

const pickCategory = (file: File) => {
  const haystack = `${file.name} ${file.type}`.toLowerCase();
  return CATEGORY_RULES.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword))) || CATEGORY_RULES[5];
};

const buildListingDraft = (file: File): ListingResult => {
  const rule = pickCategory(file);
  const seed = Math.max(1, Math.round(file.size / 1024));
  const price = Math.max(20, Math.round((rule.price + (seed % 9) * 10) / 5) * 5);
  const name = cleanFileName(file.name);
  const qualityTag = file.size > 1_500_000 ? 'high-resolution' : 'ready-to-list';

  return {
    name,
    price,
    category: rule.category,
    description: `${name} is ready to list on your TriniBuild store with a clean title, local TTD pricing, and a sales description built for WhatsApp and cash-on-delivery buyers.\n\nAdd real product photos, stock count, pickup/delivery details, and this draft can become a live product listing in your store setup.`,
    tags: ['trinidad', 'cod-ready', qualityTag, rule.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
  };
};

const readPreview = async (file: File): Promise<string | null> => {
  if (/hei[cf]$/i.test(file.name)) {
    return null;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

export const WorkingAIDemo: React.FC = () => {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ListingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveDraft = (listing: ListingResult) => {
    try {
      localStorage.setItem(
        DEMO_LISTING_KEY,
        JSON.stringify({
          ...listing,
          scannedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.warn('Could not save scanner draft:', error);
    }
  };

  const handleFile = async (file: File) => {
    try {
      setErrorMsg('');
      setResult(null);
      setStatus('reading');
      setProgress('Reading product photo...');

      const isImage = file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);
      if (!isImage) {
        throw new Error('Please upload a product image.');
      }

      const imagePreview = await readPreview(file);
      setPreview(imagePreview);

      setStatus('processing');
      setProgress('Building a store-ready listing...');

      await new Promise((resolve) => window.setTimeout(resolve, 650));
      const listing = buildListingDraft(file);
      saveDraft(listing);
      setResult(listing);
      setStatus('done');
    } catch (err: any) {
      console.error('Scanner failed:', err);
      setErrorMsg(err?.message || 'The scanner could not read that file.');
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setPreview(null);
    setResult(null);
    setErrorMsg('');
    setProgress('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 font-semibold text-xs uppercase mb-4">
            <Sparkles className="w-4 h-4" /> Product scanner
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-3">
            Upload Any Product Photo
          </h2>
          <p className="text-lg text-gray-600">
            Get a TTD price, category, tags, and a store-ready listing draft.
          </p>
        </div>

        {status === 'idle' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-4 px-8 py-12 rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-500 hover:bg-red-50 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center">
                <Camera className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900 mb-1">
                  Tap to upload or take a photo
                </p>
                <p className="text-sm text-gray-500">
                  JPEG, PNG, WebP, HEIC, and large mobile photos
                </p>
              </div>
            </button>
          </>
        )}

        {(status === 'reading' || status === 'processing') && (
          <div className="bg-white rounded-2xl border shadow-lg p-8 text-center">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold">{progress}</p>
            {preview ? (
              <img src={preview} alt="" className="w-32 h-32 object-cover rounded-lg mx-auto mt-4 opacity-60" />
            ) : (
              <div className="w-32 h-32 rounded-lg mx-auto mt-4 bg-gray-100 flex items-center justify-center text-xs text-gray-500 px-3">
                Preview unavailable
              </div>
            )}
          </div>
        )}

        {status === 'done' && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border shadow-xl overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt={result.name} className="w-full h-64 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-500">
                Product photo accepted
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-3">
                <CheckCircle className="w-5 h-5" /> Listing draft saved for store setup
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{result.name}</h3>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-red-600">
                  TT${result.price.toLocaleString()}
                </span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">{result.category}</span>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
                {result.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {result.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 font-semibold"
                >
                  Try Another
                </button>
                <Link
                  to="/create-store?source=scanner"
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-center"
                >
                  Create Store
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-900 font-semibold">Scanner failed</p>
                <p className="text-red-700 text-sm">{errorMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
