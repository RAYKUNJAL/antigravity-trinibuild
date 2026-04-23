import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Users, Award } from 'lucide-react';

interface Story {
  name: string;
  business: string;
  location: string;
  beforeRevenue: string;
  afterRevenue: string;
  growth: string;
  testimonial: string;
  avatar: string;
  category: string;
}

export const SuccessStoriesPage: React.FC = () => {
  const stories: Story[] = [
    {
      name: 'Maria Santos',
      business: 'Caribbean Fashion Boutique',
      location: 'San Fernando',
      beforeRevenue: 'TT$0',
      afterRevenue: 'TT$8,000/week',
      growth: '+1,600%',
      testimonial: 'TriniBuild changed my life! I went from zero online sales to serving 100+ customers a month. The AI product lister saved me hours!',
      avatar: '👩‍💼',
      category: 'Fashion'
    },
    {
      name: 'Rajesh Patel',
      business: 'Electronics & Gadgets',
      location: 'Port of Spain',
      beforeRevenue: 'TT$2,000/mo',
      afterRevenue: 'TT$15,000/mo',
      growth: '+650%',
      testimonial: 'The COD system is perfect for Trinidad. No chargebacks, no payment processing fees. TriniBuild lets me focus on selling, not payment issues.',
      avatar: '👨‍💻',
      category: 'Electronics'
    },
    {
      name: 'Jessica Clarke',
      business: 'Home-Based Baking',
      location: 'Chaguanas',
      beforeRevenue: 'Part-time',
      afterRevenue: 'Full-time business',
      growth: 'Career change',
      testimonial: 'Started as a side hustle, now it\'s my main income! The free plan got me started, Pro features helped me scale to 500 monthly orders.',
      avatar: '👩‍🍳',
      category: 'Food & Beverage'
    },
    {
      name: 'David Thompson',
      business: 'Handcraft Studio',
      location: 'Arima',
      beforeRevenue: 'Local only',
      afterRevenue: 'Island-wide reach',
      growth: 'Geography expanded',
      testimonial: 'TriniBuild got my handcrafts in front of customers across T&T. The order volume jumped 300% in just 3 months!',
      avatar: '👨‍🎨',
      category: 'Arts & Crafts'
    },
    {
      name: 'Amelia Rodriguez',
      business: 'Garden Center',
      location: 'Tobago',
      beforeRevenue: 'Walk-in only',
      afterRevenue: 'Online + walk-in',
      growth: '+280% total sales',
      testimonial: 'No tech background, but TriniBuild made it so easy. Now my garden center gets orders from across the island via WhatsApp!',
      avatar: '👩‍🌾',
      category: 'Home & Garden'
    },
    {
      name: 'Ahmed Hassan',
      business: 'Phone Repairs & Accessories',
      location: 'Port of Spain',
      beforeRevenue: 'TT$1,500/week',
      afterRevenue: 'TT$5,000/week',
      growth: '+233%',
      testimonial: 'The inventory system keeps me organized. With email campaigns, I\'ve built a loyal customer base. Best investment ever!',
      avatar: '👨‍🔧',
      category: 'Electronics'
    }
  ];

  const metrics = [
    { icon: Users, label: 'Active Merchants', value: '5,000+' },
    { icon: TrendingUp, label: 'Avg Growth', value: '+340%' },
    { icon: Award, label: 'Success Rate', value: '78%' },
    { icon: Users, label: 'Total Orders', value: '2.5M+' }
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
            Success Stories from Caribbean Merchants
          </motion.h1>
          <motion.p variants={item} className="text-xl text-red-100 mb-8">
            Real merchants, real results. See how TriniBuild transformed their businesses.
          </motion.p>
        </div>
      </motion.section>

      {/* Metrics */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <motion.div 
                key={idx}
                variants={item}
                className="text-center"
              >
                <Icon className="w-12 h-12 text-[#E61E2B] mx-auto mb-4" />
                <p className="text-gray-600 mb-2">{metric.label}</p>
                <p className="text-3xl font-black text-gray-900">{metric.value}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Stories Grid */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-4xl font-black text-center mb-16">
            Merchant Testimonials
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story, idx) => (
              <motion.div
                key={idx}
                variants={item}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-6 text-center">
                  <div className="text-6xl mb-3">{story.avatar}</div>
                  <h3 className="text-lg font-bold text-gray-900">{story.name}</h3>
                  <p className="text-gray-600 text-sm">{story.business}</p>
                  <p className="text-gray-500 text-xs mt-1">{story.location}</p>
                </div>

                {/* Results */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-gray-600 text-xs">Before</p>
                      <p className="text-lg font-bold text-gray-900">{story.beforeRevenue}</p>
                    </div>
                    <div className="text-2xl text-[#E61E2B]">→</div>
                    <div className="text-right">
                      <p className="text-gray-600 text-xs">After</p>
                      <p className="text-lg font-bold text-green-600">{story.afterRevenue}</p>
                    </div>
                  </div>
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                    {story.growth}
                  </div>
                </div>

                {/* Testimonial */}
                <div className="p-6">
                  <div className="flex text-yellow-400 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm italic mb-4">
                    "{story.testimonial}"
                  </p>
                  <div className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                    {story.category}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={item}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#E61E2B] to-red-700 text-white rounded-lg p-12 text-center">
          <h2 className="text-4xl font-black mb-4">
            Your Success Story Starts Here
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of Caribbean merchants already growing their businesses on TriniBuild
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-[#E61E2B] px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition">
              Create Free Store
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:bg-opacity-10 transition">
              See More Stories
            </button>
          </div>
        </div>
      </motion.section>

      {/* Stats Highlight */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50"
        variants={item}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">Why Merchants Choose TriniBuild</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Free to Start', desc: '10 free listings, no credit card required' },
              { title: 'Cash on Delivery', desc: 'Get paid in cash, no payment processing fees' },
              { title: 'Local Support', desc: 'T&T customer service that understands your market' },
              { title: 'AI-Powered Tools', desc: 'AI product lister saves hours of work' },
              { title: 'Affordable Growth', desc: 'Pro features for just TT$199/month' },
              { title: 'Real Results', desc: 'Average merchant grows 340% in first year' }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                variants={item}
                className="text-center"
              >
                <div className="w-12 h-12 bg-[#E61E2B] rounded-full flex items-center justify-center text-white font-black mx-auto mb-4">
                  ✓
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
};
