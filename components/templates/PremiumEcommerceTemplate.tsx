import React, { useState } from 'react';
import { ShoppingCart, Heart, Search, Filter, ChevronRight, Star, Truck, Shield, RotateCw, MessageCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product, Store } from '../../types';

/**
 * PREMIUM ECOMMERCE TEMPLATE
 * - Modern retail aesthetic
 * - Advanced product filters
 * - Smart recommendations
 * - Mobile-optimized
 * - Real data driven
 */

export const PremiumEcommerceTemplate: React.FC<{
  storeName?: string;
  storeData?: Store;
  products?: Product[];
  primaryColor?: string;
}> = ({ storeName = 'Premium Store', storeData, products = [], primaryColor = '#059669' }) => {
  // UI/UX Pro Max: E-commerce = Outfit headings + Work Sans body
  const headingStyle = { fontFamily: "'Outfit', sans-serif" };
  const fontStyle = { fontFamily: "'Work Sans', sans-serif" };
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = true;
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.status === 'active';
  });

  const handleAddToCart = (product: Product) => {
    setCartCount(prev => prev + 1);
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 1500);
  };

  const handleWhatsApp = (product: Product) => {
    const phone = storeData?.whatsapp || storeData?.phone || '';
    const msg = encodeURIComponent(`Hi! I'm interested in ${product.name} (TT$${product.price}). Is it available?`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-light tracking-tight">{storeName}</h1>
            <div className="flex items-center gap-4">
              <button className="hidden md:block p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      {storeData?.description && (
        <section className="relative h-64 md:h-96 bg-gradient-to-r from-gray-900 to-slate-900 text-white flex items-center justify-center overflow-hidden">
          <div className="relative z-10 text-center max-w-4xl px-4">
            <h2 className="text-4xl md:text-6xl font-light mb-4 tracking-tight">
              {storeData.name}
            </h2>
            {storeData.tagline && (
              <p className="text-xl text-gray-300 mb-6">{storeData.tagline}</p>
            )}
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">{storeData.description}</p>
            <a
              href="#products"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-light tracking-wider text-sm"
            >
              Shop Now <ChevronRight className="w-4 h-4" />
            </a>
            {storeData?.whatsapp && (
              <a
                href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-2 px-8 py-3 text-white rounded-lg hover:opacity-90 transition font-light ml-3"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageCircle className="w-5 h-5" /> WhatsApp Us
              </a>
            )}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <Truck className="w-8 h-8 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <div>
              <h3 className="font-light text-sm">Cash on Delivery</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pay when you receive</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <div>
              <h3 className="font-light text-sm">Verified Store</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">TriniBuild trusted</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <MessageCircle className="w-8 h-8 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <div>
              <h3 className="font-light text-sm">WhatsApp Support</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Chat with us anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-light tracking-tight">
              {filteredProducts.length > 0 ? 'Our Products' : 'Coming Soon'}
            </h2>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 md:hidden"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-light text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-500">This store is getting ready. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Sidebar - Desktop */}
              {categories.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden lg:block"
                >
                  <div className="space-y-4">
                    <h3 className="font-light text-sm uppercase tracking-wider">Categories</h3>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`block text-sm w-full text-left py-2 px-4 rounded-lg transition ${
                          selectedCategory === cat
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="font-light capitalize">{cat === 'all' ? 'All Products' : cat}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Products Grid */}
              <div className={categories.length > 1 ? 'lg:col-span-4' : 'lg:col-span-5'}>
                <motion.div
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {filteredProducts.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                      className="group"
                    >
                      {/* Product Image */}
                      <div className="relative mb-4 aspect-square bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                        ) : (
                          <div className="text-6xl text-gray-300">📦</div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-medium px-3 py-1 bg-black/70 rounded">Out of Stock</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <h3 className="font-light mb-2 line-clamp-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-semibold text-lg">TT${product.price.toFixed(2)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className="flex-1 py-2.5 text-white rounded-lg hover:opacity-90 transition text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {addedToCart === product.id ? 'Added!' : 'Add to Cart'}
                        </button>
                        <button
                          onClick={() => handleWhatsApp(product)}
                          className="px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                          title="Order via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA SECTION */}
      {storeData?.whatsapp && (
        <section className="py-16 px-4 bg-gray-900 text-white text-center">
          <h2 className="text-3xl font-light mb-4">Want to order?</h2>
          <p className="text-gray-300 mb-6">Chat with us on WhatsApp for COD orders</p>
          <a
            href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-light"
          >
            <MessageCircle className="w-5 h-5" /> WhatsApp Us
          </a>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-slate-800 mt-20 py-16 px-4 md:px-6 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-light uppercase tracking-wider text-sm mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {storeData?.phone && <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> {storeData.phone}</li>}
              {storeData?.whatsapp && <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4" /> {storeData.whatsapp}</li>}
            </ul>
          </div>
          <div>
            <h4 className="font-light uppercase tracking-wider text-sm mb-4">About</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {storeData?.description || `${storeName} on TriniBuild`}
            </p>
          </div>
          <div>
            <h4 className="font-light uppercase tracking-wider text-sm mb-4">Payments</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cash on Delivery (COD)</p>
          </div>
          <div>
            <h4 className="font-light uppercase tracking-wider text-sm mb-4">Follow Us</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-black dark:hover:text-white">Instagram</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">Facebook</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-slate-800 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 {storeName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PremiumEcommerceTemplate;
