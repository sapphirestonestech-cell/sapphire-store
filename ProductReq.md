# Luxury Ring E-commerce Store: Product Requirements Document

**Version:** 1.1 (expanded)
**Status:** Draft for review
**Product type:** Responsive web application (storefront + admin dashboard)
**Payment gateways:** BACHS and Paystack
**Currencies:** USD and NGN

---

## Table of Contents

1. Overview
2. Users, Personas and Roles
3. Brand and Design Requirements
4. Information Architecture and Site Map
5. Functional Requirements: Storefront
6. Functional Requirements: Admin Dashboard
7. Pricing, Currency and Exchange Rate Logic
8. Availability and Pre-order Logic
9. Delivery and Shipping Fee Logic
10. Payments (BACHS and Paystack)
11. Orders, Fulfilment and Notifications
12. Data Model
13. API and Integration Overview
14. Non-functional Requirements
15. Analytics and Reporting
16. User Stories and Acceptance Criteria
17. Edge Cases and Error Handling
18. Testing and QA Plan
19. Risks and Mitigations
20. Release Plan
21. Success Metrics
22. Future Enhancements
23. Open Questions
24. Glossary

---

## 1. Overview

### 1.1 Product Summary

This product is an e-commerce web application for a ring business. It lets the store owner showcase and sell rings in two modes: **in-stock rings**, which ship right away, and **pre-order rings**, which are not yet in hand but have a confirmed arrival date. Customers browse a sleek, gold-toned storefront, view prices in US dollars or Nigerian naira, enter their location to see delivery cost and timing, and pay securely through **BACHS** or **Paystack**.

The store owner (admin) manages the entire business from a dashboard: uploading rings with up to four photos each, creating categories, setting the exchange rate once and letting the platform convert every price, defining delivery locations with fees and delivery times, and tracking orders from payment to delivery.

### 1.2 Brand Promise and Tagline

> **Luxurious rings at an affordable price.**
> (Positioning line: "Get affordable yet luxurious rings.")

This promise must be spelled out clearly and repeatedly throughout the platform, not hidden in the footer. Required placements:

- Homepage hero headline or sub-headline
- A slim announcement bar at the top of every page
- Product listing page header
- Checkout page (reassurance line near the order summary)
- Order confirmation page and all transactional emails
- Page `<title>` and meta description on the homepage

### 1.3 Problem Statement

Shoppers want jewelry that looks and feels luxurious but are often priced out by traditional luxury brands. At the same time, a growing ring business needs to:

- Present products in a way that signals quality and elegance.
- Sell stock on hand and items still in transit from the same catalog.
- Serve both local (Nigerian) and international customers with prices they understand.
- Collect payments through trusted local and international gateways.
- Charge accurate delivery fees that depend on where the customer is, and set honest delivery expectations.
- Avoid manual work such as entering each price twice or recalculating prices whenever the exchange rate moves.

### 1.4 Goals

| # | Goal | How we will know |
|---|------|------------------|
| G1 | Communicate luxury, gold and elegance at an approachable price point | Visual design review; user feedback; time on site |
| G2 | Let the admin publish a new ring quickly | Add-product flow completed in under 3 minutes |
| G3 | Sell in-stock and pre-order rings side by side | Both product types purchasable end to end |
| G4 | Show prices in USD or NGN with automatic conversion | Zero manual double price entry; currency switch works everywhere |
| G5 | Accept payments reliably through two gateways | Payment success rate; no unverified Paid orders |
| G6 | Show delivery fee and delivery days before checkout | Fee shown on product page, cart and checkout |

### 1.5 Non-goals (Version 1)

- Multi-vendor marketplace (one store, one owner).
- Native iOS or Android apps (the site will be fully responsive).
- Currencies beyond USD and NGN.
- Reviews and ratings, loyalty points, gift cards, subscription products.
- Automated courier integration or live shipping-rate APIs (fees are admin-defined).

### 1.6 Assumptions

- A single admin (store owner) at launch; staff accounts may follow.
- The store ships to locations the admin defines; anywhere else is "not yet deliverable".
- Pre-order items are paid in full at checkout (to be confirmed, see Open Questions).
- Each ring is sold as a single SKU with optional size variants.
- Product prices are entered once in a single base currency chosen by the admin.

---

## 2. Users, Personas and Roles

### 2.1 Personas

**Persona 1: Ada, the gift buyer (customer, local)**
Based in Lagos, shops on her phone, buys an engagement ring or gift for a partner. Wants to see naira prices, trusts Paystack, and needs to know the ring will arrive before a specific date. Cares about photos on a hand to judge scale.

**Persona 2: Daniel, the diaspora buyer (customer, international)**
Lives abroad, sends gifts to family in Nigeria or ships to himself. Wants USD prices, needs delivery fee and timeline for the destination, and wants a payment method that works with international cards.

**Persona 3: Tolu, the pre-order shopper (customer)**
Spots a ring that is not yet in stock. Wants a clear arrival date, a clear shipping fee for her location, and confidence that paying now is safe.

**Persona 4: The store owner (admin)**
Runs the business, often from a laptop or phone. Uploads new rings as they arrive, adjusts the exchange rate, adds new categories, sets delivery fees, and needs a clear picture of orders and money coming in. Wants to do all this without a developer.

### 2.2 Roles and Permissions

