
export enum SubscriptionTier {
  FREE = 'Free',
  STARTER = 'Starter',
  PRO = 'Pro',
  ENTERPRISE = 'Enterprise'
}

// --- Ecommerce Core Types ---

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  logo_url?: string;
  banner_url?: string;
  whatsapp?: string;
  location?: string;
  category?: string;
  status: 'draft' | 'active' | 'suspended';
  theme_config?: any; // JSONB
  created_at?: string;
  updated_at?: string;
  // Relations
  products?: Product[];
  logo?: Logo;
  theme?: Theme;
}

export interface Logo {
  id: string;
  store_id: string;
  image_png_url: string;
  image_svg_url: string;
  favicon_url?: string;
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text_primary: string;
    text_secondary: string;
  };
  font_suggestions: {
    heading: string;
    body: string;
  };
}

export interface Theme {
  id: string;
  store_id: string;
  name: string;
  tokens: {
    colors: any;
    typography: any;
    layout: any;
    components: any;
  };
  is_default: boolean;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  base_price: number;
  compare_at_price?: number;
  cost?: number;
  image_url?: string;
  images?: string[];
  tags?: string[];
  category?: string;
  stock?: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku?: string;
  title: string;
  options: any; // { Size: "M", Color: "Red" }
  price: number;
  compare_at_price?: number;
  inventory_quantity: number;
  image_url?: string;
}

export interface Collection {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  description?: string;
  hero_image_url?: string;
}

export interface Order {
  id: string;
  store_id: string;
  customer_user_id?: string;
  order_number: string;
  email: string;
  phone: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: 'cod' | 'card' | 'paypal' | 'bank_transfer';
  subtotal: number;
  shipping_fee: number;
  tax: number;
  total: number;
  currency: string;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    country: string;
    zip?: string;
  };
  notes?: string;
  created_at: string;
  // Relations
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface StorefrontPage {
  id: string;
  store_id: string;
  type: 'home' | 'about' | 'contact' | 'faq' | 'custom';
  slug: string;
  title: string;
  content_json: any;
  seo_meta: any;
}

// --- Legacy / Other Vertical Types ---

// Keep Business for backward compatibility if needed, or map it to Store
export type Business = Store;

export interface RealEstateListing {
  id: string | number;
  title: string;
  price: number;
  type: 'rent' | 'buy' | 'commercial';
  beds: number;
  baths: number;
  sqft: number;
  location: string;
  description: string;
  images: string[];
  amenities: string[];
  agent: {
    name: string;
    photo: string;
    phone: string;
    isPremium: boolean;
  };
  isFeatured?: boolean;
  postedDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'OWNER' | 'ADMIN' | 'DRIVER';
  plan?: SubscriptionTier;
  isLifetime?: boolean; // For gifted accounts
  credits?: number; // For micro-transactions (buying leads/ads)
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  author: string;
  date: string;
  image: string;
  status: 'published' | 'draft';
  seoKeywords?: string[];
}

// E-Tick Interfaces
export interface TicketTier {
  id: string;
  name: string; // e.g. "Early Bird", "VIP", "Backstage"
  price: number;
  currency: 'TTD' | 'USD';
  available: number;
  perks: string[];
}

export interface CarnivalEvent {
  id: string;
  title: string;
  organizer: string; // Note: Database uses organizer_id, this might need mapping or be a joined field
  organizer_id?: string;
  date: string;
  time: string;
  location: string;
  venue_name?: string;
  image_url: string;
  category: 'All Inclusive' | 'Cooler' | 'J\'Ouvert' | 'Concert' | 'Boat Ride' | 'Breakfast' | 'Mas' | 'Party';
  tiers: TicketTier[];
  description: string;
  is_verified: boolean;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at?: string;
}

export interface Ticket {
  id: string;
  event_id: string;
  tier_id: string;
  user_id: string;
  purchase_date: string;
  status: 'valid' | 'used' | 'refunded' | 'cancelled';
  qr_code_hash: string;
  scanned_at?: string;
  scanned_by?: string;
  holder_name: string;
  holder_email?: string;
  event?: CarnivalEvent;
  tier?: TicketTier;
}

export interface TicketOrder {
  id: string;
  eventId: string;
  eventTitle: string;
  tierName: string;
  quantity: number;
  totalPaid: number;
  purchaseDate: string;
  status: 'valid' | 'used' | 'transferred';
  secureCode: string; // Dynamic QR seed
  ownerName: string;
}

export interface PromoterWorker {
  id: string;
  name: string;
  email: string;
  role: 'Scanner' | 'Manager';
  scansPerformed: number;
  status: 'Active' | 'Inactive';
  lastActive: string;
}

export interface CommitteeMember {
  id: string;
  name: string;
  code: string; // e.g. SARAH10
  ticketsSold: number;
  commissionEarned: number;
  link: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountType: 'Savings' | 'Chequing';
  holderName: string;
}

// Affiliate Interfaces
export interface AffiliateStats {
  totalClicks: number;
  conversions: number;
  pendingCommission: number;
  paidCommission: number;
  tier: 'Bronze' | 'Silver' | 'Gold';
}

export interface MarketingAsset {
  id: string;
  title: string;
  type: 'Banner' | 'Social' | 'Text';
  url: string;
  copy?: string;
}

export interface Payout {
  id: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Processing';
}

// For Maps Grounding
export interface MapLocation {
  title: string;
  uri?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeId?: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        author?: string;
        content?: string;
      }[];
    }[];
  };
}

// For Google Maps JS API & Gemini Fallback
export interface PlaceResult {
  place_id?: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    } | any; // Allow loose typing for fallback
  };
  rating?: number;
  user_ratings_total?: number;
  photos?: {
    getUrl: (opts: { maxWidth: number; maxHeight: number }) => string;
  }[];
  types?: string[];
  // Fallback properties
  url?: string; // Google Maps URL from grounding
}
