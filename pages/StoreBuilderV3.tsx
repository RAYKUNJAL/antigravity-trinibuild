/**
 * TRINIBUILD STORE BUILDER v3 - COMMERCIAL GRADE
 * 
 * Architecture based on Shopify, Medusa, Saleor research (2026):
 * - Single source of truth (one component, one route)
 * - Error boundaries at every level
 * - React.lazy for templates (no eager loading)
 * - localStorage auto-save (never lose work)
 * - Direct Supabase calls (no abstraction)
 * - CSS transitions only (no Framer Motion in critical path)
 * - Mobile-first responsive
 * - Production-ready error handling
 * 
 * Flow: Choose Type → Pick Template → Customize → Launch
 * Time: 3 minutes to live store
 */

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Store, Shirt, Utensils, Sparkles, ShoppingBag, Briefcase, MoreHorizontal,
  Check, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, AlertCircle, Sparkle
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import { SafeBoundary } from '../components/SafeBoundary';

// ─── Types ─────────────────────────────────────────────────────────────

interface BusinessType {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  recommendedTemplate: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  bestFor: string[];
  accent: string;
  sections: string[];
  componentLoader: () => Promise<{ default: React.ComponentType<any> }>;
}

interface StoreBuilderState {
  step: 1 | 2 | 3 | 4;
  businessType: string;
  templateId: string;
  storeName: string;
  tagline: string;
  primaryColor: string;
  description: string;
  category: string;
  phone: string;
  whatsapp: string;
}

const DRAFT_KEY = 'trinibuild_store_draft_v3';
const DEMO_LISTING_KEY = 'trinibuild_demo_listing';
const LOCAL_STORES_KEY = 'trinibuild_local_stores';

const TEMPLATE_ALIASES: Record<string, string> = {
  basic_storefront: 'professional',
  roti_shop_pro: 'restaurant',
  doubles_breakfast_pro: 'restaurant',
  restaurant_premium: 'restaurant',
  clothing_store_pro: 'fashion',
  salon_barber_pro: 'beauty',
  pharmacy_medical_pro: 'ecommerce',
  electronics_tech_pro: 'ecommerce',
  bakery_sweets_pro: 'restaurant',
  auto_parts_pro: 'ecommerce',
  hardware_home_pro: 'ecommerce',
  gym_fitness_pro: 'professional',
  jewelry_luxury_pro: 'fashion',
  multi_location_enterprise: 'professional',
  bin_store_daily_deals: 'bin-store',
  liquidation_store: 'bin-store',
};

const BUSINESS_BY_TEMPLATE: Record<string, string> = {
  professional: 'services',
  fashion: 'fashion',
  restaurant: 'food',
  beauty: 'beauty',
  ecommerce: 'retail',
  'bin-store': 'liquidation',
};

const resolveTemplateId = (templateId: string | null) => {
  if (!templateId) return '';
  return TEMPLATE_ALIASES[templateId] || templateId;
};

const getScannerListing = () => {
  try {
    const raw = localStorage.getItem(DEMO_LISTING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Could not load scanner listing:', error);
    return null;
  }
};

const makeStoreSlug = (storeName: string) => {
  const base = storeName
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'store';

  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
};

const saveLocalStore = (slug: string, store: any) => {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORES_KEY) || '{}');
    current[slug] = store;
    localStorage.setItem(LOCAL_STORES_KEY, JSON.stringify(current));
  } catch (error) {
    console.warn('Could not save local store:', error);
  }
};

// ─── Business Types ────────────────────────────────────────────────────

const BUSINESS_TYPES: BusinessType[] = [
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    icon: Shirt,
    description: 'Clothing, accessories, jewelry',
    recommendedTemplate: 'fashion',
  },
  {
    id: 'food',
    name: 'Food & Beverage',
    icon: Utensils,
    description: 'Restaurants, bakeries, food delivery',
    recommendedTemplate: 'restaurant',
  },
  {
    id: 'beauty',
    name: 'Beauty & Wellness',
    icon: Sparkles,
    description: 'Salons, spas, cosmetics',
    recommendedTemplate: 'beauty',
  },
  {
    id: 'retail',
    name: 'General Retail',
    icon: ShoppingBag,
    description: 'Electronics, household, gifts',
    recommendedTemplate: 'ecommerce',
  },
  {
    id: 'liquidation',
    name: 'Bin Store & Liquidation',
    icon: Store,
    description: 'Daily drops, pallets, overstock deals',
    recommendedTemplate: 'bin-store',
  },
  {
    id: 'services',
    name: 'Professional Services',
    icon: Briefcase,
    description: 'Consulting, agency, freelancing',
    recommendedTemplate: 'professional',
  },
  {
    id: 'other',
    name: 'Other',
    icon: MoreHorizontal,
    description: 'Tell us about your business',
    recommendedTemplate: 'professional',
  },
];