| Role | Capabilities |
|------|--------------|
| **Guest customer** | Browse, filter, switch currency, check delivery fee, add to cart, check out as guest |
| **Registered customer** | Everything a guest can do, plus order history, saved addresses, order tracking |
| **Admin** | Full access: products, categories, exchange rate, delivery locations, orders, payments, settings, users |
| **Staff (optional, later)** | Limited admin access, for example manage orders but not settings or exchange rate |

---

## 3. Brand and Design Requirements

### 3.1 Look and Feel

The site should feel **luxurious, elegant, sleek and a little cute**. Think soft glow, delicate details and a premium feel without looking cold or intimidating.

### 3.2 Color Palette

| Role | Suggested color | Notes |
|------|-----------------|-------|
| Primary accent | Warm champagne gold (for example `#C9A24B`) | Buttons, highlights, icons, thin dividers |
| Background | Ivory or soft white (`#FBF8F3`) | Main page background |
| Text | Deep charcoal (`#222222`) | Ensure strong contrast |
| Secondary accent | Soft blush (`#F3DDD7`) | Cute touches, badges, hover states |
| Pre-order badge | Muted rose gold | Distinguishable from In Stock |
| In Stock badge | Soft green or gold outline | Calm, not alarming |

Gold on white can fail contrast rules. Use gold for decoration and large text, and use charcoal for body text and small labels.

### 3.3 Typography

- **Headings:** elegant serif (for example Playfair Display or Cormorant).
- **Body and UI:** clean sans-serif (for example Inter or Poppins).
- Generous line height and letter spacing in headings for a refined look.

### 3.4 Imagery and Layout

- Large, high-resolution ring photos as the visual hero of every page.
- Plenty of white space; cards with rounded corners and soft shadows.
- Thin gold line accents, small sparkle or diamond icons used sparingly for the "cute" element.
- Images shown at a consistent aspect ratio (for example 4:5) to keep grids tidy.
- Hover on desktop reveals the second image; swipe gallery on mobile.

### 3.5 Motion

- Gentle fade and slide transitions, subtle hover zoom on product images.
- Skeleton loaders instead of spinners where possible.
- No animation that delays interaction or hurts performance. Respect "reduce motion" system settings.

### 3.6 Responsive Behavior

Mobile-first. Most customers are expected on phones, so:

- Sticky bottom bar on product pages with price and Add to Cart.
- Thumb-friendly buttons (minimum 44px tap target).
- Filters open as a slide-up drawer on mobile.
- Currency switcher always reachable from the header.

### 3.7 Tone of Voice

Warm, polished and reassuring. Short sentences. Avoid jargon. Examples: "Pre-order: arriving 12 December", "Delivery to Lekki: ₦3,500, 2 to 3 days".

---

## 4. Information Architecture and Site Map

### 4.1 Storefront Pages

- Home
- Shop (all rings) with filters
- Category page (one per category)
- Pre-order collection page
- Product detail page
- Search results
- Cart
- Checkout (contact, delivery, payment)
- Order confirmation
- Order tracking
- Customer account: sign in, sign up, order history, saved addresses
- Static pages: About, Contact, Shipping and Delivery, Pre-order Policy, Returns and Refunds, Privacy Policy, Terms of Service, FAQ

### 4.2 Admin Pages

- Login
- Dashboard
- Products: list, add, edit
- Categories: list, add, edit, bulk assign
- Orders: list, detail
- Payments: list, detail
- Delivery locations: list, add, edit, import
- Settings: exchange rate, currency and rounding, store info, payment gateways, email templates
- Admin users and roles (later)

### 4.3 Primary Navigation (Storefront)

Logo | Shop | Engagement | Female | Male | Pre-order | New Arrivals | Search | Currency (USD or NGN) | Account | Cart

Category links are generated from the categories the admin creates.

---

## 5. Functional Requirements: Storefront

### 5.1 Homepage

- **Announcement bar** with the tagline and optional promo message (admin-editable).
- **Hero** with headline, sub-headline, hero image and a "Shop the collection" button.
- **Featured rings:** admin can mark products as Featured.
- **New arrivals** row, sorted by publish date.
- **Pre-order highlight:** a dedicated strip showing upcoming rings with arrival dates.
- **Category tiles** pulled from active categories.
- **Why us** strip: affordable luxury, secure payment, fast delivery, pre-order available.
- **Footer** with links, social handles, contact, and payment method badges.

### 5.2 Product Listing Page

**Product card contents**
- Cover image (second image on hover for desktop)
- Name
- Price in the active currency
- Availability badge: "In Stock" or "Pre-order · arrives 12 Dec"
- Optional badges: New, Featured, Sold Out

**Filters**
- Category
- Type: engagement, female, male
- Material
- Color
- Shape
- Size
- Availability: In Stock, Pre-order
- Price range (applies to the active currency)

**Sorting:** newest, price low to high, price high to low, name A to Z.

**Other behavior**
- Pagination or "Load more" (default 24 items per load).
- Filter state stored in the URL so pages can be shared and the back button works.
- Empty-state message with a suggestion to clear filters.

### 5.3 Product Detail Page

**Gallery**
- Up to four images per ring, for example front, side, left hand, right hand.
- Thumbnails below or beside the main image; swipe on mobile; click or pinch to zoom.
- Image labels shown as captions (for example "Worn on right hand").

**Core information**
- Name and price in the active currency, with a small USD | NGN toggle near the price.
- Availability badge. For pre-order items, the arrival date is shown right next to the Add button.
- Specifications table: type, category, shape, size, material, color.
- Short description and care notes.
- Size selector (if multiple sizes are offered); out-of-stock sizes are disabled.

