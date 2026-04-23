import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Phone, Search, ChevronDown, Video, FileText, Users } from 'lucide-react';

interface FAQItem {
  category: string;
  items: { q: string; a: string }[];
}

export const HelpSupportPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      category: 'Getting Started',
      items: [
        {
          q: 'How do I create a store on TriniBuild?',
          a: 'Click "Create Store" and follow our 3-step wizard. It takes less than 2 minutes! Add your business name, choose a category, and you\'re ready to start listing products.'
        },
        {
          q: 'Is there a setup fee or credit card required?',
          a: 'No! TriniBuild is completely free to start. No setup fees, no credit card required. Start with 10 free product listings. Upgrade to Pro (TT$199/mo) for unlimited products.'
        },
        {
          q: 'Can I use TriniBuild if I don\'t have a bank account?',
          a: 'Yes! Cash on Delivery (COD) is our default payment method. Customers pay you in cash when they receive their order. No bank account or payment processing needed.'
        }
      ]
    },
    {
      category: 'Products & Listings',
      items: [
        {
          q: 'How do I add products to my store?',
          a: 'Go to your dashboard and click "Add Product". Fill in the details (name, price, description, photos). Our AI Product Lister (Pro feature) can generate descriptions for you!'
        },
        {
          q: 'Can I edit products after listing them?',
          a: 'Yes! You can edit any product anytime. Change prices, descriptions, photos, inventory levels. Updates are instant on your store.'
        },
        {
          q: 'How many products can I list?',
          a: 'Free plan: 10 products. Pro plan: Unlimited products. Business plan: Unlimited with API access.'
        }
      ]
    },
    {
      category: 'Orders & Payments',
      items: [
        {
          q: 'How do payments work with Cash on Delivery?',
          a: 'Customers place orders online and pay when the delivery arrives. You\'re notified immediately via SMS/WhatsApp, confirm the delivery, and the order is complete.'
        },
        {
          q: 'What other payment methods are available?',
          a: 'Pro & Business plans include: Bank Transfer (with proof upload), Credit/Debit Card via WiPay, and PayPal. Plus COD is always available.'
        },
        {
          q: 'When do I get paid?',
          a: 'With COD, you get paid immediately when the customer receives the order. With other methods, funds go to your account within 24-48 hours.'
        },
        {
          q: 'Are there any transaction fees?',
          a: 'COD has no fees. Bank transfers have no fees. Card payments have 2.5% processor fee. All fees are transparent upfront.'
        }
      ]
    },
    {
      category: 'Shipping & Delivery',
      items: [
        {
          q: 'How does delivery work?',
          a: 'You have options: 1) Standard delivery (TT$25 base + TT$4/km via TriniRides), 2) Express (faster service), 3) Store pickup (customer collects), 4) Customer delivery (they arrange it).'
        },
        {
          q: 'Can I use my own courier?',
          a: 'Yes! You can arrange your own delivery and mark it as "Self-Delivery" in the order. Or use our integrated TriniRides system for seamless tracking.'
        },
        {
          q: 'How do I track deliveries?',
          a: 'When using TriniRides, both you and the customer can track the delivery in real-time. For self-delivery, update the order status and send tracking via WhatsApp.'
        }
      ]
    },
    {
      category: 'Marketing & Growth',
      items: [
        {
          q: 'How do I get more customers?',
          a: 'Use email marketing (Pro feature) to reach your subscribers, share your store on WhatsApp & social media, leverage QR codes for in-store promotion, and optimize for search (SEO help available).'
        },
        {
          q: 'What is the AI Product Lister?',
          a: 'Upload a photo of your product, and AI generates a professional description, title, and pricing suggestions. Saves hours of manual work!'
        },
        {
          q: 'Can I run promotions and discounts?',
          a: 'Yes! Pro plan includes coupon system. Create discount codes, flash sales, loyalty rewards, and bulk discounts. Track performance in real-time.'
        }
      ]
    },
    {
      category: 'Account & Settings',
      items: [
        {
          q: 'How do I change my store name or details?',
          a: 'Go to Settings → Store Info and update anytime. Store URL/slug cannot be changed once created (to protect your store SEO and customer links).'
        },
        {
          q: 'Can I have multiple stores?',
          a: 'Not with one account. Create a separate TriniBuild account for each business. Or upgrade to Business plan for multi-user account management.'
        },
        {
          q: 'How do I upgrade to Pro or Business?',
          a: 'Click "Upgrade" in your dashboard. Choose monthly or yearly billing. Upgrade is instant and you get access to all Pro/Business features immediately.'
        }
      ]
    }
  ];

  const support_channels = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      availability: 'Mon-Fri 9am-6pm',
      action: 'Start Chat'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us a message',
      availability: 'Response in 24 hours',
      action: 'Send Email'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call our support team',
      availability: 'Mon-Fri 10am-5pm',
      action: 'Call Now'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Learn by watching',
      availability: '50+ video guides',
      action: 'Watch Videos'
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8 bg-white"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto">
          <motion.h1 variants={item} className="text-4xl font-black text-gray-900 mb-4">
            How Can We Help?
          </motion.h1>
          <motion.p variants={item} className="text-lg text-gray-600 mb-8">
            Find answers to your questions about TriniBuild, or contact our support team.
          </motion.p>

          {/* Search */}
          <motion.div variants={item} className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E61E2B] focus:border-transparent"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Support Channels */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-12">
            Contact Our Team
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {support_channels.map((channel, idx) => {
              const Icon = channel.icon;
              return (
                <motion.div
                  key={idx}
                  variants={item}
                  className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:shadow-lg transition"
                >
                  <Icon className="w-8 h-8 text-[#E61E2B] mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">{channel.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{channel.description}</p>
                  <p className="text-gray-500 text-xs mb-4">{channel.availability}</p>
                  <button className="w-full bg-[#E61E2B] text-white py-2 rounded-lg font-bold hover:bg-red-700 transition text-sm">
                    {channel.action}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8 bg-white"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={item} className="text-3xl font-black text-center mb-12">
            Frequently Asked Questions
          </motion.h2>

          <div className="space-y-4">
            {faqData.map((category, catIdx) => (
              <motion.div key={catIdx} variants={item}>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#E61E2B]" />
                  {category.category}
                </h3>
                <div className="space-y-3 ml-7">
                  {category.items.map((faq, faqIdx) => {
                    const faqId = `${catIdx}-${faqIdx}`;
                    const isExpanded = expandedFAQ === faqId;
                    return (
                      <motion.div
                        key={faqIdx}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedFAQ(isExpanded ? null : faqId)}
                          className="w-full p-4 text-left font-bold text-gray-900 hover:bg-gray-50 transition flex justify-between items-center"
                        >
                          {faq.q}
                          <ChevronDown
                            className={`w-5 h-5 text-gray-600 transition ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gray-50 p-4 border-t border-gray-200"
                          >
                            <p className="text-gray-700">{faq.a}</p>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Community */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#E61E2B] to-red-700 text-white"
        variants={item}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <Users className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-black mb-4">Join Our Community</h2>
          <p className="text-red-100 mb-8 text-lg">
            Connect with other TriniBuild merchants, share tips, and learn from their success
          </p>
          <button className="bg-white text-[#E61E2B] px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
            Join Facebook Community
          </button>
        </div>
      </motion.section>
    </div>
  );
};
