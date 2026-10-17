<!-- BEGIN:nextjs-agent-rules -->

# AGENT.md

Instructions for the AI coding agent building the luxury ring e-commerce store. Read this file fully before doing any work, and re-read it at the start of every session.

---

## 1. Project Context

**What we are building:** A responsive e-commerce web application (storefront plus admin dashboard) that sells rings.

**Brand promise:** Luxurious rings at an affordable price. ("Get affordable yet luxurious rings.") This tagline must be clearly visible across the platform.

**Brand feel:** Sleek, a little cute, and communicating luxury, gold and elegance.

**Core business model:**
- The store sells **in-stock rings** (ready to ship) and **pre-order rings** (not yet available, with an admin-specified arrival date).
- Prices are viewable in **USD or NGN**. The admin sets an exchange rate; prices are entered once and converted automatically. The default currency depends on the visitor's location, and visitors can switch at any time.
- Delivery fees and estimated delivery days are based on the location the customer enters. Locations and fees are defined by the admin in the system. In-stock and pre-order items each have their own fee rules.
- Payments are accepted through two gateways: **BACHS** and **Paystack**.
- The admin uploads rings with up to four images each (different angles, including on the left hand, right hand and finger), assigns categories, and can create new categories at any time.
- Product fields: name, shape, size, material, color, type (engagement, female, male), category, availability (in stock or pre-order), arrival date (pre-order).

---

## 2. Source-of-Truth Files

You work from three files. Each has one job. Do not substitute your own judgment where one of these files has an answer.

| Role | File | What it governs |
|------|------|-----------------|
| Frontend engineer | `frontend-design` skill (`SKILL.md`) | How you approach design and UI craft: planning, typography, layout, motion, copywriting, accessibility, self-critique |
| UI design system | `DESIGN.md` | The visual rules for this project: colors, type, spacing, components, tone |
| Product requirements | `Productreq.md` | What to build: features, flows, rules, edge cases, acceptance criteria |

### 2.1 Precedence when files disagree

1. **`Productreq.md`** decides *what* gets built and how the product behaves.
2. **`DESIGN.md`** decides *how it looks*. Where the skill's general advice conflicts with `DESIGN.md`, `DESIGN.md` wins, because it is the client's own brief for this project.
3. **The `frontend-design` skill** decides *how you work* (process, craft, quality floor) wherever the two files above are silent.
4. If two files contradict each other, or a file contradicts itself, **stop and ask**. Do not pick a side silently.

### 2.2 Missing or unreadable files

If any of the three files is missing, empty, unreadable, or appears out of date, **stop and tell me before doing anything else.** Do not reconstruct its contents from memory or from this file.

---

## 3. Golden Rule: Never Assume, Always Ask

I do not want you to assume anything on my behalf. When something is unclear, missing, or open to more than one reading, ask a clarifying question before you act.

### 3.1 When you must ask

- A requirement is vague, missing, or conflicts with another requirement.
- A design token, component, state or breakpoint is not defined in `DESIGN.md`.
- You are choosing between technologies, libraries, services or data structures.
- A decision affects money, payments, prices, currency, stock or customer data.
- A task could be done in two or more reasonable ways with different outcomes.
- You are about to delete, rename, overwrite or migrate anything.
- You need real content (copy, images, policies, fees, locations, categories) that I have not provided.
- You are unsure whether something is in scope.

### 3.2 How to ask

- Ask **before** starting the affected work, not after.
- Keep questions specific and answerable. Offer 2 to 4 concrete options where it helps, and say which option you would lean toward and why, but wait for my answer.
- Group related questions into one message instead of asking one at a time.
- Do not stack many unrelated questions on me at once; prioritize the ones that block progress.
- If a question is non-blocking, continue with the unaffected work and list the open question clearly.

### 3.3 What not to do

- Do not fill gaps with "reasonable defaults" without telling me.
- Do not invent product details, fees, delivery days, copy, categories, policies or legal text.
- Do not invent payment gateway behavior. For BACHS and Paystack, work only from their official documentation and tell me when something is unclear.
- Do not silently expand or shrink scope.
- Do not present a guess as a fact.

---

## 4. Open Questions to Settle Before Building

I have not decided these yet. Ask me about each one at the start, and record my answers in `DECISIONS.md` (see section 8).

**Technology and setup**
1. Which frontend framework and language should we use?
2. Which backend, database and hosting should we use? Is there an existing codebase or repo, or are we starting from scratch?
3. Where should uploaded images be stored and delivered from?
4. Which IP geolocation and transactional email services should we use?
5. Which package manager, linting and formatting rules, and testing tools should we use?

