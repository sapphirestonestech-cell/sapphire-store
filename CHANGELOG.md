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
