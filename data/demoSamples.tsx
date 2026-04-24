import React from 'react';

/**
 * Pre-generated AI sample results for the landing-page demo.
 *
 * Previous revisions used Unsplash photo URLs for the sample images. That was
 * a mistake — the URLs were auto-generated guesses and the photos didn't
 * match the labels (doubles showed as rice cakes, coconut water showed as
 * an apartment, etc.). Swapping in different external URLs doesn't fix the
 * brittleness: any external image can rot, get swapped upstream, or be
 * rate-limited.
 *
 * Fix: each sample now ships with its own inline SVG illustration rendered
 * as a React component. Benefits:
 *   - Cannot mismatch — the illustration lives next to the text that names it
 *   - Zero network latency (no external fetch)
 *   - Can't 404, can't be rate-limited, can't change upstream
 *   - Designed look signals "this is a demo sample" honestly, vs. stock photo
 *     ambiguity where users might wonder "is this a real merchant's product?"
 *   - Sample illustrations + real-photo AI analysis (via "Try your own photo"
 *     button) gives the visitor both proofs: the UI works, AND it works on
 *     real photos.
 *
 * The `result` shape still matches the real edge-function response so the UI
 * renders canned and real responses identically.
 */

export interface DemoSample {
  id: string;
  label: string;
  /** React element rendered as the sample's preview. Aspect-square. */
  Illustration: React.ComponentType<{ className?: string }>;
  result: {
    name: string;
    description: string;
    suggested_price_ttd: number;
    category: string;
    tags: string[];
    confidence: 'high' | 'medium' | 'low';
  };
}

// ── Illustrations ──────────────────────────────────────────────────────────
// Each illustration is a self-contained SVG. Uses trini-red (#E61E2B) as
// accent, warm earth tones to feel like real products, not clip art.

const DoublesIllustration: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Trini doubles">
    <rect width="200" height="200" fill="#FEF3E8" />
    {/* Plate shadow */}
    <ellipse cx="100" cy="165" rx="72" ry="8" fill="#000" opacity="0.08" />
    {/* Lower bara (flatbread) */}
    <ellipse cx="100" cy="138" rx="70" ry="14" fill="#D4A574" />
    <ellipse cx="100" cy="135" rx="70" ry="14" fill="#E8BE87" />
    {/* Channa (curried chickpeas) filling */}
    <ellipse cx="100" cy="118" rx="58" ry="11" fill="#8B5A2B" />
    <circle cx="82" cy="114" r="4" fill="#C8944F" />
    <circle cx="95" cy="116" r="3.5" fill="#B8843F" />
    <circle cx="108" cy="113" r="4" fill="#C8944F" />
    <circle cx="120" cy="117" r="3.5" fill="#B8843F" />
    <circle cx="90" cy="119" r="3" fill="#D4A574" />
    <circle cx="115" cy="120" r="3" fill="#D4A574" />
    {/* Kuchela/pepper dabs */}
    <circle cx="75" cy="113" r="2.5" fill="#E61E2B" />
    <circle cx="125" cy="115" r="2.5" fill="#E61E2B" />
    {/* Upper bara */}
    <ellipse cx="100" cy="104" rx="68" ry="12" fill="#D4A574" />
    <ellipse cx="100" cy="102" rx="68" ry="12" fill="#E8BE87" />
    {/* Specks of seasoning on top */}
    <circle cx="85" cy="99" r="1" fill="#8B5A2B" />
    <circle cx="110" cy="102" r="1" fill="#8B5A2B" />
    <circle cx="125" cy="100" r="1" fill="#8B5A2B" />
    {/* Steam */}
    <path d="M 75 70 Q 77 62 73 56 Q 77 50 75 42" stroke="#B8B8B8" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />
    <path d="M 100 65 Q 103 57 99 50 Q 103 44 101 38" stroke="#B8B8B8" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
    <path d="M 125 70 Q 127 62 123 56" stroke="#B8B8B8" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />
  </svg>
);

