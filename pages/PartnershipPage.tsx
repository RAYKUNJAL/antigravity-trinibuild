import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, BarChart3, Shield, Globe, Smile } from 'lucide-react';

export const PartnershipPage: React.FC = () => {
  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const partners = [
    { name: 'Supabase', icon: '🐘', category: 'Database' },
    { name: 'Vercel', icon: '▲', category: 'Hosting' },
    { name: 'PayPal', icon: '💳', category: 'Payments' },
    { name: 'Stripe', icon: '⚡', category: 'Payments' },
    { name: 'Google Analytics', icon: '📊', category: 'Analytics' },
    { name: 'Framer Motion', icon: '✨', category: 'Animations' }
  ];

  const integrations = [
    {
      name: 'WhatsApp Business',
      description: 'Send order updates, customer support, and promotions via WhatsApp',
      icon: '💬'
    },
    {
      name: 'Email Marketing',
      description: 'Self-hosted Listmonk fork for unlimited email campaigns',
      icon: '📧'
    },
    {
      name: 'SMS Notifications',
      description: 'Digicel SMS integration for order confirmations',
      icon: '📱'
    },
    {
      name: 'QR Code Tracking',
      description: 'Google Charts API with branded QR codes for pickup',
      icon: '📍'
    },
    {
      name: 'Social Media',
      description: 'Cross-post to Instagram, TikTok, and Facebook',
      icon: '📸'
    },
    {
      name: 'Shipping Partners',
      description: 'Integrated with TriniRides for delivery tracking',
      icon: '🚗'
    }
  ];

  const opportunities = [
    {
      title: 'Payment Processors',
      description: 'Integrate your payment gateway to reach TriniBuild merchants',
      icon: '💰'
    },
    {
      title: 'Logistics Providers',
      description: 'Offer delivery services to our growing merchant base',
      icon: '📦'
    },
    {
      title: 'Marketing Agencies',
      description: 'Offer social media, SEO, and email marketing services',
      icon: '📢'
    },
    {
      title: 'Business Services',
      description: 'Accounting, legal, tax, and business consulting',
      icon: '📋'
    },
    {
      title: 'Training & Education',
      description: 'Teach merchants how to grow their online business',
      icon: '🎓'
    },
    {
      title: 'Technology Vendors',
      description: 'Build tools and plugins on TriniBuild platform',
      icon: '🔧'
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
          <motion.h1 variants={item} className="text-5xl font-black mb-6">
            Partnerships & Integrations
          </motion.h1>
          <motion.p variants={item} className="text-xl text-red-100">
            Connect with TriniBuild to reach 5,000+ Caribbean merchants and grow together
          </motion.p>
        </div>
      </motion.section>

      {/* Current Partners */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-12">
            Our Technology Partners
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {partners.map((partner, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className="bg-white rounded-lg p-6 text-center border border-gray-200 hover:shadow-lg transition"
              >
                <div className="text-4xl mb-3">{partner.icon}</div>
                <h3 className="font-bold text-gray-900">{partner.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{partner.category}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Current Integrations */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-12">
            Built-in Integrations
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrations.map((integration, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className="rounded-lg p-6 border border-gray-200 hover:shadow-lg transition"
              >
                <div className="text-4xl mb-4">{integration.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{integration.name}</h3>
                <p className="text-gray-600">{integration.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Partnership Opportunities */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-12">
            Partnership Opportunities
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {opportunities.map((opportunity, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition cursor-pointer"
              >
                <div className="text-4xl mb-4">{opportunity.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{opportunity.title}</h3>
                <p className="text-gray-600 mb-4">{opportunity.description}</p>
                <button className="text-[#E61E2B] font-bold hover:underline">
                  Learn More →
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Partner */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-12">
            Why Partner with TriniBuild?
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Globe,
                title: 'Caribbean Reach',
                description: 'Access 5,000+ merchants across Trinidad & Tobago with expansion to 10+ Caribbean islands'
              },
              {
                icon: Users,
                title: 'Growing Community',
                description: 'Reach merchants who are actively growing their businesses and investing in tools'
              },
              {
                icon: BarChart3,
                title: 'High Engagement',
                description: 'Merchants on TriniBuild are 3x more likely to upgrade vs industry average'
              },
              {
                icon: Shield,
                title: 'Brand Safety',
                description: 'Your integration appears alongside trusted, verified Caribbean businesses'
              },
              {
                icon: Zap,
                title: 'Fast Integration',
                description: 'Our API and webhooks make integration fast and reliable'
              },
              {
                icon: Smile,
                title: 'Support',
                description: 'Dedicated partnership team to help you succeed with TriniBuild merchants'
              }
            ].map((reason, idx) => {
              const Icon = reason.icon;
              return (
                <motion.div
                  key={idx}
                  variants={item}
                  className="flex gap-4"
                >
                  <Icon className="w-8 h-8 text-[#E61E2B] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{reason.title}</h3>
                    <p className="text-gray-600">{reason.description}</p>
                  </div>
                </motion.div>
              );
            })}
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
        <h2 className="text-4xl font-black mb-4">Let's Build Together</h2>
        <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
          Contact our partnerships team to explore how we can work together to serve Caribbean merchants
        </p>
        <button className="bg-white text-[#E61E2B] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition">
          Get in Touch
        </button>
      </motion.section>
    </div>
  );
};
