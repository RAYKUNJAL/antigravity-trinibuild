import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { PRICING_PLANS, PricingTier } from '../services/pricingService';
import { useNavigate } from 'react-router-dom';

interface UpgradeCTAProps {
  currentTier: PricingTier;
  feature: string;
  context?: 'inline' | 'modal' | 'banner';
  onClose?: () => void;
}

export const UpgradeCTA: React.FC<UpgradeCTAProps> = ({
  currentTier,
  feature,
  context = 'inline',
  onClose
}) => {
  const navigate = useNavigate();
  
  const targetTier: PricingTier = currentTier === 'free' ? 'pro' : 'premium';
  const targetPlan = PRICING_PLANS[targetTier];

  const handleUpgrade = () => {
    navigate(`/pricing?upgrade=${targetTier}&from=${currentTier}`);
  };

  if (context === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-trini-red to-red-700 text-white p-4 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6" />
            <div>
              <p className="font-bold">{feature} is available on {targetPlan.name}</p>
              <p className="text-sm text-white/80">
                Unlock for just ${targetPlan.price.monthly}/month
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpgrade}
              className="px-6 py-2 bg-white text-trini-red rounded-lg font-bold hover:bg-gray-100"
            >
              Upgrade Now
            </motion.button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (context === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full relative"
        >
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-trini-red to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              Unlock {feature}
            </h2>
            <p className="text-gray-600">
              Available on {targetPlan.name} plan
            </p>
          </div>

          {/* Plan Highlights */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-gray-900 mb-3">
              What you'll get with {targetPlan.name}:
            </p>
            <ul className="space-y-2">
              {targetPlan.features.slice(1, 6).map((feat, i) => (
                feat.included && (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-trini-red flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feat.name}</span>
                  </li>
                )
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="mb-6 p-4 bg-gradient-to-br from-trini-red/10 to-red-100 rounded-xl">
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="text-3xl font-black text-gray-900">
                ${targetPlan.price.monthly}
              </span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="text-center text-sm text-gray-600">
              or ${targetPlan.price.yearlyMonthly}/month billed yearly
              <span className="text-trini-red font-bold ml-1">
                (save ${targetPlan.price.savings})
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpgrade}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-trini-red to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 flex items-center justify-center gap-2"
            >
              Upgrade to {targetPlan.name}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            Cancel anytime • No long-term commitment
          </p>
        </motion.div>
      </div>
    );
  }

  // Inline context (default)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-trini-red to-red-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <Lock className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-black text-gray-900 mb-1">
            {feature} is a {targetPlan.name} Feature
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upgrade to unlock {feature} and {targetPlan.features.filter(f => f.included).length}+ more powerful features
          </p>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpgrade}
              className="px-6 py-2 bg-trini-red text-white rounded-lg font-bold hover:bg-red-700 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Upgrade for ${targetPlan.price.monthly}/month
            </motion.button>

            <a
              href="/pricing"
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Compare plans
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Feature Gate - Shows locked content with upgrade prompt
interface FeatureGateProps {
  currentTier: PricingTier;
  requiredTier: PricingTier;
  featureName: string;
  children: React.ReactNode;
  showPreview?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  currentTier,
  requiredTier,
  featureName,
  children,
  showPreview = true
}) => {
  const hasAccess = 
    currentTier === requiredTier ||
    (requiredTier === 'pro' && currentTier === 'premium') ||
    (requiredTier === 'free');

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred preview */}
      {showPreview && (
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
      )}

      {/* Upgrade overlay */}
      <div className={`${showPreview ? 'absolute inset-0' : ''} flex items-center justify-center p-6`}>
        <UpgradeCTA
          currentTier={currentTier}
          feature={featureName}
          context="inline"
        />
      </div>
    </div>
  );
};