**Delivery estimator**
- Input: location dropdown or search, limited to locations the admin has defined.
- Output for in-stock rings: "Delivery to [location]: [fee], arrives in [X to Y] days".
- Output for pre-order rings: "Arrives [date]. Shipping to [location]: [fee], then [X to Y] days after arrival".
- If the location is not defined: "We don't deliver to this location yet. Contact us."
- The chosen location is remembered for the session and pre-fills the cart and checkout.

**Actions**
- "Add to Cart" for in-stock rings; "Pre-order Now" for pre-order rings.
- Share button, and a short list of trust points (secure payment, tagline).
- Related rings from the same category.

### 5.4 Search

- Search bar in the header with instant suggestions (name, category).
- Results page uses the same card and filter components as the listing page.

### 5.5 Cart

- Line items: image, name, size, quantity, unit price, line total.
- Quantity adjustments limited by stock for in-stock items. Pre-order items can have an admin-set maximum per order.
- The cart is split into two clearly labeled groups: **Ready to ship** and **Pre-order**, because they have different delivery rules.
- Location selector (shared with the estimator) to calculate delivery fees.
- Summary: subtotal, delivery fee(s), total, all in the active currency.
- Cart persists for guests (browser storage) and syncs for logged-in users.

### 5.6 Checkout

**Step 1: Contact and delivery**
- Full name, email, phone, delivery address, location (from the defined list), optional note.
- Guest checkout allowed; optional "create an account" checkbox.

**Step 2: Delivery summary**
- For each shipment group: fee, estimated days (and arrival date for pre-order).

**Step 3: Payment**
- Choose BACHS or Paystack.
- Terms checkbox covering pre-order policy and returns policy.
- Pay button showing the exact amount and currency.

**General**
- Order summary visible throughout, with the tagline reassurance line.
- Inline validation, clear error messages, preserved data on error.

### 5.7 Order Confirmation and Tracking

- Confirmation page shows order number, items, delivery details, amount paid and gateway reference.
- Confirmation email sent immediately after payment is verified.
- Tracking page (lookup by order number and email for guests) shows status timeline per shipment.

### 5.8 Customer Account (Optional Registration)

- Sign up, sign in, password reset.
- Order history with statuses.
- Saved addresses and default location.
- Currency preference saved to profile.

### 5.9 Static and Support Pages

- Shipping and Delivery page explains the fees and timelines by location.
- Pre-order policy page explains how pre-orders work, what happens if arrival is delayed, and refund conditions.
- Contact page with form, WhatsApp or email link.

---

## 6. Functional Requirements: Admin Dashboard

### 6.1 Authentication and Access

- Email and password login with rate limiting and lockout after repeated failures.
- Optional two-factor authentication.
- Password reset by email.
- Session timeout after inactivity.

### 6.2 Dashboard

- Cards: total sales (USD and NGN), orders today, pending payment, awaiting shipment, pre-orders awaiting arrival, low-stock items.
- Sales over time chart (daily, weekly, monthly).
- Recent orders table.
- Quick actions: Add product, Add category, Update exchange rate.

### 6.3 Product Management

**Product list**
- Table with image, name, category, type, price, availability, stock, status.
- Search, filter by category, availability and status; sort by date or name.
- Bulk actions: publish, hide, delete, change category.

**Add and edit product form** (grouped into sections)

*Basic info*
- Name (required)
- Description (rich text, basic formatting)
- Type: engagement ring, female ring, male ring (required)
- Category (required, multi-select, with an inline "create new category" option)

*Specifications*
- Shape (free text with saved suggestions, for example round, oval, princess)
- Size (one or more sizes; each size can have its own stock count)
- Material (free text with saved suggestions, for example gold plated, sterling silver)
- Color (free text with saved suggestions)

*Pricing*
- Price, entered once in the base currency chosen in settings.
- Live preview showing the automatically converted price in the other currency using the current exchange rate.
- Optional compare-at price to show a "was" price.

*Availability*
- Availability: **In Stock** or **Pre-order** (required).
- If In Stock: stock quantity per size.
- If Pre-order: **expected arrival date** (required), optional max pre-order quantity.

*Images*
- Upload up to four images, drag to reorder, first image is the cover.
- Each image has an optional label such as "Left hand", "Right hand", "Side view", "Close-up".
- Upload progress, preview, replace and remove controls.
- The uploader refuses a fifth image with a clear message.

*Publishing*
- Status: draft, published, hidden.
- Featured toggle.
- SEO fields (URL slug, meta title, meta description), auto-filled but editable.

**Validation rules**
- Name, type, category, price and availability are required.
- Pre-order requires an arrival date in the future.
- At least one image is required to publish.
- Image types: JPG, PNG, WebP; maximum 5 MB per image before compression.

**Automations**
- Images are compressed, resized to multiple widths and converted to WebP.
- When in-stock quantity hits zero, the product shows Sold Out. The admin gets a low-stock alert before that (configurable threshold).
- When a pre-order arrival date passes, the admin sees a prompt to mark the item In Stock or set a new date.

### 6.4 Category Management

- Create, edit, reorder, hide and delete categories.
- Fields: name, slug, description, cover image, display order, active toggle.
- Assign rings to categories from the product form, or in bulk from the category page by selecting products.
- A ring can belong to multiple categories.
- Deleting a category with products requires reassigning or confirming removal.
- New categories instantly appear in navigation, filters and the homepage tiles.
- Default categories at launch: Engagement Rings, Female Rings, Male Rings, Pre-order Collection (all editable).

