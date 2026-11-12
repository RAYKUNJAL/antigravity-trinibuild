/**
 * Sample catalog used ONLY in illustrative (gallery / template preview) mode.
 * Every row is named and badged as a sample. Never attached to published stores.
 */
import type { StarterId } from './storeStarters';
import type { StorefrontItem } from './storefrontHonesty';
import { heroStem } from './storeDesignTokens';

export const SAMPLE_ITEM_NOTE = 'Sample item for layout only — not for sale.';

function sample(
  id: string,
  name: string,
  price: number,
  imageUrl: string,
  extra: Partial<StorefrontItem> = {},
): StorefrontItem {
  return {
    id,
    name,
    price,
    imageUrl,
    description: SAMPLE_ITEM_NOTE,
    isSample: true,
    featured: extra.featured ?? false,
    category: extra.category,
    ...extra,
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
        sample('sample-food-1', 'Sample roti plate', 45, a, { featured: true, category: 'Mains' }),
        sample('sample-food-2', 'Sample wrap', 18, b, { category: 'Mains' }),
        sample('sample-food-3', 'Sample juice', 12, c, { category: 'Drinks' }),
      ];
    case 'doubles':
      return [
        sample('sample-doubles-1', 'Sample wrap', 12, a, { featured: true, category: 'Wraps' }),
        sample('sample-doubles-2', 'Sample wrap, plain', 10, b, { category: 'Wraps' }),
        sample('sample-doubles-3', 'Sample wrap, slight pepper', 12, c, { category: 'Wraps' }),
      ];
    case 'street_food':
      return [
        sample('sample-street-1', 'Sample corn soup', 25, a, { featured: true, category: 'Today' }),
        sample('sample-street-2', 'Sample fried chicken', 30, b, { category: 'Plates' }),
        sample('sample-street-3', 'Sample bake', 22, c, { category: 'Plates' }),
      ];
    case 'fashion':
      return [
        sample('sample-fashion-1', 'Sample linen shirt', 180, a, { featured: true, category: 'The rack' }),
        sample('sample-fashion-2', 'Sample leather bag', 320, b, { featured: true, category: 'The rack' }),
        sample('sample-fashion-3', 'Sample scarf', 90, c, { category: 'The rack' }),
      ];
    case 'services':
      return [
        sample('sample-svc-1', 'Sample haircut', 80, a, { featured: true, category: 'Chair' }),
        sample('sample-svc-2', 'Sample trim', 40, b, { category: 'Chair' }),
        sample('sample-svc-3', 'Sample consultation', 60, c, { category: 'Chair' }),
      ];
    case 'general':
      return [
        sample('sample-gen-1', 'Sample grocery bag', 15, a, { featured: true, category: 'Shop' }),
        sample('sample-gen-2', 'Sample mug', 45, b, { category: 'Shop' }),
        sample('sample-gen-3', 'Sample tote', 60, c, { category: 'Shop' }),
      ];
    case 'beauty':
      return [
        sample('sample-beauty-1', 'Sample tonic', 85, a, { featured: true, category: 'Kits' }),
        sample('sample-beauty-2', 'Sample serum', 110, b, { featured: true, category: 'Kits' }),
        sample('sample-beauty-3', 'Sample compact', 70, c, { category: 'Kits' }),
      ];
    case 'home':
      return [
        sample('sample-home-1', 'Sample armchair', 1200, a, { featured: true, category: 'Furniture' }),
        sample('sample-home-2', 'Sample throw', 180, b, { category: 'Furniture' }),
        sample('sample-home-3', 'Sample side table', 450, c, { category: 'Furniture' }),
      ];
    case 'electronics':
      return [
        sample('sample-el-1', 'Sample phone', 2200, a, { featured: true, category: 'Gadgets', specs: 'Sample specs — merchant types the real ones.' }),
        sample('sample-el-2', 'Sample earbuds', 450, b, { category: 'Gadgets' }),
        sample('sample-el-3', 'Sample case', 80, c, { category: 'Gadgets' }),
      ];
    case 'auto':
      return [
        sample('sample-auto-1', 'Sample disc', 280, a, { featured: true, category: 'Parts', compatibilityNote: 'Fit is a merchant note. This is a sample.' }),
        sample('sample-auto-2', 'Sample wrench', 65, b, { category: 'Parts' }),
        sample('sample-auto-3', 'Sample accessory', 90, c, { category: 'Parts' }),
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
