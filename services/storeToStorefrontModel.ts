import { defaultFaq, defaultHowSteps, resolveStarterId, STORE_STARTERS, type StarterId } from './storeStarters';
import { normalizeWhatsappE164, type StorefrontItem, type StorefrontModel, type StorefrontMode } from './storefrontHonesty';

function themeOf(store: any): Record<string, any> {
  const raw = store?.theme_config || store?.theme || {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw || {};
}

export function storeToStorefrontModel(store: any, products: any[] = [], mode: StorefrontMode = 'published'): StorefrontModel {
  const theme = themeOf(store);
  const templateId: StarterId = resolveStarterId(
    theme.template_id || theme.business_type || store?.category || store?.template_id
  );
  const starter = STORE_STARTERS[templateId];
  const items: StorefrontItem[] = (products || [])
    .filter((p) => p && (p.status == null || p.status === 'active') && String(p.name || '').trim())
    .map((p) => ({
      id: String(p.id),
      name: p.name,
      price: p.price ?? p.base_price ?? null,
      description: p.description || '',
      imageUrl: p.image_url || p.images?.[0] || '',
      featured: !!p.featured,
      category: p.category || '',
    }));

  const whatsappE164 = normalizeWhatsappE164(store?.whatsapp || theme.whatsappE164 || store?.whatsappE164);
  const hours = theme.hours || (typeof store?.operating_hours === 'string' ? store.operating_hours : '');
  const pickupAddress = store?.pickup_address || store?.address || theme.pickup_address || '';
  const acceptsPickup = store?.accepts_pickup === true;
  const acceptsCod = store?.accepts_cod === true;
  const wamLive = !!(store?.wam_handle && theme.wam_live !== false);

  return {
    templateId,
    storeName: store?.name || starter.name,
    island: store?.island || store?.location || theme.island || '',
    area: theme.area || '',
    specialty: theme.specialty || '',
    hours,
    nextOpen: theme.next_open || '',
    isOpen: typeof theme.is_open === 'boolean' ? theme.is_open : null,
    pickupAddress,
    deliveryAreas: theme.delivery_areas || store?.delivery_areas || '',
    whatsappE164,
    currency: store?.settings?.currency === 'TTD' ? 'TT$' : (store?.settings?.currency || theme.currency || 'TT$'),
    acceptsCashPickup: acceptsPickup,
    acceptsCod,
    wamLive,
    reviewCount: Number(store?.review_count || store?.reviewCount || 0),
    items,
    hero: theme.hero || { headline: starter.heroHeadline, sub: [theme.specialty, store?.island].filter(Boolean).join(' · ') },
    about: theme.about || store?.description || '',
    trustChips: Array.isArray(theme.trustChips) ? theme.trustChips : [],
    faq: Array.isArray(theme.faq) && theme.faq.length ? theme.faq : defaultFaq({
      acceptsPickup,
      acceptsCod,
      hours,
      pickupAddress,
      deliveryAreas: theme.delivery_areas,
    }),
    how: Array.isArray(theme.how) && theme.how.length ? theme.how : defaultHowSteps({
      templateId,
      acceptsPickup,
      acceptsCod,
      wamLive,
    }),
    mode,
  };
}

export function storeUsesStarter(store: any): boolean {
  const theme = themeOf(store);
  const raw = theme.template_id || theme.business_type || store?.category || store?.template_id;
  return ['food', 'fashion', 'services', 'general', 'beauty', 'home', 'basic'].includes(String(raw || ''));
}
