import React, { useState } from 'react';
import { ChevronRight, Check, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PREMIUM_STORE_TEMPLATES } from './templates';
import type { TemplateCustomization } from './TemplateCustomizer';

/**
 * STORE ONBOARDING FLOW
 * Guides merchants through:
 * 1. Store type/business selection
 * 2. Template selection
 * 3. Template customization
 * 4. Launch preview
 */

export const StoreOnboardingFlow: React.FC<{
  onComplete: (storeData: any) => void;
}> = ({ onComplete }) => {
  const [step, setStep] = useState<'type' | 'template' | 'customize' | 'review'>(
    'type'
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customization, setCustomization] = useState<TemplateCustomization | null>(
    null
  );

  const businessTypes = [
    {
      id: 'fashion',
      name: 'Fashion & Apparel',
      emoji: '👗',
      description: 'Clothing, shoes, accessories',
      templates: ['premium-fashion', 'premium-3-column']
    },
    {
      id: 'food',
      name: 'Food & Beverage',
      emoji: '🍽️',
      description: 'Restaurants, cafes, catering',
      templates: ['premium-restaurant', 'premium-ecommerce']
    },
    {
      id: 'beauty',
      name: 'Beauty & Wellness',
      emoji: '💆',
      description: 'Salons, spas, cosmetics',
      templates: ['premium-beauty', 'premium-3-column']
    },
    {
      id: 'retail',
      name: 'General Retail',
      emoji: '🛍️',
      description: 'Electronics, gifts, misc items',
      templates: ['premium-ecommerce', 'premium-3-column']
    },
    {
      id: 'services',
      name: 'Services',
      emoji: '🔧',
      description: 'Consulting, repairs, training',
      templates: ['premium-3-column', 'premium-beauty']
    },
    {
      id: 'other',
      name: 'Other',
      emoji: '✨',
      description: 'Something else',
      templates: ['premium-3-column', 'premium-ecommerce']
    }
  ];

  const getRecommendedTemplates = () => {
    if (!selectedType) return PREMIUM_STORE_TEMPLATES;
    const type = businessTypes.find(t => t.id === selectedType);
    const templateIds = type?.templates || [];
    return PREMIUM_STORE_TEMPLATES.filter(t => templateIds.includes(t.id));
  };

  const handleNext = () => {
    if (step === 'type') {
      if (!selectedType) {
        alert('Please select a business type');
        return;
      }
      setStep('template');
    } else if (step === 'template') {
      if (!selectedTemplate) {
        alert('Please select a template');
        return;
      }
      setStep('customize');
    } else if (step === 'customize') {
      if (!customization) {
        alert('Please customize your store');
        return;
      }
      setStep('review');
    } else if (step === 'review') {
      // Complete onboarding
      onComplete({
        businessType: selectedType,
        template: selectedTemplate,
        customization
      });
    }
  };

  const handleBack = () => {
    if (step === 'template') setStep('type');
    else if (step === 'customize') setStep('template');
    else if (step === 'review') setStep('customize');
  };

  const getStepNumber = () => {
    return { type: 1, template: 2, customize: 3, review: 4 }[step];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-950">
      {/* Progress Bar */}
      <div className="border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-light">
              Create Your Store
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Step {getStepNumber()} of 4
            </span>
          </div>

          {/* Progress Bars */}
          <div className="flex gap-2">
            {['type', 'template', 'customize', 'review'].map((s, idx) => (
              <div
                key={s}
                className="flex-1 h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      ['type', 'template', 'customize', 'review'].indexOf(step) >=
                      idx
                        ? '100%'
                        : '0%'
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {/* STEP 1: Business Type Selection */}
          {step === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-3xl font-light mb-8">
                What type of business are you?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessTypes.map((type) => (
                  <motion.button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 rounded-lg border-2 text-left transition ${
                      selectedType === type.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-slate-800 hover:border-gray-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">{type.emoji}</span>
                      <div className="flex-1">
                        <h4 className="text-lg font-light mb-1">{type.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {type.description}
                        </p>
                      </div>
                      {selectedType === type.id && (
                        <Check className="w-6 h-6 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Template Selection */}
          {step === 'template' && (
            <motion.div
              key="template"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-3xl font-light mb-8">
                Choose a template design
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getRecommendedTemplates().map((template) => (
                  <motion.button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 rounded-lg border-2 text-left transition overflow-hidden ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-slate-800 hover:border-gray-400 dark:hover:border-slate-700'
                    }`}
                  >
                    {template.isDefault && (
                      <div className="inline-block mb-3 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        Recommended
                      </div>
                    )}

                    <div className="flex items-start gap-4 mb-4">
                      <span className="text-5xl">{template.preview}</span>
                      <div className="flex-1">
                        <h4 className="text-lg font-light mb-1">
                          {template.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-1 mb-4">
                      {template.features.slice(0, 3).map((feature, idx) => (
                        <p
                          key={idx}
                          className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                        >
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {feature}
                        </p>
                      ))}
                    </div>

                    {selectedTemplate === template.id && (
                      <Check className="w-6 h-6 text-blue-500" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Customization */}
          {step === 'customize' && (
            <motion.div
              key="customize"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-3xl font-light mb-8">
                Customize your store
              </h3>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-gray-200 dark:border-slate-700">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-light uppercase tracking-wider mb-2">
                      Store Name
                    </label>
                    <input
                      type="text"
                      placeholder="My Awesome Store"
                      value={customization?.storeName || ''}
                      onChange={(e) =>
                        setCustomization({
                          ...(customization || {
                            tagline: '',
                            colors: {
                              primary: '#E61E2B',
                              secondary: '#000000',
                              accent: '#FFD700'
                            },
                            fonts: {
                              heading: 'Inter',
                              body: 'Inter'
                            }
                          }),
                          storeName: e.target.value
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-light uppercase tracking-wider mb-2">
                      Tagline
                    </label>
                    <input
                      type="text"
                      placeholder="Welcome to our store"
                      value={customization?.tagline || ''}
                      onChange={(e) =>
                        setCustomization({
                          ...(customization || {
                            storeName: '',
                            colors: {
                              primary: '#E61E2B',
                              secondary: '#000000',
                              accent: '#FFD700'
                            },
                            fonts: {
                              heading: 'Inter',
                              body: 'Inter'
                            }
                          }),
                          tagline: e.target.value
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-light uppercase tracking-wider mb-4">
                      Primary Brand Color
                    </label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="color"
                        value={customization?.colors.primary || '#E61E2B'}
                        onChange={(e) =>
                          setCustomization({
                            ...(customization || {
                              storeName: '',
                              tagline: '',
                              colors: {
                                primary: '#E61E2B',
                                secondary: '#000000',
                                accent: '#FFD700'
                              },
                              fonts: {
                                heading: 'Inter',
                                body: 'Inter'
                              }
                            }),
                            colors: {
                              ...customization?.colors || {
                                primary: '#E61E2B',
                                secondary: '#000000',
                                accent: '#FFD700'
                              },
                              primary: e.target.value
                            }
                          })
                        }
                        className="w-24 h-12 rounded cursor-pointer border-2 border-gray-300"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Used for buttons, links, and highlights
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 You can customize more colors, fonts, and upload your logo after creating your store.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Review */}
          {step === 'review' && customization && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-3xl font-light mb-8">
                Review your store setup
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Details */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
                    <h4 className="font-light uppercase tracking-wider text-sm mb-4">
                      Store Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Store Name
                        </p>
                        <p className="text-lg font-light">
                          {customization.storeName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Tagline
                        </p>
                        <p className="text-lg font-light">
                          {customization.tagline}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          Template
                        </p>
                        <p className="text-lg font-light">
                          {PREMIUM_STORE_TEMPLATES.find(t => t.id === selectedTemplate)
                            ?.name || 'Professional'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
                    <h4 className="font-light uppercase tracking-wider text-sm mb-4">
                      Brand Colors
                    </h4>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Primary
                        </p>
                        <div
                          className="w-16 h-16 rounded border-2 border-gray-300"
                          style={{ backgroundColor: customization.colors.primary }}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Secondary
                        </p>
                        <div
                          className="w-16 h-16 rounded border-2 border-gray-300"
                          style={{ backgroundColor: customization.colors.secondary }}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Accent
                        </p>
                        <div
                          className="w-16 h-16 rounded border-2 border-gray-300"
                          style={{ backgroundColor: customization.colors.accent }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
                  <h4 className="font-light uppercase tracking-wider text-sm mb-4">
                    Store Preview
                  </h4>
                  <div
                    className="rounded-lg p-6 text-white"
                    style={{
                      backgroundColor: customization.colors.secondary
                    }}
                  >
                    <h2 className="text-3xl font-light mb-2">
                      {customization.storeName}
                    </h2>
                    <p className="mb-6 opacity-90">
                      {customization.tagline}
                    </p>
                    <button
                      style={{ backgroundColor: customization.colors.primary }}
                      className="px-6 py-3 rounded font-light uppercase text-sm tracking-wider hover:opacity-90 transition w-full"
                    >
                      Start Shopping
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex gap-3">
                  <Zap className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-light text-green-900 dark:text-green-100 mb-1">
                      You're all set!
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Click "Launch Store" below to create your store and start selling.
                      You can customize more settings after launch.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-12 flex gap-4 justify-between">
          <button
            onClick={handleBack}
            disabled={step === 'type'}
            className="px-8 py-3 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            className="ml-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition font-light uppercase text-sm tracking-wider flex items-center gap-2"
          >
            {step === 'review' ? 'Launch Store' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreOnboardingFlow;
