/**
 * Eight locked store starters. Same chrome. Type changes blocks + copy + palette.
 * No invented shop names. No dummy SKUs.
 */

export type StarterId =
  | 'food'
  | 'fashion'
  | 'services'
  | 'general'
  | 'beauty'
  | 'home'
  | 'electronics'
  | 'auto';

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

export type HeroLayout = 'split' | 'bleed' | 'overlay';

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
  field: string;
}

export interface StoreStarter {
  id: StarterId;
  name: string;
  useWhen: string;
  chips: string[];
  cta: string;
  heroHeadline: string;
  heroLayout: HeroLayout;
  blocks: StorefrontBlock[];
  palette: StarterPalette;
  emptyCatalog: string;
  merchantEmpty: string;
}

export const STARTER_IDS: StarterId[] = [
  'food', 'fashion', 'services', 'general', 'beauty', 'home', 'electronics', 'auto',
];

export const GALLERY_FILTERS = [
  { id: 'all', name: 'All' },
  { id: 'food', name: 'Food' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'services', name: 'Services' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'home', name: 'Home' },
  { id: 'auto', name: 'Auto' },
  { id: 'electronics', name: 'Electronics' },
];

export const FAQ_PAY_LINE =
  'Cash when you collect, or cash on delivery if that option is on. We do not ask for PayPal.';

export const ISLAND = {
  sand: '#FFF8F0',
  mango: '#FFC300',
  mangoInk: '#141414',
  teal: '#0D9488',
  pepper: '#E31C23',
};

const SERIF_SANS = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Newsreader:opsz,wght@6..72,500;6..72,700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&family=Cormorant+Garamond:wght@500;600;700&family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600;700&family=Outfit:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Nunito+Sans:wght@400;600;700&display=swap";

