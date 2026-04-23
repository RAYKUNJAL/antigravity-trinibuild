import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Upload, DollarSign, Package, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SellerOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Create Your Account',
      description: 'Sign up with your email address',
      icon: '📧',
      action: 'Continue with Email'
    },
    {
      title: 'Business Information',
      description: 'Tell us about your business',
      icon: '🏢',
      action: 'Add Details'
    },
    {
      title: 'Set Up Payments',
      description: 'Choose how you want to get paid',
      icon: '💰',
      action: 'Configure Payments'
    },
    {
      title: 'Add Your First Product',
      description: 'List your first item or use AI Product Lister',
      icon: '📦',
      action: 'Add Product'
    },
    {
      title: 'Customize Your Store',
      description: 'Brand your store with colors, logo, and description',
      icon: '🎨',
      action: 'Customize'
    },
    {
      title: 'Launch Your Store',
      description: 'Go live and start selling!',
      icon: '🚀',
      action: 'Launch'
    }
  ];

  const benefits = [
    {
      icon: '⚡',
      title: 'Fast Setup',
      description: 'Get your store live in less than 5 minutes'
    },
    {
      icon: '💳',
      title: 'Easy Payments',
      description: 'Cash on Delivery, Bank Transfer, Card & PayPal'
    },
    {
      icon: '📱',
      title: 'Mobile Ready',
      description: 'Your store works perfectly on all devices'
    },
    {
      icon: '📊',
      title: 'Track Sales',
      description: 'Real-time analytics and reporting'
    },
    {
      icon: '🤖',
      title: 'AI Powered',
      description: 'AI product descriptions save you hours'
    },
    {
      icon: '🌍',
      title: 'Caribbean Native',
      description: 'Built for Trinidad & Tobago merchants'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

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
            Ready to Start Selling?
          </motion.h1>
          <motion.p variants={item} className="text-xl text-red-100 mb-8">
            Join thousands of Caribbean merchants selling online with TriniBuild
          </motion.p>
        </div>
      </motion.section>

      {/* Steps Timeline */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-16">
            How to Get Started in 6 Steps
          </motion.h2>

          <div className="space-y-6">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className={`relative flex gap-6 pb-6 ${
                  idx !== steps.length - 1 ? 'border-b-2 border-gray-200' : ''
                }`}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0 ${
                    idx <= currentStep
                      ? 'bg-[#E61E2B] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.icon}
                  </div>
                  {idx !== steps.length - 1 && (
                    <div className={`w-1 h-12 ${
                      idx < currentStep ? 'bg-[#E61E2B]' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Step {idx + 1}: {step.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  <button 
                    onClick={() => {
                      if (idx === 0) navigate('/create-store');
                      setCurrentStep(Math.min(idx + 1, steps.length - 1));
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-[#E61E2B] text-white rounded-lg font-bold hover:bg-red-700 transition"
                  >
                    {step.action}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Benefits Grid */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-16">
            Why Choose TriniBuild?
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className="bg-white rounded-lg p-6 border border-gray-200 text-center hover:shadow-lg transition"
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Comparison */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-12">
            What You Get Included
          </motion.h2>
          <div className="space-y-3">
            {[
              'Unlimited product listings',
              'Mobile-responsive store design',
              'AI-powered product descriptions',
              'Multiple payment methods',
              'Order tracking & management',
              'Customer messaging',
              'Email marketing tools',
              'Tax reporting dashboard',
              'QR code pickups',
              'Analytics & insights'
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="font-bold text-gray-900">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing Preview */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-12">
            Simple Pricing
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: 'Free',
                description: '10 products, basic features',
                color: 'bg-gray-100'
              },
              {
                name: 'Pro',
                price: 'TT$199/mo',
                description: 'Unlimited products, all features',
                color: 'bg-[#E61E2B]',
                highlighted: true,
                textColor: 'text-white'
              },
              {
                name: 'Business',
                price: 'TT$399/mo',
                description: 'Everything + dedicated support',
                color: 'bg-gray-900',
                textColor: 'text-white'
              }
            ].map((tier, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className={`rounded-lg p-6 text-center ${tier.color} ${
                  tier.highlighted ? 'border-2 border-yellow-400 shadow-lg' : ''
                }`}
              >
                <h3 className={`text-2xl font-bold mb-2 ${tier.textColor || ''}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm mb-4 opacity-75 ${tier.textColor || 'text-gray-600'}`}>
                  {tier.description}
                </p>
                <p className={`text-3xl font-black mb-6 ${tier.textColor || ''}`}>
                  {tier.price}
                </p>
                <button className={`w-full py-3 rounded-lg font-bold transition ${
                  tier.highlighted
                    ? 'bg-white text-[#E61E2B] hover:bg-gray-100'
                    : tier.name === 'Business'
                      ? 'bg-[#E61E2B] text-white hover:bg-red-700'
                      : 'bg-white text-gray-900 hover:bg-gray-50 border-2 border-gray-200'
                }`}>
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-12">
            What Sellers Say
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Maria Santos',
                business: 'Fashion Boutique',
                quote: 'I went from 0 to 100 orders in 3 months. TriniBuild is a game-changer!'
              },
              {
                name: 'Rajesh Patel',
                business: 'Electronics Store',
                quote: 'No more payment processing headaches. COD is perfect for Trinidad.'
              },
              {
                name: 'Jessica Clarke',
                business: 'Home Bakery',
                quote: 'The AI product lister saved me so much time. Highly recommend!'
              }
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className="bg-white rounded-lg p-6 border border-gray-200"
              >
                <div className="flex text-yellow-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <p className="font-bold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-gray-600">{testimonial.business}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#E61E2B] to-red-700 text-white text-center"
        variants={item}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <h2 className="text-4xl font-black mb-4">Ready to Launch Your Store?</h2>
        <p className="text-xl text-red-100 mb-8">Start free today, upgrade when you're ready</p>
        <button
          onClick={() => navigate('/create-store')}
          className="bg-white text-[#E61E2B] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
        >
          Create Your Free Store
        </button>
        <p className="text-red-100 mt-4">✓ No credit card required ✓ Free forever plan available</p>
      </motion.section>
    </div>
  );
};
