/**
 * Local saved cart so a buyer who leaves can come back to the same basket.
 * Client-only. Never invents items — lines that are no longer sellable are dropped.
 */
import type { SelectedModifier } from './productModifiers';
import type { StorefrontItem, StorefrontVariant } from './storefrontHonesty';
import { itemIsSellable } from './storefrontHonesty';

export interface SavedCartLine {
  item: StorefrontItem;
  variant?: StorefrontVariant;
  qty: number;
  note?: string;
  selectedModifiers?: SelectedModifier[];
}

const keyFor = (slug: string) => `juvay.cart.v1.${slug}`;

export function loadSavedCart(slug: string, liveItems: StorefrontItem[]): SavedCartLine[] {
  if (!slug || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(keyFor(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const byId = new Map(liveItems.map((i) => [String(i.id), i]));
    const out: SavedCartLine[] = [];
    for (const line of parsed) {
      const live = byId.get(String(line?.item?.id));
      if (!live || !itemIsSellable(live)) continue;
      const qty = Math.max(1, Math.trunc(Number(line.qty) || 1));
      out.push({
        item: live,
        variant: line.variant && live.variants?.find((v) => v.id === line.variant.id) || undefined,
        qty,
        note: typeof line.note === 'string' ? line.note : undefined,
        selectedModifiers: Array.isArray(line.selectedModifiers) ? line.selectedModifiers : undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function saveCart(slug: string, lines: SavedCartLine[]): void {
  if (!slug || typeof localStorage === 'undefined') return;
  try {
    if (!lines.length) {
      localStorage.removeItem(keyFor(slug));
      return;
    }
    localStorage.setItem(keyFor(slug), JSON.stringify(lines));
  } catch {
    // quota or private mode — ignore
  }
}

export function clearSavedCart(slug: string): void {
  if (!slug || typeof localStorage === 'undefined') return;
  try { localStorage.removeItem(keyFor(slug)); } catch { /* ignore */ }
}
