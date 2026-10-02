# يوصل / Usil — Features

Every feature in the product, grouped by who uses it. Each entry gives the
feature's real status, since several screens in the app look finished but are
local-only, simulated, or never reached. Engineering internals (architecture,
conventions, env vars, deployment) are in [ARCHITECTURE.md](ARCHITECTURE.md).
App-store steps are in [STORE.md](STORE.md).

Usil is an Arabic-first (RTL) marketplace for **event supply in Saudi Arabia**:
hospitality and coffee, buffets, venues, décor, photography, and so on. Clients
book and pay online through Moyasar. Vendors run their business from a built-in
back office. It ships as a web app, an installable PWA, and iOS/Android apps
(Capacitor).

## Status legend

| Mark | Meaning |
| --- | --- |
| ✅ | **Live.** Works end to end and is saved on the server. |
| 🟡 | **Session-only.** Works in the UI, but the data lives in browser memory and is lost on reload (or is only in this browser's storage). |
| 🧪 | **Simulated.** Hard-coded, mock, or cosmetic: it looks real but isn't. |
| ⛔ | **Unreachable or broken.** No UI path reaches it, or it crashes or points to a URL that doesn't exist. |

---

## Contents

1. [Roles](#1-roles)
2. [Storefront (guests and clients)](#2-storefront-guests-and-clients)
3. [Checkout and payment](#3-checkout-and-payment)
4. [Client account and orders](#4-client-account-and-orders)
5. [Accounts and onboarding](#5-accounts-and-onboarding)
6. [Vendor back office](#6-vendor-back-office)
7. [Vendor accounting suite](#7-vendor-accounting-suite)
8. [Crew field portal](#8-crew-field-portal)
9. [Couriers and external bookings](#9-couriers-and-external-bookings)
10. [Platform admin dashboard](#10-platform-admin-dashboard)
11. [AI features](#11-ai-features)
12. [SEO, legal, and support](#12-seo-legal-and-support)
13. [Mobile, PWA, and native apps](#13-mobile-pwa-and-native-apps)
14. [Business rules](#14-business-rules)
15. [Known gaps](#15-known-gaps)

---

## 1. Roles

Defined in `src/contracts/auth/roles.ts` (a copy lives in the backend).

| Role | Arabic | Opens after login | Can |
| --- | --- | --- | --- |
| `client` | عميل | Storefront | Browse, book, pay, see and cancel own orders |
| `vendor` | مورّد | Vendor back office | Manage own listings, calendar, inventory, bookings, and everything in §6–§8 |
| `admin` | مدير كل الحسابات | Admin dashboard | Everything, including accounts, approvals, payments, and SEO settings |
| `accounts_manager` | مدير الحسابات | Admin dashboard | Same as admin, except it cannot create or edit admin/manager accounts |
| `courier` | مندوب توصيل | Storefront | File and edit own external bookings (§9) |

- Admins and accounts managers can **supervise a vendor**. They pick one in the
  vendor-hub picker, and the back office then acts for that vendor (`?vendorId=`).
- **Account protections:**
  - The founder account can't be deleted or have its email changed.
  - The last admin can't be demoted.
  - Nobody can change their own role or delete themselves.

---

## 2. Storefront (guests and clients)

| Feature | Status | Notes |
| --- | --- | --- |
| Live catalog | ✅ | Products come only from `GET /api/catalog/listings`. There is **no demo data**: a listing appears only if its vendor is approved and it has a real price and at least one real photo. An empty store is correct when no vendor has published. |
| Region gate «وين المناسبة؟» | ✅ | On the first visit, a full-screen picker asks for the region: 5 featured cities, 13 administrative regions, or all of Saudi Arabia. The choice is saved in the browser and can be changed from the navbar. |
| Saudi places search | ✅ | 292 places (13 regions, 137 governorates, 140 villages) with aliases. Picking a region also matches every place inside it. |
| Search | ✅ | Matches title, description, category, vendor, tags, occasions, features, and lane names, with synonyms. Suggestion chips appear under the search box. |
| Categories | ✅ | 15 categories: hospitality and coffee, buffet, décor, photography, entertainment, halls, rentals, servers (صبابين), sound and lighting, tents, zaffa, cakes, invitations and gifts, crowd management, condolence setups. |
| Filters and sort | ✅ | Filters: fulfilment lane, audience (women / men / family / corporate), price band, city. Sort: most requested, rating, price up or down. Filtering runs in the browser. |
| Fulfilment lanes | ✅ | يوصل ساعة (within the hour), يوصل اليوم (same day), يوصل بكرا (tomorrow), حجز فوري (instant date lock). |
| «ترند هالأسبوع» (trending this week) | ✅ | The home page's podium and the «الأكثر طلباً» sort come from `GET /api/catalog/trending`: public listings ranked by the last 7 days of platform activity — paid booking lines (5 pts), open unpaid lines (2 pts) and product-page opens (0.25 pts); cancelled or rejected orders count nothing, and quantity is ignored. Opening a product page posts one view per browser session to `POST /api/catalog/listings/:id/view` (server-side: once per caller per 30 min, public listings only, stored per day in `listing-views.json`). The top three listings that actually moved carry a «ترند هالأسبوع» badge in the catalog. With no activity yet the shelf is padded with the newest listings, labelled «جديد هالأسبوع». |
| Occasion packages rail | ✅ | Six presets (wedding, graduation, milcha, conference, Ramadan reception, condolence). Each one sets the category, audience, and search. |
| «كيف يشتغل يوصل» strip | ✅ | Three static steps. Its copy mentions paying the vendor directly, which contradicts the Moyasar-only checkout. |
| Product card | ✅ | Shows the photo, lanes, rating, and the VAT-inclusive final price. The button reads «احجز الآن» for instant listings and «اطلب الحجز» for listings that need vendor approval. The card's compare toggle is ⛔ never rendered. |
| Product detail modal | 🟡 / 🧪 | Gallery, vendor box, socials, includes, coverage, city/date/time/quantity form, and price box. 🧪 The availability check is hard-coded to "✓ التاريخ متاح", and the default date is fixed at 2026-08-28. The date, time, and notes chosen here are **not sent** at checkout; only the cart's single date and city are. |
| Compare up to 4 products | ✅ / 🧪 | Floating bar plus a comparison table (price, rating, response time, notice, cities, includes) with best-price and top-rated badges, and share to WhatsApp. 🧪 The "differences only" toggle does nothing, and the escrow and "bank-verified" text is static. |
| «طلب مورّد في مدينتك» (supplier request form) | ✅ | Shown when a search returns no results. It collects name, phone, city, occasion, date, and a note, and sends them to the admin's city-demand queue. |
| Budget calculator | 🟡 / ⛔ | Choose an event type, guest count (20–500), and live listings; per-person prices are multiplied by guests. The 8–15% bundle discount exists **only in the calculator**; checkout never applies it. «إرسال العرض» opens `/support?text=…`, and the support page ignores that text. The only way in is from the desktop voice assistant. |
| Vendor public page `/vendor/:id` | ✅ / ⛔ | Profile, socials, lanes, and listings. ⛔ Clicking a product on this page opens nothing. |
| Language toggle (EN / عربي) | 🧪 | Only about 25 strings are translated; the rest stays Arabic in an LTR layout. The toggle is desktop only. |
| Currency (SAR / USD / EUR) | 🧪 | Fixed exchange rates, used only on product cards, comparison, and the calculator. Cart, checkout, and payment are always in SAR. Desktop only. |

---

## 3. Checkout and payment

| Feature | Status | Notes |
| --- | --- | --- |
| Cart | 🟡 | A bottom sheet on mobile and a side drawer on desktop. The cart is saved in the browser (IndexedDB) and is not cleared on logout. |
| Checkout form | ✅ | Name, Saudi mobile, city, event date, and notes. Guests can check out without an account. The draft is autosaved in the browser. |
| Server-side pricing | ✅ | The server re-prices the cart from stored listings. If the price has changed it returns 409 «السعر تغيّر», so the client's total is never trusted. |
| Guards | ✅ | The server rejects: an event date in the past (Riyadh time), a date the vendor has blocked, a listing without a real price, an identical unpaid order within 10 minutes, and a double tap. |
| Moyasar hosted invoice | ✅ | A Moyasar invoice is created **before** the booking is saved, and the client is redirected to Moyasar's page. Methods are mada, Apple Pay, credit card, and STC Pay. Card data never reaches Usil. |
| Webhook and callback | ✅ | The webhook checks a shared secret and then re-fetches the payment from Moyasar. A booking is marked paid only for SAR, at least the order total. |
| Payment result pages | ✅ | `/payment/success` shows the verified amount; `/payment/cancelled` is a static page. |
| Post-checkout success screen with tracking code | ⛔ | The code exists but is never triggered. |

---

## 4. Client account and orders

| Feature | Status | Notes |
| --- | --- | --- |
| «طلباتي» (my orders) | ✅ | Lists the client's orders from the API, each with its status and a paid or unpaid badge. |
| Resume payment | ✅ | «إكمال الدفع» appears on an unpaid, open order and reopens its Moyasar invoice. |
| Self-service cancellation | ✅ | Shows the refund preview first: 100% / 50% / 0% (see §14). Not allowed once the order is in progress, completed, rejected, or past its event date. The refund itself is paid manually in Moyasar. |
| Live tracking timeline, supervisor card, rating, share link | 🧪 / ⛔ | Everything in the tracking modal except «طلباتي» runs on browser-only data that nothing creates. The share link `usil.app/track/<code>` has no route and lands on the 404 page, and the rating is not sent anywhere. |
| Mobile account sheet | ✅ | Avatar, name, role, and contact details, plus buttons for email confirmation, my orders, the dashboard (for non-clients), and logout. |

---

## 5. Accounts and onboarding

| Feature | Status | Notes |
| --- | --- | --- |
| Login | ✅ | Email, phone, and password. «حفظ البيانات» (remember me) keeps the session for 30 days and saves only the email in the browser; without it the session lasts 1 day. Limited to 10 attempts per 15 minutes. Pending or rejected vendor applicants get a specific message. |
| Client registration | ✅ | Name, email, phone, password (8+ characters), and an optional avatar. A branded avatar is generated if none is uploaded. |
| Email verification | ✅ | A 6-digit code (valid 30 minutes) or an emailed link. The code field accepts paste and submits automatically. Without SMTP, local runs show the code on screen. |
| Password reset | ✅ | A 6-digit code sent by email, valid 15 minutes, locked after 5 wrong tries. The reply is the same whether or not the email exists. |
| Vendor registration wizard | ✅ | Three steps:<br>**1. Identity and project:** full name, project name and type, national ID/iqama (10 digits starting with 1 or 2), optional commercial register, logo, password.<br>**2. Bank and reach:** bank (20 options), IBAN (`SA` + 22 digits), account holder, fulfilment lanes, at least one social account with an ownership confirmation.<br>**3. First product:** title, category, price and unit, 2–8 photos.<br>The applicant stays pending until an admin approves. The first product's city is fixed to Riyadh and its mode to approval. |
| Vendor file card | ✅ | Shows the applicant's own application status: pending (hidden from the market), approved, or rejected. |
| Courier application | ✅ | See §9. |

---

## 6. Vendor back office

The vendor back office (`VendorHub`) has a sidebar with 14 tabs. Only
**bookings, blocked dates, inventory, contracts, listings, and socials** are
saved to the server. They sync automatically, and the header shows
«محفوظ على السيرفر» when saved.

| Tab | Status | What it does |
| --- | --- | --- |
| **Products and lanes** (listings) | ✅ | Create, edit, and delete products: title, category, price and unit (per event / hour / person / day / unit), covered cities, 2–8 uploaded photos (jpg/png/webp, 5 MB each), fulfilment lanes, and booking mode: *instant* or *vendor approval* (the default). |
| **Calendar and conflict prevention** (calendar) | ✅ / ⛔ | Month view with each day's bookings, a badge for each booking's source (platform / phone / Instagram / WhatsApp / bio link), and a double-booking flag. The vendor can block dates (full day / maintenance / holiday / custom); checkout refuses blocked dates. ⛔ The "sync to Google/Apple (iCal)" link points to `/api/vendor/calendar.ics`, which doesn't exist. |
| **Record external booking** («حجز جديد» button) | ✅ | Logs a phone, Instagram, WhatsApp, or bio-link booking: customer, service (auto-priced from the vendor's listings), date and time, venue, guests, total, deposit and remaining, crew, and notes. It warns about a clash but doesn't block it. |
| **Inventory and consumption forecast** (inventory) | ✅ | Items with stock, minimum threshold, unit cost, usage per guest, lead time, supplier, barcode, and location. The forecast multiplies upcoming guests by usage per guest and flags each item as safe, low, or critical shortage, with a reorder suggestion (shortage × 1.3) and its cost. 🟡 A restock also records an expense, but only in memory. |
| **Barcode / QR scanner** | ✅ | Real camera scanning (EAN, UPC, Code128/39, QR, DataMatrix) with camera switch, torch, beep and vibrate, continuous mode, and manual entry. It adjusts stock or starts a new item with the scanned code. From the header scanner, the scanned code is dropped when adding or restocking. |
| **POS cashier** (pos) | 🟡 / 🧪 | Point-of-sale screen: SKU entry, custom items, discount, 15% VAT, six payment methods, a thermal receipt (print or WhatsApp), and sales history. Each sale also creates a calendar booking on the server. The item catalog is always empty, so only custom items work. Sales are in memory only. The receipt QR is decorative. |
| **Tap-to-Pay NFC** (inside POS) | 🧪 | **A simulation, not a payment.** It plays an EMV-style animation and makes up the card number, auth code, and RRN. No money moves. On Android Chrome it listens for NFC tags but never reads bank cards. |
| **Trust and smart contracts** (trust) | ✅ / 🟡 / 🧪 | **Contracts** ✅: generate from a booking, share by WhatsApp, and print. The "client signature" is a button the vendor presses, not a real e-signature. **Quotations** (15% VAT, 30% deposit) and **gift cards** 🟡 are lost when you leave the tab. **Readiness checklist** 🧪 has no way to add items. **Verification profile** 🧪 shows fixed claims such as "99.4% trust". |
| **Accounting and P&L** (ledger) | 🟡 | See §7. |
| **Double-blind reviews** (reviews) | ⛔ | Built so neither side sees the other's review until both submit, with an AI-drafted comment. It never has data: nothing creates reviews, and its reminder link `/reviews/{id}` has no route. |
| **Live order tracking and API** (tracking) | ⛔ | Timeline editor, branded public tracking page preview, and a "free tracking API" snippet. **It crashes when the vendor has no trackings**, which is the normal case, and the error screen drops the vendor back to the store. The `/track/…` and `/api/v1/track/…` URLs it shows don't exist. |
| **WhatsApp desk** (whatsapp) | ✅ | Click-to-chat (`wa.me`) from the vendor's own WhatsApp; no WhatsApp API is involved. **Clients** are built from bookings. **Templates** cover confirmation, reminder, remaining balance, on the way, and thank you / review. **Crew** templates and **Usil support** templates are included too, and they fill in the name, service, date, venue, and remaining amount. |
| **Branded invoices** (invoices) | 🟡 / 🧪 | Line items, 15% VAT, deposit, and paid / partial / unpaid status, with a 15% platform fee on platform orders. Exports an invoice PDF and a deposit receipt PDF with the amount in Arabic words, plus print and WhatsApp. 🧪 The "ZATCA" QR is a drawn pattern, not a compliant QR. The PDFs use a font with no Arabic glyphs, so Arabic text likely renders incorrectly. Invoices are not saved. |
| **Social accounts** (socials) | ✅ | Instagram, TikTok, Snapchat, X, YouTube, and WhatsApp Business, with URL validation. The status is pending, linked, or verified, and only an admin can verify. Changing a URL resets its verification. When an admin supervises a vendor, this tab edits the admin's own socials instead of the vendor's. |
| **Brand / white-label** (brand) | 🟡 | Brand name, slogan, CR, VAT number, logo and stamp URLs, colours, bank, IBAN, and invoice header and footer. Used on invoices, POS receipts, and the tracking page. Edits are not saved. |
| **Local backup** (brand tab) | 🟡 | Downloads a JSON snapshot of the workspace, including in-memory accounting. It can validate an uploaded backup but **cannot restore** one. |
| **Crew and vehicles** (crew) | 🟡 | Add members (supervisor, coffee server, chef, sound tech, driver, photographer) with hourly rate and IBAN, and log hours per booking (overtime at 1.5×), which feed payroll. Not saved. |
| **Bio link / storefront** (biolink) | ✅ / 🧪 | Copyable link `usil.app/vendor/{id}` with a preview. The handle field is never saved, and the QR is decorative. |

Built but never shown: a drag-and-drop KPI widget dashboard (`VendorWidgetGrid`)
and the old `src/VendorWorkspace.tsx`. Vendors also have **no screen to accept,
reject, or edit a platform booking**; the old screen that did this was dropped.

---

## 7. Vendor accounting suite

The ledger tab has 7 sub-tabs. **None of the accounting data is saved.** It
lives in memory and is gone on reload; the JSON backup (§6) is the only way to
keep it. Revenue figures are real because they come from server bookings, but
costs are session-only. A 15% platform commission applies to platform orders;
external and POS sales carry 0%.

| Sub-tab | Status | What it does |
| --- | --- | --- |
| **P&L statement** | 🟡 | Revenue (platform, external, POS), 15% commission, direct costs, gross margin, operating expenses, net margin, and "commission saved". Export to Excel (3 sheets) or print. The period is fixed to "أغسطس 2026". **Crew wages and inventory purchases are excluded from the totals**, so payroll and restock postings don't affect them. |
| **Receivables** | ⛔ | Aging buckets, payment recording with an Arabic receipt PDF, and WhatsApp reminders. **Nothing in the app ever creates a receivable, so the tab is always empty.** |
| **Expenses and payment vouchers** | 🟡 | 10 categories, 15% or 0% VAT, payment method, payee, supplier invoice reference, and an optional link to a booking. KPIs show total spend and deductible input VAT. |
| **Event costing and pricing** | 🟡 | Quote calculator: suggested price = cost ÷ (1 − margin). Per-booking profitability uses linked expenses; where none exist it **falls back to estimates** (22% raw materials, 250 SAR per crew member, 120 SAR transport). The "loss" status can never appear. |
| **ZATCA VAT report** | 🧪 | Output VAT minus input VAT = net payable, with copy buttons for the ZATCA portal and print. The quarter selector does nothing, and nothing is filed with ZATCA. |
| **Crew payroll** | 🟡 / 🧪 | Pay = regular hours × rate + overtime hours × 1.5 × rate, plus bonus, minus deductions. Hours can be calculated automatically from crew logs, but 🧪 when a member has no logs it **invents a demo shift**. The **unified payment voucher** (سند صرف موحد) groups several entries into one, with the amount in Arabic words, a PDF, WhatsApp sharing, and an optional expense posting. |
| **Wallet and payouts** | 🧪 | "Available" (8,450 SAR) and "escrow" (11,850 SAR) are **hard-coded**, and the default IBAN is a placeholder. A payout request only adds a local row; **no money moves**. |

---

## 8. Crew field portal

The vendor opens it from the navbar «الطاقم» (desktop) or the mobile bar
«بوابة الطاقم». Crew members have no login of their own.

| Feature | Status | Notes |
| --- | --- | --- |
| GPS attendance with geofence | 🧪 | Uses real browser geolocation, with a 200 m geofence and an "approaching" state within 800 m. The starting position is **simulated** near Diriyah, with buttons to fake being inside, approaching, or outside. Check-in is automatic on entering the geofence. |
| Clock in / out | 🧪 | Clocking out creates an attendance record and a work log for payroll. Each shift is **fixed at 5 hours** whatever its real length. |
| Pre-event checklist | 🟡 | Four checkboxes (uniform, equipment, hygiene, timing). Not saved. |
| Manual work logs | 🟡 | Regular and overtime hours per event; these feed payroll. |
| Attendance audit | 🧪 | Seeded with two mock records and lost when the portal closes. |
| — | ⛔ | Opening the portal with an empty crew list is expected to crash. |

---

## 9. Couriers and external bookings

| Feature | Status | Notes |
| --- | --- | --- |
| Courier application (`/courier`) | ✅ | Name, ID/iqama, optional email and phone, plate letters (from the 17 official letters) and number, car type, delivery lanes, and optional product lines. Pending until an admin approves. Approval promotes the linked *client* account to courier. |
| External booking form | ✅ | A courier records a booking made outside the platform: customer, phone, city, service, date and time, guests, amount, whether VAT is included, collection method (cash / transfer / collected by the vendor), vendor, status (new / confirmed / done / cancelled), and address. Couriers see a banner to open it. |
| Courier's own list | — | A courier cannot see the bookings they have submitted; only admins can. |

---

## 10. Platform admin dashboard

For admins and accounts managers. The KPI tiles at the top jump to the
matching tab.

| Tab | Status | What it does |
| --- | --- | --- |
| **Overview** | ✅ | **Vendor applications:** full KYC review with approve or reject. Approving creates the vendor account and puts their listings live; rejecting deletes the seeded workspace. **Accounts:** create an account of any role (created already verified), change roles inline, confirm emails, delete. Also shows listings per category and the **platform bookings** table with status changes and delete. |
| **SEO** | ✅ | Default title, description, and keywords (AR/EN); Open Graph and Twitter cards; canonical URL; robots.txt; Google Search Console verification; per-page overrides for 8 pages. The analytics/GTM ID is saved but ⛔ never added to the page. |
| **Moyasar** | ✅ | Paste the live or test secret key (and optionally the publishable key). The server checks the key with Moyasar, applies it immediately, and registers the webhook. The tab shows the masked keys, the mode, and the webhook status. |
| **Couriers** | ✅ | Review courier applications and approve or reject them. |
| **External bookings** | ✅ | File a booking for any courier. Filter by courier or status, change status inline, delete, and export to CSV (12 Arabic columns, opens correctly in Excel). |
| **Listings and lanes** | ✅ | Every vendor listing. The admin sets fulfilment lanes (at least one) and can edit prices. Listings have **no separate approval step**: they go live once the vendor is approved. |
| **Social accounts** | ✅ | Verify or unverify each vendor's social account, network by network. |
| **City demand** | ✅ | Requests from the supplier-request form (§2), each with a WhatsApp link. Status goes new → contacted → matched → closed. |
| **WhatsApp** | ✅ | **Vendors:** a contact list merged from accounts, applications, and socials, with filters and templates (greeting, application approved or incomplete, listing review, order follow-up, payout, custom). **Support inbox:** contact-form messages marked new, replied, or closed, answered by WhatsApp or email. |
| **Supervise a vendor** | ✅ | «لوحة المورد» opens a picker of vendor hubs, then that vendor's back office. |

There is **no admin screen for AI provider keys**, even though the backend has
the API and its error messages point admins to one.

---

## 11. AI features

The backend routes text generation to **Gemini, Claude, or OpenAI**, whichever
the admin configured; image, music, audio, and grounding need Gemini. When no
key is set, AI routes return 503 and never make up results.

| Feature | Status | Notes |
| --- | --- | --- |
| Voice concierge «الوكيل الصوتي الذكي» | ✅ / ⛔ | Speech in and spoken replies in Saudi Arabic (browser speech APIs). It recommends live catalog products with add-to-cart and details buttons, offers quick-reply chips, and links to the calculator. ⛔ **Desktop only**: there is no way to open it on mobile. |
| AI review drafting | ✅ | Drafts a review comment in the vendor's reviews tab. That tab never has data (§6). |
| Review analysis, image generation, music, transcription, search and maps grounding, chat, AI package matching | ⛔ | Backend endpoints exist, but **no screen calls them**. |

---

## 12. SEO, legal, and support

| Feature | Status | Notes |
| --- | --- | --- |
| Server-rendered meta | ✅ | The server injects title, description, OG and Twitter tags, canonical URL, and JSON-LD (Organization, and Service on product pages) into each page. |
| `robots.txt`, `sitemap.xml` | ✅ | The sitemap covers static pages plus each approved listing and public vendor. |
| Legal pages | ✅ | `/privacy`, `/terms` (marked draft), `/refund`, `/support`, `/about`, plus a 404 page with search and categories. Legal text is pre-rendered, so crawlers can read it without JavaScript. |
| Support page | ✅ | WhatsApp +966 59 500 1957, a contact form that goes to the admin inbox, region shortcuts, and hours (Sunday–Thursday, 9 am to 11 pm). |

---

## 13. Mobile, PWA, and native apps

| Feature | Status | Notes |
| --- | --- | --- |
| Mobile bottom bar | ✅ | Store/dashboard toggle, home, a floating cart button, tracking (the crew portal for vendors), and account. |
| PWA install banner | ✅ / 🧪 | Uses the browser's install prompt on Android and desktop, and a 3-step "Add to Home Screen" guide on iOS. It promises booking notifications, but 🧪 **there are no push notifications**. |
| Service worker / offline | 🧪 | Registers only on usil.app, but in practice caches nothing: its asset rule targets a Next.js path this Vite app doesn't use. |
| iOS and Android apps | ✅ | A Capacitor shell (`sa.usil.app`) that ships the built web app and sends API calls to `usil-emjc.onrender.com` through native HTTP. Includes a navy splash screen and status bar, keyboard resizing, and the Android back button. |

---

## 14. Business rules

- **VAT**: 15%. Prices shown to clients are final and include VAT.
- **Refund tiers**, counted in whole Riyadh calendar days before the event:

  | Notice | Client refund |
  | --- | --- |
  | 7+ days | 100% |
  | 3–6 days | 50% |
  | under 3 days, or work started | 0% |

  - If the vendor cancels, the client gets a full refund.
  - Refunds take 3–10 business days and are paid manually through Moyasar.
- **Booking modes**: a listing is *instant* or needs *vendor approval*. If any
  item in the cart needs approval, the whole order starts as
  «بانتظار موافقة المورّد» (waiting for vendor approval).
- **Booking statuses**:
  - An order starts as جديد (new) or بانتظار موافقة المورّد (waiting for vendor approval).
  - It can then become مؤكد (confirmed) or مرفوض من المورّد (rejected by vendor).
  - A confirmed order moves to قيد التنفيذ (in progress), then مكتمل (completed); it can be ملغي (cancelled).
  - Cancelled, rejected, and completed are final. A vendor cannot cancel a paid order; only an admin can.
- **Payment statuses**: unpaid → paid, set only after the server verifies the
  payment with Moyasar.
- **Saudi mobile**: `+966`, `00966`, `966`, and `05…` forms are all normalised
  to `05XXXXXXXX`. Checkout requires a valid Saudi mobile.
- **IDs**: national ID or iqama is 10 digits starting with 1 or 2. IBAN is
  `SA` + 22 digits.
- **Rate limits** (per IP, in memory):

  | Action | Limit |
  | --- | --- |
  | Login | 10 per 15 min |
  | Checkout and invoices | 10 per min |
  | City requests | 8 per hour |
  | Support messages | 10 per hour |
  | Courier applications | 5 per 15 min |
  | External booking writes | 20 per min |
  | AI text | 20 per min |
  | AI heavy (image, music, audio) | 4 per min |

---

## 15. Known gaps

The highest-impact items, drawn from the ⛔ / 🧪 / 🟡 rows above:

1. **Vendor accounting, crew, invoices, POS sales, brand settings, and payouts
   are not saved.** A reload wipes them.
2. **The vendor tracking tab crashes** for any vendor with no trackings. The
   crew portal is expected to crash with an empty crew list.
3. **Tap-to-Pay, the wallet balances, and payouts are simulated.** Don't
   present them as real payment features.
4. **ZATCA output is not compliant.** The QR is decorative, the TLV encoder is
   never called, and the PDFs likely garble Arabic text.
5. **Client order tracking, reviews, and receivables never get data.**
6. **Links that don't exist**: `/track/…`, `/api/v1/track/…`,
   `/api/vendor/calendar.ics`, `/reviews/…`, `/invoice/…`.
7. **Checkout ignores** the product modal's date, time, and notes, and the
   calculator's bundle discount. The availability check in the product modal
   is fake.
8. **There is no screen for vendors to confirm or reject platform bookings.**
9. **Unreachable features**: the voice assistant on mobile, the calculator
   outside the assistant, the compare toggle on cards, the widget dashboard,
   the admin AI-keys screen, and most AI endpoints.
10. **Refunds are manual**: no endpoint marks a refund as done.
11. **English and currency switching are shallow**: about 25 translated
    strings, and fixed exchange rates.
