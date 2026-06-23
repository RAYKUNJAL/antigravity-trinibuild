import React, { useState } from 'react';
import { Clock, MapPin, Phone, Star, MessageCircle, Menu, X, ChevronRight } from 'lucide-react';
import type { Product, Store } from '../../types';

/**
 * CONVERSION-OPTIMIZED RESTAURANT TEMPLATE
 * Focus: Easy menu browsing + WhatsApp ordering
 */

import { getContrastColor } from './contrast';

export const PremiumRestaurantTemplate: React.FC<{
  storeName?: string;
  storeData?: Store;
  products?: Product[];
  primaryColor?: string;
}> = ({ storeName = 'Restaurant', storeData, products = [], primaryColor = '#DC2626' }) => {
  const contrastText = getContrastColor(primaryColor);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const menuItems = products.filter(p => p.status === 'active');
  const categories = ['all', ...Array.from(new Set(menuItems.map(p => p.category).filter(Boolean) as string[]))];
  const filteredItems = menuItems.filter(p => selectedCategory === 'all' || p.category === selectedCategory);

  const handleWhatsApp = (product: Product) => {
    const phone = storeData?.whatsapp || storeData?.phone || '';
    if (!phone) return;
    const msg = encodeURIComponent(`Hi! I'd like to order: ${product.name} (TT$${product.price.toFixed(2)})`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  const headingStyle = { fontFamily: "'Abril Fatface', serif" };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ─── HEADER: LOCATION + ORDER BUTTON ─── */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium tracking-tight" style={headingStyle}>{storeName}</h1>
            {storeData?.address && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {storeData.address}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {storeData?.phone && (
              <a href={`tel:${storeData.phone.replace(/\D/g, '')}`} className="p-2 text-gray-600">
                <Phone className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={() => handleWhatsApp({ id: 'reserve', name: `${storeName} Reservation`, price: 0, description: '', category: 'reservation', image_url: '', status: 'active', stock: 99 } as any)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full font-medium"
              style={{ backgroundColor: primaryColor, color: contrastText }}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">Reservations</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 p-4">
            <nav className="flex flex-col gap-3">
              <a href="#menu" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Menu</a>
              <a href="#about" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">About</a>
              <a href="#contact" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2">Contact</a>
            </nav>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section className="relative bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full text-xs font-medium mb-4">
                <Clock className="w-3.5 h-3.5" />
                Open Daily
              </div>
              <h2 className="text-4xl md:text-5xl font-light mb-4 tracking-tight" style={headingStyle}>
                {storeName}
              </h2>
              {storeData?.tagline && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{storeData.tagline}</p>
              )}
              {storeData?.description && (
                <p className="text-sm text-gray-500 mb-6 line-clamp-2">{storeData.description}</p>
              )}
              <div className="flex flex-wrap gap-3">
                <a
                  href="#menu"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium"
                >
                  View Menu <ChevronRight className="w-4 h-4" />
                </a>
                {storeData?.whatsapp && (
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium"
                    style={{ backgroundColor: primaryColor, color: contrastText }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    Reserve Table
                  </button>
                )}
              </div>
            </div>
            {storeData?.banner_url && (
              <div className="rounded-2xl overflow-hidden aspect-video md:aspect-square">
                <img src={storeData.banner_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── MENU ─── */}
      <section id="menu" className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-2" style={headingStyle}>Our Menu</h2>
            <p className="text-gray-500 text-sm">Order via WhatsApp — pay COD</p>
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="text-gray-500">Menu being updated. Contact us for today's specials!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-4 p-3 md:p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl hover:shadow-sm transition">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🍴</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm md:text-base mb-0.5">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs md:text-sm text-gray-500 line-clamp-1">{item.description}</p>
                    )}
                    <p className="text-sm font-semibold mt-1">TT${item.price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => handleWhatsApp(item)}
                    className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center gap-1.5 flex-shrink-0"
                    style={{ backgroundColor: primaryColor, color: contrastText }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      {storeData?.description && (
        <section id="about" className="py-12 md:py-16 px-4 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-light tracking-tight mb-4 text-center" style={headingStyle}>About {storeName}</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-center">{storeData.description}</p>
          </div>
        </section>
      )}

      {/* ─── CONTACT ─── */}
      <section id="contact" className="py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-light tracking-tight mb-8 text-center" style={headingStyle}>Get in Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {storeData?.phone && (
              <div className="p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-center">
                <Phone className="w-6 h-6 mx-auto mb-3 text-gray-600" />
                <div className="text-sm font-medium">{storeData.phone}</div>
                <a href={`tel:${storeData.phone.replace(/\D/g, '')}`} className="text-xs text-gray-500 hover:underline">Call now</a>
              </div>
            )}
            {storeData?.whatsapp && (
              <div className="p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-center">
                <MessageCircle className="w-6 h-6 mx-auto mb-3 text-green-600" />
                <div className="text-sm font-medium">{storeData.whatsapp}</div>
                <a href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`} className="text-xs text-green-600 hover:underline">WhatsApp</a>
              </div>
            )}
            {storeData?.address && (
              <div className="p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-center">
                <MapPin className="w-6 h-6 mx-auto mb-3 text-gray-600" />
                <div className="text-sm font-medium">Location</div>
                <div className="text-xs text-gray-500">{storeData.address}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-light tracking-tight mb-2" style={headingStyle}>Hungry?</h3>
          <p className="text-gray-500 text-sm mb-6">Order now on WhatsApp — COD available</p>
          {storeData?.whatsapp && (
            <button
              onClick={() => handleWhatsApp({ id: 'order', name: 'Order Inquiry', price: 0, description: '', category: 'order', image_url: '', status: 'active', stock: 99 } as any)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium hover:opacity-90 transition"
              style={{ backgroundColor: primaryColor, color: contrastText }}
            >
              <MessageCircle className="w-5 h-5" />
              Order Now
            </button>
          )}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-100 dark:border-slate-800 py-8 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 {storeName}</p>
          <p className="text-xs text-gray-400">Powered by <a href="https://trinibuild.com" className="underline">TriniBuild</a></p>
        </div>
      </footer>
    </div>
  );
};