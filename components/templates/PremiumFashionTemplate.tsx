import React, { useState } from 'react';
import { Heart, ShoppingCart, Star, ChevronRight, Search, User, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * PREMIUM FASHION TEMPLATE
 * - Luxury brand aesthetic
 * - High-res product showcase
 * - Premium animations
 * - Mobile-first responsive
 */

export const PremiumFashionTemplate: React.FC<{ storeName?: string; storeData?: any }> = ({
  storeName = 'Luxury Boutique',
  storeData
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const featuredProducts = [
    {
      id: 1,
      name: 'Premium Silk Dress',
      price: 'TT$2,499',
      image: '👗',
      rating: 4.9,
      reviews: 128,
      inStock: true,
      badge: 'New'
    },
    {
      id: 2,
      name: 'Cashmere Coat',
      price: 'TT$3,899',
      image: '🧥',
      rating: 5.0,
      reviews: 95,
      inStock: true,
      badge: 'Premium'
    },
    {
      id: 3,
      name: 'Designer Handbag',
      price: 'TT$4,199',
      image: '👜',
      rating: 4.8,
      reviews: 156,
      inStock: true,
      badge: 'Exclusive'
    },
    {
      id: 4,
      name: 'Luxury Sunglasses',
      price: 'TT$1,599',
      image: '😎',
      rating: 4.9,
      reviews: 203,
      inStock: true,
      badge: 'Best Seller'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold tracking-tight"
          >
            {storeName}
          </motion.div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex gap-8">
            <a href="#" className="text-sm tracking-wide hover:text-gray-600 dark:hover:text-gray-400 transition">
              NEW
            </a>
            <a href="#" className="text-sm tracking-wide hover:text-gray-600 dark:hover:text-gray-400 transition">
              COLLECTION
            </a>
            <a href="#" className="text-sm tracking-wide hover:text-gray-600 dark:hover:text-gray-400 transition">
              ABOUT
            </a>
            <a href="#" className="text-sm tracking-wide hover:text-gray-600 dark:hover:text-gray-400 transition">
              CONTACT
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <button className="hidden md:block">
              <Search className="w-5 h-5" />
            </button>
            <button className="hidden md:block">
              <User className="w-5 h-5" />
            </button>
            <button className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            className="md:hidden border-t border-gray-200 dark:border-gray-800"
          >
            <nav className="flex flex-col py-4 px-4 gap-4">
              <a href="#" className="text-sm tracking-wide">NEW</a>
              <a href="#" className="text-sm tracking-wide">COLLECTION</a>
              <a href="#" className="text-sm tracking-wide">ABOUT</a>
              <a href="#" className="text-sm tracking-wide">CONTACT</a>
            </nav>
          </motion.div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10"
        >
          <h1 className="text-6xl md:text-8xl font-light mb-6 tracking-tight">
            Elegance
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 font-light">
            Discover curated luxury for the discerning taste
          </p>
          <button className="px-12 py-4 border-2 border-black dark:border-white text-black dark:text-white uppercase tracking-widest text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition duration-300">
            Explore Collection
          </button>
        </motion.div>

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full filter blur-3xl"></div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-light mb-4 tracking-tight">Featured</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-12">
          Hand-selected pieces from our premium collection
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group cursor-pointer"
              onMouseEnter={() => setSelectedProduct(idx)}
            >
              {/* Product Image */}
              <div className="relative mb-4 aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden rounded-sm group-hover:shadow-xl transition duration-300">
                <div className="w-full h-full flex items-center justify-center text-9xl">
                  {product.image}
                </div>

                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-4 left-4 bg-black dark:bg-white text-white dark:text-black px-3 py-1 text-xs uppercase tracking-widest">
                    {product.badge}
                  </div>
                )}

                {/* Wishlist */}
                <button className="absolute top-4 right-4 bg-white dark:bg-black rounded-full p-3 opacity-0 group-hover:opacity-100 transition">
                  <Heart className="w-5 h-5" />
                </button>

                {/* Quick Add */}
                <button
                  onClick={() => setCartCount(cartCount + 1)}
                  className="absolute bottom-0 left-0 right-0 bg-black dark:bg-white text-white dark:text-black py-3 uppercase text-xs tracking-widest font-medium transform translate-y-full group-hover:translate-y-0 transition duration-300"
                >
                  Add to Cart
                </button>
              </div>

              {/* Product Info */}
              <h3 className="text-lg font-light tracking-tight mb-2">{product.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{product.price}</p>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-current"
                      style={{
                        opacity: i < Math.floor(product.rating) ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  ({product.reviews})
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* LUXURY SECTION */}
      <section className="py-20 px-4 bg-black dark:bg-white text-white dark:text-black">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-light mb-4 tracking-tight">Premium Selection</h2>
          <p className="text-lg opacity-80 mb-8">
            Each piece is carefully sourced and curated for exceptional quality
          </p>
          <button className="px-12 py-4 border-2 border-white dark:border-black text-white dark:text-black uppercase tracking-widest text-sm hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition duration-300">
            View All
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-black dark:hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">Shipping Info</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">Returns</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-black dark:hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-black dark:hover:text-white">Instagram</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">Facebook</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">WhatsApp</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <input
              type="email"
              placeholder="Your email"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-sm rounded-sm"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 {storeName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PremiumFashionTemplate;
