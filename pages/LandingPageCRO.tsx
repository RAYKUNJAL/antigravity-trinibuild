import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight, Check, Star, TrendingUp, Zap, ShoppingCart,
  Lock, Clock, Users, DollarSign, Smartphone, BarChart3,
  MessageCircle, MessageSquare, AlertCircle, ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ga4Analytics } from '../services/ga4AnalyticsService';
import { facebookPixel } from '../services/facebookPixelService';
import { abTesting } from '../services/abTestingService';

/**
 * LandingPageCRO.tsx
 * 
 * STRATEGY:
 * - Cold traffic landing page (not existing users)
 * - Single conversion goal: "Start My Free Store"
 * - Hero-focused COD merchant messaging
 * - Proof-based copy (testimonials, numbers, walkthroughs)
 * - Minimal distraction (no marketplace/jobs/rides on this page)
 * - Mobile-first (60% of traffic)
 * - SEO-optimized for T&T merchant keywords
 * - Revenue-focused UX (funnels to TT$99-399/mo plans)
 */

const TRUST_POINTS = [
  { number: 'Free', label: 'Forever, not a trial' },
  { number: '0', label: 'Credit card required' },
  { number: '2 min', label: 'From signup to live store' },
  { number: '🇹🇹', label: 'Built in Trinidad' }
];

const FOUNDING_OFFER = {
  title: 'We\'re just getting started — and the first 100 merchants get something special',
  bullet_points: [
    'Free Pro plan for 6 months (a TT$1,194 value — unlimited products, AI listing tool, advanced analytics)',
    'Direct WhatsApp line to the founding team — you get heard, fast',
    'Featured placement on the TriniBuild marketplace when it launches',
    'Your feedback shapes what we build next'
  ],
  caveat: 'Why the offer? We\'re a brand-new Trinidad-built platform. We want founding merchants who help us get it right, and we want to reward them for being first.'
};

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Create Your Free Store',
    description: 'Your business name, add a photo, choose your products. Done in 5 minutes. No credit card needed.',
    icon: '🏪'
  },
  {
    step: '2',
    title: 'Add Your Products (Fast)',
    description: 'Upload photos or use AI to create listings instantly. Works even if you have no barcodes or inventory system.',
    icon: '📸'
  },
  {
    step: '3',
    title: 'Customers Order via COD',
    description: 'They place an order, confirm pickup or delivery. You get a WhatsApp notification immediately.',
    icon: '📱'
  },
  {
    step: '4',
    title: 'Collect Cash, Grow Your Business',
    description: 'Customer pays cash on delivery, you confirm the order complete. Track everything in your dashboard.',
    icon: '💰'
  }
];

const COD_EXPLAINED = [
  {
    title: 'Order Placed',
    description: 'Customer chooses your products and picks COD at checkout.'
  },
  {
    title: 'You Get Notified',
    description: 'Instant WhatsApp or SMS alert with customer details and delivery address.'
  },
  {
    title: 'Confirm & Deliver',
    description: 'Arrange your own delivery or use TriniRides (TT$25 + TT$4/km). Driver collects cash.'
  },
  {
    title: 'Order Complete',
    description: 'Customer has product, you have cash. Mark order delivered in your dashboard. Money is yours.'
  }
];

const FEATURES = [
  {
    title: 'Free Online Store',
    description: 'Professional storefront that loads fast. Mobile-friendly. Looks like you spent money building it.',
    icon: <ShoppingCart className="w-6 h-6" />
  },
  {
    title: '10 Free Products',
    description: 'List 10 items free forever. Test your business before upgrading. Upgrade anytime.'
  },
  {
    title: 'COD Checkout',
    description: 'Cash on delivery, pickup, or online payment. Choose what works for your business.'
  },
  {
    title: 'AI Product Lister',
    description: 'Take a photo. AI writes the description, picks keywords, prices it. 30 seconds per product.'
  },
  {
    title: 'Order Dashboard',
    description: 'See all orders, delivery status, customer contact info. Everything in one place.'
  },
  {
    title: 'VAT Tracker',
    description: 'Track 12.5% VAT automatically. Generate reports for BIR. Stay organized for taxes.'
  },
  {
    title: 'Delivery Options',
    description: 'Arrange your own delivery. Use TriniRides. Or let customers pick it up.'
  },
  {
    title: 'WhatsApp Ready',
    description: 'Get order notifications on WhatsApp. Confirm deliveries on WhatsApp. No app needed.'
  }
];

