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

## 2026-10-19 — Headings: Cormorant Garamond → Playfair Display

### Changed

- **The display/heading serif is now Playfair Display** (client instruction:
  "choose a better font for the order title"). Cormorant Garamond's thin,
  high-contrast strokes read as wispy at the sizes actually used — a 28px order
  title looked weak. Swapped through the single `--font-display` token in
  `src/app/globals.css` and the `next/font` import in `src/app/layout.tsx`, so
  all 45 `font-display` usages across storefront, account/auth and admin follow
  in one place. Nothing else about the type system changed.
- `DESIGN.md` §3.1 rewritten (family table, decision note), §13 open question 4
  marked resolved, and the §14 quick-start token updated.

### Verified

- Order page (`/order/SAP-20261019-E5782A`) title computes to
  `"Playfair Display"` at 32px; prices still compute to `Inter`, so no serif
  node renders a `₦` (DESIGN.md §3.1 Naira-glyph rule holds).
- `/`, `/product/sienna-pav-eternity` and `/shop`: every `h1`/`h2`/`h3` resolves
  to Playfair Display where `font-display` is applied, Inter otherwise, and
  **no Cormorant font face loads any more** (`document.fonts` contains none).

### Noted

- The shared `next dev` server served a stale `globals.css` bundle after the
  edit (it still emitted `--font-display: var(--font-cormorant)` alongside the
  new `--font-playfair`), so the first browser check showed the old face. A
  `touch` of `globals.css` forced the recompile and the new token took effect;
  no code change was needed. Possibly aggravated by a concurrent edit failing to
  compile at the time.
- `npm run typecheck` currently reports one error in **`src/lib/admin/orders.ts`**
  (`Module '"mongoose"' has no exported member 'FilterQuery'`) — an untracked
  file being written by the parallel session, unrelated to this change. The
  files touched here are unaffected.



## 2026-10-19 — Admin commerce: orders, payments, dashboard

### Added

- **Order model history** — `statusHistory` entries (`status`, `at`, `note`,
  `by`), `adminNotes`, and a `refunded` order status. Payment verification now
  writes a `paid` history entry.
- **Admin order helpers** (`src/lib/admin/orders.ts`) — transition policy
  (`pending_payment → paid → processing → shipped → delivered`, plus
  cancel/refund rules), list filters, date/search queries, money helpers and
  CSV export.
- **Shared payment verification** (`src/lib/payments/verify.ts`) — used by both
  the customer return route and the admin reconcile action. Flags
  `paymentStatus: mismatch` when the gateway confirms a different amount or
  currency.
- **Admin APIs** — `PATCH /api/admin/orders/[id]` (status, cancel, refund,
  notes), `GET /api/admin/orders/export` (CSV) and
  `POST /api/admin/payments/[reference]/verify`.
- **Orders** — list page with search, status/payment/gateway/availability/
  location/date filters, CSV export, desktop table and mobile cards; detail page
  with customer, rings, shipments, payment, totals and timeline, plus status
  actions, internal notes, cancel/refund and gateway verification.
- **Payments** — list page filtered to orders with a payment reference (gateway,
  payment status, search, dates) and a detail page with the payment record,
  order summary, "Verify with gateway" reconciliation and a note that gateway
  logs are not stored.
- **Dashboard** — sales (USD and NGN), orders today, pending payment, awaiting
  shipment, pre-orders awaiting arrival, low stock, a 30-day/12-week/12-month
  hand-built sales chart, recent orders and quick actions.
- **Settings** — "Payment gateways" card with independent Paystack/BACHS
  switches.
- **Sidebar** — Orders and Payments entries with icons.

### Verified

- `npm run typecheck` and `npm run lint` were clean for this work (1
  pre-existing checkout-form warning); `npm test` 52/52 (10 new admin order
  tests). A later workspace-wide typecheck/lint run is failing on unrelated,
  in-progress wishlist files (`wishlist-grid` missing, `WishlistSync`
  undefined); the admin routes still compile and return 200.