### 6.5 Exchange Rate and Currency Settings

- Field for "1 USD = ? NGN".
- Selector for the **base currency** used when entering product prices and delivery fees.
- Rounding rule (for example round NGN to the nearest 10 or 50, and USD to 2 decimals).
- Save button shows a confirmation summary: "This will update the displayed price of N products."
- Rate history table: date, old rate, new rate, changed by.
- Option to schedule a rate change (later enhancement).

### 6.6 Delivery Location Management

- Table of locations: country, state or region, city or area, in-stock fee, pre-order shipping fee, estimated days (min and max), active status.
- Add, edit, deactivate, delete, and bulk import by CSV.
- Fees are entered in the base currency and converted automatically.
- Optional free-delivery threshold (minimum order value).
- Clone a location's fees to speed up setup of similar areas.

### 6.7 Order Management

- Orders table with filters: status, payment status, availability type, date range, location, gateway.
- Order detail page: customer, items with images, shipments, fees, exchange rate used, gateway reference, status timeline, internal notes.
- Actions: update status per shipment, add tracking details, send email update, mark refund, cancel order.
- Export to CSV.

### 6.8 Payment Management

- Payments table: order, gateway (BACHS or Paystack), reference, amount, currency, status, date.
- Detail view with gateway response and webhook log.
- Manual "verify with gateway" button to reconcile stuck payments.
- Refund notes and manual refund marking.

### 6.9 Settings

- Store info: name, logo, contact details, social links, tagline text.
- Payment gateway keys (stored securely, test and live modes).
- Email templates and sender details.
- Announcement bar content.
- Pre-order policy text and returns policy text (feeds static pages).
- Unpaid order expiry window.

---

## 7. Pricing, Currency and Exchange Rate Logic

### 7.1 Principles

1. The admin enters each price **once**, in the base currency.
2. The other currency is **calculated automatically** from the current exchange rate.
3. Customers can view the price in USD or NGN at any time.
4. Orders **lock in** the exchange rate at the moment of purchase.

### 7.2 Formulas

If the base currency is USD:
- `price_NGN = round(price_USD × rate)`

If the base currency is NGN:
- `price_USD = round(price_NGN ÷ rate, 2)`

The same logic applies to delivery and shipping fees.

**Example**
Base currency USD, rate 1 USD = 1,600 NGN.
Ring price = 45 USD, so NGN price = 72,000.
Delivery fee to Lagos = 5 USD, so NGN fee = 8,000.
Total in NGN = 80,000. Total in USD = 50.

### 7.3 Default Currency by Location

1. On first visit, detect the visitor's country using IP geolocation.
2. Nigeria: default to NGN. Everywhere else: default to USD.
3. If detection fails or is blocked, default to USD (or the admin-chosen fallback currency).
4. The visitor can switch with the header toggle at any time; the choice is stored in a cookie or local storage and, for logged-in users, in their profile.
5. A saved manual choice always overrides detection on future visits.

### 7.4 Display Rules

- Always show the currency symbol or code (`$` or `₦`).
- Use correct thousands separators.
- Show the full price consistently on cards, product page, cart, checkout and emails.
- Never mix currencies in the same total.

### 7.5 Exchange Rate Changes

- Updating the rate changes displayed prices immediately.
- Items already in a customer's cart are repriced at the new rate when the cart is next loaded; checkout shows a notice if the total changed.
- Paid orders never change.

---

## 8. Availability and Pre-order Logic

### 8.1 Two Product States

| State | Meaning | Customer sees | Purchase button |
|-------|---------|---------------|-----------------|
| In Stock | Physically available and ready to ship | "In Stock" badge, delivery fee and days | Add to Cart |
| Pre-order | Not yet available, arrival date confirmed | "Pre-order" badge with arrival date | Pre-order Now |

(A third automatic state, **Sold Out**, applies when in-stock quantity reaches zero.)

### 8.2 Pre-order Rules

- Arrival date is required and shown everywhere the product appears.
- The arrival date is presented as the date the ring will be **available to ship**; shipping time is added on top using the location's estimated days.
- Pre-orders are paid in full at checkout (default for v1).
- The admin can change the arrival date; affected customers are notified by email automatically.
- If an arrival date passes with no update, the admin is prompted to act.
- Optional maximum quantity per pre-order product to avoid overselling.

### 8.3 Mixed Carts

When a cart contains both types, the order is split into two **shipments** under a single order and a single payment:

1. **Shipment A (ready to ship):** dispatched after payment, uses the in-stock fee and delivery days.
2. **Shipment B (pre-order):** dispatched after arrival, uses the pre-order shipping fee and the arrival date.

The customer sees both shipments with their own fees and timelines before paying.

### 8.4 Pre-order Status Flow

`Pre-order Confirmed → Arrived → Packed → Shipped → Delivered`

Each change can trigger a customer email. Bulk "Mark as arrived" lets the admin update every order for a given product at once.

---

## 9. Delivery and Shipping Fee Logic

### 9.1 How It Works

The admin defines the delivery locations in the system. Each location carries its own fee and timing. Customers pick from this list; the system then calculates the fee automatically.

### 9.2 Location Hierarchy

