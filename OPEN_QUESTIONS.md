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
| 6 | **BACHS gateway:** documentation link, supported currencies, fees, integration method, sandbox/live credentials? | BACHS payment integration (ProductReq.md §23.1, risk §19). |
| 7 | **Paystack:** account and API keys (test and live)? | Paystack integration. |
| 8 | **Base currency:** do you enter prices in NGN or USD? | Pricing forms, rounding rules, fee entry (ProductReq.md §23.4). |
| 9 | **Pre-order payment:** paid in full (assumed) or deposit? | Checkout logic (ProductReq.md §23.2). |
| 10 | **Delivery coverage:** Nigeria only or international at launch? Which locations and fees load first? | Seed delivery locations (ProductReq.md §23.3). |
| 11 | **Delivery fee model:** per shipment (assumed) or per item? Free-delivery threshold? | Cart/checkout fee maths (§9.4). |
| 12 | **Guest checkout vs required account** (ProductReq.md §23.7). | Checkout flow. |
| 13 | **IP geolocation provider** for default-currency detection (§7.3). | Default currency behaviour. |
| 14 | **Email provider** for transactional emails (§11.2). | Confirmation, shipping and pre-order emails. |

## Block Phase 3–4

| # | Question | Blocks |
|---|----------|--------|
| 15 | **Returns, refunds and pre-order cancellation policy** (§23.6, §23.10). | Policy pages, refund workflow, UAT. |
| 16 | **Sizing:** multiple sizes with separate stock counts, or one size per listing? (§23.9) | Data model detail, size selector, stock logic. |
| 17 | **Brand name, logo, gold hex, typefaces, image ratio, status colors, sparkle motif, gateway logos, photography, dark mode** — the ten items in DESIGN.md §13. | Final visual sign-off before launch. |

## Non-blocking (noted for later)

- Analytics/error-monitoring tool choice (ProductReq.md §13.2).
- Lint/format conventions beyond the ESLint defaults (AGENTS.md §9).
- Commit message style and branching workflow (AGENTS.md §9).
- Who signs off at the end of each phase (AGENTS.md §4.18).