// ─── Templates (LAZY-LOADED for performance) ──────────────────────────

const TEMPLATES: Template[] = [
  {
    id: 'professional',
    name: 'Professional 3-Column',
    description: 'Clean, conversion-focused layout. Works for any business.',
    preview: '🏢',
    bestFor: ['All Types', 'Most Versatile'],
    accent: '#1F2937',
    sections: ['Hero CTA', 'Services', 'Proof', 'WhatsApp lead form'],
    componentLoader: () => import('../components/templates/Premium3ColumnTemplate').then(m => ({ default: m.Premium3ColumnTemplate })),
  },
  {
    id: 'fashion',
    name: 'Fashion Boutique',
    description: 'Elegant fashion showcase with image-first design.',
    preview: '👗',
    bestFor: ['Fashion', 'Boutiques'],
    accent: '#EC4899',
    sections: ['Lookbook', 'Product grid', 'Size guide', 'COD checkout'],
    componentLoader: () => import('../components/templates/PremiumFashionTemplate').then(m => ({ default: m.PremiumFashionTemplate })),
  },
  {
    id: 'restaurant',
    name: 'Restaurant Menu',
    description: 'Beautiful menu showcase with categories and reservations.',
    preview: '🍽️',
    bestFor: ['Restaurants', 'Cafes'],
    accent: '#EA580C',
    sections: ['Menu', 'Daily specials', 'Delivery zones', 'Booking'],
    componentLoader: () => import('../components/templates/PremiumRestaurantTemplate').then(m => ({ default: m.PremiumRestaurantTemplate })),
  },
  {
    id: 'beauty',
    name: 'Beauty & Spa',
    description: 'Service-focused with stylist profiles and booking.',
    preview: '💅',
    bestFor: ['Beauty', 'Wellness'],
    accent: '#7C3AED',
    sections: ['Service menu', 'Booking', 'Gallery', 'Reviews'],
    componentLoader: () => import('../components/templates/PremiumBeautyTemplate').then(m => ({ default: m.PremiumBeautyTemplate })),
  },
  {
    id: 'ecommerce',
    name: 'Modern E-commerce',
    description: 'Product grid with filters, search, and reviews.',
    preview: '🛍️',
    bestFor: ['Retail', 'Electronics'],
    accent: '#0066CC',
    sections: ['Product grid', 'Filters', 'Reviews', 'Checkout'],
    componentLoader: () => import('../components/templates/PremiumEcommerceTemplate').then(m => ({ default: m.PremiumEcommerceTemplate })),
  },
  {
    id: 'bin-store',
    name: 'Bin Store Daily Deals',
    description: 'Built for liquidation stores with daily price drops, pallets, and urgency.',
    preview: 'BN',
    bestFor: ['Bin stores', 'Liquidation', 'Overstock'],
    accent: '#16A34A',
    sections: ['Daily drop banner', 'Deal bins', 'Pallet offers', 'SMS/WhatsApp leads'],
    componentLoader: () => import('../components/templates/PremiumEcommerceTemplate').then(m => ({ default: m.PremiumEcommerceTemplate })),
  },
];

const COLOR_PRESETS = [
  { name: 'Trinidad Red', value: '#E61E2B' },
  { name: 'Ocean Blue', value: '#0066CC' },
  { name: 'Forest Green', value: '#16A34A' },
  { name: 'Sunset Orange', value: '#EA580C' },
  { name: 'Royal Purple', value: '#7C3AED' },
  { name: 'Rose Pink', value: '#EC4899' },
  { name: 'Charcoal', value: '#1F2937' },
  { name: 'Gold', value: '#D97706' },
];

// ─── Main Component ────────────────────────────────────────────────────

