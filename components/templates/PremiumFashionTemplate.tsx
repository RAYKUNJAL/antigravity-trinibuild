import React, { useState } from 'react';
import { ShoppingBag, Heart, Search, Star, MessageCircle, Phone, Menu, X, Instagram, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product, Store } from '../../types';

/**
 * PREMIUM FASHION TEMPLATE
 * Luxury fashion and apparel boutique
 * Real data driven
 */

export const PremiumFashionTemplate: React.FC<{
  storeName?: string;
  storeData?: Store;
  products?: Product[];
  primaryColor?: string;
}> = ({ storeName = 'Fashion Store', storeData, products = [], primaryColor = '#BE185D' }) => {
  // UI/UX Pro Max: Fashion = Cormorant headings + Montserrat body
  const headingStyle = { fontFamily: "'Cormorant', serif" };
  const fontStyle = { fontFamily: "'Montserrat', sans-serif" };
  const [cart, setCart] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeProducts = products.filter(p => p.status === 'active');

  const handleWhatsApp = (product: Product) => {
    const phone = storeData?.whatsapp || storeData?.phone || '';
    const msg = encodeURIComponent(`Hi! I'm interested in ${product.name} (TT$${product.price}). Is it available?`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-light tracking-tight">{storeName}</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#shop" className="text-sm hover:text-gray-600">Shop</a>
            <a href="#about" className="text-sm hover:text-gray-600">About</a>
            <a href={`https://wa.me/${(storeData?.whatsapp || storeData?.phone || '').replace(/\D/g, '')}`} className="text-sm hover:text-gray-600">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 cursor-pointer" />
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {cart > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{cart}</span>
              )}
            </div>
          </div>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            className="md:hidden border-t border-gray-200 dark:border-slate-800"
          >
            <nav className="flex flex-col gap-4 p-4">
              <a href="#shop" className="text-sm" onClick={() => setMobileOpen(false)}>Shop</a>
              <a href="#about" className="text-sm" onClick={() => setMobileOpen(false)}>About</a>
              <a href={`https://wa.me/${(storeData?.whatsapp || storeData?.phone || '').replace(/\D/g, '')}`} className="text-sm" onClick={() => setMobileOpen(false)}>Contact</a>
            </nav>
          </motion.div>
        )}
      </header>

      {/* HERO */}
      {storeData?.banner_url ? (
        <div className="h-96 bg-cover bg-center" style={{ backgroundImage: `url(${storeData.banner_url})` }}>
          <div className="h-full bg-black/30 flex items-center justify-center">
            <div className="text-center text-white">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-light tracking-tight mb-4"
              >
                {storeName}
              </motion.h2>
              {storeData.tagline && <p className="text-xl text-white/90">{storeData.tagline}</p>}
            </div>
          </div>
        </div>
      ) : (
        <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-light tracking-tight mb-4"
          >
            {storeName}
          </motion.h2>
          {storeData?.description && <p className="text-gray-600 max-w-2xl mx-auto">{storeData.description}</p>}
        </section>
      )}

      {/* SHOP */}
      <section id="shop" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light tracking-tight mb-2">New Arrivals</h2>
            <p className="text-gray-600">Discover our latest collection</p>
          </div>

          {activeProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">👗</div>
              <h3 className="text-xl font-light">No products yet</h3>
              <p className="text-gray-500 mt-2">Check back soon for new arrivals</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group"
                >
                  <div className="relative aspect-[3/4] bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden mb-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">👗</div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setCart(cart + 1);
                            handleWhatsApp(product);
                          }}
                          className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 transition"
                        >
                          Order via WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-light text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{product.category || 'Fashion'}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">TT${product.price.toFixed(2)}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" style={{ opacity: i < 4 ? 1 : 0.3 }} />
                      ))}
                    </div>
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
            <h2 className="text-3xl font-light tracking-tight mb-6">About Us</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{storeData.description}</p>
            {storeData?.whatsapp && (
              <a
                href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-2 mt-8 px-8 py-3 text-white rounded-lg hover:opacity-90 transition"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageCircle className="w-5 h-5" /> Get in Touch
              </a>
            )}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-16 px-4 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-light uppercase tracking-wider text-sm mb-4">Contact</h4>
              {storeData?.phone && <p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="w-4 h-4" />{storeData.phone}</p>}
              {storeData?.whatsapp && <p className="text-sm text-gray-600 flex items-center gap-2 mt-2"><MessageCircle className="w-4 h-4" />{storeData.whatsapp}</p>}
            </div>
            <div>
              <h4 className="font-light uppercase tracking-wider text-sm mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <Instagram className="w-5 h-5 cursor-pointer text-gray-600" />
                <Facebook className="w-5 h-5 cursor-pointer text-gray-600" />
              </div>
            </div>
            <div>
              <h4 className="font-light uppercase tracking-wider text-sm mb-4">Payment</h4>
              <p className="text-sm text-gray-600">Cash on Delivery</p>
            </div>
            <div>
              <h4 className="font-light uppercase tracking-wider text-sm mb-4">Delivery</h4>
              <p className="text-sm text-gray-600">Island-wide delivery available</p>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-slate-800 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; 2026 {storeName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PremiumFashionTemplate;
