/**
 * Honesty locks for published and preview storefronts.
 * Empty blocks are skipped. No dummy SKUs. No invented WhatsApp / hours / stars.
 */

import type { StarterId, StorefrontBlock } from './storeStarters';
import { STORE_STARTERS } from './storeStarters';
import type { FontPair, MerchantColors } from './merchantTheme';

export interface StorefrontVariant {
  id: string;
  title: string;
  price?: number | null;
}

export interface StorefrontItem {
  id: string;
  name: string;
  price?: number | null;
  description?: string;
  imageUrl?: string;
  featured?: boolean;
  category?: string;
  variants?: StorefrontVariant[];
  compatibilityNote?: string;
  specs?: string;
  inStock?: boolean;
  /** Typed count. null/omit = do not claim stock. 0 = sold out. */
  qty?: number | null;
  sku?: string;
}

export type StorefrontMode = 'illustrative' | 'merchant_preview' | 'published';

export interface StorefrontModel {
  templateId: StarterId;
  storeName: string;
  island?: string;
  area?: string;
  specialty?: string;
  hours?: string;
  nextOpen?: string;
  /** true/false when known from hours; omit/null hides Open/Closed */
  isOpen?: boolean | null;
  pickupAddress?: string;
  deliveryAreas?: string;
  whatsappE164?: string;
  currency?: string;
  acceptsCashPickup?: boolean;
  acceptsCod?: boolean;
  wamLive?: boolean;
  reviewCount?: number;
  items?: StorefrontItem[];
  hero?: { headline: string; sub?: string; image?: string };
  about?: string;
  phone?: string;
  trustChips?: string[];
  faq?: Array<{ q: string; a: string }>;
  how?: Array<{ title: string; body: string }>;
  colors?: MerchantColors;
  fontPair?: FontPair;
  logo?: string;
  announcement?: string;
  showAbout?: boolean;
  showContact?: boolean;
  seo?: { title?: string; description?: string };
  social?: { instagram?: string; facebook?: string; tiktok?: string };
  mode?: StorefrontMode;
}

export function mapProductVariants(raw: unknown): StorefrontVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row) => row && (row.title || row.name || row.id || row.options))
    .map((row, i) => {
      const fromOptions = row.options && typeof row.options === 'object'
        ? Object.values(row.options).filter(Boolean).join(' / ')
        : '';
      const title = String(row.title || row.name || fromOptions || `Option ${i + 1}`).trim();
      return {
        id: String(row.id || title),
        title,
        price: row.price != null && Number.isFinite(Number(row.price)) ? Number(row.price) : null,
      };
    })
    .filter((row) => row.title);
}

