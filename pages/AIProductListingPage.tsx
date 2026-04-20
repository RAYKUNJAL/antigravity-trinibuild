import React from 'react';
import { motion } from 'framer-motion';
import { AIProductListing } from '../components/AIProductListing';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AIProductListingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[#E61E2B] font-semibold transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </motion.button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              AI Product Listing
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] rounded-2xl p-8 text-white mb-8">
            <h2 className="text-3xl font-black mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              📸 Take a Photo, AI Does the Rest
            </h2>
            <p className="text-lg text-white/90">
              Snap a picture of your product and our AI will generate a complete listing with 
              title, description, price suggestions, and tags. Perfect for Trinidad merchants!
            </p>
          </div>

          {/* AI Product Listing Component */}
          <AIProductListing />
        </motion.div>
      </div>
    </div>
  );
};
