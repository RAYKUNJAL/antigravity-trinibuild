/**
 * Placeholder catalog used ONLY in gallery / template preview mode.
 * One page-level Preview banner covers honesty — item names stay neutral,
 * and no prices are shown. Never attached to published stores.
 */
import type { StarterId } from './storeStarters';
import type { StorefrontItem } from './storefrontHonesty';
import { heroStem } from './storeDesignTokens';

export const SAMPLE_ITEM_NOTE = 'Placeholder for layout — add your own items when you publish.';

function sample(
  id: string,
  name: string,
  imageUrl: string,
  extra: Partial<StorefrontItem> = {},
): StorefrontItem {
  const { price: _ignoredPrice, ...rest } = extra;
  return {
    id,
    name,
    imageUrl,
    description: rest.description ?? SAMPLE_ITEM_NOTE,
    isSample: true,
    featured: rest.featured ?? false,
    category: rest.category,
    ...rest,
    price: null,
  };
}

function imgs(starterId: StarterId): [string, string, string] {
  const stem = heroStem(starterId);
  return [
    `/templates/samples/${stem}-1.webp`,
    `/templates/samples/${stem}-2.webp`,
    `/templates/samples/${stem}-3.webp`,
  ];
}

export function illustrativeSampleItems(id: StarterId): StorefrontItem[] {
  const [a, b, c] = imgs(id);
  switch (id) {
    case 'food':
      return [
        sample('sample-food-1', 'Plate', a, { featured: true, category: 'Mains' }),
        sample('sample-food-2', 'Wrap', b, { category: 'Mains' }),
        sample('sample-food-3', 'Drink', c, { category: 'Drinks' }),
      ];
    case 'doubles':
      return [
        sample('sample-doubles-1', 'Wrap', a, { featured: true, category: 'Wraps' }),
        sample('sample-doubles-2', 'Wrap, plain', b, { category: 'Wraps' }),
        sample('sample-doubles-3', 'Wrap, slight pepper', c, { category: 'Wraps' }),
      ];
    case 'street_food':
      return [
        sample('sample-street-1', 'Soup', a, { featured: true, category: 'Today' }),
        sample('sample-street-2', 'Plate', b, { category: 'Plates' }),
        sample('sample-street-3', 'Bake', c, { category: 'Plates' }),
      ];
    case 'fashion':
      return [
        sample('sample-fashion-1', 'Shirt', a, { featured: true, category: 'The rack' }),
        sample('sample-fashion-2', 'Bag', b, { featured: true, category: 'The rack' }),
        sample('sample-fashion-3', 'Scarf', c, { category: 'The rack' }),
      ];
    case 'services':
      return [
        sample('sample-svc-1', 'Appointment', a, { featured: true, category: 'Chair' }),
        sample('sample-svc-2', 'Follow-up', b, { category: 'Chair' }),
        sample('sample-svc-3', 'Consultation', c, { category: 'Chair' }),
      ];
    case 'general':
      return [
        sample('sample-gen-1', 'Bag', a, { featured: true, category: 'Shop' }),
        sample('sample-gen-2', 'Mug', b, { category: 'Shop' }),
        sample('sample-gen-3', 'Tote', c, { category: 'Shop' }),
      ];
    case 'beauty':
      return [
        sample('sample-beauty-1', 'Bottle', a, { featured: true, category: 'Kits' }),
        sample('sample-beauty-2', 'Jar', b, { featured: true, category: 'Kits' }),
        sample('sample-beauty-3', 'Compact', c, { category: 'Kits' }),
      ];
    case 'home':
      return [
        sample('sample-home-1', 'Chair', a, { featured: true, category: 'Furniture' }),
        sample('sample-home-2', 'Throw', b, { category: 'Furniture' }),
        sample('sample-home-3', 'Table', c, { category: 'Furniture' }),
      ];
    case 'electronics':
      return [
        sample('sample-el-1', 'Device', a, { featured: true, category: 'Gadgets', specs: 'Add your specs when you list the real item.' }),
        sample('sample-el-2', 'Accessory', b, { category: 'Gadgets' }),
        sample('sample-el-3', 'Case', c, { category: 'Gadgets' }),
      ];
    case 'auto':
      return [
        sample('sample-auto-1', 'Part', a, { featured: true, category: 'Parts', compatibilityNote: 'Fit is a note you type on the real listing.' }),
        sample('sample-auto-2', 'Tool', b, { category: 'Parts' }),
        sample('sample-auto-3', 'Accessory', c, { category: 'Parts' }),
      ];
    default:
      return [];
  }
}

export function isSampleItem(item: { isSample?: boolean; id?: string; name?: string } | null | undefined): boolean {
  if (!item) return false;
  if (item.isSample) return true;
  const id = String(item.id || '');
  const name = String(item.name || '').toLowerCase();
  return id.startsWith('sample-') || name.startsWith('sample ');
}
