# CHANGELOG.md

A short record of changes, by feature. Newest last.

---

## Phase 1 — Foundation (design, catalog, admin auth, browsing)

### Added

- **Design system implementation** — all tokens from `DESIGN.md` §14 as CSS
  variables in `src/app/globals.css` (`@theme`), plus the `page-width` utility,
  focus-visible gold outline, reduced-motion handling and mobile type scale.
  Cormorant Garamond (display) + Inter (body/UI) via `next/font`.
- **Data layer** — Mongoose models (`Product`, `Category`, `Setting`,
  `ExchangeRate`, `AdminUser`, `DeliveryLocation`), connection helper
  (`src/lib/db.ts`), product querying/filtering (`src/lib/products.ts`),
  currency conversion and rounding (`src/lib/currency.ts`, ProductReq.md §7),
  store settings (`src/lib/settings.ts`), slug and arrival-date helpers.
- **Storefront** — homepage (hero, categories, new arrivals, pre-order band),
  shop with URL-synced filters/sort/load-more, product detail (gallery, price
  block, sizes, delivery estimator, specs, related rings), cart empty state,
  search redirect, and static policy/contact/FAQ shells. Sticky header with
  search + currency switch, footer, announcement bar, mobile bottom bar.
- **Currency layer** — client `CurrencyProvider` (rate from
  `GET /api/currency/context`), `<Price>` component, USD/NGN switcher, saved
  preference via `useSyncExternalStore`.
- **Admin area** — session-gated panel (`src/app/admin`): login page, dashboard
  with counts, product list with edit/delete, product create/edit form (four
  image slots, live converted-price preview, in-stock/pre-order, categories,
  sizes, publishing), and a categories manager.
- **API routes** — `admin/login` (rate-limited), `admin/logout`,
  `admin/upload-signature` (Cloudinary), `admin/products` (create),
  `admin/products/[id]` (update/delete), `admin/categories` and
  `admin/categories/[id]` (create/update/delete with product unassignment),
  `products` (public filtered/paginated list), `delivery/estimate`,
  `currency/context`.
- **Server-side validation** — `src/lib/admin/product-payload.ts` enforces the
  four-image limit, required fields, date and price rules; publish requires an
  image.
- **Seed script** — `npm run seed` (`scripts/seed.ts`, idempotent; `--fresh`
  resets catalog): admin user from `SEED_ADMIN_*`, default categories, opening
  exchange rate (1,600 NGN/USD), settings, and eight fixture rings using
  `placeholder:` images.
- **Tooling** — `.env.example`, Vitest config, 23 unit tests
  (`currency.test.ts`, `products.test.ts`), `typecheck`/`test`/`seed` npm
  scripts; `dotenv` devDependency.

### Changed

- `src/lib/db.ts` now reads `MONGODB_URI` lazily so scripts that load env files
  after import still work.
- `/search` and `/shop` resolve `searchParams` inside Suspense; the product
  detail page resolves `params` inside Suspense — required by Cache Components.
- Footer copyright year is computed through a `"use cache"` helper so it no
  longer blocks prerendering.
- Header mobile menu closes on link tap instead of via a pathname effect.

### Fixed

- Admin product create/update mapped the validated `categories` field to the
  schema's `categories` path (previously sent as `categoryIds`, which would have
  been dropped).
- ESLint errors for synchronous `setState` inside effects (currency provider,
  header) and an unused disable directive (shop explorer).

---

## Phase 2 — Commerce (cart, checkout, orders, delivery & pricing rules)

### Added

- **Order model** (`src/lib/models/order.ts`) — frozen snapshots of customer,
  delivery location, items and shipment fees, currency + exchange rate, and
  integer minor-unit totals (`subtotalMinor`, `deliveryTotalMinor`,
  `totalMinor`, `amountDueNowMinor`, `amountDueLaterMinor`). Unique
  `orderNumber` (`SAP-YYYYMMDD-XXXXXX`, `pending_payment`). (ProductReq.md §9–§11.)
- **Checkout maths** (`src/lib/checkout.ts`, pure + `checkout.test.ts`) —
  `computeOrderTotals`, `toMinor`/`fromMinor`, `itemIsFreeForLocation`;
  in-stock and pre-order billed as separate shipments, a shipment charged once
  unless every ring in it is free to that location. 10 new tests.
