import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Sparkles, Zap, Check, ArrowRight, ArrowLeft, 
  Package, Palette, MapPin, Phone, Clock, DollarSign,
  TrendingUp, Users, ShoppingBag, Heart, Star, Loader2
} from 'lucide-react';
import { TRINIDAD_TEMPLATES, StoreTemplate } from '../services/templateService';
import { supabase } from '../services/supabaseClient';

// ============================================
// TYPES
// ============================================
interface OnboardingData {
  // Step 1: Business Type
  businessType: string;
  businessCategory: string;
  
  // Step 2: Template Selection
  selectedTemplate: StoreTemplate | null;
  
  // Step 3: Basic Info
  storeName: string;
  storeDescription: string;
  phone: string;
  location: string;
  
  // Step 4: Customization
  primaryColor: string;
  logo?: File;
  
  // Step 5: Products (AI-generated or manual)
  useAI: boolean;
  productCount: number;
}

const BUSINESS_CATEGORIES = [
  { id: 'food', name: 'Food & Beverage', icon: '🍽️', color: 'from-orange-500 to-red-500' },
  { id: 'retail', name: 'Retail & Shopping', icon: '🛍️', color: 'from-blue-500 to-purple-500' },
  { id: 'services', name: 'Services', icon: '✨', color: 'from-green-500 to-teal-500' },
  { id: 'automotive', name: 'Automotive', icon: '🚗', color: 'from-red-500 to-pink-500' },
  { id: 'health', name: 'Health & Wellness', icon: '💊', color: 'from-blue-400 to-cyan-400' },
];

