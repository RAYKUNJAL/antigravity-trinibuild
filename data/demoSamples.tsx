/**
 * Pre-generated AI sample results for the landing-page demo.
 *
 * History of this file — kept so we don't loop:
 *   - v1 (Unsplash URLs): photos mismatched labels (doubles showed as rice
 *     cakes, coconut water as an apartment). External URLs are brittle.
 *   - v2 (inline SVG illustrations): fixed correctness but looked too
 *     cartoonish for a real demo — the brand is "AI reads YOUR real product
 *     photo and writes the listing," and cartoon samples undercut that.
 *   - v3 (THIS): real Creative Commons photos, downloaded once from
 *     Wikimedia Commons, resized to 640px, hosted on our own Supabase CDN
 *     under site-assets/demo/. Real product photos. Can't rot. Can't
 *     mismatch (we uploaded them, we named them). Fast (same-origin CDN).
 *     Under 300KB each.
 *
 * Source files (all CC-licensed, attribution below):
 *   - doubles:       San_Fernando_Doubles.jpg — CC BY-SA 3.0
 *   - coconut-water: Coconut_Drink,_Pangandaran.JPG — Crisco 1492 · CC BY-SA 3.0
 *   - plantain-chips: Plantain_chips.jpg — public domain
 *   - handcraft:     A_woman_is_creating_marketing_basket.jpg — CC BY-SA
 *
 * See components/AIProductListingDemo.tsx for the component that renders
 * these. The `result` shape matches the edge function response so the UI
 * renders canned and real AI responses identically.
 */

export interface DemoSample {
  id: string;
  label: string;
  imageUrl: string;
  result: {
    name: string;
    description: string;
    suggested_price_ttd: number;
    category: string;
    tags: string[];
    confidence: 'high' | 'medium' | 'low';
  };
}

// Same-origin CDN — these are hosted on our Supabase project's public bucket.
const CDN = 'https://cdprbbyptjdntcrhmwxf.supabase.co/storage/v1/object/public/site-assets/demo';

export const DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'doubles',
    label: 'Doubles',
    imageUrl: `${CDN}/doubles.jpg`,
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
    imageUrl: `${CDN}/coconut-water.jpg`,
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
    imageUrl: `${CDN}/plantain-chips.jpg`,
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
    imageUrl: `${CDN}/handcraft.jpg`,
    result: {
      name: 'Hand-Woven Straw Basket — Medium',
      description: `Hand-woven straw basket, made by local craftspeople using traditional techniques. Each one is unique — slight variations in weave and colour are part of the character, not a defect.

Great for home decor, shopping, beach day, laundry, or as a gift with real Caribbean character. Sturdy weave that can carry a real load.

Support local craft — every purchase goes directly to the makers.`,
      suggested_price_ttd: 180,
      category: 'art',
      tags: ['handmade', 'craft', 'basket', 'local', 'home decor', 'gift'],
      confidence: 'medium',
    },
  },
];
