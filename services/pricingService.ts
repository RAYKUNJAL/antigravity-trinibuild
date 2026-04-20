// TriniBuild Pricing Tiers & Feature Gates
export type PricingTier = 'free' | 'pro' | 'premium';

export interface PricingPlan {
  id: PricingTier;
  name: string;
  price: {
    monthly: number;
    yearly: number;
    yearlyMonthly: number; // monthly equivalent
    savings: number; // yearly savings
  };
  currency: string;
  tagline: string;
  features: PricingFeature[];
  limits: PricingLimits;
  popular?: boolean;
}

export interface PricingFeature {
  name: string;
  included: boolean;
  limit?: string;
  tooltip?: string;
}

export interface PricingLimits {
  products: number | 'unlimited';
  pages: number | 'unlimited';
  templates: number | 'unlimited';
  staffAccounts: number;
  emailsPerMonth: number | 'unlimited';
  aiListingsPerMonth: number | 'unlimited';
  activeContests: number | 'unlimited';
  marketplaceBoosts: boolean;
  customDomain: boolean;
  removeBranding: boolean;
  onlinePayments: boolean;
  inventoryManagement: boolean;
  analytics: 'basic' | 'advanced' | 'enterprise';
  support: 'community' | 'email' | 'priority' | 'dedicated';
  apiAccess: boolean;
  multiLocation: boolean;
  deliveryPricePerOrder: number;
  deliveryCommission: number; // What we keep
}

export const PRICING_PLANS: Record<PricingTier, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: {
      monthly: 0,
      yearly: 0,
      yearlyMonthly: 0,
      savings: 0
    },
    currency: 'TTD',
    tagline: 'Perfect for getting started',
    features: [
      { name: '1 Free Web Page', included: true },
      { name: '5 Product Listings', included: true, limit: '5 products' },
      { name: 'Basic Template', included: true, limit: '1 design choice' },
      { name: 'TriniBuild Branding', included: true, tooltip: 'Powered by TriniBuild badge' },
      { name: 'Community Support', included: true },
      { name: 'Unlimited Marketplace Posts', included: true },
      { name: 'Basic Analytics', included: true, limit: 'Views & clicks only' },
      { name: 'Manual Orders', included: true, tooltip: 'WhatsApp/Phone' },
      { name: 'Cash on Delivery', included: true, limit: '$2/delivery' },
      { name: 'Multi-Page Website', included: false },
      { name: 'Remove Branding', included: false },
      { name: 'Custom Domain', included: false },
      { name: 'Online Payments', included: false },
      { name: 'Inventory Management', included: false },
      { name: 'Email Marketing', included: false },
      { name: 'AI Product Listings', included: false }
    ],
    limits: {
      products: 5,
      pages: 1,
      templates: 1,
      staffAccounts: 1,
      emailsPerMonth: 0,
      aiListingsPerMonth: 0,
      activeContests: 0,
      marketplaceBoosts: false,
      customDomain: false,
      removeBranding: false,
      onlinePayments: false,
      inventoryManagement: false,
      analytics: 'basic',
      support: 'community',
      apiAccess: false,
      multiLocation: false,
      deliveryPricePerOrder: 2.00,
      deliveryCommission: 0.50
    }
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    price: {
      monthly: 29,
      yearly: 290,
      yearlyMonthly: 24.17,
      savings: 58
    },
    currency: 'TTD',
    tagline: 'For growing Trinidad businesses',
    popular: true,
    features: [
      { name: 'Everything in Free, PLUS:', included: true },
      { name: 'Multi-Page Website', included: true, limit: 'Unlimited pages' },
      { name: '50 Product Listings', included: true },
      { name: '15+ Premium Templates', included: true, tooltip: 'CRO-optimized designs' },
      { name: 'Remove TriniBuild Branding', included: true },
      { name: 'Custom Domain', included: true, tooltip: 'yourstore.com' },
      { name: 'Online Payments', included: true, tooltip: 'WiPay, PayPal, Bank Transfer' },
      { name: 'Inventory Management', included: true },
      { name: 'Email Support', included: true, limit: '24hr response' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Discount Codes', included: true },
      { name: 'Email Marketing', included: true, limit: '500 emails/month' },
      { name: 'Priority Marketplace Listings', included: true },
      { name: 'Viral Contest Builder', included: true, limit: '1 active contest' },
      { name: 'Discounted Delivery', included: true, limit: '$1.50/delivery' },
      { name: 'AI Product Listings', included: true, limit: '25/month' },
      { name: 'Unlimited Products', included: false },
      { name: 'Multiple Locations', included: false },
      { name: 'API Access', included: false }
    ],
    limits: {
      products: 50,
      pages: 'unlimited',
      templates: 15,
      staffAccounts: 2,
      emailsPerMonth: 500,
      aiListingsPerMonth: 25,
      activeContests: 1,
      marketplaceBoosts: true,
      customDomain: true,
      removeBranding: true,
      onlinePayments: true,
      inventoryManagement: true,
      analytics: 'advanced',
      support: 'email',
      apiAccess: false,
      multiLocation: false,
      deliveryPricePerOrder: 1.50,
      deliveryCommission: 0.30
    }
  },

  premium: {
    id: 'premium',
    name: 'Premium',
    price: {
      monthly: 99,
      yearly: 990,
      yearlyMonthly: 82.50,
      savings: 198
    },
    currency: 'TTD',
    tagline: 'For enterprise & multi-location',
    features: [
      { name: 'Everything in Pro, PLUS:', included: true },
      { name: 'Unlimited Products', included: true },
      { name: 'Multiple Store Locations', included: true },
      { name: '5 Staff Accounts', included: true, tooltip: '+$10/month for more' },
      { name: 'Full White-Label', included: true },
      { name: 'Priority Phone Support', included: true, limit: '1hr response' },
      { name: 'Dedicated Account Manager', included: true },
      { name: 'API Access', included: true },
      { name: 'Custom Integrations', included: true, tooltip: 'POS, accounting, etc' },
      { name: 'Advanced Reporting', included: true },
      { name: 'Unlimited Email Marketing', included: true },
      { name: 'Unlimited Viral Contests', included: true },
      { name: 'Driver Fleet Management', included: true },
      { name: 'Unlimited AI Listings', included: true },
      { name: 'Marketplace Featured', included: true, tooltip: 'Always at top' },
      { name: 'Priority Delivery', included: true },
      { name: 'Custom Template Design', included: true, tooltip: 'We build for you' }
    ],
    limits: {
      products: 'unlimited',
      pages: 'unlimited',
      templates: 'unlimited',
      staffAccounts: 5,
      emailsPerMonth: 'unlimited',
      aiListingsPerMonth: 'unlimited',
      activeContests: 'unlimited',
      marketplaceBoosts: true,
      customDomain: true,
      removeBranding: true,
      onlinePayments: true,
      inventoryManagement: true,
      analytics: 'enterprise',
      support: 'dedicated',
      apiAccess: true,
      multiLocation: true,
      deliveryPricePerOrder: 1.00,
      deliveryCommission: 0.20
    }
  }
};

