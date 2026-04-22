import React, { useState } from 'react';
import { Clock, MapPin, Phone, Star, ChevronDown, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * PREMIUM RESTAURANT TEMPLATE
 * - Sophisticated dining aesthetic
 * - Menu showcase with categories
 * - Reservation system
 * - Premium animations
 */

export const PremiumRestaurantTemplate: React.FC<{ storeName?: string; storeData?: any }> = ({
  storeName = 'Elegant Dining',
  storeData
}) => {
  const [selectedCategory, setSelectedCategory] = useState('appetizers');
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const menuItems = {
    appetizers: [
      {
        name: 'Truffle Risotto Croquettes',
        description: 'Golden fried risotto with black truffle and parmesan',
        price: 'TT$185',
        icon: '🍤'
      },
      {
        name: 'Pan Seared Foie Gras',
        description: 'With warm brioche and fig reduction',
        price: 'TT$275',
        icon: '🥘'
      },
      {
        name: 'Chilled Lobster Bisque',
        description: 'Served with caviar and crispy croutons',
        price: 'TT$165',
        icon: '🦞'
      }
    ],
    mains: [
      {
        name: 'Pan Seared Snapper',
        description: 'With roasted vegetables and lemon beurre blanc',
        price: 'TT$395',
        icon: '🐟'
      },
      {
        name: 'Prime Ribeye Steak',
        description: '350g grain-fed, with truffle mash and seasonal vegetables',
        price: 'TT$575',
        icon: '🥩'
      },
      {
        name: 'Duck Confit',
        description: 'With cherry gastrique and polenta fries',
        price: 'TT$425',
        icon: '🦆'
      }
    ],
    desserts: [
      {
        name: 'Dark Chocolate Torte',
        description: 'With raspberry coulis and vanilla ice cream',
        price: 'TT$145',
        icon: '🍫'
      },
      {
        name: 'Passion Fruit Cheesecake',
        description: 'With coconut crumb and mango sorbet',
        price: 'TT$155',
        icon: '🎂'
      },
      {
        name: 'Tiramisu Classico',
        description: 'Traditional Italian preparation with espresso',
        price: 'TT$125',
        icon: '☕'
      }
    ]
  };

  const categories = ['appetizers', 'mains', 'desserts'];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* HERO SECTION */}
      <header className="relative h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }}
        />

        <div className="relative z-10 text-center max-w-4xl px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-6xl md:text-8xl font-light mb-6 tracking-tight"
          >
            {storeName}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 font-light"
          >
            A culinary journey of taste and refinement
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <button className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white uppercase tracking-widest text-sm transition duration-300">
              Reserve Table
            </button>
            <button className="px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-slate-900 uppercase tracking-widest text-sm transition duration-300">
              View Menu
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </header>

      {/* MENU SECTION */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-light mb-12 tracking-tight text-center">Our Menu</h2>

        {/* Category Tabs */}
        <div className="flex justify-center gap-8 mb-16 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`text-lg capitalize tracking-wider transition duration-300 pb-2 border-b-2 ${
                selectedCategory === category
                  ? 'text-amber-600 border-amber-600'
                  : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {menuItems[selectedCategory as keyof typeof menuItems].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="mb-4 text-6xl">{item.icon}</div>
              <h3 className="text-xl font-light mb-2 tracking-tight">{item.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">
                {item.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-amber-600 font-semibold">{item.price}</span>
                <button
                  onClick={() => setCartCount(cartCount + 1)}
                  className="p-2 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-full transition"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* RESTAURANT INFO */}
      <section className="bg-slate-100 dark:bg-slate-900 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Clock className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <h3 className="text-lg font-light mb-2">Hours</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Tue - Thu: 5pm - 11pm<br />
              Fri - Sat: 5pm - 12am<br />
              Sun: 12pm - 10pm<br />
              Closed Mondays
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <MapPin className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <h3 className="text-lg font-light mb-2">Location</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              123 Luxury Lane<br />
              Port of Spain<br />
              Trinidad & Tobago
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <Phone className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <h3 className="text-lg font-light mb-2">Contact</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              +1 (868) 555-DINE<br />
              reservations@{storeName.toLowerCase().replace(/\s/g, '')}.tt<br />
              WhatsApp: Message us anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-light mb-12 tracking-tight text-center">What Guests Say</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Michelle R.', text: 'An unforgettable dining experience. Every dish was a masterpiece.' },
            { name: 'David T.', text: 'The ambiance, the food, the service - absolutely impeccable.' },
            { name: 'Lisa P.', text: 'Best fine dining restaurant in Trinidad. Highly recommended!' }
          ].map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="border border-gray-200 dark:border-gray-800 p-8 rounded-lg"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-600 text-amber-600" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">"{testimonial.text}"</p>
              <p className="font-light text-sm">{testimonial.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* RESERVATION CTA */}
      <section className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-light mb-4">Reserve Your Table</h2>
          <p className="text-gray-300 mb-8">
            Experience fine dining crafted with passion and precision. Limited reservations available.
          </p>
          <button className="px-12 py-4 bg-amber-600 hover:bg-amber-700 uppercase tracking-widest text-sm transition duration-300">
            Book Now
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-gray-400 py-12 px-4 text-sm">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2026 {storeName}. All rights reserved. Crafted for the discerning palate.</p>
        </div>
      </footer>
    </div>
  );
};

export default PremiumRestaurantTemplate;