- **Cart** — `src/lib/cart.ts` (localStorage store, `CartItem`,
  `addItem`/`setQuantity`/`removeItem`/`clearCart`, `cartCount`,
  `cartSubtotalBase`, `MAX_QUANTITY_PER_LINE=10`) exposed through
  `src/components/cart-provider.tsx` (`useCart`, header `CartLink`); real
  `cart/page.tsx` + `cart-view.tsx`; `purchase-panel.tsx` (size + add to cart,
  deposit and free-delivery notes, `#buy` anchor) replaces the old size
  selector on the product page.
- **Checkout** — `checkout-form.tsx` + `checkout/page.tsx` (guest details,
  delivery-location picker with live totals, sends the active currency);
  `order/[number]/page.tsx` confirmation with a disabled `Pay now` handoff;
  `POST /api/orders` and `src/lib/orders.ts` (`placeOrder` revalidates stock and
  recomputes totals server-side, `getOrderByNumber`).
- **Delivery & currency APIs** — `GET /api/delivery/locations`;
  product-aware `POST /api/delivery/estimate` (returns `freeDelivery` / zero
  fee); `GET|POST /api/admin/delivery`, `PATCH|DELETE /api/admin/delivery/[id]`
  (delete also unassigns the location from products); `GET|PATCH
  /api/admin/settings` (PATCH records a new `ExchangeRate` history entry).
- **Admin screens** — delivery-locations manager (`admin/delivery`), currency &
  exchange-rate settings (`admin/settings`), sidebar entries for both; product
  form gains a pre-order payment-mode/deposit toggle and a free-delivery picker
  (all locations or selected), with active locations loaded on the new/edit
  pages.
- **Seed** — dummy delivery locations (fees in USD) and per-product payment
  mode, deposit percent and free-delivery fixtures; `--fresh` clears locations
  too.

### Changed

- `ProductSummary`/`toSummary` and `product-payload.ts` now carry
  `paymentMode`, `depositPercent` and `freeDelivery`.
- Product-page delivery estimator is product-aware (free delivery is reflected);
  the sticky buy bar links to the purchase panel.
- Checkout sends the visitor's active currency to `POST /api/orders`.

### Fixed

- **Cache Components build:** DB-reading storefront routes (layout, home, shop)
  now call `await connection()` before querying, and all admin data pages do the
  same — `npm run build` previously failed prerendering `/admin/products` and
  `/cart`.
- Checkout form read the delivery-locations response as an array instead of
  `{ locations }`, so the picker showed an error; the active currency is now sent
  with the order.
- `depositPercent` schema/min-max + custom validator combination broke TS
  inference; reduced to the custom validator only.
- `text-danger` → `text-status-error`; order-page JSX nesting and checkout
  `region` nullability.

---

## 2026-10-17 — Seed images & container width

### Added

- **Dev seed images** — `scripts/generate-images.ts` (`npm run images`) writes
  32 self-drawn SVG ring illustrations into `public/seed/rings` (cover, left
  hand, right hand, detail for each of the 8 seeded rings). `src/lib/seed-images.ts`
  holds the shared slugs, view list and art direction so the generator and the
  seed never drift. `seed.ts` now points products at these files instead of the
  `placeholder:` glyph. No stock photography (AGENTS.md §11).

### Changed

- **Container width** — the `page-width` utility is now **80% of the viewport,
  centred**, with no fixed max-width (client instruction, 2026-10-17; supersedes
  the 1200px cap in DESIGN.md §4.5). Hero constellation widened to match.
- **Canvas background** — the ivory canvas now carries a faint **champagne-gold
  dot lattice** (two offset 1.1px dots per 24px tile, ≈18%) as an inline SVG data
  URI on `body`. Page-canvas only; cards/surfaces stay clean. DESIGN.md §4.6, §8
  comparison table and §9 rules amended to record the exception.
- **Homepage hero** — rebuilt from the centered floating-card constellation into
  an **editorial split** (`src/components/storefront/hero.tsx`): tagline + support
  line + gold "Shop rings" CTA + pre-order text link on the left; one large tilted
  ring image with a smaller overlapping card and a gold sparkle on the right.
  Contained, not full-bleed; stacks to one column on phones. `Hero` no longer
  takes props; `loadFeatured` removed. The hero-cover generation and
  `constellation-card` CSS were dropped (`hero-enter` replaces it). DESIGN.md
  §8.1 rewritten.
