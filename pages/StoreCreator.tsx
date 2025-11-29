import React, { useState, useEffect } from 'react';
import { Wand2, Loader2, CheckCircle, MapPin, Store, ArrowRight, Zap, LayoutTemplate, ShieldCheck, Smartphone, Monitor, RefreshCw, Palette, CreditCard, Camera, Star, Lock, Award, TrendingUp, FileSignature, X } from 'lucide-react';
import { generateStoreProfile } from '../services/geminiService';
import { Business } from '../types';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { legalService } from '../services/legalService';
import { storeService } from '../services/storeService';
import { supabase } from '../services/supabaseClient';

// Placeholder logo URL
const LOGO_URL = "https://trinibuild.com/wp-content/uploads/2023/05/TriniBuild-Logo.png";

export const StoreCreator: React.FC = () => {
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();
   const [step, setStep] = useState(1);
   const [formData, setFormData] = useState({
      name: '',
      type: '',
      address: '',
      placeId: '',
      vibe: 'Modern' // New field for visual style
   });
   const [loading, setLoading] = useState(false);
   const [generatedStore, setGeneratedStore] = useState<Partial<Business> | null>(null);
   const [claimMode, setClaimMode] = useState(false);
   const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
   const [imageSeed, setImageSeed] = useState(1); // To force image refresh

   // Legal State
   const [showLegalModal, setShowLegalModal] = useState(false);
   const [isSigning, setIsSigning] = useState(false);
   const [hasSigned, setHasSigned] = useState(false);

   // Check for claim parameters or saved draft on load
   useEffect(() => {
      const claimName = searchParams.get('claim_name');
      const claimAddress = searchParams.get('claim_address');
      const claimPlaceId = searchParams.get('claim_place_id');

      // Check if already signed
      const checkSigned = async () => {
         const signed = await legalService.hasSigned('current-user', 'contractor_agreement');
         if (signed) {
            setHasSigned(true);
         }
      };
      checkSigned();

      // 1. Priority: URL Params (from Onboarding or Claim flow)
      if (claimName) {
         setFormData(prev => ({
            ...prev,
            name: decodeURIComponent(claimName),
            address: claimAddress ? decodeURIComponent(claimAddress) : prev.address,
            placeId: claimPlaceId || prev.placeId
         }));
         setClaimMode(true);
      }
      // 2. Fallback: Saved Draft from Onboarding
      else {
         const draftName = localStorage.getItem('draft_business_name');
         if (draftName) {
            setFormData(prev => ({ ...prev, name: draftName }));
         }

         // Load any other saved form state
         const savedForm = localStorage.getItem('store_creator_form');
         if (savedForm) {
            try {
               const parsed = JSON.parse(savedForm);
               setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
               console.error("Failed to parse saved form", e);
            }
         }
      }
   }, [searchParams]);

   // Auto-save form progress
   useEffect(() => {
      if (formData.name || formData.type) {
         localStorage.setItem('store_creator_form', JSON.stringify(formData));
      }
   }, [formData]);

   const handleGenerate = async () => {
      if (!formData.name || !formData.type) return;

      setLoading(true);
      try {
         const result = await generateStoreProfile(formData.name, formData.type);
         setGeneratedStore(result);
         setStep(2);
      } catch (error) {
         console.error("Generation failed", error);
         alert("Failed to generate store. Please check your API key or try again.");
      } finally {
         setLoading(false);
      }
   };

   // ... inside component

   const saveStoreData = async () => {
      if (generatedStore) {
         const storeData = {
            businessName: formData.name,
            description: generatedStore.description || '',
            location: formData.address || 'Trinidad',
            whatsapp: '18680000000', // Default or ask user
            // vibe: formData.vibe, // Not in Store interface yet, maybe put in description or metadata
         };

         try {
            const newStore = await storeService.createStore(storeData);
            if (newStore) {
               // We can still save to local storage for immediate access if needed, 
               // but Dashboard now fetches from API.
               // localStorage.setItem('trinibuild_active_store', JSON.stringify(newStore));

               // If we generated products, we should add them too
               if (generatedStore.products) {
                  for (const prod of generatedStore.products) {
                     await storeService.addProduct(newStore.id, {
                        name: prod.name,
                        description: prod.description,
                        price: prod.price,
                        image: prod.image,
                        category: 'General'
                     });
                  }
               }
            }
         } catch (e) {
            console.error("Failed to create store", e);
            alert("Failed to create store. Please try again.");
            throw e; // Stop progression
         }
      }
   };

   const handleComplete = async () => {
      if (!hasSigned) {
         setShowLegalModal(true);
         return;
      }
      await saveStoreData();
      // Trigger Celebration Mode
      setStep(3);
   };

   const handleSign = async () => {
      setIsSigning(true);
      try {
         const { data: { user } } = await supabase.auth.getUser();

         if (!user) {
            // Save state is already handled by useEffect
            alert("Please log in or sign up to launch your store.");
            navigate('/auth?redirect=/create-store');
            return;
         }

         await legalService.signDocument(user.id, 'contractor_agreement', 'Signed via StoreCreator');
         setHasSigned(true);
         setShowLegalModal(false);
         await saveStoreData();
         setStep(3);
      } catch (error) {
         console.error("Signing failed", error);
         alert("Something went wrong. Please try again.");
      } finally {
         setIsSigning(false);
      }
   };

   const handleTakeOffer = () => {
      alert("Redirecting to payment gateway... (Mock)");
      navigate('/dashboard');
   };

   const handleSkipOffer = () => {
      navigate('/dashboard');
   };

   // Helper to generate AI image URL on the fly
   const getAiImageUrl = (prompt: string, type: 'product' | 'atmosphere' = 'product') => {
      const basePrompt = `${prompt} ${formData.type} ${formData.vibe} style high quality photography`;
      const dims = type === 'product' ? 'width=800&height=600' : 'width=1200&height=800'; // 4:3 for products, 3:2 for atmosphere
      const encodedPrompt = encodeURIComponent(basePrompt);
      return `https://image.pollinations.ai/prompt/${encodedPrompt}?${dims}&nologo=true&seed=${imageSeed + prompt.length}`;
   };

   return (
      <div className="min-h-screen bg-gray-50 py-12 font-sans relative overflow-x-hidden">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Branding Header (Hidden in Step 3+) */}
            {step < 3 && (
               <div className="text-center mb-10">
                  <div className="inline-block mb-6">
                     <img
                        src={LOGO_URL}
                        alt="TriniBuild"
                        className="h-16 mx-auto object-contain"
                        onError={(e) => {
                           e.currentTarget.style.display = 'none';
                           e.currentTarget.parentElement!.innerHTML = '<span class="font-extrabold text-4xl text-gray-900">Trini<span class="text-trini-red">Build</span></span>';
                        }}
                     />
                  </div>
                  <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                     {claimMode ? 'Claim Your Business Listing' : 'Launch Your Free Store'}
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                     {claimMode
                        ? `Take control of your presence on Trinidad's largest directory.`
                        : 'Join the ecosystem. 10 Free listings included forever.'}
                  </p>
               </div>
            )}

            {/* Progress Bar (Hidden in Step 3+) */}
            {step < 3 && (
               <div className="mb-12 relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
                  <div className="flex justify-between max-w-2xl mx-auto">
                     {[
                        { num: 1, label: "Identity & Style", active: step >= 1 },
                        { num: 2, label: "AI Preview", active: step >= 2 || loading },
                        { num: 3, label: "Launch", active: step === 3 }
                     ].map((s, idx) => (
                        <div key={idx} className="flex flex-col items-center bg-gray-50 px-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 transition-colors shadow-lg ${s.active ? 'bg-trini-red' : 'bg-gray-300'}`}>
                              {s.active ? <CheckCircle className="h-5 w-5" /> : s.num}
                           </div>
                           <span className={`text-xs font-bold uppercase tracking-wide ${s.active ? 'text-trini-red' : 'text-gray-400'}`}>
                              {s.label}
                           </span>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            <div className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 relative transition-all duration-500 ${step >= 3 ? 'fixed inset-0 z-50 rounded-none m-0 border-0' : ''}`}>
               {/* Step 1: Input Form */}
               {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2">
                     <div className="p-8 md:p-12 flex flex-col justify-center">

                        {claimMode && (
                           <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex items-start animate-in fade-in slide-in-from-top-2">
                              <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                              <div>
                                 <p className="text-sm font-bold text-blue-800">Claiming: {formData.name}</p>
                                 {formData.address && <p className="text-xs text-blue-600 mt-1">{formData.address}</p>}
                              </div>
                           </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide bg-white w-fit px-1">Category</label>
                              <div className="relative">
                                 <select
                                    className="w-full border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-trini-red focus:border-trini-red bg-white text-gray-900 text-base font-medium appearance-none cursor-pointer hover:border-gray-400 transition-all"
                                    value={formData.type}
                                    aria-label="Category"
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                 >
                                    <option value="" disabled className="text-gray-400">Select...</option>
                                    <optgroup label="Food & Hospitality">
                                       <option value="Restaurant">🍔 Restaurant</option>
                                       <option value="Fast Food">🍟 Fast Food</option>
                                       <option value="Cafe">☕ Café</option>
                                       <option value="Bar">🍺 Bar</option>
                                       <option value="Grocery">🛒 Grocery</option>
                                    </optgroup>
                                    <optgroup label="Retail">
                                       <option value="Fashion">👗 Fashion</option>
                                       <option value="Electronics">📱 Tech</option>
                                       <option value="Home Garden">🏡 Home</option>
                                       <option value="Hardware">🔨 Hardware</option>
                                    </optgroup>
                                    <optgroup label="Services">
                                       <option value="Beauty">💇‍♀️ Beauty</option>
                                       <option value="Automotive">🔧 Auto</option>
                                       <option value="Professional">💼 Pro Services</option>
                                    </optgroup>
                                 </select>
                              </div>
                           </div>

                           <div>
                              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide bg-white w-fit px-1">Store Vibe</label>
                              <div className="relative">
                                 <select
                                    className="w-full border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-trini-red focus:border-trini-red bg-white text-gray-900 text-base font-medium appearance-none cursor-pointer hover:border-gray-400 transition-all"
                                    value={formData.vibe}
                                    aria-label="Store Vibe"
                                    onChange={(e) => setFormData({ ...formData, vibe: e.target.value })}
                                 >
                                    <option value="Modern">✨ Modern & Clean</option>
                                    <option value="Rustic">🪵 Rustic & Cozy</option>
                                    <option value="Vibrant">🎨 Vibrant & Bold</option>
                                    <option value="Luxury">💎 Luxury & Elegant</option>
                                    <option value="Corporate">🏢 Corporate</option>
                                 </select>
                                 <Palette className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                              </div>
                           </div>
                        </div>

                        <button
                           onClick={handleGenerate}
                           disabled={loading || !formData.name || !formData.type}
                           className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-trini-red to-red-700 hover:from-red-700 hover:to-trini-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 mt-6"
                        >
                           {loading ? (
                              <>
                                 <Loader2 className="animate-spin -ml-1 mr-2 h-6 w-6" />
                                 Generating Website...
                              </>
                           ) : (
                              <>
                                 {claimMode ? 'Verify & Build' : 'Build Free Store'} <Wand2 className="ml-2 h-5 w-5" />
                              </>
                           )}
                        </button>
                        <div className="flex items-center justify-center text-xs text-gray-500 font-bold mt-3">
                           <CreditCard className="h-3 w-3 mr-1 text-green-500" /> No Credit Card Required
                        </div>
                     </div>


                     {/* Value Prop Box */}
                     <div className="bg-gray-900 text-white p-12 hidden md:flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                           <Store className="h-64 w-64" />
                        </div>
                        <h3 className="text-2xl font-bold mb-8 relative z-10">We build it for you.</h3>
                        <div className="space-y-6 relative z-10">
                           {[
                              { title: "Smart Imagery", desc: "Our AI selects product photos based on your specific industry.", icon: Zap },
                              { title: "Local Copywriting", desc: "Descriptions written with Trinidadian consumers in mind.", icon: LayoutTemplate },
                              { title: "Mobile Optimized", desc: "Looks perfect on every phone, tablet, and desktop.", icon: Smartphone }
                           ].map((feat, i) => (
                              <div key={i} className="flex">
                                 <div className="bg-white/10 p-3 rounded-lg h-fit">
                                    <feat.icon className="h-6 w-6 text-trini-red" />
                                 </div>
                                 <div className="ml-4">
                                    <h4 className="font-bold text-lg">{feat.title}</h4>
                                    <p className="text-gray-400 text-sm mt-1">{feat.desc}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                  </div>
               )}

               {/* Step 2: AI Result Preview (Code unchanged, just context) */}
               {step === 2 && generatedStore && (
                  <div className="flex flex-col h-full">
                     {/* ... (Same preview code as before) ... */}
                     {/* Shortened for brevity in this output, assuming content preserved */}
                     {/* Preview Control Bar */}
                     <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                        <div className="flex items-center">
                           <div className="bg-green-100 text-green-700 p-1.5 rounded-full mr-3">
                              <CheckCircle className="h-5 w-5" />
                           </div>
                           <div>
                              <h2 className="text-sm font-bold text-gray-900">Your New Website Draft</h2>
                              <p className="text-xs text-gray-500 hidden sm:block">10 Free Listings Included • {formData.vibe} Design</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <div className="bg-gray-100 p-1 rounded-lg flex">
                              <button onClick={() => setViewMode('desktop')} className={`p-2 rounded-md transition-all ${viewMode === 'desktop' ? 'bg-white shadow text-trini-red' : 'text-gray-500 hover:text-gray-700'}`} title="Desktop View" aria-label="Desktop View"><Monitor className="h-5 w-5" /></button>
                              <button onClick={() => setViewMode('mobile')} className={`p-2 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-white shadow text-trini-red' : 'text-gray-500 hover:text-gray-700'}`} title="Mobile View" aria-label="Mobile View"><Smartphone className="h-5 w-5" /></button>
                           </div>
                           <button onClick={() => setImageSeed(prev => prev + 1)} className="text-xs flex items-center font-bold text-gray-500 hover:text-trini-red transition-colors" title="Regenerate Images"><RefreshCw className="h-4 w-4 mr-1" /> New Images</button>
                        </div>
                     </div>

                     <div className="flex-grow p-8 bg-gray-100 flex justify-center overflow-y-auto max-h-[80vh] custom-scrollbar">
                        <div className={`bg-white rounded-xl shadow-2xl border border-gray-300 overflow-hidden transition-all duration-500 ${viewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-5xl'}`}>
                           <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-yellow-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div></div>
                              <div className="flex-grow mx-4 bg-white border border-gray-200 rounded-md h-7 text-xs flex items-center px-3 text-gray-500 font-mono overflow-hidden"><ShieldCheck className="h-3 w-3 mr-1 text-green-500" />trinibuild.com/store/{formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}</div>
                           </div>
                           <div className={`min-h-[500px] ${formData.vibe === 'Luxury' ? 'font-serif' : 'font-sans'}`}>
                              <div className={`p-8 text-white relative overflow-hidden ${formData.vibe === 'Vibrant' ? 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500' : formData.vibe === 'Rustic' ? 'bg-[#4a3b32]' : formData.vibe === 'Luxury' ? 'bg-black' : 'bg-white text-gray-900 border-b border-gray-100'}`}>
                                 <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg ${formData.vibe === 'Modern' ? 'bg-trini-black text-white' : 'bg-white text-gray-900'}`}>{formData.name.substring(0, 2).toUpperCase()}</div>
                                    <h2 className={`text-3xl font-extrabold mb-1 ${formData.vibe === 'Modern' ? 'text-gray-900' : 'text-white'}`}>{formData.name}</h2>
                                    <p className={`font-medium opacity-90 ${formData.vibe === 'Modern' ? 'text-trini-teal' : 'text-white/80'}`}>{formData.type} • {formData.vibe} Style</p>
                                 </div>
                              </div>
                              <div className="p-8">
                                 <div className={`p-4 rounded-lg border-l-4 mb-10 ${formData.vibe === 'Vibrant' ? 'bg-yellow-50 border-yellow-400 text-yellow-900' : 'bg-gray-50 border-trini-teal text-gray-600'}`}><p className="italic text-lg">"{generatedStore.description}"</p></div>
                                 <div className="mb-10">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center"><Camera className="h-4 w-4 mr-2 text-blue-500" /> Store Atmosphere</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                       {['Interior', 'Storefront', 'Action'].map((scene, idx) => (
                                          <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-gray-200 relative group">
                                             <img src={getAiImageUrl(`${formData.type} ${scene}`, 'atmosphere')} className="w-full h-full object-cover" alt={scene} />
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center"><Zap className="h-4 w-4 mr-2 text-yellow-500" /> Featured Products</h3>
                                 <div className={`grid gap-6 ${viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
                                    {generatedStore.products?.slice(0, 3).map((prod, idx) => (
                                       <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                                          <div className="aspect-[4/3] bg-white relative overflow-hidden p-4 flex items-center justify-center">
                                             <img src={getAiImageUrl(prod.name, 'product')} alt={prod.name} className="max-w-full max-h-full object-contain transform group-hover:scale-105 transition-transform duration-700" />
                                          </div>
                                          <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                                             <h4 className="font-bold text-gray-900 mb-1 leading-tight">{prod.name}</h4>
                                             <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded border border-white/20 shadow-sm">TT${prod.price}</div>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white border-t border-gray-200 p-4 flex flex-col sm:flex-row gap-4 justify-center items-center z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        <button onClick={() => setStep(1)} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-bold w-full sm:w-auto">Back to Edit</button>
                        <button onClick={handleComplete} className="px-8 py-3 bg-trini-red text-white rounded-lg hover:bg-red-700 shadow-xl font-bold flex items-center justify-center text-lg transform hover:scale-105 transition-all w-full sm:w-auto animate-pulse-subtle">{claimMode ? 'Confirm Claim' : 'Claim to Go Live'} <ArrowRight className="ml-2 h-5 w-5" /></button>
                     </div>
                  </div>
               )}

               {/* Step 3: Celebration Mode (Transition to Step 4) */}
               {step === 3 && (
                  <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center text-center p-6 overflow-hidden">
                     <style>{`
                   @keyframes firework { 0% { transform: translate(var(--x), var(--initialY)); width: var(--initialSize); opacity: 1; } 50% { width: 0.5rem; opacity: 1; } 100% { width: var(--finalSize); opacity: 0; } }
                   .firework, .firework::before, .firework::after { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 0.5rem; aspect-ratio: 1; background: radial-gradient(circle, #ff0 0.2rem, #0000 0) 50% 0% / 100% 100%, radial-gradient(circle, #ff0 0.2rem, #0000 0) 0% 50% / 100% 100%, radial-gradient(circle, #ff0 0.2rem, #0000 0) 50% 100% / 100% 100%, radial-gradient(circle, #ff0 0.2rem, #0000 0) 100% 50% / 100% 100%; background-size: 0.5rem 0.5rem; background-repeat: no-repeat; animation: firework 2s infinite; }
                   .firework::before { transform: translate(-50%, -50%) rotate(45deg); } .firework::after { transform: translate(-50%, -50%) rotate(-45deg); }
                   .confetti { position: absolute; width: 10px; height: 10px; background-color: #f00; animation: fall linear forwards; } @keyframes fall { to { transform: translateY(100vh) rotate(720deg); } }
                `}</style>
                     <div className="absolute inset-0 pointer-events-none">
                        {[...Array(3)].map((_, i) => (<div key={i} className="firework" style={{ left: `${20 + Math.random() * 60}%`, top: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.5}s`, '--x': '-50%', '--initialY': '-50%', '--initialSize': '0.5rem', '--finalSize': '30rem' } as any}></div>))}
                        {[...Array(50)].map((_, i) => (<div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, top: `-10%`, backgroundColor: ['#CE1126', '#FCD116', '#000000', '#008080'][Math.floor(Math.random() * 4)], animationDuration: `${2 + Math.random() * 3}s`, animationDelay: `${Math.random() * 2}s` }}></div>))}
                     </div>
                     <div className="relative z-10 animate-in zoom-in duration-700">
                        <div className="bg-white p-10 rounded-3xl shadow-2xl border-4 border-trini-red max-w-2xl mx-auto">
                           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"><Star className="h-12 w-12 text-green-600 fill-current animate-spin-slow" /></div>
                           <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">Welcome to <span className="text-trini-red">TriniBuild</span></h1>
                           <p className="text-xl md:text-2xl text-gray-600 mb-10 font-medium">Your digital empire starts now. <br /><span className="text-trini-black font-bold">Welcome to the ecosystem.</span></p>
                           <button onClick={() => setStep(4)} className="bg-trini-red text-white px-10 py-5 rounded-full font-bold text-xl shadow-xl hover:bg-red-700 hover:scale-105 transition-all animate-pulse-subtle">Continue to Dashboard</button>
                        </div>
                     </div>
                  </div>
               )}

               {/* Step 4: THE UPSELL (One Time Offer) */}
               {step === 4 && (
                  <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center p-4">
                     <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 text-center relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                           <span className="inline-block bg-black/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-2">One Time Offer</span>
                           <h2 className="text-3xl md:text-4xl font-extrabold text-white relative z-10">Wait! Fast Track Your Success</h2>
                           <p className="text-yellow-50 mt-2 font-medium relative z-10">Don't start from zero. Start as a leader.</p>
                        </div>

                        <div className="p-8 md:p-12">
                           <div className="flex flex-col md:flex-row gap-8 items-center">
                              <div className="flex-1 space-y-6">
                                 <div className="flex items-start">
                                    <div className="bg-green-100 p-3 rounded-full mr-4"><ShieldCheck className="h-6 w-6 text-green-600" /></div>
                                    <div><h4 className="font-bold text-lg text-gray-900">Verified Business Badge</h4><p className="text-sm text-gray-500">Instantly build trust. Verified stores get 3x more clicks.</p></div>
                                 </div>
                                 <div className="flex items-start">
                                    <div className="bg-purple-100 p-3 rounded-full mr-4"><TrendingUp className="h-6 w-6 text-purple-600" /></div>
                                    <div><h4 className="font-bold text-lg text-gray-900">24h Homepage Boost</h4><p className="text-sm text-gray-500">Get featured on the front page of TriniBuild for 24 hours.</p></div>
                                 </div>
                                 <div className="flex items-start">
                                    <div className="bg-blue-100 p-3 rounded-full mr-4"><Lock className="h-6 w-6 text-blue-600" /></div>
                                    <div><h4 className="font-bold text-lg text-gray-900">Unlock AI Analytics</h4><p className="text-sm text-gray-500">See who is visiting your store from day one.</p></div>
                                 </div>
                              </div>

                              <div className="flex-1 bg-gray-50 p-6 rounded-xl border-2 border-yellow-400 text-center w-full">
                                 <p className="text-sm text-gray-500 font-bold uppercase line-through">Regular Price: $199</p>
                                 <div className="text-5xl font-extrabold text-gray-900 my-2">TT$49</div>
                                 <p className="text-xs text-red-500 font-bold uppercase mb-6">One-time payment • 75% OFF</p>
                                 <button onClick={handleTakeOffer} className="w-full bg-yellow-500 text-black py-4 rounded-lg font-extrabold text-lg hover:bg-yellow-400 shadow-lg transform hover:scale-105 transition-all mb-3">
                                    Yes! I want to grow faster
                                 </button>
                                 <button onClick={handleSkipOffer} className="text-sm text-gray-400 font-medium hover:text-gray-600 underline">
                                    No thanks, I'll stay on the slow path
                                 </button>
                              </div>
                           </div>
                        </div>
                        <div className="bg-gray-50 px-8 py-4 text-center text-xs text-gray-400">
                           This offer is only available during signup. Secure payment via Credit Card or Bank Transfer.
                        </div>
                     </div>
                  </div>
               )}

            </div>

            {/* Legal Modal */}
            {showLegalModal && (
               <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                     <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900">One Last Step</h3>
                        <button onClick={() => setShowLegalModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close Modal">
                           <X className="h-6 w-6" />
                        </button>
                     </div>
                     <div className="p-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 flex items-start">
                           <FileSignature className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                           <p className="text-sm text-blue-800">
                              To launch your store, you must sign the <strong>Independent Contractor Agreement</strong>. This confirms you are a business owner, not an employee.
                           </p>
                        </div>

                        <div className="space-y-3 mb-6">
                           <Link to="/contractor-agreement" target="_blank" className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                              <span className="text-sm font-medium text-gray-700">Read Agreement</span>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                           </Link>
                        </div>

                        <button
                           onClick={handleSign}
                           disabled={isSigning}
                           className="w-full bg-trini-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-70 flex items-center justify-center"
                        >
                           {isSigning ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign & Launch Store'}
                        </button>
                     </div>
                  </div>
               </div>
            )}

            <div className="text-center mt-8">
               <p className="text-sm text-gray-500">Need help? <Link to="/contact" className="text-trini-red font-bold hover:underline">Chat with Support</Link></p>
            </div>
         </div>
      </div >
   );
};
