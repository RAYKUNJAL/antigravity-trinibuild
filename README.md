# Caribbean AI Trade Network

Trustworthy B2B trade infrastructure for the Caribbean, built per the master build spec v1.1.

## Vertical slice (rule 17.2)
The first complete user outcome: import one source-backed business, publish it as an `UNCLAIMED_PUBLIC_PROFILE`, let an authorized representative claim it, complete guided onboarding, submit evidence, get approval, publish one product, receive one buyer inquiry (RFQ), and see all of it in admin.

## Truth model
Profile states are explicit: `DISCOVERED` / `UNCLAIMED_PUBLIC_PROFILE` / `CLAIM_PENDING` / `CLAIMED` / `IDENTITY_VERIFIED` / `TRADE_VERIFIED` / `TRANSACTION_VERIFIED` / `RESTRICTED` / `SUSPENDED`. Unclaimed profiles are always labeled and never described as verified.

## Run
```bash
npm install   # no deps actually; node builtin only
npm run seed  # loads source-backed businesses
npm start     # http://localhost:4000
```

## API
- `GET  /` — public discovery
- `GET  /api/businesses` — public directory
- `GET  /api/businesses/:id` — profile page (with truth label)
- `POST /api/businesses/:id/claim` — claim a profile
- `POST /api/representatives/me` — (simplified) identity for claim
- `POST /api/businesses/:id/evidence` — submit verification evidence
- `POST /api/admin/:id/approve` — approve verification
- `POST /api/businesses/:id/products` — publish a product (verified only)
- `POST /api/rfqs` — buyer creates a sourcing request
- `GET  /api/admin/activity` — audit/activity feed