const PRICING_TIERS = [
  {
    name: 'Hustle (Free)',
    price: 'TT$0',
    period: 'forever',
    description: 'Perfect for testing',
    features: [
      '10 products',
      'Free storefront',
      'COD checkout',
      'Order dashboard',
      'WhatsApp notifications'
    ],
    cta: 'Start Free',
    highlighted: false
  },
  {
    name: 'Pro',
    price: 'TT$199',
    period: '/month',
    description: 'Most popular for growing stores',
    features: [
      'Unlimited products',
      'Everything in Hustle',
      'AI product lister',
      'Advanced analytics',
      'Priority support',
      'Featured in directory'
    ],
    cta: 'Upgrade to Pro',
    highlighted: true
  },
  {
    name: 'Business',
    price: 'TT$399',
    period: '/month',
    description: 'For serious online sellers',
    features: [
      'Everything in Pro',
      'Advanced delivery management',
      'Custom branding',
      'API access',
      'Dedicated support',
      'Multi-store management'
    ],
    cta: 'Go Business',
    highlighted: false
  }
];

const OBJECTION_HANDLERS = [
  {
    question: 'Do I need a bank account or credit card?',
    answer: 'No. You collect cash on delivery. No account required. No payment processing fees. Money is yours instantly.',
    icon: '❌'
  },
  {
    question: 'What if a customer doesn\'t answer when delivery arrives?',
    answer: 'You control what happens. You can refuse the order, reschedule, or let the driver handle it. We\'ll show you how in setup.',
    icon: '🤝'
  },
  {
    question: 'Can I start selling if I have no inventory system?',
    answer: 'Yes. Use our AI lister to create descriptions from photos. Or list products manually. No barcodes needed.',
    icon: '✅'
  },
  {
    question: 'How do I know customers will trust me?',
    answer: 'Verified seller badge, reviews system, and business verification. We also show your phone number so customers can call you.',
    icon: '⭐'
  },
  {
    question: 'What if I only want to do WhatsApp selling?',
    answer: 'Share your store link on WhatsApp. Customers order there, you confirm, delivery happens, cash collected. Simple as that.',
    icon: '💬'
  }
];

