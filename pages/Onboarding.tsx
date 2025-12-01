import React, { useState, useEffect } from 'react';
import { User, Store, CheckCircle, ArrowRight, MapPin, TrendingUp, Briefcase, DollarSign, Star, Car, FileSignature, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { legalService } from '../services/legalService';
import { SignatureFlow } from '../components/SignatureFlow';
import { supabase } from '../services/supabaseClient';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState<'sell' | 'buy' | 'work' | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [showLegalFlow, setShowLegalFlow] = useState(false);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const handleLegalComplete = () => {
    // Legal docs signed, proceed to store creator
    if (intent === 'sell') {
      navigate(`/create-store?claim_name=${encodeURIComponent(businessName)}`);
    }
  };

  const handleContinue = () => {
    if (step === 1 && intent) {
      // Save intent immediately
      localStorage.setItem('user_intent', intent);

      if (intent === 'work') {
        navigate('/work/profile');
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      if (intent === 'sell') {
        if (businessName.trim()) {
          // Save business name for the creator to pick up
          localStorage.setItem('draft_business_name', businessName);
          setStep(3);
        }
      } else if (intent === 'buy') {
        if (location.trim()) {
          localStorage.setItem('user_location', location);
        }
        // Buyers skip legal signing for now or have a simpler flow
        navigate('/directory');
      }
    } else if (step === 3) {
      // Show legal flow for merchants
      if (intent === 'sell') {
        setShowLegalFlow(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">

      {/* Progress Bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-gray-200">
        <div
          className="h-full bg-trini-red transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-trini-black text-white font-bold text-xl mb-4 shadow-lg">
            TB
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {step === 1 && "What brings you here?"}
            {step === 2 && intent === 'sell' && "Let's name your store"}
            {step === 2 && intent === 'buy' && "Where are you located?"}
            {step === 3 && "One Last Thing"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 && "Select your path in the TriniBuild ecosystem."}
            {step === 2 && intent === 'sell' && "Customers need to know who you are."}
            {step === 3 && "We need to make it official."}
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100 relative overflow-hidden">

          <div className="absolute top-0 right-0 bg-green-50 text-green-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-b border-l border-green-100 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" /> 45 people joined today
          </div>

          {step === 1 && (
            <div className="space-y-3 mt-4">
              <button
                onClick={() => setIntent('sell')}
                className={`w-full text-left p-4 border-2 rounded-xl transition-all flex items-center group ${intent === 'sell' ? 'border-trini-red bg-red-50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className={`p-3 rounded-full mr-4 ${intent === 'sell' ? 'bg-trini-red text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}`}>
                  <Store className="h-6 w-6" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-gray-900">Merchant</h3>
                  <p className="text-xs text-gray-500">Build a Store & Accept Payments.</p>
                  <span className="text-[10px] font-bold text-trini-red bg-white px-1 rounded mt-1 inline-block">TriniBuild Pay</span>
                </div>
                {intent === 'sell' && <CheckCircle className="h-5 w-5 text-trini-red" />}
              </button>

              <button
                onClick={() => setIntent('buy')}
                className={`w-full text-left p-4 border-2 rounded-xl transition-all flex items-center group ${intent === 'buy' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className={`p-3 rounded-full mr-4 ${intent === 'buy' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}`}>
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-gray-900">Shopper</h3>
                  <p className="text-xs text-gray-500">Find Deals, Order Food & Request Rides.</p>
                  <span className="text-[10px] font-bold text-blue-600 bg-white px-1 rounded mt-1 inline-block">Ecosystem</span>
                </div>
                {intent === 'buy' && <CheckCircle className="h-5 w-5 text-blue-500" />}
              </button>

              <button
                onClick={() => setIntent('work')}
                className={`w-full text-left p-4 border-2 rounded-xl transition-all flex items-center group ${intent === 'work' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className={`p-3 rounded-full mr-4 ${intent === 'work' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}`}>
                  <Car className="h-6 w-6" />
                </div>
                <div className="flex-grow">
                  <FileSignature className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-bold text-sm">Independent Contractor Agreement</p>
                    <Link to="/contractor-agreement" target="_blank" className="text-xs text-blue-600 hover:underline">View Document</Link>
                  </div>
                </div>
                {hasSigned && <CheckCircle className="h-5 w-5 text-green-500" />}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500">
                By clicking "Sign & Continue", you agree to be bound by these terms electronically and acknowledge your status as an independent contractor.
              </div>

              {hasSigned ? (
            <button
              onClick={handleContinue}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-green-600 hover:bg-green-700 transition-all hover:scale-[1.02]"
            >
              Complete Setup <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSign}
              disabled={isSigning}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-trini-black hover:bg-gray-800 disabled:opacity-70 transition-all"
            >
              {isSigning ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign & Continue'}
            </button>
          )}
        </div>
          )}

        <div className="mt-8">
          {step < 3 && (
            <button
              onClick={handleContinue}
              disabled={(step === 1 && !intent) || (step === 2 && intent === 'sell' && !businessName) || (step === 2 && intent === 'buy' && !location)}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-trini-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
            >
              {step === 1 ? 'Continue' : 'Next Step'} <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          )}
          {step === 1 && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Already have an account? <Link to="/auth" className="text-trini-red font-bold cursor-pointer hover:underline">Log in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
    </div >
  );
};
