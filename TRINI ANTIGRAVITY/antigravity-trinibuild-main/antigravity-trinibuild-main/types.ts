
export enum SubscriptionTier {
  FREE = 'Free',
  STARTER = 'Starter',
  PRO = 'Pro',
  ENTERPRISE = 'Enterprise'
}

export interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isPromoted?: boolean; // Ad Tech: Paid boost
  image: string;
  lat?: number;
  lng?: number;
  hours?: string;
  phone?: string;
  products?: Product[];
  trafficBoostExpiry?: number; // Timestamp for ad expiry
  isLocked?: boolean; // For feature gating
  upgradeRequired?: boolean; // For feature gating
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  status?: 'active' | 'inactive';
  stock?: number;
}

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
  organizer: string;
  date: string;
  time: string;
  location: string;
  image: string;
  category: 'All Inclusive' | 'Cooler' | 'J\'Ouvert' | 'Concert' | 'Boat Ride' | 'Breakfast';
  tiers: TicketTier[];
  description: string;
  isVerified: boolean;
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
