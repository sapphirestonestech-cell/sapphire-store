# DECISIONS.md

Every decision made by the product owner, with the date and the question it answers.

---

## 2026-10-17 — First session

| # | Question (AGENTS.md §4) | Decision | Notes |
|---|--------------------------|----------|-------|
| 1 | Which frontend framework and language? | **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4** | The existing `create-next-app` scaffold is kept as the final choice. |
| 2 | Which backend, database and hosting? | **Backend: Next.js API routes (route handlers/server actions) + MongoDB (Mongoose). Hosting: undecided.** | Node.js backend lives inside the Next.js app rather than as a separate service. Hosting deliberately deferred (see OPEN_QUESTIONS.md). |
| 3 | Where are images stored and served? | **Cloudinary** | Covers upload, WebP/resize pipeline and CDN delivery required by ProductReq.md §6.3. |
| 4 | IP geolocation and transactional email services? | *Not yet decided* | See OPEN_QUESTIONS.md. |
| 5 | Package manager, lint/format, testing? | **npm + ESLint (eslint-config-next) + Vitest + React Testing Library** | `package-lock.json` already in use; Vitest added when tests are first written. |
| 16 | Brand assets (logo, name, photos, copy)? | **Placeholders for now.** Product images use **neutral ring-glyph tiles**; a placeholder wordmark is used for the brand name. | No stock photos or borrowed assets. Swap for real assets when provided (DESIGN.md §13.1, §13.9). |
| — | DESIGN.md vs ProductReq.md §3.2 accent-color conflict | **DESIGN.md wins: one gold accent only.** Pre-order badge = Gold Wash fill + Deep Gold text; In Stock badge = white fill + hairline. No blush secondary accent, no rose-gold or green badges. | Resolves the contradiction flagged per AGENTS.md §2.1 precedence (DESIGN.md governs how it looks). |

## 2026-10-17 — Phase 1 plan approval ("Please proceed")

Approved implicitly by approving the Phase 1 plan as proposed; each item below was stated as a recommendation in the plan. Change any of these and I will rework.

| # | Question | Decision |
|---|----------|----------|
| — | Typefaces (DESIGN.md §13.4) | **Cormorant Garamond (display) + Inter (body/UI)**, loaded via `next/font`. Both carry the `₦` glyph. |
| — | Brand gold / canvas / ink (DESIGN.md §13.2–13.3) | **Champagne Gold `#C9A24B`, ivory canvas `#FBF8F3`, warm ink `#211D19`** confirmed as proposed. |
| — | Seed content | Default categories (Engagement Rings, Female Rings, Male Rings, Pre-order Collection) plus ~8 invented placeholder ring names/specs used **only as dev fixtures**, clearly sample data, with neutral ring-glyph image tiles. |
| — | Tagline wording | **"Luxurious rings at an affordable price."** treated as final. |
| — | Admin auth (ProductReq.md §6.1) | **Email + password, HMAC-signed httpOnly session cookie, in-memory rate limiting with lockout.** Passwords hashed with bcryptjs. Admin credentials come from env vars via the seed script — no default password baked into the repo. |
| — | Rounding defaults (until §6.5 settings UI exists in Phase 2) | **NGN rounded to nearest 50; USD to 2 decimal places.** Stored as admin-editable settings. |

## 2026-10-17 — Phase 1 build (admin + verification)

Technical decisions taken while building and verifying Phase 1. Each is a
consequence of `next.config.ts` having `cacheComponents: true` (Cache Components).

