import { Theme } from '../types';
import { STORE_STARTERS, STARTER_IDS, type StarterId } from './storeStarters';

export interface StoreTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  features: string[];
  businessTypes: string[];
  tier: 'free' | 'pro' | 'premium';
  theme: Partial<Theme> & Record<string, unknown>;
  sections: TemplateSection[];
  cro_optimizations: string[];
  load_time_target: number;
  mobile_first: boolean;
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'hero' | 'products' | 'about' | 'reviews' | 'contact' | 'cta' | 'gallery' | 'menu' | 'booking';
  required: boolean;
  cro_elements: string[];
}

function starterToTemplate(id: StarterId, galleryId: string = id): StoreTemplate {
  const s = STORE_STARTERS[id];
  return {
    id: galleryId,
    name: galleryId === 'basic' ? 'Basic' : s.name,
    category: s.name,
    description: s.useWhen,
    thumbnail: s.heroImage,
    features: s.chips,
    businessTypes: [s.name],
    tier: id === 'general' || galleryId === 'basic' ? 'free' : 'pro',
    theme: {
      primary_color: s.palette.accent,
      secondary_color: s.palette.bg,
      accent_color: s.palette.accent,
      fonts: { heading: s.palette.headingFont, body: s.palette.bodyFont },
    },
    sections: s.blocks.map((block) => ({
      id: block,
      name: block,
      type: block === 'menu' || block === 'service_list' ? 'menu' : block === 'hero' ? 'hero' : 'products',
      required: block === 'hero' || block === 'footer',
      cro_elements: [],
    })),
    cro_optimizations: ['Empty catalog stays empty', 'WhatsApp only if E.164 is set'],
    load_time_target: 1.5,
    mobile_first: true,
  };
}

export const TRINIDAD_TEMPLATES: StoreTemplate[] = [
  ...STARTER_IDS.map((id) => starterToTemplate(id)),
  starterToTemplate('general', 'basic'),
];

export const getTemplatesByTier = (tier: 'free' | 'pro' | 'premium'): StoreTemplate[] => {
  if (tier === 'free') return TRINIDAD_TEMPLATES.filter((t) => t.tier === 'free');
  if (tier === 'pro') return TRINIDAD_TEMPLATES.filter((t) => t.tier === 'free' || t.tier === 'pro');
  return TRINIDAD_TEMPLATES;
};

export const getTemplatesByBusiness = (businessType: string): StoreTemplate[] => {
  return TRINIDAD_TEMPLATES.filter(
    (t) => t.businessTypes.includes(businessType) || t.id === 'general' || t.id === 'basic'
  );
};

export interface TemplateMarketplaceListing {
  template_id: string;
  creator_id: string;
  price: number;
  sales_count: number;
  rating: number;
  platform_commission: number;
}

export interface TemplateMetrics {
  template_id: string;
  avg_load_time: number;
  conversion_rate: number;
  mobile_usage: number;
  bounce_rate: number;
  avg_session_duration: number;
}
