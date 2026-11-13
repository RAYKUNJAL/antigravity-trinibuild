/**
 * JSON-LD for a published store and its priced items.
 * AggregateRating is included only when reviewCount > 0 and average is a real number.
 * Never emits a 5.0 or a review count that was not passed in.
 */
import type { StorefrontModel } from './storefrontHonesty';
import { liveItems, itemIsSellable, formatPrice, currencyPrefix } from './storefrontHonesty';

export function storeJsonLd(model: StorefrontModel, pageUrl: string, reviews?: { count: number; average: number | null }) {
  const url = pageUrl || '';
  const store: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: model.storeName,
    url,
    image: model.hero?.image || model.logo || undefined,
    address: model.pickupAddress
      ? { '@type': 'PostalAddress', streetAddress: model.pickupAddress, addressRegion: model.island || undefined }
      : (model.island ? { '@type': 'PostalAddress', addressRegion: model.island } : undefined),
    telephone: model.phone || undefined,
    openingHours: model.hours || undefined,
  };
  const count = reviews?.count ?? Number(model.reviewCount || 0);
  const avg = reviews?.average ?? null;
  if (count > 0 && avg != null && Number.isFinite(avg)) {
    store.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(avg),
      reviewCount: String(count),
      bestRating: '5',
      worstRating: '1',
    };
  }
  const products = liveItems(model).filter((i) => i.price != null && Number.isFinite(Number(i.price)));
  const productNodes = products.slice(0, 40).map((item) => {
    const node: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: item.name,
      description: item.description || undefined,
      image: item.imageUrl || undefined,
      sku: item.sku || undefined,
      offers: {
        '@type': 'Offer',
        price: Number(item.price).toFixed(2),
        priceCurrency: 'TTD',
        availability: itemIsSellable(item)
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
        url: url ? `${url}#item-${item.id}` : undefined,
      },
    };
    return node;
  });
  return { store, products: productNodes };
}

export function productOfferLabel(model: StorefrontModel, price: number | null | undefined): string | null {
  const formatted = formatPrice(model, price);
  if (!formatted) return null;
  const prefix = currencyPrefix(model);
  return formatted.startsWith(prefix) ? formatted : `${prefix}${formatted}`;
}