Country → State or region → City or area (the admin decides how granular to be; for example "Lagos Island", "Lagos Mainland", "Abuja", "Port Harcourt", "United Kingdom").

### 9.3 Fee Fields per Location

| Field | Applies to | Example |
|-------|-----------|---------|
| In-stock delivery fee | Ready-to-ship items | 5 USD |
| Pre-order shipping fee | Pre-order items | 7 USD |
| Estimated delivery days (min to max) | Both | 2 to 4 days |
| Free-delivery threshold (optional) | In-stock items | Free above 150 USD |
| Active flag | Whether customers can choose it | Yes |

### 9.4 Fee Calculation Rules

- One delivery fee per shipment, not per item (default). The admin can later switch to per-item fees.
- A mixed cart pays both fees: one for the ready-to-ship shipment and one for the pre-order shipment.
- Fees are stored in the base currency, converted using the exchange rate, and displayed in the active currency.
- If the free-delivery threshold is met, the in-stock fee is waived (the pre-order fee still applies unless the admin extends the threshold rule).

### 9.5 Customer Messaging

- Product page: "Delivery to Lekki: ₦8,000, arrives in 2 to 4 days."
- Pre-order: "Arrives 12 Dec. Shipping to Lekki: ₦11,200, then 2 to 4 days after arrival."
- Cart and checkout: fee lines per shipment.
- Emails repeat these details.

### 9.6 Rules at Checkout

- The delivery address must be tied to a defined, active location.
- The fee and estimated days are saved on the order at payment time and do not change afterward.
- If a location is later deactivated, previously paid orders are unaffected.

---

## 10. Payments (BACHS and Paystack)

### 10.1 Overview

Two gateways are supported at launch: **BACHS** and **Paystack**. The customer chooses one at checkout. Both integrations must be server-side secure, verify every payment, and update the order only after confirmation from the gateway.

### 10.2 Gateway Selection Logic

- Show both gateways by default.
- Hide or disable a gateway that does not support the customer's selected currency, with a short explanation.
- Admin can enable or disable each gateway independently from settings (useful if one has downtime).
- Paystack is expected to support NGN and selected international cards; BACHS details, supported currencies and fees must be confirmed from its documentation (see Open Questions).

### 10.3 Payment Flow

1. Customer reviews the order summary and selects a gateway.
2. Backend creates an order in **Pending Payment** and generates a unique reference.
3. Backend initializes the transaction with the chosen gateway (amount, currency, customer email, reference, callback URL).
4. Customer is redirected to, or shown, the gateway's secure payment page.
5. After payment, the customer returns to the site's callback page, which shows "Confirming your payment..." and does **not** mark the order paid on its own.
6. The gateway sends a **webhook** to the backend.
7. Backend verifies the webhook signature, looks up the order by reference, and confirms that **amount and currency match** the order.
8. If valid, the order moves to **Paid**, stock is committed, and emails are sent.
9. If the webhook is delayed, the callback page polls the order status and the backend can also verify directly with the gateway's verify endpoint.

### 10.4 Payment States

`Pending Payment → Paid` (success)
`Pending Payment → Failed` (declined or error; customer can retry)
`Pending Payment → Expired` (not paid within the expiry window; stock released)
`Paid → Refunded` (admin-marked after a manual refund)

### 10.5 Safety Rules

- Never trust the browser redirect alone as proof of payment.
- Verify webhook signatures and ignore unsigned or invalid requests.
- Compare paid amount and currency with the stored order total.
- Process webhooks **idempotently**: repeated events must not duplicate orders, emails or stock changes.
- Log all gateway requests and responses for audit.
- Never store card details; the gateways handle them.
- Keep API keys in server environment variables, with separate test and live keys.

### 10.6 Refunds

- v1: refunds are done manually through the gateway dashboard; the admin marks the order as Refunded and adds a note.
- Future: trigger refunds through the gateway APIs from the admin panel.

### 10.7 Reconciliation

- Admin can open any payment and click "Verify with gateway" to resolve mismatches.
- A daily job checks Pending Payment orders older than a set time against the gateway and updates them.

---

## 11. Orders, Fulfilment and Notifications

### 11.1 Order Statuses

| Status | Meaning |
|--------|---------|
| Pending Payment | Created, awaiting payment |
| Paid | Payment verified |
| Processing | Being prepared |
| Shipped | Handed to courier |
| Delivered | Received by customer |
| Cancelled | Cancelled before shipping |
| Refunded | Payment returned |

Shipment-level statuses add **Pre-order Confirmed** and **Arrived** for pre-order shipments.

### 11.2 Customer Emails

| Trigger | Email |
|---------|-------|
| Payment verified | Order confirmation with items, fees, delivery details |
| Pre-order paid | Pre-order confirmation with arrival date |
| Arrival date changed | Notice of the new date |
| Pre-order item arrived | "Your ring has arrived" |
| Shipped | Shipping notice with tracking details |
| Delivered | Delivery confirmation and thank-you |
| Payment failed | Retry link |
| Unpaid order about to expire | Reminder |

### 11.3 Admin Notifications

- New paid order
- Payment failed or mismatch
- Low stock
- Pre-order arrival date reached

### 11.4 Optional Later

WhatsApp or SMS notifications for status updates.

---

## 12. Data Model

### 12.1 Entities

**Product**
`id, name, slug, description, type (engagement|female|male), shape, material, color, base_price, base_currency, compare_at_price, availability (in_stock|pre_order), preorder_arrival_date, preorder_max_qty, status (draft|published|hidden), is_featured, seo_title, seo_description, created_at, updated_at`