const CoconutWaterIllustration: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Fresh jelly coconut">
    <rect width="200" height="200" fill="#E8F4F0" />
    {/* Coconut husk — green outer */}
    <ellipse cx="100" cy="108" rx="62" ry="68" fill="#5B8F3B" />
    <ellipse cx="100" cy="105" rx="62" ry="68" fill="#6FAF4A" />
    {/* Husk texture streaks */}
    <path d="M 50 80 Q 55 120 60 160" stroke="#4A7A2E" strokeWidth="2" fill="none" opacity="0.5" />
    <path d="M 75 62 Q 78 105 82 170" stroke="#4A7A2E" strokeWidth="2" fill="none" opacity="0.4" />
    <path d="M 100 55 Q 100 105 100 172" stroke="#4A7A2E" strokeWidth="2" fill="none" opacity="0.4" />
    <path d="M 125 62 Q 122 105 118 170" stroke="#4A7A2E" strokeWidth="2" fill="none" opacity="0.4" />
    <path d="M 150 80 Q 145 120 140 160" stroke="#4A7A2E" strokeWidth="2" fill="none" opacity="0.5" />
    {/* Opened top — the cut */}
    <ellipse cx="100" cy="50" rx="34" ry="10" fill="#3A5A2A" />
    <ellipse cx="100" cy="48" rx="32" ry="8" fill="#F5F1E3" />
    {/* Inner flesh */}
    <ellipse cx="100" cy="48" rx="28" ry="6" fill="#FFFCF0" />
    {/* Straw */}
    <rect x="96" y="18" width="8" height="40" rx="2" fill="#E61E2B" />
    <rect x="96" y="18" width="4" height="40" rx="2" fill="#FF4A56" />
    {/* Straw stripe */}
    <rect x="96" y="25" width="8" height="3" fill="#FFF" opacity="0.7" />
    <rect x="96" y="40" width="8" height="3" fill="#FFF" opacity="0.7" />
    {/* Droplet */}
    <ellipse cx="140" cy="70" rx="3" ry="5" fill="#4A9EC8" opacity="0.7" />
  </svg>
);

const PlantainChipsIllustration: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Plantain chips in bag">
    <rect width="200" height="200" fill="#FDF6E8" />
    <defs>
      <linearGradient id="bag-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFF" stopOpacity="0.6" />
        <stop offset="50%" stopColor="#FFF" stopOpacity="0" />
        <stop offset="100%" stopColor="#FFF" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    {/* Bag body */}
    <path d="M 50 40 L 150 40 L 160 180 L 40 180 Z" fill="#F5E6C8" />
    <path d="M 50 40 L 150 40 L 160 180 L 40 180 Z" fill="url(#bag-gradient)" opacity="0.4" />
    {/* Bag crimp top */}
    <path d="M 50 40 L 55 30 L 60 40 L 65 30 L 70 40 L 75 30 L 80 40 L 85 30 L 90 40 L 95 30 L 100 40 L 105 30 L 110 40 L 115 30 L 120 40 L 125 30 L 130 40 L 135 30 L 140 40 L 145 30 L 150 40" stroke="#D4B87A" strokeWidth="2" fill="none" />
    {/* Chips inside */}
    <g transform="translate(100 115)">
      <ellipse cx="-25" cy="-15" rx="18" ry="11" fill="#E8A030" transform="rotate(-15)" />
      <ellipse cx="-25" cy="-15" rx="16" ry="9" fill="#F0B84A" transform="rotate(-15)" />
      <ellipse cx="22" cy="-20" rx="17" ry="10" fill="#E8A030" transform="rotate(20)" />
      <ellipse cx="22" cy="-20" rx="15" ry="8" fill="#F0B84A" transform="rotate(20)" />
      <ellipse cx="0" cy="5" rx="20" ry="12" fill="#E8A030" transform="rotate(5)" />
      <ellipse cx="0" cy="5" rx="18" ry="10" fill="#F0B84A" transform="rotate(5)" />
      <ellipse cx="-20" cy="25" rx="16" ry="10" fill="#E8A030" transform="rotate(-25)" />
      <ellipse cx="-20" cy="25" rx="14" ry="8" fill="#F0B84A" transform="rotate(-25)" />
      <ellipse cx="22" cy="28" rx="17" ry="10" fill="#E8A030" transform="rotate(35)" />
      <ellipse cx="22" cy="28" rx="15" ry="8" fill="#F0B84A" transform="rotate(35)" />
      <circle cx="-22" cy="-18" r="1" fill="#FFF" />
      <circle cx="-18" cy="-12" r="0.8" fill="#FFF" />
      <circle cx="24" cy="-22" r="1" fill="#FFF" />
      <circle cx="2" cy="3" r="1" fill="#FFF" />
      <circle cx="-4" cy="8" r="0.8" fill="#FFF" />
      <circle cx="20" cy="26" r="1" fill="#FFF" />
    </g>
    {/* Red label band */}
    <rect x="50" y="52" width="100" height="20" fill="#E61E2B" />
    <text x="100" y="66" fontSize="11" fontWeight="700" fill="#FFF" textAnchor="middle" fontFamily="system-ui, sans-serif">PLANTAIN</text>
  </svg>
);

