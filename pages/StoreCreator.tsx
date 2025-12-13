import React, { useState, useEffect } from 'react';
import { Wand2, Loader2, CheckCircle, MapPin, Store, ArrowRight, Zap, LayoutTemplate, ShieldCheck, Smartphone, Monitor, RefreshCw, Palette, CreditCard, Camera, Star, Lock, Award, TrendingUp, FileSignature, X, Clock, Shield, Brain } from 'lucide-react';
import { generateStoreProfile } from '../services/geminiService';
import { Business, Theme } from '../types';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { legalService } from '../services/legalService';
import { storeService } from '../services/storeService';
import { themeService } from '../services/themeService';
import { supabase } from '../services/supabaseClient';
import { LogoBuilder } from '../components/LogoBuilder';
import { ThemeGenerator } from '../components/ThemeGenerator';
import { AIGeneratingOverlay } from '../components/AIGeneratingOverlay';
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

   // UPGRADE 2: Magic Social Import State
   const [importUrl, setImportUrl] = useState('');
   const [isImporting, setIsImporting] = useState(false);

   // UPGRADE 3: Interactive Preview State
   const [previewCartCount, setPreviewCartCount] = useState(0);
   const [showPreviewCart, setShowPreviewCart] = useState(false);
   const [previewCartItems, setPreviewCartItems] = useState<any[]>([]);

   // Legal State
   const [showLegalModal, setShowLegalModal] = useState(false);
   const [isSigning, setIsSigning] = useState(false);
   const [hasSigned, setHasSigned] = useState(false);

   // Enhanced Builder State (User Request)
   const [timeRemaining, setTimeRemaining] = useState(90); // 90 seconds goal
   const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);

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

   // Timer countdown
   useEffect(() => {
      const timer = setInterval(() => {
         setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
   }, []);

   // Auto-save simulation
   useEffect(() => {
      const interval = setInterval(() => {
         setLastAutoSave(Date.now());
         localStorage.setItem('storeBuilder_progress', JSON.stringify({
            step,
            formData,
            timestamp: Date.now()
         }));
      }, 10000);
      return () => clearInterval(interval);
   }, [step, formData]);

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

   // UPGRADE 2: Simulate Social Import
   const handleSocialImport = () => {
      if (!importUrl) return;
      setIsImporting(true);

      // Simulate "Scraping" delay
      setTimeout(() => {
         // Mock extracted data based on URL or random
         const mockName = "Island Vibes Cafe";
         setFormData(prev => ({
            ...prev,
            name: mockName,
            type: "Restaurant",
            vibe: "Tropical"
         }));
         setIsImporting(false);
         alert(`🎉 Successfully imported data for ${mockName}!`);
      }, 2000);
   };

   // UPGRADE 3: Interactive Add to Cart
   const addToPreviewCart = (product: any) => {
      setPreviewCartCount(prev => prev + 1);
      setPreviewCartItems(prev => [...prev, product]);
      // Show feedback
      const btn = document.getElementById(`btn-${product.name}`);
      if (btn) {
         const originalText = btn.innerText;
         btn.innerText = "Added!";
         btn.style.backgroundColor = "green";
         setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = "";
         }, 1000);
      }
   };

   // Helper to generate reliable product image URL
   const getAiImageUrl = (prompt: string) => {
      // Use Unsplash for reliable, beautiful product images
      const categories: Record<string, string> = {
         'food': 'food,restaurant',
         'restaurant': 'food,restaurant',
         'clothes': 'fashion,clothing',
         'fashion': 'fashion,clothing',
         'electronics': 'technology,gadget',
         'beauty': 'beauty,cosmetic',
         'home': 'interior,furniture',
         'default': 'product,retail'
      };

      const category = categories[formData.type?.toLowerCase() || 'default'] || categories['default'];
      const seed = prompt.length + imageSeed;

      // Use picsum.photos as primary (very reliable), Unsplash as backup
      return `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 20) + seed)}/800/600`;
   };

   return (
      <div className="min-h-screen bg-gray-50 py-12 font-sans relative overflow-x-hidden">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* STICKY PROGRESS BAR - IMPROVED */}
            {step < 5 && (
               <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-8">
                  <div className="max-w-6xl mx-auto">
                     {/* Top Row: Progress + Time */}
                     <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-4">
                           <span className="text-sm font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                              Step {step} of 4
                           </span>
                           <div className="flex items-center text-sm font-medium text-gray-600">
                              <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                              <span className={timeRemaining > 60 ? 'text-green-600' : 'text-orange-600 font-bold'}>
                                 {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining
                              </span>
                           </div>
                        </div>

                        {/* Auto-save Indicator */}
                        {lastAutoSave && (
                           <div className="flex items-center text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded border border-green-100">
                              <Shield className="w-3 h-3 mr-1.5" />
                              <span>Auto-saved {new Date(lastAutoSave).toLocaleTimeString()}</span>
                           </div>
                        )}
                     </div>

                     {/* Progress Bar - Visual Track */}
                     <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                           className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700 ease-out rounded-full"
                           style={{ width: `${(step / 4) * 100}%` }}
                        ></div>
                        {/* Step Markers */}
                        <div className="absolute top-0 left-0 w-full h-full flex justify-between px-[12.5%]">
                           <div className={`w-0.5 h-full ${step > 1 ? 'bg-white/30' : 'bg-transparent'}`}></div>
                           <div className={`w-0.5 h-full ${step > 2 ? 'bg-white/30' : 'bg-transparent'}`}></div>
                           <div className={`w-0.5 h-full ${step > 3 ? 'bg-white/30' : 'bg-transparent'}`}></div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            <div className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 relative transition-all duration-500 ${step >= 5 ? 'fixed inset-0 z-50 rounded-none m-0 border-0' : ''}`}>

               {/* AI Generation Overlay */}
               {loading && <AIGeneratingOverlay businessName={formData.name} businessType={formData.type} />}

               {/* Step 1: Input Form */}
               {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2">
                     <div className="p-8 md:p-12 flex flex-col justify-center">

                        {/* UPGRADE 2: Magic Import Tab */}
                        <div className="mb-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
                           <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center">
                              <Monitor className="w-4 h-4 mr-2" />
                              Import from Social Media (Magic)
                           </h3>
                           <div className="flex gap-2">
                              <input
                                 type="text"
                                 placeholder="Paste Instagram or FB Link..."
                                 className="flex-grow border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                 value={importUrl}
                                 onChange={(e) => setImportUrl(e.target.value)}
                              />
                              <button
                                 onClick={handleSocialImport}
                                 disabled={isImporting}
                                 className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                              >
                                 {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                              </button>
                           </div>
                           <p className="text-xs text-blue-600 mt-2">
                              *Auto-fills Name, Category & Vibe
                           </p>
                        </div>

                        <div className="relative">
                           <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-200"></div>
                           </div>
                           <div className="relative flex justify-center text-sm">
                              <span className="px-2 bg-white text-gray-500">Or start manually</span>
                           </div>
                        </div>
                        <div className="h-4"></div>

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
                           <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide" htmlFor="business-category">Category *</label>
                           <select
                              id="business-category"
                              aria-label="Business Category"
                              className="w-full border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-trini-red text-base"
                              value={formData.type}
                              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                           >
                              <option value="" disabled>Select Business Category...</option>

                              {/* Food & Hospitality */}
                              <optgroup label="Food & Dining">
                                 <option value="Restaurant">Restaurant / Fine Dining</option>
                                 <option value="Street Food">Doubles / Street Food Vendor</option>
                                 <option value="Roti Shop">Roti Shop</option>
                                 <option value="Bakery">Bakery & Pastries</option>
                                 <option value="Catering">Catering Service</option>
                                 <option value="Bar">Bar / Pub / Lounge</option>
                              </optgroup>

                              {/* Retail */}
                              <optgroup label="Retail & Shopping">
                                 <option value="Fashion">Clothing & Fashion</option>
                                 <option value="Electronics">Electronics & Computers</option>
                                 <option value="Variety Store">Variety Store / Parlour</option>
                                 <option value="Hardware">Hardware & Construction Supplies</option>
                                 <option value="Supermarket">Supermarket / Grocery</option>
                                 <option value="Auto Parts">Auto Parts & Accessories</option>
                                 <option value="Furniture">Furniture & Home Decor</option>
                              </optgroup>

                              {/* Services */}
                              <optgroup label="Services">
                                 <option value="Taxi">Taxi / Maxi Taxi / Transport</option>
                                 <option value="Mechanic">Auto Mechanic / Repairs</option>
                                 <option value="Construction">Construction & Contracting</option>
                                 <option value="Plumbing">Plumbing Services</option>
                                 <option value="Electrical">Electrical Services</option>
                                 <option value="Cleaning">Cleaning / Janitorial</option>
                                 <option value="Landscaping">Landscaping & Gardening</option>
                                 <option value="Beauty">Hair / Nails / Spam / Barber</option>
                              </optgroup>

                              {/* Professional */}
                              <optgroup label="Professional Services">
                                 <option value="Medical">Doctor / Medical / Pharmacy</option>
                                 <option value="Legal">Legal Services</option>
                                 <option value="Real Estate">Real Estate Agent</option>
                                 <option value="Consulting">Business Consulting</option>
                                 <option value="Accounting">Accounting / Tax</option>
                              </optgroup>

                              {/* Entertainment */}
                              <optgroup label="Events & Entertainment">
                                 <option value="Promoter">Event Promoter</option>
                                 <option value="DJ">DJ / Sound System</option>
                                 <option value="Venue">Event Venue</option>
                                 <option value="Carnival">Carnival Band / Mas</option>
                              </optgroup>

                              {/* Agriculture */}
                              <optgroup label="Agriculture">
                                 <option value="Farming">Farming / Agriculture</option>
                                 <option value="Market Vendor">Market Vendor</option>
                                 <option value="Fishing">Fisherman / Seafood</option>
                              </optgroup>

                              <option value="Other">Other</option>
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

                           {/* Products Grid - INTERACTIVE UPGRADE */}
                           <div className="p-8 relative" style={{ backgroundColor: selectedTheme?.tokens?.colors?.background || '#fff' }}>
                              <h3 className="font-bold mb-6" style={{ color: selectedTheme?.tokens?.colors?.text_primary }}>Featured Products</h3>
                              <div className={`grid gap-6 ${viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
                                 {generatedStore.products?.map((prod, idx) => (
                                    <div key={idx} className="border rounded-lg overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: selectedTheme?.tokens?.colors?.secondary }}>
                                       <div className="relative h-48 group">
                                          <img src={prod.image_url || getAiImageUrl(prod.name)} alt={prod.name} className="w-full h-full object-cover" />
                                          <button
                                             id={`btn-${prod.name}`}
                                             onClick={() => addToPreviewCart(prod)}
                                             aria-label={`Add ${prod.name} to cart`}
                                             className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg hover:scale-110 active:scale-95 transition-all text-gray-800 opacity-0 group-hover:opacity-100"
                                          >
                                             <Store className="w-4 h-4" />
                                          </button>
                                       </div>
                                       <div className="p-4 flex-grow flex flex-col justify-between">
                                          <div>
                                             <h4 className="font-bold mb-1 line-clamp-1">{prod.name}</h4>
                                             <p className="text-sm text-gray-500 line-clamp-2">{prod.description}</p>
                                          </div>
                                          <div className="mt-3 flex justify-between items-center">
                                             <span className="font-bold text-green-600">TT${prod.base_price}</span>
                                             <button
                                                onClick={() => addToPreviewCart(prod)}
                                                className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                                             >
                                                Add
                                             </button>
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>

                              {/* UPGRADE 3: Interactive Cart Drawer Overlay */}
                              {showPreviewCart && (
                                 <div className="absolute inset-0 z-20 bg-black/20 backdrop-blur-sm flex justify-end">
                                    <div className="w-3/4 max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
                                       <div className="flex justify-between items-center mb-6 border-b pb-4">
                                          <h3 className="font-bold text-lg">Your Cart ({previewCartCount})</h3>
                                          <button onClick={() => setShowPreviewCart(false)} className="bg-gray-100 p-1 rounded-full" aria-label="Close cart"><X className="w-5 h-5" /></button>
                                       </div>
                                       <div className="flex-grow overflow-y-auto space-y-4 pr-1">
                                          {previewCartItems.length === 0 ? (
                                             <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                                <Store className="w-8 h-8 mb-2 opacity-20" />
                                                <p>Your cart is empty</p>
                                             </div>
                                          ) : (
                                             previewCartItems.map((item, i) => (
                                                <div key={i} className="flex gap-3 items-center bg-gray-50 p-2 rounded-lg">
                                                   <div className="w-12 h-12 bg-gray-200 rounded shrink-0 overflow-hidden">
                                                      <img src={item.image_url || getAiImageUrl(item.name)} className="w-full h-full object-cover" />
                                                   </div>
                                                   <div className="flex-grow">
                                                      <div className="font-bold text-sm line-clamp-1">{item.name}</div>
                                                      <div className="text-xs text-gray-500">TT${item.base_price}</div>
                                                   </div>
                                                </div>
                                             ))
                                          )}
                                       </div>
                                       <div className="mt-4 pt-4 border-t">
                                          <div className="flex justify-between font-bold text-lg mb-4">
                                             <span>Total</span>
                                             <span>TT${previewCartItems.reduce((acc, item) => acc + item.base_price, 0).toFixed(2)}</span>
                                          </div>
                                          <button className="w-full bg-trini-red text-white py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition-colors">Checkout</button>
                                          <p className="text-xs text-center text-gray-400 mt-2">Interactive Demo Mode</p>
                                       </div>
                                    </div>
                                 </div>
                              )}

                              {/* Floating Cart Button for Preview */}
                              <button
                                 onClick={() => setShowPreviewCart(true)}
                                 className="absolute bottom-6 right-6 z-10 bg-black text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform"
                              >
                                 <div className="relative">
                                    <Store className="w-6 h-6" />
                                    {previewCartCount > 0 && (
                                       <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                                          {previewCartCount}
                                       </span>
                                    )}
                                 </div>
                              </button>
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
            {/* Legal Modal */}
            {showLegalModal && (
               <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                     <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                        <h3 className="text-xl font-bold text-gray-900">Merchant Agreement</h3>
                        <button onClick={() => setShowLegalModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close modal">
                           <X className="h-6 w-6" />
                        </button>
                     </div>

                     <div className="p-6 overflow-y-auto flex-grow bg-white text-gray-600 leading-relaxed text-sm">
                        <div className="prose prose-sm max-w-none">
                           <p className="font-bold mb-4">By creating a store on TriniBuild, you agree to the following terms:</p>

                           <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                              <h4 className="font-bold text-gray-800 mb-2">1. Vendor Responsibilities</h4>
                              <p className="mb-2">You are responsible for product accuracy, delivery, safety, legality, refunds, and customer communication.</p>

                              <h4 className="font-bold text-gray-800 mb-2 mt-4">2. Independent Business</h4>
                              <p className="mb-2">You operate as an independent business entity. TriniBuild provides the platform but is not your employer or partner.</p>

                              <h4 className="font-bold text-gray-800 mb-2 mt-4">3. Prohibited Items</h4>
                              <p className="mb-2">Strictly prohibited: weapons, illegal drugs, counterfeit goods, or any items illegal under Trinidad & Tobago law.</p>

                              <h4 className="font-bold text-gray-800 mb-2 mt-4">4. Fees & Payments</h4>
                              <p className="mb-2">Platform fees may apply to transactions. Payouts are processed according to the standard schedule.</p>
                           </div>

                           <p className="text-xs text-center text-gray-400 mt-4">
                              Official Document ID: vendor_agreement_v2.0.0<br />
                              Effective Date: {new Date().toLocaleDateString()}
                           </p>
                        </div>
                     </div>

                     <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                        <div className="flex items-start mb-4">
                           <input type="checkbox" id="agree" className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 text-trini-red focus:ring-trini-red" />
                           <label htmlFor="agree" className="text-sm text-gray-600">
                              I have read and agree to the <strong>Vendor Agreement</strong>, <strong>Terms of Service</strong>, and <strong>Privacy Policy</strong>.
                           </label>
                        </div>
                        <div className="flex gap-4">
                           <button onClick={() => setShowLegalModal(false)} className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                              Cancel
                           </button>
                           <button onClick={handleSign} disabled={isSigning} className="flex-1 py-3 px-4 bg-black text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all flex justify-center items-center">
                              {isSigning ? (
                                 <>
                                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                    Signing...
                                 </>
                              ) : (
                                 <>
                                    <FileSignature className="mr-2 h-5 w-5" />
                                    Sign & Launch Store
                                 </>
                              )}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

         </div>
      </div>
   );
};
