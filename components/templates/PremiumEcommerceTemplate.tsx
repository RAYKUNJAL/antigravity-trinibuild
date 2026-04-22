import React, { useState } from 'react';
import { ShoppingCart, Heart, Search, Filter, ChevronRight, Star, Truck, Shield, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * PREMIUM ECOMMERCE TEMPLATE
 * - Modern retail aesthetic
 * - Advanced product filters
 * - Smart recommendations
 * - Mobile-optimized
 */

export const PremiumEcommerceTemplate: React.FC<{ storeName?: string; storeData?: any }> = ({
  storeName = 'Premium Store',
  storeData
}) => {
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categories = [
    { id: 'all', name: 'All Products', count: 48 },
    { id: 'featured', name: 'Featured', count: 12 },
    { id: 'bestsellers', name: 'Bestsellers', count: 8 },
    { id: 'new', name: 'New Arrivals', count: 15 },
    { id: 'sale', name: 'On Sale', count: 10 }
  ];

  const products = [
    {
      id: 1,
      name: 'Premium Product 1',
      price: 'TT$899',
      originalPrice: 'TT$1,299',
      rating: 4.9,
      reviews: 156,
      image: '🎁',
      badge: 'Best Seller',
      inStock: true
    },
    {
      id: 2,
      name: 'Luxury Item 2',
      price: 'TT$1,499',
      originalPrice: null,
      rating: 5.0,
      reviews: 89,
      image: '✨',
      badge: 'Exclusive',
      inStock: true
    },
    {
      id: 3,
      name: 'Premium Product 3',
      price: 'TT$649',
      originalPrice: 'TT$899',
      rating: 4.8,
      reviews: 203,
      image: '🌟',
      badge: 'On Sale',
      inStock: true
    },
    {
      id: 4,
      name: 'Luxury Item 4',
      price: 'TT$1,199',
      originalPrice: null,
      rating: 4.9,
      reviews: 127,
      image: '💎',
      badge: 'New',
      inStock: true
    },
    {
      id: 5,
      name: 'Premium Product 5',
      price: 'TT$799',
      originalPrice: 'TT$1,099',
      rating: 4.7,
      reviews: 94,
      image: '🏆',
      badge: 'Popular',
      inStock: true
    },
    {
      id: 6,
      name: 'Luxury Item 6',
      price: 'TT$2,099',
      originalPrice: null,
      rating: 5.0,
      reviews: 45,
      image: '👑',
      badge: 'Premium',
      inStock: true
    },
    {
      id: 7,
      name: 'Premium Product 7',
      price: 'TT$549',
      originalPrice: 'TT$799',
      rating: 4.6,
      reviews: 178,
      image: '🎯',
      badge: null,
      inStock: true
    },
    {
      id: 8,
      name: 'Luxury Item 8',
      price: 'TT$1,799',
      originalPrice: null,
      rating: 4.9,
      reviews: 112,
      image: '🌺',
      badge: 'New',
      inStock: true
    }
  ];

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
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                <Heart className="w-5 h-5" />
              </button>
              <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative h-96 md:h-screen bg-gradient-to-r from-gray-900 to-slate-900 text-white flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }}
        />

        <div className="relative z-10 text-center max-w-4xl px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-light mb-6 tracking-tight"
          >
            Curated Excellence
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-300 mb-8"
          >
            Discover the finest selection of premium products
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-light tracking-wider text-sm"
          >
            Shop Now
          </motion.button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4"
          >
            <Truck className="w-8 h-8 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <div>
              <h3 className="font-light text-sm">Free Shipping</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">On orders over TT$500</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4"
          >
            <Shield className="w-8 h-8 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <div>
              <h3 className="font-light text-sm">Secure Payment</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">100% safe transactions</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <RotateCw className="w-8 h-8 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <div>
              <h3 className="font-light text-sm">Easy Returns</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">30-day return policy</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-light tracking-tight">Shop Products</h2>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 md:hidden"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Sidebar - Desktop */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden lg:block"
            >
              <div className="space-y-4">
                <h3 className="font-light text-sm uppercase tracking-wider">Categories</h3>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`block text-sm w-full text-left py-2 px-4 rounded-lg transition ${
                      selectedCategory === cat.id
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                        : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-light">{cat.name}</span>
                    <span className="text-xs opacity-60 ml-2">({cat.count})</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Products Grid */}
            <div className="lg:col-span-4">
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {products.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="group"
                  >
                    {/* Product Image */}
                    <div className="relative mb-4 aspect-square bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-7xl group-hover:scale-110 transition duration-300">
                        {product.image}
                      </div>

                      {product.badge && (
                        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 text-xs uppercase tracking-widest rounded-full">
                          {product.badge}
                        </div>
                      )}

                      <button className="absolute top-4 right-4 bg-white dark:bg-slate-700 rounded-full p-3 opacity-0 group-hover:opacity-100 transition">
                        <Heart className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => setCartCount(cartCount + 1)}
                        className="absolute bottom-0 left-0 right-0 bg-black text-white py-3 text-sm font-light transform translate-y-full group-hover:translate-y-0 transition duration-300"
                      >
                        Add to Cart
                      </button>
                    </div>

                    {/* Product Info */}
                    <h3 className="font-light mb-2">{product.name}</h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold">{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                            style={{ opacity: i < Math.floor(product.rating) ? 1 : 0.3 }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        ({product.reviews})
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 px-4 bg-gray-900 text-white text-center">
        <h2 className="text-3xl font-light mb-4">Exclusive Member Benefits</h2>
        <p className="text-gray-300 mb-6">Join our community and get early access to new products</p>
        <button className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-light">
          Sign Up Now
        </button>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-gray-400 py-12 px-4 text-center text-sm">
        <p>&copy; 2026 {storeName}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PremiumEcommerceTemplate;
