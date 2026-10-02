# يوصل / Usil — Architecture

Engineering reference for both halves of the system. Operational runbooks
(Moyasar activation, Cloudflare, ECS deploy) stay in
[`../usil backend/README.md`](../usil%20backend/README.md); app-store submission
steps stay in [STORE.md](STORE.md).

---

## Project Overview

Usil (يوصل) is an Arabic-first, RTL marketplace for **event supply in Saudi
Arabia** — hospitality, venues, photography, decor. Clients browse vendor
products, pay the full VAT-inclusive price through Moyasar, and vendors run
their operations (calendar, crew, inventory, invoicing, ZATCA VAT, payroll)
inside a built-in back office.

Two rules shape most of the code:

1. **No demo data in the storefront.** The catalog contains only real,
   vendor-created products. `SERVICES` is empty on purpose and the store reads
   `GET /api/catalog/listings` exclusively. Anything that looks like a seeded
   catalog is a bug.
2. **Payment happens off-server.** Card data never reaches Usil. The backend
   creates a Moyasar *hosted invoice* and redirects to `invoice.url`.

---

## Two Projects

The system is split into two sibling npm projects that deploy as one container.

```
next core labs/
  usil/            ← this project: the React SPA (usil-web)
  usil backend/    ← the Express API + JSON store (usil-backend)
```

| | `usil/` | `usil backend/` |
| --- | --- | --- |
| Package | `usil-web` | `usil-backend` |
| Owns | UI, client state, routing, exporters | API, auth, payments, persistence, SEO render |
| Build | `vite build` → `dist/` | `esbuild` → `dist/server.cjs` |
| Tests | 34 | 235 |

**The backend also serves the SPA**, so production stays a single container:

```bash
cd usil            && npm run build      # SPA -> usil/dist
cd "../usil backend" && npm run sync:web # copies it into backend dist/ (keeps server.cjs)
                      npm run build      # bundles the API
                      npm start
```

### The shared seam: `core/`

The backend needs some of the frontend's domain code — types, the Saudi place
list, catalog/media rules, the SPA route table. It keeps its **own copy** under
`core/`, mirroring `usil/src/`:

| `usil backend/core/` | `usil/src/` |
| --- | --- |
| `types.ts` | `types.ts` |
| `data/{services,saudiPlaces,saudiMarket,catalogExpansion,cityDemand}.ts` | same |
| `utils/{catalogMedia,siteRoutes,brandedAvatar}.ts` | same |

These are **duplicated files, not a shared package** — the single largest
maintenance risk in the split, because a rule fixed on one side keeps its old
behaviour on the other with nothing failing to say so. Verify rather than
remember:

```bash
cd "usil backend" && npm run check:core-sync              # advisory
                     npm run check:core-sync -- --strict  # exits 1 on drift
```

Promoting `core/` to a real workspace package is the proper long-term fix.

---

## Architecture

```
Browser (React 19 SPA, RTL)
  │  fetch  /api/*                     ← same-origin; session cookie `midyaf_sid`
  ▼
Express (server/index.ts — composition root)
  ├── auth/ .................... sessions, roles, email verification, uploads
  ├── vendors/ ................. workspace, listings, applications, hubs, socials
  ├── bookings/ ................ platform bookings + courier-filed external bookings
  ├── catalog/ ................. «ترند هالأسبوع»: listing view counter + weekly ranking
  ├── payments/ ................ Moyasar invoices, webhook, checkout callback
  ├── couriers/ ................ courier onboarding & approval
  ├── cities/ .................. "we want Usil in my city" demand capture
  ├── support/ ................. contact form
  ├── ai/ ...................... AI proxy (rate-limited), provider routing, keys
  ├── seo/ ..................... SSR meta/robots/sitemap + SPA shell
  └── legacy-routes.ts ......... vestigial endpoints, kept only for compatibility
  ▼
JSON documents under data/           ← atomic writes via shared/json-file.ts
  ▼
External: Moyasar (payments) · Gemini/Claude/OpenAI (AI) · SMTP (optional)
```

