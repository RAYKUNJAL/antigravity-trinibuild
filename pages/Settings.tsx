import React, { useState, useEffect } from 'react';
import { Save, Key, Shield, CheckCircle, RotateCcw, Loader2, AlertCircle, Zap } from 'lucide-react';
import { testApiKey } from '../services/geminiService';

// Google Maps API removed — app now uses OpenStreetMap/Leaflet for all maps.
// The `google` window global and Maps API key test are no longer needed.

export const Settings: React.FC = () => {
  const [keys, setKeys] = useState({
    gemini: '',
    whatsappToken: '',
    paypalClient: ''
  });
  const [saved, setSaved] = useState(false);

  // Testing States
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    setKeys({
      gemini: localStorage.getItem('gemini_api_key') || '',
      whatsappToken: localStorage.getItem('whatsapp_api_token') || '',
      paypalClient: localStorage.getItem('paypal_client_id') || ''
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', keys.gemini);
    localStorage.setItem('whatsapp_api_token', keys.whatsappToken);
    localStorage.setItem('paypal_client_id', keys.paypalClient);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    if (window.confirm("Settings saved. Reload app to apply changes?")) {
      window.location.reload();
    }
  };

  const handleTestGemini = async () => {
    if (!keys.gemini && !process.env.API_KEY) {
      alert("Please enter a key first.");
      return;
    }
    // Temp save for test
    if (keys.gemini) localStorage.setItem('gemini_api_key', keys.gemini);

    setTestingGemini(true);
    setGeminiStatus(null);

    const success = await testApiKey();
    setGeminiStatus(success ? 'success' : 'error');
    setTestingGemini(false);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all stored keys?")) {
      localStorage.clear();
      setKeys({ gemini: '', whatsappToken: '', paypalClient: '' });
      setGeminiStatus(null);
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Shield className="h-6 w-6 mr-2 text-trini-red" />
          Platform Settings & API Keys
        </h1>
        <p className="text-gray-500 mt-2">
          Manage the external service connections for TriniBuild. Keys are stored locally in your browser for this session.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="p-6 space-y-6">
          <form onSubmit={handleSave}>
            {/* Gemini API */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                <div className="flex items-center">
                  <Key className="h-4 w-4 mr-2 text-blue-500" />
                  AI Service API Key (Optional)
                </div>
                <button
                  type="button"
                  onClick={handleTestGemini}
                  disabled={testingGemini}
                  className="text-xs flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100 hover:bg-blue-100"
                >
                  {testingGemini ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                  Test Connection
                </button>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={keys.gemini}
                  onChange={(e) => {
                    setKeys({ ...keys, gemini: e.target.value });
                    setGeminiStatus(null);
                  }}
                  placeholder="AIzaSy..."
                  className={`w-full border rounded-md p-3 font-mono text-sm focus:ring-trini-teal focus:border-trini-teal ${geminiStatus === 'success' ? 'border-green-500 bg-green-50' :
                      geminiStatus === 'error' ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                />
                {geminiStatus === 'success' && (
                  <span className="absolute right-3 top-3 text-green-600 text-xs font-bold flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" /> Connected
                  </span>
                )}
                {geminiStatus === 'error' && (
                  <span className="absolute right-3 top-3 text-red-600 text-xs font-bold flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> Invalid Key
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Required for Store Creator, Chatbot, and Vision AI.</p>
            </div>

            {/* Maps API — removed. App now uses OpenStreetMap/Leaflet (no API key needed). */}

            {/* WhatsApp */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Key className="h-4 w-4 mr-2 text-green-600" />
                WhatsApp Business Token (Optional)
              </label>
              <input
                type="password"
                value={keys.whatsappToken}
                onChange={(e) => setKeys({ ...keys, whatsappToken: e.target.value })}
                placeholder="EAAG..."
                className="w-full border border-gray-300 rounded-md p-3 font-mono text-sm focus:ring-trini-teal focus:border-trini-teal"
              />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={handleReset}
                className="text-red-600 text-sm font-medium hover:text-red-800 flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Clear All Keys
              </button>

              <button
                type="submit"
                className="bg-trini-black text-white px-6 py-3 rounded-md font-bold hover:bg-gray-800 flex items-center shadow-lg"
              >
                {saved ? <CheckCircle className="h-5 w-5 mr-2 text-green-400" /> : <Save className="h-5 w-5 mr-2" />}
                {saved ? 'Settings Saved' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};