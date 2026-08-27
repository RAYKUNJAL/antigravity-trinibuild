/**
 * Honesty locks for published and preview storefronts.
 * Empty blocks are skipped. No dummy SKUs. No invented WhatsApp / hours / stars.
 */

import type { StarterId, StorefrontBlock } from './storeStarters';
import { STORE_STARTERS } from './storeStarters';

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
  trustChips?: string[];
  faq?: Array<{ q: string; a: string }>;
  how?: Array<{ title: string; body: string }>;
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

/** Explicit false / zero stock only. Missing stock stays sellable. */
export function itemIsSellable(item: StorefrontItem): boolean {
  return item.inStock !== false;
}

export function closedFoodNextOpen(model: StorefrontModel): string {
  if (model.templateId !== 'food' || model.isOpen !== false) return '';
  return model.nextOpen ? `Opens ${model.nextOpen}` : 'Closed';
}

/** One announcement line from live rails only. Never free shipping / money-back. */
export function announcementLine(model: StorefrontModel): string {
  const bits: string[] = [];
  if (model.acceptsCashPickup) bits.push('Cash at pickup');
  if (model.acceptsCod) bits.push('COD');
  return bits.join(' · ');
}
