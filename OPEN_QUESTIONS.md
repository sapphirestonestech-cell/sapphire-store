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
| 14 | **Email provider** for transactional emails (§11.2). | Order confirmation, shipping and pre-order emails (not yet sent). |

Resolved since Phase 2 planning (see DECISIONS.md): base currency USD (#8),
per-product pre-order payment full/deposit (#9), per-shipment delivery fees
(#11), guest checkout only (#12), and deferring the payment gateways.

## Block Phase 3–4

| # | Question | Blocks |
|---|----------|--------|
| 15 | **Returns, refunds and pre-order cancellation policy** (§23.6, §23.10). | Policy pages, refund workflow, UAT. |
| 16 | **Sizing:** multiple sizes with separate stock counts, or one size per listing? (§23.9) | Data model detail, size selector, stock logic. |
| 17 | **Brand name, logo, gold hex, typefaces, image ratio, status colors, sparkle motif, gateway logos, photography, dark mode** — the ten items in DESIGN.md §13. | Final visual sign-off before launch. |

## Non-blocking (noted for later)

- **Storefront caching:** DB-reading storefront routes render at request time
  (`await connection()`), so no page is statically cached. Decide whether to move
  catalog reads to `"use cache"` + `revalidateTag` (invalidated from admin
  writes) for speed — a freshness-vs-performance trade-off.
- **Unused file:** `src/components/storefront/size-selector.tsx` is no longer
  imported (`PurchasePanel` replaced it). Confirm it can be deleted, or keep it.
- **Dummy seed data:** the delivery locations + fees in `scripts/seed.ts` (Lagos,
  Abuja, Port Harcourt, Accra, London, New York City) are placeholders and must
  be replaced with the client's real locations and fees before launch.
- **End-to-end verification pending:** no `MONGODB_URI` in this environment, so
  seed, admin CRUD and cart → checkout → order record were type/build-checked but
  never run against a live database.
- Analytics/error-monitoring tool choice (ProductReq.md §13.2).
- Lint/format conventions beyond the ESLint defaults (AGENTS.md §9).
- Commit message style and branching workflow (AGENTS.md §9).
- Who signs off at the end of each phase (AGENTS.md §4.18).
