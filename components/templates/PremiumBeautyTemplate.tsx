import React, { useState } from 'react';
import { Star, MessageCircle, Phone, Calendar, Clock, Award, Heart, Instagram, Scissors, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product, Store } from '../../types';

/**
 * PREMIUM BEAUTY TEMPLATE
 * Beauty salon, spa and wellness services
 * Real data driven
 */

export const PremiumBeautyTemplate: React.FC<{
  storeName?: string;
  storeData?: Store;
  products?: Product[];
  primaryColor?: string;
}> = ({ storeName = 'Beauty Studio', storeData, products = [], primaryColor = '#EC4899' }) => {
  // UI/UX Pro Max: Beauty/Spa = Lora headings + Raleway body
  const headingStyle = { fontFamily: "'Lora', serif" };
  const fontStyle = { fontFamily: "'Raleway', sans-serif" };
  const [selectedService, setSelectedService] = useState(0);

  const services = products.filter(p => p.status === 'active');
  const currentService = services[selectedService] || {
    id: 'default',
    name: 'Our Services',
    description: storeData?.description || 'Professional beauty and wellness services',
    price: 0,
    store_id: '',
    slug: '',
    image_url: null,
    compare_at_price: undefined,
    stock: 0,
    sku: undefined,
    gallery_images: [],
    category: 'Beauty',
    category_ids: [],
    variants: [],
    seo: {},
    specifications: {},
    status: 'active',
    created_at: ''
  };

  const handleWhatsApp = (product: Product) => {
    const phone = storeData?.whatsapp || storeData?.phone || '';
    const msg = encodeURIComponent(`Hi! I'd like to book: ${product.name} (TT$${product.price}). Is it available?`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight">{storeName}</h1>
            {storeData?.tagline && <p className="text-xs text-gray-500">{storeData.tagline}</p>}
          </div>
          <a
            href={`https://wa.me/${(storeData?.whatsapp || storeData?.phone || '').replace(/\D/g, '')}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-full text-sm hover:opacity-90 transition"
            style={{ backgroundColor: primaryColor }}
          >
            <Calendar className="w-4 h-4" /> Book Now
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative h-[70vh] bg-gradient-to-b from-rose-50 to-white dark:from-slate-900 dark:to-slate-950 flex items-center justify-center">
        {storeData?.banner_url && (
          <img src={storeData.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="relative z-10 text-center max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full mb-6"
          >
            <Scissors className="w-10 h-10 text-rose-600 dark:text-rose-400" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-light tracking-tight mb-4"
          >
            {storeName}
          </motion.h2>
          {storeData?.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-400 mb-8"
            >
              {storeData.description}
            </motion.p>
          )}
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            href="#services"
            className="inline-flex items-center gap-2 px-8 py-3 text-white rounded-full hover:opacity-90 transition font-light"
            style={{ backgroundColor: primaryColor }}
          >
            View Services <ChevronRight className="w-4 h-4" />
          </motion.a>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-light tracking-tight mb-2">Our Services</h2>
            <p className="text-gray-600">Professional care tailored for you</p>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">💅</div>
              <h3 className="text-xl font-light">Services coming soon</h3>
              {storeData?.whatsapp && (
                <a
                  href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`}
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-white rounded-lg hover:opacity-90 transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="w-5 h-5" /> WhatsApp Us
                </a>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, idx) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl transition"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-slate-800 overflow-hidden">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">💅</div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-2">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{service.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">TT${service.price.toFixed(2)}</span>
                      <button
                        onClick={() => handleWhatsApp(service)}
                        className="px-4 py-2 text-white rounded-lg text-sm hover:opacity-90 transition flex items-center gap-2"
                      style={{ backgroundColor: primaryColor }}
                      >
                        <MessageCircle className="w-4 h-4" /> Book
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY US */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light tracking-tight">Why Choose Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Award className="w-8 h-8 text-rose-600" />, title: 'Expert Stylists', desc: 'Trained professionals with years of experience' },
              { icon: <Clock className="w-8 h-8 text-rose-600" />, title: 'Flexible Hours', desc: 'Open 7 days a week for your convenience' },
              { icon: <Heart className="w-8 h-8 text-rose-600" />, title: 'Premium Products', desc: 'Only the best products for your care' },
            ].map((feature, idx) => (
              <div key={idx} className="text-center p-6 bg-white dark:bg-slate-800 rounded-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      {storeData && (
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-light tracking-tight mb-6">Get in Touch</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              {storeData.phone && (
                <a href={`tel:${storeData.phone}`} className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl hover:shadow-md transition">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">{storeData.phone}</span>
                </a>
              )}
              {storeData.whatsapp && (
                <a
                  href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`}
                  className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                >
                  <MessageCircle className="w-5 h-5" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-12 px-4 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 {storeName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PremiumBeautyTemplate;
