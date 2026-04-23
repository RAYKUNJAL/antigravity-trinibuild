import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Star, MapPin, Truck, Award } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  location: string;
  logo: string;
  description: string;
  followers: number;
  verified: boolean;
}

export const VendorDirectoryPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'recent' | 'followers'>('rating');
  const [loading, setLoading] = useState(true);

  const categories = [
    'All Vendors',
    'Electronics',
    'Fashion',
    'Food & Beverage',
    'Home & Garden',
    'Health & Beauty',
    'Services',
    'Arts & Crafts'
  ];

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [vendors, searchTerm, selectedCategory, sortBy]);

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .limit(50);

      if (error) throw error;

      // Mock vendor data if no real data
      const mockVendors: Vendor[] = [
        {
          id: '1',
          name: 'TechHub Trinidad',
          category: 'Electronics',
          rating: 4.9,
          reviews: 247,
          location: 'Port of Spain',
          logo: '📱',
          description: 'Latest gadgets and electronics at competitive prices',
          followers: 1205,
          verified: true
        },
        {
          id: '2',
          name: 'Caribbean Fashion Co',
          category: 'Fashion',
          rating: 4.8,
          reviews: 189,
          location: 'San Fernando',
          logo: '👗',
          description: 'Designer fashion and local Caribbean styles',
          followers: 987,
          verified: true
        },
        {
          id: '3',
          name: 'Island Eats Kitchen',
          category: 'Food & Beverage',
          rating: 4.7,
          reviews: 312,
          location: 'Chaguanas',
          logo: '🍽️',
          description: 'Authentic Caribbean cuisine and local delicacies',
          followers: 1543,
          verified: true
        },
        {
          id: '4',
          name: 'Green Thumb Gardens',
          category: 'Home & Garden',
          rating: 4.6,
          reviews: 156,
          location: 'Tobago',
          logo: '🌿',
          description: 'Plants, seeds, and gardening supplies',
          followers: 654,
          verified: false
        },
        {
          id: '5',
          name: 'Beauty Paradise',
          category: 'Health & Beauty',
          rating: 4.8,
          reviews: 298,
          location: 'Port of Spain',
          logo: '💄',
          description: 'Premium skincare and beauty products',
          followers: 1342,
          verified: true
        },
        {
          id: '6',
          name: 'Handcraft Studio',
          category: 'Arts & Crafts',
          rating: 4.5,
          reviews: 124,
          location: 'Arima',
          logo: '🎨',
          description: 'Unique handmade crafts and artwork',
          followers: 523,
          verified: false
        }
      ];

      setVendors(data?.length ? data : mockVendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSort = () => {
    let filtered = vendors;

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(v => v.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'followers':
        filtered.sort((a, b) => b.followers - a.followers);
        break;
      case 'recent':
        filtered.reverse();
        break;
    }

    setFilteredVendors(filtered);
  };

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <motion.section 
        className="bg-gradient-to-r from-[#E61E2B] to-red-700 text-white py-12"
        variants={item}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black mb-4">Discover Merchants</h1>
          <p className="text-red-100 text-lg">Browse thousands of verified sellers across Trinidad & Tobago</p>
        </div>
      </motion.section>

      {/* Filters & Search */}
      <motion.div 
        className="bg-white border-b border-gray-200 sticky top-16 z-30"
        variants={item}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors, products, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E61E2B] focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex overflow-x-auto gap-2 pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'All Vendors' ? 'all' : cat)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                  (cat === 'All Vendors' && selectedCategory === 'all') || selectedCategory === cat
                    ? 'bg-[#E61E2B] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-4 mt-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-[#E61E2B]"
            >
              <option value="rating">Sort by Rating</option>
              <option value="followers">Sort by Popularity</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Vendors Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#E61E2B] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {filteredVendors.map((vendor) => (
              <motion.div
                key={vendor.id}
                variants={item}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition"
              >
                {/* Vendor Header */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-6 text-center">
                  <div className="text-5xl mb-3">{vendor.logo}</div>
                  <h3 className="text-xl font-bold text-gray-900">{vendor.name}</h3>
                  {vendor.verified && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-[#E61E2B]">
                      <Award className="w-4 h-4" />
                      <span className="text-sm font-bold">Verified Seller</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  <p className="text-gray-600 text-sm line-clamp-2">{vendor.description}</p>

                  {/* Rating & Reviews */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4"
                            fill={i < Math.floor(vendor.rating) ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{vendor.rating}</span>
                    </div>
                    <span className="text-sm text-gray-600">({vendor.reviews} reviews)</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    {vendor.location}
                  </div>

                  {/* Followers */}
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Truck className="w-4 h-4" />
                    {vendor.followers.toLocaleString()} followers
                  </div>

                  {/* Badge */}
                  <div className="pt-4 border-t border-gray-200">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                      {vendor.category}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="p-6 pt-0">
                  <button className="w-full bg-[#E61E2B] text-white py-2 rounded-lg font-bold hover:bg-red-700 transition">
                    Visit Store
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Results Count */}
        <div className="text-center mt-8 text-gray-600">
          Showing {filteredVendors.length} of {vendors.length} vendors
        </div>
      </div>
    </div>
  );
};
