import React, { useState } from 'react';
import { Clock, MapPin, Phone, Star, MessageCircle, Menu, X, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product, Store } from '../../types';

/**
 * PREMIUM RESTAURANT TEMPLATE
 * Fine dining and restaurant template
 * Real data driven - products rendered as menu items
 */

export const PremiumRestaurantTemplate: React.FC<{
  storeName?: string;
  storeData?: Store;
  products?: Product[];
  primaryColor?: string;
}> = ({ storeName = 'Restaurant', storeData, products = [], primaryColor = '#E61E2B' }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const menuItems = products.filter(p => p.status === 'active');
  const categories = ['all', ...Array.from(new Set(menuItems.map(p => p.category).filter(Boolean) as string[]))];
  const filteredItems = menuItems.filter(p => selectedCategory === 'all' || p.category === selectedCategory);

  const handleWhatsApp = (product: Product) => {
    const phone = storeData?.whatsapp || storeData?.phone || '';
    const msg = encodeURIComponent(`Hi! I'd like to order: ${product.name} (TT$${product.price})`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-light tracking-tight">{storeName}</h1>
              {storeData?.tagline && <p className="text-xs text-gray-500">{storeData.tagline}</p>}
            </div>
          </div>
          <a
            href={`https://wa.me/${(storeData?.whatsapp || storeData?.phone || '').replace(/\D/g, '')}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-full text-sm hover:opacity-90 transition"
            style={{ backgroundColor: primaryColor }}
          >
            <MessageCircle className="w-4 h-4" /> Order Now
          </a>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-slate-800 p-4">
            <nav className="flex flex-col gap-3">
              <a href="#menu" className="text-sm py-2">Menu</a>
              <a href="#about" className="text-sm py-2">About</a>
              <a href="#contact" className="text-sm py-2">Contact</a>
            </nav>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative h-[70vh] bg-gray-900 text-white flex items-center justify-center overflow-hidden">
        {storeData?.banner_url && (
          <img src={storeData.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="relative z-10 text-center max-w-4xl px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-light mb-6 tracking-tight"
          >
            {storeName}
          </motion.h2>
          {storeData?.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 mb-8"
            >
              {storeData.description}
            </motion.p>
          )}
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            href="#menu"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition font-light"
          >
            View Menu <ChevronRight className="w-4 h-4" />
          </motion.a>
        </div>
      </section>

      {/* INFO BAR */}
      <section className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {storeData?.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Phone</div>
                <div className="text-sm font-medium">{storeData.phone}</div>
              </div>
            </div>
          )}
          {storeData?.whatsapp && (
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">WhatsApp</div>
                <div className="text-sm font-medium">{storeData.whatsapp}</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-600" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Hours</div>
              <div className="text-sm font-medium">Open Daily</div>
            </div>
          </div>
        </div>
      </section>

      {/* MENU */}
      <section id="menu" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-light tracking-tight mb-2">Our Menu</h2>
            <p className="text-gray-600">Made with love, served with pride</p>
          </div>

          {/* Categories */}
          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    selectedCategory === cat
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'Everything' : cat}
                </button>
              ))}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-light">Menu coming soon</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">🍴</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900">TT${item.price.toFixed(2)}</span>
                    <button
                      onClick={() => handleWhatsApp(item)}
                      className="px-4 py-2 text-white rounded-lg text-sm hover:opacity-90 transition flex items-center gap-2"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <MessageCircle className="w-4 h-4" /> Order
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ABOUT */}
      {storeData?.description && (
        <section id="about" className="py-20 px-4 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-light tracking-tight mb-6">About {storeName}</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{storeData.description}</p>
            <div className="flex items-center justify-center gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm text-gray-600">5.0 (100+ reviews)</span>
            </div>
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-light tracking-tight mb-6">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {storeData?.phone && (
              <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl">
                <Phone className="w-6 h-6 mx-auto mb-3 text-gray-600" />
                <div className="text-sm font-medium">{storeData.phone}</div>
              </div>
            )}
            {storeData?.whatsapp && (
              <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl">
                <MessageCircle className="w-6 h-6 mx-auto mb-3 text-green-600" />
                <a href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`} className="text-sm font-medium text-green-600 hover:underline">
                  WhatsApp Us
                </a>
              </div>
            )}
            <div className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl">
              <MapPin className="w-6 h-6 mx-auto mb-3 text-gray-600" />
              <div className="text-sm font-medium">Trinidad & Tobago</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-12 px-4 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 {storeName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PremiumRestaurantTemplate;
