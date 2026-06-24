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

  {
    id: 'doubles_breakfast_pro',
    name: 'Doubles & Breakfast Spot',
    category: 'Food & Beverage',
    description: 'Perfect for doubles vendors, breakfast spots, and street food. Fast ordering, daily specials.',
    thumbnail: '/templates/doubles.jpg',
    features: [
      'Quick order menu',
      'Daily specials banner',
      'Combo deals',
      'Pickup times',
      'Popular items',
      'Customer favorites',
      'Location & hours'
    ],
    businessTypes: ['Doubles Vendor', 'Breakfast Spot', 'Street Food', 'Food Truck'],
    tier: 'pro',
    theme: {
      primary_color: '#FF8C00', // Orange
      secondary_color: '#228B22', // Green (pepper sauce!)
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Morning Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Today special',
          'Open now badge',
          'Order button',
          'Phone number'
        ]
      },
      {
        id: 'menu',
        name: 'Quick Menu',
        type: 'menu',
        required: true,
        cro_elements: [
          'Simple items',
          'Add-ons (extra pepper)',
          'Combo deals',
          'Quick add to cart'
        ]
      },
      {
        id: 'location',
        name: 'Find Us',
        type: 'contact',
        required: true,
        cro_elements: [
          'Hours (5am-11am)',
          'Location map',
          'WhatsApp order',
          'Pickup timing'
        ]
      }
    ],
    cro_optimizations: [
      'Morning hours highlighted',
      'Daily special rotation',
      'Quick mobile ordering',
      'Popular items first',
      'Combo meal deals',
      'WhatsApp integration',
      'Cash on pickup',
      'Favorite locations saved'
    ],
    load_time_target: 1.2,
    mobile_first: true
  },

  {
    id: 'modern_market',
    name: 'Modern Marketplace',
    category: 'Retail',
    description: 'Clean Vercel-style commerce with product grid, variants, and instant cart.',
    thumbnail: '/templates/modern-market.jpg',
    features: [
      'Product grid with variants',
      'Instant add-to-cart drawer',
      'Collection filtering',
      'TT$ live pricing',
      'Mobile-first checkout',
      'WhatsApp order fallback'
    ],
    businessTypes: ['General Store', 'Variety Store', 'Online Shop', 'Retailer'],
    tier: 'pro',
    theme: {
      primary_color: '#171717',
      secondary_color: '#ffffff',
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Commerce Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Shop now CTA',
          'Free delivery banner',
          'Featured collection',
          'Trust badge'
        ]
      },
      {
        id: 'products',
        name: 'Product Grid',
        type: 'products',
        required: true,
        cro_elements: [
          'Variant selectors',
          'Quick add button',
          'Sale badges',
          'In-stock indicator'
        ]
      },
      {
        id: 'cart',
        name: 'Cart Drawer',
        type: 'cta',
        required: true,
        cro_elements: [
          'Slide-out cart',
          'Quantity controls',
          'Free shipping progress',
          'Checkout button'
        ]
      }
    ],
    cro_optimizations: [
      'Above-fold product grid',
      'Instant cart drawer',
      'Variant quick-select',
      'Free shipping threshold bar',
      'Sticky mobile checkout bar',
      'WhatsApp order fallback'
    ],
    load_time_target: 1.5,
    mobile_first: true
  },

  {
    id: 'furniture_home_store',
    name: 'Furniture & Home',
    category: 'Retail',
    description: 'Flatlogic-inspired furniture store with new arrivals, trust badges, and sale pricing.',
    thumbnail: '/templates/furniture-home.jpg',
    features: [
      'New arrivals carousel',
      'Sale pricing with strikethrough',
      'Trust badges (Free Shipping, Money Back)',
      'Room category filters',
      'Product dimensions display',
      'Delivery & assembly info'
    ],
    businessTypes: ['Furniture Store', 'Home Goods', 'Decor Shop', 'Mattress Store'],
    tier: 'pro',
    theme: {
      primary_color: '#0d9488',
      secondary_color: '#f8fafc',
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'New Arrivals Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'New arrivals badge',
          'Shop collection CTA',
          'Free shipping banner',
          'Money-back guarantee'
        ]
      },
      {
        id: 'products',
        name: 'Top Selling Products',
        type: 'products',
        required: true,
        cro_elements: [
          'Sale price strikethrough',
          'Star ratings',
          'Add to cart button',
          'Quick view modal'
        ]
      },
      {
        id: 'trust',
        name: 'Trust Badges',
        type: 'about',
        required: true,
        cro_elements: [
          'Free shipping badge',
          'Money-back guarantee',
          'Secure checkout',
          'Local assembly service'
        ]
      }
    ],
    cro_optimizations: [
      'Sale price with strikethrough anchor',
      'Free shipping progress bar',
      'Trust badges above fold',
      'Room-based category navigation',
      'Assembly booking upsell',
      'WhatsApp design consultation'
    ],
    load_time_target: 1.8,
    mobile_first: true
  },

  {
    id: 'tech_gadgets_store',
    name: 'Tech & Gadgets',
    category: 'Retail',
    description: 'Modern dark tech store with detailed specs, variant selection, and comparison tools.',
    thumbnail: '/templates/tech-gadgets.jpg',
    features: [
      'Dark mode product showcase',
      'Detailed spec sheets',
      'Variant selection (color/storage)',
      'Product comparison tool',
      'Warranty information',
      'Trade-in estimator'
    ],
    businessTypes: ['Electronics Store', 'Phone Shop', 'Computer Store', 'Gadget Retailer'],
    tier: 'pro',
    theme: {
      primary_color: '#2563eb',
      secondary_color: '#0f172a',
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Tech Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Latest drop badge',
          'Shop deals CTA',
          'Trade-in banner',
          'Expert support badge'
        ]
      },
      {
        id: 'products',
        name: 'Product Showcase',
        type: 'products',
        required: true,
        cro_elements: [
          'Spec highlights',
          'Variant pills (color/storage)',
          'Compare button',
          'In-stock status',
          'Warranty badge'
        ]
      },
      {
        id: 'compare',
        name: 'Compare Tool',
        type: 'about',
        required: true,
        cro_elements: [
          'Side-by-side specs',
          'Price difference',
          'Feature checklist',
          'Add to cart from compare'
        ]
      }
    ],
    cro_optimizations: [
      'Spec-first product cards',
      'Variant pill quick-select',
      'Side-by-side comparison tool',
      'Trade-in value estimator',
      'Financing calculator',
      'WhatsApp tech support'
    ],
    load_time_target: 1.8,
    mobile_first: true
  },

  {
    id: 'beauty_cosmetics_store',
    name: 'Beauty & Cosmetics',
    category: 'Retail',
    description: 'Soft modern beauty commerce with shade match, bundles, and subscription options.',
    thumbnail: '/templates/beauty-cosmetics.jpg',
    features: [
      'Shade matcher tool',
      'Product bundles & kits',
      'Subscribe & save option',
      'Ingredient transparency',
      'Before/after gallery',
      'Loyalty rewards points'
    ],
    businessTypes: ['Cosmetics Store', 'Beauty Supply', 'Skincare Brand', 'Makeup Artist'],
    tier: 'pro',
    theme: {
      primary_color: '#ec4899',
      secondary_color: '#fdf2f8',
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Beauty Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Shop collection CTA',
          'Free gift banner',
          'Shade match tool',
          'Cruelty-free badge'
        ]
      },
      {
        id: 'products',
        name: 'Product Grid',
        type: 'products',
        required: true,
        cro_elements: [
          'Shade swatches',
          'Bundle pricing',
          'Subscribe & save badge',
          'Star ratings',
          'Add to bag button'
        ]
      },
      {
        id: 'reviews',
        name: 'Before & After',
        type: 'gallery',
        required: true,
        cro_elements: [
          'Customer photo reviews',
          'Shade results',
          'Verified purchase badges',
          'Star ratings'
        ]
      }
    ],
    cro_optimizations: [
      'Shade matcher quiz',
      'Bundle upsell pricing',
      'Subscribe & save discount',
      'Ingredient transparency labels',
      'Loyalty points display',
      'Free gift with purchase threshold'
    ],
    load_time_target: 1.6,
    mobile_first: true
  },

  {
    id: 'sneaker_streetwear',
    name: 'Sneakers & Streetwear',
    category: 'Retail',
    description: 'Bold drop-style streetwear store with size pills, countdown drops, and hype feeds.',
    thumbnail: '/templates/sneaker-streetwear.jpg',
    features: [
      'Drop countdown timer',
      'Size selector pills',
      'Hype release feed',
      'Limited stock badges',
      'Lookbook gallery',
      'Restock notifications'
    ],
    businessTypes: ['Sneaker Store', 'Streetwear Brand', 'Clothing Boutique', 'Shoe Store'],
    tier: 'pro',
    theme: {
      primary_color: '#171717',
      secondary_color: '#ffffff',
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Drop Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Live countdown timer',
          'Shop drop CTA',
          'Limited stock badge',
          'Restock alert signup'
        ]
      },
      {
        id: 'products',
        name: 'Product Grid',
        type: 'products',
        required: true,
        cro_elements: [
          'Size selector pills',
          'Color variant swatches',
          'Limited stock indicator',
          'Add to cart button',
          'Wishlist heart'
        ]
      },
      {
        id: 'lookbook',
        name: 'Lookbook',
        type: 'gallery',
        required: true,
        cro_elements: [
          'Styled outfit shots',
          'Shop the look',
          'Instagram feed integration',
          'Tagged products'
        ]
      }
    ],
    cro_optimizations: [
      'Drop countdown urgency timer',
      'Size pill quick-select',
      'Limited stock scarcity badges',
      'Restock notification capture',
      'Shop-the-look tagging',
      'WhatsApp drop alerts'
    ],
    load_time_target: 1.5,
    mobile_first: true
  },

  {
    id: 'wellness_supplements',
    name: 'Wellness & Supplements',
    category: 'Retail',
    description: 'Clean health and supplement commerce with subscription plans and goal-based bundles.',
    thumbnail: '/templates/wellness-supplements.jpg',
    features: [
      'Goal-based product bundles',
      'Subscribe & save plans',
      'Ingredient transparency',
      'Lab test badges',
      'Dosage guide',
      'Health quiz funnel'
    ],
    businessTypes: ['Supplement Store', 'Health Food Shop', 'Vitamin Store', 'Wellness Brand'],
    tier: 'pro',
    theme: {
      primary_color: '#16a34a',
      secondary_color: '#f0fdf4',
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Wellness Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Take the quiz CTA',
          'Subscribe & save banner',
          'Lab-tested badge',
          'Free delivery badge'
        ]
      },
      {
        id: 'products',
        name: 'Product Grid',
        type: 'products',
        required: true,
        cro_elements: [
          'Goal category filters',
          'Subscribe & save price',
          'Ingredient highlights',
          'Star ratings',
          'Add to cart button'
        ]
      },
      {
        id: 'quiz',
        name: 'Health Quiz',
        type: 'cta',
        required: true,
        cro_elements: [
          'Goal-based questions',
          'Personalized results',
          'Bundle recommendation',
          'Email capture'
        ]
      }
    ],
    cro_optimizations: [
      'Health quiz personalization funnel',
      'Subscribe & save pricing anchor',
      'Goal-based bundle builder',
      'Lab-tested trust badges',
      'Dosage guide tooltips',
      'Free delivery threshold bar'
    ],
    load_time_target: 1.6,
    mobile_first: true
  },

  {
    id: 'auto_accessories_store',
    name: 'Auto & Accessories',
    category: 'Automotive',
    description: 'Modern parts and accessories shop with a vehicle part finder and compatibility check.',
    thumbnail: '/templates/auto-accessories.jpg',
    features: [
      'Vehicle part finder (make/model/year)',
      'Compatibility checker',
      'Part number search',
      'Installation service booking',
      'Warranty information',
      'Bulk/trade pricing'
    ],
    businessTypes: ['Auto Parts Store', 'Car Accessories', 'Auto Service', 'Tire Shop'],
    tier: 'pro',
    theme: {
      primary_color: '#ea580c',
      secondary_color: '#0f0f0f',
      accent_color: '#E61E2B',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Part Finder Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Vehicle selector (make/model/year)',
          'Search parts CTA',
          'Same-day delivery badge',
          'Installation available badge'
        ]
      },
      {
        id: 'products',
        name: 'Parts Catalog',
        type: 'products',
        required: true,
        cro_elements: [
          'Compatibility badge',
          'Part number display',
          'Warranty info',
          'In-stock status',
          'Add to cart button'
        ]
      },
      {
        id: 'services',
        name: 'Services',
        type: 'about',
        required: true,
        cro_elements: [
          'Installation booking',
          'Diagnostics service',
          'Trade account signup',
          'Bulk pricing inquiry'
        ]
      }
    ],
    cro_optimizations: [
      'Vehicle part finder tool',
      'Compatibility check on every product',
      'Part number quick search',
      'Installation booking upsell',
      'Trade account portal',
      'Same-day delivery badge'
    ],
    load_time_target: 1.8,
    mobile_first: true
  },

  // PREMIUM TIER - Enterprise template
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
