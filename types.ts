
// -- SUBSCRIPTION TIERS --
export enum SubscriptionTier {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

// -- BLOG POST INTERFACE --
export interface BlogPostData {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  status: 'draft' | 'published';
  seoKeywords?: string[];
}

// Alias for backward compatibility
export type BlogPost = BlogPostData;

// -- EXISTING INTERFACES (Preserved Basic Types) --

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'vendor' | 'driver' | 'admin';
  created_at: string;
}

// -- ENHANCED STORE INTERFACES --

export interface StoreSettings {
  currency: string;
  locale: string;
  taxInclusive: boolean;
  shippingZones: {
    id: string;
    name: string;
    countries: string[];
    rates: { name: string; price: number }[];
  }[];
  paymentProviders: {
    id: string;
    enabled: boolean;
    config: Record<string, any>;
  }[];
  delivery?: {
    zones: { id: string; name: string; price: number; estimatedTime: string; enabled: boolean }[];
    freeDeliveryThreshold: number;
    pickup: { enabled: boolean; address: string };
    trinibuildGo: boolean;
  };
  marketing?: {
    seoTitle?: string;
    seoDescription?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    discounts: {
      id: string;
      code: string;
      type: 'percentage' | 'fixed';
      value: number;
      active: boolean;
      usageCount: number;
      expiresAt?: string;
    }[];
  };
  inventory?: {
    lowStockThreshold: number;
    enableLowStockAlerts: boolean;
  };
}

export interface StoreTheme {
  template: 'default' | 'modern' | 'minimal';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  sections: Record<string, {
    type: 'page' | 'collection' | 'feature';
    blocks: any[]; // Flexible block structure
  }>;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string; // NEW
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  category: string | null;
  location: string | null;
  whatsapp: string | null;

  // JSONB Fields
  settings: StoreSettings;
  theme: StoreTheme;
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
    social?: Record<string, string>;
  };

  // V2 Fields
  tagline?: string | null;
  logo_style?: string | null;
  vibe?: string[];
  operating_hours?: Record<string, any>;
  delivery_options?: string[];
  payment_methods?: string[];
  font_pair?: Record<string, string>;
  color_scheme?: Record<string, string>;
  social_links?: Record<string, string>;

  status: 'pending' | 'active' | 'suspended';
  created_at: string;
}

// -- ENHANCED PRODUCT INTERFACES --

export interface ProductVariant {
  id: string;
  title: string; // e.g. "Red / M"
  options: Record<string, string>; // { "Color": "Red", "Size": "M" }
  price: number;
  compareAtPrice?: number | null;
  inventory: {
    qty: number;
    track: boolean;
  };
  sku?: string;
  image_url?: string;
}

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug?: string; // Derived or explicit
  description: string | null;
  price: number; // Base price
  compare_at_price?: number;

  stock: number; // Simple stock if no variants
  sku?: string;

  image_url: string | null;     // Main image
  gallery_images: string[];     // NEW: Additional images

  category: string | null;      // Legacy simple category
  category_ids: string[];       // NEW: Multi-category support

  variants: ProductVariant[];   // NEW: Complex variants
  seo: ProductSEO;              // NEW
  specifications: Record<string, string>; // NEW

  status: 'active' | 'draft' | 'archived';
  created_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

// -- EXISTING ORDER INTERFACES (Unchanged for now) --

export interface Order {
  id: string;
  customer_id: string;
  store_id: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: OrderItem[];
  delivery_address: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// Business type for legacy compatibility
export interface Business {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  products?: Array<{
    name: string;
    description: string;
    base_price: number;
    image_url?: string;
  }>;
}

// Theme type for store theming
export interface Theme {
  id?: string;
  name?: string;
  tokens?: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
      text_primary?: string;
    };
    layout?: {
      card_radius?: string;
    };
  };
}

// Google Maps PlaceResult Mock/Type
export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: {
    location: any;
    viewport?: any;
  };
  rating?: number;
  user_ratings_total?: number;
  photos?: any[];
  types?: string[];
  url?: string;
  website?: string;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
}

