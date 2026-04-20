'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Check, Star, Zap, TrendingUp, Smartphone, Clock } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  preview_image_url: string | null;
  is_premium: boolean;
  price_usd: number;
  features: string[];
  conversion_rate: number | null;
  mobile_optimized: boolean;
  popularity_score: number;
}

export default function TemplateGallery() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('store_templates')
      .select('*')
      .order('is_premium', { ascending: true }) // Free first
      .order('conversion_rate', { ascending: false, nullsFirst: false });

    if (data) {
      setTemplates(data);
    }
    setLoading(false);
  };

  const categories = [
    { label: 'All Templates', value: 'all' },
    { label: 'General', value: 'general' },
    { label: 'Food & Drink', value: 'food' },
    { label: 'Fashion', value: 'fashion' },
    { label: 'Electronics', value: 'electronics' },
    { label: 'Services', value: 'services' },
  ];

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const freeTemplates = filteredTemplates.filter(t => !t.is_premium);
  const premiumTemplates = filteredTemplates.filter(t => t.is_premium);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-trini-red border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-inter">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8"
      >
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black font-inter mb-4 bg-gradient-to-r from-trini-red via-trini-black to-trini-red bg-clip-text text-transparent"
          >
            Your Store, Live in 5 Minutes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 font-inter max-w-2xl mx-auto"
          >
            Choose a conversion-optimized template. Add your products. Start selling.
            Built for Trinidad & Tobago entrepreneurs.
          </motion.p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-6 py-2 rounded-full font-inter font-semibold transition-all ${
                selectedCategory === cat.value
                  ? 'bg-trini-red text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Free Templates Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-black font-inter mb-2 flex items-center gap-2">
            <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm">
              FREE FOREVER
            </span>
            <span className="text-gray-900">Start Here</span>
          </h2>
          <p className="text-gray-600 font-inter">
            Beautiful, mobile-first templates. No credit card required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {freeTemplates.map((template, index) => (
            <TemplateCard key={template.id} template={template} index={index} />
          ))}
        </div>

        {/* Premium Templates Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8 relative"
        >
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-8 h-8 text-trini-gold fill-trini-gold" />
            <h2 className="text-3xl font-black font-inter text-gray-900">
              Premium Templates
            </h2>
          </div>
          <p className="text-gray-600 font-inter mb-6">
            Advanced features, higher conversions, priority support.
          </p>

          {/* Guarantee Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-trini-gold via-yellow-400 to-trini-gold text-trini-black px-6 py-3 rounded-full font-bold font-inter shadow-xl mb-8">
            <Zap className="w-5 h-5" />
            <span>Your Store Live in 5 Minutes or We Build It For You - Guaranteed</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {premiumTemplates.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={index}
              isPremium
            />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-trini-red via-red-700 to-trini-red py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white font-inter mb-6"
          >
            Start Your Store Right Now
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90 font-inter mb-8"
          >
            Join Trinidad's digital commerce revolution. No setup fees. Cancel anytime.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-trini-red px-12 py-4 rounded-full font-black text-xl font-inter shadow-2xl hover:shadow-3xl transition-all"
          >
            Start Free Trial →
          </motion.button>
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  index: number;
  isPremium?: boolean;
}

function TemplateCard({ template, index, isPremium = false }: TemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 ${
        isPremium ? 'border-trini-gold' : 'border-gray-100'
      }`}
    >
      {/* Preview Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {isPremium && (
          <div className="absolute top-3 right-3 bg-trini-gold text-trini-black px-3 py-1 rounded-full text-xs font-black font-inter flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            PREMIUM
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <h3 className="text-white font-black text-lg font-inter">{template.name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-gray-600 text-sm font-inter mb-4 line-clamp-2">
          {template.description}
        </p>

        {/* Conversion Rate Badge */}
        {template.conversion_rate && (
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold font-inter flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {template.conversion_rate}% Avg. Conversion
            </div>
            {template.mobile_optimized && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold font-inter flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                Mobile
              </div>
            )}
          </div>
        )}

        {/* Features */}
        <div className="space-y-2 mb-5">
          {template.features.slice(0, 3).map((feature, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 font-inter">{feature}</span>
            </div>
          ))}
          {template.features.length > 3 && (
            <p className="text-xs text-gray-500 font-inter">
              +{template.features.length - 3} more features
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between">
          {isPremium ? (
            <>
              <div>
                <span className="text-2xl font-black text-gray-900 font-inter">
                  ${template.price_usd}
                </span>
                <span className="text-sm text-gray-500 font-inter ml-1">one-time</span>
              </div>
              <button className="bg-trini-gold text-trini-black px-6 py-2 rounded-full font-bold font-inter hover:bg-yellow-400 transition-colors">
                Buy Now
              </button>
            </>
          ) : (
            <button className="w-full bg-trini-red text-white px-6 py-3 rounded-full font-bold font-inter hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Use This Template
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
