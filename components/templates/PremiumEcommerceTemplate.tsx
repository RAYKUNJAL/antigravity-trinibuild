import React, { useState } from 'react';
import { ShoppingCart, MessageCircle, Phone, Star, Truck, Shield, RotateCw, ChevronRight, ExternalLink } from 'lucide-react';
import type { Product, Store } from '../../types';

/**
 * CONVERSION-OPTIMIZED E-COMMERCE TEMPLATE
 * Based on proven T&T e-commerce patterns:
 * - WhatsApp-first ordering (COD is king in T&T)
 * - Immediate trust signals
 * - Stock urgency + social proof
 * - Mobile sticky CTA
 * - FAQ to reduce objections
 * - Fast: no heavy libs, minimal state
 */

import { getContrastColor } from './contrast';

export const PremiumEcommerceTemplate: React.FC<{
  storeName?: string;
  storeData?: Store;
  products?: Product[];
  primaryColor?: string;
}> = ({ storeName = 'Store', storeData, products = [], primaryColor = '#059669' }) => {
  const contrastText = getContrastColor(primaryColor);
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))];

  const activeProducts = products.filter(p => p.status === 'active');
  const outOfStock = products.filter(p => p.stock === 0);
  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);

  const filteredProducts = activeProducts.filter(p => {
    const catMatch = selectedCategory === 'all' || p.category === selectedCategory;
    return catMatch;
  });

  const handleWhatsApp = (product?: Product) => {
    const phone = storeData?.whatsapp || storeData?.phone || '';
    if (!phone) return;
    let msg = `Hi! I'm interested in ${storeName}`;
    if (product) {
      msg += ` — ${product.name} (TT$${product.price.toFixed(2)})`;
    }
    msg += '. Is it available for COD?';
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCall = () => {
    const phone = storeData?.phone || storeData?.whatsapp || '';
    if (phone) window.location.href = `tel:${phone.replace(/\D/g, '')}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── STICKY HEADER WITH WHATSAPP FIRST ─── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-medium tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {storeName}
            </h1>
            {storeData?.tagline && (
              <p className="text-xs text-gray-500 hidden md:block">{storeData.tagline}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {storeData?.phone && (
              <button onClick={handleCall} className="p-2 text-gray-600 hover:text-gray-900" title="Call">
                <Phone className="w-5 h-5" />
              </button>
            )}
            {storeData?.whatsapp && (
              <button
                onClick={() => handleWhatsApp()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full"
                style={{ backgroundColor: primaryColor, color: contrastText }}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden md:inline">Order on WhatsApp</span>
                <span className="md:hidden">Chat</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO: VALUE PROP IN 3s ─── */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full text-xs font-medium mb-4">
                <Shield className="w-3.5 h-3.5" />
                Cash on Delivery
              </div>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {storeData?.name || storeName}
              </h2>
              {storeData?.tagline && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{storeData.tagline}</p>
              )}
              {storeData?.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">{storeData.description}</p>
              )}
              <div className="flex flex-wrap gap-3">
                {storeData?.whatsapp && (
                  <button
                    onClick={() => handleWhatsApp()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium"
                    style={{ backgroundColor: primaryColor, color: contrastText }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    Order via WhatsApp
                  </button>
                )}
                {storeData?.phone && (
                  <button onClick={handleCall} className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:border-gray-300">
                    <Phone className="w-4 h-4" />
                    Call Us
                  </button>
                )}
              </div>
              <a href="#products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mt-6">
                Browse products <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="hidden md:grid grid-cols-3 gap-3">
              {filteredProducts.slice(0, 3).map(p => (
                <div key={p.id} className="aspect-[4/5] bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  )}
                  {p.stock <= 5 && p.stock > 0 && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-medium">
                      Only {p.stock} left
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR: 3 PROOF POINTS ─── */}
      <section className="border-y border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-800">
          <div className="flex items-center justify-center gap-3 py-4 px-2">
            <Truck className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="text-left">
              <div className="text-sm font-medium">Cash on Delivery</div>
              <div className="text-xs text-gray-500">Pay when you get it</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 py-4 px-2">
            <Shield className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="text-left">
              <div className="text-sm font-medium">Verified Store</div>
              <div className="text-xs text-gray-500">Built on TriniBuild</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 py-4 px-2">
            <MessageCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="text-left">
              <div className="text-sm font-medium">WhatsApp Support</div>
              <div className="text-xs text-gray-500">Chat anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRODUCTS ─── */}
      <section id="products" className="py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {filteredProducts.length > 0 ? 'Shop Now' : 'Coming Soon'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
              </p>
            </div>
            {categories.length > 2 && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Filter
              </button>
            )}
          </div>

          {/* Mobile filter pills */}
          {showFilters && categories.length > 2 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 md:hidden">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Desktop side filter */}
          {categories.length > 2 && (
            <div className="hidden md:flex gap-8">
              <aside className="w-40 flex-shrink-0 space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`block w-full text-left px-4 py-2 rounded-lg text-sm transition ${
                      selectedCategory === cat
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-black font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-900 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {cat === 'all' ? 'All Products' : cat}
                  </button>
                ))}
              </aside>
              <div className="flex-1" />
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-500">Products will appear here when added.</p>
              {activeProducts.length === 0 && (
                <button
                  onClick={() => handleWhatsApp()}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium"
                  style={{ backgroundColor: primaryColor, color: contrastText }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Ask about availability
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map(product => {
                const isLow = product.stock > 0 && product.stock <= 5;
                const isOut = product.stock === 0;
                return (
                  <div key={product.id} className="group bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition">
                    <div className="relative aspect-square bg-gray-50 dark:bg-slate-800">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                      )}
                      {isLow && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs rounded-lg font-medium shadow-sm">
                          Only {product.stock} left
                        </div>
                      )}
                      {isOut && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 flex items-center justify-center">
                          <span className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg font-medium">Sold Out</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-medium text-sm md:text-base mb-1 line-clamp-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{product.description}</p>
                      )}
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-lg md:text-xl font-semibold">TT${product.price.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleWhatsApp(product)}
                          disabled={isOut}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ backgroundColor: primaryColor, color: contrastText }}
                        >
                          <MessageCircle className="w-4 h-4" />
                          Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      {activeProducts.length >= 3 && (
        <section className="py-12 px-4 bg-gray-50 dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-light" style={{ fontFamily: "'Outfit', sans-serif" }}>{activeProducts.length}</div>
                <div className="text-sm text-gray-500">Products Available</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <div className="text-sm text-gray-500">Trusted by customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-light" style={{ fontFamily: "'Outfit', sans-serif" }}>TT${(activeProducts.reduce((s, p) => s + p.price, 0) / Math.max(1, activeProducts.length)).toFixed(0)}</div>
                <div className="text-sm text-gray-500">Average price</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ (REDUCES OBJECTIONS) ─── */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight text-center mb-8" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Common Questions
          </h2>
          <div className="space-y-3">
            {[
              { q: 'How does Cash on Delivery work?', a: 'You order via WhatsApp, we confirm availability, and you pay only when you receive your item. No online payment needed.' },
              { q: 'What areas do you deliver to?', a: storeData?.address || 'Contact us to confirm delivery to your area in Trinidad & Tobago.' },
              { q: 'How long does delivery take?', a: 'Usually same-day or next-day depending on your location and product availability.' },
              { q: 'Can I return or exchange?', a: 'Yes — if a product is damaged or wrong, contact us within 24 hours of delivery for return/exchange.' },
            ].map((item, i) => (
              <div key={i} className="border border-gray-100 dark:border-slate-800 rounded-xl">
                <button
                  onClick={() => setShowFAQ(!showFAQ)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-sm md:text-base">{item.q}</span>
                  <span className={`text-xs text-gray-400 transition ${showFAQ ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {showFAQ && (
                  <p className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      {storeData?.whatsapp && (
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto rounded-2xl p-8 md:p-12 text-center" style={{ backgroundColor: primaryColor, color: contrastText }}>
            <h2 className="text-2xl md:text-3xl font-light mb-3 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Ready to order?
            </h2>
            <p className="mb-6 text-sm md:text-base" style={{ color: contrastText, opacity: 0.8 }}>Chat with us now — fast response, COD available</p>
            <button
              onClick={() => handleWhatsApp()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white rounded-xl font-medium hover:bg-gray-100 transition"
              style={{ color: primaryColor }}
            >
              <MessageCircle className="w-5 h-5" />
              Start WhatsApp Order
            </button>
          </div>
        </section>
      )}

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-100 dark:border-slate-800 py-12 px-4 bg-gray-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-medium mb-3">{storeName}</h4>
            <p className="text-sm text-gray-500 mb-4">{storeData?.description || 'Your trusted store on TriniBuild.'}</p>
            {storeData?.phone && (
              <a href={`tel:${storeData.phone.replace(/\D/g, '')}`} className="inline-flex items-center gap-2 text-sm hover:opacity-70">
                <Phone className="w-4 h-4" /> {storeData.phone}
              </a>
            )}
          </div>
          <div>
            <h4 className="font-medium mb-3">Visit Us</h4>
            {storeData?.address ? (
              <p className="text-sm text-gray-500">{storeData.address}</p>
            ) : (
              <p className="text-sm text-gray-500">Trinidad & Tobago</p>
            )}
          </div>
          <div>
            <h4 className="font-medium mb-3">Payments</h4>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
              <Truck className="w-3.5 h-3.5" />
              Cash on Delivery
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 text-center text-xs text-gray-400">
          <p>Powered by <a href="https://trinibuild.com" className="underline">TriniBuild</a> • {storeName} © 2026</p>
        </div>
      </footer>
    </div>
  );
};