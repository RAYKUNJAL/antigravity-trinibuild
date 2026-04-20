import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, TrendingUp, Users, Zap, Award, Target, 
  BarChart3, Mail, Share2, Gift, Lock, Crown 
} from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: any;
  tier: 'free' | 'pro' | 'premium';
  service: string;
  comingSoon?: boolean;
}

export const PremiumFeaturesDashboard: React.FC = () => {
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'premium'>('free');

  const features: Feature[] = [
    {
      id: 'ai-search',
      name: 'AI-Powered Search',
      description: 'Trinidad-specific search with natural language understanding',
      icon: Sparkles,
      tier: 'pro',
      service: 'aiSearchService'
    },
    {
      id: 'gamification',
      name: 'Loyalty & Rewards',
      description: 'Points, badges, and daily rewards to boost engagement',
      icon: Gift,
      tier: 'pro',
      service: 'gamificationService'
    },
    {
      id: 'trust-score',
      name: 'Trust Score System',
      description: 'Build credibility with verified reviews and ratings',
      icon: Award,
      tier: 'pro',
      service: 'trustScoreService'
    },
    {
      id: 'viral-loops',
      name: 'Viral Referral System',
      description: 'Turn customers into brand ambassadors with rewards',
      icon: Share2,
      tier: 'pro',
      service: 'viralLoopsService'
    },
    {
      id: 'recommender',
      name: 'AI Product Recommendations',
      description: 'Smart product suggestions based on user behavior',
      icon: Target,
      tier: 'pro',
      service: 'recommenderService'
    },
    {
      id: 'keyword-engine',
      name: 'SEO Keyword Engine',
      description: 'Auto-optimize content for Trinidad search trends',
      icon: TrendingUp,
      tier: 'premium',
      service: 'keywordEngineService'
    },
    {
      id: 'social-content',
      name: 'Social Media Automation',
      description: 'Auto-generate and schedule social posts',
      icon: Share2,
      tier: 'premium',
      service: 'socialContentService'
    },
    {
      id: 'blog-automation',
      name: 'Blog Auto-Pilot',
      description: 'AI writes 2 blog posts/day automatically',
      icon: Mail,
      tier: 'premium',
      service: 'blogAutomationService'
    },
    {
      id: 'ai-concierge',
      name: 'AI Business Concierge',
      description: '24/7 AI assistant for your store',
      icon: Sparkles,
      tier: 'premium',
      service: 'conciergeService'
    },
    {
      id: 'watermark',
      name: 'Auto Watermark Engine',
      description: 'Protect your product images automatically',
      icon: Zap,
      tier: 'pro',
      service: 'watermarkEngine'
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      description: 'Deep insights into customer behavior',
      icon: BarChart3,
      tier: 'premium',
      service: 'platformAnalyticsService'
    }
  ];

  const getTierInfo = (tier: 'free' | 'pro' | 'premium') => {
    const info = {
      free: {
        name: 'Free',
        price: '$0',
        color: 'gray',
        gradient: 'from-gray-400 to-gray-600'
      },
      pro: {
        name: 'Pro',
        price: '$29/mo',
        color: '[#E61E2B]',
        gradient: 'from-[#E61E2B] to-[#C41E3A]'
      },
      premium: {
        name: 'Premium',
        price: '$99/mo',
        color: '[#FFD700]',
        gradient: 'from-[#FFD700] to-[#FFA500]'
      }
    };
    return info[tier];
  };

  const canAccessFeature = (feature: Feature): boolean => {
    const tierLevel = { free: 0, pro: 1, premium: 2 };
    return tierLevel[userTier] >= tierLevel[feature.tier];
  };

  const groupedFeatures = {
    free: features.filter(f => f.tier === 'free'),
    pro: features.filter(f => f.tier === 'pro'),
    premium: features.filter(f => f.tier === 'premium')
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-black mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Premium Features
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
              Unlock powerful AI tools and automation to grow your Trinidad business faster.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Current Plan Selector (Demo) */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <p className="text-sm font-bold text-gray-600 mb-3">Current Plan (Demo):</p>
          <div className="flex gap-3">
            {(['free', 'pro', 'premium'] as const).map((tier) => {
              const info = getTierInfo(tier);
              const isActive = userTier === tier;
              
              return (
                <motion.button
                  key={tier}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserTier(tier)}
                  className={`
                    px-6 py-3 rounded-full font-black text-sm transition-all
                    ${isActive 
                      ? `bg-gradient-to-r ${info.gradient} text-white shadow-lg` 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {info.name} - {info.price}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {/* Pro Features */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Crown className="text-[#E61E2B]" size={32} />
            <h2 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              Pro Features
            </h2>
            <span className="px-3 py-1 bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] text-white text-xs font-black rounded-full">
              $29/MONTH
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedFeatures.pro.map((feature, index) => {
              const Icon = feature.icon;
              const unlocked = canAccessFeature(feature);
              
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: unlocked ? -4 : 0 }}
                  className={`
                    relative bg-white rounded-xl p-6 border-2 transition-all
                    ${unlocked 
                      ? 'border-[#E61E2B] shadow-lg hover:shadow-xl cursor-pointer' 
                      : 'border-gray-200 opacity-60'
                    }
                  `}
                >
                  {/* Lock Overlay */}
                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/5 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Lock size={32} className="text-gray-400" />
                    </div>
                  )}

                  <div className={`${!unlocked ? 'blur-sm' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] text-white">
                        <Icon size={24} />
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {feature.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {feature.description}
                    </p>

                    {unlocked && (
                      <button className="w-full px-4 py-2 bg-[#E61E2B] text-white font-bold rounded-lg hover:bg-[#C41E3A] transition-colors">
                        Configure
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Premium Features */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Crown className="text-[#FFD700]" size={32} />
            <h2 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              Premium Features
            </h2>
            <span className="px-3 py-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black text-xs font-black rounded-full">
              $99/MONTH
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedFeatures.premium.map((feature, index) => {
              const Icon = feature.icon;
              const unlocked = canAccessFeature(feature);
              
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: unlocked ? -4 : 0 }}
                  className={`
                    relative bg-white rounded-xl p-6 border-2 transition-all
                    ${unlocked 
                      ? 'border-[#FFD700] shadow-lg hover:shadow-xl cursor-pointer' 
                      : 'border-gray-200 opacity-60'
                    }
                  `}
                >
                  {/* Lock Overlay */}
                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/5 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Lock size={32} className="text-gray-400" />
                    </div>
                  )}

                  <div className={`${!unlocked ? 'blur-sm' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black">
                        <Icon size={24} />
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {feature.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {feature.description}
                    </p>

                    {unlocked && (
                      <button className="w-full px-4 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-bold rounded-lg hover:opacity-90 transition-opacity">
                        Configure
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {userTier === 'free' && (
        <div className="bg-gradient-to-r from-[#E61E2B] to-[#C41E3A] text-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Ready to Unlock Premium Features?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Start with Pro at $29/month and grow your Trinidad business 10x faster.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-[#E61E2B] font-black rounded-full text-lg hover:bg-gray-100 transition-colors"
            >
              Upgrade to Pro - $29/month
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};
