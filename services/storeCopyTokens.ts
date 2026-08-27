/**
 * Merchant store copy tokens. No preview shop names (no Mama's / Fade Kings / Glow TT).
 * Hide WhatsApp / COD / pickup / Wam pieces when those settings are off.
 */

export type StarterType = 'food' | 'fashion' | 'services' | 'general' | 'beauty' | 'home';

export interface StoreTokens {
  store_name: string;
  area: string;
  island: string;
  hours: string;
  pickup_address: string;
  delivery_areas: string;
  whatsapp: string;
  specialty: string;
  accepts_pickup: boolean;
  accepts_cod: boolean;
  whatsapp_on: boolean;
  wam_on: boolean;
}

export const SHARED_PAY_LINE = 'Cash at pickup. Cash on delivery where we deliver. WhatsApp to confirm.';

export function applyTokens(template: string, t: StoreTokens): string {
  return template
    .replaceAll('{{store_name}}', t.store_name || 'Your store')
    .replaceAll('{{area}}', t.area || '')
    .replaceAll('{{island}}', t.island || 'Trinidad & Tobago')
    .replaceAll('{{hours}}', t.hours || '')
    .replaceAll('{{pickup_address}}', t.pickup_address || '')
    .replaceAll('{{delivery_areas}}', t.delivery_areas || '')
    .replaceAll('{{whatsapp}}', t.whatsapp || '')
    .replaceAll('{{specialty}}', t.specialty || '');
}

export function payLine(t: StoreTokens): string {
  const parts: string[] = [];
  if (t.accepts_pickup) parts.push('Cash at pickup.');
  if (t.accepts_cod) parts.push('Cash on delivery where we deliver.');
  if (t.whatsapp_on) parts.push('WhatsApp to confirm.');
  return parts.join(' ');
}

export const VERTICAL_COPY: Record<StarterType, {
  hero: string;
  ctaPrimary: string;
  ctaWhatsapp: string;
  trust: string;
}> = {
  food: {
    hero: 'Cooked this morning. Ready when you reach.',
    ctaPrimary: 'See the menu',
    ctaWhatsapp: 'Order on WhatsApp',
    trust: '',
  },
  fashion: {
    hero: 'Pieces you can try. Prices you can see.',
    ctaPrimary: 'Shop the rack',
    ctaWhatsapp: 'Ask a size on WhatsApp',
    trust: '',
  },
  beauty: {
    hero: 'Book the chair. Or take the product home.',
    ctaPrimary: 'See services',
    ctaWhatsapp: 'Message us on WhatsApp',
    trust: '',
  },
  general: {
    hero: 'In the shop today. Not “ships in 6 weeks.”',
    ctaPrimary: 'Browse the shop',
    ctaWhatsapp: 'Ask on WhatsApp',
    trust: '',
  },
  services: {
    hero: 'Book the chair. Or take the product home.',
    ctaPrimary: 'See services',
    ctaWhatsapp: 'Message us on WhatsApp',
    trust: '',
  },
  home: {
    hero: 'In the shop today. Not “ships in 6 weeks.”',
    ctaPrimary: 'Browse the shop',
    ctaWhatsapp: 'Ask on WhatsApp',
    trust: '',
  },
};

export const GALLERY_TO_BUILDER: Record<string, string> = {
  basic_storefront: 'island-commerce',
  roti_shop_pro: 'restaurant',
  doubles_breakfast_pro: 'restaurant',
  restaurant_premium: 'restaurant',
  clothing_store_pro: 'fashion',
  salon_barber_pro: 'beauty',
  modern_market: 'ecommerce',
  furniture_home_store: 'ecommerce',
  tech_gadgets_store: 'ecommerce',
  beauty_cosmetics_store: 'beauty',
  sneaker_streetwear: 'fashion',
  wellness_supplements: 'beauty',
  auto_accessories_store: 'ecommerce',
  multi_location_enterprise: 'professional',
  'island-commerce': 'island-commerce',
  professional: 'professional',
  fashion: 'fashion',
  restaurant: 'restaurant',
  beauty: 'beauty',
  ecommerce: 'ecommerce',
};

export function mapStarterToTemplate(type: StarterType): string {
  switch (type) {
    case 'food': return 'restaurant';
    case 'fashion': return 'fashion';
    case 'beauty': return 'beauty';
    case 'services': return 'professional';
    case 'home': return 'ecommerce';
    default: return 'island-commerce';
  }
}
