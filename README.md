# Caribbean AI Trade Network

Alibaba-style B2B trade infrastructure for the Caribbean and global buyers. Zero-dependency Node.js.

## What it does
- **Directory**: source-backed business profiles with an explicit truth model (`UNCLAIMED_PUBLIC_PROFILE` → `CLAIM_PENDING` → `CLAIMED` → `IDENTITY_VERIFIED` → `TRADE_VERIFIED`). Unclaimed profiles are always labeled and never presented as verified.
- **Verification**: 9 separate dimensions (legal identity, representative authority, address, tax, payment, certification, export capacity, product evidence, performance). Products publish only after verification.
- **Sourcing**: buyers post RFQs; verified suppliers (on paid plans) submit normalized quotes.
- **Orders & payments**: order lifecycle + payment-intent state machine (provider-neutral), local vs external payment rails (COD, bank, Wam, PayPal, card, wire).
- **Landed cost**: deterministic engine — every component shown, no hidden arithmetic.
- **Trade knowledge**: requirements/HS/origin decision-support with sources + confidence (never definitive rulings).
- **AI concierge**: grounded, retrieval-first, anti-hallucination, returns an answer contract (sources, confidence, escalation).
- **Plans**: Free US$0 (directory + buyer RFQ) / Pro US$44 / Trade US$149 (selling, quoting, orders, FX, API).
- **Overseas buyers**: diaspora/global buyer profiles get export-grade documentation guidance + international payment rails + FX assumptions.

## Run
```bash
npm run seed   # seeds samples + loads full scraped directory (8.7k+ businesses from OSM)-backed businesses + trade rules
npm start      # http://localhost:4000
npm test       # 11 tests
```

## API
`/api/health` `/api/businesses` `/api/businesses/:id` `/api/businesses/:id/claim` `/api/businesses/:id/evidence` `/api/admin/:id/approve` `/api/businesses/:id/products` `/api/rfqs` `/api/rfqs/:id/quotes` `/api/orders` `/api/payments` `/api/landed-cost` `/api/trade/requirements` `/api/payment-rails` `/api/concierge` `/api/plans` `/api/plan/upgrade` `/api/admin/stats` `/api/admin/activity`

## Spec
Built per `CARIBBEAN_AI_TRADE_NETWORK_MASTER_BUILD_SPEC.md` (vertical-slice rule 17.2 first). Next: webhook payment activation, Postgres, MFA, deployment to trade.juvay.app.
