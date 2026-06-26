/**
 * PricingPage.tsx — Free for Life + PayPal + Bank Pay
 * Shows all plans, handles bank payment reference generation,
 * proof upload, and PayPal integration
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Shield, Zap, Crown, Building2, Upload,
  Copy, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  CreditCard, Banknote, Star
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { subscriptionService, BANK_ACCOUNTS, BankPaymentDetails } from '../services/subscriptionService';

const PLAN_ICONS: Record<string, React.ElementType> = { free: Shield, pro: Zap, premium: Crown };
const PLAN_COLORS: Record<string, string> = { free: '#6B7280', pro: '#E61E2B', premium: '#B8860B' };

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [plans, setPlans] = useState<any[]>([]);
  const [billingMonths, setBillingMonths] = useState(1);
  const [showBankPay, setShowBankPay] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState(BANK_ACCOUNTS[0].bank);
  const [bankDetails, setBankDetails] = useState<BankPaymentDetails | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionService.getPlans().then(setPlans).finally(() => setLoading(false));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        subscriptionService.getUserPlan(user.id).then(({ plan }) => {
          if (plan) setCurrentPlan(plan.slug);
        });
      }
    });
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2500);
  };

  const startBankPay = async (plan_slug: string) => {
    if (!user) { window.location.href = '/login'; return; }
    setShowBankPay(plan_slug);
    const details = await subscriptionService.createBankPaymentRequest(user.id, plan_slug, billingMonths, selectedBank);
    setBankDetails(details);
  };

  const uploadProof = async () => {
    if (!proofFile || !bankDetails) return;
    setUploading(true);
    try {
      const { data: upload } = await supabase.storage.from('bank-transfer-proofs')
        .upload(`subscriptions/${user.id}/${bankDetails.reference_code}.${proofFile.name.split('.').pop()}`, proofFile);
      if (upload) {
        const { data: url } = supabase.storage.from('bank-transfer-proofs').getPublicUrl(upload.path);
        await subscriptionService.submitBankPaymentProof(bankDetails.reference_code, url.publicUrl, selectedBank);
        setUploadDone(true);
      }
    } finally { setUploading(false); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400">Loading plans...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Star className="w-4 h-4" />
            Free for Life — No Credit Card Ever
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Start Free.<br />Upgrade When You're Ready.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
            Your TriniBuild store is free forever. Pay your subscription at any T&T bank — no credit card required.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            {[1, 3, 6, 12].map(m => (
              <button
                key={m}
                onClick={() => setBillingMonths(m)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  billingMonths === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 1 ? 'Monthly' : m === 12 ? 'Yearly' : `${m} Months`}
                {m >= 6 && <span className="ml-1 text-xs text-green-600 font-bold">{m === 6 ? '5%' : '10%'} off</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const Icon = PLAN_ICONS[plan.slug] || Shield;
            const color = PLAN_COLORS[plan.slug];
            const isCurrent = currentPlan === plan.slug;
            const isPro = plan.slug === 'pro';
            const discount = billingMonths === 12 ? 0.90 : billingMonths === 6 ? 0.95 : 1;
            const monthly_price = plan.price_ttd * discount;
            const total_price = monthly_price * billingMonths;
            const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]');

            return (
              <motion.div
                key={plan.slug}
                whileHover={{ y: -2 }}
                className={`bg-white rounded-2xl border-2 overflow-hidden ${
                  isPro ? 'border-red-500 shadow-lg shadow-red-100' : 'border-gray-200'
                }`}
              >
                {isPro && (
                  <div className="bg-red-600 text-white text-xs font-bold text-center py-2 tracking-wider">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      {plan.is_free_for_life && <span className="text-xs text-green-600 font-semibold">Free for Life ♾️</span>}
                    </div>
                  </div>

                  <div className="mb-6">
                    {plan.price_ttd === 0 ? (
                      <div><span className="text-4xl font-black text-gray-900">TT$0</span><span className="text-gray-500 ml-2">forever</span></div>
                    ) : (
                      <div>
                        <span className="text-4xl font-black text-gray-900">TT${Math.round(monthly_price)}</span>
                        <span className="text-gray-500">/month</span>
                        <span className="ml-2 text-xs text-gray-400">(≈ USD${plan.slug === 'pro' ? '44' : '88'}/mo)</span>
                        {billingMonths > 1 && (
                          <p className="text-sm text-gray-500 mt-1">TT${Math.round(total_price)} total for {billingMonths} months</p>
                        )}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold text-center">
                      Current Plan ✓
                    </div>
                  ) : plan.price_ttd === 0 ? (
                    <a href="/signup" className="block w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold text-center hover:bg-gray-800 transition-colors">
                      Get Started Free →
                    </a>
                  ) : (
                    <div className="space-y-2">
                      {/* PayPal button */}
                      <a
                        href={`https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${plan.slug === 'pro' ? import.meta.env.VITE_PAYPAL_PLAN_PRO : import.meta.env.VITE_PAYPAL_PLAN_PREMIUM}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-semibold transition-colors"
                        style={{ backgroundColor: color }}
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay with PayPal / Card
                      </a>
                      {/* Bank Pay button */}
                      <button
                        onClick={() => startBankPay(plan.slug)}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        Pay at the Bank
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bank Pay Flow */}
        <AnimatePresence>
          {showBankPay && bankDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl border-2 border-blue-200 overflow-hidden"
            >
              <div className="bg-blue-600 text-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6" />
                    <div>
                      <h2 className="font-bold text-lg">Pay at the Bank</h2>
                      <p className="text-blue-200 text-sm">Visit any branch — no credit card needed</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowBankPay(null); setBankDetails(null); setUploadDone(false); }}
                    className="text-blue-200 hover:text-white">✕</button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {!uploadDone ? (
                  <>
                    {/* Step 1: Bank Selection */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                        Choose Your Bank
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {BANK_ACCOUNTS.map(b => (
                          <button
                            key={b.bank}
                            onClick={() => { setSelectedBank(b.bank); startBankPay(showBankPay); }}
                            className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                              selectedBank === b.bank ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <p className="font-semibold">{b.bank}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{b.branch}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Payment Details */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                        Make the Deposit
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        {[
                          { label: 'Account Name', value: bankDetails.account_name },
                          { label: 'Account Number', value: bankDetails.account_number },
                          { label: 'Bank', value: bankDetails.bank_name },
                          { label: 'Branch', value: bankDetails.branch },
                          { label: 'Amount (TTD)', value: `TT$${bankDetails.amount_ttd.toFixed(2)}` },
                          { label: '⚠️ Reference Code', value: bankDetails.reference_code, highlight: true },
                        ].map(row => (
                          <div key={row.label} className={`flex justify-between items-center py-2 ${row.highlight ? 'bg-yellow-50 px-3 rounded-lg' : 'border-b border-gray-200'}`}>
                            <span className={`text-sm ${row.highlight ? 'font-bold text-yellow-700' : 'text-gray-500'}`}>{row.label}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${row.highlight ? 'text-yellow-800 font-mono text-base' : 'text-gray-900'}`}>{row.value}</span>
                              <button
                                onClick={() => copyToClipboard(row.value, row.label)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {copied === row.label ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-red-600 mt-2 font-medium">
                        ⚠️ IMPORTANT: Always include the Reference Code when making your deposit. This is how we identify your payment.
                      </p>
                    </div>

                    {/* Step 3: Upload Proof */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                        Upload Your Receipt
                      </h3>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">{proofFile ? proofFile.name : 'Upload bank receipt or teller slip'}</span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG or PDF (max 5MB)</span>
                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setProofFile(e.target.files?.[0] || null)} />
                      </label>
                      {proofFile && (
                        <button
                          disabled={uploading}
                          onClick={uploadProof}
                          className="mt-3 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {uploading ? 'Uploading...' : 'Submit Proof of Payment'}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Submitted! 🎉</h3>
                    <p className="text-gray-500 mb-4">We'll verify your payment within 1-2 business days and activate your plan.</p>
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-1">
                      <p><span className="font-semibold">Reference:</span> {bankDetails.reference_code}</p>
                      <p><span className="font-semibold">Plan:</span> {bankDetails.plan_name}</p>
                      <p><span className="font-semibold">Amount:</span> TT${bankDetails.amount_ttd.toFixed(2)}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Questions? WhatsApp us: +1 (868) 123-4567</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature comparison */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Everything included in every plan</h2>
          </div>
          <div className="p-6 grid md:grid-cols-3 gap-6">
            {[
              { title: 'Free Forever Basics', items: ['Create your online store', 'List up to 10 products', 'Cash on Delivery checkout', 'WhatsApp order sharing', 'Basic order dashboard', 'SSL security'] },
              { title: 'Pro Power Features', items: ['Unlimited products', 'AI product listing tool', 'AI document generator', 'QR pickup reservations', 'VAT tax tracker', 'Email marketing'] },
              { title: 'Premium Business', items: ['10 stores on one account', 'Custom domain support', 'White-label option', 'API access', 'Dedicated support', 'Priority COD processing'] },
            ].map(section => (
              <div key={section.title}>
                <p className="font-semibold text-gray-700 mb-3 text-sm">{section.title}</p>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Questions</h2>
            <div className="space-y-3">
              {[
                { q: 'Is the Free plan really free forever?', a: 'Yes. Your TriniBuild store is free for life. Create your store, list 10 products, and accept COD payments at zero cost, forever.' },
                { q: 'How does paying at the bank work?', a: 'Choose a plan, select your bank, get the account details and a unique Reference Code. Go to any branch and make the deposit. Upload your receipt, and we\'ll activate your plan within 1-2 business days.' },
                { q: 'Which banks accept TriniBuild payments?', a: 'Republic Bank, First Citizens Bank, Scotiabank T&T, and RBC Royal Bank. More banks coming soon.' },
                { q: 'Can I pay cash at the bank?', a: 'Yes. Take cash to any teller, give them the account details and Reference Code. Get a receipt and upload it to us.' },
                { q: 'What if I can\'t pay online?', a: 'No problem — that\'s exactly what the Bank Pay option is for. Walk into any T&T bank branch and pay over the counter.' },
              ].map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left">
        <span className="font-medium text-gray-900 text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <p className="px-4 pb-4 text-sm text-gray-600">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