const WovenBasketIllustration: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Hand-woven straw basket">
    <rect width="200" height="200" fill="#F5EED5" />
    {/* Basket shadow */}
    <ellipse cx="100" cy="172" rx="70" ry="8" fill="#000" opacity="0.1" />
    {/* Basket body */}
    <path d="M 45 85 Q 50 160 100 168 Q 150 160 155 85 Z" fill="#B8843F" />
    <path d="M 48 85 Q 53 158 100 165 Q 147 158 152 85 Z" fill="#D4A574" />
    {/* Weave — vertical bands */}
    <path d="M 65 86 Q 67 150 75 165" stroke="#8B5A2B" strokeWidth="1.5" fill="none" opacity="0.6" />
    <path d="M 82 85 Q 83 155 90 167" stroke="#8B5A2B" strokeWidth="1.5" fill="none" opacity="0.6" />
    <path d="M 100 85 L 100 168" stroke="#8B5A2B" strokeWidth="1.5" fill="none" opacity="0.6" />
    <path d="M 118 85 Q 117 155 110 167" stroke="#8B5A2B" strokeWidth="1.5" fill="none" opacity="0.6" />
    <path d="M 135 86 Q 133 150 125 165" stroke="#8B5A2B" strokeWidth="1.5" fill="none" opacity="0.6" />
    {/* Weave — horizontal bands */}
    <path d="M 50 100 Q 100 104 150 100" stroke="#8B5A2B" strokeWidth="1.5" fill="none" opacity="0.5" />
    <path d="M 50 120 Q 100 124 150 120" stroke="#8B5A2B" strokeWidth="1.5" fill="none" opacity="0.5" />
    <path d="M 51 140 Q 100 144 149 140" stroke="#8B5A2B" strokeWidth="1.5" fill="none" opacity="0.5" />
    {/* Rim */}
    <ellipse cx="100" cy="85" rx="55" ry="10" fill="#8B5A2B" />
    <ellipse cx="100" cy="83" rx="55" ry="10" fill="#A67540" />
    <ellipse cx="100" cy="83" rx="52" ry="7" fill="#3A2418" />
    {/* Handle */}
    <path d="M 60 82 Q 100 20 140 82" stroke="#8B5A2B" strokeWidth="8" fill="none" strokeLinecap="round" />
    <path d="M 60 82 Q 100 22 140 82" stroke="#A67540" strokeWidth="5" fill="none" strokeLinecap="round" />
    {/* Accent color thread */}
    <path d="M 55 110 Q 100 113 145 110" stroke="#E61E2B" strokeWidth="2" fill="none" opacity="0.7" />
  </svg>
);

// ── Samples ────────────────────────────────────────────────────────────────

export const DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'doubles',
    label: 'Doubles',
    Illustration: DoublesIllustration,
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
    Illustration: CoconutWaterIllustration,
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
    Illustration: PlantainChipsIllustration,
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
    Illustration: WovenBasketIllustration,
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
