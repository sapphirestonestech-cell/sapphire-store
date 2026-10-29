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

## 2026-10-17 — Seed images & layout width

| # | Question | Decision |
|---|----------|----------|
| — | Product images for local development | **Self-drawn SVG illustrations**, generated by `npm run images` into `public/seed/rings` and linked by `seed.ts`. No stock photography (AGENTS.md §11). Dev-only fixtures to be replaced by the client's real photography. |
| — | Where seed images live | **`public/seed/rings/<slug>-{cover,left,right,detail}.svg`**, with the shared slugs/views/art in `src/lib/seed-images.ts` so generator and seed cannot drift. The Cloudinary upload flow (the eventual production home for images) is still unbuilt. |
| — | Site container width | **80% of the viewport, centred, no fixed max-width** (client instruction). Supersedes the 1200px cap; DESIGN.md §4.5 and the `--page-width` token updated to match. |
| — | Canvas background | **A very faint champagne-gold dot lattice** (two offset 1.1px dots per 24px tile, ≈18% opacity) on the ivory canvas, page-canvas only — never on cards, content surfaces or dark bands. Started as an art-deco diamond hairline; swapped to the dot lattice on the client's request. DESIGN.md §4.6 amended; a deliberate third exception to the "no decorative shapes" rule. |
| — | Homepage hero | **Editorial split** contained in the page width: left = tagline headline + support line + gold "Shop rings" CTA + pre-order text link; right = one large tilted ring image with a smaller card overlapping its corner and one gold sparkle. Replaced the earlier centered floating-card constellation and a short-lived full-bleed cover the client rejected. DESIGN.md §8.1 rewritten. |
| — | Header nav | Desktop nav is capped at **four links total** ("All rings" + the first three admin categories) and set at `label` size; the mobile sheet lists every category at `body` size. Removed a duplicate `MobileMenu` that rendered two hamburgers. DESIGN.md §7.2 amended. |
| — | Type scale | Client asked to reduce the platform font size; chose **"trim headings only"** (display 48→44, heading-lg 32→28, heading 24→22, subheading 20→18, mobile proportionally). Body 16/14 and label 12 are unchanged and stay at the DESIGN.md §3.3 accessibility floors. |

## 2026-10-18 — Customer authentication (email/password + Google)

Answers to the blocking questions for customer accounts. Supersedes the
"guest checkout only" decision of 2026-10-17 (Phase 2 rules).

| # | Question | Decision |
|---|----------|----------|
| — | Customer accounts vs guest checkout | **Optional accounts.** Guest checkout stays untouched; visitors can sign up/in to get order history, saved addresses and a saved currency. Orders placed while signed in are stamped with `customerId` (server-derived from the session, never from the request body); guest orders still look up by order number alone. |
| — | Auth implementation | **Auth.js (NextAuth) v5** (`next-auth@beta`), JWT sessions, Credentials provider (bcrypt against a `Customer` model) + Google provider. Admin auth stays on the separate HMAC cookie (`src/lib/session.ts`) — the two systems are deliberately not unified. |
| — | Google OAuth credentials | **Built with placeholders.** The Google button only renders when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set; email/password works without them. Client has not yet created the Google Cloud OAuth client. |
| — | Account scope | **Full account:** profile (name, phone, display currency; email is sign-in identity and read-only), order history (matched by `customerId` **or** account email, so pre-signup guest orders with the same email also appear), saved addresses (label, lines, delivery-location picker, default flag; max 10), password reset by email. |
| — | Email provider for password reset | ~~Resend~~ **Gmail SMTP** (client decision, 2026-10-18 — free tier). nodemailer over `smtp.gmail.com:465` with an App Password (`GMAIL_USER` + `GMAIL_APP_PASSWORD`). Without credentials, **console fallback in development** — the reset link is logged to the server terminal so the flow is fully testable before an account exists. `EMAIL_FROM` optional; defaults to the Gmail address. |
| — | Password-reset token design | 32 random bytes, base64url, sent once in the email; only the **SHA-256 hash** is stored, single-use (`usedAt`), TTL 1 hour, Mongo TTL index. Reset also drops any other outstanding tokens for the account. |
| — | Customer sign-in rate limiting | Reuses the in-memory limiter (`src/lib/rate-limit.ts`) with key `customer-login:<email>`; forgot-password sending is throttled the same way with `password-reset:<email>`. |
| — | Auth secret | `AUTH_SECRET` (standard Auth.js env var) added to `.env.example` and generated into `.env.local`. `APP_URL` added for password-reset links. |