**There is no database.** Persistence is a set of JSON documents in `data/`,
each replaced atomically (write-temp-then-rename) so an interrupted write cannot
truncate a file. `postgres` is an optional dependency used by one maintenance
script, never by the app.

### Conventions to follow

The backend is consistent about three patterns. Match them:

1. **Store factory** — `createXStore(dataDir)` returns the operations for one
   domain and is the only thing that touches its JSON document. Read-modify-write
   per call; no long-lived in-memory copies.
2. **Route registrar** — `registerXRoutes(app, auth, dataDir, deps?)` binds one
   domain's HTTP surface and returns its store when callers need it. Explicit
   `deps` for cross-domain needs (bookings ask vendors which listings need
   approval; payments settle against bookings) instead of importing across
   domains.
3. **All persistence through `shared/json-file.ts`** — `readJsonFile`,
   `readJsonArray`, `writeJsonFile`. Never `fs.writeFileSync` a JSON document;
   that is how a crash truncates the database. Pass `{ mode: 0o600 }` for
   documents holding credentials.

`server/index.ts` is a **composition root** and nothing else — it wires modules
together and owns no business logic. If you are adding logic there, it belongs
in a `server/<domain>/` module.

---

## Folder Structure

```
usil/                          ← the SPA
  src/
    App.tsx                    root: routing, client + vendor + admin state
    LoginScreen.tsx            login / register / forgot-password
    types.ts                   shared frontend domain types
    components/
      vendor/                  vendor back office (largest area)
        accounting/            expenses, P&L, receivables, payroll, ZATCA VAT
      admin/                   platform admin dashboard + settings panels
      client/                  order tracking, service comparison
      auth/ courier/ crew/ legal/ market/ mobile/ pwa/ voice/
    utils/                     storage, SEO, exporters (PDF/Excel), forecasting
    data/                      static reference data (Saudi places, categories)
  test-support/repo-paths.ts   test helper: resolve source files from the repo root

usil backend/
  server/
    index.ts                   composition root
    auth/                      auth core, routes, roles, avatars, verification
    vendors/  bookings/  payments/  couriers/  cities/  support/  ai/  seo/
    shared/                    json-file, booking-guards, refund-policy, mail
    legacy-routes.ts
  core/                        modules mirrored from usil/src (see above)
  data/                        runtime JSON store + uploads (gitignored)
  public/                      static assets
  scripts/                     maintenance, Moyasar setup, sync-web, core-sync check
  deploy/                      Caddy site config
```

Tests sit **next to the code they exercise** (`server/auth/auth-avatar.test.ts`,
`src/utils/siteRoutes.test.ts`). Both projects auto-discover them, so a new
`*.test.ts` runs as soon as it exists.

---

## Main Features

| Area | Where |
| --- | --- |
| Marketplace browse, filter, compare, cart | `src/App.tsx`, `components/ServiceCard.tsx`, `CategoryFilterBar.tsx` |
| Checkout → Moyasar hosted invoice | `components/BookingDrawer.tsx` → `POST /api/bookings` |
| Vendor back office | `components/vendor/VendorHub.tsx` |
| Accounting (P&L, expenses, receivables, payroll, VAT) | `components/vendor/accounting/` |
| POS cashier, barcode scan, tap-to-pay NFC | `VendorPOSCashier.tsx`, `BarcodeScannerModal.tsx`, `VendorTapToPayNfcModal.tsx` |
| Inventory + demand forecasting | `VendorInventoryTracker.tsx`, `utils/inventoryForecast.ts` |
| Platform admin (users, applications, SEO, keys) | `components/admin/AdminDashboard.tsx` |
| Courier offline bookings | `components/courier/ExternalBookingForm.tsx` |
| AI assistant / review generation | `components/voice/VoiceAIAssistant.tsx`, `server/ai/gemini-routes.ts` |
| SEO + crawler-readable legal pages | `server/seo/`, `server/seo/legal-static.ts` |
| Mobile app shell | `capacitor.config.ts`, `src/native.ts` |

