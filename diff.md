# Juvay templates polish — replica-diff vs Dukaan public design bar

**Date:** 12 Nov 2026 (America/New_York)
**Branch:** `juvay/templates-polish-20261112` → `cursor/juvay-wix-templates-grok-acb5`
**Method:** replica-recon (public pages only) + replica-design + replica-build + replica-test + replica-diff. Clean-room: principles, not pixels, code, CSS, images, or copy.
**Dukaan refs:** `/workspace/juvay-templates-polish/ref/dukaan/` (not shipped)
**Our before:** `/workspace/juvay-templates-polish/ref/ours-before/`
**Our after:** `/workspace/juvay-templates-polish/ref/ours-after/`
**Four pairs for review:** `/workspace/juvay-templates-polish/ref/pairs/`

## Verdict

| | Before | After |
| --- | ---: | ---: |
| Visual / craft score (rubric below) | **38 / 100** | **77 / 100** |
| Dedicated product page | No | Yes — `/store/:slug/p/:id` |
| Hero art | Heavy JPEGs; illustrated doubles & street food | WebP 960/1440, all ≤80 KB, srcset; Wikimedia CC BY-SA stall photos for doubles & street food |
| Fonts | 9-family Google Fonts stylesheet | 2 system stacks, no network font load |
| Preview catalog | Empty (“Nothing listed yet”) | Labeled **Sample item** rows, preview only |
| Published honesty | Starter art could pass as merchant photography | Small **Sample image** chip until the merchant uploads |
| Gallery | 3-col, nested Desktop/Mobile toggles, “Use / Customize” | 2-col polished cards, desktop+mobile frames, **Use this template** → `/create-store` |

Shippable as a visual upgrade on the existing Juvay starters: **yes**, with the remaining gaps listed below. Not a Dukaan clone, and not trying to be.

## Rubric (each 0–10) — before → after, against the public Dukaan bar

| Criterion | Before | After | Notes |
| --- | ---: | ---: | --- |
| Typography | 4 | 8 | Two system families, tight heading leading, prices in the text colour. Dukaan’s paid webfonts are not copied. |
| Spacing | 4 | 7 | 48–64px sections, 8px rhythm. A few food-menu rows still sit tighter than Hawaii’s jewellery grid. |
| Imagery | 4 | 8 | Photographic WebP + Wikimedia stalls + 1:1 sample crops. Beauty/electronics stills are starter photos, clearly labeled. |
| Card design | 3 | 8 | Consistent 1:1 or 4:5, object-fit, outline add, sample badge. 2 columns on a 390px phone. |
| PDP | 0 | 8 | Gallery, price, 44px option pills, qty, sticky mobile ATC, details, “No reviews yet”. No fake stars. |
| Nav | 5 | 7 | 64px bar, name left, Open / WhatsApp / Cart right, 1px border. Still text “Cart”, not an icon-only bag. |
| Mobile | 5 | 8 | 2-col grid, 44–48px taps, thumb-zone sticky ATC, menu rows with thumbs. |

## replica-test (local, 127.0.0.1:4178)

Click-through of all 10 starters at 390 and 1440, plus `/templates`.

- Storefronts render; the only `pageerror` is a pre-existing Facebook Pixel (`fbevents.js`) TypeError, not our code.
- Preview catalogs show labeled sample items only. Add-to-cart is refused for samples and in illustrative mode. Published `liveItems()` strips any `isSample` row (unit tests in `server/storefrontHonesty.test.js`).
- Reviews empty state is “No reviews yet”, no stars.
- Product page opens from a card (and from a menu row). Services/doubles use the menu-row button, not a card.
- Gallery “Use this template” points at `/create-store?template=…`.
- `npm test` green. `vite build` green. No new `tsc` errors in files we touched (pre-existing parse errors remain in `services/socialContentService.ts`).

## Remaining gaps

1. Merchants still cannot drag sections to rearrange a store.
2. Ten starters vs Dukaan’s 17 theme names — one layout each, by design (a small named set, not a theme farm).
3. No collection / category index pages.
4. Header cart is a text label, not a bag icon.
5. Some non-food heroes are existing starter stills (tasteful, labeled), not documentary island photos.
6. Section-level editor and custom domain chrome are out of this pass.
7. Compatibility JPEGs of the 960 WebP sit at the historic `/templates/heroes/*.jpg` paths so other pages that still point there do not 404.

## Honesty

- Sample items exist only when `mode === 'illustrative'`. A published store with an empty catalog stays empty.
- Wikimedia doubles / street-food photos are attributed in `public/templates/heroes/_attribution/ATTRIBUTION.md` (CC BY-SA 4.0) and carry Sample / ILLUSTRATIVE marks. A real stall name appears in the documentary Debe photo; it is not presented as a Juvay merchant.
- No invented reviews, ratings, shops, or stats.
