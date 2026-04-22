/**
 * ProductListingGenerator - AI-powered product description generator
 * Integrates with ProductListingAIService to generate SEO-optimized product listings
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Download, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import ProductListingAIService from '../../services/productListingAIService';
import { supabase } from '../../services/supabaseClient';

interface Props {
  storeId: string;
  onClose?: () => void;
}

export const ProductListingGenerator: React.FC<Props> = ({ storeId, onClose }) => {
  const [step, setStep] = useState<'input' | 'generating' | 'results'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'general',
    features: [''],
    condition: 'new' as const,
    price: undefined as number | undefined,
    targetAudience: '',
    style: 'persuasive' as const
  });

  // Results state
  const [variations, setVariations] = useState<any>(null);
  const [selectedVariation, setSelectedVariation] = useState<string>('original');

  // Check if API is configured
  useEffect(() => {
    const isConfigured = ProductListingAIService.isConfigured();
    if (!isConfigured) {
      setError('OpenAI API is not configured. Contact your administrator.');
    }
  }, []);

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const generateListings = async () => {
    try {
      setError(null);
      setLoading(true);
      setStep('generating');

      const validFeatures = formData.features.filter(f => f.trim());
      if (!formData.title || validFeatures.length === 0) {
        throw new Error('Please enter a product title and at least one feature');
      }

      const input = {
        ...formData,
        features: validFeatures,
        storeId
      };

      const result = await ProductListingAIService.generateListings(input);
      setVariations(result);
      setStep('results');
      setSuccessMessage(`✨ Generated ${result.variations.length + 1} listing variations`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate listings');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const saveListings = async () => {
    if (!variations) return;

    try {
      setLoading(true);
      const result = await ProductListingAIService.saveListings(
        storeId,
        formData.title,
        variations
      );

      if (result.success) {
        setSuccessMessage(`✅ Saved ${result.savedIds?.length || 0} listings to database`);
        setTimeout(() => onClose?.(), 2000);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copied to clipboard!');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const exportAsJSON = () => {
    if (!variations) return;
    const json = JSON.stringify(variations, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.title.toLowerCase().replace(/\s+/g, '-')}-listings.json`;
    a.click();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // INPUT STEP
  // ─────────────────────────────────────────────────────────────────────────

  if (step === 'input') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-purple-500" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI Product Listing Generator
                </h2>
                <p className="text-sm text-gray-500">Create SEO-optimized product descriptions</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Product Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Handmade Bake and Shark, Trinidad Style"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Category & Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="food">Food & Beverage</option>
                  <option value="retail">Retail</option>
                  <option value="services">Services</option>
                  <option value="digital">Digital</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
            </div>

            {/* Price & Audience */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (TT$)
                </label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="Optional"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="e.g., Local businesses"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Writing Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['persuasive', 'neutral', 'descriptive', 'luxury'].map((style) => (
                  <button
                    key={style}
                    onClick={() => setFormData({ ...formData, style: style as any })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.style === style
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200'
                    }`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Features *
              </label>
              <div className="space-y-2">
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                      placeholder={`Feature ${idx + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    {formData.features.length > 1 && (
                      <button
                        onClick={() => removeFeature(idx)}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addFeature}
                className="mt-2 px-4 py-2 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                + Add Feature
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={generateListings}
              disabled={loading || !formData.title}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              Generate Listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GENERATING STEP
  // ─────────────────────────────────────────────────────────────────────────

  if (step === 'generating') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <div className="inline-block p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
            <Loader className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Generating Your Listings
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            This may take a moment...
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESULTS STEP
  // ─────────────────────────────────────────────────────────────────────────

  if (step === 'results' && variations) {
    const currentListing =
      selectedVariation === 'original'
        ? variations.original
        : variations.variations[parseInt(selectedVariation.split('_')[1])];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Listings Generated!
                  </h2>
                  <p className="text-sm text-gray-500">
                    Generated {variations.variations.length + 1} variations in {variations.metadata.estimatedReadTime || '< 1'} second
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
            {/* Variations Selector */}
            <div className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Variations
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedVariation('original')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    selectedVariation === 'original'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200'
                  }`}
                >
                  Original
                </button>
                {variations.variations.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariation(`variation_${idx}`)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedVariation === `variation_${idx}`
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200'
                    }`}
                  >
                    Variation {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Display */}
            <div className="lg:col-span-3 space-y-4">
              {successMessage && (
                <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-200">{successMessage}</p>
                </div>
              )}

              {currentListing && (
                <>
                  {/* Title */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Title
                    </label>
                    <div className="flex gap-2 mt-1">
                      <p className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                        {currentListing.title}
                      </p>
                      <button
                        onClick={() => copyToClipboard(currentListing.title)}
                        className="px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Copy className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Description
                    </label>
                    <div className="flex gap-2 mt-1">
                      <textarea
                        value={currentListing.description}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 resize-none min-h-[150px]"
                      />
                      <button
                        onClick={() => copyToClipboard(currentListing.description)}
                        className="px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors self-start"
                      >
                        <Copy className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Keywords
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentListing.keywords?.map((keyword: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* SEO */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        SEO Title
                      </label>
                      <p className="mt-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white">
                        {currentListing.seoTitle}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        CTA
                      </label>
                      <p className="mt-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white">
                        {currentListing.callToAction}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3 justify-end">
            <button
              onClick={() => setStep('input')}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={exportAsJSON}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={saveListings}
              disabled={loading}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              Save to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ProductListingGenerator;
