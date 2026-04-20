// CRO-Optimized Store Templates for Trinidad Businesses
// Fast-loading, conversion-focused, mobile-first designs

import { Theme } from '../types';

export interface StoreTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  features: string[];
  businessTypes: string[];
  tier: 'free' | 'pro' | 'premium';
  theme: Partial<Theme>;
  sections: TemplateSection[];
  cro_optimizations: string[];
  load_time_target: number; // seconds
  mobile_first: boolean;
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'hero' | 'products' | 'about' | 'reviews' | 'contact' | 'cta' | 'gallery' | 'menu' | 'booking';
  required: boolean;
  cro_elements: string[];
}

// Trinidad-specific CRO Templates
export const TRINIDAD_TEMPLATES: StoreTemplate[] = [
  // ============================================
  // FREE TIER TEMPLATES (1 basic template)
  // ============================================
  {
    id: 'basic_storefront',
    name: 'Basic Storefront',
    category: 'General',
    description: 'Clean, simple one-page store. Perfect for getting started.',
    thumbnail: '/templates/basic.jpg',
    features: [
      'Single page layout',
      'Product showcase',
      'WhatsApp button',
      'Contact form',
      'Mobile responsive'
    ],
    businessTypes: ['All'],
    tier: 'free',
    theme: {
      primary_color: '#E61E2B',
      secondary_color: '#000000',
      accent_color: '#FFD700',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Hero Banner',
        type: 'hero',
        required: true,
        cro_elements: ['Clear headline', 'CTA button', 'Trust badge']
      },
      {
        id: 'products',
        name: 'Product Grid',
        type: 'products',
        required: true,
        cro_elements: ['Product images', 'Prices', 'Add to cart']
      },
      {
        id: 'contact',
        name: 'Contact Section',
        type: 'contact',
        required: true,
        cro_elements: ['WhatsApp button', 'Phone number', 'Location']
      }
    ],
    cro_optimizations: [
      'Above-fold CTA',
      'WhatsApp integration',
      'Social proof placeholder',
      'Fast image loading',
      'Mobile-optimized'
    ],
    load_time_target: 2,
    mobile_first: true
  },

  // ============================================
  // PRO TIER TEMPLATES (15+ Premium Templates)
  // ============================================
  
  // FOOD & BEVERAGE TEMPLATES
  {
    id: 'roti_shop_pro',
    name: 'Roti Shop Premium',
    category: 'Food & Beverage',
    description: 'Built for Trinidad roti shops. Menu showcase, online ordering, delivery integration.',
    thumbnail: '/templates/roti-shop.jpg',
    features: [
      'Full menu showcase',
      'Online ordering',
      'Delivery zones',
      'Special offers section',
      'Customer reviews',
      'Gallery',
      'Hours & location'
    ],
    businessTypes: ['Roti Shop', 'Restaurant', 'Food Truck'],
    tier: 'pro',
    theme: {
      primary_color: '#8B4513', // Brown for authentic feel
      secondary_color: '#FFD700', // Gold accents
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Hero with Special Offer',
        type: 'hero',
        required: true,
        cro_elements: [
          'Mouthwatering hero image',
          'Daily special banner',
          'Order now CTA',
          'Delivery badge'
        ]
      },
      {
        id: 'menu',
        name: 'Menu Showcase',
        type: 'menu',
        required: true,
        cro_elements: [
          'Category tabs',
          'Food images',
          'Prices',
          'Add to order button',
          'Popular items badge'
        ]
      },
      {
        id: 'reviews',
        name: 'Customer Reviews',
        type: 'reviews',
        required: false,
        cro_elements: [
          '5-star ratings',
          'Customer photos',
          'Testimonials',
          'Review count'
        ]
      },
      {
        id: 'delivery',
        name: 'Delivery Info',
        type: 'cta',
        required: true,
        cro_elements: [
          'Delivery zones map',
          'Estimated time',
          'Minimum order',
          'COD badge'
        ]
      }
    ],
    cro_optimizations: [
      'Food photography optimization',
      'Quick add-to-cart',
      'WhatsApp order button',
      'Delivery time estimator',
      'Trust badges (health cert)',
      'Customer photo gallery',
      'Special offers banner',
      'Mobile menu optimization'
    ],
    load_time_target: 1.5,
    mobile_first: true
  },

  {
    id: 'restaurant_premium',
    name: 'Restaurant Premium',
    category: 'Food & Beverage',
    description: 'Full-service restaurant template. Reservations, menu, gallery, reviews.',
    thumbnail: '/templates/restaurant.jpg',
    features: [
      'Online reservations',
      'Full menu with images',
      'Chef specials',
      'Photo gallery',
      'Reviews & ratings',
      'Catering inquiry',
      'Events section'
    ],
    businessTypes: ['Restaurant', 'Bar', 'Lounge'],
    tier: 'pro',
    theme: {
      primary_color: '#1a1a1a',
      secondary_color: '#FFD700',
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Restaurant Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Full-screen image',
          'Reservation CTA',
          'Awards/badges',
          'Phone number'
        ]
      },
      {
        id: 'menu',
        name: 'Interactive Menu',
        type: 'menu',
        required: true,
        cro_elements: [
          'Categorized menu',
          'Dish images',
          'Allergen info',
          'Chef recommendations'
        ]
      },
      {
        id: 'gallery',
        name: 'Photo Gallery',
        type: 'gallery',
        required: false,
        cro_elements: [
          'Ambiance photos',
          'Food photography',
          'Event photos'
        ]
      },
      {
        id: 'booking',
        name: 'Table Reservation',
        type: 'booking',
        required: true,
        cro_elements: [
          'Date picker',
          'Party size',
          'Time slots',
          'Confirmation'
        ]
      }
    ],
    cro_optimizations: [
      'Instant reservation confirmation',
      'Call-to-action buttons',
      'Social proof (reviews)',
      'High-quality food photography',
      'Mobile reservation flow',
      'WhatsApp contact',
      'Google Maps integration',
      'Hours prominently displayed'
    ],
    load_time_target: 2,
    mobile_first: true
  },

  // RETAIL TEMPLATES
  {
    id: 'clothing_store_pro',
    name: 'Fashion Boutique',
    category: 'Retail',
    description: 'Modern clothing store. Product catalog, size guides, lookbooks, Instagram integration.',
    thumbnail: '/templates/clothing.jpg',
    features: [
      'Product catalog',
      'Size guide',
      'Lookbook gallery',
      'Instagram feed',
      'Wishlist',
      'Quick view',
      'Sale section'
    ],
    businessTypes: ['Clothing Store', 'Shoe Store', 'Jewelry Store'],
    tier: 'pro',
    theme: {
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Fashion Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Full-width slider',
          'New arrivals badge',
          'Shop now CTA',
          'Free delivery banner'
        ]
      },
      {
        id: 'products',
        name: 'Product Grid',
        type: 'products',
        required: true,
        cro_elements: [
          'Product images',
          'Quick view',
          'Wishlist heart',
          'Size selector',
          'Sale badges'
        ]
      },
      {
        id: 'lookbook',
        name: 'Lookbook',
        type: 'gallery',
        required: false,
        cro_elements: [
          'Styled photos',
          'Shop the look',
          'Instagram integration'
        ]
      },
      {
        id: 'reviews',
        name: 'Customer Reviews',
        type: 'reviews',
        required: true,
        cro_elements: [
          'Photo reviews',
          '5-star ratings',
          'Verified purchases',
          'Fit feedback'
        ]
      }
    ],
    cro_optimizations: [
      'Quick view product modal',
      'Size guide popup',
      'Wishlist functionality',
      'Color/size filters',
      'Sale countdown timer',
      'Instagram social proof',
      'Free delivery threshold',
      'Mobile-optimized checkout'
    ],
    load_time_target: 1.8,
    mobile_first: true
  },

  // SERVICE TEMPLATES
  {
    id: 'salon_barber_pro',
    name: 'Salon & Barbershop',
    category: 'Services',
    description: 'For salons and barbers. Online booking, service menu, gallery, team profiles.',
    thumbnail: '/templates/salon.jpg',
    features: [
      'Online booking',
      'Service menu with prices',
      'Stylist profiles',
      'Before/after gallery',
      'Customer reviews',
      'Loyalty program info',
      'Product sales'
    ],
    businessTypes: ['Hair Salon', 'Barbershop', 'Nail Salon', 'Spa'],
    tier: 'pro',
    theme: {
      primary_color: '#FF1493', // Hot pink
      secondary_color: '#000000',
      accent_color: '#FFD700',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Salon Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Book now CTA',
          'Special offer banner',
          'Phone number',
          'Walk-ins welcome badge'
        ]
      },
      {
        id: 'services',
        name: 'Services Menu',
        type: 'menu',
        required: true,
        cro_elements: [
          'Service categories',
          'Prices',
          'Duration',
          'Book button',
          'Package deals'
        ]
      },
      {
        id: 'team',
        name: 'Our Team',
        type: 'about',
        required: false,
        cro_elements: [
          'Stylist photos',
          'Specialties',
          'Experience',
          'Book with this stylist'
        ]
      },
      {
        id: 'gallery',
        name: 'Before & After',
        type: 'gallery',
        required: true,
        cro_elements: [
          'Before/after slider',
          'Customer transformations',
          'Style inspiration'
        ]
      }
    ],
    cro_optimizations: [
      'Easy online booking',
      'Service packages highlighted',
      'Before/after gallery',
      'Stylist selection',
      'SMS reminders mention',
      'Loyalty program CTA',
      'Instagram integration',
      'Mobile-first booking'
    ],
    load_time_target: 1.5,
    mobile_first: true
  },

  // PREMIUM TIER - All templates + custom design
  {
    id: 'multi_location_enterprise',
    name: 'Multi-Location Enterprise',
    category: 'Enterprise',
    description: 'For chains and franchises. Multiple locations, centralized inventory, staff management.',
    thumbnail: '/templates/enterprise.jpg',
    features: [
      'Multiple store pages',
      'Centralized inventory',
      'Location finder',
      'Franchise info',
      'Corporate branding',
      'Staff dashboard',
      'Analytics integration',
      'Custom integrations'
    ],
    businessTypes: ['All - Enterprise'],
    tier: 'premium',
    theme: {
      primary_color: '#0066CC',
      secondary_color: '#FFD700',
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Corporate Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Find location CTA',
          'Shop online CTA',
          'Franchise inquiry',
          'Trust badges'
        ]
      },
      {
        id: 'locations',
        name: 'Location Finder',
        type: 'contact',
        required: true,
        cro_elements: [
          'Interactive map',
          'Search by area',
          'Hours for each',
          'Get directions'
        ]
      },
      {
        id: 'products',
        name: 'Product Catalog',
        type: 'products',
        required: true,
        cro_elements: [
          'Global inventory',
          'Store availability',
          'Online ordering',
          'Pickup/delivery options'
        ]
      }
    ],
    cro_optimizations: [
      'Location-based personalization',
      'Centralized checkout',
      'Store pickup options',
      'Franchise opportunities CTA',
      'Corporate partnerships',
      'B2B ordering',
      'API integrations',
      'Advanced analytics'
    ],
    load_time_target: 2,
    mobile_first: true
  }
];

// Template marketplace (users can buy/sell templates)
export interface TemplateMarketplaceListing {
  template_id: string;
  creator_id: string;
  price: number;
  sales_count: number;
  rating: number;
  platform_commission: number; // 30%
}

// Get templates by tier
export const getTemplatesByTier = (tier: 'free' | 'pro' | 'premium'): StoreTemplate[] => {
  if (tier === 'free') {
    return TRINIDAD_TEMPLATES.filter(t => t.tier === 'free');
  }
  if (tier === 'pro') {
    return TRINIDAD_TEMPLATES.filter(t => t.tier === 'free' || t.tier === 'pro');
  }
  return TRINIDAD_TEMPLATES; // Premium gets all
};

// Get templates by business type
export const getTemplatesByBusiness = (businessType: string): StoreTemplate[] => {
  return TRINIDAD_TEMPLATES.filter(t => 
    t.businessTypes.includes(businessType) || t.businessTypes.includes('All')
  );
};

// Template performance metrics (for CRO optimization)
export interface TemplateMetrics {
  template_id: string;
  avg_load_time: number;
  conversion_rate: number;
  mobile_usage: number;
  bounce_rate: number;
  avg_session_duration: number;
}