---

## User Roles

Defined once in `server/auth/roles.ts`. **Add no role checks outside that
module** — every predicate belongs there so permissions stay auditable.

| Role | Meaning | Can |
| --- | --- | --- |
| `client` | Buyer | Browse, book, see own bookings, track orders |
| `vendor` | Supplier | Own workspace, own listings, own bookings |
| `admin` | Platform owner | Everything, incl. users/keys/approvals |
| `accounts_manager` | Delegated admin | Same as `admin` via `roleAllowed` |
| `courier` | Delivery rep | File and edit own external bookings |

Two important behaviours:

- `roleAllowed()` grants `accounts_manager` anything gated on `admin`, so
  `requireRole(['admin'])` admits both.
- `vendorIdFrom()` in `vendors/vendor-routes.ts` lets a supervisor act **on
  behalf of** a vendor via `?vendorId=`, while a vendor is always pinned to their
  own id. This is the single point where vendor data scoping is decided.

---

## Authentication

Cookie sessions — no JWT, no third-party identity provider. Clerk is
deliberately unused (`.env.example` says so).

**Cookie**: `midyaf_sid`, `HttpOnly`, `SameSite=Lax`, `Secure` in production.
Max-Age is 30 days with "remember me", 1 day without, 7 days when unspecified.
Domain becomes `.usil.app` automatically when `PUBLIC_SITE_URL` is a usil.app
host.

**Passwords**: `scrypt` with a per-user 16-byte random salt, stored as
`salt:hash`, compared with `timingSafeEqual`.

### Flow

```
register → user row + session cookie + 6-digit code & token (hashed,
           bound to the email address, TTL enforced)
         → SMTP configured?  yes → emailed
                             no  → code returned in the response body
                                   (deliberate: launch has no mail server)
login    → per IP+email throttle (10 / 15 min)
         → email must exist; phone, if supplied, must match; then password
         → new session token appended to data/sessions.json
verify   → POST /api/auth/verify-email (code) or GET (token link)
me       → resolves cookie → session → user on every request
logout   → deletes the session server-side and clears the cookie
```

`GET /api/auth/me` reads `users.json` and `sessions.json` from disk on **every
authenticated request**. Fine at current scale; the first thing to change when
traffic grows.

### Password reset — read this before touching it

`POST /api/auth/forgot-password` resets a password immediately when the
submitted **email + phone** pair matches a stored user. There is no emailed
token in the loop, so anyone who knows both values can take over the account.
This is the shipped design, not an oversight, and it is throttled to 5 attempts
per IP per 15 minutes with a deliberately generic error message. Treat replacing
it with a token-confirmed reset as a product decision.

---

## API Structure

All routes are same-origin under `/api`. Responses are
`{ success: boolean, ... }` with Arabic user-facing error strings, except the
Moyasar endpoints, which return bare `{ id, url }` / `{ error }` shapes.

### Public (no session)

| Route | Notes |
| --- | --- |
| `POST /api/auth/{login,register,forgot-password,verify-email,resend-verification}` | throttled |
| `GET /api/auth/{me,verify-email}` | |
| `GET /api/catalog/listings` | the storefront's only product source |
| `GET /api/catalog/trending` | «ترند هالأسبوع»: the catalog ranked by 7 days of bookings + views; 30s cache |
| `POST /api/catalog/listings/:id/view` | product-page open; 120/min per IP, one count per caller per listing per 30 min |
| `GET /api/vendors/:id`, `/api/vendors/:id/socials` | public vendor file |
| `POST /api/bookings` | guest checkout; 10/min per IP |
| `POST /api/payments/invoice` | guest checkout; 10/min per IP |
| `POST /api/payments/webhook` | Moyasar → us; shared-secret authenticated |
| `POST /api/payments/moyasar/callback`, `GET /api/payments/:id` | |
| `POST /api/city-requests` | 8/hour per IP |
| `POST /api/couriers/apply`, `POST /api/vendor-applications` | onboarding |
| `POST /api/support/messages` | 10/hour per IP |
| `POST /api/gemini/*` | 20/min text, 4/min image·music·audio, per IP |
| `GET /api/{health,services,seo/public,ai/status,gemini/status}` | |
| `GET /robots.txt`, `/sitemap.xml` | |

