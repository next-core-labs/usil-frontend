# Redesign Usil (يوصل): design brief

You're redesigning the UI of Usil, an Arabic-first marketplace for event supply
in Saudi Arabia. This task is **design only**: produce a new visual design as
static mockups, and don't change the app's code. Implementation comes later,
after I approve the design.

## Direction

<!-- Edit this section before sending. Delete what doesn't apply. -->

- **Keep:** the و logo mark (`src/components/UsilMark.tsx`) and the navy
  `#0A1A33` brand colour.
- **Change:** everything else is open, including layout, palette beyond navy,
  typography, card style, and navigation.
- **Mood:** premium but warm, trustworthy, Saudi and modern rather than generic
  SaaS. It should feel like planning a wedding or a majlis, not filing a
  support ticket.
- **References I like:** _(add links or app names here, or delete this line)_

If this section conflicts with anything below, this section wins.

## Read these first

1. `FEATURES.md`: every feature, who uses it, and its real status (✅ / 🟡 /
   🧪 / ⛔). **This is your content inventory.**
2. `src/index.css`: the current design system (tokens, type scale, radius,
   elevation) and its rules in the header comment.
3. `src/components/ui/`: the current component kit (Button, Card, Field, Modal,
   Tabs, Badge, Toast, States, FilterChips).
4. The screens themselves:
   - `src/App.tsx`
   - `src/components/Navbar.tsx`, `ServiceCard.tsx`, `ServiceDetailModal.tsx`, `BookingDrawer.tsx`
   - `src/components/mobile/`
   - `src/components/vendor/VendorHub.tsx`
   - `src/components/admin/AdminDashboard.tsx`

Take the real Arabic copy, category names, statuses, and labels from the code.
**No lorem ipsum and no invented features.**

## The product in one paragraph

