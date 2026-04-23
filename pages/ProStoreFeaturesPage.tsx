import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Users, BarChart3, Mail, Smartphone, Lock, 
  Globe, Infinity, ShoppingBag, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProStoreFeaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const tiers = [
    {
      name: 'Hustler',
      price: { monthly: 'Free', yearly: 'Free' },
      description: 'Perfect for testing the platform',
      features: [
        'Up to 10 products',
        'Basic store customization',
        'Cash on Delivery (COD)',
        'Basic analytics',
        'Email support (24-48h)',
        'Mobile responsive'
      ],
      cta: 'Get Started',
      highlighted: false,
      icon: ShoppingBag
    },
    {
      name: 'Pro',
      price: { monthly: 'TT$199', yearly: 'TT$1,990' },
      description: 'Most popular for growing merchants',
      features: [
        'Unlimited products',
        'Advanced store customization',
        'COD + Bank Transfer + Card payments',
        'AI Product Lister',
        'Email marketing (up to 1,000 subscribers)',
        'Advanced analytics & reports',
        'Custom domain',
        'Priority email support (4-8h)',
        'Social media integration',
        'Inventory management'
      ],
      cta: 'Upgrade to Pro',
      highlighted: true,
      icon: Zap
    },
    {
      name: 'Business',
      price: { monthly: 'TT$399', yearly: 'TT$3,990' },
      description: 'For established, high-volume sellers',
      features: [
        'Everything in Pro',
        'Unlimited email campaigns',
        'Multi-user accounts',
        'API access',
        'Custom integrations',
        'Advanced fraud protection',
        'Video hosting & streaming',
        'WhatsApp Business integration',
        'Dedicated account manager',
        'Priority support (1-2h)',
        'Tax reporting dashboard',
        'Affiliate program access'
      ],
      cta: 'Upgrade to Business',
      highlighted: false,
      icon: Globe
    }
  ];

  const premium_features = [
    {
      icon: Mail,
      title: 'Email Marketing Suite',
      description: 'Professional email campaigns with automation, templates, and detailed analytics',
      details: ['Unlimited campaigns', 'Auto-responders', 'Segmentation', 'A/B testing']
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Deep insights into sales, customer behavior, and product performance',
      details: ['Real-time dashboards', 'Cohort analysis', 'Revenue forecasting', 'Customer lifetime value']
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Build relationships with comprehensive customer data and tools',
      details: ['Customer profiles', 'Purchase history', 'Loyalty programs', 'Segmentation']
    },
    {
      icon: Smartphone,
      title: 'Mobile App Ready',
      description: 'Your store optimized for mobile devices with app-like experience',
      details: ['PWA support', 'One-click checkout', 'Push notifications', 'Offline mode']
    },
    {
      icon: Lock,
      title: 'Enterprise Security',
      description: 'Bank-level security and compliance for merchant and customer data',
      details: ['SSL encryption', 'PCI compliance', 'DDoS protection', 'Regular audits']
    },
    {
      icon: Infinity,
      title: 'Unlimited Scalability',
      description: 'Grow from 10 to 100,000 products without performance concerns',
      details: ['Auto-scaling', 'CDN delivery', 'Unlimited bandwidth', '99.9% uptime SLA']
    }
  ];

  const comparison = [
    { feature: 'Products', hustler: '10', pro: 'Unlimited', business: 'Unlimited' },
    { feature: 'Payment Methods', hustler: 'COD only', pro: 'COD + 3 methods', business: 'All methods' },
    { feature: 'Email Campaigns', hustler: 'Manual only', pro: 'Up to 1,000', business: 'Unlimited' },
    { feature: 'Users', hustler: '1', pro: '1', business: 'Unlimited' },
    { feature: 'API Access', hustler: '❌', pro: '❌', business: '✅' },
    { feature: 'Support', hustler: 'Email (24-48h)', pro: 'Email (4-8h)', business: 'Phone + dedicated' },
    { feature: 'Custom Domain', hustler: '❌', pro: '✅', business: '✅' },
    { feature: 'Video Hosting', hustler: '❌', pro: '❌', business: '✅' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#E61E2B] to-red-700 text-white"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 variants={item} className="text-5xl font-black mb-6">
            Grow Your Store with Pro Features
          </motion.h1>
          <motion.p variants={item} className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Unlock powerful tools to scale your business, from AI product listing to advanced analytics
          </motion.p>
          <motion.button
            variants={item}
            onClick={() => navigate('/create-store')}
            className="bg-white text-[#E61E2B] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            Start Your Free Store
          </motion.button>
        </div>
      </motion.section>

      {/* Pricing Tiers */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-4xl font-black text-center mb-4">
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p variants={item} className="text-center text-gray-600 mb-12">
            Choose the plan that fits your business
          </motion.p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-gray-200 rounded-lg p-1">
              {['monthly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setBillingPeriod(period as any)}
                  className={`px-6 py-2 rounded font-bold transition ${
                    billingPeriod === period
                      ? 'bg-[#E61E2B] text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {period === 'monthly' ? 'Monthly' : 'Yearly (Save 17%)'}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier, idx) => {
              const TierIcon = tier.icon;
              return (
                <motion.div
                  key={idx}
                  variants={item}
                  className={`rounded-lg p-8 transition-all ${
                    tier.highlighted
                      ? 'bg-gray-900 text-white border-2 border-[#E61E2B] shadow-xl scale-105'
                      : 'bg-white border-2 border-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <TierIcon className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">{tier.name}</h3>
                  </div>
                  <p className={tier.highlighted ? 'text-gray-300' : 'text-gray-600'}>
                    {tier.description}
                  </p>
                  <p className="text-4xl font-black my-6">
                    {billingPeriod === 'monthly' ? tier.price.monthly : tier.price.yearly}
                    {billingPeriod === 'monthly' && tier.price.monthly !== 'Free' && (
                      <span className="text-lg text-opacity-75">/mo</span>
                    )}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/create-store')}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      tier.highlighted
                        ? 'bg-[#E61E2B] text-white hover:bg-red-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {tier.cta}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Premium Features */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-4xl font-black text-center mb-16">
            What's Included in Pro & Business
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {premium_features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={idx} 
                  variants={item}
                  className="bg-white rounded-lg p-6 border border-gray-200"
                >
                  <Icon className="w-8 h-8 text-[#E61E2B] mb-4" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E61E2B]"></span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Comparison Table */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-4xl font-black text-center mb-12">
            Feature Comparison
          </motion.h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-4 px-6 font-bold">Feature</th>
                  <th className="text-center py-4 px-6 font-bold">Hustler</th>
                  <th className="text-center py-4 px-6 font-bold text-[#E61E2B]">Pro</th>
                  <th className="text-center py-4 px-6 font-bold">Business</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold">{row.feature}</td>
                    <td className="text-center py-4 px-6 text-gray-600">{row.hustler}</td>
                    <td className="text-center py-4 px-6 text-[#E61E2B] font-bold">{row.pro}</td>
                    <td className="text-center py-4 px-6 text-gray-600">{row.business}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.section>

      {/* FAQ & CTA */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#E61E2B] to-red-700 text-white"
        variants={item}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">Ready to Level Up?</h2>
          <p className="text-xl text-red-100 mb-8">
            Start with our free plan and upgrade whenever you're ready. No hidden fees, cancel anytime.
          </p>
          <button
            onClick={() => navigate('/create-store')}
            className="bg-white text-[#E61E2B] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            Create Your Free Store Today
          </button>
          <p className="text-red-100 mt-4">First 10 listings free • No credit card required</p>
        </div>
      </motion.section>
    </div>
  );
};
