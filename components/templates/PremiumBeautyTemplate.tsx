import React, { useState } from 'react';
import { Star, MessageCircle, Phone, Clock, Award, Heart, Instagram, Scissors, ChevronRight } from 'lucide-react';
import type { Product, Store } from '../../types';

/**
 * CONVERSION-OPTIMIZED BEAUTY TEMPLATE
 * Focus: Direct booking via WhatsApp
 */

import { getContrastColor } from './contrast';
import { getPlaceholderImage } from './placeholderImage';

/** Swap a broken image to the generic placeholder exactly once. */
const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = '1';
  img.src = getPlaceholderImage();
};

export const PremiumBeautyTemplate: React.FC<{
  storeName?: string;
  storeData?: Store;
  products?: Product[];
  primaryColor?: string;
}> = ({ storeName = 'Beauty Studio', storeData, products = [], primaryColor = '#EC4899' }) => {
  const contrastText = getContrastColor(primaryColor);
  const headingStyle = { fontFamily: "'Lora', serif" };
  const [selectedService, setSelectedService] = useState(0);

  const services = products.filter(p => p.status === 'active');

  const handleWhatsApp = (product: Product) => {
    const phone = storeData?.whatsapp || storeData?.phone || '';
    if (!phone) return;
    const msg = encodeURIComponent(`Hi! I'd like to book: ${product.name} (TT$${product.price}). Is it available?`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-medium tracking-tight" style={headingStyle}>{storeName}</h1>
            {storeData?.tagline && <p className="text-xs text-gray-500 hidden md:block">{storeData.tagline}</p>}
          </div>
          <div className="flex items-center gap-2">
            {storeData?.phone && <a href={`tel:${storeData.phone.replace(/\D/g, '')}`} className="p-2 text-gray-600"><Phone className="w-5 h-5" /></a>}
            {storeData?.whatsapp && (
              <button onClick={() => services[0] && handleWhatsApp(services[0])} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full font-medium" style={{ backgroundColor: primaryColor, color: contrastText }}>
                <MessageCircle className="w-4 h-4" />
                <span className="hidden md:inline">Book Now</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950 py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-light mb-4 tracking-tight" style={headingStyle}>
              {storeData?.name || storeName}
            </h2>
            {storeData?.tagline && <p className="text-lg text-gray-600 mb-4">{storeData.tagline}</p>}
            {storeData?.description && <p className="text-sm text-gray-500 mb-6">{storeData.description}</p>}
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium mb-4">
              <Heart className="w-4 h-4" />
              Cash on Delivery — Pay when you receive
            </div>
            <div className="flex flex-wrap gap-3">
              {services.map((s, i) => (
                <button key={s.id} onClick={() => handleWhatsApp(s)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium" style={{ backgroundColor: primaryColor, color: contrastText }}>
                  <MessageCircle className="w-5 h-5" />
                  Book {s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { icon: <Award className="w-5 h-5" />, text: 'Expert stylists' },
              { icon: <Clock className="w-5 h-5" />, text: 'Flexible hours' },
              { icon: <Heart className="w-5 h-5" />, text: 'Premium products' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl">
                <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-700">{item.icon}</div>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-8 text-center" style={headingStyle}>Our Services</h2>
          {services.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">Services coming soon. Contact us to book!</p>
              {storeData?.whatsapp && (
                <button onClick={() => handleWhatsApp({ id: 'general', name: 'General Inquiry', price: 0, category: 'general', description: '', image_url: '', status: 'active', stock: 99 } as any)} className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl" style={{ backgroundColor: primaryColor, color: contrastText }}>
                  <MessageCircle className="w-5 h-5" /> Contact Us
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map(service => (
                <div key={service.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition">
                  <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-800">
                    <img
                      src={service.image_url || getPlaceholderImage(service.category || 'beauty', service.id)}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={onImgError}
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-medium mb-1">{service.name}</h3>
                    {service.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{service.description}</p>}
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-semibold">TT${service.price.toFixed(2)}</span>
                      <button onClick={() => handleWhatsApp(service)} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg" style={{ backgroundColor: primaryColor, color: contrastText }}>
                        <MessageCircle className="w-4 h-4" /> Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light tracking-tight mb-6" style={headingStyle}>Get in Touch</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {storeData?.phone && (
              <a href={`tel:${storeData.phone.replace(/\D/g, '')}`} className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl hover:shadow-md transition">
                <Phone className="w-5 h-5 text-gray-600" />
                <span className="font-medium">{storeData.phone}</span>
              </a>
            )}
            {storeData?.whatsapp && (
              <a href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`} className="flex items-center gap-3 px-6 py-3 rounded-xl font-medium hover:opacity-90 transition" style={{ backgroundColor: primaryColor, color: contrastText }}>
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-100 dark:border-slate-800 py-8 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto text-center text-xs text-gray-400">
          <p>© 2026 {storeName} · Powered by <a href="https://trinibuild.com" className="underline">TriniBuild</a></p>
        </div>
      </footer>
    </div>
  );
};