Clients (guests don't need an account) browse event services, hosted by
approved vendors across 15 categories:
- hospitality and coffee, buffets, décor, photography, entertainment
- halls, rentals, servers (صبابين), sound and lighting, tents
- zaffa, cakes, invitations and gifts, crowd management, condolence setups

They filter by region (13 Saudi regions and 292 places), fulfilment lane
(يوصل ساعة / يوصل اليوم / يوصل بكرا / حجز فوري), audience (women / men /
family / corporate), and price. They pay the full VAT-inclusive price through
Moyasar (mada, Apple Pay, STC Pay).

Vendors apply through a 3-step wizard. Once approved, they run their business
from a back office: products, calendar, inventory, WhatsApp desk, contracts,
and more. Admins approve vendors and couriers and manage the platform.

The UI ships as a web app, a PWA, and iOS/Android apps (Capacitor wrapping the
same web app).

## What's wrong with the current design

A token system exists in `src/index.css`, but it's only partly applied:

- Only 4 components use the `ui/` kit.
- 17 files still use gradients.
- There are 76 hard-coded hex colours.

As a result, screens look like they come from different products. `App.tsx`
is 2,200 lines and the vendor hub has 14 tabs in one sidebar, so information
architecture is part of the problem, not just styling.

Look at the screens yourself and write down what's weak before proposing
anything.

## Hard constraints

- **RTL Arabic first.** Design with `dir="rtl"` and real Arabic text.
  - Arabic needs looser line height and a slightly larger size than Latin.
  - It has no uppercase, so emphasis comes from weight, size, and colour.
  - Numbers and prices must use tabular figures.
  - English is secondary; the layout only needs to work in LTR, not be designed for it.
- **Mobile first.** Most traffic is phones: design at 390 px wide first, then
  1440 px.
  - Touch targets are at least 44 px.
  - Mobile has a bottom navigation bar (store/dashboard, home, cart, tracking, account).
  - Respect iOS safe areas (notch, home indicator).
- **Price display.** Every price is final and includes 15% VAT. Show it as
  "شامل الضريبة 15% · سعر نهائي". Currency is SAR («ر.س»).
- **Honesty.** Don't design screens that promise what the app doesn't do. Leave
  out or clearly mark features that `FEATURES.md` flags as 🧪 simulated or
  ⛔ unreachable. This includes tap-to-pay, the wallet balances, the ZATCA QR,
  and the client live-tracking timeline. Avoid invented trust badges ("99%
  trust", "bank-verified") and fake stats.
- **Empty states are the normal case.** The catalog has no demo data, and a new
  vendor has no bookings. Design empty, loading, and error states for each
  screen with the same care as the full state.
- **Accessibility.** WCAG AA contrast, visible focus rings, and nothing that
  relies on colour alone for status.
- **Buildable with the current stack.** React 19, Tailwind CSS v4 (`@theme`
  tokens), `lucide-react` icons, and `motion` for animation. Use Google Fonts
  with Arabic support; the current ones are IBM Plex Sans Arabic and Almarai.
  Propose better ones if you have reasons.

## Screens to design

Design each screen at 390 px (mobile) and 1440 px (desktop), except the vendor
and admin screens, which can be desktop first.

**Client storefront (highest priority)**

1. **Home / marketplace.** Header with search and region, category rail,
   occasion packages (wedding, graduation, milcha, conference, Ramadan,
   condolence), filters, product grid. Include the empty state, which shows
   the «طلب مورّد في مدينتك» supplier request form.
2. **Product card.** Photo, lane chips, title, vendor, rating (or «بدون تقييم
   بعد»), price. The button reads «احجز الآن» for instant booking and «اطلب
   الحجز» when vendor approval is needed.
3. **Product detail.** Gallery, vendor box with socials, what's included, city
   coverage, quantity and date, price box with the refund tiers (100% / 50% / 0%).
4. **Cart and checkout.** Items, name, Saudi mobile, city, event date, notes,
   total, then a handoff to Moyasar. Mobile uses a bottom sheet.
5. **Payment result.** Success and cancelled pages.
6. **My orders «طلباتي».** Order status, paid/unpaid badge, resume payment,
   cancel with a refund preview.
7. **Region gate «وين المناسبة؟».** First-visit region picker.
8. **Login, register, email code, password reset.**

**Vendor**

9. **Vendor registration wizard.** 3 steps: identity and project, bank and
   social accounts, first product with 2–8 photos.
10. **Vendor back office shell.** Propose a better information architecture
    for the 14 tabs, grouped rather than one long sidebar. Mock up the shell
    plus the **products** and **calendar** tabs.
11. **Vendor public page** `/vendor/:id`.

**Admin**

12. **Admin dashboard overview.** KPI tiles, vendor applications to approve,
    accounts table.

## Deliverables

Put everything in a new `design/` folder at the repo root:

- `design/DESIGN.md`:
  - a critique of the current UI (what's weak and why)
  - the design direction in a few sentences
  - the information-architecture proposal for the vendor hub
  - rationale for the key decisions
- `design/tokens.css`: the new design tokens (colour with light and dark
  values, type scale, spacing, radius, elevation, motion) written as a
  Tailwind v4 `@theme` block, so it can later replace the one in
  `src/index.css`.
- `design/components.html`: the component sheet. Buttons (all variants and
  states), inputs, selects, chips, badges and status pills, cards, the product
  card, modal and bottom sheet, tabs, table, toast, empty/loading/error states.
- `design/screens/*.html`: one standalone HTML file per screen above, showing
  the mobile and desktop frames side by side.
  - Use Tailwind from the CDN and the tokens from `tokens.css`.
  - Each file must open directly in a browser.
- `design/index.html`: a gallery page that links every screen.

## How to work

1. Read the files listed above and look at the current screens first.
2. Write the critique and direction in `DESIGN.md`, then **stop and show me**
   the direction with the token palette and a sample of the home page on
   mobile before designing every screen.
3. After I approve, design the remaining screens.
4. Don't edit anything under `src/`, `android/`, or `ios/`.
