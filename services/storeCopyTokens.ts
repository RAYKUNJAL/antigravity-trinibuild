/**
 * Merchant store copy tokens. Locked headlines. No preview shop names.
 */

import { FAQ_PAY_LINE, STORE_STARTERS, type StarterId } from './storeStarters';

export type StarterType = StarterId;

export interface StoreTokens {
  store_name: string;
  area: string;
  island: string;
  hours: string;
  next_open: string;
  pickup_address: string;
  delivery_areas: string;
  whatsapp: string;
  specialty: string;
  currency: string;
  accepts_pickup: boolean;
  accepts_cod: boolean;
  whatsapp_on: boolean;
  wam_on: boolean;
}

export const SHARED_PAY_LINE = FAQ_PAY_LINE;

export function applyTokens(template: string, t: StoreTokens): string {
  return template
    .replaceAll('{{store_name}}', t.store_name || 'Your store')
    .replaceAll('{{area}}', t.area || '')
    .replaceAll('{{island}}', t.island || '')
    .replaceAll('{{hours}}', t.hours || '')
    .replaceAll('{{next_open}}', t.next_open || '')
    .replaceAll('{{pickup_address}}', t.pickup_address || '')
    .replaceAll('{{delivery_areas}}', t.delivery_areas || '')
    .replaceAll('{{whatsapp}}', t.whatsapp || '')
    .replaceAll('{{specialty}}', t.specialty || '')
    .replaceAll('{{currency}}', t.currency || 'TT$');
}

export function payLine(t: StoreTokens): string {
  return FAQ_PAY_LINE;
}

export const VERTICAL_COPY: Record<StarterType, {
  hero: string;
  ctaPrimary: string;
  ctaWhatsapp: string;
  trust: string;
}> = {
  food: {
    hero: STORE_STARTERS.food.heroHeadline,
    ctaPrimary: 'Order now',
    ctaWhatsapp: 'WhatsApp',
    trust: '',
  },
  fashion: {
    hero: STORE_STARTERS.fashion.heroHeadline,
    ctaPrimary: 'Shop now',
    ctaWhatsapp: 'WhatsApp',
    trust: '',
  },
  services: {
    hero: STORE_STARTERS.services.heroHeadline,
    ctaPrimary: 'Book now',
    ctaWhatsapp: 'WhatsApp',
    trust: '',
  },
  general: {
    hero: STORE_STARTERS.general.heroHeadline,
    ctaPrimary: 'Shop now',
    ctaWhatsapp: 'WhatsApp',
    trust: '',
  },
  beauty: {
    hero: STORE_STARTERS.beauty.heroHeadline,
    ctaPrimary: 'Shop now',
    ctaWhatsapp: 'WhatsApp',
    trust: '',
  },
  home: {
    hero: STORE_STARTERS.home.heroHeadline,
    ctaPrimary: 'Shop now',
    ctaWhatsapp: 'WhatsApp',
    trust: '',
  },
};

export const GALLERY_TO_BUILDER: Record<string, string> = {
  food: 'food',
  fashion: 'fashion',
  services: 'services',
  general: 'general',
  beauty: 'beauty',
  home: 'home',
  basic: 'general',
  basic_storefront: 'general',
  roti_shop_pro: 'food',
  doubles_breakfast_pro: 'food',
  restaurant_premium: 'food',
  restaurant: 'food',
  clothing_store_pro: 'fashion',
  sneaker_streetwear: 'fashion',
  salon_barber_pro: 'services',
  professional: 'services',
  modern_market: 'general',
  'island-commerce': 'general',
  ecommerce: 'general',
  furniture_home_store: 'home',
  beauty_cosmetics_store: 'beauty',
  wellness_supplements: 'beauty',
  tech_gadgets_store: 'general',
  auto_accessories_store: 'general',
  multi_location_enterprise: 'general',
};

export function mapStarterToTemplate(type: StarterType): string {
  return type;
}
