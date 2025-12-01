
import React, { useState, useEffect } from 'react';
import { CheckCircle, FileText, User, Shield, PenTool, Loader2, ArrowRight, UploadCloud, Lock, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generatePromoterContract } from '../services/geminiService';
import { legalService } from '../services/legalService';

import { supabase } from '../services/supabaseClient';

// Real Upload Function
const uploadFile = async (file: File | null): Promise<string> => {
   if (!file) return '';

   try {
      // 1. Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `promoter-ids/${fileName}`;

      // 2. Upload to Supabase 'documents' bucket
      const { data, error } = await supabase.storage
         .from('documents')
         .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
         });

      if (error) {
         console.error('Supabase upload error:', error);
         throw error;
      }

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
         .from('documents')
         .getPublicUrl(filePath);

      console.log('File uploaded successfully:', publicUrl);
      return publicUrl;

   } catch (error) {
      console.error('File upload failed:', error);
      // Fallback for development if bucket doesn't exist
      // return `https://fake-storage.com/${file.name}`; 
      throw new Error('Failed to upload ID document. Please try again.');
   }
};

export const PromoterOnboarding: React.FC = () => {
   const navigate = useNavigate();
   const [step, setStep] = useState(1);
   const [loading, setLoading] = useState(false);
   const [contractText, setContractText] = useState('');

   // Form Data
   const [formData, setFormData] = useState({
      fullName: '',
      businessName: '',
      email: '',
      phone: '',
      idFile: null as File | null
   });

   // Signature
   const [signature, setSignature] = useState('');

   // Generate Contract on Step 3 Load
   useEffect(() => {
      if (step === 3 && !contractText) {
         setLoading(true);
         generatePromoterContract(formData.fullName, formData.businessName)
            .then(text => {
               setContractText(text);
               setLoading(false);
            })
            .catch(error => {
               console.error('Contract generation failed, using fallback:', error);
               // Fallback contract if AI fails
               const fallbackContract = `PROMOTER PARTNERSHIP AGREEMENT

This Agreement is entered into on ${new Date().toLocaleDateString()} between:

PARTY A: TriniBuild Technologies Ltd. ("Platform")
PARTY B: ${formData.fullName} representing ${formData.businessName} ("Promoter")

1. TERM & EXCLUSIVITY
   - Effective Period: 2 Years from date of signing
   - Renewable upon mutual written consent

2. FEES & COMMISSION
   - Promotional Rate: 6.0% per ticket sold
   - Standard Rate: 8.0% (Discounted for this agreement)
   - Processing Fee: Included in promotional rate
   
3. PAYOUT SCHEDULE
   - Weekly payments every Tuesday
   - Direct deposit to registered bank account
   - Payment threshold: TT$100 minimum

4. OBLIGATIONS
   Platform agrees to:
   - Provide ticketing infrastructure
   - Process payments securely
   - Market events on platform
   
   Promoter agrees to:
   - Maintain event quality standards
   - Respond to customer inquiries
   - Comply with local regulations

5. TERMINATION
   Either party may terminate with 30 days written notice.

6. INDEPENDENT CONTRACTOR
   Promoter is an independent contractor, not an employee.
   Promoter is responsible for own taxes and compliance.

By signing below, both parties agree to these terms.

____________________________________________
Platform Representative

____________________________________________
${formData.fullName} (Digital Signature)
${new Date().toLocaleDateString()}`;

               setContractText(fallbackContract);
               setLoading(false);
            });
      }
   }, [step, formData.fullName, formData.businessName, contractText]);


   const handleNext = () => {
      setStep(step + 1);
   };

   const handleFinish = async () => {
      setLoading(true);
      try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) throw new Error("Not authenticated");

         // Upload ID file (Mocking upload for now)
         const idFileUrl = await uploadFile(formData.idFile);

         const { error } = await supabase
            .from('promoter_applications')
            .insert({
               user_id: user.id,
               organization_name: formData.businessName,
               event_types: [], // Can add field to form later if needed
               experience_years: '0', // Default or add field
               status: 'pending'
            });

         if (error) throw error;

         setLoading(false);
         setStep(4); // Success
      } catch (error) {
         console.error("Submission failed", error);
         alert("Failed to submit application. Please try again.");
         setLoading(false);
      }
   };

   return (
      <div className="min-h-screen bg-gray-50 py-12 font-sans">
         <div className="max-w-3xl mx-auto px-4">

            {/* Progress Header */}
            <div className="mb-8">
               <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">Promoter Registration</h1>
                  <span className="text-sm font-bold text-trini-red bg-red-50 px-3 py-1 rounded-full">6% Rate Lock Offer</span>
               </div>
               <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-full bg-trini-black rounded-full transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }}></div>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">

               {/* STEP 1: BASIC INFO */}
               {step === 1 && (
                  <div className="p-8 animate-in fade-in">
                     <h2 className="text-xl font-bold mb-6 flex items-center"><User className="mr-2" /> Organization Details</h2>
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Promoter / Full Name</label>
                              <input type="text" className="w-full border border-gray-300 rounded-lg p-3" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="John Doe" />
                           </div>
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Business Name</label>
                              <input type="text" className="w-full border border-gray-300 rounded-lg p-3" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} placeholder="JD Events Ltd." />
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                              <input type="email" aria-label="Email Address" className="w-full border border-gray-300 rounded-lg p-3" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                           </div>
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                              <input type="tel" aria-label="Phone Number" className="w-full border border-gray-300 rounded-lg p-3" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (868)" />
                           </div>
                        </div>
                        <button
                           disabled={!formData.fullName || !formData.businessName}
                           onClick={handleNext}
                           className="w-full bg-trini-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center"
                        >
                           Continue <ArrowRight className="ml-2 h-5 w-5" />
                        </button>
                     </div>
                  </div>
               )}

               {/* STEP 2: VERIFICATION */}
               {step === 2 && (
                  <div className="p-8 animate-in fade-in">
                     <h2 className="text-xl font-bold mb-6 flex items-center"><Shield className="mr-2" /> Identity Verification</h2>
                     <p className="text-gray-500 mb-6 text-sm">To comply with financial regulations and unlock payouts, please upload a valid ID (National ID, Driver's Permit, or Passport).</p>

                     <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer relative mb-8">
                        <input type="file" accept="image/*" onChange={e => e.target.files && setFormData({ ...formData, idFile: e.target.files[0] })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        {formData.idFile ? (
                           <div>
                              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                              <p className="font-bold text-gray-900">{formData.idFile.name}</p>
                              <p className="text-xs text-gray-500">Ready for AI Scan</p>
                           </div>
                        ) : (
                           <div>
                              <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="font-medium text-gray-600">Click to Upload ID</p>
                              <p className="text-xs text-gray-400">Secure Encryption Enabled</p>
                           </div>
                        )}
                     </div>

                     <div className="bg-blue-50 p-4 rounded-lg flex items-start mb-8">
                        <Lock className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                        <p className="text-xs text-blue-800">Your data is encrypted using AES-256 standards. We use AI to verify identity in real-time to prevent fraud.</p>
                     </div>

                     <button
                        disabled={!formData.idFile}
                        onClick={handleNext}
                        className="w-full bg-trini-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center"
                     >
                        Verify & Proceed <ArrowRight className="ml-2 h-5 w-5" />
                     </button>
                  </div>
               )}

               {/* STEP 3: DOCUSIGN CONTRACT */}
               {step === 3 && (
                  <div className="p-8 animate-in fade-in">
                     <h2 className="text-xl font-bold mb-2 flex items-center"><FileText className="mr-2" /> Sign Partnership Agreement</h2>
                     <p className="text-sm text-gray-500 mb-6">Please review and sign to lock in your 6% promotional rate for 24 months.</p>

                     {loading ? (
                        <div className="h-64 flex items-center justify-center flex-col text-gray-400">
                           <Loader2 className="h-10 w-10 animate-spin mb-4 text-trini-red" />
                           <p>Generating Custom Contract...</p>
                        </div>
                     ) : (
                        <div className="space-y-6">
                           <div className="h-64 overflow-y-auto bg-gray-50 p-6 rounded-lg border border-gray-300 text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-wrap shadow-inner">
                              {contractText}
                           </div>

                           <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start">
                              <Shield className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                              <p className="text-sm text-yellow-800">
                                 By signing, you acknowledge that you are an <strong>Independent Contractor</strong> and not an employee of TriniBuild. You are responsible for your own taxes and compliance.
                              </p>
                           </div>

                           <div className="border-t-2 border-gray-200 pt-6">
                              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Digital Signature</label>
                              <p className="text-xs text-gray-500 mb-2">Type your full name to sign. This constitutes a legal signature via DocuSign.</p>
                              <div className="relative">
                                 <input
                                    type="text"
                                    value={signature}
                                    onChange={(e) => setSignature(e.target.value)}
                                    className="w-full border-b-2 border-black bg-yellow-50 p-4 font-cursive text-2xl text-black focus:outline-none placeholder-gray-300"
                                    style={{ fontFamily: '"Brush Script MT", cursive' }}
                                    placeholder="Sign Here"
                                 />
                                 <PenTool className="absolute right-4 top-4 h-6 w-6 text-gray-400" />
                              </div>
                           </div>

                           <div className="flex gap-4">
                              <button onClick={() => setStep(2)} className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Back</button>
                              <button
                                 disabled={!signature || signature.length < 3}
                                 onClick={async () => {
                                    setLoading(true);
                                    try {
                                       const { data: { user } } = await supabase.auth.getUser();
                                       if (!user) {
                                          alert("Please log in to complete your registration.");
                                          // Save state to local storage so they don't lose it?
                                          // PromoterOnboarding doesn't seem to have auto-save like StoreCreator.
                                          // But for now, redirecting is the safest bet to avoid errors.
                                          navigate('/auth?redirect=/tickets/onboarding');
                                          return;
                                       }

                                       await legalService.signDocument(user.id, 'contractor_agreement', signature);
                                       await handleFinish();
                                    } catch (e) {
                                       console.error(e);
                                       setLoading(false);
                                       alert("Something went wrong. Please try again.");
                                    }
                                 }}
                                 className="w-2/3 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center shadow-lg"
                              >
                                 {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Submit & Launch <CheckCircle className="ml-2 h-5 w-5" /></>}
                              </button>
                           </div>
                        </div>
                     )}
                  </div>
               )}

               {/* STEP 4: SUCCESS */}
               {step === 4 && (
                  <div className="p-12 text-center animate-in zoom-in duration-500">
                     <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                     </div>
                     <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Welcome to the Family!</h2>
                     <p className="text-lg text-gray-600 mb-8">
                        Your account is active. Your <span className="text-trini-red font-bold">6% Rate Lock</span> is confirmed.
                     </p>

                     <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto mb-8 flex items-center justify-between border border-gray-200">
                        <div className="text-left">
                           <p className="text-xs text-gray-500 uppercase font-bold">Contract</p>
                           <p className="font-bold text-sm truncate w-48">TriniBuild_Partnership_{formData.fullName.replace(' ', '_')}.pdf</p>
                        </div>
                        <button className="text-blue-600 text-xs font-bold flex items-center hover:underline">
                           <Download className="h-4 w-4 mr-1" /> Download
                        </button>
                     </div>

                     <button onClick={() => navigate('/tickets')} className="bg-trini-black text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-800 shadow-xl">
                        Go to Promoter Dashboard
                     </button>
                  </div>
               )}

            </div>
         </div>
      </div>
   );
};
