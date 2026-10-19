# OPEN_QUESTIONS.md

Unanswered questions and what each one blocks. Move answered items to `DECISIONS.md` with the date.

---

## Block Phase 1 (Foundation: design, catalog, auth, browsing)

| # | Question | Blocks |
|---|----------|--------|
| 1 | **Hosting:** Vercel + MongoDB Atlas, a VPS/container, or something else? | Deployment of Phase 1; environment variables and CI. (Local dev is unaffected.) |

Resolved since first drafted (see DECISIONS.md): admin auth approach (#2), seed
content (#3), tagline wording (#4) and placeholder wordmark (#5) were answered in
the Phase 1 plan approval. Nothing else blocks Phase 1.

## Block Phase 2 (Commerce)

| # | Question | Blocks |
|---|----------|--------|
| 1 | **Hosting** still undecided (carried from Phase 1). | Deployment; environment variables (`MONGODB_URI`, Cloudinary, gateway keys) and CI. |
| 6 | **BACHS gateway:** documentation link, supported currencies, fees, integration method, sandbox/live credentials? | BACHS payment integration (ProductReq.md §23.1, risk §19). |
| 7 | **Paystack:** account and API keys (test and live)? | Paystack integration. |
| 13 | **IP geolocation provider** for default-currency detection (§7.3). | Default currency on first visit (USD until the visitor switches). |
| 14 | **Email provider** for transactional emails (§11.2). | **Resolved 2026-10-18:** **Gmail SMTP** via nodemailer (App Password; client picked it for the free tier). Remaining: client to enable 2-Step Verification on the sending Google account and create an App Password, then set `GMAIL_USER`/`GMAIL_APP_PASSWORD`. Order/shipping/pre-order email templates themselves are still Phase 3 work. |

Resolved since Phase 2 planning (see DECISIONS.md): base currency USD (#8),
per-product pre-order payment full/deposit (#9), per-shipment delivery fees
(#11), guest checkout only (#12 — superseded 2026-10-18 by optional customer
accounts), and deferring the payment gateways.

## Block Phase 3–4

| # | Question | Blocks |
|---|----------|--------|
| 15 | **Returns, refunds and pre-order cancellation policy** (§23.6, §23.10). | Policy pages, refund workflow, UAT. |
| 16 | **Sizing:** multiple sizes with separate stock counts, or one size per listing? (§23.9) | Data model detail, size selector, stock logic. |
| 17 | **Brand name, logo, gold hex, typefaces, image ratio, status colors, sparkle motif, gateway logos, photography, dark mode** — the ten items in DESIGN.md §13. | Final visual sign-off before launch. |
| 18 | **Google OAuth credentials** — client must create the OAuth client ID in Google Cloud Console (guide given 2026-10-18) and add `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` to `.env.local`. | Google sign-in going live. Email/password auth works without it; the button stays hidden until keys exist. |
| 19 | **Size guide scope** — ProductReq.md §22 lists "Ring size guide" as a *future enhancement*, and DESIGN.md §7.13 only permits a Size guide link when a guide exists. Do we build the `/know-my-size` page + product-page link now, or defer? | The Size guide link on the product page and the `/know-my-size` page (both planned, currently held). |
| 20 | **Admin gateway toggle UI** — the decision (DECISIONS 2026-10-18) is independent per-gateway enable/disable, and `GET/PUT /api/admin/payments/gateways` now works (JSON-string storage), but **no admin page calls it**: gateways are enabled by default in code with no UI to flip them. | Admin actually turning a gateway off before launch. Needs confirmation that building the admin UI is in scope now. |
| 21 | **BACHS webhook endpoint** — `BACHS_WEBHOOK_SECRET` is empty in `.env.local` and no endpoint is registered with BACHS (and the local tunnel URL is ephemeral), so no webhook ever reaches the app; fulfilment currently rides on the return-page poller. | Production webhook delivery. Client must create the endpoint in the BACHS Developer Portal once the public URL exists (hosting still undecided, #1) and paste the signing secret. |

## Non-blocking (noted for later)

- **BACHS dev return needs a live public URL.** BACHS rejects localhost in
  `success_url`, so local BACHS testing requires `APP_URL` to be a live public
  origin (currently a cloudflared **quick tunnel**). The quick-tunnel URL is
  **ephemeral**: when it is revoked or the process restarts, update `APP_URL` in
  `.env.local` and restart `npm run dev`, or BACHS returns will dead-end.
  Paystack does not need the tunnel (it returns straight to localhost). A stable
  host (see #1) removes this fragility.

- **Storefront caching:** DB-reading storefront routes render at request time
  (`await connection()`), so no page is statically cached. Decide whether to move
  catalog reads to `"use cache"` + `revalidateTag` (invalidated from admin
  writes) for speed — a freshness-vs-performance trade-off.
- **Unused file:** `src/components/storefront/size-selector.tsx` is no longer
  imported (`PurchasePanel` replaced it). Confirm it can be deleted, or keep it.
- **Dummy seed data:** the delivery locations + fees in `scripts/seed.ts` (Lagos,
  Abuja, Port Harcourt, Accra, London, New York City) are placeholders and must
  be replaced with the client's real locations and fees before launch.
- **Placeholder product images:** seed rings point at self-drawn SVGs in
  `public/seed/rings` (generated by `npm run images`). These are dev-only and
  must be replaced with the client's real photography. Where production uploads
  are stored/served (Cloudinary is configured in `.env.local` but no upload flow
  is built) is still open — AGENTS.md §4.3.
- **Seed data verified live** (local MongoDB): `npm run seed`, the storefront
  APIs, delivery estimates, free-delivery, deposit split and order placement were
  run against a live database on 2026-10-17. Admin CRUD is still only
  type/build-checked, not exercised through the UI.
- Analytics/error-monitoring tool choice (ProductReq.md §13.2).
- Lint/format conventions beyond the ESLint defaults (AGENTS.md §9).
- Commit message style and branching workflow (AGENTS.md §9).
- Who signs off at the end of each phase (AGENTS.md §4.18).