- Next.js dev server: `/_next/mcp` compilation issues empty; `/admin`,
  `/admin/orders`, `/admin/payments`, `/admin/settings`, an order detail page and
  a payment detail page all return 200 with the seeded data; all three chart
  ranges and filtered lists render; CSV export returns
  `text/csv` with escaped cells.

### Not done / noted

- Stock is not restocked on cancel/refund (tracked in OPEN_QUESTIONS.md).
- Per-shipment status/tracking (§8.4) is not modelled; actions are order-level.
- The payment detail page has no raw gateway response or webhook log.
- Client-side interaction checks were limited to authenticated HTTP verification
  because `agent-browser` is not installed in this environment.

---

## Phase 5 — Admin accounts and storefront profile menu (2026-10-20)

### Added

- **Multiple admins** — Admin → **Admins** page (`/admin/admins`): list every
  admin, add a full admin (email + password), and remove one. API:
  `GET/POST /api/admin/admins` and `DELETE /api/admin/admins/[id]`. Two safety
  rules are enforced server-side: an admin can never remove themselves, and the
  last remaining admin can never be removed. Added a Sidebar entry with an icon.
- **Session revalidation** — `requireAdmin()` / `getAdminIdentity()`
  (`src/lib/admin/auth.ts`) now resolve the signed cookie against `AdminUser` on
  every request. Deleting an admin ends their access immediately instead of
  waiting out the 8-hour cookie, and a dead cookie is cleared.
- **All admin API routes** now use the shared `requireAdmin()` guard (products,
  categories, delivery, orders, payments, settings, upload signature).
- **Storefront account menu** — the navbar account entry is now an avatar +
  name dropdown with **View user account**, **View back office** (shown only for
  admins) and **Log out**. "View back office" appears for an admin session even
  without a customer login; "View user account" routes to `/account`.

### Changed

- Admin login credentials are now `sapphirestonestech@gmail.com` (was
  `admin@sapphire.test`). The placeholder admin row was renamed in place, so the
  existing password hash row and `_id` are preserved. `SEED_ADMIN_EMAIL` /
  `SEED_ADMIN_PASSWORD` in `.env.local` were updated to match.

### Verified

- `npm run typecheck` clean, `npm test` 64/64 (20 new tests:
  `src/lib/admin/admins.test.ts`, plus the existing order tests), `npx eslint`
  clean apart from the pre-existing checkout-form warning.
- Live HTTP checks against the dev server: owner login, list admins, add admin
  (201), duplicate email (409), short password (400), self-removal (400), owner
  removes another admin (200), stale-cookie API call (401) and stale-cookie
  panel visit (307 → `/admin/login`). `/admin/admins` renders 200; the
  storefront header renders the "Admin" menu label for an admin-only session.

### Not done / noted

- New admins are created by an existing admin setting their password; there is
  no invite-email or self-service password change yet.
- All admins have full access (the `staff` role exists in the schema but is not
  used by the UI).

---

## Phase 6 — Full-width back office, analytics and rich-text editor (2026-10-20)

### Added

- **Dependency-free charts** — `src/components/admin/charts.tsx` with
  `DonutChart`, `TrendChart`, `RankedBars` and `HorizontalBars`. Each is hand-built
  SVG/HTML (no chart library) and ships an `sr-only` data table so the numbers are
  available to screen readers, not just visually. Colour is never the only signal:
  every slice/bar carries a label, an icon or a count.
- **Dashboard analytics** — `src/lib/admin/dashboard.ts` now computes
  `revenueByAvailability`, `revenueByCategory` (top categories),
  `topProducts` (units + revenue + share), `ordersByStatus`, `paidOrderCount`,
  `averageOrderValue`, and window-scoped breakdowns. The dashboard is a
  full-width multi-column grid: dense stat cards (2→4→7 columns), a full-width
  sales trend with y-axis ticks, gridlines and tooltips, average-order panel, two
  donuts (availability and category), best-selling rings, orders-by-status bars,
  quick actions and recent orders (table on desktop, cards on mobile). Range tabs
  drive `?range=30d|12w|12m`.
