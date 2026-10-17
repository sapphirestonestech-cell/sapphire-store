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
