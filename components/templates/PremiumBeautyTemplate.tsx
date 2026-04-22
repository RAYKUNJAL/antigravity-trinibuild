import React, { useState } from 'react';
import { Sparkles, Calendar, Users, MapPin, Phone, Star } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * PREMIUM BEAUTY/SALON TEMPLATE
 * - Luxurious spa aesthetic
 * - Service booking system
 * - Stylist showcase
 * - Premium animations
 */

export const PremiumBeautyTemplate: React.FC<{ storeName?: string; storeData?: any }> = ({
  storeName = 'Luxe Beauty Studio',
  storeData
}) => {
  const [selectedService, setSelectedService] = useState(0);
  const [bookingTab, setBookingTab] = useState('services');

  const services = [
    {
      name: 'Signature Facial',
      description: 'Customized facial treatment with premium skincare products',
      duration: '60 minutes',
      price: 'TT$285',
      icon: '✨',
      benefits: ['Deep cleanse', 'Hydration', 'Anti-aging', 'Glow boost']
    },
    {
      name: 'Luxury Hair Treatment',
      description: 'Professional hair restoration and styling service',
      duration: '90 minutes',
      price: 'TT$425',
      icon: '💇',
      benefits: ['Keratin treatment', 'Deep conditioning', 'Styling', 'Consultation']
    },
    {
      name: 'Swedish Massage',
      description: 'Relaxing full-body massage for ultimate rejuvenation',
      duration: '75 minutes',
      price: 'TT$395',
      icon: '💆',
      benefits: ['Muscle relaxation', 'Stress relief', 'Better circulation', 'Healing oils']
    },
    {
      name: 'Manicure & Pedicure',
      description: 'Premium nail care with luxury finishes',
      duration: '60 minutes',
      price: 'TT$245',
      icon: '💅',
      benefits: ['Nail care', 'Polish application', 'Nail art', 'Relaxation']
    },
    {
      name: 'Bridal Package',
      description: 'Complete pre-wedding beauty preparation',
      duration: '4 hours',
      price: 'TT$1,200',
      icon: '👰',
      benefits: ['Hair styling', 'Makeup', 'Nails', 'Skincare']
    },
    {
      name: 'Spa Day Package',
      description: 'Full day of pampering and rejuvenation',
      duration: '6 hours',
      price: 'TT$1,595',
      icon: '🧖',
      benefits: ['Multiple treatments', 'Lunch included', 'Lounge access', 'Beverages']
    }
  ];

  const stylists = [
    {
      name: 'Emma Rodriguez',
      specialty: 'Hair Styling',
      experience: '12 years',
      rating: 4.9,
      image: '👩‍🦰'
    },
    {
      name: 'Sofia Garcia',
      specialty: 'Makeup Artist',
      experience: '8 years',
      rating: 5.0,
      image: '💄'
    },
    {
      name: 'Maria Santos',
      specialty: 'Massage Therapist',
      experience: '15 years',
      rating: 4.9,
      image: '🧖‍♀️'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-pink-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <Sparkles className="w-6 h-6 text-pink-600" />
            <span className="text-xl font-light tracking-wider">{storeName}</span>
          </motion.div>

          <nav className="hidden md:flex gap-8">
            <a href="#" className="text-sm hover:text-pink-600 transition">Services</a>
            <a href="#" className="text-sm hover:text-pink-600 transition">Stylists</a>
            <a href="#" className="text-sm hover:text-pink-600 transition">About</a>
            <a href="#" className="text-sm hover:text-pink-600 transition">Contact</a>
          </nav>

          <button className="px-6 py-2 bg-pink-600 text-white rounded-full text-sm hover:bg-pink-700 transition">
            Book Now
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative py-32 px-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight">
            Radiant Beauty Awaits
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 font-light">
            Experience luxury beauty treatments in our serene sanctuary
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-4">
            <button className="px-8 py-4 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition font-light tracking-wider">
              Book Appointment
            </button>
            <button className="px-8 py-4 border-2 border-pink-600 text-pink-600 dark:border-pink-400 dark:text-pink-400 rounded-full hover:bg-pink-50 dark:hover:bg-slate-800 transition font-light tracking-wider">
              View Services
            </button>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* SERVICES SECTION */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light mb-4 tracking-tight">Our Services</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Handpicked treatments for your complete wellness
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300"
            >
              <div className="h-40 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-6xl group-hover:scale-110 transition duration-300">
                {service.icon}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-light mb-2">{service.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {service.description}
                </p>

                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    {service.duration}
                  </span>
                  <span className="font-semibold text-pink-600">{service.price}</span>
                </div>

                <div className="space-y-2 mb-4">
                  {service.benefits.map((benefit, i) => (
                    <p key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                      <span className="w-1.5 h-1.5 bg-pink-600 rounded-full mr-2"></span>
                      {benefit}
                    </p>
                  ))}
                </div>

                <button className="w-full py-3 border-2 border-pink-600 text-pink-600 dark:border-pink-400 dark:text-pink-400 rounded-full hover:bg-pink-50 dark:hover:bg-slate-700 transition font-light text-sm">
                  Learn More
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STYLISTS SECTION */}
      <section className="py-20 px-4 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-light mb-16 tracking-tight text-center">Meet Our Stylists</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stylists.map((stylist, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="w-48 h-48 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center text-7xl">
                  {stylist.image}
                </div>

                <h3 className="text-2xl font-light mb-2">{stylist.name}</h3>
                <p className="text-pink-600 font-light mb-4">{stylist.specialty}</p>

                <div className="flex justify-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {stylist.experience} experience
                </p>

                <button className="px-6 py-2 border border-pink-600 text-pink-600 dark:border-pink-400 dark:text-pink-400 rounded-full hover:bg-pink-50 dark:hover:bg-slate-700 transition text-sm">
                  Book with {stylist.name.split(' ')[0]}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 px-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light mb-4">Special Offer: First-Time Clients</h2>
          <p className="text-lg opacity-90 mb-8">Get 20% off your first service with code WELCOME20</p>
          <button className="px-8 py-3 bg-white text-pink-600 rounded-full hover:bg-pink-50 transition font-light tracking-wider">
            Claim Offer
          </button>
        </div>
      </section>

      {/* CONTACT INFO */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <MapPin className="w-8 h-8 mx-auto mb-4 text-pink-600" />
            <h3 className="font-light mb-2">Location</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              789 Beauty Avenue<br />
              Port of Spain, Trinidad
            </p>
          </div>
          <div>
            <Phone className="w-8 h-8 mx-auto mb-4 text-pink-600" />
            <h3 className="font-light mb-2">Contact</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              +1 (868) 555-BEAUTY<br />
              info@luxebeauty.tt
            </p>
          </div>
          <div>
            <Calendar className="w-8 h-8 mx-auto mb-4 text-pink-600" />
            <h3 className="font-light mb-2">Hours</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mon-Sat: 10am - 8pm<br />
              Sun: 12pm - 6pm
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>&copy; 2026 {storeName}. Where beauty meets wellness.</p>
      </footer>
    </div>
  );
};

export default PremiumBeautyTemplate;
