import React, { useState } from 'react';
import { ShoppingCart, Heart, Share2, Star, ChevronRight, X, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * PREMIUM 3-COLUMN LAYOUT TEMPLATE
 * Inspired by Openfront's proven e-commerce architecture:
 * - Left sidebar: Product info (sticky on desktop)
 * - Center: Product images (hero section)
 * - Right sidebar: Actions (sticky on desktop)
 * - Mobile: Stacked layout
 */

export const Premium3ColumnTemplate: React.FC<{ storeName?: string }> = ({
  storeName = 'Premium Store'
}) => {
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const products = [
    {
      id: 1,
      name: 'Premium Leather Jacket',
      price: 'TT$2,299',
      originalPrice: 'TT$3,299',
      rating: 4.9,
      reviews: 156,
      description: 'Handcrafted premium leather jacket with Italian stitching. Perfect for any occasion.',
      images: ['🧥', '👔', '🎨'],
      inStock: true,
      category: 'Outerwear',
      colors: ['Black', 'Brown', 'Cognac'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    },
    {
      id: 2,
      name: 'Luxury Watch',
      price: 'TT$4,899',
      originalPrice: null,
      rating: 5.0,
      reviews: 89,
      description: 'Swiss-made automatic watch with sapphire crystal and leather strap.',
      images: ['⌚', '💎', '✨'],
      inStock: true,
      category: 'Accessories',
      colors: ['Silver', 'Gold', 'Black'],
      sizes: ['One Size']
    },
    {
      id: 3,
      name: 'Cashmere Sweater',
      price: 'TT$1,599',
      originalPrice: 'TT$2,099',
      rating: 4.8,
      reviews: 203,
      description: 'Pure 100% cashmere sweater. Soft, warm, and luxuriously comfortable.',
      images: ['🧶', '👕', '💫'],
      inStock: true,
      category: 'Knitwear',
      colors: ['Navy', 'Cream', 'Charcoal', 'Burgundy'],
      sizes: ['XS', 'S', 'M', 'L', 'XL']
    }
  ];

  const currentProduct = products[selectedProduct];

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
              <a href="#" className="text-sm hover:text-gray-600 dark:hover:text-gray-300">Shop</a>
              <a href="#" className="text-sm hover:text-gray-600 dark:hover:text-gray-300">About</a>
              <a href="#" className="text-sm hover:text-gray-600 dark:hover:text-gray-300">Contact</a>
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
                <a href="#" className="text-sm py-2">Shop</a>
                <a href="#" className="text-sm py-2">About</a>
                <a href="#" className="text-sm py-2">Contact</a>
              </nav>
            </motion.div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* MAIN PRODUCT LAYOUT - 3 COLUMNS (Desktop) / STACKED (Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Product Info (Sticky on desktop) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-3 md:sticky md:top-32"
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-light tracking-tight mb-2">{currentProduct.name}</h2>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        style={{ opacity: i < Math.floor(currentProduct.rating) ? 1 : 0.3 }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentProduct.rating} ({currentProduct.reviews} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-semibold">{currentProduct.price}</span>
                  {currentProduct.originalPrice && (
                    <span className="text-lg text-gray-400 line-through">{currentProduct.originalPrice}</span>
                  )}
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {currentProduct.description}
              </p>

              {/* Options */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-light uppercase tracking-wider mb-2 block">
                    Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {currentProduct.colors.map((color) => (
                      <button
                        key={color}
                        className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded hover:border-gray-600 dark:hover:border-gray-400 text-xs transition"
                      >
                        {color.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-light uppercase tracking-wider mb-2 block">
                    Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {currentProduct.sizes.map((size) => (
                      <button
                        key={size}
                        className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded hover:border-gray-600 dark:hover:border-gray-400 text-xs transition"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Availability</p>
                <p className="text-sm mt-2">
                  {currentProduct.inStock ? (
                    <span className="text-green-600">✓ In Stock - Ships in 2-3 business days</span>
                  ) : (
                    <span className="text-red-600">Out of Stock</span>
                  )}
                </p>
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
              {/* Main image */}
              <div className="aspect-square bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center text-9xl group cursor-pointer">
                {currentProduct.images[0]}
              </div>

              {/* Thumbnail gallery */}
              <div className="flex gap-4">
                {currentProduct.images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`w-20 h-20 rounded-lg flex items-center justify-center text-4xl transition ${
                      idx === 0
                        ? 'border-2 border-gray-900 dark:border-white'
                        : 'border border-gray-300 dark:border-slate-600 hover:border-gray-900 dark:hover:border-white'
                    }`}
                  >
                    {img}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Actions (Sticky on desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3 md:sticky md:top-32"
          >
            <div className="space-y-4">
              <button
                onClick={() => setCart(cart + 1)}
                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition font-light tracking-wider uppercase text-sm"
              >
                Add to Cart
              </button>

              <button className="w-full py-4 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition font-light flex items-center justify-center gap-2">
                <Heart className="w-5 h-5" />
                Save for Later
              </button>

              <button className="w-full py-4 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition font-light flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" />
                Share
              </button>

              {/* Product details accordion */}
              <div className="mt-8 space-y-4 border-t border-gray-200 dark:border-slate-800 pt-8">
                <details className="cursor-pointer">
                  <summary className="font-light text-sm uppercase tracking-wider py-3 hover:text-gray-600 dark:hover:text-gray-300">
                    + Shipping Information
                  </summary>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Orders ship within 2-3 business days. Free shipping on orders over TT$500.
                  </p>
                </details>

                <details className="cursor-pointer">
                  <summary className="font-light text-sm uppercase tracking-wider py-3 hover:text-gray-600 dark:hover:text-gray-300">
                    + Returns & Exchanges
                  </summary>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                    30-day returns on unworn items. Free return shipping on first return.
                  </p>
                </details>

                <details className="cursor-pointer">
                  <summary className="font-light text-sm uppercase tracking-wider py-3 hover:text-gray-600 dark:hover:text-gray-300">
                    + Care Instructions
                  </summary>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Hand wash in cold water. Lay flat to dry. Store in dry place away from direct sunlight.
                  </p>
                </details>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32"
        >
          <h3 className="text-3xl font-light mb-8">You Might Also Like</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product, idx) => (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedProduct(idx)}
                className="text-left group"
              >
                <div className="aspect-square bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center text-8xl group-hover:scale-105 transition duration-300 mb-4">
                  {product.images[0]}
                </div>
                <h4 className="font-light text-lg mb-2">{product.name}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{product.price}</p>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                      style={{ opacity: i < Math.floor(product.rating) ? 1 : 0.3 }}
                    />
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-slate-800 mt-32 py-16 px-4 md:px-6 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-light uppercase tracking-wider text-sm mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-black dark:hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">Shipping Info</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">Returns</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-light uppercase tracking-wider text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-black dark:hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-light uppercase tracking-wider text-sm mb-4">Follow Us</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-black dark:hover:text-white">Instagram</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">Facebook</a></li>
              <li><a href="#" className="hover:text-black dark:hover:text-white">WhatsApp</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-light uppercase tracking-wider text-sm mb-4">Newsletter</h4>
            <input
              type="email"
              placeholder="Your email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-sm"
            />
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-slate-800 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 {storeName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Premium3ColumnTemplate;