**ProductSize**
`id, product_id, size_label, stock_quantity`

**ProductImage**
`id, product_id, url, label, position (1 to 4)`
Constraint: maximum four rows per product.

**Category**
`id, name, slug, description, cover_image, display_order, is_active`

**ProductCategory**
`product_id, category_id` (many-to-many)

**ExchangeRate**
`id, usd_to_ngn, effective_at, created_by`

**Setting**
`key, value` (base currency, rounding, expiry window, tagline, etc.)

**DeliveryLocation**
`id, country, region, city_area, instock_fee, preorder_fee, min_days, max_days, free_threshold, is_active`

**Customer**
`id, name, email, phone, password_hash (nullable), preferred_currency, created_at`

**Address**
`id, customer_id, line1, line2, location_id, phone, is_default`

**Order**
`id, order_number, customer_id (nullable), email, currency, exchange_rate_used, subtotal, delivery_total, total, status, payment_status, location_id, address_snapshot, notes, created_at`

**OrderItem**
`id, order_id, product_id, product_name_snapshot, size, quantity, unit_price, availability_type, arrival_date_snapshot`

**Shipment**
`id, order_id, type (ready|preorder), fee, est_min_days, est_max_days, status, tracking_info, shipped_at, delivered_at`

**Payment**
`id, order_id, gateway (bachs|paystack), reference, amount, currency, status, raw_response, created_at, verified_at`

**WebhookEvent**
`id, gateway, event_id, payload, processed_at`
Used to guarantee idempotency.

**AdminUser**
`id, email, password_hash, role, two_factor_enabled, last_login_at`

### 12.2 Key Relationships

- Product has many ProductImages (max four), many Sizes, and many Categories.
- Order has many OrderItems, one or two Shipments, and one or more Payment attempts.
- Orders snapshot product names, prices, exchange rate, fees and arrival dates so later edits never change history.

---

## 13. API and Integration Overview

### 13.1 Main Internal Endpoints (Illustrative)

**Public**
- `GET /products` (filters, sort, pagination)
- `GET /products/:slug`
- `GET /categories`
- `GET /currency/context` (detected country, default currency, current rate)
- `POST /delivery/estimate` (location + items, returns fees and days)
- `POST /cart/validate`
- `POST /checkout` (creates order and initializes payment)
- `GET /orders/:number/status`
- `POST /webhooks/paystack`
- `POST /webhooks/bachs`

**Admin (authenticated)**
- CRUD: `/admin/products`, `/admin/categories`, `/admin/delivery-locations`
- `POST /admin/products/:id/images` (max four enforced)
- `PUT /admin/settings/exchange-rate`
- `GET/PATCH /admin/orders`
- `POST /admin/payments/:id/verify`

### 13.2 Third-party Integrations

- **Paystack** (payments, webhooks, verify endpoint)
- **BACHS** (payments, webhooks, verify endpoint; details to confirm)
- **IP geolocation service** (default currency)
- **Email provider** (transactional email)
- **Cloud image storage and CDN**
- Optional: analytics tool, error monitoring

### 13.3 Suggested Technology (Flexible)

A React or Next.js frontend, Node.js backend, PostgreSQL database, cloud object storage with a CDN for images, and a managed email service. The development team may substitute equivalents.

---

## 14. Non-functional Requirements

### 14.1 Performance

- Product pages load in under 3 seconds on a typical 4G connection.
- Largest contentful paint under 2.5 seconds on mobile for key pages.
- Images lazy-loaded, responsive sizes, WebP format, served via CDN.
- Caching for catalog pages with instant invalidation when the admin edits a product or the exchange rate.

### 14.2 Security

- HTTPS everywhere with HSTS.
- Hashed passwords (bcrypt or argon2).
- Admin protected by login, optional two-factor authentication, and role-based access.
- Webhook signature verification; secrets in environment variables.
- Protection against XSS, CSRF, SQL injection; input validation and output escaping.
- Rate limiting on login, checkout and webhook endpoints.
- File upload validation (type, size, content check).
- Regular dependency updates and vulnerability scans.

### 14.3 Reliability

- Daily database backups with tested restore.
- Retry and logging for webhook processing.
- Health checks and uptime monitoring with alerts.

### 14.4 Scalability

- Designed for thousands of products and heavy traffic during promotions and drops.
- Stateless backend so it can scale horizontally.

### 14.5 SEO

- Clean, readable URLs.
- Unique meta title and description per product and category.
- Structured data (Product, Offer, availability, price and currency).
- XML sitemap and robots file.
- Fast, mobile-friendly pages.

### 14.6 Accessibility

- Aim for WCAG 2.1 AA.
- Alt text on all product images (using image labels).
- Keyboard navigation and visible focus states.
- Sufficient contrast, especially for gold elements.

### 14.7 Privacy and Compliance

- Privacy policy, terms of service, returns policy and cookie notice.
- Clear consent for location detection and cookies where required.
- Minimal personal data retained; ability to delete customer data on request.
- Nigerian data protection requirements and, where relevant, GDPR considerations for international customers.

### 14.8 Browser and Device Support

Latest two versions of Chrome, Safari, Firefox and Edge; iOS Safari and Android Chrome.

---

## 15. Analytics and Reporting

