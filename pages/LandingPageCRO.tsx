import React, { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight, Check, Star, TrendingUp, Zap, ShoppingCart,
  Lock, Clock, Users, DollarSign, Smartphone, BarChart3,
  MessageCircle, MessageSquare, AlertCircle, ChevronDown,
  Upload, Sparkles, Image as ImageIcon, Tag, ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { ga4Analytics } from '../services/ga4AnalyticsService';
import { facebookPixel } from '../services/facebookPixelService';
import { abTesting } from '../services/abTestingService';
import { WorkingAIDemo } from '../components/WorkingAIDemo';
import { ServicesShowcase } from '../components/ServicesShowcase';

/* ────────────────────────────────────────────────────────────────────────
   SOCIAL PROOF DATA
   ──────────────────────────────────────────────────────────────────────── */

const TICKER_MERCHANTS = [
  { name: 'Roti shops', location: 'Food & drink', avatar: '🍛' },
  { name: 'Boutiques', location: 'Fashion', avatar: '👗' },
  { name: 'Barbers & salons', location: 'Services', avatar: '💈' },
  { name: 'Auto parts', location: 'Automotive', avatar: '🔧' },
  { name: 'Doubles vendors', location: 'Street food', avatar: '🫓' },
  { name: 'Bakeries', location: 'Food & drink', avatar: '🧁' },
  { name: 'Electronics', location: 'Retail', avatar: '📱' },
  { name: 'Beauty supply', location: 'Beauty', avatar: '💄' },
];

const STATS_ROW = [
  { value: '14', label: 'store templates' },
  { value: '5 min', label: 'to launch' },
  { value: '🇹🇹', label: 'built in T&T' },
];

const STORE_SHOWCASE = [
  { name: 'Fashion Boutique', category: 'Fashion & Apparel', location: 'Product grid · variants · lookbook', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
  { name: 'Roti & Food Shop', category: 'Food & Beverage', location: 'Menu · WhatsApp ordering · COD', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80' },
  { name: 'Tech & Gadgets', category: 'Electronics', location: 'Specs · comparisons · warranty', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80' },
  { name: 'Beauty & Cosmetics', category: 'Beauty & Cosmetics', location: 'Shade match · bundles · subscribe', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80' },
  { name: 'Furniture & Home', category: 'Furniture & Home', location: 'Sale pricing · trust badges', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80' },
  { name: 'Auto & Accessories', category: 'Auto Parts', location: 'Part finder · vehicle match', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80' },
];

const TESTIMONIALS_REMOVED = true; // (Removed fabricated reviews — replaced by honest WHY_TRINIBUILD section above.)

/* Robust fade-in: content is visible by default (opacity 1). Animation is
   purely additive — if framer-motion never fires whileInView, the element
   still renders fully visible. initial={false} skips the initial render frame
   so the element starts at its natural (visible) state instead of opacity:0. */
const fadeInUp = {
  initial: false,
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.5 },
};

/* ── Social Proof Ticker (scrolling marquee) ── */
const SocialProofTicker: React.FC = () => (
  <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white overflow-hidden">
    <div className="max-w-7xl mx-auto">
      {/* Stat row */}
      <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mb-8">
        {STATS_ROW.map((s, i) => (
          <motion.div key={i} {...fadeInUp} transition={{ ...fadeInUp.transition, delay: i * 0.1 }} className="text-center">
            <div className="text-2xl sm:text-3xl font-black text-trini-red">{s.value}</div>
            <div className="text-xs sm:text-sm text-gray-400 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Marquee */}
      <div className="relative">
        <p className="text-center text-xs uppercase tracking-widest text-gray-500 mb-4">Built for every kind of T&T business</p>
        <div className="overflow-hidden relative">
          {/* Edge fade */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none" />
          <div className="flex gap-6 animate-[ticker_30s_linear_infinite] w-max">
            {[...TICKER_MERCHANTS, ...TICKER_MERCHANTS].map((m, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 flex-shrink-0">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg flex-shrink-0" aria-hidden>{m.avatar}</span>
                <span className="text-sm font-semibold whitespace-nowrap">
                  {m.name} <span className="text-gray-400 font-normal">· {m.location}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ── Stores Built on TriniBuild showcase ── */
const StoreShowcase: React.FC = () => (
  <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
    <div className="max-w-6xl mx-auto">
      <motion.div {...fadeInUp} className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">What You Can Build</h2>
        <p className="text-lg text-gray-600">Real store designs ready for your business — pick a look and make it yours in minutes.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {STORE_SHOWCASE.map((store, idx) => (
          <motion.div
            key={idx}
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: idx * 0.08 }}
            className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative h-44 overflow-hidden">
              <img src={store.img} alt={store.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider bg-white/90 text-gray-800 px-2 py-1 rounded-full">
                {store.category}
              </span>
              <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider bg-trini-red text-white px-2 py-1 rounded-full">
                Template
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-gray-900 text-lg">{store.name}</h3>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                {store.location}
              </p>
              <a
                href="/templates"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-trini-red hover:underline"
              >
                Preview Template <ExternalLink size={14} />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Why merchants choose us (honest value props — no fabricated reviews) ── */
const WHY_TRINIBUILD = [
  {
    icon: '🇹🇹',
    title: 'Built right here',
    body: 'Made in Trinidad & Tobago for T&T businesses — COD, WhatsApp ordering, and TT$ pricing baked in from day one.',
  },
  {
    icon: '💸',
    title: 'Free to start, no card',
    body: 'Launch a real store on the free plan with no credit card. Test your business before you ever pay a cent.',
  },
  {
    icon: '⚡',
    title: 'Live in about 5 minutes',
    body: 'Pick a template, add your products with the AI lister, and share your store link the same afternoon.',
  },
];

const Testimonials: React.FC = () => (
  <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
    <div className="max-w-5xl mx-auto">
      <motion.div {...fadeInUp} className="text-center mb-14">
        <span className="inline-block text-xs font-black uppercase tracking-widest text-trini-red mb-3">Founding Merchants · First 100</span>
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Be one of our first stores</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          TriniBuild is brand-new and built in T&amp;T. We're looking for founding merchants to grow with — and rewarding them for being first.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {WHY_TRINIBUILD.map((item, idx) => (
          <motion.div
            key={idx}
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: idx * 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col"
          >
            <div className="text-3xl mb-4">{item.icon}</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm flex-1 leading-relaxed">{item.body}</p>
          </motion.div>
        ))}
      </div>

      <motion.div {...fadeInUp} className="text-center mt-10">
        <a href="/create-store" className="inline-flex items-center gap-2 bg-trini-red text-white font-bold px-7 py-3.5 rounded-xl hover:bg-red-700 transition-colors">
          Start My Free Store <ArrowRight size={18} />
        </a>
      </motion.div>
    </div>
  </section>
);

/* ── Founding-merchant banner (honest — no fabricated counts) ── */
const MerchantCounter: React.FC = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-trini-red to-orange-600 text-white">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div {...fadeInUp}>
          <div className="text-4xl sm:text-5xl font-black mb-3">Get in early. 🇹🇹</div>
          <div className="text-xl sm:text-2xl font-bold">Founding merchant spots are open now</div>
          <p className="text-white/85 mt-3 text-sm sm:text-base max-w-xl mx-auto">
            TriniBuild just launched. Be one of the first Trinidad &amp; Tobago businesses to claim a free store — and help shape what we build next.
          </p>
          <a href="/create-store" className="inline-flex items-center gap-2 bg-white text-trini-red font-bold px-7 py-3.5 rounded-xl mt-6 hover:bg-gray-100 transition-colors">
            Claim Your Free Store <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────
   AI PRODUCT LISTER DEMO — split layout, typewriter before→after
   ──────────────────────────────────────────────────────────────────────── */

const TYPEWRITER_DESC =
  'Elegant quartz movement timepiece with a classic stainless steel finish. Perfect for formal occasions or everyday wear. Water-resistant and built to last.';

const ListerDemo: React.FC = () => {
  // Default to the finished state so the listing card is ALWAYS visible even
  // if the inView trigger never fires. The typewriter/count-up is purely an
  // enhancement that replays when scrolled into view.
  const [typed, setTyped] = useState(TYPEWRITER_DESC);
  const [showResult, setShowResult] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.1 });

  useEffect(() => {
    if (!inView) return;
    // Replay the before→after reveal as an enhancement.
    setShowResult(false);
    setTyped('');
    const reveal = setTimeout(() => setShowResult(true), 800);
    return () => clearTimeout(reveal);
  }, [inView]);

  useEffect(() => {
    if (!showResult) return;
    // Only run the typewriter if we reset it above; otherwise keep full text.
    if (typed.length >= TYPEWRITER_DESC.length) return;
    let i = typed.length;
    const id = setInterval(() => {
      i++;
      setTyped(TYPEWRITER_DESC.slice(0, i));
      if (i >= TYPEWRITER_DESC.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [showResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const tags = ['Luxury Watch', 'Quartz', 'Stainless Steel', 'Classic', 'Water Resistant'];

  return (
    <section ref={sectionRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div {...fadeInUp} className="text-center mb-14">
          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">AI Product Lister</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">From Photo to Listing in Seconds</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a product photo. Our AI writes the title, SEO description, and keyword tags automatically.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* LEFT — Upload widget */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <Upload className="w-9 h-9 text-indigo-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Upload Product Photo</h3>
            <p className="text-sm text-gray-500 mb-4">PNG, JPG up to 10MB</p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <ImageIcon size={14} /> Or drag & drop
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600">
              <Sparkles size={16} /> AI is ready
            </div>
          </motion.div>

          {/* RIGHT — Before → After result */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Raw watch photo (before) */}
            <div className={`absolute inset-0 transition-opacity duration-500 ${showResult ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                alt="Raw watch"
                loading="lazy"
                className="w-full h-72 object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
                <div className="flex items-center gap-2 text-white font-bold animate-pulse">
                  <Sparkles size={20} /> Analyzing photo...
                </div>
              </div>
            </div>

            {/* Finished listing card (after) */}
            <div className={`bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden transition-all duration-500 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                alt="Premium Quartz Timepiece"
                loading="lazy"
                className="w-full h-44 object-cover"
              />
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-gray-900 text-lg">Premium Quartz Timepiece — Classic Edition</h3>
                </div>
                <div className="text-2xl font-bold text-trini-red mb-3">TT$1,299</div>
                <p className="text-sm text-gray-600 mb-4 min-h-[60px]">
                  {typed}
                  {typed.length < TYPEWRITER_DESC.length && <span className="animate-pulse">|</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                      <Tag size={11} /> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};


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
        {/* SOCIAL PROOF TICKER — right below hero */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <SocialProofTicker />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* AI PRODUCT LISTER DEMO — split layout, typewriter before→after */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <ListerDemo />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* LIVE AI DEMO — answers "does this actually work?" in under 6 sec */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <WorkingAIDemo />

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
        {/* STORES BUILT ON TRINIBUILD — showcase grid */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <StoreShowcase />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TESTIMONIALS — 3-col card grid */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <Testimonials />

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ANIMATED MERCHANT COUNTER — counts up on scroll into view */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <MerchantCounter />

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
        {/* SERVICES SHOWCASE - cross-link all 7 service landings              */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <ServicesShowcase />

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