- **List-page metric strips** — `src/lib/admin/summaries.ts` (`loadOrderMetrics`,
  `loadPaymentMetrics`) and `src/components/admin/metric-strip.tsx`, shown at the
  top of Orders and Payments.
- **Rich-text editor rewrite** — `src/components/admin/rich-text-editor.tsx` is now
  a WYSIWYG `contenteditable` editor with a toolbar (paragraph/H2/H3,
  bold/italic/underline, bullet/numbered lists, blockquote, link/unlink,
  undo/redo) and a live word count. Output is sanitised on every change. The
  allowlist in `src/lib/rich-text.ts` was extended with `<u>` and `<blockquote>`;
  `.rich-text` typography in `src/app/globals.css` gained matching `u` and
  `blockquote` styles.
- **`src/lib/order-status.ts`** — `ORDER_STATUSES`, `statusLabel`, `statusTone`
  shared by the dashboard and list views.

### Changed

- **Admin panel is full width** — `src/app/admin/(panel)/layout.tsx` drops the
  `max-w-5xl` cap in favour of `min-w-0 flex-1` with responsive padding, and now
  awaits `connection()` so the panel renders at request time. This also removes
  the "unstable value `Date.now()` while prerendering" warning raised by the
  session's timestamp check.
- `session.sub` is the admin `_id` (ObjectId string), not the email;
  order `statusHistory.by` records the admin email.

### Verified

- `npm run typecheck` clean, `npm test` 66/66 (2 new rich-text tests for
  `<u>`/`<blockquote>` retention and inline-style stripping), `npx eslint` clean
  apart from the pre-existing checkout-form warning.
- Sanitizer spot-check via `tsx`: allowed tags kept; `<script>`, `onclick`,
  inline `style` and `javascript:` hrefs stripped.
- Browser checks (agent-browser) against the dev server: `/admin` renders
  full-width (`main` 0→1280 at a 1280 viewport, no cap), 22 SVG charts / 23 donut
  arcs, all panels present; metric strips render on `/admin/orders` and
  `/admin/payments`; the product form's editor exposes the full toolbar
  (including Quote) and round-trips `<h2>`, `<blockquote>` and `<u>`.
- `/_next/mcp` `get_compilation_issues` clean; the admin `Date.now()` prerender
  errors are resolved. `/admin` and `/admin/products` report expected "uncached
  data during prerendering" notices (they must render at request time).

### Not done / noted

- Charts stack on narrow screens while metric cards stay dense; visual review of
  the rendered screenshots was not possible in this session (the agent model
  cannot view images), so layout was validated via DOM geometry instead.

### Refinement (2026-10-20, after client feedback: "cheap", "text not clean", "overflowing", "no animations")

- **Stat cards cleaned up** — removed the seven coloured corner dots and all hint
  text. The dashboard now leads with one featured **Total sales** card (both
  currencies, `text-display` figure) above a plain row of five operational counts,
  each a white `rounded-card` with a single figure and a label beneath, per
  DESIGN.md §9.
- **Panel titles no longer compete with the page title** — panel `h2` dropped from
  20px serif to a 14px Inter 500 Warm Ink label; the page `h1` stays serif and is
  clearly the title. Chatty subtitles ("Every order in the system", "Common jobs",
  "Confirmed sales in this period", …) were removed; panel subtitles are kept only
  where they carry a fact (e.g. the sales period).