// Feature gate checker
export const hasFeature = (tier: PricingTier, feature: keyof PricingLimits): boolean => {
  const plan = PRICING_PLANS[tier];
  const value = plan.limits[feature];
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (value === 'unlimited') return true;
  
  return false;
};

// Check if limit exceeded
export const isLimitExceeded = (
  tier: PricingTier,
  feature: keyof PricingLimits,
  currentUsage: number
): boolean => {
  const plan = PRICING_PLANS[tier];
  const limit = plan.limits[feature];
  
  if (limit === 'unlimited') return false;
  if (typeof limit === 'number') return currentUsage >= limit;
  
  return false;
};

// Get upgrade CTA message
export const getUpgradeCTA = (
  currentTier: PricingTier,
  feature: string
): { title: string; message: string; targetTier: PricingTier } => {
  if (currentTier === 'free') {
    return {
      title: `Upgrade to Pro for ${feature}`,
      message: `Unlock ${feature} and 15+ more features for just $29/month`,
      targetTier: 'pro'
    };
  }
  
  if (currentTier === 'pro') {
    return {
      title: `Upgrade to Premium for ${feature}`,
      message: `Get ${feature} plus unlimited everything for $99/month`,
      targetTier: 'premium'
    };
  }
  
  return {
    title: 'Feature Locked',
    message: 'Contact support for custom enterprise features',
    targetTier: 'premium'
  };
};

// Delivery pricing calculator
export const calculateDeliveryPrice = (tier: PricingTier): {
  customerPays: number;
  platformKeeps: number;
  driverGets: number;
} => {
  const plan = PRICING_PLANS[tier];
  const customerPays = plan.limits.deliveryPricePerOrder;
  const platformKeeps = plan.limits.deliveryCommission;
  const driverGets = customerPays - platformKeeps;
  
  return { customerPays, platformKeeps, driverGets };
};
