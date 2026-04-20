'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Store, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StoreSetupWizardProps {
  userId: string;
  onComplete: () => void;
}

export default function StoreSetupWizard({ userId, onComplete }: StoreSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    storeUrl: '',
    category: '',
    description: '',
    templateId: '',
  });

  const supabase = createClientComponentClient();
  const router = useRouter();

  const categories = [
    { value: 'fashion', label: '👗 Fashion & Apparel', desc: 'Clothing, accessories, shoes' },
    { value: 'food', label: '🍴 Food & Beverage', desc: 'Restaurants, catering, food delivery' },
    { value: 'electronics', label: '📱 Electronics', desc: 'Phones, computers, gadgets' },
    { value: 'handmade', label: '🎨 Arts & Crafts', desc: 'Handmade goods, local art' },
    { value: 'services', label: '💼 Services', desc: 'Salons, tutoring, consulting' },
    { value: 'general', label: '🏪 General Store', desc: 'Multi-category marketplace' },
  ];

  const handleCreateStore = async () => {
    setLoading(true);

    try {
      // Generate unique slug
      const slug = formData.storeUrl.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Create store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          user_id: userId,
          name: formData.storeName,
          slug: slug,
          category: formData.category,
          description: formData.description,
          is_active: true,
          settings: {
            currency: 'TTD',
            language: 'en',
            timezone: 'America/Port_of_Spain',
          },
        })
        .select()
        .single();

      if (storeError) throw storeError;

      // Get selected template
      const { data: template } = await supabase
        .from('store_templates')
        .select('*')
        .eq('id', formData.templateId)
        .single();

      if (template) {
        // Apply template theme to store
        const { error: themeError } = await supabase
          .from('themes')
          .insert({
            store_id: store.id,
            name: template.name,
            tokens: template.design_tokens,
            is_default: true,
          });

        if (themeError) console.error('Theme error:', themeError);
      }

      // Create default subscription
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', 'Free')
        .single();

      if (freePlan) {
        await supabase
          .from('store_subscriptions')
          .insert({
            store_id: store.id,
            plan_id: freePlan.id,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
      }

      // Track onboarding completion
      await supabase
        .from('user_onboarding')
        .insert({
          user_id: userId,
          step: 'store_created',
          completed_at: new Date().toISOString(),
          metadata: {
            store_id: store.id,
            template_id: formData.templateId,
          },
        });

      // Complete setup
      onComplete();
      router.push(`/dashboard/store/${store.id}`);
    } catch (error) {
      console.error('Store creation error:', error);
      alert('Failed to create store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8"
      >
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-inter ${
                  step >= num
                    ? 'bg-trini-red text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step > num ? <Check className="w-5 h-5" /> : num}
              </div>
              {num < 3 && (
                <div
                  className={`w-20 h-1 mx-2 ${
                    step > num ? 'bg-trini-red' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Store Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Store className="w-16 h-16 text-trini-red mx-auto mb-4" />
                </motion.div>
                <h2 className="text-3xl font-black font-inter mb-2">
                  Let's Create Your Store
                </h2>
                <p className="text-gray-600 font-inter">
                  Start building your online empire in Trinidad & Tobago
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold font-inter text-gray-700 mb-2">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    placeholder="e.g., Island Fashion Boutique"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold font-inter text-gray-700 mb-2">
                    Store URL *
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 font-inter mr-2">trinibuild.com/</span>
                    <input
                      type="text"
                      value={formData.storeUrl}
                      onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value.toLowerCase() })}
                      placeholder="your-store-name"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold font-inter text-gray-700 mb-2">
                    Store Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell customers what makes your store special..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter resize-none"
                  />
                </div>

                <button
                  onClick={() => formData.storeName && formData.storeUrl && setStep(2)}
                  disabled={!formData.storeName || !formData.storeUrl}
                  className="w-full bg-trini-red text-white px-6 py-4 rounded-full font-black text-lg font-inter hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black font-inter mb-2">
                  What will you sell?
                </h2>
                <p className="text-gray-600 font-inter">
                  Choose your store category to get the best templates
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      formData.category === cat.value
                        ? 'border-trini-red bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{cat.label.split(' ')[0]}</div>
                    <div className="font-bold font-inter text-sm mb-1">
                      {cat.label.split(' ').slice(1).join(' ')}
                    </div>
                    <div className="text-xs text-gray-600 font-inter">{cat.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-4 rounded-full font-bold font-inter hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => formData.category && setStep(3)}
                  disabled={!formData.category}
                  className="flex-1 bg-trini-red text-white px-6 py-4 rounded-full font-black font-inter hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Template Selection (This will be replaced by TemplateGallery) */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <Sparkles className="w-16 h-16 text-trini-gold mx-auto mb-4" />
                <h2 className="text-3xl font-black font-inter mb-2">
                  Almost There!
                </h2>
                <p className="text-gray-600 font-inter">
                  Choose a template on the next screen and your store will be live
                </p>
              </div>

              <div className="bg-gradient-to-br from-trini-red/10 to-transparent rounded-2xl p-6 mb-6">
                <h3 className="font-black font-inter text-lg mb-4">Your Store Details:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Store Name:</span>
                    <span className="font-bold">{formData.storeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">URL:</span>
                    <span className="font-bold">trinibuild.com/{formData.storeUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-bold">{categories.find(c => c.value === formData.category)?.label}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-4 rounded-full font-bold font-inter hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    // This will redirect to template gallery
                    // For now, we'll create the store with a default template
                    handleCreateStore();
                  }}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-trini-red to-red-700 text-white px-6 py-4 rounded-full font-black font-inter hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Your Store...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Choose Template & Launch</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