- **Overflow fixed** — the donut cards overflowed their grid column at 1280px: the
  fixed 160px donut plus a three-column legend needed ~497px inside a 428px body.
  The donut is now `size-36`, the donut/legend break to a row at `md` instead of
  `sm`, the legend can shrink (`min-w-0`, `shrink-0` on the fixed parts), and long
  category names wrap instead of being truncated with an ellipsis. A full DOM
  sweep now reports zero overflowing elements on `/admin` (excluding the
  intentionally hidden `sr-only` table and the horizontally scrollable orders
  table).
- **Charts animate on load** — the single orchestrated moment (DESIGN.md §6):
  donut arcs scale in with a per-slice stagger, and bars grow from their zero
  state (`chart-sweep`, `chart-grow-x`, `chart-grow-y` in `src/app/globals.css`,
  driven by a `data-ready` flag set a frame after mount). All are disabled under
  `prefers-reduced-motion`.
- **Note:** Turbopack served a stale CSS chunk after these globals.css edits, so
  the animation classes did not reach the browser until the dev server was
  restarted. Confirmed live afterwards (`chart-sweep` present with
  `transition: transform, opacity 0.25s`).


## Phase B — New design system: tokens, dark mode, theme switcher (2026-10-20)

Replaces the gold/ivory/serif token layer with the new flat, dense,
finance-derived system (DESIGN.md §2, §10, §11). Done in a way that keeps the
app working at every step.

- **`src/app/globals.css`** — `@theme` rewritten. Theme-dependent colours are
  now plain custom properties under `:root` / `:root[data-theme="dark"]` /
  `@media (prefers-color-scheme: dark)`, and the Tailwind `--color-*` names
  point at them. New tokens: `app/card/raised/hover/active`,
  `border-subtle/border-default`, `track`, `primary/secondary/muted/disabled`,
  `accent/accent-strong/accent-wash/accent-contrast`,
  `danger/success/warning/info`. Card radius 28px→10px, controls 6px, pills
  999px; the old `soft`/`card`/`gold-glow` shadows are neutralised to zero
  (menus keep `shadow-menu`). Type scale retuned to Inter-only sizes
  (heading 19, subheading 17, body 15, caption 13).
- **Legacy aliases kept** — `ivory-canvas`, `warm-ink`, `champagne-gold`,
  `font-display`, `radius-card`, etc. now map onto the new palette, so the ~83
  unmigrated components keep rendering during the phased migration.
- **`src/app/layout.tsx`** — Playfair Display dropped (Inter only). An inline
  pre-paint guard applies a saved theme before hydration (no flash) and the
  tree is wrapped in `ThemeProvider`. The ivory grain `PatternBackground` is no
  longer rendered (the new system is flat).
- **`src/components/theme-provider.tsx`** (new) — theme store via
  `useSyncExternalStore` (same pattern as the currency provider, hydration
  safe). Saved choice in `localStorage` (`sapphire_theme`); with no choice it
  follows the OS live and keeps following when the OS changes.
- **`src/components/theme-toggle.tsx`** (new) — one icon button that flips and
  remembers the theme, with an accessible label. Placed in the storefront
  header beside the currency switcher (`sm` and up). The admin sidebar toggle
  comes with the Phase C shell redesign.
- **Verified:** `tsc` clean, `eslint` clean, `npm test` 66/66; compiled CSS
  carries both theme blocks (`#171717` dark, `#f6f6f4` light) and Inter; the
  pre-paint guard was confirmed in-browser (saved choice survives reload over
  the OS preference); storefront renders with zero overflowing elements.
- **Still on the old look:** no component has been migrated to the new visual
  grammar yet — that is Phase C (admin) and Phase D (storefront).

## 2026-10-20 — Admin sidebar: theme toggle + View store; global 5% zoom

### Added

- **Theme toggle in the admin sidebar** — `ThemeToggle` gained a
  `variant="row"` (full-width icon + label row, matching the sign-out row);
  the storefront header keeps the compact icon variant unchanged. Placed in
  the sidebar footer above Sign out, per DESIGN.md §10 (deferred no longer —
  it ships ahead of the Phase C shell redesign).
