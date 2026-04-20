import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TRINIDAD_TEMPLATES, StoreTemplate } from '../services/templateService';
import { Sparkles, Store, TrendingUp, Zap } from 'lucide-react';

interface TemplateGalleryProps {
  onSelectTemplate?: (template: StoreTemplate) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Templates', icon: Store },
    { id: 'Food & Beverage', name: 'Food & Drinks', icon: Sparkles },
    { id: 'Retail', name: 'Retail Shops', icon: TrendingUp },
    { id: 'Services', name: 'Services', icon: Zap },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? TRINIDAD_TEMPLATES 
    : TRINIDAD_TEMPLATES.filter(t => t.category === selectedCategory);

  const getTierBadge = (tier: 'free' | 'pro' | 'premium') => {
    const styles = {
      free: 'bg-gray-100 text-gray-700 border-gray-300',
      pro: 'bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] text-white border-[#E61E2B]',
      premium: 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black border-[#FFD700]'
    };
    
    const labels = {
      free: 'FREE',
      pro: 'PRO',
      premium: 'PREMIUM'
    };

    return (
      <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border-2 ${styles[tier]}`}>
        {labels[tier]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-black mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Trinidad Store Templates
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
              Professional, conversion-optimized templates for Trinidad businesses. 
              Launch your store in minutes.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-3 overflow-x-auto">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              
              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap
                    flex items-center gap-2 transition-all
                    ${isActive 
                      ? 'bg-[#E61E2B] text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <Icon size={18} />
                  {category.name}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              className="group relative"
            >
              {/* Template Card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-[#E61E2B]">
                {/* Thumbnail */}
                <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {/* Placeholder thumbnail - in production, use actual images */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Store size={48} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-bold text-gray-500">{template.name}</p>
                    </div>
                  </div>
                  
                  {/* Tier Badge Overlay */}
                  <div className="absolute top-4 right-4">
                    {getTierBadge(template.tier)}
                  </div>

                  {/* Hover Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredTemplate === template.id ? 1 : 0 }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onSelectTemplate?.(template)}
                      className="px-6 py-3 bg-white text-[#E61E2B] font-black rounded-full hover:bg-[#E61E2B] hover:text-white transition-colors"
                    >
                      Use This Template
                    </motion.button>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 font-semibold">
                        {template.category}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Features Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.features.slice(0, 3).map((feature, i) => (
                      <span 
                        key={i}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* CRO Badge */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <Zap size={14} className="text-[#FFD700]" />
                    <span className="text-xs font-bold text-gray-600">
                      {template.mobile_first ? 'Mobile-First' : 'Desktop-First'} • 
                      {template.load_time_target}s Load Time
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-20">
            <Store size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-black text-gray-400 mb-2">No templates found</h3>
            <p className="text-gray-500">Try selecting a different category</p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Can't Find What You Need?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Upgrade to Premium for custom template design tailored to your brand.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white text-[#E61E2B] font-black rounded-full text-lg hover:bg-gray-100 transition-colors"
          >
            Get Custom Template - $299
          </motion.button>
        </div>
      </div>
    </div>
  );
};
