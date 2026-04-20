'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, ArrowRight, Check, Loader2, Sparkles,
  Package, MapPin, Phone, Globe, Palette, Zap
} from 'lucide-react';

interface StoreData {
  businessName: string;
  businessType: string;
  phone: string;
  deliveryOptions: string[];
  estimatedProducts: string;
  priceRange: string;
}

const BUSINESS_TYPES_TRINIDAD = [
  'Roti Shop', 'Restaurant', 'Bakery', 'Bar/Lounge', 'Coffee Shop',
  'Clothing Store', 'Electronics', 'Jewelry', 'Beauty Supply', 'Pharmacy',
  'Salon/Barber', 'Gym/Fitness', 'Auto Repair', 'Contractor',
  'Grocery/Supermarket', 'Hardware Store', 'Craft/Art', 'Florist',
  'Pet Store', 'Sports Equipment', 'Home Decor', 'Furniture',
  'Photography', 'Event Planning', 'Catering', 'Tours/Excursions',
  'Real Estate', 'Legal Services', 'Accounting', 'Medical Services',
  'IT Services', 'Cleaning Services', 'Security Services',
  'Manufacturing', 'Wholesale', 'Import/Export', 'Construction',
  'Agriculture', 'Fashion Design', 'Music/Entertainment',
  'Education/Tutoring', 'Childcare', 'Elder Care', 'Transportation',
  'Repair Services', 'Beauty Services', 'Wellness/Spa', 'Printing',
  'Sign Making', 'Landscaping', 'Pool Maintenance', 'Pest Control',
  'Moving/Storage', 'Equipment Rental', 'Party Supplies', 'Towing',
  'Auto Parts', 'Boat Services', 'Fishing Supplies', 'Marine Equipment',
  'Agricultural Supplies', 'Veterinary Services', 'Car Wash', 'Laundry',
  'Tailoring', 'Upholstery', 'Mattress Store', 'Appliance Repair',
  'Phone Repair', 'Computer Repair', 'TV/Electronics Repair',
  'Jewelry Repair', 'Watch Repair', 'Shoe Repair', 'Key Cutting',
  'Engraving', 'Trophy Shop', 'Gift Shop', 'Toy Store',
  'Book Store', 'Music Store', 'Art Gallery', 'Antiques',
  'Pawn Shop', 'Thrift Store', 'Consignment', 'Other'
];

const DELIVERY_OPTIONS = [
  { id: 'pickup', label: 'Customer Pickup', desc: 'Free' },
  { id: 'local', label: 'Local Delivery', desc: 'You arrange' },
  { id: 'trinibuild_driver', label: 'TriniBuild Drivers', desc: '$1-2/order' },
  { id: 'courier', label: 'Courier Service', desc: 'Third-party' },
  { id: 'mail', label: 'TTPost/Mail', desc: 'Shipping' }
];

