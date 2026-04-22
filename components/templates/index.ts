/**
 * PREMIUM STORE TEMPLATES
 * 
 * High-end, professional store templates for TriniBuild merchants
 * - Openfront-style 3-Column Layout (proven e-commerce architecture)
 * - Fashion & Luxury Brands
 * - Restaurants & Fine Dining
 * - Beauty, Spa & Wellness
 * - General E-commerce & Retail
 * 
 * All templates feature:
 * ✅ Mobile-first responsive design
 * ✅ Premium animations with Framer Motion
 * ✅ Dark mode support
 * ✅ Conversion-optimized layouts
 * ✅ Lucide icons integration
 * ✅ Tailwind CSS styling
 */

export { PremiumFashionTemplate } from './PremiumFashionTemplate';
export { PremiumRestaurantTemplate } from './PremiumRestaurantTemplate';
export { PremiumBeautyTemplate } from './PremiumBeautyTemplate';
export { PremiumEcommerceTemplate } from './PremiumEcommerceTemplate';
export { Premium3ColumnTemplate } from './Premium3ColumnTemplate';

import { PremiumFashionTemplate } from './PremiumFashionTemplate';
import { PremiumRestaurantTemplate } from './PremiumRestaurantTemplate';
import { PremiumBeautyTemplate } from './PremiumBeautyTemplate';
import { PremiumEcommerceTemplate } from './PremiumEcommerceTemplate';
import { Premium3ColumnTemplate } from './Premium3ColumnTemplate';

export const PREMIUM_STORE_TEMPLATES = [
  {
    id: 'premium-3-column',
    name: 'Professional 3-Column',
    description: 'Proven 3-column Openfront-style layout. Sticky sidebars for product info and actions.',
    category: 'Professional',
    component: Premium3ColumnTemplate,
    preview: '📱',
    features: [
      'Sticky product info sidebar',
      'Large product image gallery',
      'Sticky actions sidebar',
      'Product details accordion',
      'Related products section',
      'Mobile-optimized stacked layout'
    ],
    tier: 'premium',
    businessTypes: ['All Types', 'Fashion', 'Electronics', 'General Retail'],
    isDefault: true
  },
  {
    id: 'premium-fashion',
    name: 'Premium Fashion',
    description: 'Luxury fashion and apparel boutique template',
    category: 'Fashion',
    component: PremiumFashionTemplate,
    preview: '👗',
    features: [
      'Elegant product showcase',
      'Premium animations',
      'Luxury branding',
      'Product filtering',
      'Wishlist integration',
      'Dark mode support'
    ],
    tier: 'premium',
    businessTypes: ['Fashion', 'Luxury', 'Boutiques', 'Designer Stores']
  },
  {
    id: 'premium-restaurant',
    name: 'Premium Restaurant',
    description: 'Fine dining and restaurant template',
    category: 'Food & Beverage',
    component: PremiumRestaurantTemplate,
    preview: '🍽️',
    features: [
      'Interactive menu showcase',
      'Category-based filtering',
      'Reservation system',
      'Testimonials section',
      'Hours and location',
      'Premium ambiance'
    ],
    tier: 'premium',
    businessTypes: ['Restaurants', 'Fine Dining', 'Cafes', 'Bars']
  },
  {
    id: 'premium-beauty',
    name: 'Premium Beauty',
    description: 'Beauty salon, spa and wellness services template',
    category: 'Services',
    component: PremiumBeautyTemplate,
    preview: '💆',
    features: [
      'Service showcase',
      'Stylist profiles',
      'Booking system',
      'Duration and pricing',
      'Testimonials',
      'Special offers'
    ],
    tier: 'premium',
    businessTypes: ['Beauty', 'Salons', 'Spas', 'Wellness', 'Health']
  },
  {
    id: 'premium-ecommerce',
    name: 'Premium Ecommerce',
    description: 'Modern retail and general e-commerce template',
    category: 'Retail',
    component: PremiumEcommerceTemplate,
    preview: '🛍️',
    features: [
      'Product grid with filters',
      'Advanced search',
      'Category navigation',
      'Ratings and reviews',
      'Shopping cart',
      'Trust indicators'
    ],
    tier: 'premium',
    businessTypes: ['Retail', 'Electronics', 'Gifts', 'General Store']
  }
];

export default PREMIUM_STORE_TEMPLATES;
