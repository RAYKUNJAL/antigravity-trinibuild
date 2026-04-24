import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, TrendingUp, Users, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BecomeSellerPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'business'>('pro');

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for testing',
      features: [
        '10 free products',
        'Basic store customization',
        'COD checkout',
        'Email support'
      ],
      cta: 'Start Free',
      highlighted: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 'TT$199/mo',
      description: 'Most popular',
      features: [
        'Unlimited products',
        'AI product lister',
        'Advanced analytics',
        'Priority support',
        'Custom domain',
        'Email marketing'
      ],
      cta: 'Start Pro',
      highlighted: true
    },
    {
      id: 'business',
      name: 'Business',
      price: 'TT$399/mo',
      description: 'For serious sellers',
      features: [
        'Everything in Pro',
        'Advanced inventory',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'Video hosting'
      ],
      cta: 'Start Business',
      highlighted: false
    }
  ];

  const benefits = [
    {
      icon: ShoppingCart,
      title: 'Easy Setup',
      description: 'Create your store in 5 minutes. No coding needed.'
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Sales',
      description: 'AI-powered tools to increase your average order value.'
    },
    {
      icon: Users,
      title: 'Reach Customers',
      description: 'Access to thousands of buyers in Trinidad & Tobago.'
    },
    {
      icon: Award,
      title: 'Build Trust',
      description: 'Verified seller badge and customer reviews.'
    }
  ];

  const stats = [
    { number: 'Free', label: 'Forever, not a trial' },
    { number: '0', label: 'Credit card required' },
    { number: '2 min', label: 'To live store' },
    { number: '🇹🇹', label: 'Built in Trinidad' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={item}>
            <h1 className="text-5xl font-black text-gray-900 mb-6">
              Start Selling Online Today
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of Trinidad merchants selling on TriniBuild. 
              Cash on Delivery, no credit card needed.
            </p>
            <button
              onClick={() => navigate('/create-store')}
              className="bg-[#E61E2B] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition"
            >
              Create My Free Store
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
            variants={container}
          >
            {stats.map((stat, idx) => (
              <motion.div key={idx} variants={item}>
                <p className="text-3xl font-black text-gray-900">{stat.number}</p>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16">Why TriniBuild?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div 
                  key={idx} 
                  variants={item}
                  className="p-6 rounded-lg border border-gray-200 hover:border-red-300 transition"
                >
                  <Icon className="w-12 h-12 text-[#E61E2B] mb-4" />
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16">Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={item}
                className={`rounded-lg p-8 transition-all ${
                  selectedPlan === plan.id || plan.highlighted
                    ? 'bg-gray-900 text-white border-2 border-[#E61E2B] shadow-xl scale-105'
                    : 'bg-white border-2 border-gray-200 text-gray-900'
                }`}
                onClick={() => setSelectedPlan(plan.id as any)}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={selectedPlan === plan.id || plan.highlighted ? 'text-gray-300' : 'text-gray-600'}>
                  {plan.description}
                </p>
                <p className="text-3xl font-black my-4">{plan.price}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-3 ${
                        selectedPlan === plan.id || plan.highlighted 
                          ? 'bg-[#E61E2B]' 
                          : 'bg-gray-400'
                      }`}></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/create-store')}
                  className={`w-full py-3 rounded-lg font-bold transition ${
                    selectedPlan === plan.id || plan.highlighted
                      ? 'bg-[#E61E2B] text-white hover:bg-red-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Create Store', desc: 'Sign up in 2 minutes' },
              { step: 2, title: 'Add Products', desc: 'Use AI to list items' },
              { step: 3, title: 'Get Orders', desc: 'Customers order online' },
              { step: 4, title: 'Collect Cash', desc: 'Get paid on delivery' }
            ].map((item, idx) => (
              <motion.div 
                key={idx} 
                variants={item}
                className="text-center"
              >
                <div className="w-16 h-16 bg-[#E61E2B] text-white rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white text-center"
        variants={item}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-4xl font-black mb-4">Ready to Start?</h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          First 10 listings free. No credit card required. Start selling today!
        </p>
        <button
          onClick={() => navigate('/create-store')}
          className="bg-[#E61E2B] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition"
        >
          Create Your Store Now
        </button>
      </motion.section>
    </div>
  );
};