// ============================================
// MAIN COMPONENT
// ============================================
export const CreateStoreOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    businessType: '',
    businessCategory: '',
    selectedTemplate: null,
    storeName: '',
    storeDescription: '',
    phone: '',
    location: '',
    primaryColor: '#E61E2B',
    useAI: true,
    productCount: 10,
  });

  const totalSteps = 5;

  // Navigate to next/previous step
  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Check if current step is valid
  const canProceed = () => {
    switch (step) {
      case 1:
        return data.businessCategory !== '';
      case 2:
        return data.selectedTemplate !== null;
      case 3:
        return data.storeName && data.phone && data.location;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Final store creation
  const createStore = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login?redirect=/create-store');
        return;
      }

      // Build a base slug, append short timestamp suffix to avoid collisions across merchants
      const baseSlug = data.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      // Create store in database.
      // Only use columns that actually exist on the stores table.
      // Template selection and AI/productCount prefs are stored inside theme_config
      // (jsonb) so we don't need new columns.
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert([
          {
            owner_id: user.id,
            name: data.storeName,
            description: data.storeDescription,
            slug: uniqueSlug,
            category: data.businessCategory,
            phone: data.phone,
            location: data.location,
            whatsapp: data.phone,
            theme_config: {
              primary_color: data.primaryColor,
              template_id: data.selectedTemplate?.id,
              template_theme: data.selectedTemplate?.theme,
              onboarding_prefs: {
                useAI: data.useAI,
                productCount: data.productCount
              }
            },
            status: 'active'
          }
        ])
        .select()
        .single();

      if (storeError) throw storeError;

      // If AI enabled, generate sample products
      if (data.useAI && store) {
        await generateAIProducts(store.id, data.businessCategory, data.productCount);
      }

      // Redirect to store builder
      navigate('/store-builder');
    } catch (error: any) {
      console.error('Error creating store:', error);
      alert('Failed to create store: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // AI Product Generation (placeholder - you can integrate Claude API)
  const generateAIProducts = async (storeId: string, category: string, count: number) => {
    // TODO: Call Claude API to generate realistic products
    // For now, insert placeholder products. `slug` is NOT NULL on products.
    const runId = Date.now().toString(36);
    const sampleProducts = Array.from({ length: count }, (_, i) => {
      const name = `Sample Product ${i + 1}`;
      return {
        store_id: storeId,
        name,
        slug: `sample-product-${i + 1}-${runId}`,
        description: `A great ${category} product`,
        base_price: Math.floor(Math.random() * 200) + 20,
        stock: Math.floor(Math.random() * 50) + 10,
        category: category,
        status: 'active'
      };
    });

    const { error } = await supabase.from('products').insert(sampleProducts);
    if (error) {
      console.error('generateAIProducts insert error:', error);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Category data={data} setData={setData} />;
      case 2:
        return <Step2Template data={data} setData={setData} />;
      case 3:
        return <Step3BasicInfo data={data} setData={setData} />;
      case 4:
        return <Step4Customization data={data} setData={setData} />;
      case 5:
        return <Step5Launch data={data} setData={setData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Store className="text-[#E61E2B]" size={32} />
            <h1 className="text-3xl font-black" style={{ fontFamily: 'Inter' }}>
              Create Your Store
            </h1>
          </div>
          <p className="text-gray-600">
            Launch your Trinidad business online in 5 minutes
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[1, 2, 3, 4, 5].map((num) => (
              <React.Fragment key={num}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: num * 0.1 }}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold
                    ${step >= num 
                      ? 'bg-[#E61E2B] text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-400'}
                  `}
                >
                  {step > num ? <Check size={20} /> : num}
                </motion.div>
                {num < 5 && (
                  <div 
                    className={`flex-1 h-1 mx-2 ${step > num ? 'bg-[#E61E2B]' : 'bg-gray-200'}`} 
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between max-w-3xl mx-auto mt-3 text-xs font-semibold text-gray-600">
            <span>Category</span>
            <span>Template</span>
            <span>Info</span>
            <span>Design</span>
            <span>Launch</span>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between max-w-3xl mx-auto mt-8">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`
              px-6 py-3 rounded-lg font-bold flex items-center gap-2
              ${step === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'}
            `}
          >
            <ArrowLeft size={20} />
            Back
          </button>

          {step < totalSteps ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`
                px-8 py-3 rounded-lg font-bold flex items-center gap-2
                ${canProceed()
                  ? 'bg-[#E61E2B] text-white hover:bg-[#C41E3A] shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              Continue
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={createStore}
              disabled={loading || !canProceed()}
              className="px-8 py-3 rounded-lg font-bold flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 shadow-lg disabled:bg-gray-200 disabled:text-gray-400"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Launch Store
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// STEP 1: CATEGORY SELECTION
// ============================================
const Step1Category: React.FC<{ data: OnboardingData; setData: React.Dispatch<React.SetStateAction<OnboardingData>> }> = ({ data, setData }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-black text-center mb-8" style={{ fontFamily: 'Inter' }}>
        What type of business do you have?
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BUSINESS_CATEGORIES.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setData({ ...data, businessCategory: cat.id })}
            className={`
              p-6 rounded-2xl border-2 text-left transition-all
              ${data.businessCategory === cat.id
                ? 'border-[#E61E2B] bg-red-50 shadow-xl'
                : 'border-gray-200 bg-white hover:border-gray-300'}
            `}
          >
            <div className="text-4xl mb-3">{cat.icon}</div>
            <h3 className="font-bold text-lg mb-1">{cat.name}</h3>
            <div className={`h-1 w-16 bg-gradient-to-r ${cat.color} rounded-full mt-2`} />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// STEP 2: TEMPLATE SELECTION
// ============================================
const Step2Template: React.FC<{ data: OnboardingData; setData: React.Dispatch<React.SetStateAction<OnboardingData>> }> = ({ data, setData }) => {
  // Filter templates by selected category
  const categoryMap: Record<string, string> = {
    'food': 'Food & Beverage',
    'retail': 'Retail',
    'services': 'Services',
    'automotive': 'Automotive',
    'health': 'Retail' // Pharmacy is in Retail category
  };

  const filteredTemplates = TRINIDAD_TEMPLATES.filter(
    t => t.category === categoryMap[data.businessCategory] || t.category === 'General' || t.tier === 'free'
  );

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-black text-center mb-8" style={{ fontFamily: 'Inter' }}>
        Choose Your Template
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ y: -5 }}
            onClick={() => setData({ ...data, selectedTemplate: template })}
            className={`
              cursor-pointer rounded-2xl border-2 overflow-hidden transition-all
              ${data.selectedTemplate?.id === template.id
                ? 'border-[#E61E2B] shadow-2xl ring-4 ring-red-100'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'}
            `}
          >
            {/* Template Preview with Category-Based Design */}
            <div className="h-48 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              {/* Category-based visual preview */}
              {template.category === 'Food & Beverage' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4 p-6">
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl">🍽️</div>
                    <div className="w-20 h-20 rounded-lg bg-white shadow-md flex items-center justify-center">Menu</div>
                    <div className="w-20 h-20 rounded-lg bg-white shadow-md flex items-center justify-center">Order</div>
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white">✓</div>
                  </div>
                </div>
              )}
              {template.category === 'Retail' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-2 p-4">
                    {[1,2,3,4,5,6].map((i) => (
                      <div key={i} className="w-16 h-16 rounded bg-white shadow-md p-2">
                        <div className="w-full h-8 bg-gray-200 rounded mb-1"></div>
                        <div className="w-full h-3 bg-gray-300 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {template.category === 'Services' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="space-y-3 p-6">
                    <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-500"></div>
                      <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-500"></div>
                      <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              )}
              {template.category === 'Automotive' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl">🚗</div>
                </div>
              )}
              {template.category === 'General' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Store size={64} className="text-gray-400" />
                </div>
              )}
              {template.category === 'Enterprise' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-2 p-4">
                    <div className="w-12 h-12 rounded bg-blue-600"></div>
                    <div className="w-12 h-12 rounded bg-blue-600"></div>
                    <div className="w-12 h-12 rounded bg-blue-600"></div>
                  </div>
                </div>
              )}
              
              {/* Selected Checkmark */}
              {data.selectedTemplate?.id === template.id && (
                <div className="absolute top-3 right-3 w-10 h-10 bg-[#E61E2B] rounded-full flex items-center justify-center shadow-lg">
                  <Check size={24} className="text-white" />
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{template.name}</h3>
                {template.tier === 'pro' && (
                  <span className="px-2 py-1 bg-[#E61E2B] text-white text-xs font-bold rounded">
                    PRO
                  </span>
                )}
                {template.tier === 'premium' && (
                  <span className="px-2 py-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black text-xs font-bold rounded">
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              
              {/* Features */}
              <div className="space-y-1">
                {template.features.slice(0, 3).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <Check size={12} className="text-green-600" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// STEP 3: BASIC INFO
// ============================================
const Step3BasicInfo: React.FC<{ data: OnboardingData; setData: React.Dispatch<React.SetStateAction<OnboardingData>> }> = ({ data, setData }) => {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-black mb-6" style={{ fontFamily: 'Inter' }}>
        Tell us about your business
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block font-bold text-gray-700 mb-2">
            Store Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={data.storeName}
            onChange={(e) => setData({ ...data, storeName: e.target.value })}
            placeholder="e.g., Ray's Roti Shop"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#E61E2B] focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={data.storeDescription}
            onChange={(e) => setData({ ...data, storeDescription: e.target.value })}
            placeholder="What makes your business special?"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#E61E2B] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-2">
              Phone Number <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              placeholder="1868-XXX-XXXX"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#E61E2B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">
              Location <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={data.location}
              onChange={(e) => setData({ ...data, location: e.target.value })}
              placeholder="Port of Spain, Trinidad"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#E61E2B] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STEP 4: CUSTOMIZATION
// ============================================
const Step4Customization: React.FC<{ data: OnboardingData; setData: React.Dispatch<React.SetStateAction<OnboardingData>> }> = ({ data, setData }) => {
  const presetColors = [
    '#E61E2B', '#FF6B35', '#4ECDC4', '#45B7D1', 
    '#F7B731', '#5F27CD', '#00D2D3', '#1B1464',
    '#000000', '#2C3E50', '#E74C3C', '#16A085'
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-black mb-6" style={{ fontFamily: 'Inter' }}>
        Customize Your Brand
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block font-bold text-gray-700 mb-4">
            Choose Your Brand Color
          </label>
          <div className="grid grid-cols-6 gap-3">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => setData({ ...data, primaryColor: color })}
                className={`
                  w-full aspect-square rounded-lg border-4 transition-all
                  ${data.primaryColor === color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}
                `}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or pick a custom color
            </label>
            <input
              type="color"
              value={data.primaryColor}
              onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
              className="w-full h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="mt-8 p-6 rounded-lg border-2 border-gray-200">
          <p className="text-sm font-bold text-gray-600 mb-3">Preview:</p>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
              style={{ backgroundColor: data.primaryColor }}
            >
              {data.storeName.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <h3 className="font-black text-xl">{data.storeName || 'Your Store'}</h3>
              <p className="text-gray-600">{data.location || 'Trinidad'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STEP 5: LAUNCH
// ============================================
const Step5Launch: React.FC<{ data: OnboardingData; setData: React.Dispatch<React.SetStateAction<OnboardingData>> }> = ({ data, setData }) => {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-black mb-6 text-center" style={{ fontFamily: 'Inter' }}>
        🎉 Almost There!
      </h2>

      <div className="space-y-6">
        {/* AI Products */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Sparkles className="text-blue-600" size={32} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">AI Product Generation</h3>
              <p className="text-gray-700 mb-4">
                Let our AI create sample products for your store. You can edit them later!
              </p>
              
              <label className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={data.useAI}
                  onChange={(e) => setData({ ...data, useAI: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="font-semibold">Enable AI Product Generation</span>
              </label>

              {data.useAI && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of products to generate
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={data.productCount}
                    onChange={(e) => setData({ ...data, productCount: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-center font-bold text-blue-600 mt-2">
                    {data.productCount} products
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="border-2 border-gray-200 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Your Store Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Store className="text-gray-400" size={20} />
              <span className="font-semibold">{data.storeName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Palette className="text-gray-400" size={20} />
              <span>Template: {data.selectedTemplate?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="text-gray-400" size={20} />
              <span>{data.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-gray-400" size={20} />
              <span>{data.phone}</span>
            </div>
            {data.useAI && (
              <div className="flex items-center gap-3">
                <Package className="text-gray-400" size={20} />
                <span>{data.productCount} AI-generated products</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
          <p className="text-green-800 font-semibold">
            ✓ Ready to launch! Click "Launch Store" below to go live.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateStoreOnboarding;