Technical notes from the build:

- `?callbackUrl=` on sign-in/sign-up is sanitised to same-origin paths only (`/…`, not `//…`) to prevent open redirects.
- The JWT interface augmentation targets `@auth/core/jwt` (where Auth.js v5 declares it), not `next-auth/jwt` (which only re-exports).
- `/checkout` now reads the session server-side for prefill, so it carries `export const instant = false` (blocking route, never prerendered) per the Cache Components rule.
- Storefront header shows a person icon → `/sign-in` when signed out, first name → `/account` plus a sign-out button when signed in.
- Smoke-tested end to end on local MongoDB: signup, duplicate rejection (409), credentials sign-in, wrong-password rejection, profile read/update, forgot→reset→sign-in-with-new-password, single-use token rejection, address CRUD with 401 for guests, order placement stamped with `customerId`, account order history, signed-out redirect from `/account`.


## 2026-10-18 — Payments: gateway choices

| # | Question | Decision |
|---|----------|----------|
| 6 | BACHS integration | Client supplied the docs (https://docs.bachs.io). **Auth is a single secret key** (`sk_sandbox_…`/`sk_live_…`) sent as `Authorization: Bearer …` — there is no separate API key, so `BACHS_API_KEY` was removed from `.env.example`/`.env.local` (2026-10-18); `BACHS_SECRET_KEY` is the only BACHS variable. Sandbox base URL `https://sandbox-api.bachs.io`, production `https://api.bachs.io`. |
| 7 | Paystack keys | Client has test keys; integration targets test mode first, keys live only in `.env.local`. |
| — | Currency mismatch at checkout (§10.2) | **Hide the gateway that doesn't support the customer's currency, with a short explanation** (client pick over auto-conversion). |
| — | Admin gateway control (§10.2) | **Independent enable/disable toggles per gateway** — not a single-select. Both can be live; the customer chooses one at checkout. BACHS shown as a toggle pending its keys. |

## 2026-10-18 — Payments: charge amounts, BACHS verification & webhook policy

Follows the gateway-choices section above; answers the blocking questions for the BACHS + Paystack build (ProductReq.md §10.2–§10.3).

| # | Question | Decision |
|---|----------|----------|
| — | What currency/amount do we charge? | **Convert the charge to the order's display currency.** The charge amount is due-now (or the total) in base minor units, converted at the order's frozen `exchangeRate` via the existing `priceIn` rules (NGN nearest 50, USD 2dp), stored in `paymentAmountMinor` as **display-currency minor units**. Webhook/poll verification compares against this computed charge — not the base-currency total. |
| — | Pre-order deposit: full payment or deposit? | **Charge due-now only.** `Pay now` charges `amountDueNowMinor` (deposit % + delivery) — exactly the "Due now" figure the customer sees. `amountDueLaterMinor` stays on the order as an outstanding-balance flag for later admin/Phase-3 collection; the order is marked `paid` when the due-now charge verifies. |
| — | BACHS `billing_currency` | **Pin `billing_currency: order.currency`** on checkout create, so the amount the customer is asked to pay matches the quote shown in our UI. |
| — | BACHS statuses `ACCEPTED` / `OVERPAID` | **Never auto-fulfil.** Only a charge that comes back `SUCCEEDED` (or checkout `payment_status` `succeeded`/`paid`) with an exact amount + currency match marks the order paid. `ACCEPTED`/`OVERPAID` (and any mismatch) → HTTP 200 + `console.warn`, order left `pending_payment` for admin reconciliation. (200, not 4xx: docs say non-2xx disables endpoint delivery.) |
| — | BACHS verification | **Webhook signature from `BACHS_WEBHOOK_SECRET`** (per-endpoint signing secret from the Developer Portal — not the API key; verification fails closed until it's set). Dual detection: `X-Bachs-Signature-V2` (`t=…,v1=…`, accept any `v1` match, ±300s skew) with `X-Bachs-Signature` + `X-Bachs-Timestamp` as the v1 fallback. **Plus poll verify:** store `checkout_id` as `paymentCheckoutId`; the `[reference]` route polls `GET /v1/checkout-sessions/{id}` and fulfils on `payment_status === 'succeeded'` + amount/currency match (the return-page poller drives this). |
| — | Return-page cancellation | **Handle `cancel=1`** (our own `cancelUrl` sets it): show a "payment cancelled" state with a link back to the order instead of polling forever. Poll fetch now passes `?order=` so `[reference]` can find orders whose reference rotated. |

## 2026-10-19 — Product page: size + quantity row, direct checkout

| # | Question | Decision |
|---|----------|----------|
| — | Two CTAs on the product page vs DESIGN.md §7.5 "only one primary button per view" | **"Add to cart" stays the Champagne Gold Primary; "Proceed to checkout" uses the Secondary variant** (white fill, 1px hairline). No change to the design system. |
| — | What "Proceed to checkout" does | **Adds the current selection to the cart, then navigates to `/checkout`.** No size selected → the existing "Choose a size first." error (inline + toast) and no navigation. Line already at its cap → nothing is added (the cart already holds it) and we navigate only. Disabled only when the ring is sold out. |
| — | Both buttons side by side at every width? | **Side by side from `sm` (640px) up; stacked below it.** Two labels will not fit on one line at phone width (~312px), and each label would wrap inside a 9999px pill. |
| — | Mobile sticky bottom bar (DESIGN.md §8.3) | **Left unchanged** — one gold jump link to `#buy`, where both buttons now sit. |
| — | Verification tooling | **`agent-browser` installed** (`npm i -g --prefix ~/.local`, then `agent-browser install` for Chrome) with the client's approval, for click-through checks during `next dev`. Not a project dependency — nothing added to `package.json`. |

## 2026-10-19 — Payments: charge amount/currency mismatch, both gateways

| # | Question | Decision |
|---|----------|----------|
| — | Paystack amount/currency mismatch — HTTP 400 or 200? | **200 + `console.warn`, order left `pending_payment`**, matching the BACHS rule recorded 2026-10-18. Non-2xx answers are retried by Paystack and can get the endpoint disabled after repeated failures, so a genuinely short/over payment would retry forever. It must never fulfil either way, so we acknowledge and flag it for admin reconciliation. (`src/app/api/payments/webhook/route.ts`.) |
| — | The sandbox orders already charged the wrong amount (base total sent as display-currency minor units) | **Left as they are — no reconciliation or data fix.** Affects sandbox rows only; the corrected charge applies to orders created after the fix. |

## 2026-10-19 — Storefront polish: recorded pivots (retrospective)

Client pivots and plan-approved changes from the homepage, product-page and nav
rework, recorded here retroactively (the code carried them first).

| # | Question | Decision |
|---|----------|----------|
| — | Canvas texture: keep the dot lattice (2026-10-17) or something else? | **Irregular grain** — client instruction 2026-10-18: one full-canvas SVG `feTurbulence` (fractal noise) tinted warm ink at ≈5% opacity, replacing the lattice because it "read too regularly and competed with the content". Same canvas-only placement rule. DESIGN.md §4.6 amended. |
| — | Homepage hero: editorial split (2026-10-17) or constellation? | **Constellation restored** (client preference, 2026-10-19): centered tagline + supporting line + gold "Shop rings" CTA beside the pre-order text link, with up to four floating featured-ring cards around the copy (two above the headline on mobile; cards are aria-hidden decoration). Supersedes the editorial split. DESIGN.md §8.1 rewritten. |
| — | Desktop nav shape? | **Three items** (approved plan): a Categories **dropdown** (All rings + every admin category) plus "Track order" and "Pre-order"; the mobile sheet mirrors the same list. Supersedes the four-links rule of 2026-10-17. DESIGN.md §7.2 amended. |
| — | Homepage below the hero? | **One Browse band** — category chips, Budget price-range group, sticky category sidebar and a 4-column product grid with empty/error states and SectionHeader meta counts. The earlier New arrivals / pre-order highlight / category-tile bands were dropped. |
| — | Product page density? | Square (1:1) gallery with thumb rail, price + availability badge on one row, quantity stepper capped by stock, two-column specs list; 2-column product grids on phones. DESIGN.md §7.10 and §8.3 amended. |
| — | Price-range control? | **Dual-thumb slider** over the catalog's price span (range logic in base currency, readout in the active currency), used in the shop filter sidebar and the homepage Budget group. DESIGN.md §7.14 amended. |
| — | Size guide link on the product page / `/know-my-size` page? | **Deferred — not built.** ProductReq.md §22 lists "Ring size guide" as a future enhancement and DESIGN.md §7.13 only allows the link when a guide exists. Awaiting an explicit scope decision (see OPEN_QUESTIONS.md). |

## 2026-10-19 — Payments: return the customer to their own origin

| # | Question | Decision |
|---|----------|----------|
| — | Where should the customer land after paying? | **On the origin they started from (`req.nextUrl.origin`) — `http://localhost:3000` in dev, the real domain in production.** Client instruction. Paystack's `callback_url` is set to this origin directly. |
| — | But BACHS rejects localhost in `success_url` — how does BACHS return to the customer's origin? | **BACHS returns to the public `APP_URL` with `&app=<the customer's origin>` appended; `/checkout/return` then 307-redirects the browser to that origin server-side.** Verified empirically against the BACHS sandbox: `{"detail":"success_url must be a publicly accessible URL (localhost is not allowed)"}`. Paystack was verified to *accept* a localhost callback. |
| — | Why a server-side redirect rather than handling it in the return page's client component? | **Because the redirect must not depend on client hydration.** During this incident the tunnel return page rendered but its poll did not run; a server 307 is immune to that. The redirect target is accepted only when it is a valid http(s) loopback URL, preventing an open redirect. |
| — | Is the tunnel still required for BACHS in dev? | **Yes — BACHS needs a public return URL, so `APP_URL` must stay a live public origin (cloudflared quick tunnel) while testing BACHS.** The quick tunnel URL is ephemeral: if it is revoked, BACHS returns go nowhere. A stable host (real hosting) removes this fragility (OPEN_QUESTIONS #1/#21). Paystack needs no tunnel. |
| — | Verification tooling | **agent-browser is installed** (`~/.local/bin/agent-browser`) with the client's approval, used for the click-through checks. `CHECKOUT_*` — not a project dependency. |

## 2026-10-19 — Canvas pattern: one grain, on every page

| # | Question | Decision |
|---|----------|----------|
| — | What should the site's background pattern be? | **Keep the existing irregular `feTurbulence` grain, make it clearly noticeable, and apply it on every page.** Client instruction: "a pattern background, an irregular pattern … replicate it across all pages." |
| — | Which pages count as "all pages"? | **Storefront, account/auth AND the admin dashboard.** Implemented once in the root layout (`PatternBackground`), so it is by definition every page. |
| — | How strong? | **Clearly noticeable but still background.** Achieved by steepening the grain's alpha curve (`feComponentTransfer`) rather than raising opacity — measured luminance σ on a plain canvas region rose from ≈2.6 to ≈6.4 while the average tint stayed the same (no muddying of the ivory). Client chose this over "very subtle" and "quite pronounced". |
| — | Why not a `fixed` layer? | **Kept `absolute`** (the grain scrolls with the page, as the existing storefront grain did). A `fixed` layer would be cheaper to rasterise but changes the feel to a static screen texture; not asked for. |
| — | Irregular, not a grid | **The grain is fractal noise and must never read as a repeating grid** — that is exactly why the earlier regular gold lattice (2026-10-17) was rejected. Recorded in DESIGN.md §4.6. |

## 2026-10-19 — Product page: density pass (size dropdown, description, details)

| # | Question | Decision |
|---|----------|----------|
| — | Sizes: pill chips (DESIGN.md §7.13) or a dropdown? | **Native dropdown** (client instruction), 48px pill-shaped, label above, chevron on the right, unavailable options disabled and suffixed "(unavailable)". Explicitly overrides §7.13's "row of pill chips" rule, which wrapped and ate vertical space; §7.13 and §8.3 amended. |
| — | Size and quantity layout? | **Equal halves of one row** (`grid sm:grid-cols-2`), stacking to one column on phones. |
| — | Primary CTA wording for pre-orders? | **"Add to cart" for both in-stock and pre-order** (client instruction). Supersedes the earlier "Pre-order now" label; availability is conveyed by the badge and arrival line, not the button. Applied to the panel and the mobile sticky bar. |
| — | Where does the description go? | **Directly under the price**, before the buy controls, so the story reads before the size/quantity/buttons. |
| — | The Details/specifications block? | **Plain two-column definition list, no card.** The white 28px card "does not look good" (client); row padding 14px → 10px. |
| — | Overall vertical rhythm in the right column? | **16px between blocks** (`space-y-4`, down from 24px), and the purchase status line no longer reserves a blank line when it has nothing to say. |
| — | Dead `size-selector.tsx`? | **Left in place pending an explicit delete decision** (it is imported nowhere and superseded by the panel's dropdown). |

## 2026-10-19 — Headings: Playfair Display replaces Cormorant Garamond

| # | Question | Decision |
|---|----------|----------|
| — | Which font for the order page title (and headings generally)? | **Playfair Display**, swapped site-wide through the single `--font-display` token (client instruction, "choose a better font for the order title"). Cormorant Garamond was rejected because its thin, high-contrast strokes read as wispy at the sizes actually used — notably a 28px confirmation heading. Playfair Display was already named as an acceptable alternative in DESIGN.md §3.1, so this resolves open question 4 rather than introducing a new face. |
| — | Why site-wide rather than only the order title? | **Because headings are governed by one token.** Patching just the order page would have made headings visually inconsistent across storefront/admin for no benefit; the client chose the site-wide swap over an order-page-only Inter fallback. |
| — | Does the serif change affect the `₦` glyph? | **No.** All prices render in Inter (sans) — no `font-display` element contains a currency amount, so DESIGN.md §3.1's Naira-glyph rule still holds. |


## 2026-10-19 — Admin commerce: orders, payments and dashboard

| # | Question | Decision |
|---|----------|----------|
| — | Where should the missing admin commerce pages come from — ProductReq.md or the code as built? | **Build against the current system.** The PRD is behind the implementation (products, payments, currency), so the UI follows the existing models and flows rather than reintroducing older specs. |
| — | Do payments get their own `Payment` / `WebhookEvent` collections? | **No.** Payment fields stay on the `Order` (`paymentGateway`, `paymentReference`, `paymentAmountMinor`, `paymentStatus`, `paidAt`). A separate payment record can be added later if webhook auditing is required. |
| — | Where do the gateway enable/disable controls live? | **Admin → Settings**, in their own "Payment gateways" card, calling `GET/PUT /api/admin/payments/gateways`. Paystack and BACHS toggle independently. |
| — | How does an order become Paid? | **Only gateway verification** (`verifyOrderPayment`). "Paid" is never offered as a manual status transition. Verification requires the gateway amount and currency to match the order. |
| — | What happens when verification reports a different amount or currency? | **Flag it.** `paymentStatus` becomes `mismatch`, the order stays `pending_payment`, and the admin sees the flag instead of silently fulfilling. |
| — | Refund workflow? | **Manual in v1.** The admin refunds in the gateway dashboard, then marks the order Refunded (order status and payment status both `refunded`), with an optional note in the timeline. |
| — | Can an order be cancelled after shipping? | **No.** Cancellation is allowed from `pending_payment`, `paid` or `processing`; shipped/delivered orders can only be refunded. |
| — | Does cancelling or refunding return stock? | **Not yet.** Stock is decremented at fulfilment, so there is nothing to return — recorded as an open question rather than silently changing inventory. |
| — | How is "total sales" defined on the dashboard? | **Gateway-confirmed payments** (`paymentStatus: paid`) excluding cancelled and refunded orders. Deposits count as the amount actually collected. USD and NGN totals are converted per order using each order's frozen rate and rounded once at the end. |
| — | How is the sales chart bucketed? | **Daily (30 days), weekly (12 weeks), monthly (12 months)**, selected by `?range=` and rendered as a hand-built bar chart — no new chart dependency. |
| — | What counts as low stock? | **2 rings or fewer in total** across sizes for published in-stock products. The fixed threshold is listed in OPEN_QUESTIONS.md pending the client's value/setting. |


## 2026-10-20 — Admin accounts and the storefront profile menu

| # | Question | Decision |
|---|----------|----------|
| — | How is a new admin added? | **An existing admin sets the email and password** in Admin → Admins, then shares them. No invite email, so the flow does not depend on SMTP being configured. |
| — | What can additional admins do? | **Everything.** Every admin is a full admin (products, categories, delivery, orders, payments, settings, gateways and other admins). The `staff` role stays in the schema but is unused until limited access is requested. |
| — | Can admins be removed? | **Yes**, with two server-enforced guards: you cannot remove your own account, and the last remaining admin cannot be removed. |
| — | Should a signed cookie alone grant admin access? | **No.** Every admin request revalidates the session against `AdminUser`. Removing an admin logs them out immediately; a cookie for a deleted admin is cleared and treated as signed out. |
| — | What are the storefront profile menu options? | **View user account, View back office, Log out** (client instruction). "View back office" renders only for an admin session; "View user account" links to `/account`. |
| — | Does "View back office" need a customer account too? | **No.** It is shown for an admin session on its own (HMAC cookie) or when a signed-in customer's email matches an admin, matching how the header already resolves `isAdmin`. |
| — | Admin login credentials? | **`sapphirestonestech@gmail.com` / `sapphirestore`** (client instruction). The placeholder `admin@sapphire.test` row was renamed in place. The password is weak and should be changed before any real deployment. |


## 2026-10-20 — Full-width back office, analytics and rich-text editor

| # | Question | Decision |
|---|----------|----------|
| — | Should the back office stay narrow or go full width? | **Full width.** The client asked for a "sophisticated" back office; the `max-w-5xl` cap was removed and the panel is now a responsive multi-column grid with a 64px rail. |
| — | Which charting library should we use? | **None.** Charts are hand-built SVG/HTML (`src/components/admin/charts.tsx`) so no new dependency is added and every chart can carry an accessible `sr-only` data table. |
| — | How do charts stay accessible and on-brand? | **Label + icon/count on every slice and bar** (colour is never the only signal), and only design tokens are used for fills. |
| — | Where do analytics appear? | **Full dashboard** plus **compact metric strips** on Orders and Payments, per the client's instruction. |
| — | How do charts behave on small screens? | **Charts stack**, while metric cards stay dense (more per row). |
| — | Which rich-text editor? | **Our own contenteditable editor**, not CKEditor or TipTap. A third-party editor's output would be stripped by the strict server sanitizer, and the client asked to keep it dependency-free. |
| — | Which tags may formatted descriptions contain? | The existing allowlist plus **`<u>` and `<blockquote>`** (the new toolbar controls). `<script>`, event handlers, inline `style` and `javascript:` hrefs remain stripped. |
| — | Why add `connection()` to the admin layout? | The panel reads cookies and live data, so it must render at request time. `connection()` makes that explicit and removes the "unstable value `Date.now()` while prerendering" warning from the session's timestamp check. |


## 2026-10-20 — Design system replacement (flat, dark+light, finance-derived)

| # | Question | Decision |
|---|----------|----------|
| — | The pasted finance-dashboard spec contradicts Sapphire's DESIGN.md on fundamentals (radius, shadows, accent, canvas, type). How to reconcile? | **Replace the design system.** The finance spec's *structure and tokens* become the new primary system. The old gold/ivory/serif content moves to a superseded appendix. |
| — | Scope of the replacement? | **Full platform** — storefront and back office both move to the new system (phased: DESIGN.md → tokens+theme → admin → storefront). |
| — | The spec says "no brand accent; only data/status colours." Sapphire's brief says "luxurious gold." Which wins? | **Keep gold as the sole brand accent** in both themes. This is a deliberate deviation from the pasted spec, recorded in DESIGN.md §12: Sapphire keeps one accent colour (gold) for brand/primary actions; the data colours (red/orange/green/blue/yellow) are for data and status only. |
| — | Light and dark mode? | **Both.** Theme follows the OS by default; a manual toggle overrides and is remembered (localStorage + `data-theme` on `<html>`). |
| — | Radius, elevation, type family? | **10px cards, 6px controls, 999px pills; flat (no card shadows — tone separation only); Inter only** (Playfair dropped from headings). |
| — | How should DESIGN.md be rewritten? | The finance-derived system becomes the primary spec; the old gold/ivory/serif system is kept in an appendix marked **Superseded (2026-10-20)**; the change is recorded in §12/§13. |
| — | How is the migration sequenced? | **Phased, app working at every step** (client instruction). Phase A: DESIGN.md. Phase B: tokens + theme provider/toggle. Phase C: admin shell and pages. Phase D: storefront. Pause for review after each. |
| — | How do unmigrated components keep working mid-migration? | **Legacy token aliases.** Old names (`ivory-canvas`, `champagne-gold`, `font-display`, `radius-card`, …) stay in `@theme` but resolve to the new palette, so nothing breaks before its component is migrated. |
| — | Where does the theme choice live? | **`localStorage` key `sapphire_theme`**, applied to `<html data-theme>` by an inline pre-paint guard (no flash) and kept in sync by `ThemeProvider`. No key = follow the OS. |

## 2026-10-20 — Hosting: Helicarrier (smoke deployment)

Resolves AGENTS.md §4 #2 (backend/database/hosting) and OPEN_QUESTIONS.md
Phase 1/Phase 2 "Hosting".

| # | Question | Decision |
|---|----------|----------|
| 2 | Which hosting platform? | **Helicarrier** (client instruction: "deploy via the Helicarrier MCP"). Project `sapphire`, service `sapphire-store`, plan `heli-s2`, region-neutral, Next.js builder (standalone output), git-linked to `github.com/sapphirestonestech-cell/sapphire-store` branch `main`. |
| — | Which database? | **Helicarrier managed MongoDB 7** (`sapphire-db`), private-network only (no external access). `MONGODB_URI` injected into the service via a Helicarrier reference, never pasted. |
| — | Which URL? | Free subdomain for the smoke deploy: **`https://sapphire-store.on.helicarrier.xyz`** (`APP_URL` set to match). Custom domain later, once the client owns a domain. |
| — | How is the production database seeded? | **One-shot, via the Helicarrier `db_query` MCP tool** (`scripts/seed.prod-query.js` mirrors `scripts/seed.ts`). The release-command approach (`npm run seed`) cannot work on Helicarrier: the standalone runtime image has no `scripts/`, no `tsx` and no source. Re-running the query is idempotent. |
| — | When do deploys happen? | **Manually, via `deploy_service`** on the MCP for now (auto-deploy is enabled on the service but a push did not trigger one; revisit before relying on it). |

## 2026-10-20 — Mobile width pass

Client instruction: "true full width, navbar 100%, highly responsive, keep the
existing design concept — desktop unchanged."

| # | Question | Decision |
|---|----------|----------|
| — | `DESIGN.md` says `page-width` = 80% centred, flagged **[Confirm]**. AGENTS.md wants mobile-first full screen width. Which? | **Full width below `md` with a 16px gutter; `width: 80%` restored at `≥768px`.** Desktop stays exactly as before (verified 1152px = 80% of 1440). |
| — | Currency switcher vs the Tailwind-v4 `hidden`/`inline-flex` sort bug: should the switcher hide on phones? | **No — the currency switcher stays visible at all widths.** ProductReq.md requires the switcher "always reachable from the header" and AGENTS.md a "visible switch between USD and NGN at all times". Below `sm` it compacts to symbols-only (`$`/`₦`) with `sr-only` full labels for a11y. |
| — | What about the theme toggle (same sort bug, no such requirement)? | **Hidden below `sm`** via `max-sm:hidden` (Tailwind v4 emits `.hidden` before `.inline-flex`, so `hidden sm:inline-flex` never works). Reusable pattern for any future visibility toggle: use `max-*:hidden`, not `hidden sm:*`. |

## 2026-10-21 — Paystack currency fix ("Always pay in naira") and light default

Client report: Paystack checkout failed with HTTP 403 `unsupported_currency` for
USD orders, and the storefront should default to light mode.

| # | Question | Decision |
|---|----------|----------|
| — | Why does Paystack reject USD orders? | The Paystack merchant account is **NGN-only** — a USD `initialize` returns `403 unsupported_currency`. Fix must be server-side; the browser redirect cannot change this. |
| — | How do we let international (USD-displaying) shoppers still pay with Paystack? | **New admin setting "Always pay in naira."** When ON, every charge is converted to NGN at the order's **frozen** exchange rate (`order.exchangeRate`) before being sent to either gateway; orders store the currency actually charged in `paymentCurrency` and website amounts remain in the customer's display currency. When OFF, the charge currency is the display currency and **Paystack is hidden for USD** (`SUPPORTED.paystack = ['NGN']`); BACHS still accepts both. |
| — | Which currency does the admin setting store in? | The flag lives inside the existing `payment_gateways` JSON setting as `alwaysPayInNaira` (default `false` for rows written before the field existed), parsed by `parseGatewayFlags`. |
| — | How is the frozen rate preserved for converted orders? | Conversion uses `chargeAmountForOrder(order, 'NGN')`, which converts base minor units → NGN at `order.exchangeRate`. Webhook and poll verification compare the paid amount **and** currency against `paymentCurrency` (via `chargeMatches`), so a converted order is only fulfilled when the gateway is charged exactly the naira figure we sent. |
| — | Why do admin revenue figures change? | `paymentAmountMinor` is now in `paymentCurrency`, not `currency`, so dashboard/summary revenue math reads the source currency from `paymentCurrency ?? currency` (falling back to `baseCurrency` for rows with no payment). Without this a USD order charged in naira would be double-converted. |
| — | Default theme? | **Light, always** (client instruction). The storefront no longer follows the OS `prefers-color-scheme`; `resolve()` returns `choice ?? 'light'`, the OS-follow effect and the CSS `@media (prefers-color-scheme: dark)` block are removed. Dark applies only from an explicit saved choice. |


## 2026-10-29 — Payment test/live modes and admin data scope

Client approval: "ok", "let us move". Resolves how sandbox and live payments
coexist without keeping gateway keys in the database.

| # | Question | Decision |
|---|----------|----------|
| — | Where do the test and live keys live? | **Server environment only.** The admin UI switches mode and per-gateway settings; it never accepts or displays a key. |
| — | Env var names? | `PAYSTACK_TEST_SECRET_KEY`, `PAYSTACK_LIVE_SECRET_KEY`, `BACHS_TEST_SECRET_KEY`, `BACHS_LIVE_SECRET_KEY`. The unused `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is no longer read. **Migration exception (2026-10-29):** because Helicarrier masks existing values, live mode falls back to the legacy `PAYSTACK_SECRET_KEY` / `BACHS_SECRET_KEY` until explicit `*_LIVE_SECRET_KEY` values are set; test mode never uses them. |
| — | How is a key matched to a mode? | Prefix check: Paystack `sk_test_` / `sk_live_`; BACHS `sk_sandbox_` / `sk_live_`. A wrong-prefix key is treated as missing so a live key can never hit the sandbox (or the reverse). |
| — | What happens when the selected mode has no key? | That mode is **disabled with a reason** in Settings → Payment gateways; the gateway row stays visible. The API refuses to enable a gateway for a keyless mode. At checkout the gateway is hidden with a neutral "temporarily unavailable" note. |
| — | Where is the mode fixed for an order? | **At initialize**, stored as `Order.paymentMode` (`test` \| `live`). Later mode switches do not affect pending orders or their webhooks. Existing orders have no value and are treated as live. |
| — | BACHS base URL? | Follows the selected mode (`sandbox-api.bachs.io` for test, `api.bachs.io` for live), not `NODE_ENV`. |
| — | BACHS webhook secret? | One `BACHS_WEBHOOK_SECRET` for both modes (client decision). |
| — | What do test payments do? | They are fulfilled and tagged, but **skip stock decrement and the customer confirmation email**. |
| — | How does the back office separate test data? | A cookie-backed **Live/Test data toggle** in the admin layout, independent of gateway mode. It scopes dashboard stats/recent orders, Orders list/detail, Payments list/detail and their metric strips and CSV export. Products, categories, delivery, settings and admins are unaffected. Test rows carry a "Test" badge and the layout shows a "Test data" chip. |
| — | Deployment note? | Production currently has the old key names only. Add the four new variables on Helicarrier **before** deploying this change or both gateways become unavailable. |
