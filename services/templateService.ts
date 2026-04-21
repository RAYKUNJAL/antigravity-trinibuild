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
    id: 'pharmacy_medical_pro',
    name: 'Pharmacy & Health Store',
    category: 'Retail',
    description: 'Healthcare products, prescriptions, wellness. Secure ordering, delivery, health info.',
    thumbnail: '/templates/pharmacy.jpg',
    features: [
      'Product catalog',
      'Prescription upload',
      'Health categories',
      'Delivery service',
      'Customer accounts',
      'Reorder favorites',
      'Health articles'
    ],
    businessTypes: ['Pharmacy', 'Health Store', 'Medical Supply'],
    tier: 'pro',
    theme: {
      primary_color: '#0066CC', // Medical blue
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
        name: 'Pharmacy Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Prescription upload',
          'Delivery available',
          'Licensed badge',
          'Contact pharmacist'
        ]
      },
      {
        id: 'products',
        name: 'Product Catalog',
        type: 'products',
        required: true,
        cro_elements: [
          'Health categories',
          'Search function',
          'Prescription required badge',
          'In stock indicator'
        ]
      },
      {
        id: 'services',
        name: 'Our Services',
        type: 'about',
        required: true,
        cro_elements: [
          'Prescription services',
          'Health screenings',
          'Vaccinations',
          'Consultations'
        ]
      }
    ],
    cro_optimizations: [
      'Secure prescription upload',
      'Licensed professional badges',
      'Health information library',
      'Reorder from history',
      'Delivery tracking',
      'Privacy assurance',
      'Insurance accepted info',
      'Contact pharmacist button'
    ],
    load_time_target: 1.8,
    mobile_first: true
  },

  {
    id: 'electronics_tech_pro',
    name: 'Electronics & Tech Store',
    category: 'Retail',
    description: 'Electronics, phones, computers, accessories. Specs, comparisons, warranties.',
    thumbnail: '/templates/electronics.jpg',
    features: [
      'Product specifications',
      'Compare products',
      'Warranty information',
      'Tech support',
      'Trade-in program',
      'Installation services',
      'Financing options'
    ],
    businessTypes: ['Electronics Store', 'Computer Shop', 'Phone Repair', 'Tech Services'],
    tier: 'pro',
    theme: {
      primary_color: '#000000',
      secondary_color: '#00D4FF', // Tech blue
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
          'Latest products',
          'Special offers',
          'Trade-in CTA',
          'Expert support'
        ]
      },
      {
        id: 'products',
        name: 'Product Showcase',
        type: 'products',
        required: true,
        cro_elements: [
          'Detailed specs',
          'Image gallery',
          'Compare button',
          'Warranty badge',
          'In stock status'
        ]
      },
      {
        id: 'services',
        name: 'Services',
        type: 'about',
        required: true,
        cro_elements: [
          'Repair services',
          'Installation',
          'Tech support',
          'Financing'
        ]
      }
    ],
    cro_optimizations: [
      'Product comparison tool',
      'Detailed specifications',
      'Warranty information',
      'Financing calculator',
      'Trade-in estimator',
      'Tech support chat',
      'Installation booking',
      'Customer reviews with photos'
    ],
    load_time_target: 1.8,
    mobile_first: true
  },

  {
    id: 'bakery_sweets_pro',
    name: 'Bakery & Desserts',
    category: 'Food & Beverage',
    description: 'Bakeries, cake shops, desserts. Custom orders, photo gallery, event catering.',
    thumbnail: '/templates/bakery.jpg',
    features: [
      'Product showcase',
      'Custom cake orders',
      'Event catering',
      'Photo gallery',
      'Flavor options',
      'Delivery/pickup',
      'Order ahead'
    ],
    businessTypes: ['Bakery', 'Cake Shop', 'Dessert Shop', 'Pastry Shop'],
    tier: 'pro',
    theme: {
      primary_color: '#FF69B4', // Pink
      secondary_color: '#8B4513', // Brown
      accent_color: '#FFD700',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Bakery Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Custom order CTA',
          'Fresh daily badge',
          'Order ahead',
          'Event catering'
        ]
      },
      {
        id: 'gallery',
        name: 'Product Gallery',
        type: 'gallery',
        required: true,
        cro_elements: [
          'Beautiful photos',
          'Category filters',
          'Custom designs',
          'Customer creations'
        ]
      },
      {
        id: 'menu',
        name: 'Menu',
        type: 'menu',
        required: true,
        cro_elements: [
          'Product categories',
          'Flavors',
          'Sizes',
          'Pricing',
          'Allergen info'
        ]
      },
      {
        id: 'custom_orders',
        name: 'Custom Orders',
        type: 'booking',
        required: true,
        cro_elements: [
          'Order form',
          'Occasion selector',
          'Design upload',
          'Delivery date'
        ]
      }
    ],
    cro_optimizations: [
      'Visual product gallery',
      'Custom order form',
      'Event catering section',
      'Flavor/size selectors',
      'Delivery scheduling',
      'Order ahead options',
      'Customer photo testimonials',
      'Occasion-based categories'
    ],
    load_time_target: 1.5,
    mobile_first: true
  },

  {
    id: 'auto_parts_pro',
    name: 'Auto Parts & Accessories',
    category: 'Automotive',
    description: 'Car parts, accessories, services. Vehicle finder, installation, warranties.',
    thumbnail: '/templates/auto.jpg',
    features: [
      'Vehicle compatibility',
      'Part finder',
      'Installation services',
      'Warranties',
      'Bulk discounts',
      'Trade accounts',
      'Expert advice'
    ],
    businessTypes: ['Auto Parts', 'Car Accessories', 'Auto Service', 'Car Wash'],
    tier: 'pro',
    theme: {
      primary_color: '#FF0000', // Red
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
        name: 'Auto Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Part finder tool',
          'Expert service badge',
          'Same-day delivery',
          'Installation available'
        ]
      },
      {
        id: 'products',
        name: 'Parts Catalog',
        type: 'products',
        required: true,
        cro_elements: [
          'Vehicle selector',
          'Part categories',
          'Compatibility check',
          'Warranty badge',
          'Bulk pricing'
        ]
      },
      {
        id: 'services',
        name: 'Services',
        type: 'about',
        required: true,
        cro_elements: [
          'Installation',
          'Diagnostics',
          'Maintenance',
          'Trade accounts'
        ]
      }
    ],
    cro_optimizations: [
      'Vehicle compatibility checker',
      'Part number search',
      'Installation booking',
      'Warranty information',
      'Bulk discount calculator',
      'Trade account signup',
      'Expert advice chat',
      'Same-day delivery badge'
    ],
    load_time_target: 1.8,
    mobile_first: true
  },

  {
    id: 'hardware_home_pro',
    name: 'Hardware & Home Improvement',
    category: 'Retail',
    description: 'Hardware store, construction supplies, tools. Project planning, delivery, trade accounts.',
    thumbnail: '/templates/hardware.jpg',
    features: [
      'Product catalog',
      'Project calculator',
      'Delivery service',
      'Trade accounts',
      'How-to guides',
      'Tool rental',
      'Bulk ordering'
    ],
    businessTypes: ['Hardware Store', 'Building Supplies', 'Tools', 'Paint Store'],
    tier: 'pro',
    theme: {
      primary_color: '#FF6600', // Orange
      secondary_color: '#2F4F2F', // Dark green
      accent_color: '#FFD700',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Hardware Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Project calculator',
          'Delivery available',
          'Trade accounts',
          'Expert advice'
        ]
      },
      {
        id: 'products',
        name: 'Product Catalog',
        type: 'products',
        required: true,
        cro_elements: [
          'Category navigation',
          'Search by project',
          'Bulk quantities',
          'In-stock indicator',
          'Compare products'
        ]
      },
      {
        id: 'services',
        name: 'Services',
        type: 'about',
        required: true,
        cro_elements: [
          'Delivery service',
          'Tool rental',
          'Cutting services',
          'Color matching'
        ]
      }
    ],
    cro_optimizations: [
      'Project material calculator',
      'How-to guides library',
      'Trade account portal',
      'Bulk order discounts',
      'Delivery scheduling',
      'Tool rental booking',
      'Expert chat support',
      'Contractor resources'
    ],
    load_time_target: 1.8,
    mobile_first: true
  },

  {
    id: 'gym_fitness_pro',
    name: 'Gym & Fitness Center',
    category: 'Services',
    description: 'Gym, fitness studio, personal training. Memberships, class schedules, trainer booking.',
    thumbnail: '/templates/gym.jpg',
    features: [
      'Class schedule',
      'Membership plans',
      'Trainer profiles',
      'Online booking',
      'Progress tracking',
      'Nutrition plans',
      'Member portal'
    ],
    businessTypes: ['Gym', 'Fitness Studio', 'Yoga Studio', 'Personal Training', 'Sports Facility'],
    tier: 'pro',
    theme: {
      primary_color: '#E61E2B', // Red
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
        name: 'Fitness Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Free trial CTA',
          'Membership deals',
          'Virtual tour',
          'Join now button'
        ]
      },
      {
        id: 'classes',
        name: 'Class Schedule',
        type: 'booking',
        required: true,
        cro_elements: [
          'Weekly schedule',
          'Class types',
          'Trainer info',
          'Book class button',
          'Spots available'
        ]
      },
      {
        id: 'memberships',
        name: 'Membership Plans',
        type: 'menu',
        required: true,
        cro_elements: [
          'Plan comparison',
          'Pricing tiers',
          'Benefits list',
          'Sign up CTA',
          'No contract option'
        ]
      },
      {
        id: 'trainers',
        name: 'Our Trainers',
        type: 'about',
        required: true,
        cro_elements: [
          'Trainer profiles',
          'Certifications',
          'Specialties',
          'Book session'
        ]
      }
    ],
    cro_optimizations: [
      'Free trial signup',
      'Easy class booking',
      'Membership comparison',
      'Trainer profiles with booking',
      'Progress tracking app mention',
      'Transformation gallery',
      'Member testimonials',
      'Virtual tour video'
    ],
    load_time_target: 1.5,
    mobile_first: true
  },

  {
    id: 'jewelry_luxury_pro',
    name: 'Jewelry & Luxury Goods',
    category: 'Retail',
    description: 'Fine jewelry, watches, luxury items. High-quality images, custom orders, authentication.',
    thumbnail: '/templates/jewelry.jpg',
    features: [
      'Product showcase',
      'Custom design',
      'Virtual try-on',
      'Certification info',
      'Secure checkout',
      'Appointment booking',
      'Gift registry'
    ],
    businessTypes: ['Jewelry Store', 'Watch Store', 'Luxury Goods', 'Diamond Dealer'],
    tier: 'pro',
    theme: {
      primary_color: '#000000',
      secondary_color: '#FFD700', // Gold
      accent_color: '#FFFFFF',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    sections: [
      {
        id: 'hero',
        name: 'Luxury Hero',
        type: 'hero',
        required: true,
        cro_elements: [
          'Premium imagery',
          'New collection',
          'Book appointment',
          'Certification badges'
        ]
      },
      {
        id: 'products',
        name: 'Collection',
        type: 'products',
        required: true,
        cro_elements: [
          'High-res images',
          '360° view',
          'Zoom feature',
          'Certification info',
          'Customization options'
        ]
      },
      {
        id: 'services',
        name: 'Services',
        type: 'about',
        required: true,
        cro_elements: [
          'Custom design',
          'Repairs',
          'Appraisals',
          'Cleaning'
        ]
      },
      {
        id: 'booking',
        name: 'Book Appointment',
        type: 'booking',
        required: true,
        cro_elements: [
          'Private viewing',
          'Design consultation',
          'Expert advice',
          'Calendar booking'
        ]
      }
    ],
    cro_optimizations: [
      'Premium product photography',
      '360° product views',
      'Certification transparency',
      'Custom design consultation',
      'Secure payment badges',
      'Insurance information',
      'Gift registry service',
      'Appointment scheduling'
    ],
    load_time_target: 2,
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
