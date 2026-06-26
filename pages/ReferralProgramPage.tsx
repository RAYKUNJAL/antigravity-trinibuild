import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Users, TrendingUp, Share2, DollarSign, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReferralProgramPage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const referralCode = 'RAY2024TRINIBUILD';

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tiers = [
    {
      name: 'Bronze',
      referrals: '1-5',
      commission: '10%',
      bonus: 'TT$50',
      benefits: ['Referral dashboard', 'Monthly payouts', 'Dedicated support']
    },
    {
      name: 'Silver',
      referrals: '6-20',
      commission: '15%',
      bonus: 'TT$200',
      benefits: ['Everything in Bronze', 'Custom landing page', 'Email templates', 'Early access to features'],
      highlighted: true
    },
    {
      name: 'Gold',
      referrals: '21+',
      commission: '20%',
      bonus: 'TT$500',
      benefits: ['Everything in Silver', 'Dedicated account manager', 'Co-marketing opportunities', 'VIP support (1hr response)']
    }
  ];

  const stats = [
    { label: 'Per Merchant Referral', value: 'TT$150' },
    { label: 'Referral Cap', value: 'None' },
    { label: 'Payout Schedule', value: 'Monthly' },
    { label: 'Cost to Join', value: 'Free' }
  ];

  const howitworks = [
    {
      step: 1,
      title: 'Share Your Code',
      description: 'Copy your unique referral code and share with friends, social media, or email'
    },
    {
      step: 2,
      title: 'They Sign Up',
      description: 'Your referral signs up using your code and creates their store'
    },
    {
      step: 3,
      title: 'You Earn',
      description: 'Earn 10-20% commission on their first year of subscriptions'
    },
    {
      step: 4,
      title: 'Get Paid',
      description: 'Monthly payouts to your bank account, no minimum threshold'
    }
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
          <motion.div variants={item} className="flex justify-center mb-6">
            <Gift className="w-16 h-16" />
          </motion.div>
          <motion.h1 variants={item} className="text-5xl font-black mb-6">
            Earn with TriniBuild
          </motion.h1>
          <motion.p variants={item} className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Refer merchants and earn recurring commissions. Build passive income while helping Caribbean businesses grow online.
          </motion.p>
          <motion.button
            variants={item}
            onClick={() => navigate('/create-store')}
            className="bg-white text-[#E61E2B] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            Join Referral Program
          </motion.button>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div key={idx} variants={item} className="text-center">
              <p className="text-gray-600 mb-2">{stat.label}</p>
              <p className="text-4xl font-black text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-4xl font-black text-center mb-16">
            How It Works
          </motion.h2>
          <div className="grid md:grid-cols-4 gap-8">
            {howitworks.map((item_step, idx) => (
              <motion.div 
                key={idx}
                variants={item}
                className="text-center"
              >
                <div className="w-16 h-16 bg-[#E61E2B] text-white rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-4">
                  {item_step.step}
                </div>
                <h3 className="font-bold text-xl mb-2">{item_step.title}</h3>
                <p className="text-gray-600">{item_step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Referral Code */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        variants={item}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-6">Your Referral Code</h2>
          <div className="bg-white rounded-lg border-2 border-[#E61E2B] p-8">
            <p className="text-gray-600 mb-4">Share this code with others</p>
            <div className="flex items-center justify-center gap-4">
              <code className="text-2xl font-black text-[#E61E2B] bg-gray-100 px-6 py-3 rounded-lg">
                {referralCode}
              </code>
              <button
                onClick={handleCopyCode}
                className={`px-6 py-3 rounded-lg font-bold transition ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-[#E61E2B] text-white hover:bg-red-700'
                }`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Commission Tiers */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-4xl font-black text-center mb-16">
            Commission Tiers
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className={`rounded-lg p-8 transition-all ${
                  tier.highlighted
                    ? 'bg-gray-900 text-white border-2 border-[#E61E2B] shadow-xl scale-105'
                    : 'bg-white border-2 border-gray-200 text-gray-900'
                }`}
              >
                <h3 className="text-2xl font-bold mb-4">{tier.name}</h3>
                <p className={tier.highlighted ? 'text-gray-300' : 'text-gray-600'}>
                  {tier.referrals} referrals
                </p>
                
                <div className="my-6 py-6 border-y border-opacity-20 border-white">
                  <p className="text-sm mb-2">Commission Rate</p>
                  <p className="text-4xl font-black">{tier.commission}</p>
                  <p className="text-sm mt-2">Sign-up bonus: {tier.bonus}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.benefits.map((benefit, bidx) => (
                    <li key={bidx} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-lg font-bold transition ${
                  tier.highlighted
                    ? 'bg-[#E61E2B] text-white hover:bg-red-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}>
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Top Referrers */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-12">
            Top Referrers This Month
          </motion.h2>
          <div className="space-y-4">
             <motion.div variants={item} className="bg-gray-50 rounded-lg p-8 text-center">
               <p className="text-gray-600 italic mb-2">Leaderboard coming soon — be the first on it.</p>
               <p className="text-sm text-gray-500">Refer your first merchant to claim the #1 spot.</p>
             </motion.div>
          </div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-2xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-12">
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-6">
            {[
              {
                q: 'How much can I earn?',
                 a: 'You earn TT$150 for every merchant you refer who signs up. There is no cap — refer more, earn more. We do not publish average earnings because the program is brand new and there is no data yet.'
              },
              {
                q: 'When do I get paid?',
                a: 'Monthly payouts on the 1st of each month via bank transfer. No minimum threshold.'
              },
              {
                q: 'Can I promote TriniBuild?',
                a: 'Yes! Share on social media, your website, email lists, podcasts, or anywhere. We provide marketing materials.'
              },
              {
                q: 'Is there a limit to referrals?',
                a: 'No! The more merchants you refer, the higher your tier and commission rate.'
              }
            ].map((faq, idx) => (
              <motion.div 
                key={idx}
                variants={item}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <h3 className="font-bold text-lg mb-3">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#E61E2B] to-red-700 text-white text-center"
        variants={item}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-4xl font-black mb-4">Start Earning Today</h2>
        <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
           Earn TT$150 for every merchant you refer who signs up. No cap.
        </p>
        <button className="bg-white text-[#E61E2B] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition">
          Become a Referrer
        </button>
      </motion.section>
    </div>
  );
};
