import React, { useState, useEffect } from 'react';
import { Wand2, Loader2, CheckCircle, MapPin, Store, ArrowRight, Zap, LayoutTemplate, ShieldCheck, Smartphone, Monitor, RefreshCw, Palette, CreditCard, Camera, Star, Lock, Award, TrendingUp, FileSignature, X } from 'lucide-react';
import { generateStoreProfile } from '../services/geminiService';
import { Business, Theme } from '../types';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { legalService } from '../services/legalService';
import { storeService } from '../services/storeService';
import { themeService } from '../services/themeService';
import { supabase } from '../services/supabaseClient';
import { LogoBuilder } from '../components/LogoBuilder';
import { ThemeGenerator } from '../components/ThemeGenerator';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// Placeholder logo URL
const LOGO_URL = "https://trinibuild.com/wp-content/uploads/2023/05/TriniBuild-Logo.png";

export const StoreCreator: React.FC = () => {
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();

   // Steps: 1=Info, 2=Logo, 3=Theme, 4=Preview, 5=Launch, 6=Upsell
   const [step, setStep] = useState(1);

   const [formData, setFormData] = useState({
      name: '',
      type: '',
      address: '',
      placeId: '',
      whatsapp: '',
      vibe: 'Modern'
   });
   const [loading, setLoading] = useState(false);
   const [generatedStore, setGeneratedStore] = useState<Partial<Business> | null>(null);
   const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
   const [selectedTheme, setSelectedTheme] = useState<Partial<Theme> | null>(null);

   const [claimMode, setClaimMode] = useState(false);
   const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
   const [imageSeed, setImageSeed] = useState(1);

   // Legal State
   const [showLegalModal, setShowLegalModal] = useState(false);
   const [isSigning, setIsSigning] = useState(false);
   const [hasSigned, setHasSigned] = useState(false);

   // Check for claim parameters or saved draft on load
   useEffect(() => {
      const claimName = searchParams.get('claim_name');
      const claimAddress = searchParams.get('claim_address');
      const claimPlaceId = searchParams.get('claim_place_id');

      const checkSigned = async () => {
         const signed = await legalService.hasSigned('current-user', 'contractor_agreement');
         if (signed) setHasSigned(true);
      };
      checkSigned();

      if (claimName) {
         setFormData(prev => ({
            ...prev,
            name: decodeURIComponent(claimName),
            address: claimAddress ? decodeURIComponent(claimAddress) : prev.address,
            placeId: claimPlaceId || prev.placeId
         }));
         setClaimMode(true);
      } else {
         const draftName = localStorage.getItem('draft_business_name');
         if (draftName) setFormData(prev => ({ ...prev, name: draftName }));
      }
   }, [searchParams]);

   const handleInfoSubmit = async () => {
      if (!formData.name || !formData.type) return;
      setStep(2); // Move to Logo Builder
   };

   const handleLogoSelect = (logoUrl: string) => {
      setSelectedLogo(logoUrl);
      setStep(3); // Move to Theme Generator
   };

   const handleLogoSkip = () => {
      setStep(3);
   };

   const handleThemeSelect = async (theme: Partial<Theme>) => {
      setSelectedTheme(theme);
      setLoading(true);
      // Generate Store Content
      try {
         const result = await generateStoreProfile(formData.name, formData.type);
         setGeneratedStore(result);
         setStep(4); // Move to Preview
      } catch (error) {
         console.error("Generation failed", error);
         alert("Failed to generate store content. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   const saveStoreData = async () => {
      if (generatedStore) {
         const storeData = {
            name: formData.name,
            description: generatedStore.description || '',
            location: formData.address || 'Trinidad',
            whatsapp: formData.whatsapp || '18680000000',
            category: formData.type,
            logo_url: selectedLogo || undefined,
            theme_config: selectedTheme?.tokens || {}
         };

         try {
            const newStore = await storeService.createStore(storeData);
            if (newStore) {
               // Save Theme & Logo separately if needed, but we put them in store record for now
               if (selectedTheme) {
                  await themeService.saveTheme(newStore.id, {
                     name: selectedTheme.name,
                     tokens: selectedTheme.tokens
                  });
               }

               if (selectedLogo) {
                  await themeService.saveLogo(newStore.id, {
                     image_png_url: selectedLogo,
                     image_svg_url: selectedLogo
                  });
               }

               // Add Products
               if (generatedStore.products) {
                  for (const prod of generatedStore.products) {
                     await storeService.addProduct(newStore.id, {
                        name: prod.name,
                        description: prod.description,
                        base_price: prod.base_price,
                        image_url: getAiImageUrl(prod.name),
                        category: 'General'
                     });
                  }
               }
            }
         } catch (e) {
            console.error("Failed to create store", e);
            alert("Failed to create store. Please try again.");
            throw e;
         }
      }
   };

   const handleComplete = async () => {
      if (!hasSigned) {
         setShowLegalModal(true);
         return;
      }
      await saveStoreData();
      setStep(5); // Celebration
   };

   const handleSign = async () => {
      setIsSigning(true);
      try {
         const { data: { user } } = await supabase.auth.getUser();

         if (!user) {
            localStorage.setItem('pending_store_data', JSON.stringify({
               formData,
               generatedStore,
               selectedLogo,
               selectedTheme
            }));
            localStorage.setItem('pending_store_step', '5');
            alert("Almost there! Sign up to launch your store.");
            navigate('/auth?redirect=/create-store');
            return;
         }

         await legalService.signDocument(user.id, 'contractor_agreement', 'Signed via StoreCreator');
         setHasSigned(true);
         setShowLegalModal(false);
         await saveStoreData();
         setStep(5);
      } catch (error) {
         console.error("Signing failed", error);
         alert("Something went wrong. Please try again.");
      } finally {
         setIsSigning(false);
      }
   };

   // Helper to generate AI image URL on the fly (Fallback)
   const getAiImageUrl = (prompt: string) => {
      const basePrompt = `${prompt} ${formData.type} ${formData.vibe} style high quality photography`;
      const encodedPrompt = encodeURIComponent(basePrompt);
      return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&seed=${imageSeed + prompt.length}`;
   };

   return (
      <div className="min-h-screen bg-gray-50 py-12 font-sans relative overflow-x-hidden">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Branding Header */}
            {step < 5 && (
               <div className="text-center mb-10">
                  <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                     {claimMode ? 'Claim Your Business Listing' : 'Launch Your Free Store'}
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                     Step {step} of 4: {
                        step === 1 ? 'Business Details' :
                           step === 2 ? 'Brand Identity' :
                              step === 3 ? 'Store Theme' : 'Final Review'
                     }
                  </p>
               </div>
            )}

            {/* Progress Bar */}
            {step < 5 && (
               <div className="mb-12 relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
                  <div className="flex justify-between max-w-2xl mx-auto">
                     {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex flex-col items-center bg-gray-50 px-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 transition-colors shadow-lg ${step >= s ? 'bg-trini-red' : 'bg-gray-300'}`}>
                              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            <div className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 relative transition-all duration-500 ${step >= 5 ? 'fixed inset-0 z-50 rounded-none m-0 border-0' : ''}`}>

               {/* Step 1: Input Form */}
               {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2">
                     <div className="p-8 md:p-12 flex flex-col justify-center">
                        <div className="mb-6">
                           <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Business Name *</label>
                           <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="e.g. Aunty May's Roti Shop"
                              className="w-full border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-trini-red focus:border-trini-red text-lg"
                           />
                        </div>

                        <div className="mb-6">
                           <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Category *</label>
                           <select
                              className="w-full border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-trini-red text-base"
                              value={formData.type}
                              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                           >
                              <option value="" disabled>Select...</option>
                              <option value="Restaurant">Restaurant</option>
                              <option value="Fashion">Fashion</option>
                              <option value="Electronics">Electronics</option>
                              <option value="Services">Services</option>
                              <option value="Grocery">Grocery</option>
                           </select>
                        </div>

                        <div className="mb-6">
                           <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">WhatsApp Number *</label>
                           <input
                              type="tel"
                              value={formData.whatsapp}
                              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                              placeholder="e.g. 18681234567"
                              className="w-full border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-trini-red focus:border-trini-red text-lg"
                           />
                        </div>

                        <button
                           onClick={handleInfoSubmit}
                           disabled={!formData.name || !formData.type || !formData.whatsapp}
                           className="w-full py-4 px-6 rounded-xl shadow-lg text-lg font-bold text-white bg-trini-red hover:bg-red-700 transition-all"
                        >
                           Next: Design Logo <ArrowRight className="inline ml-2 h-5 w-5" />
                        </button>
                     </div>

                     {/* Value Prop Side */}
                     <div className="bg-gray-900 text-white p-12 hidden md:flex flex-col justify-center">
                        <h3 className="text-2xl font-bold mb-4">Build your empire.</h3>
                        <p className="text-gray-400">Join thousands of Trinidadian businesses growing online.</p>
                     </div>
                  </div>
               )}

               {/* Step 2: Logo Builder */}
               {step === 2 && (
                  <LogoBuilder
                     businessName={formData.name}
                     businessType={formData.type}
                     onSelect={handleLogoSelect}
                     onSkip={handleLogoSkip}
                  />
               )}

               {/* Step 3: Theme Generator */}
               {step === 3 && (
                  <ThemeGenerator
                     businessName={formData.name}
                     logoUrl={selectedLogo || undefined}
                     onSelect={handleThemeSelect}
                  />
               )}

               {/* Step 4: Preview */}
               {step === 4 && generatedStore && (
                  <div className="flex flex-col h-full">
                     <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                        <h2 className="font-bold">Preview: {formData.name}</h2>
                        <div className="flex gap-2">
                           <button onClick={() => setViewMode('desktop')} className={`p-2 rounded ${viewMode === 'desktop' ? 'bg-gray-100' : ''}`}><Monitor className="h-4 w-4" /></button>
                           <button onClick={() => setViewMode('mobile')} className={`p-2 rounded ${viewMode === 'mobile' ? 'bg-gray-100' : ''}`}><Smartphone className="h-4 w-4" /></button>
                        </div>
                     </div>

                     <div className="flex-grow p-8 bg-gray-100 flex justify-center overflow-y-auto">
                        <div className={`bg-white shadow-2xl transition-all duration-500 overflow-hidden ${viewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-5xl'}`}
                           style={{ borderRadius: selectedTheme?.tokens?.layout?.card_radius || '0.5rem' }}>

                           {/* Dynamic Header based on Theme */}
                           <div className="p-8 text-white relative" style={{ backgroundColor: selectedTheme?.tokens?.colors?.primary || '#000' }}>
                              <div className="flex flex-col items-center text-center">
                                 {selectedLogo ? (
                                    <img src={selectedLogo} alt="Logo" className="h-20 mb-4 object-contain bg-white rounded-lg p-2" />
                                 ) : (
                                    <div className="text-3xl font-bold mb-2">{formData.name}</div>
                                 )}
                                 <p className="opacity-90">{generatedStore.description}</p>
                              </div>
                           </div>

                           {/* Products Grid */}
                           <div className="p-8" style={{ backgroundColor: selectedTheme?.tokens?.colors?.background || '#fff' }}>
                              <h3 className="font-bold mb-6" style={{ color: selectedTheme?.tokens?.colors?.text_primary }}>Featured Products</h3>
                              <div className={`grid gap-6 ${viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
                                 {generatedStore.products?.map((prod, idx) => (
                                    <div key={idx} className="border rounded-lg overflow-hidden" style={{ borderColor: selectedTheme?.tokens?.colors?.secondary }}>
                                       <img src={prod.image_url || getAiImageUrl(prod.name)} alt={prod.name} className="w-full h-48 object-cover" />
                                       <div className="p-4">
                                          <h4 className="font-bold">{prod.name}</h4>
                                          <p className="text-sm text-gray-500">TT${prod.base_price}</p>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white border-t p-4 flex justify-center gap-4">
                        <button onClick={() => setStep(3)} className="px-6 py-3 border rounded-lg font-bold">Back</button>
                        <button onClick={handleComplete} className="px-8 py-3 bg-trini-red text-white rounded-lg font-bold shadow-lg">Launch Store</button>
                     </div>
                  </div>
               )}

               {/* Step 5: Celebration */}
               {step === 5 && (
                  <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center text-center p-6">
                     <div className="animate-in zoom-in duration-700">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"><Star className="h-12 w-12 text-green-600" /></div>
                        <h1 className="text-4xl font-extrabold mb-6">Store Created!</h1>
                        <p className="text-xl text-gray-600 mb-10">Your store <strong>{formData.name}</strong> is now live.</p>
                        <button onClick={() => setStep(6)} className="bg-trini-red text-white px-10 py-5 rounded-full font-bold text-xl shadow-xl hover:bg-red-700">Continue</button>
                     </div>
                  </div>
               )}

               {/* Step 6: Upsell Offer */}
               {step === 6 && (
                  <div className="fixed inset-0 z-[100] bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 flex items-center justify-center p-4 overflow-y-auto">
                     <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 md:p-12 my-8 relative animate-in zoom-in duration-500">
                        {/* Close button */}
                        <button
                           onClick={() => navigate('/dashboard')}
                           className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                           aria-label="Skip offer"
                        >
                           <X className="h-6 w-6" />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-8">
                           <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
                              ⚡ ONE TIME OFFER
                           </div>
                           <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                              Wait! Fast Track Your Success
                           </h2>
                           <p className="text-lg text-gray-600">
                              Don't start from zero. Start as a leader.
                           </p>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-4 mb-8">
                           <div className="flex items-start p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-purple-100">
                              <CheckCircle className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                              <div>
                                 <h3 className="font-bold text-gray-900">Verified Business Badge</h3>
                                 <p className="text-sm text-gray-600">Instantly build trust. Verified stores get 3x more clicks.</p>
                              </div>
                           </div>

                           <div className="flex items-start p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-teal-100">
                              <Zap className="h-6 w-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                              <div>
                                 <h3 className="font-bold text-gray-900">24h Homepage Boost</h3>
                                 <p className="text-sm text-gray-600">Get featured on the front page of TriniBuild for 24 hours.</p>
                              </div>
                           </div>

                           <div className="flex items-start p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100">
                              <TrendingUp className="h-6 w-6 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                              <div>
                                 <h3 className="font-bold text-gray-900">Unlock AI Analytics</h3>
                                 <p className="text-sm text-gray-600">See who is visiting your store from day one.</p>
                              </div>
                           </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 mb-6 text-center">
                           <p className="text-sm opacity-75 line-through mb-1">Regular Price: TT$199</p>
                           <div className="flex items-center justify-center gap-3 mb-2">
                              <span className="text-5xl font-extrabold">TT$49</span>
                              <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">75% OFF</div>
                           </div>
                           <p className="text-sm opacity-90">One-time payment • Limited time offer</p>
                        </div>

                        {/* PayPal Button */}
                        <div className="mb-4">
                           <PayPalScriptProvider options={{ clientId: "sb", currency: "USD", intent: "capture" }}>
                              <PayPalButtons
                                 style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 55 }}
                                 createOrder={(data, actions) => {
                                    return actions.order.create({
                                       intent: "CAPTURE",
                                       purchase_units: [{
                                          amount: {
                                             currency_code: "USD",
                                             value: "7.50", // ~49 TTD to USD
                                          },
                                          description: `TriniBuild Fast Track Upgrade - ${formData.name}`
                                       }],
                                    });
                                 }}
                                 onApprove={async (data, actions) => {
                                    if (actions.order) {
                                       const details = await actions.order.capture();
                                       console.log("Payment successful:", details);
                                       // TODO: Update store with premium features in database
                                       alert("🎉 Upgrade successful! Your store is now boosted.");
                                       navigate('/dashboard');
                                    }
                                 }}
                                 onError={(err) => {
                                    console.error("PayPal Error:", err);
                                    alert("Payment failed. Please try again or skip this offer.");
                                 }}
                              />
                           </PayPalScriptProvider>
                        </div>

                        {/* Skip button */}
                        <button
                           onClick={() => navigate('/dashboard')}
                           className="w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium py-3 transition-colors"
                        >
                           No thanks, I'll stay on the slow path
                        </button>
                     </div>
                  </div>
               )}
            </div>

            {/* Legal Modal */}
            {showLegalModal && (
               <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                     <h3 className="text-xl font-bold mb-4">One Last Step</h3>
                     <p className="mb-6 text-gray-600">Please sign the Merchant Agreement to activate your store.</p>
                     <button onClick={handleSign} disabled={isSigning} className="w-full bg-black text-white py-3 rounded-lg font-bold">
                        {isSigning ? 'Signing...' : 'Sign & Launch'}
                     </button>
                     <button onClick={() => setShowLegalModal(false)} className="w-full mt-2 py-2 text-gray-500">Cancel</button>
                  </div>
               </div>
            )}

         </div>
      </div>
   );
};