- **"View store" link in the admin sidebar footer** — external-link icon,
  `target="_blank"` + `rel="noopener noreferrer"`, so the storefront opens in
  a new tab. Icon-only on the collapsed 64px rail, icon + label from `md`.
- **Global 5% scale-down** — `zoom: 0.95` on `<html>` in `globals.css`,
  applied site-wide (storefront, account/auth and admin) so the whole UI
  renders uniformly 5% smaller, like browser zoom at 95%.

### Verified

- Sidebar footer live in the browser: "View store" carries
  `target="_blank" rel="noopener noreferrer" href="/"`; the theme row flips
  `data-theme` on `<html>`, persists to `localStorage.sapphire_theme` and
  updates its label/aria-label. The dev server needed a restart for the
  globals.css edit to reach the compiled chunk (the known Turbopack staleness);
  computed `zoom` is `0.95` on `/` and `/admin/login`.
- `npm run typecheck` clean; eslint clean on both touched components.

## 2026-10-20 — Production smoke deployment (Helicarrier)

### Fixed

- **Storefront prerender failure under Cache Components** —
  `src/app/(storefront)/layout.tsx` awaited `SignedInSlot()` (→ `auth()` →
  `cookies()`) at layout level outside a Suspense boundary, so every storefront
  route failed prerendering ("uncached or runtime data during prerendering").
  Extracted `StorefrontShell`, added `resolveSignedIn()` + `SignedInGate`, and
  wrapped the tree in `<Suspense fallback={<SignedInProvider signedIn={false}>…}>`
  (same pattern as `HeaderSlot`). Commit `fa21827`. Verified: local build green
  (all storefront routes ◐ Partial Prerender), `npm test` 66/66, container build
  65/65 pages.

### Added

- **Helicarrier deployment** — project `sapphire`, service `sapphire-store`
  (Next.js builder, plan `heli-s2`, branch `main`), managed MongoDB 7
  (`sapphire-db`, private network only, `MONGODB_URI` injected by reference),
  16 env vars imported from `.env.local`, free subdomain
  `https://sapphire-store.on.helicarrier.xyz` (= `APP_URL`).
  Deployment `7aab4d79` live 2026-10-20T17:11:39Z.
- **Production seed via MCP `db_query`** — `scripts/seed.prod-query.js`
  (mirrors `scripts/seed.ts`, idempotent): 4 categories, 6 delivery locations,
  4 settings, opening exchange rate (1,600 NGN/USD), 8 fixture rings with
  Pexels photos, admin user. The release-command route (`npm run seed`) was
  abandoned: Helicarrier's standalone runtime image ships no `scripts/`, no
  `tsx` and no source (diagnostic release command confirmed; the service's
  release command is now empty). A stray `__probe` settings doc from
  connectivity testing was removed.

### Verified

- Live smoke test: `/`, `/shop`, `/terms`, `/track`, `/admin/login` → 200;
  `/api/products` returns the 8 rings; `/api/currency/context` → USD base,
  rate 1600; `/api/delivery/locations` → 6 locations; homepage renders
  "Aurelia Solitaire"; `/product/aurelia-solitaire` → 200; seed photo → 200.
- Admin login with the seeded credentials → `{"ok":true}`, `/admin` → 200.
- Known gaps (recorded in OPEN_QUESTIONS.md): push-to-deploy didn't fire
  (deploys are manual via MCP), no release/seed step in the pipeline,
  `BACHS_WEBHOOK_SECRET` unset, Google OAuth redirect only registered for
  `localhost:3000`, placeholder delivery fees/seed photos still in use.

## 2026-10-20 — Mobile width & header responsive fixes

### Fixed

- **Mobile container not full width** — `page-width` was `width: 80%` with no
  padding at every breakpoint, so every header/section sat ~39px inset on a
  390px phone. Now `width: 100%; padding-inline: 16px` below `md`, with the
  original `width: 80%` restored unconditionally at `min-width: 768px`
  (desktop pixel-identical — verified 1152px = 80% of 1440).