export const STORE_STARTERS: Record<StarterId, StoreStarter> = {
  food: {
    id: 'food',
    name: 'Food',
    useWhen: 'Roti, doubles, bakery, street stall — a menu, not a catalog.',
    chips: ['Menu', 'Cash / COD', 'Pickup hours'],
    cta: 'Order now',
    heroHeadline: 'Cooked this morning. Ready when you reach.',
    heroLayout: 'split',
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
      heroBg: '#1c140c',
      heroText: '#f6edd8',
      border: 'rgba(212,160,23,0.28)',
      headingFont: "'Fraunces', Georgia, serif",
      bodyFont: "'Source Sans 3', system-ui, sans-serif",
      fontHref: SERIF_SANS,
      field: 'radial-gradient(ellipse at 58% 42%, #d4a017 0%, #7a3f12 48%, #1c140c 100%)',
    },
  },
  fashion: {
    id: 'fashion',
    name: 'Fashion',
    useWhen: 'Boutique, carnival wear, streetwear. Try it. See the price.',
    chips: ['Lookbook', 'Product grid', 'Size before add'],
    cta: 'Shop now',
    heroHeadline: 'Pieces you can try. Prices you can see.',
    heroLayout: 'bleed',
    blocks: ['hero', 'trust', 'lookbook', 'grid', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'No pieces listed yet.',
    merchantEmpty: 'Add your first item',
    palette: {
      bg: '#F3EEE6',
      surface: '#FFF8F0',
      text: '#141414',
      muted: '#5c574e',
      accent: '#141414',
      accentText: '#F3EEE6',
      heroBg: '#141414',
      heroText: '#F3EEE6',
      border: 'rgba(20,20,20,0.12)',
      headingFont: "'Newsreader', Georgia, serif",
      bodyFont: "'Outfit', system-ui, sans-serif",
      fontHref: SERIF_SANS,
      field: 'linear-gradient(165deg, #2c2c2c 0%, #141414 42%, #c4b8a4 100%)',
    },
  },
  services: {
    id: 'services',
    name: 'Services',
    useWhen: 'Barber, salon chair, repairs, lessons — book a time.',
    chips: ['Service list', 'Book a time', 'Cash when you come'],
    cta: 'Book now',
    heroHeadline: 'Book a time. Pay cash when you come.',
    heroLayout: 'split',
    blocks: ['hero', 'trust', 'service_list', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'No services listed yet.',
    merchantEmpty: 'Add your first service',
    palette: {
      bg: '#F3F5F2',
      surface: '#FFF8F0',
      text: '#1e293b',
      muted: '#475569',
      accent: '#84cc16',
      accentText: '#14532d',
      heroBg: '#1e293b',
      heroText: '#f8fafc',
      border: 'rgba(30,41,59,0.12)',
      headingFont: "'Source Serif 4', Georgia, serif",
      bodyFont: "'IBM Plex Sans', system-ui, sans-serif",
      fontHref: SERIF_SANS,
      field: 'linear-gradient(180deg, #1e293b 0%, #334155 52%, #84cc16 100%)',
    },
  },
  general: {
    id: 'general',
    name: 'General',
    useWhen: 'Mixed retail / marketplace stall. The free one-page default.',
    chips: ['Product grid', 'Cash or pickup', 'One page'],
    cta: 'Shop now',
    heroHeadline: 'Shop local. Cash or pickup.',
    heroLayout: 'overlay',
    blocks: ['hero', 'trust', 'featured', 'grid', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'Nothing in the shop yet.',
    merchantEmpty: 'Add your first item',
    palette: {
      bg: '#FFF8F0',
      surface: '#FFF8F0',
      text: '#2a2a2a',
      muted: '#6b6256',
      accent: '#c4a574',
      accentText: '#2a2a2a',
      heroBg: '#2a2a2a',
      heroText: '#FFF8F0',
      border: 'rgba(42,42,42,0.12)',
      headingFont: "'Libre Baskerville', Georgia, serif",
      bodyFont: "'Source Sans 3', system-ui, sans-serif",
      fontHref: SERIF_SANS,
      field: 'linear-gradient(160deg, #3d3429 0%, #c4a574 56%, #FFF8F0 100%)',
    },
  },
  beauty: {
    id: 'beauty',
    name: 'Beauty',
    useWhen: 'Retail cosmetics and kits. Chair or salon booking is Services.',
    chips: ['Kits & shades', 'Cash on pickup', 'Retail only'],
    cta: 'Shop now',
    heroHeadline: 'Shades and kits. Cash on pickup.',
    heroLayout: 'overlay',
    blocks: ['hero', 'trust', 'featured', 'grid', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'No shades or kits listed yet.',
    merchantEmpty: 'Add your first item',
    palette: {
      bg: '#FAF6F3',
      surface: '#FFF8F0',
      text: '#3d2c2e',
      muted: '#7a5f62',
      accent: '#d4a5a5',
      accentText: '#3d2c2e',
      heroBg: '#f3e4e4',
      heroText: '#3d2c2e',
      border: 'rgba(212,165,165,0.4)',
      headingFont: "'Cormorant Garamond', Georgia, serif",
      bodyFont: "'Outfit', system-ui, sans-serif",
      fontHref: SERIF_SANS,
      field: 'radial-gradient(circle at 40% 30%, #f7e8e8 0%, #d4a5a5 58%, #3d2c2e 100%)',
    },
  },
  home: {
    id: 'home',
    name: 'Home',
    useWhen: 'Furniture and household pieces. Larger tiles. Price on the piece.',
    chips: ['Furniture grid', 'Pickup', 'Price on the piece'],
    cta: 'Shop now',
    heroHeadline: 'Furniture you can see. Price on the piece.',
    heroLayout: 'overlay',
    blocks: ['hero', 'trust', 'featured', 'grid', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'No furniture listed yet.',
    merchantEmpty: 'Add your first item',
    palette: {
      bg: '#F3EFE8',
      surface: '#FFF8F0',
      text: '#3d3429',
      muted: '#6e6558',
      accent: '#8b7355',
      accentText: '#FFF8F0',
      heroBg: '#e8dfd2',
      heroText: '#3d3429',
      border: 'rgba(139,115,85,0.28)',
      headingFont: "'Fraunces', Georgia, serif",
      bodyFont: "'Nunito Sans', system-ui, sans-serif",
      fontHref: SERIF_SANS,
      field: 'linear-gradient(180deg, #e8dfd2 0%, #8b7355 68%, #3d3429 100%)',
    },
  },
  electronics: {
    id: 'electronics',
    name: 'Electronics',
    useWhen: 'Phones and gadgets. Color or storage only if the SKU has them.',
    chips: ['Product grid', 'Variant before add', 'Specs if typed'],
    cta: 'Shop now',
    heroHeadline: 'Phones and gadgets. Price on the piece.',
    heroLayout: 'overlay',
    blocks: ['hero', 'trust', 'featured', 'grid', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'No gadgets listed yet.',
    merchantEmpty: 'Add your first item',
    palette: {
      bg: '#F4F6F6',
      surface: '#FFF8F0',
      text: '#0a0f14',
      muted: '#4a5560',
      accent: '#0D9488',
      accentText: '#FFF8F0',
      heroBg: '#0a0f14',
      heroText: '#e8f4f2',
      border: 'rgba(13,148,136,0.22)',
      headingFont: "'Source Serif 4', Georgia, serif",
      bodyFont: "'IBM Plex Sans', system-ui, sans-serif",
      fontHref: SERIF_SANS,
      field: 'linear-gradient(160deg, #0a0f14 0%, #0D9488 52%, #0a0f14 100%)',
    },
  },
  auto: {
    id: 'auto',
    name: 'Auto',
    useWhen: 'Parts and accessories. Search + grid. Fit is a merchant note, not a checker.',
    chips: ['Search + grid', 'Merchant fit note', 'Cash or pickup'],
    cta: 'Shop now',
    heroHeadline: 'Parts and accessories. Ask if it fits.',
    heroLayout: 'overlay',
    blocks: ['hero', 'trust', 'featured', 'grid', 'how', 'sticky', 'faq', 'footer'],
    emptyCatalog: 'No parts listed yet.',
    merchantEmpty: 'Add your first item',
    palette: {
      bg: '#F6F3EE',
      surface: '#FFF8F0',
      text: '#1a1a1a',
      muted: '#5c5348',
      accent: '#d97706',
      accentText: '#1a1a1a',
      heroBg: '#1a1a1a',
      heroText: '#f4efe6',
      border: 'rgba(217,119,6,0.28)',
      headingFont: "'Fraunces', Georgia, serif",
      bodyFont: "'Source Sans 3', system-ui, sans-serif",
      fontHref: SERIF_SANS,
      field: 'linear-gradient(160deg, #1a1a1a 0%, #d97706 46%, #111 100%)',
    },
  },
};

export const GALLERY_TO_STARTER: Record<string, StarterId> = {
  food: 'food',
  fashion: 'fashion',
  services: 'services',
  general: 'general',
  beauty: 'beauty',
  home: 'home',
  electronics: 'electronics',
  auto: 'auto',
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
  tech_gadgets_store: 'electronics',
  auto_accessories_store: 'auto',
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

export function starterList(): Array<StoreStarter & { galleryId: string }> {
  return STARTER_IDS.map((id) => ({ ...STORE_STARTERS[id], galleryId: id }));
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
    input.templateId === 'auto' ? 'Search the parts' :
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
