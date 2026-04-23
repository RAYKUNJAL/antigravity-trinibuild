import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Zap, Users, Trophy, Gift, TrendingUp } from 'lucide-react';

export const GamePassProPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const games = [
    { name: 'Xbox Game Pass', type: 'Premium Gaming' },
    { name: 'PlayStation Plus', type: 'Exclusive Titles' },
    { name: 'EA Play', type: 'Electronic Arts' },
    { name: 'Ubisoft+', type: 'Ubisoft Titles' },
    { name: 'PC Game Pass', type: 'Windows PC' },
    { name: 'Cloud Gaming', type: 'Stream Anywhere' }
  ];

  const benefits = [
    {
      icon: Gamepad2,
      title: '500+ Games',
      desc: 'Access to massive library of games'
    },
    {
      icon: Zap,
      title: 'Day One Releases',
      desc: 'New AAA games available on launch day'
    },
    {
      icon: Users,
      title: 'Play with Friends',
      desc: 'Multiplayer and co-op games included'
    },
    {
      icon: Trophy,
      title: 'Exclusive Perks',
      desc: 'Discounts and exclusive content'
    },
    {
      icon: Gift,
      title: 'Bonus Content',
      desc: 'Free monthly games and DLC'
    },
    {
      icon: TrendingUp,
      title: 'Cloud Saves',
      desc: 'Play across devices and pick up where you left off'
    }
  ];

  const plans = [
    {
      name: 'Game Pass Pro',
      monthly: 'TT$99',
      yearly: 'TT$999',
      popular: true,
      features: [
        'Access to 500+ games',
        'Cloud gaming included',
        'Play on console & PC',
        'Exclusive deals',
        '24/7 Priority support'
      ]
    },
    {
      name: 'Game Pass Ultimate',
      monthly: 'TT$149',
      yearly: 'TT$1,499',
      popular: false,
      features: [
        'Everything in Pro',
        'Xbox Live Gold included',
        'EA Play included',
        'Ubisoft+ included',
        'Early game access'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900 to-gray-900 text-white"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={item} className="flex items-center justify-center mb-6">
            <Gamepad2 className="w-16 h-16" />
          </motion.div>
          <motion.h1 variants={item} className="text-5xl font-black mb-6">
            Game Pass Pro
          </motion.h1>
          <motion.p variants={item} className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Play hundreds of games on console and PC. New games added every month.
          </motion.p>
          <motion.button 
            variants={item}
            className="bg-[#E61E2B] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition"
          >
            Start Free Trial
          </motion.button>
        </div>
      </motion.section>

      {/* Games Available */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-4xl font-black text-center mb-16">
            Games & Services Included
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:border-purple-300 transition shadow-sm"
              >
                <Gamepad2 className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-bold text-lg">{game.name}</h3>
                <p className="text-gray-600 text-sm">{game.type}</p>
              </motion.div>
            ))}
          </div>
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
          <motion.h2 variants={item} className="text-4xl font-black text-center mb-16">
            Why Game Pass Pro?
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div 
                  key={idx} 
                  variants={item}
                  className="text-center"
                >
                  <Icon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-4xl font-black text-center mb-8">
            Flexible Pricing
          </motion.h2>

          {/* Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-lg p-1 border border-gray-200 flex">
              {['monthly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPlan(period as any)}
                  className={`px-6 py-2 rounded font-bold transition ${
                    selectedPlan === period
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                  {period === 'yearly' && ' (Save 17%)'}
                </button>
              ))}
            </div>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className={`rounded-lg p-8 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-b from-purple-900 to-purple-800 text-white border-2 border-purple-600 shadow-xl scale-105'
                    : 'bg-white border-2 border-gray-200 text-gray-900'
                }`}
              >
                {plan.popular && (
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-4 ${
                    plan.popular ? 'bg-purple-400 text-purple-900' : ''
                  }`}>
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-black mb-4">{plan.name}</h3>
                <p className="text-3xl font-black mb-8">
                  {selectedPlan === 'monthly' ? plan.monthly : plan.yearly}
                  <span className="text-lg text-opacity-75">/{selectedPlan === 'monthly' ? 'mo' : 'yr'}</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-3 bg-purple-400"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-lg font-bold transition ${
                  plan.popular
                    ? 'bg-[#E61E2B] text-white hover:bg-red-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}>
                  Subscribe Now
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-2xl mx-auto">
          <motion.h2 variants={item} className="text-4xl font-black text-center mb-12">
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I play on multiple devices?',
                a: 'Yes! Play on console, PC, or cloud gaming devices simultaneously with your account.'
              },
              {
                q: 'Is the free trial really free?',
                a: 'Yes, get your first month free. No credit card required to start.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Absolutely. Cancel your subscription anytime, no questions asked.'
              },
              {
                q: 'What\'s the difference between Pro and Ultimate?',
                a: 'Ultimate includes Xbox Live Gold and 3rd-party services like EA Play and Ubisoft+.'
              }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className="bg-white rounded-lg p-6 border border-gray-200"
              >
                <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900 to-gray-900 text-white text-center"
        variants={item}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-4xl font-black mb-4">Ready to Play?</h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Get your first month free with Game Pass Pro. Start playing hundreds of games today.
        </p>
        <button className="bg-[#E61E2B] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition">
          Start Free Trial
        </button>
      </motion.section>
    </div>
  );
};
