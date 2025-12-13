import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, HelpCircle, CreditCard, Zap, Heart, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [processing, setProcessing] = React.useState<string | null>(null);

  const handleSelectPlan = async (planName: string) => {
    if (planName === 'The Hustle') {
      await authService.updateSubscription('The Hustle');
      localStorage.removeItem('trinibuild_subscription');
      navigate('/create-store');
    } else {
      setProcessing(planName);

      // Simulate Payment Processing Delay
      setTimeout(async () => {
        const success = await authService.updateSubscription(planName);
        setProcessing(null);

        if (success) {
          localStorage.setItem('trinibuild_subscription', planName);
          alert(`Successfully upgraded to ${planName}!`);
          navigate('/dashboard');
        } else {
          alert("Upgrade failed. Please try again or contact support.");
        }
      }, 2000);
    }
  };

  const tiers = [
    {
      name: 'The Hustle',
      price: '0',
      desc: 'Start Tonight. Risk Free.',
      fee: '5%',
      features: [
        '1 TriniBuild Storefront',
        '15 Listings',
        'TriniBuild Go Delivery Access',
        'Basic SEO & Analytics',
        'In-app Messaging',
        'Auto Income Dashboard'
      ],
      cta: 'Start Free',
      popular: false,
      color: 'border-gray-200 border-t-4 border-t-gray-400'
    },
    {
      name: 'The Storefront',
      price: '100',
      desc: 'Your Brand. Your Rules.',
      fee: '0%',
      features: [
        '50 Listings',
        'Custom Domain (.com)',
        'No TriniBuild Branding',
        'Full Theme Customization',
        'Abandoned Cart Emails',
        'Email Capture Popups'
      ],
      cta: 'Go Professional',
      popular: true,
      color: 'border-blue-500 border-t-4 border-t-blue-500 ring-1 ring-blue-500 ring-opacity-50'
    },
    {
      name: 'The Growth',
      price: '200',
      desc: 'Business on Autopilot.',
      fee: '0%',
      features: [
        'Unlimited Listings',
        'WhatsApp Order Alerts',
        'Advanced Analytics',
        'Discount Codes & Coupons',
        'AI SEO Optimizer',
        'Social Media Automation'
      ],
      cta: 'Scale Up',
      popular: false,
      color: 'border-purple-500 border-t-4 border-t-purple-500'
    },
    {
      name: 'The Empire',
      price: '400',
      desc: 'The VIP Treatment.',
      fee: '0%',
      features: [
        'Unlimited Everything',
        'Staff Accounts',
        'POS Mode (Physical Shop)',
        'Priority Support',
        'One-Time "We Build It" Service',
        'Early Feature Access'
      ],
      cta: 'Contact Sales',
      popular: false,
      color: 'border-trini-gold border-t-4 border-t-trini-gold bg-gray-50'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Pricing - Free Store Builder Trinidad & Tobago | TriniBuild Plans</title>
        <meta name="description" content="Start free with TriniBuild. Create your online store in Trinidad & Tobago with no upfront costs. Upgrade when you grow. Plans from TT$0 to TT$400/month." />
        <meta name="keywords" content="TriniBuild pricing, free store builder T&T, Trinidad ecommerce plans, online selling Trinidad, business website pricing" />
        <link rel="canonical" href="https://trinibuild.com/#/pricing" />
        <meta property="og:title" content="TriniBuild Pricing - Start Free, Grow Big" />
        <meta property="og:description" content="No credit card required. Build your online store for free in Trinidad & Tobago." />
      </Helmet>
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold text-trini-red tracking-wide uppercase">The Ascension Model</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Start Free. Grow Big.
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              We believe every Trinbagonian deserves a website. Our free plan is yours for life. Upgrade only when you need more power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {tiers.map((tier) => (
              <div key={tier.name} className={`bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col border ${tier.color} relative transform hover:-translate-y-1 transition-transform`}>
                {tier.popular && (
                  <div className="absolute top-0 inset-x-0 bg-trini-red h-2"></div>
                )}
                <div className="p-6 flex-grow">
                  <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-extrabold text-gray-900">TT${tier.price}</span>
                    <span className="ml-1 text-xl font-medium text-gray-500">/mo</span>
                  </div>
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <CreditCard className="mr-1 h-3 w-3" /> Trans. Fee: {tier.fee}
                  </div>
                  <p className="mt-4 text-sm text-gray-500 italic">{tier.desc}</p>

                  <ul className="mt-6 space-y-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <div className="flex-shrink-0">
                          <Check className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="ml-3 text-sm text-gray-700">{feature}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => handleSelectPlan(tier.name)}
                    disabled={!!processing}
                    className={`block w-full text-center px-4 py-3 rounded-md font-bold transition-colors shadow-sm ${tier.popular
                      ? 'bg-trini-red text-white hover:bg-red-700'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {processing === tier.name ? 'Processing Payment...' : tier.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* The Manifesto / Mission Section */}
          <div className="mt-24 bg-gray-900 rounded-3xl p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
              <Heart className="h-64 w-64 text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                <div className="bg-trini-red p-4 rounded-full">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Why is it free?</h3>
                  <p className="text-gray-300">Our Mission Statement</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <p className="text-lg leading-relaxed text-gray-300 mb-4">
                    The banking system has failed the people of Trinidad and Tobago. High fees, complex requirements, and poor technology have kept local vendors offline for too long.
                  </p>
                  <p className="text-lg leading-relaxed text-gray-300">
                    TriniBuild is our answer. We built a platform where <strong>anyone</strong> can start. We monetize through our successful partners who scale up to "Empire" status. If you stay small, you stay free. That's our promise.
                  </p>
                </div>
                <div className="bg-white/10 p-6 rounded-xl border border-white/20">
                  <h4 className="font-bold mb-4 flex items-center"><TrendingUp className="h-5 w-5 mr-2" /> The Ecosystem Power</h4>
                  <ul className="space-y-3 text-sm text-gray-300">
                    <li>• We drive traffic to the platform, so you get seen.</li>
                    <li>• We handle the technology, so you focus on selling.</li>
                    <li>• We verify vendors, so customers trust you.</li>
                  </ul>
                  <Link to="/create-store" className="mt-6 inline-block text-trini-red font-bold hover:text-white transition-colors">
                    Join the movement &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Common Questions</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                { q: "Do I really need no credit card?", a: "Yes. You can sign up, build your store, and list 10 items without entering any payment information." },
                { q: "What happens if I sell more than 10 items?", a: "You can upgrade to the Growth plan instantly from your dashboard to unlock more space." },
                { q: "Can I use my own domain name?", a: "Custom domains (e.g., mystore.com) are available on the Empire plan. Free plans use a trinibuild.com/store address." },
                { q: "How does Cash on Delivery work?", a: "Customers order on the site. You get the order details via WhatsApp. You collect cash when you deliver. We invoice you the small transaction fee monthly." }
              ].map((faq, i) => (
                <div key={i}>
                  <dt className="font-bold text-gray-900 flex items-center mb-2">
                    <HelpCircle className="h-5 w-5 text-gray-400 mr-2" />
                    {faq.q}
                  </dt>
                  <dd className="text-gray-600 ml-7">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};