export function mapProductSpecs(raw: unknown): string {
  if (typeof raw === 'string') return raw.trim();
  if (!raw || typeof raw !== 'object') return '';
  return Object.entries(raw as Record<string, unknown>)
    .filter(([, value]) => value != null && String(value).trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ')
    .slice(0, 240);
}

export function liveItems(model: StorefrontModel): StorefrontItem[] {
  return (model.items || []).filter((item) => item && String(item.name || '').trim());
}

export function featuredItems(model: StorefrontModel): StorefrontItem[] {
  const live = liveItems(model);
  const marked = live.filter((item) => item.featured);
  const pool = marked.length ? marked : live;
  if (model.templateId === 'home') {
    return pool.filter((item) => item.price != null && Number.isFinite(Number(item.price))).slice(0, 1);
  }
  return pool.slice(0, 3);
}

export function catalogEmpty(model: StorefrontModel): boolean {
  return liveItems(model).length === 0;
}

export function emptyCatalogCopy(model: StorefrontModel): string {
  const starter = STORE_STARTERS[model.templateId];
  if (model.mode === 'merchant_preview') return starter.merchantEmpty;
  return starter.emptyCatalog;
}

export function showWhatsApp(model: StorefrontModel): boolean {
  return !!normalizeWhatsappE164(model.whatsappE164);
}

export function normalizeWhatsappE164(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (!trimmed) return '';
  const compact = trimmed.replace(/[^\d+]/g, '');
  if (!/^\+\d{8,15}$/.test(compact)) return '';
  return compact;
}

export function showOrderCta(model: StorefrontModel): boolean {
  if (model.templateId === 'food' && model.isOpen === false) return false;
  return true;
}

export function reviewBadge(reviewCount?: number): { kind: 'new' | 'count'; label: string } {
  const n = Number(reviewCount || 0);
  if (!Number.isFinite(n) || n <= 0) return { kind: 'new', label: 'New' };
  return { kind: 'count', label: `${n} review${n === 1 ? '' : 's'}` };
}

export function realTrustChips(model: StorefrontModel): string[] {
  const chips: string[] = [];
  if (model.acceptsCashPickup) chips.push('Cash / pickup');
  if (model.acceptsCod) chips.push('Cash on delivery');
  if (model.deliveryAreas) chips.push(model.deliveryAreas);
  if (model.hours) chips.push(model.hours);
  if (showWhatsApp(model)) chips.push('WhatsApp');
  const extras = (model.trustChips || []).map((c) => String(c || '').trim()).filter(Boolean);
  for (const extra of extras) {
    if (!chips.includes(extra)) chips.push(extra);
  }
  return chips;
}

export function shouldRenderBlock(block: StorefrontBlock, model: StorefrontModel): boolean {
  const allowed = STORE_STARTERS[model.templateId].blocks;
  if (!allowed.includes(block)) return false;

  switch (block) {
    case 'hero':
    case 'footer':
    case 'sticky':
      return true;
    case 'trust':
      return realTrustChips(model).length > 0;
    case 'featured':
    case 'featured_combo':
      return featuredItems(model).length > 0;
    case 'lookbook':
    case 'menu':
    case 'grid':
    case 'service_list':
      return liveItems(model).length > 0;
    case 'how':
      return Array.isArray(model.how) && model.how.length > 0;
    case 'faq':
      return Array.isArray(model.faq) && model.faq.length > 0;
    default:
      return false;
  }
}

export function visibleBlocks(model: StorefrontModel): StorefrontBlock[] {
  return STORE_STARTERS[model.templateId].blocks.filter((block) => shouldRenderBlock(block, model));
}

export function currencyPrefix(model: StorefrontModel): string {
  const raw = (model.currency || 'TT$').trim();
  return raw || 'TT$';
}

export function formatPrice(model: StorefrontModel, price?: number | null): string | null {
  if (price == null || !Number.isFinite(Number(price))) return null;
  return `${currencyPrefix(model)}${Number(price).toFixed(0)}`;
}

export function parseQty(raw: unknown): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (text === '') return null;
  if (!/^\d+$/.test(text)) return null;
  const n = Number(text);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/** Sold out when qty is 0. Empty qty never prints "In stock". */
export function itemStockLabel(item: Pick<StorefrontItem, 'qty'> & { stock?: unknown }): string {
  const qty = item.qty === 0 || item.qty ? item.qty : parseQty(item.stock);
  if (qty === 0) return 'Sold out';
  if (qty != null && Number.isFinite(Number(qty)) && Number(qty) > 0) {
    return `${Number(qty)} on hand`;
  }
  return '';
}

/** qty 0 or explicit inStock false. Empty qty stays sellable — no invented count. */
export function itemIsSellable(item: StorefrontItem): boolean {
  if (item.qty === 0) return false;
  if (item.inStock === false) return false;
  return true;
}

export function closedFoodNextOpen(model: StorefrontModel): string {
  if (model.templateId !== 'food' || model.isOpen !== false) return '';
  return model.nextOpen ? `Opens ${model.nextOpen}` : 'Closed';
}

/** Merchant-typed bar, else live-rail chips only. Never free shipping / money-back. */
export function announcementLine(model: StorefrontModel): string {
  const typed = String(model.announcement || '').trim();
  if (typed) return typed;
  const bits: string[] = [];
  if (model.acceptsCashPickup) bits.push('Cash at pickup');
  if (model.acceptsCod) bits.push('COD');
  return bits.join(' · ');
}

export function showAboutSection(model: StorefrontModel): boolean {
  if (model.showAbout === false) return false;
  return !!String(model.about || '').trim();
}

export function showContactSection(model: StorefrontModel): boolean {
  if (model.showContact === false) return false;
  return !!(
    String(model.phone || '').trim()
    || normalizeWhatsappE164(model.whatsappE164)
    || String(model.hours || '').trim()
    || String(model.pickupAddress || '').trim()
  );
}

const STARTER_HERO = /^\/templates\/heroes\/(food|fashion|services|general|beauty|home|electronics|auto)\.(jpg|png)$/;

export function merchantUploadedHero(model: StorefrontModel): boolean {
  const img = String(model.hero?.image || '').trim();
  if (!img) return false;
  if (STARTER_HERO.test(img)) return false;
  return true;
}

/** Gallery and create-store stay labeled until the merchant replaces the photo. */
export function showIllustrativeBanner(model: StorefrontModel): boolean {
  if (model.mode === 'published') return false;
  if (model.mode === 'illustrative') return true;
  if (model.mode === 'merchant_preview') return !merchantUploadedHero(model);
  return false;
}