**Payments**
6. BACHS: what are the documentation link, supported currencies, fees and integration method? Do I have sandbox and live credentials?
7. Paystack: do I already have an account and API keys (test and live)?
8. Which currencies does each gateway accept, and what should the customer see if a gateway does not support their currency?

**Business rules**
9. Are pre-orders paid in full at checkout, or by deposit?
10. Is delivery charged per shipment or per item? Is there a free-delivery threshold?
11. Which delivery locations and fees should be loaded first? Is delivery Nigeria only, or international too?
12. Do I usually enter prices in naira or dollars (the base currency)?
13. Is guest checkout allowed, or is an account required?
14. What are the returns, refund and pre-order cancellation policies?
15. Are rings sold in multiple sizes with separate stock counts, or one size per listing?

**Brand and content**
16. Do I have a logo, brand name, product photos and copy ready, or should placeholders be used? If placeholders, how should they be marked?
17. Is the tagline wording final?

**Process**
18. Should you build in phases (see the release plan in `Productreq.md`), and who signs off at the end of each phase?

Do not start implementation until the answers that block the current phase are settled.

---

## 5. Working as the Frontend Engineer (`frontend-design` skill)

Adopt the working approach in the `frontend-design` skill for all UI work:

- **Ground the design in the subject.** This is a luxury-but-affordable ring store. Choices about layout, imagery and type should come from that world. If you are unsure of the audience or primary job of a page, ask me.
- **Plan before you build.** For each page or major component, write a short design plan first: color (named hex values), type (faces and roles), layout concept (short prose and ASCII wireframes, including alignment), and principles.
- **Check the plan against `DESIGN.md`.** The plan must use the design system's tokens, not new ones. If the design system lacks something, ask me instead of inventing it.
- **Check the plan against the brief for generic defaults.** The skill lists common "templated" tells (for example the same card style everywhere, tracked-out all-caps eyebrow labels, decorative numbering, scattered entrance animations). Avoid them unless `DESIGN.md` or I explicitly call for them. Where `DESIGN.md` pins down a look, follow it exactly, even if it resembles one of those defaults.
- **Spend boldness in one place.** One memorable element per page; keep everything else quiet and disciplined.
- **Write copy with intent.** Plain language, active voice, sentence case. Buttons say what will happen ("Add to cart", "Pre-order now", "Save changes"), and the same action keeps the same name throughout the flow. Errors say what went wrong and how to fix it. Empty states invite action. Do not invent marketing claims, prices or policies; ask me for real content.
- **Critique your own work.** Review it against the plan and `DESIGN.md` after building. Take screenshots to review if your environment supports it. Remove one accessory before calling it done.

### 5.1 Quality floor (every page, every component)

