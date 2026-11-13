# Design principles teardown — Dukaan public templates vs Juvay

Clean-room study of public pages only (https://mydukaan.io/templates and live demos: Hawaii, Mana, Oxford, Lightspeed, Nirvana, Matrix, London, Helsinki). Screenshots in `ref/dukaan/` are reference, never shipped. We did not copy code, CSS, images, copy, or assets.

## What the public demos actually do

**Typography.** One, maybe two families. Headings are large, tight (line-height ~1.05–1.15), regular-to-medium weight — not heavy black. Body 15–16px at 1.6. Prices use the same family, medium weight, in the text colour, not a loud red. Kickers are 11px uppercase with generous letter-spacing. Few weights (400 / 500 / 600).

**Whitespace.** Section padding is generous (48–80px desktop). Content sits in a ~1120–1200px column. Cards have room; the image is the quiet hero of each cell. An 8px rhythm.

**Grid and cards.** 4 columns on a wide desktop, 2 on a phone (never a single stretched column). Consistent aspect: 1:1 for retail and beauty, 4:5 for fashion and furniture. `object-fit: cover`. Name at 15–16px, price underneath, a full-width outline “Add to cart” or a click-through to the product page. Thin 1px borders or none. Radius 8–12px. Almost no drop shadow.

**Imagery.** Real product photography, often on a neutral or white field, same aspect across a row. Full-bleed photographic heroes. No collage illustrations, no abstract gradients standing in for a shop.

**Colour.** Restrained. Near-white or a deliberate dark ground. One accent, used on the primary CTA only. Body text charcoal. Dividers are a whisper.

**Nav.** Slim (56–64px), logo left, a few text links, bag icon right. A 1px bottom border. No crowded “Open / Share / WhatsApp / Cart (0)” text cluster.

**PDP.** Large image (or a small gallery) on the left, details on the right. Title, price, option pills at 44px, quantity, then “Add to cart · price”. A details block. Reviews only when they exist. Sticky add-to-cart once the main button leaves the phone viewport.

**Buttons.** 44–48px tall, 8px radius, short labels. One solid primary. Hover is a slight darken.

**Micro.** 1px dividers, almost no shadow, 40–46ch measure for reading text, kickers at 0.12–0.16em.

## What we took (principles, not trade dress)

- Two system font stacks, no Google Fonts payload.
- 8px spacing, 8/12/16 radius, one soft shadow.
- 1:1 and 4:5 cards with object-fit, 2-col mobile.
- Prices in the text colour.
- 48px primary CTAs.
- A dedicated product page with sticky add-to-cart and an honest “No reviews yet”.
- Photographic WebP heroes at 960 and 1440, ≤80 KB, with srcset.
- Island identity through accent, a faint linen wash on light grounds, and Caribbean copy — not clutter, and not Dukaan’s colours, type, or photos.

## What we will not take

Their model photography, jewellery stills, “Fashion week show” headlines, logos, theme names, or any CSS/JS. Demo stores that were empty or showed “not accepting orders” were noted as-is; we did not invent inventory to “beat” them.
