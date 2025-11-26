import React from 'react';
import { Check, HelpCircle, CreditCard, Zap, Heart, TrendingUp, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectPlan = (planName: string) => {
    if (planName === 'Community Plan') {
      localStorage.removeItem('trinibuild_subscription');
      navigate('/create-store');
    } else {
      localStorage.setItem('trinibuild_subscription', planName);
      // Simulate "Upgrade Successful" toast or similar by just going to dashboard
      alert(`Successfully upgraded to ${planName}!`);
      navigate('/dashboard');
    }
  };

  const tiers = [
    {
      name: 'Community Plan',
      price: '0',
      desc: 'Your right to be online. No credit card needed.',
      fee: '8%',
      features: [
        '10 Product Listings',
        'Basic Directory Profile',
        'Accept COD Orders',
        'Subdomain Website',
        'Photo Receipts',
        'Community Support'
      ],
      cta: 'Claim Free Account',
      color: 'border-gray-200 border-t-4 border-t-gray-400'
    },
    {
      name: 'Growth',
      price: '99',
      desc: 'For vendors ready to scale up.',
      fee: '6%',
      features: [
        '50 Product Listings',
        'Verified Business Badge',
        'Loyalty Rewards System',
        'AI Sales Insights',
        'Official Documents (Job Letters)',
        'WhatsApp Integration'
      ],
      cta: 'Start Scaling',
      popular: true,
      color: 'border-trini-red ring-2 ring-trini-red ring-opacity-50'
    },
    {
      name: 'Empire',
      price: '299',
      desc: 'Dominate your market category.',
      fee: '0% (Cash Orders)',
      features: [
        'Unlimited Listings',
        'Custom Domain Name',
        'Bulk Product Upload',
        'Priority Search Placement',
        'Advanced Inventory',
        'Official Documents & Invoices'
      ],
      cta: 'Build Empire',
      color: 'border-gray-200 border-t-4 border-t-purple-600'
    }
  ];

  return (
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                  className={`block w-full text-center px-4 py-3 rounded-md font-bold transition-colors shadow-sm ${tier.popular
                      ? 'bg-trini-red text-white hover:bg-red-700'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {tier.cta}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
          </div>
        </div>
      </div>
    </div>
  );
};