export const LandingPageCRO: React.FC = () => {
  const navigate = useNavigate();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [variant, setVariant] = useState('control');

  // Initialize analytics and tracking
  useEffect(() => {
    // Get user's A/B test variant
    const userVariant = abTesting.getUserVariant();
    setVariant(userVariant);

    // Track page view
    ga4Analytics.trackPageView(userVariant);
    facebookPixel.trackPageView();

    // Track scroll depth
    let maxScroll = 0;
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (maxScroll % 25 === 0) {
          ga4Analytics.trackScrollDepth(Math.round(maxScroll));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartFree = (source: string = 'hero') => {
    // Track signup start
    ga4Analytics.trackSignupStart('Start My Free Store', source);
    facebookPixel.trackSignupStart(source);

    // Navigate to store creator
    navigate('/create-store');
  };

  const handleEmailCTA = () => {
    if (emailInput) {
      ga4Analytics.trackFormComplete('email_cta_form', true);
      facebookPixel.trackCustom('LeadCapture', { email: emailInput });
      navigate('/create-store');
    }
  };

  return (
    <>
      <Helmet>
        {/* SEO Title & Description (Cold Traffic) */}
        <title>Free Online Store for Trinidad & Tobago | COD Selling Made Easy | TriniBuild</title>
        <meta
          name="description"
          content="Start selling online in Trinidad & Tobago with cash on delivery. Free store, 10 free products, no credit card required. Built in T&T."
        />
        <meta
          name="keywords"
          content="online store Trinidad, sell online T&T, cash on delivery Trinidad, free store builder, Trinidad business, Tobago online selling, TriniBuild, SME platform"
        />
        <link rel="canonical" href="https://trinibuild.com/landing" />

        {/* Open Graph for Social Sharing */}
        <meta property="og:title" content="Free Online Store for Trinidad & Tobago - Start Selling with COD" />
        <meta
          property="og:description"
          content="Launching in T&T: a free online store builder with COD checkout. No credit card, 10 products free. Founding merchants get 6 months Pro free."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://trinibuild.com/landing" />
        <meta property="og:image" content="https://trinibuild.com/og-landing.jpg" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Online Store for Trinidad - COD Selling" />
        <meta name="twitter:description" content="Start your online store free. No credit card, no tech skills needed. Built for Trinidad merchants." />

        {/* Schema - SoftwareApplication (no fake aggregateRating — FTC/Google penalty risk) */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'TriniBuild',
            description: 'Free online store builder for Trinidad & Tobago businesses with cash on delivery support',
            url: 'https://trinibuild.com/',
            applicationCategory: 'ECommerce',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'TTD',
              description: 'Free online store with 10 products'
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-white font-sans">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* HERO - PRIMARY CONVERSION ZONE */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-trini-red/10 rounded-full blur-3xl -z-0"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-trini-red/5 rounded-full blur-3xl -z-0"></div>

          <div className="relative z-10 max-w-4xl mx-auto">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-6"
            >
              <span className="inline-block px-4 py-2 bg-trini-red/20 border border-trini-red/40 rounded-full text-sm font-semibold text-trini-red">
                🇹🇹 Built for Trinidad & Tobago Businesses
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6"
            >
              Sell Online with{' '}
              <span className="bg-gradient-to-r from-trini-red to-orange-500 bg-clip-text text-transparent">
                Cash on Delivery
              </span>
              {' — No Credit Card'}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed"
            >
              Create your free online store in 5 minutes. Add products with AI. Accept COD, pickup, or online payment.
              Built in Trinidad & Tobago, launching to founding merchants now.
            </motion.p>

            {/* Trust Strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 justify-center mb-10 text-sm text-gray-300"
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Free lifetime store
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                10 free listings
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                No credit card needed
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Setup in 5 minutes
              </span>
            </motion.div>

            {/* Primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
            >
              <button
                onClick={handleStartFree}
                className="px-8 py-4 bg-trini-red hover:bg-red-700 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
              >
                Start My Free Store
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setExpandedFAQ(0)}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300"
              >
                See How It Works
              </button>
            </motion.div>

            {/* Secondary CTA - Email */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-center text-sm text-gray-400"
            >
              <p>No spam. No hidden fees. Free forever plan available.</p>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PROOF SECTION - Honest framing (no fake stats, no fake testimonials) */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                No gotchas. No credit card. No risk.
              </h2>
              <p className="text-lg text-gray-600">
                Made for Trinidad merchants who want to get online without paying to find out if it works for them.
              </p>
            </div>

            {/* Trust points grid (risk reversals, not fake stats) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {TRUST_POINTS.map((point, idx) => (
                <div key={idx} className="bg-white rounded-lg p-6 text-center shadow-sm">
                  <div className="text-3xl sm:text-4xl font-bold text-trini-red mb-2">{point.number}</div>
                  <div className="text-sm text-gray-600">{point.label}</div>
                </div>
              ))}
            </div>

            {/* Founding merchant offer */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-8 sm:p-10">
              <div className="inline-block px-3 py-1 bg-trini-red/20 text-trini-red rounded-full text-xs font-bold tracking-wide uppercase mb-4">
                Founding Merchants · Limited to first 100
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">{FOUNDING_OFFER.title}</h3>
              <ul className="space-y-3 mb-6">
                {FOUNDING_OFFER.bullet_points.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-trini-red text-xl leading-none mt-0.5">✓</span>
                    <span className="text-gray-200">{b}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-400 italic border-t border-gray-700 pt-4">
                {FOUNDING_OFFER.caveat}
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* HOW IT WORKS - Clear Workflow */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                How TriniBuild Works for Your Business
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Four simple steps from store creation to your first sale.
              </p>
            </div>

            {/* 4-Step Flow */}
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              {HOW_IT_WORKS.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Connector Line */}
                  {idx < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-full w-6 h-0.5 bg-trini-red/20"></div>
                  )}

                  {/* Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 border border-gray-200 h-full">
                    <div className="text-5xl mb-4">{item.icon}</div>
                    <div className="text-2xl font-bold text-trini-red mb-2">Step {item.step}</div>
                    <h3 className="font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* COD Explained */}
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                How Cash on Delivery Actually Works
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {COD_EXPLAINED.map((step, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="w-10 h-10 bg-trini-red text-white rounded-full flex items-center justify-center font-bold mb-4">
                      {idx + 1}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{step.title}</h4>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* FEATURES - What You Get */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Run a Simple Online Store
              </h2>
              <p className="text-lg text-gray-600">
                No complicated setup. No expensive software. Just the tools that matter for T&T businesses.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  {feature.icon && <div className="text-3xl mb-3">{feature.icon}</div>}
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PRICING - Revenue Driver */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Simple Pricing. No Surprises.
              </h2>
              <p className="text-lg text-gray-600">
                Start free forever. Upgrade anytime to unlock unlimited products and advanced tools.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {PRICING_TIERS.map((tier, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg overflow-hidden transition-all duration-300 ${
                    tier.highlighted
                      ? 'ring-2 ring-trini-red shadow-xl transform scale-105 md:scale-110'
                      : 'border border-gray-200 shadow-sm'
                  } bg-white`}
                >
                  {tier.highlighted && (
                    <div className="bg-trini-red text-white text-center py-2 font-bold text-sm">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <p className="text-sm text-gray-600 mb-6">{tier.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                      <span className="text-gray-600 ml-2">{tier.period}</span>
                    </div>
                    <button
                      onClick={handleStartFree}
                      className={`w-full py-3 rounded-lg font-bold transition-all duration-300 mb-8 ${
                        tier.highlighted
                          ? 'bg-trini-red hover:bg-red-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      {tier.cta}
                    </button>
                    <ul className="space-y-3">
                      {tier.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-start gap-3 text-sm text-gray-700">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12 text-gray-600">
              <p className="mb-2">
                All plans include free store, COD checkout, order dashboard, and WhatsApp notifications.
              </p>
              <p className="text-sm">
                No setup fees. No hidden charges. Cancel anytime.
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* OBJECTION HANDLERS - FAQ */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Common Questions from Trinidad Merchants
              </h2>
              <p className="text-lg text-gray-600">
                We answer the stuff that actually matters when you're deciding to go online.
              </p>
            </div>

            <div className="space-y-4">
              {OBJECTION_HANDLERS.map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-4 text-left">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-semibold text-gray-900">{item.question}</span>
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-600 transition-transform ${
                        expandedFAQ === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedFAQ === idx && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-gray-700">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* FINAL CTA - Urgency */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Ready to Start Selling Online?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Your first 10 free listings are waiting. No credit card, no risk, no obligation.
              Start your free store right now.
            </p>
            <button
              onClick={handleStartFree}
              className="px-10 py-5 bg-trini-red hover:bg-red-700 text-white font-bold rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Create My Free Store Now
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </button>
            <p className="mt-6 text-sm text-gray-400">
              Takes 5 minutes. No spam. Free forever plan available.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* FOOTER CTA - Safety Net */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Still not sure? Let's chat.
              </h3>
              <p className="text-gray-600 mb-6">
                Questions about COD, setup, delivery, or anything else? Our team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/1868-YOUR-NUMBER?text=I%20have%20questions%20about%20TriniBuild"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat on WhatsApp
                </a>
                <button
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default LandingPageCRO;