### Session required

| Route | Roles |
| --- | --- |
| `POST /api/auth/{logout,avatar}` | any |
| `POST /api/uploads` | client, vendor, admin |
| `GET /api/bookings` | any — clients see only their own |
| `GET /api/me/vendor-file` | any |
| `/api/vendor/*` | vendor, admin(+accounts_manager) |
| `/api/external-bookings/*` | courier, admin — with per-row ownership checks |
| `PATCH /api/bookings/:id` | vendor, admin |
| `DELETE /api/bookings/:id` | admin |
| `/api/admin/*` | admin(+accounts_manager) |

**Known gap**: `PATCH /api/bookings/:id` admits any vendor for any booking.
Platform bookings carry no `vendorId`, so ownership cannot currently be
checked — see [Remaining Work](#remaining-work).

### Route ordering that matters

`GET /api/payments/moyasar` is registered **before** `GET /api/payments/:id`, or
the literal path gets swallowed by the parameter route. Both live in
`payments/payment-routes.ts`; keep them in that order. SEO and static routes are
registered last so no crawler path can shadow an endpoint.

---

## Database

JSON documents in `data/`, all read and written through `shared/json-file.ts`.

| File | Owner module | Holds |
| --- | --- | --- |
| `users.json` | `auth/auth.ts` | accounts, password hashes, verification secrets |
| `sessions.json` | `auth/auth.ts` | `token → userId` |
| `bookings.json` | `bookings/booking-store.ts` | platform (client) bookings |
| `vendor-workspaces.json` | `vendors/vendor-store.ts` | per-vendor bookings, listings, inventory, contracts, socials, profile |
| `vendor-applications.json` | `vendors/vendor-applications.ts` | vendor onboarding requests |
| `courier-applications.json` | `couriers/courier-applications.ts` | courier onboarding requests |
| `external-bookings.json` | `bookings/external-bookings.ts` | courier-filed offline bookings |
| `city-requests.json` | `cities/city-requests.ts` | city demand signals |
| `support-messages.json` | `support/support-store.ts` | contact-form submissions |
| `seo.json` | `seo/seo-store.ts` | admin SEO overrides |
| `integrations.json` | `ai/integrations-store.ts` | AI provider keys (**secrets**, `0o600`) |
| `moyasar.json` | `payments/moyasar-store.ts` | payment keys (**secrets**) |
| `uploads/` | `auth/avatar.ts` | avatars and product images |

`data/` is gitignored and volume-mounted in production. `integrations.json` and
`moyasar.json` hold live credentials — never copy them off the server. The
`vendors-wiped*.json` and `vendor-commerce-cleared.json` files are one-shot
markers left by the wipe scripts so a purge does not repeat on restart.

Frontend state also persists client-side via **localforage** (IndexedDB) with a
`localStorage` fallback, keyed `usil_*` — see `src/utils/storage.ts`. That is
per-browser convenience only and is never authoritative.

---

## External Integrations

**Moyasar (payments)** — `payments/moyasar.ts`. Hosted-invoice flow:
`POST /v1/invoices`, redirect to `invoice.url`. Card data never touches Usil.
The webhook is authenticated with a shared secret compared using
`timingSafeEqual`, and callback URLs are restricted to `https://*.usil.app`.
Secret keys must match `sk_(test|live)_…`. Amounts are handled in **halalas**
(1 SAR = 100) to avoid float drift.

**AI providers** — `ai/ai-providers.ts` routes text generation to Gemini,
Claude, or OpenAI, whichever the admin selects. Keys come from the in-app
integrations panel first, environment variables second, and are **masked**
(`sk_…abcd`) whenever read back through the API. Gemini-specific capabilities
(image, music, audio, search/maps grounding) require a Gemini key. Every handler
has a non-AI fallback, so the app degrades rather than errors when no key is set.

**SMTP** — `shared/optional-mail.ts`. Entirely optional and best-effort; missing
mail config must never block authentication. Accepts either `SMTP_*` or `MAIL_*`
variable names.

**Capacitor** — iOS/Android shell pointing at `https://usil.app`.

---

## Environment Variables

All belong to the **backend**. None are required to boot; everything degrades.

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default 3000) |
| `PUBLIC_SITE_URL`, `APP_URL` | canonical origin for verification links and payment redirects. **Defaults to `https://usil.app`** — set it locally or local runs mint production links |
| `COOKIE_SECURE` | `1`/`0`; defaults to on when `NODE_ENV=production`. Use `0` for local HTTP |
| `COOKIE_DOMAIN` | override; `none`/`0` disables. Auto-set to `.usil.app` for usil.app origins |
| `NODE_ENV` | `production` enables the service worker and secure cookies |
| `MOYASAR_SECRET_KEY` (or `MOYASAR_API_KEY`, `PAYMENT_PROVIDER_SECRET_KEY`) | payment secret. Empty ⇒ payments disabled |
| `MOYASAR_PUBLISHABLE_KEY` | enables the in-page card form |
| `MOYASAR_WEBHOOK_SECRET` | **required** for the webhook; unset ⇒ every webhook is rejected |
| `MOYASAR_WEBHOOK_URL` | must be HTTPS on a usil.app host, else ignored |
| `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | fallbacks when no key is saved in the admin panel |
| `SMTP_*` / `MAIL_*` (`HOST`, `PORT`, `USER`, `PASS`, `FROM`, `SECURE`, `URL`, `SMTP_SERVER`) | optional mail |
| `DATABASE_URL` | used by `scripts/db-clear-catalog.ts` only |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `ORIGIN_IP` | used by `scripts/connect-cloudflare.py` only |
| `WEB_DIST`, `WEB_ROOT` | override where `sync:web` / `check:core-sync` look for the frontend |

---

## Important Business Logic

**VAT** is 15% and prices shown to clients are final and VAT-inclusive.

**Refund tiers** — `shared/refund-policy.ts` is the single source of truth,
consumed by both the SPA page and the crawler HTML so the published policy and
the arithmetic cannot drift:

| Notice before the event | Client receives | Vendor earns |
| --- | --- | --- |
| ≥ 7 whole days | 100% | nothing |
| 3 to < 7 days | 50% | 50% |
| < 3 days, or work started | nothing | 100% |

Days are **whole calendar days on the Riyadh calendar** (fixed UTC+3, no DST),
so the hour of day a client cancels never changes their tier. A vendor
cancellation always refunds the client in full. The helpers are preview-only —
an actual refund goes through Moyasar and the amount Moyasar confirms is the
amount of record.

**Booking mode** — a listing is `instant` or `approval`
(`requiresVendorApproval` in `vendors/vendor-listings.ts`). If any item in a cart
needs approval, the whole booking is created as `approval`/pending.

**Checkout price guard** — `hasCheckoutPrice()` blocks payment on a listing with
no real vendor price, so Moyasar is never charged against a placeholder. The
Moyasar invoice is raised **before** the booking row is stored, so a provider
failure leaves no unpayable booking behind.

**Saudi mobile normalisation** — `normalizeSaudiMobile()` accepts `+966`,
`00966`, `9665…`, `05…` and canonicalises to `05XXXXXXXX`; anything else is
rejected. Bookings require a valid Saudi mobile.

**Client order scoping** — `bookingStore.listForClient()` matches on email *or*
phone, and ignores blank identifiers so an empty stored email can never act as a
wildcard.

**Vendor onboarding** — an application stores the project name, type, logo and
social accounts as the owner wrote them. On approval the workspace is seeded
**from the application**, never from a catalog template. National ID and Saudi
IBAN are format-validated.

**Rate limits** — all via `createSlidingWindowLimiter` (in-memory, per process):
login 10/15min per IP+email · forgot-password 5/15min per IP · bookings and
invoices 10/min per IP · city requests 8/hour per IP · support 10/hour per IP ·
external-booking writes 20/min per IP · AI text 20/min, AI heavy 4/min per IP.

**Error responses** — the backend's final error handler passes through a 4xx from
the body parser (400 for a malformed body, 413 for one over the 16 MB limit) and
only logs a stack trace for genuine 5xx faults.

---

## Development Commands

Needs **Node 22+**. Two `npm install`s, one per project.

```bash
# frontend — usil/
npm run dev          # vite dev server, proxies /api and /uploads to the backend
npm run lint         # tsc --noEmit — the only type gate; there is no ESLint
npm test             # node --test over src/**/*.test.ts
npm run build        # -> dist/
npm run cap:sync     # build + sync iOS/Android