- **Header nav** — desktop category nav capped at **four links total** ("All
  rings" + first three categories) and reduced to `label` size; mobile sheet links
  reduced to `body` size. Removed a duplicate `MobileMenu` that rendered two
  hamburger buttons. DESIGN.md §7.2 amended.
- **Type scale** — trimmed the heading end (display 48→44, heading-lg 32→28,
  heading 24→22, subheading 20→18; mobile 34/26/22 → 32/23/20) in `globals.css`
  per the client's "reduce the platform font size" instruction. Body 16/14 and
  label 12 are unchanged, keeping the §3.3 accessibility floors. DESIGN.md §3.3
  table and §13 token list updated.

---

## 2026-10-18 — Customer authentication (email/password + Google)

Optional customer accounts layered on top of guest checkout (supersedes
"guest checkout only"; DECISIONS.md 2026-10-18). ProductReq.md §5.8, §14.2.

### Added

- **Customer data model** (`src/lib/models/customer.ts`) — `Customer`
  (passwordHash nullable for Google-only accounts, preferredCurrency),
  `Address` (label, lines, delivery-location ref, default flag),
  `PasswordResetToken` (SHA-256 hash only, single-use, 1-hour TTL, Mongo TTL
  index).
- **Auth.js v5 wiring** (`src/auth.ts`) — Credentials provider (bcrypt,
  rate-limited per email) + Google provider (hidden until
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set), JWT sessions, Google
  sign-in links-or-creates the Customer by verified email.
  `src/app/api/auth/[...nextauth]/route.ts` serves the handlers.
- **Account APIs** — `POST /api/auth/signup`, `POST /api/auth/forgot-password`
  (enumeration-safe response, rate-limited), `POST /api/auth/reset-password`,
  `GET|PATCH /api/account/profile`,
  `GET|POST /api/account/addresses`, `PATCH|DELETE /api/account/addresses/[id]`
  (ownership-checked; max 10; default promotion on delete).
- **Domain helpers** (`src/lib/customers.ts`) — `createCustomer`,
  `requestPasswordReset`, `resetPassword`, `updateCustomerProfile`,
  `getCustomerById`; (`src/lib/account-session.ts`) `getCurrentCustomer`.
- **Transactional email** (`src/lib/email.ts`) — nodemailer over Gmail SMTP
  (`smtp.gmail.com:465`, App Password auth, 10s connection / 20s socket
  timeouts) when `GMAIL_USER`/`GMAIL_APP_PASSWORD` are set; development
  console fallback logs the reset link so the flow is testable before Gmail
  credentials exist. (Initially built on Resend; swapped to Gmail SMTP the
  same day at the client's request — Resend removed.)
- **Welcome email** — sent the moment an account is created, from both
  sign-up (`/api/auth/signup`) and first Google sign-in (`src/auth.ts`
  `signIn` callback). Delivery failure is logged, never thrown, so account
  creation cannot be broken by email trouble.
- **Auth pages** — `/sign-in`, `/sign-up` (auto-signs-in after signup),
  `/forgot-password`, `/reset-password`, all on the storefront shell with
  the admin-login card language; `?callbackUrl=` sanitised to same-origin.
- **Account area** (`/account`, `/account/orders`, `/account/addresses`) —
  profile form (name, phone, display currency; email read-only), order
  history (matched by `customerId` **or** account email), address manager.
  Auth-gated in the layout with a redirect to sign-in.
- **Header account entry** — person icon → `/sign-in` when signed out;
  first name → `/account` + sign-out button when signed in.
- **Env** — `.env.example` gains `AUTH_SECRET`, `APP_URL`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.

### Changed

- **Order model** — optional `customerId` (indexed). `POST /api/orders` takes
  it from the Auth.js session, never the request body (`src/app/api/orders/route.ts`,
  `src/lib/orders.ts` `placeOrder` + `getOrdersForCustomer`).
- **Checkout** — the page resolves the session server-side and prefills
  name/email/phone for signed-in customers; guest flow untouched. The route
  is now `instant = false` (reads cookies; never prerendered).
- **Storefront layout** — loads the session alongside nav categories and
  passes the user into the header.

### Verified

- `npm run lint`, `npm run typecheck`, `npm test` (33 passing), `npm run build` all pass.
- End-to-end smoke test on local MongoDB: signup → sign-in → session →
  profile update → password reset (console link) → sign-in with new password →
  single-use token rejection → wrong-password rejection → address CRUD
  (guest 401) → signed-in order stamped with `customerId` → order visible in
  account history → signed-out `/account` redirects to `/sign-in`.


---

## 2026-10-18 — Product page: add-to-cart toast & tighter upper spacing

### Added

- **Toast component** (`src/components/ui/toast.tsx`) — DESIGN.md §7.19:
  white 20px-radius card, `float` shadow, status icon paired with status
  colour (§2.2), dismiss button on errors only. `.toast-in` entrance
  keyframe in `globals.css`, disabled under `prefers-reduced-motion` (§6).
- **Purchase panel notifications** — clicking *Add to cart* / *Pre-order now*
  now raises a top-centre toast below the header (placement picked by the
  client; DESIGN.md §7.19 styles but doesn't place toasts). Success toasts
  auto-dismiss after ~3.2s and clear the inline line; the "Choose a size
  first." error stays until dismissed or until a size/quantity interaction.
  Inline `aria-live` line kept for screen readers.

### Changed

- **Product detail spacing** — gallery-to-details column gap reduced
  64px → 32px (`lg:gap-16` → `lg:gap-8`) at the client's request; top
  padding and the 24px block rhythm unchanged.

### Verified

- Live-page check via Chrome DevTools: gap = 32px; error toast
  (`role="alert"`) and success toast (`role="status"`) render at y=128,
  centred; success toast auto-dismisses; inline status line mirrors it.
- `npm run typecheck`, `npm test` (33 passing) pass. Remaining lint errors
  are pre-existing in `src/lib/payments/*` (to be fixed in the payments pass).

---

## 2026-10-19 — Product page: size + quantity row, direct checkout

### Changed

- **Purchase panel layout** (`src/components/storefront/purchase-panel.tsx`) —
  the size pills and the quantity stepper now share one row (wrapping the
  stepper onto its own line when the pills need the full width), and the
  stepper gained a visible "Quantity" label + `aria-labelledby` group, matching
  the "Size" group.
- **Two actions side by side** — "Add to cart" / "Pre-order now" keeps the
  Champagne Gold Primary variant; **"Proceed to checkout"** is new and uses the
  Secondary variant (white, hairline) so DESIGN.md §7.5's one-primary-per-view
  rule still holds. Side by side from `sm` up, stacked at phone width.
- **`proceed()`** adds the selected size + quantity to the cart and navigates
  to `/checkout`; with no size it shows the existing "Choose a size first."
  error and stays; when the line is already at its cap it adds nothing (the
  cart holds it) and only navigates; disabled when the ring is sold out.
  `add()` now shares the same `addLine()` helper.

### Verified

- `npm run typecheck`, `npm test` (33 passing) pass; `npm run lint` reports
  only the pre-existing `src/lib/payments/*` and `checkout-form` findings.
- `get_compilation_issues` on the dev server: no issues.
- Click-through on `/product/amara-trilogy` with agent-browser:
  no size selected → "Proceed to checkout" shows the inline + toast error and
  does not navigate; size chosen → navigates to `/checkout` with the ring in
  the cart; line filled to the per-order cap → "Pre-order now" disables while
  "Proceed to checkout" stays enabled and navigates without double-adding.
- Geometry: desktop — size and quantity on the same y, both buttons on the
  same y with single-line labels; 390px — quantity below the pills, buttons
  stacked full width.

### Noted (pre-existing, untouched)

- A server prerender warning — `crypto.getRandomValues()` unstable during
  prerender — fires for the shared storefront layout (`HeaderSlot` in
  `src/app/(storefront)/layout.tsx`) on every storefront route, e.g. `/shop`.
- 18px of horizontal overflow at 390px comes from a header button in
  `src/components/shell/header.tsx`, not from this change.

## 2026-10-19 — Product page: density pass (size dropdown, description, details)

### Changed

- **Size is now a native dropdown** (`src/components/storefront/purchase-panel.tsx`)
  instead of a row of pill chips, which wrapped and consumed vertical space.
  48px pill-shaped control, `body` label above, Soft Taupe chevron (native arrow
  hidden), unavailable in-stock sizes as disabled options suffixed
  "(unavailable)". `DESIGN.md` §7.13 amended and §8.3's mobile order updated.
- **Size and quantity are equal halves** of one row (`grid sm:grid-cols-2`),
  stacking to a single column on phones.
- **All existing purchase logic is unchanged**: size-required error (inline +
  toast), per-size stock cap, pre-order per-order cap, at-cap behaviour, both
  CTAs, deposit and free-delivery lines.
- **The primary CTA is "Add to cart" for pre-order and in-stock alike** (client
  instruction, 2026-10-19); previously pre-orders read "Pre-order now". Applied
  in the panel and the mobile sticky bar. Availability is carried by the badge
  and the arrival line.
- **Description moved directly under the price** (before the buy controls).
- **Details is a plain two-column definition list, no card** — the white 28px
  card read as one more heavy block. Row padding 14px → 10px.
- **Right column rhythm tightened** from `space-y-6` (24px) to `space-y-4`
  (16px) between blocks.
- **The purchase status line no longer reserves a blank line** when it has
  nothing to announce (`empty:hidden`); it stays mounted for `aria-live`.

### Verified

- Desktop (1280): right column 966px → 869px; Details block 229px → 140px;
  size and quantity measured at 232px each, same `y`. CTAs read
  "Add to cart" / "Proceed to checkout", mobile sticky bar "Add to cart", on
  both `/product/tobi-grooved-band` (in stock) and
  `/product/amara-trilogy` (40% deposit pre-order).
- Dropdown: labelled "Size"; "Choose a size" is a disabled placeholder; adding
  with no size shows the inline + toast error and adds nothing; selecting US 7
  and adding puts US 7 × 1 in `sapphire_cart`.
- 390px: the size/quantity row stacks to one column (312px each), Details is
  single-column. The 18px horizontal overflow at this width is the pre-existing
  `header.tsx` icon group, not this page.
- `npm run typecheck` clean; `npm test` 33/33; `npm run lint` 0 errors (only the
  pre-existing `checkout-form` warning).

### Noted

- `src/components/storefront/size-selector.tsx` is dead code — imported nowhere,
  and superseded by the dropdown in the panel. Left in place pending a decision
  to delete.

## 2026-10-19 — Payments: charge the amount the customer was shown

### Changed

- **`POST /api/payments/initialize`** now charges the **due-now amount in the
  order's display currency**, via `chargeAmountForOrder()` — the same figure
  the customer saw on the order page. Previously it sent `order.totalMinor`
  (base-currency minor units) labelled with `order.currency`, so an NGN order
  was under-charged by the exchange rate (e.g. a ₦182,400 quote charged
  ₦114.00). `paymentAmountMinor` now records the converted charge in
  display-currency minor units (ProductReq.md §10.2; DECISIONS 2026-10-18).
- **`POST /api/payments/webhook` and `GET /api/payments/[reference]`** verify
  against `chargeMatches()` (the converted `paymentAmountMinor`, falling back
  to a recompute for rows written before the field existed) instead of the raw
  base-currency `totalMinor`, so a correct payment is no longer rejected and an
  incorrect one is no longer auto-fulfilled.
- **Fulfilment is centralised in `src/lib/payments/fulfil.ts`**
  (`fulfilPaidOrder`, `decimalStringToMinor`): marks the order paid once, then
  decrements **per-size** stock (`sizes[].stockQuantity`, guarded by `$gte` so a
  racing checkout cannot drive stock negative) and sends the confirmation
  email. It no longer writes the non-existent `inventory.stock` field.
- **Amount/currency mismatches on both gateways** return HTTP 200 +
  `console.warn` and leave the order `pending_payment` (see DECISIONS
  `2026-10-19`).

### Verified

- `npm run typecheck` clean; `npm test` 33 passing; `npm run lint` reports only
  the pre-existing `src/lib/payments/*`, `admin/payments/gateways` and
  `checkout-form` findings — `initialize`, `webhook`, `[reference]` and
  `fulfil.ts` are clean.

### Verified (Paystack sandbox end-to-end)

- Order `SAP-20261019-E5782A` (Amara Trilogy, 40% deposit pre-order, US 7,
  Lagos Island, NGN). Checkout page showed **Due now ₦89,600**
  (₦70,400 deposit + ₦19,200 delivery) against a ₦195,200 total.
- `initialize` stored `paymentAmountMinor = 8,960,000` (kobo) with
  `totalMinor = 12,200` — the pre-fix code would have sent **12,200 kobo
  (₦122.00)** for a ₦89,600 quote.
- Paystack's own `verify` API for that reference reports
  `amount: 8960000, currency: NGN`, i.e. the gateway was asked for exactly the
  displayed due-now figure. (Transaction stayed `abandoned`: the hosted page is
  behind a Cloudflare Turnstile challenge, so no card was entered.)
- `chargeMatches` against the real order row: `8960000 NGN` → true; old-bug
  `12200 NGN` → false; full total `19520000 NGN` → false; right amount wrong
  currency `8960000 USD` → false.
- Signed `charge.success` webhooks posted to the running app: wrong amount
  (12,200) → HTTP 200, order left `pending_payment` with no `paidAt` (the old
  code auto-marked this paid); correct amount (8,960,000) → order `paid`,
  `paidAt` set. Pre-order line left stock untouched, as intended.

### Noted

- This fix was worked concurrently by two sessions on the same working tree
  (a parallel agent rewrote `fulfil.ts`, the webhook and `[reference]`; this
  session converted `initialize` and reconciled/verified the result). The tree
  is coherent and passes typecheck, tests and lint.

## 2026-10-19 — BACHS sandbox end-to-end: tunnel, return flow, verification

### Changed

- **The return flow now completes after a real sandbox payment.** The
  `[reference]` poll route gained a BACHS branch: it retrieves
  `GET /v1/checkout-sessions/{id}` (storing `paymentCheckoutId` at initialize),
  accepts `payment_status` `succeeded` **or** `paid` (the checkout object and
  the event payload use different words for the same state), checks amount,
  currency and reference, and fulfils through `fulfilPaidOrder`. Before this,
  a successful BACHS payment fell through to a dead end — no redirect, no
  confirmation email.
- **Rotated-reference recovery:** when the poll fetch passes `?order=`
  (the return page now always does), the route falls back to looking the order
  up by order number and accepts any session whose reference starts with that
  order number — a re-initialized payment overwrites `paymentReference`, which
  used to orphan the old return URL.
- **Cancellation state:** `/checkout/return?cancel=1` (our own `cancelUrl`)
  now renders "Checkout cancelled. You have not been charged." with a link back
  to the order (or Continue shopping) instead of silently redirecting to
  `/checkout` and never polling.
- **BACHS webhook signature verification** now uses `BACHS_WEBHOOK_SECRET`
  (the per-endpoint signing secret — not the API key; fails closed while
  unset), HMAC over `"{timestamp}.{rawBody}"`, any `v1` match, ±300s skew,
  with the v1 header pair as fallback, per the official docs.
- **Admin gateway flags storage fixed:** `SettingModel.value` is a String, so
  the object previously written was stored unusably and every read silently
  fell back to defaults. Flags are now stored as JSON strings and parsed by
  `parseGatewayFlags`; the admin route was rewritten. (No admin UI calls the
  route yet — see OPEN_QUESTIONS #20.)
- **Local BACHS testing:** cloudflared quick tunnel wired to `APP_URL` in
  `.env.local` so BACHS accepts the success/cancel URLs (it rejects localhost).
  The tunnel URL is ephemeral — on restart, update `APP_URL` and restart the
  dev server. (BACHS docs also offer `bachs listen` for forwarded webhooks.)

### Verified

- Real sandbox charge on order `SAP-20261019-CDC3AE`: session retrieved,
  order flipped to `paid` via the poll route, `paymentCheckoutId` backfilled,
  confirmation email sent to the customer address, stock untouched (the line
  was pre-order). Order and return pages return 200.
- `npm run typecheck` clean; `npm run lint` 0 errors (1 pre-existing
  `checkout-form` warning); `npm test` 33/33; `npm run build` passes.
- DECISIONS 2026-10-19 reconciled: Paystack mismatch → 200 + warn (parallel
  session) and cancel state + `?order=` passthrough (this session) are both in
  the tree.

## 2026-10-19 — Customer returns to their own origin after paying

### Problem

After paying, the customer was sent to the gateway return URL built from
`APP_URL` — in dev that was the cloudflared **quick tunnel**, whose URL is
ephemeral and was revoked mid-session. The browser landed on a dead host, the
return page never loaded, so the poll that confirms the order never ran and no
confirmation email was sent.

### Changed

- **`POST /api/payments/initialize` now uses two origins.**
  - `appOrigin` = `req.nextUrl.origin` — the site the customer is actually on.
    **Paystack**'s `callback_url` points straight here, so the customer lands
    back on `http://localhost:3000` with no tunnel hop (Paystack accepts a
    localhost callback; verified against the test API).
  - `publicOrigin` = `APP_URL`/`NEXT_PUBLIC_APP_URL`/`appOrigin`. BACHS rejects
    localhost (verified: `success_url must be a publicly accessible URL
    (localhost is not allowed)`), so BACHS returns to `publicOrigin` with
    `&app=<appOrigin>` appended.
- **`/checkout/return` is now a server component.** It redirects BACHS's public
  hop back to the customer's own origin **server-side** (`http://localhost:3000`
  in dev) before any client script runs, so the bounce cannot be lost to a slow
  or failed hydration. The redirect target is accepted only when it is a valid
  http(s) **loopback** URL, so it can never act as an open redirect. `cancel=1`
  is also rendered as plain server HTML. The polling logic moved to
  `checkout/return/return-poller.tsx` (a client component), with its
  order-reference prop renamed from `ref` (a reserved React prop that cannot
  cross the server/client boundary).

### Verified

- Tunnel return URL carrying `&app=http://localhost:3000` → `307` to
  `http://localhost:3000/checkout/return?...` (app param stripped).
- Same-origin return → `200` (no bounce); `app=https://evil.example.com` → `200`
  (open-redirect guard holds); `cancel=1` → "Checkout cancelled…" server HTML.
- Full browser path for a genuinely paid order: tunnel → localhost →
  `/order/<number>` showing **Paid** and "Thank you — your order is saved";
  confirmation email sent.
- BACHS session (retrieved from the sandbox) carries
  `success_url=…&success=1&app=http%3A%2F%2Flocalhost%3A3000`.
- `npm run typecheck` clean; `npm run lint` 0 errors (1 pre-existing warning);
  `npm test` 33/33.

### Recovery

Several sandbox orders charged during the break were re-verified with Paystack
and confirmed (`E35F7C`, `DC60F9`, `90500F`, `C985AE`, `F56999`); those never
paid at the gateway (`E03F1E`, `09F958`, `5369B2`) were left `pending_payment`.

## 2026-10-19 — Canvas grain: stronger, and on every page

### Changed

- Lifted the irregular canvas grain out of the storefront layout into the
  **root layout** (`src/components/pattern-background.tsx`), rendered once as a
  full-canvas layer behind everything, so the storefront, account/auth and the
  admin panel all share one continuous surface.
- Removed the opaque `bg-ivory-canvas` from the admin panel wrapper so the grain
  shows there too (the body canvas is already ivory, so the tint is unchanged).
- Strengthened the grain on the client's request ("clearly noticeable but still
  background") by steepening its alpha curve with `feComponentTransfer` at the
  same average tint — measured texture contrast (luminance σ on a plain canvas
  region) rose from ≈2.6 to ≈6.4 with no change to the average colour.
- Recorded the 2026-10-19 client instruction in `DESIGN.md` §4.6 and updated the
  two cross-references that still named the removed lattice texture.

### Fixed

- `/checkout/return` is marked `instant = false`: the production build caught
  that its server-side `connection()` read blocked prerendering. The route is
  dynamic by design (it reads `searchParams` and redirects per request), so a
  blocking route is correct here — same pattern as the admin panel layout.

### Verified

- Root-level grain present on the admin login canvas (luminance σ ≈6.4, average
  tint unchanged from the previous grain).
- Return page unchanged at runtime: localhost → `200`, `cancel=1` → "Checkout
  cancelled…" HTML, tunnel hop → `307` back to `http://localhost:3000`.
- `npm run typecheck` clean, `npm run lint` 0 errors (1 pre-existing warning),
  `npm test` 33/33, `npm run build` passes.


