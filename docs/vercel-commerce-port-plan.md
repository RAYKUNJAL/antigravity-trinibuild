# Vercel/Commerce UI Patterns → TriniBuild Port Plan

> **Goal:** Adapt proven UI patterns from [vercel/commerce](https://github.com/vercel/commerce) (Shopify Hydrogen / Next.js demo store) into TriniBuild's **Vite + React Router + Supabase** storefront — *without* adopting Next.js App Router, RSC, server actions, or any Next-specific primitive.

**TriniBuild stack:** Vite, React 18, React Router v6, Tailwind CSS, Supabase, lucide-react icons.  
**Ordering model:** WhatsApp-first + COD/WiPay (Trinidad market). *Never break this flow.*

---

## Reference: Current codebase inventory

| File | Role | Key state |
|------|------|-----------|
| `pages/StorefrontV2.tsx` (902 lines) | Full storefront: header, hero, product grid, **cart sidebar w/ 4-step checkout**, COD/WiPay/GooglePay/Bank, promo codes, inventory checks | `cart: (Product & {quantity})[]`, `isCartOpen`, `checkoutStep`, `paymentMethod`, `activeDiscount` |
| `components/templates/PremiumEcommerceTemplate.tsx` (422 lines) | Template: sticky header, hero, trust bar, product grid, FAQ, WhatsApp CTAs. **No real cart** — uses local `cartCount` counter and per-product WhatsApp links | `cartCount` (visual only), `selectedCategory`, `showFilters` |
| `components/templates/PremiumFashionTemplate.tsx` (199 lines) | Fashion variant: image-first, WhatsApp per-product, no cart | `mobileOpen` only |
| `types.ts` (lines 136–188) | **Already has** `ProductVariant` (`id`, `title`, `options: Record<string,string>`, `price`, `compareAtPrice`, `inventory: {qty, track}`, `sku`, `image_url`), `Product` (`variants[]`, `gallery_images[]`, `category_ids[]`, `slug`, `compare_at_price`), `Category` (`id`, `name`, `slug`, `parent_id`) | — |

**Key insight:** The type system *already supports* variants, multi-image galleries, and multi-category — they're just not rendered yet in the templates. Most of this plan is *rendering existing data*, not schema work.

---

## (a) Product Card Upgrade — PremiumEcommerceTemplate

### What vercel/commerce does
- `components/layout/product-grid-items.tsx` → maps products to `<GridTileImage>` items inside a `<Grid>` layout.
- `components/grid/tile.tsx` → `GridTileImage` uses `next/image` with `fill` + `sizes`, aspect-ratio container (`aspect-square`), **label overlay** (title + price) positioned `bottom` or `center`, hover scale on interactive tiles, `aria-label` for accessibility.
- `components/price.tsx` → separate `<Price>` component for currency formatting.
- Cart: `components/cart/add-to-cart.tsx` uses a full-width `rounded-full` button, `bg-blue-600`, `p-4 tracking-wide text-white`; disabled states show "Out Of Stock" / "Add To Cart" with `opacity-60`.

### Current TriniBuild card (PremiumEcommerceTemplate, lines 264–307)
```
<div className="group bg-white ... border border-gray-100 ... rounded-2xl overflow-hidden hover:shadow-lg transition">
  <div className="relative aspect-square bg-gray-50 ...">
    <img ... className="w-full h-full object-cover" loading="lazy" />
    {isLow && <div className="absolute top-2 left-2 ... bg-red-600 ...">Only {stock} left</div>}
    {isOut && <div className="absolute inset-0 bg-white/80 ...">Sold Out</div>}
  </div>
  <div className="p-3 md:p-4">
    <h3 className="font-medium text-sm ... line-clamp-1">{name}</h3>
    <p className="text-xs text-gray-500 ... line-clamp-2">{description}</p>
    <span className="text-lg md:text-xl font-semibold">TT${price}</span>
    <button onClick={() => handleWhatsApp(product)} ... style={{backgroundColor: primaryColor}}>Order</button>
  </div>
</div>
```

### Concrete changes

1. **Create `components/storefront/ProductCard.tsx`** — shared card component (currently each template inlines its own). Props: `product: Product`, `onAdd: (p) => void`, `onWhatsApp: (p) => void`, `primaryColor: string`, `variant?: 'ecommerce' | 'fashion'`.

2. **Tailwind class upgrades** (map vercel patterns → our card):
   | Current | New | Why |
   |---------|-----|-----|
   | `hover:shadow-lg transition` | `hover:shadow-xl hover:-translate-y-1 transition-all duration-300` | Lift effect like vercel tile hover |
   | `aspect-square` | `aspect-[4/5]` (fashion) / keep `aspect-square` (ecommerce) | Fashion stores benefit from taller cards |
   | `object-cover` | `object-cover group-hover:scale-105 transition-transform duration-500` | Image zoom on hover (already in StorefrontV2 line 507, missing from template) |
   | `rounded-2xl` | `rounded-xl` + `overflow-hidden` | Matches vercel's tighter radius |
   | `p-3 md:p-4` | `p-4 md:p-5` | More breathing room |
   | `bg-red-600` stock badge | `bg-black/80 backdrop-blur text-white` pill (or use `primaryColor`) | Vercel uses neutral dark overlays, not alarm red |
   | No "Add to cart" on template | Add `<button>` with `clsx`-style conditional: `rounded-full px-4 py-2 text-sm font-medium` — primary = `primaryColor`, disabled = `opacity-40 cursor-not-allowed` | Unify with vercel add-to-cart button shape |
   | `line-clamp-1` on title | `line-clamp-2` | Vercel shows 2 lines |
   | Price inline | Add **compare-at price strikethrough** above current price (StorefrontV2 already does this at line 541-545, template doesn't) | |

3. **Gallery hover swap** (premium feel): if `product.gallery_images.length > 0`, show second image on hover via `group-hover:opacity-100 opacity-0` stacked `<img>`. This is a vercel tile pattern adapted to our `gallery_images` field.

4. **Quick-add overlay button** (StorefrontV2 already has this at line 515-520 as a `+` button): port it to the template as a `group-hover:opacity-100` floating button.

### Files to touch
- `components/storefront/ProductCard.tsx` (NEW — ~120 lines)
- `components/templates/PremiumEcommerceTemplate.tsx` (replace inline card, lines 260-309 → `<ProductCard />`)
- `components/templates/PremiumFashionTemplate.tsx` (reuse same card with `variant="fashion"`)

### Effort: **M** (shared component extraction + Tailwind refactor)

### WhatsApp/COD conflict? **No.** Card keeps both "Add to Cart" and "Order via WhatsApp" buttons. No change to ordering flow.

---

## (b) Slide-out Cart Drawer

### What vercel/commerce does
- `components/cart/modal.tsx` uses `@headlessui/react` `<Dialog>` + `<Transition>` for accessible modal/drawer.
- Cart state via `useCart()` context (`cart-context.tsx`), auto-opens when `totalQuantity` changes (line ~20: `if (cart?.totalQuantity !== quantityRef.current && cart?.totalQuantity > 0) setIsOpen(true)`).
- Layout: fixed overlay `bg-black/50`, right-side panel `w-full max-w-md`, header with title + close, scrollable line items, footer with subtotal + checkout button.
- Line items show: image, title, variant title (if ≠ DEFAULT_OPTION), quantity stepper, delete button, price.
- Sorts lines alphabetically by product title.

### What TriniBuild already has (StorefrontV2 lines 599–886)
TriniBuild *already has* a cart sidebar:
- `isCartOpen` state, `bg-black/50 backdrop-blur-sm` overlay, `absolute inset-y-0 right-0 max-w-md` panel.
- 4-step checkout: `cart → shipping → payment → success` (COD, WiPay, GooglePay, Bank Transfer).
- Promo code input, discount calculation, `createOrder` + `paymentService` integration.
- Quantity steppers, remove buttons, cart total/discount/final total.

### What's missing vs vercel pattern
1. **No enter/exit animation** — panel just appears. Vercel uses `Transition` with `translate-x` slide-in.
2. **No auto-open on add** — actually StorefrontV2 *does* call `setIsCartOpen(true)` in `addToCart` (line 112). ✅ Already matches vercel.
3. **No `headlessui` Dialog** — uses raw divs, no focus trap, no `Escape` to close, no scroll lock.
4. **No empty-state CTA** — vercel shows "Your cart is empty" with a continue shopping link; TriniBuild shows empty cart text only (line 628).
5. **Line items not sorted** — minor, but vercel sorts alphabetically for stability.

### Concrete changes

1. **Install `@headlessui/react`** (if not already):
   ```bash
   npm install @headlessui/react
   ```
   *Alternative (zero-dep):* implement slide-in with Tailwind `transition-transform duration-300` + `translate-x-full`/`translate-x-0` classes and a conditional `overflow-hidden` on body. This avoids a new dependency if preferred.

2. **Extract cart drawer to `components/storefront/CartDrawer.tsx`** — props:
   ```ts
   {
     isOpen: boolean;
     onClose: () => void;
     cart: (Product & { quantity: number })[];
     cartTotal: number;
     finalTotal: number;
     activeDiscount: { code: string; amount: number; type: string } | null;
     checkoutStep: 'cart' | 'shipping' | 'payment' | 'success';
     // ... all handlers: updateQuantity, removeFromCart, handleCheckout, etc.
   }
   ```
   This is a pure extraction — no logic changes, just componentization so templates can reuse it.

3. **Add slide-in animation** (zero-dep approach — recommended to avoid dep):
   ```tsx
   <div className={`absolute inset-y-0 right-0 w-screen max-w-md bg-white shadow-xl flex flex-col h-full transition-transform duration-300 ease-out ${
     isCartOpen ? 'translate-x-0' : 'translate-x-full'
   }`}>
   ```
   Keep the overlay always rendered, toggle `isCartOpen` for the transform. Add `Escape` key handler via `useEffect`.

4. **Enhance empty state**: Add "Browse products" button that closes drawer and scrolls to `#products`. Add WhatsApp CTA: "Order via WhatsApp instead" → `handleWhatsApp()` (fits T&T market where some users prefer direct chat).

5. **Add "Order via WhatsApp" button in cart footer** — alongside "Checkout" button. This is a TriniBuild-specific addition that *enhances* the vercel pattern: customers can send their entire cart as a WhatsApp message instead of going through the digital checkout.
   ```ts
   const sendCartViaWhatsApp = () => {
     const lines = cart.map(i => `• ${i.name} x${i.quantity} — TT$${(i.price * i.quantity).toFixed(2)}`).join('\n');
     const msg = `Hi! I'd like to order:\n${lines}\n\nTotal: TT$${finalTotal.toFixed(2)}\nIs COD available?`;
     window.open(`https://wa.me/${store.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
   };
   ```

### Files to touch
- `components/storefront/CartDrawer.tsx` (NEW — extract from StorefrontV2, ~280 lines)
- `pages/StorefrontV2.tsx` (replace inline cart markup lines 599-886 with `<CartDrawer />`, add `sendCartViaWhatsApp` function)
- `components/templates/PremiumEcommerceTemplate.tsx` (wire up real cart state instead of `cartCount` counter — needs `useState` for `cart[]` or accept via props)

### Effort: **M–L** (extraction + animation + WhatsApp cart-to-message feature)

### WhatsApp/COD conflict? **No — enhances it.** The "Order via WhatsApp" button in the cart drawer is a *new* conversion path that coexists with COD/WiPay checkout. This is arguably the most important T&T-specific adaptation.

---

## (c) Variant/Options Selector — Swatches + Size Pills

### What vercel/commerce does
- `components/product/variant-selector.tsx`:
  - Takes `options: ProductOption[]` and `variants: ProductVariant[]`.
  - Builds a `combinations` array from variants, each with `{ id, availableForSale, ...selectedOptions }`.
  - Renders each option as a row: `<option.name>` label + row of **pill buttons** (one per value).
  - Pill classes: `flex min-w-[48px] items-center justify-center rounded-full border bg-neutral-100 px-2 py-1 text-sm`.
  - Active state: `ring-2 ring-blue-600`. Hover: `hover:ring-blue-600`. Disabled (out of stock): `cursor-not-allowed` + diagonal strikethrough via `before:` pseudo-element.
  - **URL-synced selection**: uses `useSearchParams` + `router.replace(?size=M)` — this is Next-specific and we will NOT replicate it.

### TriniBuild adaptation
- Our `ProductVariant` (types.ts line 136) has `options: Record<string, string>` (e.g. `{ "Color": "Red", "Size": "M" }`) and `inventory: { qty, track }`.
- **Replace URL search params with local React state**: `const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})`.
- **Color swatches**: if option name is "Color" (case-insensitive), render as **colored circle swatches** instead of text pills. Map color name → hex (simple lookup table: Red→#ef4444, Blue→#3b82f6, etc.) or use a `color_hex` field if we add one to variants later.
- **Size pills**: all other options render as vercel-style text pills.
- **Availability check**: same `combinations` logic — find if any variant matches all selected options AND `inventory.qty > 0` (our equivalent of `availableForSale`).

### Concrete component: `components/storefront/VariantSelector.tsx`
```tsx
interface Props {
  variants: ProductVariant[];
  selected: Record<string, string>;
  onSelect: (optionName: string, value: string) => void;
}

// Color name → hex map (extendable)
const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', black: '#000000',
  white: '#ffffff', pink: '#ec4899', purple: '#a855f7', yellow: '#eab308',
  // ... fallback: render as text pill if color not in map
};
```

**Render logic:**
- Extract unique option names from `variants[].options` (e.g. `["Color", "Size"]`).
- For each option name, get all unique values.
- "Color" → `<button>` with `style={{ backgroundColor: COLOR_MAP[value.toLowerCase()] }}`, `className="w-8 h-8 rounded-full border-2"`, active = `border-gray-900 ring-2 ring-offset-2`, disabled = `opacity-40 cursor-not-allowed` + slash overlay.
- Other options → vercel pill: `clsx("flex min-w-[48px] items-center justify-center rounded-full border px-3 py-1.5 text-sm", active ? "ring-2 ring-gray-900 bg-gray-900 text-white" : "bg-gray-100 hover:ring-1 hover:ring-gray-400")`.

**Availability logic:**
```ts
const isCombinationAvailable = (selected: Record<string, string>) => {
  return variants.some(v =>
    Object.entries(selected).every(([k, val]) => v.options[k] === val)
    && v.inventory.qty > 0
  );
};
```
When user selects an option, check if *any* variant with that selection is in stock. If not, disable the pill.

### Where to use it
- **Product detail view** (if/when we add one — see (d) below) — full selector with add-to-cart.
- **Inline in product card** (optional, fashion only): expandable variant selector on card click — but this adds complexity. Recommend: card opens a **quick-view modal** with the variant selector inside.

### Files to touch
- `components/storefront/VariantSelector.tsx` (NEW — ~150 lines)
- `components/storefront/QuickViewModal.tsx` (NEW — ~100 lines, optional)
- `components/templates/PremiumFashionTemplate.tsx` (integrate VariantSelector into product display)
- `pages/StorefrontV2.tsx` (add to product detail/quick-view, modify `addToCart` to accept `variantId`)

### Effort: **M** (variant selector is self-contained; the schema already supports it)

### WhatsApp/COD conflict? **No.** When ordering via WhatsApp, include selected variant in the message: `"${product.name} — ${variant.title} (TT$${variant.price})"`. The `handleWhatsApp` function needs a small update to accept the selected variant.

### ⚠️ Cart integration note
`addToCart` in StorefrontV2 (line 93) currently keys cart items by `product.id`. With variants, items must be keyed by `${product.id}:${variant.id}`. The `Product & { quantity }` type needs to also carry `variantId?` and `variantTitle?`. Update `addToCart`, `updateQuantity`, `removeFromCart` to use a composite key.

---

## (d) Collection Grid Route `/collections/:slug`

### What vercel/commerce does
- `app/[page]/page.tsx` — dynamic route for paginated product listing (all products, not per-collection).
- `app/search/page.tsx` — search page with filtered grid.
- `components/layout/product-grid-items.tsx` — renders `Product[]` into a `<Grid>` (from `components/grid/index.tsx`).
- No explicit `/collections/:slug` route exists in vercel/commerce (Shopify collections are surfaced via search params), but the *pattern* is: a route that takes a param, fetches filtered products, renders a grid.

### TriniBuild adaptation
TriniBuild already has `Category` type (`id`, `store_id`, `name`, `slug`, `parent_id`) and `Product.category_ids: string[]`. We need a route that shows products for a given category slug.

### Concrete implementation

1. **Add route in `App.tsx` (or router config):**
   ```tsx
   <Route path="/store/:slug/collections/:collectionSlug" element={<CollectionPage />} />
   ```

2. **Create `pages/CollectionPage.tsx`:**
   ```tsx
   export const CollectionPage: React.FC = () => {
     const { slug, collectionSlug } = useParams();
     const [store, setStore] = useState<Store | null>(null);
     const [products, setProducts] = useState<Product[]>([]);
     const [collection, setCollection] = useState<Category | null>(null);

     useEffect(() => {
       // Fetch store by slug, then category by slug, then products by category_ids
       storeService.getStoreBySlug(slug).then(s => {
         setStore(s);
         const cat = s?.categories?.find(c => c.slug === collectionSlug);
         setCollection(cat);
         setProducts((s?.products || []).filter(p => p.category_ids?.includes(cat?.id) || p.category === cat?.name));
       });
     }, [slug, collectionSlug]);

     return (
       <>
         <StoreHeader store={store} />
         <div className="max-w-7xl mx-auto px-4 py-8">
           <h1 className="text-3xl font-light tracking-tight mb-2">{collection?.name}</h1>
           <p className="text-gray-500 mb-8">{products.length} products</p>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
             {products.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} onWhatsApp={handleWhatsApp} primaryColor={store?.color_scheme?.primary} />)}
           </div>
         </div>
       </>
     );
   };
   ```

3. **Category navigation links in templates:** In PremiumEcommerceTemplate, the category sidebar (lines 221-237) currently filters in-place. Add `<Link to={`/store/${storeSlug}/collections/${catSlug}`}>` for each category — this gives shareable category URLs (SEO + WhatsApp shareable).

4. **Supabase query:** If `storeService.getStoreBySlug` doesn't already fetch categories, add a join:
   ```ts
   supabase.from('categories').select('*').eq('store_id', store.id)
   ```
   Then filter products client-side by `category_ids` (already an array on `Product`).

### Files to touch
- `pages/CollectionPage.tsx` (NEW — ~120 lines)
- `App.tsx` or router config (add route — 1 line)
- `services/storeService.ts` (add `getCategories(storeId)` if not present)
- `components/templates/PremiumEcommerceTemplate.tsx` (category links → `<Link>`)
- `components/storefront/StoreHeader.tsx` (NEW — shared header for store + collection pages)

### Effort: **M**

### WhatsApp/COD conflict? **No.** Collection page is a browse/discovery surface. Product cards still have WhatsApp "Order" buttons. Collection URLs are shareable via WhatsApp ("Check out our Shoes collection: [link]").

---

## (e) Mobile Sticky Add-to-Cart / WhatsApp Bar

### What verci/commerce does
- Vercel/commerce doesn't have a dedicated mobile sticky CTA bar (the product page uses an in-flow add-to-cart). However, the *pattern* is common in commerce: a `fixed bottom-0` bar that appears on mobile when the user scrolls past the main CTA.

### What TriniBuild already has
- **StorefrontV2** (lines 888-898): floating cart button on mobile (`fixed bottom-4 right-4 md:hidden`) that shows when `cartCount > 0`. This is a FAB, not a full-width sticky bar.
- **PremiumEcommerceTemplate**: has a sticky header but no mobile sticky CTA at the bottom.

### Concrete implementation: `components/storefront/MobileStickyBar.tsx`

A `fixed bottom-0 inset-x-0 md:hidden z-40` bar that shows on product pages (or when a product is selected in quick-view):

```tsx
interface Props {
  product: Product;
  onAddToCart: (p: Product) => void;
  onWhatsApp: (p: Product) => void;
  primaryColor: string;
}

export const MobileStickyBar: React.FC<Props> = ({ product, onAddToCart, onWhatsApp, primaryColor }) => {
  const isOut = product.stock === 0;
  return (
    <div className="fixed bottom-0 inset-x-0 md:hidden z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex-shrink-0">
        <p className="text-xs text-gray-500 line-clamp-1">{product.name}</p>
        <p className="text-lg font-bold" style={{ color: primaryColor }}>TT${product.price.toFixed(2)}</p>
      </div>
      <div className="flex-1 flex gap-2 justify-end">
        <button
          onClick={() => onWhatsApp(product)}
          disabled={isOut}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-40"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
        <button
          onClick={() => onAddToCart(product)}
          disabled={isOut}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-40"
          style={{ backgroundColor: primaryColor }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};
```

### Show/hide logic
- On product detail page: always visible when product is loaded.
- On grid pages: hide (the FAB cart button in StorefrontV2 already handles this).
- Add `pb-20 md:pb-0` to page content when sticky bar is visible to prevent it covering footer.

### Scroll-triggered variant (optional enhancement)
Use `IntersectionObserver` to detect when the in-page CTA scrolls out of view, then slide the sticky bar up (`translate-y-0` → from `translate-y-full`). This is the "appears on scroll" pattern.

### Files to touch
- `components/storefront/MobileStickyBar.tsx` (NEW — ~60 lines)
- `pages/StorefrontV2.tsx` (render `<MobileStickyBar>` when `selectedProduct` is set, or on a future product detail page)
- `components/templates/PremiumEcommerceTemplate.tsx` (add sticky bar for mobile when a product is selected/quick-viewed)

### Effort: **S** (small, self-contained component)

### WhatsApp/COD conflict? **No — designed around it.** The sticky bar has *both* WhatsApp and Add-to-Cart buttons side by side, making WhatsApp the equal-primary CTA. This is the correct T&T pattern.

---

## Summary table

| Feature | New files | Files modified | Effort | WhatsApp/COD conflict? |
|---------|-----------|----------------|--------|------------------------|
| (a) Product Card upgrade | `ProductCard.tsx` | PremiumEcommerceTemplate, PremiumFashionTemplate | **M** | No — keeps both buttons |
| (b) Cart Drawer | `CartDrawer.tsx` | StorefrontV2, PremiumEcommerceTemplate | **M–L** | No — *adds* "Order cart via WhatsApp" button |
| (c) Variant Selector | `VariantSelector.tsx`, `QuickViewModal.tsx` | PremiumFashionTemplate, StorefrontV2 | **M** | No — variant info included in WhatsApp message |
| (d) Collection route | `CollectionPage.tsx`, `StoreHeader.tsx` | App.tsx, storeService.ts, PremiumEcommerceTemplate | **M** | No — shareable category links for WhatsApp |
| (e) Mobile sticky bar | `MobileStickyBar.tsx` | StorefrontV2, PremiumEcommerceTemplate | **S** | No — WhatsApp is co-primary CTA |

---

## Implementation order (recommended)

1. **(a) ProductCard** first — shared foundation, used by everything else.
2. **(e) Mobile sticky bar** — quick win, S effort, immediate UX improvement.
3. **(d) Collection route** — gives us a page to put the variant selector on.
4. **(c) Variant selector** — builds on collection page + product card.
5. **(b) Cart Drawer** — last, since it's the largest extraction and benefits from having variant-aware cart items (from step 4).

---

## What we are NOT porting from vercel/commerce (Next.js-specific)

| vercel/commerce pattern | Why skip | Client-side equivalent |
|------------------------|----------|----------------------|
| `useSearchParams` + `router.replace()` for variant selection | Next router API | `useState<Record<string,string>>` |
| Server Actions (`addItem` in `actions.ts`) | RSC only | `addToCart()` local function (already exists) |
| `use cache: private` on `getCart()` | Next cache directives | Cart in React state + optional `localStorage` persistence |
| `router.refresh()` / `updateTag` | Next router | State updates trigger re-render automatically |
| `<Suspense>` boundaries around search params | RSC streaming | N/A — client-side, no streaming |
| `next/image` with `fill` + `sizes` | Next image optimizer | Standard `<img>` with `loading="lazy"` + `object-cover` (already used) |
| `@headlessui/react` Dialog (optional) | Can add, but not required | Tailwind transition + `useEffect` for Escape/scroll-lock |
| Shopify Storefront API / GraphQL | Different backend | Supabase queries via `storeService` |

---

## Dependencies to add (optional, all zero-risk)

- `@headlessui/react` — only if we want accessible Dialog/Transition for cart drawer. **Skip if avoiding deps** — the zero-dep Tailwind transition approach works.
- `clsx` — already widely used, good for conditional Tailwind classes. Check if already in `package.json`.

---

*Plan authored: 2026-06-23. Based on vercel/commerce `main` branch (commit `1df2cf6`, Jan 2026) and TriniBuild codebase as of current state.*