# backend — usil backend/
npm run dev          # tsx server/index.ts
npm run lint
npm test             # auto-discovers server/ and core/ tests
npm run build        # -> dist/server.cjs
npm run sync:web     # copy ../usil/dist into dist/ (never touches server.cjs)
npm start            # node dist/server.cjs
npm run check:core-sync
npm run wipe:vendors      # destructive
npm run db:clear-catalog  # destructive, needs DATABASE_URL
```

Run both together for local development: the backend on its `.env` port, and the
frontend dev server proxying `/api` to it. Set `PUBLIC_SITE_URL`/`APP_URL` to
your localhost origin and `COOKIE_SECURE=0`, otherwise verification links and
payment redirects point at production and the session cookie is rejected over
HTTP.

---

## Testing

`node:test` with `tsx`, no test framework. **269 tests total** — 235 backend, 34
frontend. Both projects glob for `*.test.ts`, so a new test file runs as soon as
it exists.

Coverage is strongest where it matters: auth (sessions, remember-me, avatars,
verification, forgot-password, login throttling), the vendor store and routes,
the booking and support stores, applications, Moyasar, SEO, integrations,
atomic JSON writes, and the refund policy. HTTP-level suites spin up a real
Express app on an ephemeral port against a temp data directory.

The frontend has **no component tests** — only pure helpers under `src/utils`
and `src/data`, plus a few suites that assert on source *text* (that a screen
still renders a required string). Those use
`test-support/repo-paths.ts` so they resolve from the repo root and do not break
when a test moves. React components are otherwise verified by type check and
build only.

---

## Deployment

Docker on Alibaba Cloud ECS, fronted by Caddy, from the **backend** project.

```bash
cd usil && npm run build
cd "../usil backend" && npm run sync:web
docker compose build && docker compose up -d --force-recreate
```

`sync:web` must run before the image build so the SPA is present in `dist/`.
Hard-refresh (Ctrl/Cmd+Shift+R) after deploying. Production reads its
environment from `.env.production.local` via compose; `.env` is gitignored and
dockerignored and must never hold production secrets.

Moyasar cannot POST through Cloudflare Bot Fight Mode, so webhooks use a
**DNS-only (grey-cloud)** `hooks.usil.app` record pointing at the origin.

---

## Troubleshooting

**Session drops immediately / login appears to succeed then fails** — cookie
mismatch. On local HTTP set `COOKIE_SECURE=0`, and leave `COOKIE_DOMAIN` unset
for `127.0.0.1`.

**Verification links and payment redirects point at usil.app locally** —
`PUBLIC_SITE_URL` is unset; it defaults to production.

**No verification email arrives** — expected without SMTP. The 6-digit code is
returned in the `/api/auth/register` response as `verificationCode`.

**Every Moyasar webhook 401s** — `MOYASAR_WEBHOOK_SECRET` is unset. Unset means
reject-all by design.

**Payments rejected with "ثبّت سعر المنتج"** — the listing has no real price;
`hasCheckoutPrice()` blocks checkout.

**Storefront empty** — correct when no vendor has published a listing.
`GET /api/catalog/listings` only returns listings whose vendor is an approved
vendor account. Do not "fix" this by seeding `SERVICES`.

**Blank page / stale UI in production** — the SPA in the backend's `dist/` is
whatever `sync:web` last copied. Rebuild the frontend and re-run it.

**A shared rule behaves differently in the UI than in the API** — `core/` and
`src/` have drifted. Run `npm run check:core-sync` in the backend.

**AI features return canned text** — no provider key configured; every AI
handler has a deliberate fallback. Check `GET /api/ai/status`.

**HTTP 429** — a rate limiter fired. Limits are per process and in-memory, so
restarting clears them.

**`npm run lint` fails but `npm run build` passes** — expected: Vite and esbuild
strip types without checking them. `lint` is the only type gate.

---

## Remaining Work

Known issues, deliberately left for a product or architectural decision:

1. **`core/` is duplicated, not shared.** `check:core-sync` detects drift but
   cannot prevent it. Promoting `core/` to an npm workspace package consumed by
   both projects is the real fix.
2. **`PATCH /api/bookings/:id` has no ownership check** — any vendor can change
   the status of any platform booking. Fixing it properly means recording a
   `vendorId` on bookings (derivable from `serviceId`/`items[].id` → listing),
   which is a data-model change.
3. **Password reset needs no emailed token** — see
   [Authentication](#authentication).
4. **Login enumerates accounts** — distinct messages for unknown email vs wrong
   password vs mismatched phone. Merging them into one generic string is a
   one-line change in `loginHandler` but alters user-facing copy.
5. **Sessions never expire server-side.** `sessions.json` grows without bound
   and a token stays valid until logout, even after the cookie expires. Store an
   issued-at timestamp and prune on read.
6. **Neither `tsconfig.json` is `strict`.** No `strictNullChecks`, which is why
   discriminated unions need the `x.ok === false` idiom to narrow. Enabling it
   would surface a large backlog.
7. **`src/App.tsx` is ~2,070 lines** and owns client, vendor and admin state at
   once. The vendor-accounting state and handlers are the natural first extract.
8. **`fetch` is scattered across ~23 frontend files** (`AdminDashboard.tsx`
   alone holds 22 raw calls). There is no API client layer;
   `src/utils/vendorWorkspace.ts` is the closest thing to one.
9. **Client bundle is ~2.5 MB** (703 kB gzipped) in one chunk. `jspdf`, `xlsx`,
   `three` and `html5-qrcode` are vendor-only and are prime candidates for
   dynamic import.
10. **Unreferenced components still in the tree** — reachable by no code path,
    left in place because several look staged rather than abandoned:
    `HeroSection`, `TrustAndExperience`, `MoyasarCheckoutForm` (pairs with the
    unused `moyasarFormReady()`/publishable-key path), `VendorFinancialLedger`,
    `src/VendorWorkspace.tsx`, and
    `market/{OccasionPackages,SaudiSeasonStrip,MarketSolutions}`.
    `VendorWidgetGrid` is imported by `VendorHub` but never rendered.
11. **`data/` has no backup or migration story.** Writes are atomic per file,
    but there is no locking across a route handler's read-modify-write cycle, so
    two concurrent writes to one document are still last-write-wins.

---

## Files To Read First

**Backend**, in order:

1. `server/index.ts` — the whole wiring in one 207-line composition root.
2. `server/auth/roles.ts` — the permission model, small and complete.
3. `server/auth/auth.ts` — sessions and identity.
4. `server/shared/json-file.ts` — ~55 lines, and the basis of all persistence.
5. `server/vendors/vendor-store.ts` — the vendor domain model.
6. `server/payments/moyasar.ts` — the money path.
7. `server/bookings/booking-store.ts` — the store-factory pattern at its clearest.

**Frontend**:

1. `src/App.tsx` — routing and state hub.
2. `src/types.ts` — the domain vocabulary.
3. `src/components/vendor/VendorHub.tsx` — the back office shell.
