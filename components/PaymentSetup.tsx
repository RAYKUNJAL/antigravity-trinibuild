'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  CreditCard,
  Banknote,
  Building2,
  Check,
  X,
  AlertCircle,
  Shield,
  Zap,
  MessageSquare,
  DollarSign,
  Phone,
} from 'lucide-react';

interface PaymentSetupProps {
  storeId: string;
  onComplete?: () => void;
}

export default function PaymentSetup({ storeId, onComplete }: PaymentSetupProps) {
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [codSettings, setCodSettings] = useState({
    enabled: false,
    maxAmount: '1000',
    deliveryFee: '25',
    acceptedAreas: [] as string[],
  });
  const [bankSettings, setBankSettings] = useState({
    enabled: false,
    accountName: '',
    accountNumber: '',
    bank: '',
    branchCode: '',
  });
  const [creditCardSettings, setCreditCardSettings] = useState({
    enabled: false,
    provider: '',
    merchantId: '',
    apiKey: '',
  });

  const supabase = createClientComponentClient();

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit/Debit Cards',
      description: 'Accept Visa, Mastercard, AmEx from Trinidad banks',
      icon: CreditCard,
      fees: '2.9% + $1 per transaction',
      setupTime: '2-3 business days',
      recommended: true,
      features: [
        'Instant payment confirmation',
        'Automatic reconciliation',
        'Fraud protection',
        'Works with all Trinidad banks',
      ],
      providers: [
        { value: 'firstcitizens', label: 'First Citizens Bank',logo: '🏦' },
        { value: 'rbc', label: 'RBC Royal Bank', logo: '🏦' },
        { value: 'republic', label: 'Republic Bank', logo: '🏦' },
        { value: 'scotiabank', label: 'Scotiabank', logo: '🏦' },
      ],
    },
    {
      id: 'cod',
      name: 'Cash on Delivery (COD)',
      description: 'Customer pays in cash when receiving the order',
      icon: Banknote,
      fees: 'No processing fees',
      setupTime: 'Instant',
      recommended: true,
      features: [
        'Most popular in Trinidad',
        'No credit card needed',
        'Higher conversion rate',
        'Delivery partner integration',
      ],
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Manual bank deposit or online transfer',
      icon: Building2,
      fees: 'No processing fees',
      setupTime: 'Instant',
      recommended: false,
      features: [
        'Manual verification required',
        'No chargebacks',
        '1-2 day processing time',
        'Good for large orders',
      ],
    },
    {
      id: 'whatsapp_pay',
      name: 'WhatsApp Coordination',
      description: 'Coordinate payment details via WhatsApp',
      icon: MessageSquare,
      fees: 'No processing fees',
      setupTime: 'Instant',
      recommended: false,
      features: [
        'Personal touch',
        'Build customer relationships',
        'Flexible payment options',
        'Works with any bank',
      ],
    },
  ];

  const trinidadAreas = [
    'Port of Spain',
    'San Fernando',
    'Chaguanas',
    'Arima',
    'Point Fortin',
    'Diego Martin',
    'Tunapuna',
    'Couva',
    'Sangre Grande',
    'Tobago',
  ];

  const toggleMethod = (methodId: string) => {
    setSelectedMethods(prev =>
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handleSave = async () => {
    try {
      const paymentSettings = {
        credit_card: creditCardSettings.enabled ? creditCardSettings : null,
        cod: codSettings.enabled ? codSettings : null,
        bank_transfer: bankSettings.enabled ? bankSettings : null,
        enabled_methods: selectedMethods,
      };

      const { error } = await supabase
        .from('stores')
        .update({ payment_settings: paymentSettings })
        .eq('id', storeId);

      if (error) throw error;

      alert('Payment settings saved successfully!');
      onComplete?.();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save payment settings.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black font-inter mb-3 bg-gradient-to-r from-trini-red to-red-700 bg-clip-text text-transparent">
            Setup Payment Methods
          </h1>
          <p className="text-gray-600 font-inter text-lg">
            Choose how your customers will pay. Most Trinidad stores use COD + Cards.
          </p>
        </motion.div>
      </div>

      {/* Recommended Combo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 mb-12 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black font-inter mb-1">Recommended Setup</h2>
            <p className="text-white/90 font-inter">Based on 2,000+ successful Trinidad stores</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
            <h3 className="font-black font-inter mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Credit/Debit Cards
            </h3>
            <p className="text-sm text-white/80 font-inter mb-3">
              For customers with bank accounts. Instant payment, automatic processing.
            </p>
            <div className="text-xs bg-white/20 rounded-lg px-3 py-2 font-bold font-inter">
              Converts at 4.2% avg.
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
            <h3 className="font-black font-inter mb-2 flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Cash on Delivery (COD)
            </h3>
            <p className="text-sm text-white/80 font-inter mb-3">
              For customers without cards. Most popular in Trinidad. Higher conversion.
            </p>
            <div className="text-xs bg-white/20 rounded-lg px-3 py-2 font-bold font-inter">
              Converts at 5.8% avg.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {paymentMethods.map((method, i) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer ${
              selectedMethods.includes(method.id)
                ? 'border-trini-red shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => toggleMethod(method.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedMethods.includes(method.id)
                    ? 'bg-trini-red text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <method.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black font-inter">{method.name}</h3>
                  {method.recommended && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold font-inter">
                      Recommended
                    </span>
                  )}
                </div>
              </div>
              
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedMethods.includes(method.id)
                  ? 'border-trini-red bg-trini-red'
                  : 'border-gray-300'
              }`}>
                {selectedMethods.includes(method.id) && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 font-inter mb-4">
              {method.description}
            </p>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 font-inter mb-1">Fees</div>
                <div className="text-sm font-bold font-inter">{method.fees}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 font-inter mb-1">Setup Time</div>
                <div className="text-sm font-bold font-inter">{method.setupTime}</div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              {method.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-inter">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Configuration Sections */}
      <AnimatePresence>
        {/* COD Configuration */}
        {selectedMethods.includes('cod') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6"
          >
            <h3 className="text-xl font-black font-inter mb-6 flex items-center gap-2">
              <Banknote className="w-6 h-6 text-trini-red" />
              Cash on Delivery Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold font-inter mb-2">Maximum COD Amount (TTD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={codSettings.maxAmount}
                    onChange={(e) => setCodSettings({...codSettings, maxAmount: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                  />
                </div>
                <p className="text-xs text-gray-500 font-inter mt-1">
                  Orders above this amount require card payment
                </p>
              </div>

              <div>
                <label className="block font-bold font-inter mb-2">Delivery Fee (TTD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={codSettings.deliveryFee}
                    onChange={(e) => setCodSettings({...codSettings, deliveryFee: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block font-bold font-inter mb-3">Delivery Areas</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {trinidadAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() => {
                      setCodSettings({
                        ...codSettings,
                        acceptedAreas: codSettings.acceptedAreas.includes(area)
                          ? codSettings.acceptedAreas.filter(a => a !== area)
                          : [...codSettings.acceptedAreas, area]
                      });
                    }}
                    className={`px-4 py-2 rounded-lg border-2 font-inter font-bold text-sm transition-all ${
                      codSettings.acceptedAreas.includes(area)
                        ? 'border-trini-red bg-red-50 text-trini-red'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold font-inter mb-1 text-blue-900">Partner with TATT or Pgeon</h4>
                  <p className="text-sm text-blue-700 font-inter">
                    We recommend integrating with Trinidad delivery services for automated COD collection and remittance.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Credit Card Configuration */}
        {selectedMethods.includes('credit_card') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6"
          >
            <h3 className="text-xl font-black font-inter mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-trini-red" />
              Credit Card Settings
            </h3>

            <div>
              <label className="block font-bold font-inter mb-3">Select Your Bank</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods[0].providers?.map((provider) => (
                  <button
                    key={provider.value}
                    onClick={() => setCreditCardSettings({...creditCardSettings, provider: provider.value})}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      creditCardSettings.provider === provider.value
                        ? 'border-trini-red bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{provider.logo}</div>
                      <span className="font-bold font-inter">{provider.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold font-inter mb-1 text-yellow-900">Setup Required</h4>
                  <p className="text-sm text-yellow-700 font-inter mb-3">
                    Contact your bank to set up merchant services. They'll provide your API credentials.
                  </p>
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold font-inter hover:bg-yellow-700 transition-colors flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Contact Bank</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bank Transfer Configuration */}
        {selectedMethods.includes('bank_transfer') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6"
          >
            <h3 className="text-xl font-black font-inter mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-trini-red" />
              Bank Transfer Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold font-inter mb-2">Account Name</label>
                <input
                  type="text"
                  value={bankSettings.accountName}
                  onChange={(e) => setBankSettings({...bankSettings, accountName: e.target.value})}
                  placeholder="Your Business Name"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                />
              </div>

              <div>
                <label className="block font-bold font-inter mb-2">Account Number</label>
                <input
                  type="text"
                  value={bankSettings.accountNumber}
                  onChange={(e) => setBankSettings({...bankSettings, accountNumber: e.target.value})}
                  placeholder="123456789"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                />
              </div>

              <div>
                <label className="block font-bold font-inter mb-2">Bank Name</label>
                <select
                  value={bankSettings.bank}
                  onChange={(e) => setBankSettings({...bankSettings, bank: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                >
                  <option value="">Select Bank</option>
                  <option value="firstcitizens">First Citizens Bank</option>
                  <option value="rbc">RBC Royal Bank</option>
                  <option value="republic">Republic Bank</option>
                  <option value="scotiabank">Scotiabank</option>
                </select>
              </div>

              <div>
                <label className="block font-bold font-inter mb-2">Branch Code (Optional)</label>
                <input
                  type="text"
                  value={bankSettings.branchCode}
                  onChange={(e) => setBankSettings({...bankSettings, branchCode: e.target.value})}
                  placeholder="001"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-trini-red outline-none font-inter"
                />
              </div>
            </div>

            <div className="mt-6 bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold font-inter mb-2">How Bank Transfers Work</h4>
              <ol className="space-y-2 text-sm text-gray-700 font-inter">
                <li>1. Customer places order and selects "Bank Transfer"</li>
                <li>2. They receive your bank details automatically</li>
                <li>3. Customer makes transfer and uploads proof</li>
                <li>4. You verify payment and approve order</li>
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center"
      >
        <button
          onClick={handleSave}
          disabled={selectedMethods.length === 0}
          className="bg-gradient-to-r from-trini-red to-red-700 text-white px-12 py-4 rounded-full font-black text-xl font-inter hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3"
        >
          <Shield className="w-6 h-6" />
          <span>Save Payment Settings</span>
        </button>
      </motion.div>
    </div>
  );
}
