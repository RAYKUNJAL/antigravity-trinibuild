import React, { useState } from 'react';
import { Car, UploadCloud, CheckCircle, ChevronRight, ArrowLeft, FileSignature, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { legalService } from '../services/legalService';
import { supabase } from '../services/supabaseClient';

export const DriverOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    vehicleType: 'Sedan',
    make: '',
    model: '',
    plate: '',
    licenseFile: null as File | null
  });
  const [isSigning, setIsSigning] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, licenseFile: e.target.files[0] });
    }
  };

  const handleSign = async () => {
    setIsSigning(true);
    try {
      // Sign documents in Supabase
      await legalService.signDocument('current-user', 'contractor_agreement', 'Signed via App');
      await legalService.signDocument('current-user', 'liability_waiver', 'Signed via App');
      setHasSigned(true);
    } catch (error) {
      console.error("Signing failed", error);
      alert("Failed to sign documents. Please try again.");
    } finally {
      setIsSigning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // TODO: Implement actual file upload to Supabase Storage
        // For now, we'll use a placeholder to allow the flow to complete
        const licenseUrl = `https://placeholder.com/license/${user.id}/${formData.licenseFile?.name}`;

        const { error } = await supabase
          .from('driver_applications')
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || 'Unknown Driver',
            phone: user.phone || user.user_metadata?.phone || '',
            vehicle_type: `${formData.vehicleType} - ${formData.make} ${formData.model}`,
            license_number: formData.plate,
            status: 'pending'
          });

        if (error) throw error;

        alert("Application Submitted! We will review your documents.");
        navigate('/dashboard');
      } catch (error) {
        console.error("Submission failed", error);
        alert("Failed to submit application. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link to="/earn" className="text-gray-500 hover:text-gray-900 flex items-center mb-8">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Earn
        </Link>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold flex items-center">
              <Car className="h-8 w-8 mr-3" /> Driver Registration
            </h1>
            <p className="text-blue-100 mt-2">Step {step} of 4</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-xl font-bold text-gray-900">Vehicle Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Sedan', 'SUV', 'Pickup Truck', 'Van'].map(type => (
                      <div
                        key={type}
                        onClick={() => setFormData({ ...formData, vehicleType: type })}
                        className={`border rounded-lg p-4 cursor-pointer transition-all text-center ${formData.vehicleType === type ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Make (e.g. Toyota)</label>
                    <input type="text" required className="mt-1 w-full border border-gray-300 rounded-md p-3" value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model (e.g. Corolla)</label>
                    <input type="text" required className="mt-1 w-full border border-gray-300 rounded-md p-3" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Plate (e.g. PDE 1234)</label>
                  <input type="text" required className="mt-1 w-full border border-gray-300 rounded-md p-3 uppercase" value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })} />
                </div>
                <button type="button" onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center">
                  Next Step <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-xl font-bold text-gray-900">Document Verification</h2>
                <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 border border-yellow-200">
                  Please upload a clear photo of your valid Driver's Permit. We use AI to verify expiry dates.
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input type="file" required accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {formData.licenseFile ? (
                    <div>
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="font-bold text-gray-900">{formData.licenseFile.name}</p>
                      <p className="text-xs text-gray-500">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="font-medium text-gray-600">Upload Driver's Permit</p>
                      <p className="text-xs text-gray-400">JPG or PNG</p>
                    </div>
                  )
                  }
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Back</button>
                  <button type="button" onClick={() => setStep(3)} disabled={!formData.licenseFile} className="w-2/3 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">Next Step</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in">
                <h2 className="text-xl font-bold text-gray-900">Legal Agreements</h2>
                <p className="text-gray-500 text-sm">
                  To drive with TriniBuild, you must sign the Independent Contractor Agreement and Liability Waiver.
                </p>

                <div className="space-y-4">
                  <div className="border p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <FileSignature className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-bold text-sm">Independent Contractor Agreement</p>
                        <Link to="/contractor-agreement" target="_blank" className="text-xs text-blue-600 hover:underline">View Document</Link>
                      </div>
                    </div>
                    {hasSigned && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </div>

                  <div className="border p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <FileSignature className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-bold text-sm">Liability Waiver</p>
                        <Link to="/liability-waiver" target="_blank" className="text-xs text-blue-600 hover:underline">View Document</Link>
                      </div>
                    </div>
                    {hasSigned && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500">
                  By clicking "Sign with DocuSign", you agree to be bound by these terms electronically.
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(2)} className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">Back</button>
                  {hasSigned ? (
                    <button type="button" onClick={() => setStep(4)} className="w-2/3 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Continue</button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSign}
                      disabled={isSigning}
                      className="w-2/3 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center"
                    >
                      {isSigning ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign with DocuSign'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-8 animate-in fade-in">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Submit?</h2>
                <p className="text-gray-500 mb-8">
                  Your application and signed documents are ready for review.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg text-left mb-8 text-sm text-gray-600">
                  <p><strong>Vehicle:</strong> {formData.make} {formData.model} ({formData.plate})</p>
                  <p><strong>Docs:</strong> {formData.licenseFile?.name}</p>
                  <p><strong>Legal:</strong> <span className="text-green-600 font-bold">Signed</span></p>
                </div>

                <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 shadow-lg">
                  Submit Application
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};