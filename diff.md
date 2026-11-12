# Juvay templates polish — replica-diff vs Dukaan public design bar

**Date:** 12 Nov 2026 (America/New_York)
**Branch:** `juvay/templates-polish-20261112` → `cursor/juvay-wix-templates-grok-acb5`
**Method:** replica-recon (public pages only) + replica-design + replica-build + replica-test + replica-diff. Clean-room: principles, not pixels, code, CSS, images, or copy.
**Dukaan refs:** `/workspace/juvay-templates-polish/ref/dukaan/` (not shipped)
**Our before:** `/workspace/juvay-templates-polish/ref/ours-before/`
**Our after (Round 2):** `/workspace/juvay-templates-polish/ref/ours-after/`
**Pairs for review:** `/workspace/juvay-templates-polish/ref/pairs/`
**Hero AA measurements:** `/workspace/juvay-templates-polish/ref/hero-contrast-r2.json`

## Verdict

| | Before | Round 1 | Round 2 |
| --- | ---: | ---: | ---: |
| Visual / craft score (rubric below) | **38 / 100** | **77 / 100** | **86 / 100** |
| Dedicated product page | No | `/store/:slug/p/:id` | unchanged |
| Collection pages | No | No | **Yes** — `/store/:slug/c/:category`, clean grid, honest empty |
| Hero art contrast | — | Fashion (and other light-photo bleed/overlay) was white-on-light | Solid `heroBg` copy panels (plus a light gradient scrim). **All 10 starters, 390 and 1440, pass WCAG AA** (computed and sampled pixels, 9.25:1–17.09:1; body threshold 4.5:1) |
| Preview | Nested frames | Dialog over a visible gallery (cramped bleed-through) | **Full page** at `/templates/:id?preview=1`: full-screen on mobile, solid stage on desktop (phone frame when Mobile is toggled). Gallery is not mounted behind it. |
| Header cart | — | Text “Cart · N” | **Bag icon** with a count badge (high-contrast text-on-surface) |
| Fonts | 9-family Google Fonts | 2 system stacks | unchanged |
| Preview catalog | Empty | Labeled sample items | unchanged; ILLUSTRATIVE banner now says samples are labeled |

Shippable as a visual upgrade: **yes**. Remaining gaps are below. Not a Dukaan clone.

## Rubric (each 0–10) — before → Round 1 → Round 2, against the public Dukaan bar

| Criterion | Before | R1 | R2 | Notes |
| --- | ---: | ---: | ---: | --- |
| Typography | 4 | 8 | **9** | Every starter hero headline measured AA at 390 and 1440 on a solid panel. Fashion is cream on `#141414` at **15.95:1**. |
| Spacing | 4 | 7 | **8** | Collection pages use the 1120 content max and a 4-col / 2-col grid. Preview is a full page, not a 78vh dialog. |
| Imagery | 4 | 8 | 8 | Same photographic WebP + Wikimedia stalls. Labeled. |
| Card design | 3 | 8 | 8 | Unchanged; collection index reuses the same cards. |
| PDP | 0 | 8 | 8 | Unchanged. Doubles 390 PDP is honest: Sample item, “not for sale”, “No reviews yet”. |
| Nav | 5 | 7 | **9** | 64px bar, bag icon, count badge, collection rail routes to `/c/:category`. |
| Mobile | 5 | 8 | **9** | Full-screen preview at 390 (no gallery behind, no Desktop/Mobile chrome). Bleed panel goes edge-to-edge with 4vw inset so fashion is readable on a phone. |

Holistic 86 (was 77) — the Round 1 deduction for unreadable fashion type, a leaking preview modal, a text cart, and missing collection pages is closed. Not 90+: we still do not match Dukaan’s 17-theme breadth, drag-to-reorder, or paid webfonts, and a few non-food heroes remain labeled starter stills.

## Round 2 hero contrast (WCAG 2, sRGB, body 4.5:1)