**Storefront analytics**
- Page views, sessions, traffic sources
- Product views, add-to-cart rate, checkout starts, completed orders
- Conversion funnel and cart abandonment
- Currency split (USD vs NGN) and location split
- Gateway usage and success rate
- Pre-order vs in-stock sales mix

**Admin reports**
- Sales by day, week, month, in both currencies
- Top-selling rings and categories
- Orders by location
- Pre-orders pending arrival, with quantities per product
- Exchange rate history and its effect on revenue
- Low-stock report

---

## 16. User Stories and Acceptance Criteria

### 16.1 Customer Stories

**US-C1: See prices in my currency**
As a visitor, I want the site to show prices in my local currency automatically so I can understand costs immediately.
*Acceptance criteria*
- A visitor from Nigeria sees NGN by default; a visitor from elsewhere sees USD.
- A header toggle switches currency across the whole site instantly.
- My choice is remembered on my next visit.

**US-C2: Browse and filter rings**
As a shopper, I want to filter by type, material, color, shape, size and availability so I can find the right ring quickly.
*Acceptance criteria*
- Filters can be combined and cleared.
- Results update without a full page reload.
- The URL reflects the filters.

**US-C3: See ring details from several angles**
As a shopper, I want photos of the ring from different angles and on the hand so I can judge how it looks.
*Acceptance criteria*
- Up to four images displayed in a gallery with zoom and swipe.
- Image labels appear as captions.

**US-C4: Understand pre-order timing**
As a shopper, I want to see exactly when a pre-order ring will arrive so I can decide whether to buy.
*Acceptance criteria*
- Arrival date shown on card, product page, cart, checkout and emails.
- Cart and checkout show the pre-order shipping fee for my location.

**US-C5: Know the delivery cost and time**
As a shopper, I want to enter my location and see the delivery fee and delivery days before checkout.
*Acceptance criteria*
- Fee and days appear on the product page after I choose a location.
- Locations not served show a clear message.
- The fee shown equals the fee charged.

**US-C6: Pay securely**
As a shopper, I want to pay with a trusted gateway so I feel safe.
*Acceptance criteria*
- I can choose BACHS or Paystack.
- After paying, I see a confirmation and receive an email.
- If payment fails, I can retry without re-entering my details.

**US-C7: Track my order**
As a customer, I want to see my order status so I know when to expect my ring.
*Acceptance criteria*
- Status timeline per shipment.
- Guests can look up an order with order number and email.

### 16.2 Admin Stories

**US-A1: Upload a new ring**
As the admin, I want to add a ring with its details and up to four photos so it goes live quickly.
*Acceptance criteria*
- I can enter name, shape, size, material, color, type, category and price.
- I can mark it In Stock or Pre-order, and set an arrival date for pre-orders.
- The uploader accepts up to four images and blocks a fifth.
- The product appears in the storefront once published.

**US-A2: Create and assign categories**
As the admin, I want to create categories and map rings to them so shoppers can browse by group.
*Acceptance criteria*
- I can create a category from the Categories page or inline while adding a product.
- I can assign one or many rings to a category.
- New categories show up in navigation and filters immediately.

**US-A3: Set the exchange rate once**
As the admin, I want to set the exchange rate so all prices are converted automatically.
*Acceptance criteria*
- I enter the price of a ring once.
- Updating the rate updates all displayed prices.
- Old orders keep the rate used at purchase.

**US-A4: Define delivery fees by location**
As the admin, I want to define locations with fees and delivery days so customers see accurate costs.
*Acceptance criteria*
- I can set separate in-stock and pre-order fees per location.
- I can set minimum and maximum delivery days.
- Customers can only choose active locations.

**US-A5: Manage orders**
As the admin, I want to see paid orders and update their status so customers stay informed.
*Acceptance criteria*
- Orders show items, location, fees, gateway reference and payment status.
- Updating a status can send an email.
- I can bulk-mark pre-order items as arrived.

**US-A6: Control payment gateways**
As the admin, I want to switch gateways on or off and verify stuck payments.
*Acceptance criteria*
- Each gateway has an enable toggle.
- I can verify a payment against the gateway from the order page.

---

## 17. Edge Cases and Error Handling

| Scenario | Expected behavior |
|----------|-------------------|
| Visitor blocks location or geolocation fails | Default to USD (or admin fallback); toggle remains available |
| Visitor uses VPN | Detected country may differ; manual toggle overrides |
| Location not in system | Show "We don't deliver here yet" with a contact link; checkout blocked for that address |
| Exchange rate changes while item is in cart | Reprice on next load; notify the customer if the total changed |
| Exchange rate changes during payment | Order total stays at the amount initialized with the gateway |
| Two customers buy the last in-stock ring | Stock reserved at checkout start; the second customer sees an unavailability message |
| Payment succeeds but customer closes the browser | Webhook marks the order Paid; confirmation email still sent |
| Webhook arrives twice | Idempotent handling; no duplicate emails or stock changes |
| Webhook amount differs from order total | Order flagged for review; not auto-marked Paid; admin alerted |
| Gateway is down | Gateway option hidden or disabled by admin; customer can use the other |
| Customer abandons payment | Order expires after the set window; stock released; optional reminder email |
| Pre-order arrival date passes without arrival | Admin prompted; admin can set a new date; customers notified |
| Cart mixes in-stock and pre-order items | Two shipments, two fees, one payment |
| Admin uploads a fifth image | Blocked with a clear message |
| Admin deletes a category with products | Must reassign or confirm; products are not deleted |
| Product set to hidden with items in carts | Item removed from cart with a notice |
| Image upload fails or file too large | Clear error, retry option |
| Customer enters invalid email or phone | Inline validation message |

