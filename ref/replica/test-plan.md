# replica-test plan — Juvay template polish

## F01 Preview a starter (gallery)
- H1 Open `/templates`, see 10 cards, filter by niche, “Use this template” goes to `/create-store?template=`.
- H2 Open `/templates/fashion?preview=1`, desktop and mobile frames, ILLUSTRATIVE banner, labeled sample items.
- E1 Empty search yields “No templates match”.
- N1 Published path never receives illustrative samples (`liveItems` strips them).

## F02 Browse and open a product
- H1 From a preview, open a sample card → PDP with “Sample item”, details, “No reviews yet”.
- H2 Add to cart is refused on samples.
- E1 Unknown `/store/:slug/p/missing` shows “This item is not on the shop”.

## F03 Empty published catalog
- H1 A published store with no items shows the honest empty frame and starter empty copy, no sample SKUs, no stars.

Run: Playwright against the local Vite server, 390 and 1440, fail on `pageerror` from first-party code (ignore `connect.facebook.net/fbevents.js`).