- **Horizontal page scroll on the homepage** (document 665px wide at a 390px
  viewport) — the browse grid (`grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]`)
  sized its implicit column to the `space-y-4 lg:hidden` sidebar's min-content
  (622px) and propagated it to the document. The implicit track is now
  `grid-cols-[minmax(0,1fr)]` (the explicit lg track is unchanged) and the
  sidebar item carries `min-w-0`.
- **Currency switcher + theme toggle never hid on small screens** —
  Tailwind v4 emits `.hidden` before `.inline-flex` in the utilities layer
  (empirically confirmed), so `hidden sm:inline-flex` resolved to a visible
  flex item at every width and pushed the header cluster to 322px, overflowing
  the 390px viewport. The theme toggle now uses `max-sm:hidden`; the currency
  switcher is intentionally left visible at all widths (see DECISIONS.md).
- **Mobile-menu sheet search invisible** — the SearchField form itself carried
  `hidden md:flex`, which also applied inside the open sheet. The form is now
  always `flex`; desktop visibility is controlled by the header wrapper.
- **Header crowding** — gaps tightened below `sm` (`gap-1`, then
  `sm:gap-1.5`, `md:gap-2`; header row `gap-2`), the account chevron is
  `max-sm:hidden`, and the currency switcher shows compact symbols-only
  (`sr-only sm:not-sr-only` on the code, `px-2 sm:px-2.5`).

### Verified

- Real-browser sweep (agent-browser, Chrome): `/` at 320/360/390×844 →
  `document.scrollWidth == innerWidth` (zero overflow); all of `/shop`,
  `/product/amara-trilogy`, `/cart`, `/track`, `/checkout`, `/search`,
  `/terms`, `/admin/login` clean at 390. Header div spans 0..390 with a 16px
  content gutter; currency pill (60px, symbols-only) visible; theme toggle
  hidden below `sm`; sheet search field visible.
- Desktop 1440×900 unchanged: `.page-width` = 1152px (exactly 80%, centered),
  zoom 0.97, search/nav/theme full controls, full three-item currency pill.
- `npm run build` green (PPR shape unchanged), `npm test` 66/66,
  `npm run typecheck` clean, lint 0 errors (1 pre-existing warning in
  untouched `checkout-form.tsx`).

### Flagged (not changed)

- `html` carries two competing zoom rules — `@layer base` `zoom: 0.95` and an
  unlayered `zoom: 0.97; font-size: 97.087%` — so the effective zoom is 0.97
  everywhere; Chrome fills the screen under root zoom so there is no gap.
  Left as-is pending a decision (see OPEN_QUESTIONS.md).

## 2026-10-21 — Paystack currency fix + light default

### Added

- **"Always pay in naira" gateway setting** (`payment_gateways.alwaysPayInNaira`,
  default off) — new switch in Admin → Settings → Payment gateways. When on,
  every payment is converted to NGN at the order's frozen exchange rate before
  reaching Paystack or BACHS, so USD-displaying shoppers can pay via Paystack
  (whose merchant account here is NGN-only). When off, charges use the display
  currency and Paystack is hidden for USD. Backend: `parseGatewayFlags` /
  `getEnabledGateways` return the flag; `GET`/`PUT /api/admin/payments/gateways`
  persist it.
- **`paymentCurrency` on orders** (`src/lib/models/order.ts`) — records the
  currency the gateway was actually charged in, so converted USD orders are
  verifiable and displayable.

### Changed

- **Charge currency is now explicit** — `chargeAmountForOrder(order,
  chargeCurrency?)` builds the due-now amount directly in the target currency
  via `priceIn(fromMinor(base), baseCurrency, target, order.exchangeRate)`;
  `initialize` passes `'NGN'` when the setting is on and stores
  `paymentCurrency`. `chargeMatches` compares the paid currency against
  `paymentCurrency ?? currency`.