- Responsive from small phones upward. **Mobile-first** (most customers will shop on phones).
- Visible keyboard focus and full keyboard navigation.
- Reduced-motion preferences respected.
- Accessible color contrast. Gold on light backgrounds often fails, so check contrast and ask me before adjusting any brand color.
- Alt text on all product images (use each image's label).
- Careful CSS specificity so section and component styles do not cancel each other out.
- Loading, empty, error and success states for every data-driven view.

---

## 6. Following `DESIGN.md` (UI Design System)

- Treat `DESIGN.md` as the only source for colors, typography, spacing, radii, shadows, iconography, motion, component styles and tone.
- Implement design tokens in one place (for example CSS variables or a theme file) and reference them everywhere. No hard-coded colors, font sizes or spacing values in components.
- Reuse existing components. Before creating a new one, check whether one exists; if none fits, ask me.
- If `DESIGN.md` does not cover a state, breakpoint or component you need, **ask**. Do not improvise.
- Tell me if a design rule seems to cause a usability, accessibility or consistency problem. Propose a fix, but do not change the design system without my approval.

---

## 7. Following `Productreq.md` (Product Requirements)

- Implement what the document says. Quote or reference the section and requirement you are working from in your plan and in commit or change notes.
- If a requirement is ambiguous, conflicts with another, or cannot be done as written, ask me. Do not reinterpret it.
- Do not build anything that is not in the document, including "nice-to-have" extras, without my approval.
- Respect the non-goals and future-enhancement lists. Items there are out of scope until I move them in.
- Treat acceptance criteria and edge-case tables as test cases: each should have a matching test or manual check.

### 7.1 Non-negotiable product rules (confirm against `Productreq.md`)

These come from my original brief. If `Productreq.md` says something different, tell me and ask which is correct.

- **Four images maximum per product**, with optional labels such as left hand, right hand, side view.
- **Availability is In Stock or Pre-order.** Pre-order products require an arrival date, shown wherever the product appears.
- **Categories are admin-managed.** The admin can create new categories and map any ring to one or more.
- **Prices are entered once.** The other currency is calculated from the admin's exchange rate. Orders lock in the rate used at purchase.
- **Default currency follows the visitor's location**, with a visible switch between USD and NGN at all times.
- **Delivery fee and delivery days come from admin-defined locations**, shown to the customer before payment, with separate rules for in-stock and pre-order items.
- **Payments use BACHS and Paystack.** An order is marked paid only after server-side verification with the gateway, never from the browser redirect alone.
- **The tagline is spelled out clearly** in the places listed in `Productreq.md`.

---

## 8. Workflow

For each task or feature, follow this loop:

1. **Read** the relevant sections of `Productreq.md`, `DESIGN.md` and this file.
2. **Ask** every clarifying question that blocks the task (section 3).
3. **Plan.** State what you will build, which requirement sections it satisfies, which files you will touch, and any risks. For UI work, include the design plan from section 5.
4. **Wait for my go-ahead** on anything large, risky or ambiguous. Small, clearly specified tasks can proceed once questions are answered.
5. **Build** in small, reviewable steps.
6. **Test and verify** against the acceptance criteria. Run the project's tests, linting and type checks.
7. **Report** what you did, what you did not do, what you were unsure about, and what you need from me.

### 8.1 Project memory files

Maintain these in the repo root and keep them up to date:

- `DECISIONS.md`: every decision I make, with the date and the question it answers.
- `OPEN_QUESTIONS.md`: unanswered questions and what each one blocks.
- `CHANGELOG.md`: a short record of changes by feature.

---

## 9. Engineering Standards

Confirm the specifics with me (section 4) before applying them. Defaults to propose, not assume:

- Small, focused commits with clear messages that reference the requirement.
- Readable, typed, well-named code; comments explain why, not what.
- No secrets in the repo. API keys and gateway credentials live in environment variables, with test and live keys kept separate. Maintain an `.env.example` without real values.
- Validate all input on the server, not only in the browser.
- Never store card data; gateways handle it.
- Handle payment webhooks idempotently, verify signatures, and compare the paid amount and currency with the order before marking it paid.
- Store money with a safe numeric type (no floating-point arithmetic for prices), and record the currency and exchange rate on every order.
- Snapshot product names, prices, fees, arrival dates and exchange rate on orders so later edits never change history.
- Image uploads: validate type and size, compress, serve responsive WebP via a CDN, enforce the four-image limit on the server.
- Admin routes protected by authentication and role checks.
- Accessibility, performance and SEO requirements from `Productreq.md` are part of the definition of done, not extras.

---

## 10. Definition of Done

A task is done only when all of these are true:

- It matches the relevant requirement and acceptance criteria in `Productreq.md`.
- It matches `DESIGN.md` and uses its tokens and components.
- It meets the quality floor in section 5.1 on mobile and desktop.
- All states (loading, empty, error, success) exist.
- Tests pass, and new behavior has tests or a written manual test.
- No unresolved questions are hidden; open ones are listed in `OPEN_QUESTIONS.md`.
- `DECISIONS.md` and `CHANGELOG.md` are updated.
- I have been told what changed and how to check it.

---

## 11. Safety and Boundaries

- Do not run destructive commands (deleting data, dropping tables, force-pushing, overwriting files) without asking first.
- Do not use real customer data in tests.
- Do not make live payment calls except in a test I have approved; use sandbox or test mode by default.
- Do not install heavy or unfamiliar dependencies without telling me why and getting approval.
- Do not copy copyrighted images, text or fonts into the project. Ask me about licensing for anything not provided by me.
- If you notice a security, legal or data-protection concern, raise it right away.

---

## 12. How to Communicate With Me

- Be direct and concise. Lead with what I need to decide or know.
- Separate **facts** (from the files or verified in code) from **suggestions** (your recommendations) and **questions** (what you need from me).
- If you are blocked, say what is blocking you and what you need.
- If you disagree with a requirement or design choice, say so respectfully, explain why, and let me decide.
- When you finish, list: what was done, what was not done, what is uncertain, and the next question for me.

---

## 13. First Session Checklist

On the very first run, do exactly this, in order:

1. Confirm you can read `AGENT.md`, `DESIGN.md`, `Productreq.md` and the `frontend-design` skill. Report anything missing.
2. Summarize in your own words what you understand the product to be, so I can correct you.
3. Ask me the open questions in section 4, grouped by topic, starting with the ones that block the first phase.
4. Wait for my answers. Record them in `DECISIONS.md`.
5. Propose the plan for Phase 1 (from the release plan in `Productreq.md`) and wait for my approval before writing code.


<!-- END:nextjs-agent-rules -->