| # | Question | Decision |
|---|----------|----------|
| — | Where does dynamic data access live? | **Inside `<Suspense>` boundaries.** `searchParams`/`params` are resolved in async children (`ShopSlot`, `ProductDetail`, `RedirectToShop`), not in the page body. |
| — | Admin area prerendering | **`export const instant = false` on the admin panel layout** — it is an auth-gated blocking route (`cookies()` + live DB data) and must never be prerendered or cached. |
| — | Copyright year in the footer | **Computed via a `"use cache"` helper** so the atomic `new Date()` read does not block prerender. Reverts to a per-request value if the year must be exact. |
| — | Saved-currency read (client) | **`useSyncExternalStore`** for the localStorage preference (server snapshot `USD`), avoiding a synchronous `setState` in an effect and any hydration mismatch. |
| — | Seed category names | **"Engagement Rings", "Female Rings", "Male Rings", "Pre-order Collection"** — aligned with the approved seed-content decision above. |
| — | Seed-data safety | Seed is **idempotent** (upserts) and supports `--fresh`; admin credentials come only from `SEED_ADMIN_*` env vars. Fixture rings use `placeholder:` image URLs, never stock photos. |
| — | Extra dev dependency | **`dotenv`** added as a devDependency so `npm run seed` can read `.env.local` outside Next's loader. Dev-only; no runtime impact. |

## 2026-10-17 — Phase 2 (Commerce) rules

Answers given to the Phase 2 blocking questions. These drive cart, checkout,
delivery fees and price display.

| # | Question | Decision |
|---|----------|----------|
| — | Customer accounts at checkout | **Guest checkout only.** No customer accounts; name, email and phone collected at checkout. Account system stays a future enhancement. |
| — | Pre-order payment (full vs deposit) | **Per product.** Each pre-order ring carries `paymentMode` (full or deposit) and, when deposit, its own `depositPercent`. |
| — | Delivery fee model | **Per shipment.** One fee per shipment; in-stock and pre-order form separate shipments, each charged once via its location fee. |
| — | Who pays delivery / free delivery | **Per product, scoped to location.** On the product form the admin ticks "free delivery" and applies it to **all locations** or to **selected locations**. |
| — | Mixed shipment (some rings free, some not) | **Charge unless every ring in the shipment is free** to that location. |
| — | Deposit percentage source | **Per product**, entered next to the payment mode on the product form. |
| — | Payments (Paystack/BACHS) in this build | **Deferred.** Checkout stops at a disabled `Pay now` handoff and creates a `pending_payment` order. Gateways land once env credentials and BACHS docs are available. |

## 2026-10-17 — Phase 2 build (commerce implementation)

Technical decisions taken while building cart, checkout, orders and the new admin
screens.

| # | Question | Decision |
|---|----------|----------|
| — | Money storage on orders | **Integer minor units of the base currency** (`subtotalMinor`, totals, fees). Converted to the order's display currency only at render via `fromMinor` + `priceIn`/`formatPrice`. No floating-point money maths. |
| — | Order number | **`SAP-YYYYMMDD-XXXXXX`** (6 random uppercase hex chars), unique and indexed; it doubles as the guest order-lookup token (`getOrderByNumber` validates `/^SAP-\d{8}-[A-F0-9]{6}$/`). |
| — | Order immutability | **Snapshot at checkout:** product name, size, unit price, availability, arrival date, free-delivery scope, the delivery-location fees, plus the `currency`, `baseCurrency` and `exchangeRate` in force. Later edits never change order history. |
| — | Currency at checkout | **The visitor's active currency is sent to `POST /api/orders`; the stored base-currency amounts are unchanged.** The order records the chosen display currency + rate for later reference. |
| — | Order status on create | **`pending_payment`** until a gateway confirms payment (ProductReq.md §10). No order is ever marked paid from the browser. |
| — | Storefront DB reads under Cache Components | **Force request-time rendering with `await connection()`** before any uncached Mongoose read in the storefront layout and pages. Admin pages likewise call `connection()`. This guarantees admin edits appear immediately; caching with `"use cache"` + tags is deliberately left for a later performance pass (see OPEN_QUESTIONS.md). |
| — | Unused component after Phase 2 | **`src/components/storefront/size-selector.tsx` is superseded by `PurchasePanel`** and left in the repo rather than deleted, pending the product owner's confirmation. |