export default function SimpleStoreCreator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [storeData, setStoreData] = useState<StoreData>({
    businessName: '',
    businessType: '',
    phone: '',
    deliveryOptions: [],
    estimatedProducts: '1-10',
    priceRange: 'under-100'
  });

  const handleNext = async () => {
    if (step === 3) {
      // Final step - create store
      setLoading(true);
      
      // TODO: Replace with actual Supabase call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to store dashboard
      window.location.href = '/store-builder';
    } else {
      setStep(step + 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return storeData.businessName && storeData.businessType && storeData.phone;
      case 2:
        return storeData.deliveryOptions.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border-2 border-red-200 rounded-full mb-4">
            <Zap className="text-red-600" size={20} />
            <span className="text-red-600 font-bold text-sm">2-Minute Setup</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
            Create Your Store
          </h1>
          <p className="text-lg text-gray-600">
            Get online in 3 simple steps - No tech skills needed!
          </p>
        </motion.div>

        {/* Progress */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                  transition-all duration-300
                  ${step >= num 
                    ? 'bg-red-600 text-white scale-110' 
                    : 'bg-gray-200 text-gray-400 scale-100'}
                `}>
                  {step > num ? <Check size={24} /> : num}
                </div>
                {num < 3 && (
                  <div className={`w-16 h-1 ${step > num ? 'bg-red-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-20 mt-4">
            <span className="text-sm font-semibold text-gray-600">Basic Info</span>
            <span className="text-sm font-semibold text-gray-600">Delivery</span>
            <span className="text-sm font-semibold text-gray-600">Launch</span>
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
        >
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={storeData.businessName}
                  onChange={(e) => setStoreData({ ...storeData, businessName: e.target.value })}
                  placeholder="e.g., Ray's Doubles & Roti"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-lg focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  value={storeData.businessType}
                  onChange={(e) => setStoreData({ ...storeData, businessType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-lg focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="">Select your business type...</option>
                  {BUSINESS_TYPES_TRINIDAD.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  value={storeData.phone}
                  onChange={(e) => setStoreData({ ...storeData, phone: e.target.value })}
                  placeholder="868-XXX-XXXX"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-lg focus:outline-none focus:border-red-500 transition-colors"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Customers can contact you via WhatsApp
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Delivery */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  How will you deliver?
                </h3>
                <p className="text-gray-600 mb-6">
                  Select all that apply (you can change this later)
                </p>
              </div>

              <div className="space-y-3">
                {DELIVERY_OPTIONS.map(option => (
                  <label
                    key={option.id}
                    className={`
                      flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer
                      transition-all duration-200
                      ${storeData.deliveryOptions.includes(option.id)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={storeData.deliveryOptions.includes(option.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStoreData({
                              ...storeData,
                              deliveryOptions: [...storeData.deliveryOptions, option.id]
                            });
                          } else {
                            setStoreData({
                              ...storeData,
                              deliveryOptions: storeData.deliveryOptions.filter(o => o !== option.id)
                            });
                          }
                        }}
                        className="w-5 h-5"
                      />
                      <div>
                        <p className="font-bold text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-500">{option.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Estimated Products
                  </label>
                  <select
                    value={storeData.estimatedProducts}
                    onChange={(e) => setStoreData({ ...storeData, estimatedProducts: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold focus:outline-none focus:border-red-500"
                  >
                    <option value="1-10">1-10 products</option>
                    <option value="11-50">11-50 products</option>
                    <option value="51-100">51-100 products</option>
                    <option value="100+">100+ products</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    value={storeData.priceRange}
                    onChange={(e) => setStoreData({ ...storeData, priceRange: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold focus:outline-none focus:border-red-500"
                  >
                    <option value="under-100">Under $100</option>
                    <option value="100-500">$100-$500</option>
                    <option value="500-1000">$500-$1,000</option>
                    <option value="1000+">$1,000+</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Launch */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <Sparkles className="text-green-600" size={40} />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-3">
                  You're Ready to Launch!
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Here's what happens next:
                </p>
              </div>

              <div className="space-y-4">
                <LaunchStep
                  icon={<Store />}
                  title="Your Store is Created"
                  desc="Professional storefront with Trinidad branding"
                />
                <LaunchStep
                  icon={<Package />}
                  title="Add Your Products"
                  desc="Use AI to create listings from photos (no barcode needed!)"
                />
                <LaunchStep
                  icon={<Globe />}
                  title="Go Live"
                  desc="Share your store link on WhatsApp, Facebook, Instagram"
                />
                <LaunchStep
                  icon={<Palette />}
                  title="Customize Later"
                  desc="Change colors, logo, and layout anytime"
                />
              </div>

              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Check className="text-green-600 mt-0.5" size={24} />
                  <div>
                    <p className="font-bold text-green-900 mb-1">
                      🎉 FREE Forever Tier
                    </p>
                    <p className="text-sm text-green-700">
                      Start with our free plan - upgrade later when you're ready for online payments and advanced features.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t-2 border-gray-100">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 font-bold text-gray-700 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
            )}
            
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className={`
                ml-auto px-8 py-4 rounded-xl font-black text-lg
                transition-all duration-200
                ${canProceed() && !loading
                  ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Creating...
                </span>
              ) : step === 3 ? (
                <span className="flex items-center gap-2">
                  Launch Store! 🚀
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continue
                  <ArrowRight size={20} />
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Trust Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          <p>🇹🇹 Built for Trinidad businesses • No credit card required</p>
        </motion.div>

      </div>
    </div>
  );
}

// Launch Step Component
function LaunchStep({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-bold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}
