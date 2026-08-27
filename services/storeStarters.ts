/**
 * Six locked store starters. Same chrome. Type changes blocks + default copy.
 * No invented shop names. No dummy SKUs.
 */

export type StarterId = 'food' | 'fashion' | 'services' | 'general' | 'beauty' | 'home';

export type StorefrontBlock =
  | 'hero'
  | 'trust'
  | 'featured_combo'
  | 'featured'
  | 'lookbook'
  | 'menu'
  | 'grid'
  | 'service_list'
  | 'how'
  | 'sticky'
  | 'faq'
  | 'footer';

export interface StarterPalette {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  heroBg: string;
  heroText: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  fontHref: string;
}

export interface StoreStarter {
  id: StarterId;
  name: string;
  useWhen: string;
  chips: string[];
  cta: string;
  heroHeadline: string;
  blocks: StorefrontBlock[];
  palette: StarterPalette;
  emptyCatalog: string;
  merchantEmpty: string;
}

export const STARTER_IDS: StarterId[] = ['food', 'fashion', 'services', 'general', 'beauty', 'home'];

export const FAQ_PAY_LINE =
  'Cash when you collect, or cash on delivery if that option is on. We do not ask for PayPal.';

export const STORE_STARTERS: Record<StarterId, StoreStarter> = {
  food: {
    id: 'food',
    name: 'Food',
    useWhen: 'Cookshops, roti, doubles, bake shops — a menu, not a catalog.',
    chips: ['Menu', 'Cash / COD', 'Pickup hours'],
    cta: 'Order now',
    heroHeadline: 'Cooked this morning. Ready when you reach.',
    blocks: ['hero', 'trust', 'featured_combo', 'menu', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'Nothing on the menu yet.',
    merchantEmpty: 'Add your first item',
    palette: {
      bg: '#1c140c',
      surface: '#2a1d12',
      text: '#f6edd8',
      muted: '#c9b089',
      accent: '#d4a017',
      accentText: '#1c140c',
      heroBg: '#2a1d12',
      heroText: '#f6edd8',
      border: 'rgba(212,160,23,0.28)',
      headingFont: "'Fraunces', Georgia, serif",
      bodyFont: "'Source Sans 3', system-ui, sans-serif",
      fontHref: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Source+Sans+3:wght@400;600;700&display=swap',
    },
  },
  fashion: {
    id: 'fashion',
    name: 'Fashion',
    useWhen: 'Clothes and accessories you can try. Prices on the rack.',
    chips: ['Lookbook', 'Product grid', 'Try in store'],
    cta: 'Shop now',
    heroHeadline: 'Pieces you can try. Prices you can see.',
    blocks: ['hero', 'trust', 'lookbook', 'grid', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'No pieces listed yet.',
    merchantEmpty: 'Add your first item',
    palette: {
      bg: '#f3eee6',
      surface: '#fffdf8',
      text: '#141414',
      muted: '#5c574e',
      accent: '#141414',
      accentText: '#f3eee6',
      heroBg: '#1a1a1a',
      heroText: '#f3eee6',
      border: 'rgba(20,20,20,0.12)',
      headingFont: "'Newsreader', Georgia, serif",
      bodyFont: "'Outfit', system-ui, sans-serif",
      fontHref: 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,700&family=Outfit:wght@400;500;600;700&display=swap',
    },
  },
  services: {
    id: 'services',
    name: 'Services',
    useWhen: 'Barber, salon chair, repairs, lessons — book a time.',
    chips: ['Service list', 'Book a time', 'Cash when you come'],
    cta: 'Book now',
    heroHeadline: 'Book a time. Pay cash when you come.',
    blocks: ['hero', 'trust', 'service_list', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'No services listed yet.',
    merchantEmpty: 'Add your first service',
    palette: {
      bg: '#f3f5f2',
      surface: '#ffffff',
      text: '#1e293b',
      muted: '#475569',
      accent: '#84cc16',
      accentText: '#14532d',
      heroBg: '#1e293b',
      heroText: '#f8fafc',
      border: 'rgba(30,41,59,0.12)',
      headingFont: "'Source Serif 4', Georgia, serif",
      bodyFont: "'IBM Plex Sans', system-ui, sans-serif",
      fontHref: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap',
    },
  },
  general: {
    id: 'general',
    name: 'General',
    useWhen: 'A one-page shop for mixed retail. The free default.',
    chips: ['Product grid', 'Cash or pickup', 'One page'],
    cta: 'Shop now',
    heroHeadline: 'Shop local. Cash or pickup.',
    blocks: ['hero', 'trust', 'featured', 'grid', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'Nothing in the shop yet.',
    merchantEmpty: 'Add your first item',
    palette: {
      bg: '#f4efe6',
      surface: '#fffaf2',
      text: '#2a2a2a',
      muted: '#6b6256',
      accent: '#c4a574',
      accentText: '#2a2a2a',
      heroBg: '#2a2a2a',
      heroText: '#f4efe6',
      border: 'rgba(42,42,42,0.12)',
      headingFont: "'Libre Baskerville', Georgia, serif",
      bodyFont: "'Source Sans 3', system-ui, sans-serif",
      fontHref: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap',
    },
  },
  beauty: {
    id: 'beauty',
    name: 'Beauty',
    useWhen: 'Retail cosmetics and kits. Chair or salon booking is Services.',
    chips: ['Kits & shades', 'Cash on pickup', 'Retail only'],
    cta: 'Shop now',
    heroHeadline: 'Shades and kits. Cash on pickup.',
    blocks: ['hero', 'trust', 'featured', 'grid', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'No shades or kits listed yet.',
    merchantEmpty: 'Add your first item',
    palette: {
      bg: '#faf6f3',
      surface: '#fffdfb',
      text: '#3d2c2e',
      muted: '#7a5f62',
      accent: '#d4a5a5',
      accentText: '#3d2c2e',
      heroBg: '#f3e4e4',
      heroText: '#3d2c2e',
      border: 'rgba(212,165,165,0.4)',
      headingFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Outfit', system-ui, sans-serif",
      fontHref: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Outfit:wght@400;500;600;700&display=swap',
    },
  },
  home: {
    id: 'home',
    name: 'Home',
    useWhen: 'Furniture and home pieces. One hero item if you list one.',
    chips: ['Furniture grid', 'Pickup', 'Price on the piece'],
    cta: 'Shop now',
    heroHeadline: 'Furniture you can see. Price on the piece.',
    blocks: ['hero', 'trust', 'featured', 'grid', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'No furniture listed yet.',
    merchantEmpty: 'Add your first item',
    palette: {
      bg: '#f3efe8',
      surface: '#fbf8f3',
      text: '#3d3429',
      muted: '#6e6558',
      accent: '#8b7355',
      accentText: '#f3efe8',
      heroBg: '#e8dfd2',
      heroText: '#3d3429',
      border: 'rgba(139,115,85,0.28)',
      headingFont: "'Fraunces', Georgia, serif",
      bodyFont: "'Nunito Sans', system-ui, sans-serif",
      fontHref: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Nunito+Sans:wght@400;600;700&display=swap',
    },
  },
};

/** basic one-page storefront stays the free default and maps to general */
export const BASIC_STARTER_ALIAS = 'basic' as const;

export const GALLERY_TO_STARTER: Record<string, StarterId> = {
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

export function isStarterId(value: string | null | undefined): value is StarterId {
  return !!value && STARTER_IDS.includes(value as StarterId);
}

export function resolveStarterId(raw?: string | null): StarterId {
  if (!raw) return 'general';
  const mapped = GALLERY_TO_STARTER[raw];
  if (mapped) return mapped;
  if (isStarterId(raw)) return raw;
  return 'general';
}

export function starterList(includeBasicAlias = true): Array<StoreStarter & { galleryId: string }> {
  const list = STARTER_IDS.map((id) => ({ ...STORE_STARTERS[id], galleryId: id }));
  if (!includeBasicAlias) return list;
  return [
    ...list,
    { ...STORE_STARTERS.general, galleryId: 'basic', name: 'Basic', useWhen: 'Free default. Same as General — one page, cash or pickup.' },
  ];
}

export function applyCopyTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => tokens[key] ?? '');
}

export function defaultHowSteps(input: {
  templateId: StarterId;
  acceptsPickup?: boolean;
  acceptsCod?: boolean;
  wamLive?: boolean;
}): Array<{ title: string; body: string }> {
  const browse =
    input.templateId === 'food' ? 'See the menu' :
    input.templateId === 'services' ? 'Pick a service' :
    'Browse the shop';
  const action =
    input.templateId === 'food' ? 'Place your order' :
    input.templateId === 'services' ? 'Book a time' :
    'Ask for the piece';
  const payBits: string[] = [];
  if (input.acceptsPickup) payBits.push('cash when you collect');
  if (input.acceptsCod) payBits.push('cash on delivery if we deliver to you');
  if (input.wamLive) payBits.push('card or Wam if that checkout is on for this shop');
  const pay = payBits.length
    ? payBits.join(', or ')
    : 'pay in a way this shop has turned on — we do not invent a rail';
  return [
    { title: '1. ' + browse, body: 'What is listed is what is for sale. Empty means nothing is listed yet.' },
    { title: '2. ' + action, body: input.templateId === 'services' ? 'A time you can keep. No fake reviews.' : 'Message or order from this page.' },
    { title: '3. Pay on the live rails', body: pay.charAt(0).toUpperCase() + pay.slice(1) + '.' },
  ];
}

export function defaultFaq(input: {
  acceptsPickup?: boolean;
  acceptsCod?: boolean;
  hours?: string;
  pickupAddress?: string;
  deliveryAreas?: string;
}): Array<{ q: string; a: string }> {
  const faq: Array<{ q: string; a: string }> = [
    { q: 'How do I pay?', a: FAQ_PAY_LINE },
  ];
  if (input.deliveryAreas || input.acceptsCod || input.acceptsPickup || input.pickupAddress) {
    const bits: string[] = [];
    if (input.acceptsPickup || input.pickupAddress) {
      bits.push(input.pickupAddress ? `Pickup at ${input.pickupAddress}.` : 'Pickup is on.');
    }
    if (input.deliveryAreas) bits.push(`Delivery areas: ${input.deliveryAreas}.`);
    else if (input.acceptsCod) bits.push('Cash on delivery if that option is on for your area.');
    if (!bits.length) bits.push('Ask the shop. We do not invent a delivery zone.');
    faq.push({ q: 'Pickup or delivery?', a: bits.join(' ') });
  }
  if (input.hours) {
    faq.push({ q: 'When are you open?', a: input.hours });
  }
  if (faq.length < 3) {
    faq.push({ q: 'Do you take PayPal?', a: 'No. Cash when you collect, or cash on delivery if that option is on.' });
  }
  return faq.slice(0, 3);
}