const StoreBuilderV3: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTemplateParam = searchParams.get('template');
  const [state, setState] = useState<StoreBuilderState>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load draft:', e);
    }

    const scannerListing = getScannerListing();
    const scannerCategory = String(scannerListing?.category || '').toLowerCase();
    const scannerTemplate = scannerCategory.includes('food')
      ? 'restaurant'
      : scannerCategory.includes('beauty')
        ? 'beauty'
        : scannerCategory.includes('fashion')
          ? 'fashion'
          : scannerCategory.includes('bin') || scannerCategory.includes('liquidation')
            ? 'bin-store'
            : scannerListing
              ? 'ecommerce'
              : '';

    return {
      step: scannerListing ? 2 : 1,
      businessType: scannerTemplate ? BUSINESS_BY_TEMPLATE[scannerTemplate] || 'retail' : '',
      templateId: scannerTemplate,
      storeName: '',
      tagline: scannerListing ? `Now selling ${scannerListing.name}` : '',
      primaryColor: '#E61E2B',
      description: scannerListing ? `First product draft: ${scannerListing.name}. ${scannerListing.description || ''}`.slice(0, 500) : '',
      category: scannerListing?.category || '',
      phone: '',
      whatsapp: '',
    };
  });

  const [showPreview, setShowPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestedTemplate = resolveTemplateId(requestedTemplateParam);
    if (!requestedTemplate || !TEMPLATES.some((template) => template.id === requestedTemplate)) {
      return;
    }

    setState((prev) => ({
      ...prev,
      step: prev.step === 1 ? 2 : prev.step,
      templateId: requestedTemplate,
      businessType: prev.businessType || BUSINESS_BY_TEMPLATE[requestedTemplate] || 'retail',
    }));
  }, [requestedTemplateParam]);

  // Auto-save draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save draft:', e);
    }
  }, [state]);

  const updateState = useCallback((updates: Partial<StoreBuilderState>) => {
    setState(prev => ({ ...prev, ...updates }));
    setError(null);
  }, []);

  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    setState(prev => ({ ...prev, step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ─── Step 1: Business Type ────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          What kind of business?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We'll recommend the best template for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BUSINESS_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = state.businessType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                updateState({
                  businessType: type.id,
                  templateId: type.recommendedTemplate,
                });
              }}
              className={`p-6 border-2 rounded-xl text-left transition-all ${
                isSelected
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-lg scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`p-3 rounded-lg ${
                    isSelected
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                {isSelected && (
                  <Check className="w-6 h-6 text-red-500" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {type.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {type.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => goToStep(2)}
          disabled={!state.businessType}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ─── Step 2: Template ────────────────────────────────────────────────

  const renderStep2 = () => {
    const recommendedType = BUSINESS_TYPES.find(t => t.id === state.businessType);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Pick a template
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Don't worry — you can customize everything later
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map((template) => {
            const isRecommended = recommendedType?.recommendedTemplate === template.id;
            const isSelected = state.templateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => updateState({ templateId: template.id })}
                className={`relative p-6 border-2 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Sparkle className="w-3 h-3" /> Recommended
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div
                    className="h-14 w-14 rounded-xl flex items-center justify-center text-white text-lg font-black flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: template.accent }}
                  >
                    {template.preview}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      {isSelected && <Check className="w-5 h-5 text-red-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.bestFor.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {template.sections.map((section) => (
                        <div
                          key={section}
                          className="text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900"
                        >
                          {section}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            type="button"
            onClick={() => goToStep(3)}
            disabled={!state.templateId}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // ─── Step 3: Customize ────────────────────────────────────────────────

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Customize your store
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Add your brand. Takes 1 minute.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Store Name *
            </label>
            <input
              type="text"
              value={state.storeName}
              onChange={(e) => updateState({ storeName: e.target.value })}
              placeholder="e.g. Maria's Boutique"
              maxLength={50}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={state.tagline}
              onChange={(e) => updateState({ tagline: e.target.value })}
              placeholder="e.g. Trinidad's premier fashion boutique"
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={state.description}
              onChange={(e) => updateState({ description: e.target.value })}
              placeholder="Tell customers about your business..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={state.phone}
                onChange={(e) => updateState({ phone: e.target.value })}
                placeholder="868-XXX-XXXX"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={state.whatsapp}
                onChange={(e) => updateState({ whatsapp: e.target.value })}
                placeholder="868-XXX-XXXX"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brand Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => updateState({ primaryColor: preset.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    state.primaryColor === preset.value
                      ? 'border-gray-900 dark:border-white scale-105'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  <span className="sr-only">{preset.name}</span>
                  {state.primaryColor === preset.value && (
                    <Check className="w-5 h-5 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6">
            <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Live Preview
            </div>
            <div
              className="rounded-lg p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${state.primaryColor}, ${state.primaryColor}dd)`,
              }}
            >
              <h3 className="text-2xl font-bold mb-1">
                {state.storeName || 'Your Store Name'}
              </h3>
              <p className="text-white/90 text-sm">
                {state.tagline || 'Your tagline goes here'}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-sm">
                Shop Now <ArrowRight className="w-3 h-3" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              This is a quick preview. The full template will look much better.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => goToStep(2)}
          className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => goToStep(4)}
          disabled={!state.storeName.trim()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ─── Step 4: Review & Launch ────────────────────────────────────────

  const handleLaunch = async () => {
    setCreating(true);
    setError(null);

    try {
      let storedUser: any = null;
      let sessionUser: any = null;

      const storedUserRaw = localStorage.getItem('user');
      if (storedUserRaw) {
        try {
          storedUser = JSON.parse(storedUserRaw);
        } catch (e) {
          console.warn('Invalid stored user:', e);
        }
      }

      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          sessionUser = session.user as any;
        }
      }

      const user = sessionUser || storedUser;

      if (!user) {
        // Save draft and redirect to signup
        navigate('/signup?redirect=/create-store');
        return;
      }

      const slug = makeStoreSlug(state.storeName);
      const scannerListing = getScannerListing();
      const ownerId = sessionUser?.id || user.id || makeStoreSlug(user.email || 'owner');
      const storePhone = state.whatsapp.trim() || state.phone.trim();
      const storePayload = {
        owner_id: ownerId,
        name: state.storeName.trim(),
        slug,
        tagline: state.tagline.trim() || null,
        description: state.description.trim() || null,
        category: state.businessType || state.category || 'retail',
        theme_config: {
          template_id: state.templateId || 'ecommerce',
          business_type: state.businessType || 'retail',
          source: scannerListing ? 'scanner' : 'builder',
        },
        color_scheme: {
          primary: state.primaryColor,
        },
        phone: state.phone.trim() || null,
        whatsapp: storePhone || null,
        status: 'active',
      };

      let createdStore: any = null;
      if (isSupabaseConfigured() && sessionUser?.id) {
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .insert(storePayload)
          .select()
          .single();

        if (storeError) {
          console.warn('Supabase store creation failed; using local launch store:', storeError);
        } else {
          createdStore = store;
        }
      }

      const starterProducts = scannerListing
        ? [{
            id: `local-product-${Date.now()}`,
            store_id: createdStore?.id || `local-store-${slug}`,
            name: scannerListing.name || 'Featured Product',
            slug: makeStoreSlug(scannerListing.name || 'featured-product'),
            description: scannerListing.description || 'Store-ready product generated from the landing page scanner.',
            price: Number(scannerListing.price || 75),
            compare_at_price: Number(scannerListing.price || 75) + 30,
            stock: 25,
            sku: `SCAN-${Date.now().toString().slice(-6)}`,
            image_url: null,
            gallery_images: [],
            category: scannerListing.category || 'Featured',
            category_ids: [],
            variants: [],
            seo: {
              title: scannerListing.name || 'Featured Product',
              description: scannerListing.description || '',
              keywords: scannerListing.tags || [],
            },
            specifications: {},
            status: 'active',
            created_at: new Date().toISOString(),
          }]
        : [{
            id: `local-product-${Date.now()}`,
            store_id: createdStore?.id || `local-store-${slug}`,
            name: state.businessType === 'liquidation' ? 'Daily Deal Item' : 'Featured Product',
            slug: 'featured-product',
            description: state.businessType === 'liquidation'
              ? 'Add today price, pickup window, and quantity for your next bin-store drop.'
              : 'Add your first product with price, stock, category, and delivery details.',
            price: state.businessType === 'liquidation' ? 25 : 99,
            compare_at_price: state.businessType === 'liquidation' ? 60 : 129,
            stock: 20,
            sku: 'STARTER-001',
            image_url: null,
            gallery_images: [],
            category: state.businessType || 'Featured',
            category_ids: [],
            variants: [],
            seo: {},
            specifications: {},
            status: 'active',
            created_at: new Date().toISOString(),
          }];

      const localStore = {
        id: createdStore?.id || `local-store-${slug}`,
        ...storePayload,
        ...createdStore,
        owner_id: createdStore?.owner_id || ownerId,
        logo_url: createdStore?.logo_url || null,
        banner_url: createdStore?.banner_url || '/trini-market-hero.jpg',
        location: createdStore?.location || 'Trinidad & Tobago',
        settings: createdStore?.settings || {
          currency: 'TTD',
          locale: 'en-TT',
          taxInclusive: true,
          shippingZones: [],
          paymentProviders: [
            { id: 'cod', enabled: true, config: {} },
          ],
          marketing: {
            discounts: [],
          },
        },
        theme: createdStore?.theme || {
          template: 'modern',
          colors: {
            primary: state.primaryColor,
            secondary: '#111827',
            accent: '#FFD700',
            background: '#ffffff',
            text: '#111827',
          },
          sections: {},
        },
        contact_info: createdStore?.contact_info || {
          email: user.email,
          phone: storePhone,
        },
        color_scheme: createdStore?.color_scheme || { primary: state.primaryColor },
        status: 'active',
        created_at: createdStore?.created_at || new Date().toISOString(),
        products: createdStore?.products || starterProducts,
      };

      saveLocalStore(slug, localStore);

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);

      // Track conversion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'store_created', {
          template: state.templateId,
          business_type: state.businessType,
        });
      }

      // Award gamification points for real Supabase sessions; local launch accounts stay non-blocking.
      if (sessionUser?.id) {
        try {
          const { MerchantGamification } = await import('../services/gamificationIntegration');
          await MerchantGamification.recordStoreCreation(sessionUser.id);
        } catch (gamiErr) {
          console.warn('Gamification reward failed (non-blocking):', gamiErr);
        }
      }

      // Navigate to success page; ?welcome=1 triggers the spin-wheel reward popup on storefront
      navigate(`/store/${slug}?welcome=1&spin=1`);
    } catch (err: any) {
      console.error('Launch error:', err);
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderStep4 = () => {
    const selectedTemplate = TEMPLATES.find(t => t.id === state.templateId);
    const selectedType = BUSINESS_TYPES.find(t => t.id === state.businessType);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Ready to launch! 🚀
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Review your store and go live
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ backgroundColor: state.primaryColor }}
            >
              {state.storeName.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.storeName}
              </h3>
              {state.tagline && (
                <p className="text-gray-600 dark:text-gray-400">{state.tagline}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <div className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                Business Type
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {selectedType?.name}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                Template
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {selectedTemplate?.name}
              </div>
            </div>
            {state.phone && (
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Phone
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {state.phone}
                </div>
              </div>
            )}
            {state.whatsapp && (
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
                  WhatsApp
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {state.whatsapp}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Optional: Show template preview */}
        <div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide' : 'Show'} template preview
          </button>

          {showPreview && selectedTemplate && (
            <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900" style={{ maxHeight: '500px', overflow: 'auto' }}>
              <SafeBoundary name="TemplatePreview">
                <Suspense fallback={<TemplateLoader />}>
                  <LazyTemplate loader={selectedTemplate.componentLoader} storeName={state.storeName} primaryColor={state.primaryColor} />
                </Suspense>
              </SafeBoundary>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-900 dark:text-red-100">Could not create store</div>
              <div className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => goToStep(3)}
            disabled={creating}
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            disabled={creating}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Launching your store...
              </>
            ) : (
              <>
                Launch Store <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Store className="w-4 h-4" /> TriniBuild
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Step {state.step} of 4
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
              style={{ width: `${(state.step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <SafeBoundary name={`StoreBuilder-Step${state.step}`}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8">
            {state.step === 1 && renderStep1()}
            {state.step === 2 && renderStep2()}
            {state.step === 3 && renderStep3()}
            {state.step === 4 && renderStep4()}
          </div>
        </SafeBoundary>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Your progress is auto-saved. You can close this and come back later.
        </div>
      </div>
    </div>
  );
};

// ─── Lazy Template Loader ────────────────────────────────────────────

const TemplateLoader: React.FC = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Loading preview...</span>
  </div>
);

interface LazyTemplateProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  storeName: string;
  primaryColor: string;
}

const LazyTemplate: React.FC<LazyTemplateProps> = ({ loader, storeName, primaryColor }) => {
  // We use lazy() but not at module level — it's called fresh each render of the component (memoized by template id)
  const Template = React.useMemo(() => lazy(loader), [loader]);

  return (
    <div style={{ '--brand-color': primaryColor } as React.CSSProperties}>
      <Template storeName={storeName} primaryColor={primaryColor} />
    </div>
  );
};

// Export wrapped in error boundary
const StoreBuilderWithBoundary: React.FC = () => (
  <SafeBoundary name="StoreBuilder">
    <StoreBuilderV3 />
  </SafeBoundary>
);

export default StoreBuilderWithBoundary;
export { StoreBuilderV3 };