Measured on the live preview at `127.0.0.1:4178`: computed `h1` colour vs solid panel background, and pixels sampled in the panel padding (same ratios — the panels are opaque). Unit tests in `services/heroContrast.test.ts` also assert palette pairs and 0.85/0.7 sub/kicker composites for layouts that use those opacities.

| Starter | Layout | 390 | 1440 | Pair |
| --- | --- | ---: | ---: | --- |
| food | split | 15.61 | 15.61 | `#f6edd8` on `#1c140c` |
| fashion | bleed + panel | 15.95 | 15.95 | `#f3eee6` on `#141414` |
| services | split_reverse | 13.98 | 13.98 | `#f8fafc` on `#1e293b` |
| general | overlay + panel | 13.63 | 13.63 | `#fff8f0` on `#2a2a2a` |
| beauty | card (solid surface) | 12.48 | 12.48 | `#3d2c2e` on `#fff8f0` |
| home | stack (solid surface) | 11.58 | 11.58 | `#3d3429` on `#fff8f0` |
| electronics | rail (solid heroBg) | 17.09 | 17.09 | `#e8f4f2` on `#0a0f14` |
| auto | desk | 15.20 | 15.20 | `#f4efe6` on `#1a1a1a` |
| doubles | stack | 14.71 | 14.71 | `#f7ecd8` on `#26180f` |
| street_food | split | 16.12 | 16.12 | `#f5ecd9` on `#14100c` |

**20 / 20 measurements pass AA body (4.5:1).** Fashion’s previous white-on-light photo fail is gone: copy sits on a solid dark panel with a soft left scrim, and the CTA is an inverted cream button.

## replica-test (local, 127.0.0.1:4178)

- Full-page preview: `.juvay-preview-page` is the only root; `.juvay-picker-grid` is not in the document.
- Bag icon present on every starter header (`aria-label` Cart).
- Category chips open a collection view (preview: local state; published: `/store/:slug/c/:category`). Unknown slugs render “Nothing in this collection yet.”
- Sample add-to-cart still refused. Published `liveItems()` still strips `isSample`.
- `npm test` includes `heroContrast.test.ts` and `CollectionPage.test.ts`.
- Facebook Pixel `fbevents.js` pageerror is pre-existing, not our code.

## Screenshot paths (Round 2)

Four pairs (original before vs Round 2 after):

- `/workspace/juvay-templates-polish/ref/pairs/gallery-1440-pair.jpg`
- `/workspace/juvay-templates-polish/ref/pairs/fashion-home-1440-pair.jpg`
- `/workspace/juvay-templates-polish/ref/pairs/doubles-home-1440-pair.jpg`
- `/workspace/juvay-templates-polish/ref/pairs/gallery-390-pair.jpg`

Additional mobile 390 shots requested:

- `/workspace/juvay-templates-polish/ref/pairs/doubles-home-390.jpg`
- `/workspace/juvay-templates-polish/ref/pairs/doubles-pdp-390.jpg`

(Also under `ref/ours-after/` with the same filenames, plus the rest of the 10 starters at both widths.)

## Remaining gaps

1. Merchants still cannot drag sections to rearrange a store.
2. Ten starters vs Dukaan’s 17 theme names — one layout each, by design.
3. Some non-food heroes are existing starter stills (tasteful, labeled), not documentary island photos.
4. Section-level editor and custom domain chrome are out of this pass.
5. Compatibility JPEGs of the 960 WebP sit at the historic `/templates/heroes/*.jpg` paths so other pages that still point there do not 404.

Closed this round: hero legibility, preview bleed-through, text cart, missing collection pages.

## Honesty

- Sample items exist only when `mode === 'illustrative'`. A published store with an empty catalog stays empty.
- Collection pages show only real (or, in preview, labeled sample) items in that category. An unknown category is an honest empty, never invented goods.
- Wikimedia doubles / street-food photos are attributed in `public/templates/heroes/_attribution/ATTRIBUTION.md` (CC BY-SA 4.0) and carry Sample / ILLUSTRATIVE marks. A real stall name appears in the documentary Debe photo; it is not presented as a Juvay merchant.
- No invented reviews, ratings, shops, or stats.