---

## 18. Testing and QA Plan

### 18.1 Functional Testing

- Product creation with all fields, including four images and pre-order dates.
- Category creation, assignment and deletion rules.
- Filter, sort and search combinations.
- Cart behavior with in-stock, pre-order and mixed items.
- Delivery fee calculation for each location type.
- Exchange rate update and rounding across the site.

### 18.2 Payment Testing

- Successful, failed, abandoned and expired payments on both gateways in test mode.
- Webhook signature validation, duplicate webhooks, delayed webhooks.
- Amount and currency mismatch handling.
- Verify-with-gateway reconciliation.
- Live-mode low-value test transactions before launch.

### 18.3 Currency and Location Testing

- Default currency from several countries and with geolocation blocked.
- Toggle persistence across sessions and devices (logged-in).
- Exchange rate math with USD and NGN base currencies.

### 18.4 Non-functional Testing

- Load testing for traffic spikes.
- Security testing: authentication, authorization, injection, upload validation.
- Accessibility audit.
- Cross-browser and device testing, with emphasis on phones.
- Email deliverability and template rendering.

### 18.5 User Acceptance Testing

The store owner runs through: adding five rings (including pre-orders), creating categories, setting rate and delivery fees, and completing test purchases on both gateways before sign-off.

---

## 19. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| BACHS integration details unclear | Delays or limited currency support | Obtain documentation early; build a gateway abstraction layer; launch with Paystack if needed |
| Exchange rate volatility | Pricing gaps | Admin can update rate quickly; rate locked at order; optional scheduled updates later |
| Incorrect delivery fees | Lost margin | Clear admin tools, CSV import, preview calculator, review before launch |
| Pre-order delays | Customer dissatisfaction | Clear policy, arrival date change notifications, refund conditions |
| Overselling stock | Cancelled orders | Stock reservation at checkout and unit-level stock tracking |
| Payment fraud or chargebacks | Financial loss | Gateway fraud tools, order review for large or mismatched amounts |
| Slow image loading | Lost sales | Compression, CDN, lazy loading |
| IP geolocation inaccuracies | Wrong default currency | Easy toggle, remembered choice |

---

## 20. Release Plan

**Phase 1: Foundation (design and catalog)**
Design system and brand styling, authentication, product and category management, image upload, storefront browsing, filters and product pages.

**Phase 2: Commerce**
Cart, checkout, delivery locations and fees, exchange rate and currency switching, Paystack integration, BACHS integration.

**Phase 3: Operations**
Order and payment management, notifications, pre-order workflows, admin dashboard and reports.

**Phase 4: Hardening and launch**
End-to-end testing, security review, performance tuning, SEO, content and policy pages, UAT with the store owner, soft launch, public launch.

---

## 21. Success Metrics

| Metric | Target (initial) |
|--------|------------------|
| Time to add a product with four images | Under 3 minutes |
| Mobile page load (product page) | Under 3 seconds on 4G |
| Payment success rate | To be set after baseline; aim above 90% of initiated payments |
| Orders with price or fee discrepancies | Under 1% |
| Verified-before-Paid orders | 100% |
| Checkout conversion | Baseline in first month, then improve |
| Pre-order customer notification delivery | 100% of affected customers emailed on date change |

---

## 22. Future Enhancements

- Partial deposits for pre-orders.
- Customer reviews with photos and ratings.
- Wishlist and back-in-stock alerts.
- Discount codes, bundles and seasonal promotions.
- Ring size guide and engraving or personalization options.
- Additional currencies and payment gateways.
- Courier integrations and live tracking.
- WhatsApp and SMS order updates.
- Scheduled exchange rate changes.
- Staff accounts with granular permissions.
- Loyalty program and referral rewards.

---

## 23. Open Questions

1. **BACHS:** What are its documentation link, supported currencies, fees and integration method?
2. **Pre-order payment:** Full payment upfront (assumed) or a deposit?
3. **Delivery coverage:** Nigeria only at launch, or international too? Which locations and fees should be loaded first?
4. **Base currency:** Will prices usually be entered in naira or dollars?
5. **Delivery fee model:** One fee per shipment (assumed) or per item?
6. **Returns and refunds:** What is the policy for in-stock and pre-order items?
7. **Customer accounts:** Guest checkout only, optional sign-up, or required sign-up?
8. **Brand assets:** Do you already have a logo, brand name and color preferences?
9. **Sizing:** Are rings sold in multiple sizes with separate stock counts, or one size per listing?
10. **Pre-order cancellations:** Can customers cancel a pre-order before arrival, and for what refund?

---

## 24. Glossary

| Term | Definition |
|------|------------|
| **In Stock** | A ring physically available and ready to ship |
| **Pre-order** | A ring not yet available, sold in advance with a confirmed arrival date |
| **Base currency** | The currency in which the admin enters prices and fees |
| **Exchange rate** | The USD to NGN rate set by the admin |
| **Shipment** | A group of items in an order that ship together, either ready-to-ship or pre-order |
| **Webhook** | An automatic message from a payment gateway confirming a payment's outcome |
| **Idempotent** | Safe to process more than once without changing the result |
| **SKU** | A unique sellable product unit |
| **CDN** | A network that delivers images and files quickly from servers near the user |
| **BACHS / Paystack** | The two payment gateways used on the platform |