- **Gateway availability** (`GET /api/payments/available`) is evaluated against
  the charge currency and now returns `chargeCurrency`; the checkout sends the
  display currency and shows a "You'll be charged in naira…" note when a USD
  order will convert. BACHS initialize now sends the charge currency (was the
  display currency).
- **Admin revenue math reads the charge currency** — `paymentChargeMinor`
  fallback and new `paymentChargeCurrency` helper; order/payment detail pages
  format gateway amounts in `paymentCurrency`; `dashboard.ts` / `summaries.ts`
  convert `paymentAmountMinor` from `paymentCurrency ?? currency` (base
  currency for rows with no payment) to avoid double-converting converted
  orders. Payment detail shows the conversion source.
- **Paystack copy** in the gateway settings now reads "NGN only".
- **Light is the default theme** — `ThemeProvider.resolve()` returns
  `choice ?? 'light'`; removed the OS-follow effect and the
  `@media (prefers-color-scheme: dark)` block in `globals.css`. Dark applies
  only from an explicit saved choice (client instruction, 2026-10-21).

### Verified

- `npm run typecheck` clean; `npm test` 66/66; lint 0 errors (1 pre-existing
  warning in `checkout-form.tsx`).
- Webhook mismatch logs report the expected charge currency for reconciliation.


---

## Phase 3 — Payment test/live modes and admin data scope (2026-10-29)

### Added

- **Per-gateway test/live mode** in Settings → Payment gateways. Each mode
  reads its own env secret (`PAYSTACK_TEST_SECRET_KEY`,
  `PAYSTACK_LIVE_SECRET_KEY`, `BACHS_TEST_SECRET_KEY`,
  `BACHS_LIVE_SECRET_KEY`); keys never enter the admin database, and a
  wrong-prefix key is rejected. Modes with no usable key are disabled with an
  inline reason and cannot be saved as enabled.
- **`Order.paymentMode`** (`test` | `live`) frozen at initialize, plus
  `src/lib/payments/keys.ts` for key lookup/prefix validation.
- **Admin Live/Test data toggle** (cookie `admin_data_scope`) in the panel
  layout, scoping dashboard figures, recent orders, Orders and Payments lists
  and metric strips, and CSV export. Test orders show a "Test" badge and the
  panel shows a "Test data" chip while test is selected.
- **`src/app/api/admin/data-scope`** to persist the scope.

### Changed

- BACHS base URL and webhook key selection follow the payment mode.
- Paystack webhooks verify with the key for the order's mode (both keys for an
  unknown reference) before touching the order.
- `fulfilPaidOrder` skips stock decrement and the customer email for test-mode
  payments, and the status history says "Test payment verified".
- Checkout hides a gateway whose selected mode has no configured key.
- `.env.example` documents the four mode keys. Live mode temporarily falls back
  to the legacy `PAYSTACK_SECRET_KEY` / `BACHS_SECRET_KEY` so the deploy keeps
  production working while Helicarrier's masked values are migrated.

### Verified

- `npm run typecheck` clean; `npm run lint` 0 errors (1 pre-existing
  `checkout-form.tsx` warning); `npm test` 75/75.
- Manual checks still required: add the new env vars on Helicarrier, run one
  test payment per gateway, confirm no stock/email side effects, then confirm
  the Test/Live toggle and CSV scope.

### Deployment

- Deployed 2026-10-29 (deployment `1355f675`, commit `1230d9f`).
- Test keys added to Helicarrier. Paystack live mode now uses
  `PAYSTACK_LIVE_SECRET_KEY`; BACHS live mode still uses the legacy
  `BACHS_SECRET_KEY` fallback until a live BACHS key is supplied.
- `BACHS_WEBHOOK_SECRET` is still unset on Helicarrier, so BACHS webhooks fail
  closed and BACHS relies on return-page verification; set it when available.
