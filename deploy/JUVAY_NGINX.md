# Juvay nginx locations the VPS must proxy

Live today: only `/api/wam/` is proxied. `GET /api/` still returns the SPA shell.
Signup must **not** use `api.juvay.app` (NXDOMAIN). Do not invent that DNS.

Install **one** of:
- `deploy/nginx-juvay.conf` (nginx)
- `deploy/Caddyfile-juvay` (Caddy)

Both must proxy `/api` and `/api/*` to Node on `127.0.0.1:3001` (`server/index.js`) so `GET /api/` is JSON, not the SPA.

| Method | Path | Why |
|--------|------|-----|
| GET | `/api` and `/api/` | Probe — JSON `{ ok, signup: "POST /api/signup" }` |
| GET | `/api/signup` | 405 JSON — Use POST |
| POST | `/api/signup` | Stranger account create |
| POST | `/api/login` | Sign in |
| GET | `/api/auth/me` | Session |
| POST | `/api/auth/signup` | Alias of `/api/signup` |
| POST | `/api/auth/login` | Alias of `/api/login` |
| GET/POST | `/api/stores*` | Store publish |
| POST | `/api/products` | First product |
| GET | `/api/wam/status` | Hide paid rail when unset |
| POST | `/api/wam/webhook` | Fail-closed signed webhook |
| GET | `/api/health` | Probe |

Static legal (real files, not the 1504 B SPA shell):

- `/terms` → `terms.html`
- `/privacy` → `privacy.html`
- `/refund` → `refund.html`
- `/legal/merchant-agreement` → `merchant-agreement.html`
- `= /merchant-agreement` → `merchant-agreement.html` (exact location; 404, not SPA fallback)

Exact static hosts (404, not SPA): `/sitemap.xml`, `/favicon.ico` (falls through to `/juvay-logo.png`), `/juvay-logo.png`.

HTTP apex + www → HTTPS (301 or 308). HSTS on HTTPS. www must not split from apex.

Env NAME only (never commit a value): `WAM_API_KEY`. Fail closed when unset.
