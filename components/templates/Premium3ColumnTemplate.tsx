import React, { useState } from 'react';
import { ShoppingCart, Heart, Share2, Star, ChevronRight, X, Menu, MessageCircle,Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product,Store } from '../../types';

/**
 * PREMIUM 3-COLUMN LAYOUT TEMPLATE
 * Inspired by Openfront's proven e-commerce architecture
 * Real data driven - no dummy products
 */

export const Premium3ColumnTemplate: React.FC<{
  storeName?: string;
  storeData?: Store;
  products?: Product[];
  primaryColor?: string;
}> = ({ storeName = 'Premium Store', storeData, products = [], primaryColor = '#E61E2B' }) => {
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const realProducts = products.filter(p => p.status === 'active');
  const currentProduct = realProducts[selectedProduct] || {
    id: 'fallback',
    name: storeName,
    description: storeData?.description || 'Welcome to our store',
    price: 0,
    image_url: null,
    store_id: '',
    slug: '',
    compare_at_price: undefined,
    stock: 0,
    sku: undefined,
    gallery_images: [],
    category: null,
    category_ids: [],
    variants: [],
    seo: {},
    specifications: {},
    status: 'active',
    created_at: ''
  };

  const handleWhatsApp = (product: Product) => {
    const phone = storeData?.whatsapp || storeData?.phone || '';
    const msg = encodeURIComponent(`Hi! I'm interested in ${product.name} (TT$${product.price}). Is it available?`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-full px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-light tracking-tight">{storeName}</h1>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#shop" className="text-sm hover:text-gray-600 dark:hover:text-gray-300">Shop</a>
              <a href={`https://wa.me/${(storeData?.whatsapp || storeData?.phone || '').replace(/\D/g, '')}`} className="text-sm hover:text-gray-600 dark:hover:text-gray-300">Contact</a>
            </nav>

            <button
              onClick={() => setCartOpen(!cartOpen)}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              className="mt-4 py-4 border-t border-gray-200 dark:border-slate-800 md:hidden"
            >
              <nav className="flex flex-col gap-3">
                <a href="#shop" className="text-sm py-2">Shop</a>
                <a href={`https://wa.me/${(storeData?.whatsapp || storeData?.phone || '').replace(/\D/g, '')}`} className="text-sm py-2">Contact</a>
              </nav>
            </motion.div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {realProducts.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-light mb-2">Welcome to {storeName}</h2>
            <p className="text-gray-500">Products coming soon. Check back later!</p>
            {storeData?.whatsapp && (
              <a
                href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <MessageCircle className="w-5 h-5" /> WhatsApp Us
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8" id="shop">
            {/* LEFT COLUMN: Product Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:col-span-3 md:sticky md:top-32"
            >
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-light tracking-tight mb-2">{currentProduct.name}</h2>
                  {currentProduct.description && (
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      {currentProduct.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-semibold">TT${currentProduct.price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Availability</p>
                  <p className="text-sm">
                    {(currentProduct.stock ?? 0) > 0 ? (
                      <span className="text-green-600">✓ In Stock</span>
                    ) : (
                      <span className="text-red-600">Out of Stock</span>
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCart(cart + 1);
                      handleWhatsApp(currentProduct);
                    }}
                    className="flex-1 py-3 text-white rounded-lg hover:opacity-90 transition font-light text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <MessageCircle className="w-4 h-4" /> Order via WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>

            {/* CENTER COLUMN: Product Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-6"
            >
              <div className="space-y-4">
                <div className="aspect-square bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                  {currentProduct.image_url ? (
                    <img
                      src={currentProduct.image_url}
                      alt={currentProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-9xl text-gray-300">📦</div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-3 md:sticky md:top-32"
            >
              <div className="space-y-4">
                <h3 className="font-light text-sm uppercase tracking-wider">All Products</h3>
                <div className="space-y-3">
                  {realProducts.map((product, idx) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(idx)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition text-left ${
                        selectedProduct === idx
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">📦</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{product.name}</div>
                        <div className="text-xs text-gray-500">TT${product.price.toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-slate-800 mt-20 py-12 px-4 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 {storeName}. All rights reserved.</p>
          {storeData?.whatsapp && (
            <p className="mt-2">
              <a href={`https://wa.me/${storeData.whatsapp.replace(/\D/g, '')}`} className="text-green-600 hover:underline">
                WhatsApp: {storeData.whatsapp}
              </a>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Premium3ColumnTemplate;
