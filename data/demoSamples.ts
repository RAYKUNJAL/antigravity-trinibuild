/**
 * Pre-generated AI sample results for the landing-page demo.
 *
 * These 4 samples are shown when a visitor clicks a sample photo. The result
 * card appears after a 2.5-second skeleton so it FEELS like an AI call, but
 * we serve canned results to keep the demo instant, zero-cost, and immune to
 * rate limits or key outages.
 *
 * The "Try your own photo" path in the demo component hits the real edge
 * function — that's where the AI actually runs. This file is for the static
 * click-through experience only.
 *
 * Format matches the real edge-function response shape, so the demo UI treats
 * canned and real responses identically.
 *
 * Image credits: placeholder photo URLs — replace with your own once you have
 * proper licensed/owned product photography. Unsplash and free stock sources
 * are used here for the demo; images are served via public CDN.
 */

export interface DemoSample {
  id: string;
  label: string;
  imageUrl: string;
  // What the AI "would have returned" — matches real edge function shape
  result: {
    name: string;
    description: string;
    suggested_price_ttd: number;
    category: string;
    tags: string[];
    confidence: 'high' | 'medium' | 'low';
  };
}

export const DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'doubles',
    label: 'Doubles',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=75',
    result: {
      name: 'Fresh Trini Doubles — 2 piece',
      description: `Authentic Trini doubles made fresh every morning — two warm bara piled with seasoned channa, our house kuchela, tamarind, mother, and pepper to your liking. Wrapped tight and ready to eat on the go.

Perfect for breakfast runs, liming, or that quick bite after lime. We do Carnival bulk orders — let we know ahead of time and we'll have allyuh sorted.

Order by WhatsApp for pickup or delivery. Fresh only. No frozen, no reheated.`,
      suggested_price_ttd: 12,
      category: 'food',
      tags: ['doubles', 'breakfast', 'trini food', 'street food', 'channa'],
      confidence: 'high',
    },
  },
  {
    id: 'coconut-water',
    label: 'Coconut Water',
    imageUrl: 'https://images.unsplash.com/photo-1564631027894-5bdb17618445?w=600&q=75',
    result: {
      name: 'Fresh Jelly Coconut — straight from tree',
      description: `Jelly coconut picked and delivered same day. Opened for you on request, with the jelly inside sweet and soft — no preservatives, no sugar added, nothing but the real thing.

Great for hot days, hangovers, kids, or anyone who just want the real coconut water experience — not the box kind. We carry brown and green, depending on what yuh prefer.

Bulk orders welcome — beach days, office cooler, family lime. Hit us on WhatsApp.`,
      suggested_price_ttd: 15,
      category: 'food',
      tags: ['coconut water', 'fresh', 'natural', 'drinks', 'hydration'],
      confidence: 'high',
    },
  },
  {
    id: 'plantain-chips',
    label: 'Plantain Chips',
    imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&q=75',
    result: {
      name: 'Homemade Plantain Chips — 150g bag',
      description: `Crispy plantain chips made from ripe Trini plantain, hand-sliced and fried in clean oil. Lightly salted and sealed fresh for maximum crunch — none of that stale supermarket taste.

Three flavours: regular salt, pepper, and garlic. Perfect for lunch kit, Carnival fete, kids snack, or just liming at home with a cold drink.

Orders of 5 bags or more get free delivery within San Fernando / POS. Longer shelf life than most — 2 weeks sealed, 3 days open (if they last that long).`,
      suggested_price_ttd: 25,
      category: 'food',
      tags: ['plantain chips', 'snacks', 'homemade', 'crispy', 'trini'],
      confidence: 'high',
    },
  },
  {
    id: 'handcraft',
    label: 'Woven Basket',
    imageUrl: 'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=600&q=75',
    result: {
      name: 'Hand-Woven Straw Basket — Medium',
      description: `Hand-woven straw basket, made in Trinidad by local craftspeople using traditional techniques. Each one is unique — slight variations in weave and colour are part of the character, not a defect.

Great for home decor, shopping, beach day, laundry, or as a gift with real Caribbean character. Roughly 12 inches tall by 10 inches wide, with a sturdy handle that can carry a real load.

Support local craft — every purchase goes directly to the makers.`,
      suggested_price_ttd: 180,
      category: 'art',
      tags: ['handmade', 'craft', 'basket', 'local', 'home decor', 'gift'],
      confidence: 'medium',
    },
  },
];
