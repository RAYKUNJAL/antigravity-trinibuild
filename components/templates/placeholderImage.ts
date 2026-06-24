/**
 * Category-aware fallback product images.
 *
 * Returns a relevant Unsplash photo URL (w=600&q=80) for a given product
 * category.  When `image_url` is missing on a product, templates call this
 * helper so demo/empty stores still look professionally photographed.
 *
 * A real merchant upload ALWAYS takes priority — callers do:
 *   src={p.image_url || getPlaceholderImage(p.category, p.id)}
 *
 * Pure, no dependencies.
 */

const U = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80`;

/** Generic default product photo. */
const GENERIC = U('photo-1472851294608-062f824d29cc');

/** Map of lower-case keyword → pool of Unsplash photo IDs. */
const POOLS: { keywords: string[]; ids: string[] }[] = [
  {
    keywords: ['fashion', 'apparel', 'clothing', 'shirt', 'dress', 'wear', 'garment'],
    ids: [
      'photo-1496747611176-843222e1e57c',
      'photo-1521572163474-6864f9cf17ab',
      'photo-1551232864-3f0890e580d9',
    ],
  },
  {
    keywords: ['food', 'restaurant', 'bakery', 'menu', 'meal', 'dish', 'cuisine', 'kitchen'],
    ids: [
      'photo-1504674900247-0877df9cc836',
      'photo-1565299585323-38d6b0865b47',
      'photo-1414235077428-338989a2e8c0',
    ],
  },
  {
    keywords: ['beauty', 'cosmetic', 'makeup', 'skincare', 'salon', 'spa', 'nail'],
    ids: [
      'photo-1522335789203-aabd1fc54bc9',
      'photo-1620916566398-39f1143ab7be',
      'photo-1586495777744-4e6232bf2f6a',
    ],
  },
  {
    keywords: ['electronic', 'tech', 'gadget', 'phone', 'computer', 'device', 'gaming'],
    ids: [
      'photo-1511707171634-5f897ff02aa9',
      'photo-1496181133206-80ce9b88a853',
      'photo-1505740420928-5e560c06d30e',
    ],
  },
  {
    keywords: ['furniture', 'home', 'decor', 'interior', 'sofa', 'chair', 'table'],
    ids: [
      'photo-1567538096621-38d2284b23ff',
      'photo-1555041469-a586c61ea9bc',
    ],
  },
  {
    keywords: ['auto', 'car', 'part', 'vehicle', 'automotive', 'tire', 'engine'],
    ids: ['photo-1492144534655-ae79c964c9d7'],
  },
  {
    keywords: ['jewelry', 'jewellery', 'ring', 'necklace', 'gold', 'diamond', 'accessorie'],
    ids: ['photo-1515562141207-7a88fb7ce338'],
  },
  {
    keywords: ['sneaker', 'shoe', 'footwear', 'boot', 'trainer'],
    ids: [
      'photo-1491553895911-0055eca6402d',
      'photo-1542291026-7eec264c27ff',
    ],
  },
];

/** Stable hash from an arbitrary seed → non-negative integer. */
function hashSeed(seed?: string | number): number {
  if (seed === undefined || seed === null) return 0;
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Returns an Unsplash photo URL appropriate for the given category.
 *
 * @param category Product category, business type, or domain hint
 *                (case-insensitive, partial match against keyword pools).
 * @param seed     Product id, index, or any stable value — used to pick
 *                deterministically from the pool so a grid doesn't show
 *                identical images.
 */
export function getPlaceholderImage(category?: string, seed?: string | number): string {
  if (!category) return GENERIC;

  const cat = category.toLowerCase();
  for (const pool of POOLS) {
    if (pool.keywords.some((kw) => cat.includes(kw))) {
      const idx = hashSeed(seed) % pool.ids.length;
      return U(pool.ids[idx]);
    }
  }
  return GENERIC;
}

export default getPlaceholderImage;
