import React, { useState } from 'react';
import { Star, MessageCircle, Phone, Heart, Instagram, Facebook, ChevronRight } from 'lucide-react';
import type { Product, Store } from '../../types';

/**
 * CONVERSION-OPTIMIZED FASHION TEMPLATE
 * Luxury, image-first, direct WhatsApp ordering
 */

import { getContrastColor } from './contrast';

export const PremiumFashionTemplate: React.FC<{
  storeName?: string;
  storeData?: Store;
  products?: Product[];
  primaryColor?: string;
}> = ({ storeName = 'Fashion Store', storeData, products = [], primaryColor = '#BE185D' }) => {
  const contrastText = getContrastColor(primaryColor);
  const headingStyle = { fontFamily: "'Cormorant', serif" };
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeProducts = products.filter(p => p.status === 'active');

  const handleWhatsApp = (product: Product) => {
    const phone = storeData?.whatsapp || storeData?.phone || '';
    const msg = encodeURIComponent(`Hi! I'm interested in ${product.name} (TT$${product.price.toFixed(2)}). Is it available?`);
    window.open(`https://wa.me/${phone.replace(/\\D/g, '')}?text=${msg}`, '_blank');
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
            {storeData?.phone && <a href={`tel:${storeData.phone.replace(/\\D/g, '')}`} className="p-2 text-gray-600"><Phone className="w-5 h-5" /></a>}
            {storeData?.whatsapp && (
              <button onClick={() => { if (activeProducts[0]) handleWhatsApp(activeProducts[0]); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full font-medium" style={{ backgroundColor: primaryColor, color: contrastText }}>
                <MessageCircle className="w-4 h-4" />
                <span className="hidden md:inline">Shop</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-light mb-4 tracking-tight" style={headingStyle}>
                {storeData?.name || storeName}
              </h2>
              {storeData?.tagline && <p className="text-lg text-gray-600 mb-4">{storeData.tagline}</p>}
              {storeData?.description && <p className="text-sm text-gray-500 mb-6">{storeData.description}</p>}
              <div className="flex flex-wrap gap-3">
                <a href="#shop" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium">
                  Shop Now <ChevronRight className="w-4 h-4" />
                </a>
                {storeData?.whatsapp && (
                  <button onClick={() => { if (activeProducts[0]) handleWhatsApp(activeProducts[0]); }} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium" style={{ backgroundColor: primaryColor, color: contrastText }}>
                    <MessageCircle className="w-5 h-5" />
                    Order via WhatsApp
                  </button>
                )}
              </div>
            </div>
            {storeData?.banner_url && (
              <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                <img src={storeData.banner_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-800">
          <div className="flex items-center justify-center gap-3 py-4">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">Curated Quality</span>
          </div>
          <div className="flex items-center justify-center gap-3 py-4">
            <MessageCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Order via WhatsApp</span>
          </div>
          <div className="flex items-center justify-center gap-3 py-4">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span className="text-sm font-medium">COD Available</span>
          </div>
        </div>
      </section>

      {/* ─── PRODUCTS ─── */}
      <section id="shop" className="py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-light tracking-tight" style={headingStyle}>New Arrivals</h2>
            <p className="text-gray-500 text-sm mt-1">{activeProducts.length} products available</p>
          </div>

          {activeProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-3">👗</div>
              <p className="text-gray-500">No products yet — check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {activeProducts.map(product => (
                <div key={product.id} className="group bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition">
                  <div className="relative aspect-[3/4] bg-gray-100 dark:bg-slate-800">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">👗</div>
                    )}
                    {product.stock > 0 && product.stock <= 4 && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs rounded-lg font-medium">
                        Only {product.stock} left
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/70 flex items-center justify-center">
                        <span className="px-3 py-1 bg-gray-900 text-white text-sm rounded-lg">Sold Out</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm md:text-base mb-1 line-clamp-1">{product.name}</h3>
                    {product.category && <p className="text-xs text-gray-500 mb-2">{product.category}</p>}
                    <div className="flex items-end justify-between mb-3">
                      <span className="text-base md:text-lg font-semibold">TT${product.price.toFixed(2)}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" style={{ opacity: s <= 4 ? 1 : 0.3 }} />)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleWhatsApp(product)}
                      disabled={product.stock === 0}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                      style={{ backgroundColor: primaryColor, color: contrastText }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Order via WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      {storeData?.description && (
        <section className="py-12 md:py-16 px-4 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-light tracking-tight mb-4" style={headingStyle}>About {storeName}</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{storeData.description}</p>
            {storeData?.whatsapp && (
              <a href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`} className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl font-medium" style={{ backgroundColor: primaryColor, color: contrastText }}>
                <MessageCircle className="w-5 h-5" /> Get in Touch
              </a>
            )}
          </div>
        </section>
      )}

      {/* ─── BOTTOM CTA ─── */}
      {storeData?.whatsapp && (
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto rounded-2xl p-8 md:p-10 text-center" style={{ backgroundColor: primaryColor, color: contrastText }}>
            <h3 className="text-2xl font-light tracking-tight mb-2" style={headingStyle}>Like what you see?</h3>
            <p className="mb-6 text-sm md:text-base" style={{ color: contrastText, opacity: 0.8 }}>Order now via WhatsApp — fast COD delivery across Trinidad</p>
            <a href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`} className="inline-flex items-center gap-2 px-8 py-3 bg-white rounded-xl font-medium hover:bg-gray-100 transition" style={{ color: primaryColor }}>
              <MessageCircle className="w-5 h-5" /> Start Shopping
            </a>
          </div>
        </section>
      )}

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-100 dark:border-slate-800 py-8 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">© 2026 {storeName}</p>
            {storeData?.phone && <a href={`tel:${storeData.phone}`} className="text-sm text-gray-500 hover:underline">{storeData.phone}</a>}
          </div>
          <p className="text-xs text-gray-400">Powered by <a href="https://trinibuild.com" className="underline">TriniBuild</a></p>
        </div>
      </footer>
    </div>
  );
};