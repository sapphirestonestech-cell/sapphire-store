# DESIGN.md: Luxury Ring Store UI Design System

> Floating rings on a warm ivory canvas. Soft, pillowy shapes. One gold accent.

**Theme:** light
**Product:** Luxury ring e-commerce store (storefront and admin dashboard)
**Brand promise:** Luxurious rings at an affordable price.
**Brand feel:** Sleek, a little cute, luxurious, gold, elegant.

---

## 0. Source and Precedence

This design system started from a style reference captured from another store's interface (Shop). That reference supplied the structural ideas: pillowy 28px cards, pill-shaped controls, compact type with tight tracking, one restrained accent, and image-first product cards floating on a soft canvas.

It has been rewritten for this product. **Where the reference conflicts with the original product instructions, the product instructions win.** Section 12 records every change and the reason for it.

Do not reproduce the other brand's name, logo, wordmark, copy, or proprietary fonts (GT Standard, Shopify Sans). Only the structural ideas are reused.

Items marked **[Confirm]** are proposed choices I made to fill gaps. They have not been approved and must be confirmed before they are treated as final (see section 13).

---

## 1. Design Principles

1. **Luxury at an affordable price.** The interface should feel like a boutique jeweler: calm, generous with space, and confident. Never cheap, never intimidating.
2. **The ring is the hero.** Product photography carries the color and the emotion. The UI stays quiet so the gold, stones and metal in the photos stand out.
3. **One gold accent.** Gold is the only saturated color. It marks the primary action and the brand. Keeping it singular is what keeps it feeling precious.
4. **Soft and a little cute.** Generous rounding, pill controls and gentle shadows give the store its friendly, giftable character. Cuteness comes from shape, not from decoration.
5. **Clarity before charm.** Price, availability, arrival date, delivery fee and currency must always be easy to read. Beauty never hides information that affects a purchase.
6. **Mobile first.** Most customers will shop on phones. Design the phone layout first and enlarge from there.
7. **Spend boldness in one place per page.** One memorable moment per page (for example the hero imagery). Everything else stays disciplined.

---

## 2. Color Tokens

### 2.1 Core palette

| Name | Value | Token | Role |
|------|-------|-------|------|
| Ivory Canvas | `#FBF8F3` | `--color-ivory-canvas` | Page background. Only visible at the page edges and between elevated surfaces **[Confirm]** |
| Pure White | `#FFFFFF` | `--color-pure-white` | Cards, inputs, pills, header, sheets |
| Warm Ink | `#211D19` | `--color-warm-ink` | Primary text, headings, icons, dark surfaces **[Confirm]** |
| Soft Taupe | `#7A7168` | `--color-soft-taupe` | Secondary text, placeholders, idle icons |
| Hairline | `#ECE6DC` | `--color-hairline` | Hairline borders on inputs, pills, dividers |
| Pale Sand | `#D9D2C6` | `--color-pale-sand` | Disabled states, inactive fills |
| Champagne Gold | `#C9A24B` | `--color-champagne-gold` | The brand accent: primary buttons, search submit, wordmark mark, active indicators, gold hairline details **[Confirm exact hex]** |
| Deep Gold | `#8A6A1F` | `--color-deep-gold` | Gold used as text or small icons on light surfaces (links, pre-order date text, price highlights) |
| Gold Wash | `#F1E6C8` | `--color-gold-wash` | Soft gold tint for badge fills, selected states and the halo behind the primary button |
| Charcoal Band | `#2B2622` | `--color-charcoal-band` | Announcement bar, footer band, dark product tiles |

### 2.2 Status colors (restricted use)

The reference allows no second saturated color. A store still needs success and error states, so these exist **only** for form validation, order and payment status, and toasts. They never appear on marketing surfaces, buttons, or product cards **[Confirm]**.

| Name | Value | Token | Use |
|------|-------|-------|-----|
| Status Success | `#3F7A57` | `--color-status-success` | Paid, delivered, saved |
| Status Error | `#B3402F` | `--color-status-error` | Failed payment, validation errors |
| Status Warning | `#A8741A` | `--color-status-warning` | Low stock, pending payment, expiring |

Status text must not rely on color alone. Always pair it with an icon and a label.

### 2.3 Contrast rules

- **Gold fails as small text on white or ivory.** Use Champagne Gold for fills, borders, large elements and icons. Use Deep Gold or Warm Ink when gold-toned *text* is needed.
- **Text on a Champagne Gold fill is Warm Ink, never white.** White on this gold does not meet contrast requirements.
- Body text pairs Warm Ink on white or ivory. Secondary text is Soft Taupe, used at 14px or larger.
- Verify every pair against WCAG AA (4.5:1 for body text, 3:1 for large text and UI components) before shipping. If a pair fails, adjust the token and tell the product owner; do not silently change the brand gold.

---

## 3. Typography

### 3.1 Typefaces **[Confirm]**

The reference uses one proprietary sans-serif with tight tracking. For a luxury jewelry brand, the original brief ("luxury, gold, elegance") takes precedence, so this system pairs an elegant display serif with a clean sans.

| Role | Proposed family | Fallback stack | Notes |
|------|-----------------|----------------|-------|
| Display and headings | An elegant, high-contrast serif (for example Cormorant Garamond or Playfair Display) | `Georgia, 'Times New Roman', serif` | Hero headline, section headers, product names on the detail page |
| Body, UI, prices, buttons | A clean sans (for example Inter or Jost) | `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | Everything else |

**Critical check: the Naira sign.** The store shows prices in both `$` and `₦` (U+20A6). Many display fonts lack the ₦ glyph and will silently fall back to another font, which looks broken. Whatever fonts are chosen must be tested with `₦` in every weight and size used. Prices should use the sans family, which is easier to verify.

Final font choice is open (section 13).

### 3.2 Weights

- Keep weights light and refined: **400 for body, 500 for emphasis and buttons, 600 for prices and key labels.**
- Do not use 700 or heavier. Hierarchy comes from size, family, tracking and spacing, not from heavy weight.

### 3.3 Type scale

| Role | Family | Size | Line height | Tracking | Token |
|------|--------|------|-------------|----------|-------|
| display | Serif | 44px (mobile 32px) | 1.1 | -0.01em | `--text-display` |
| heading-lg | Serif | 28px (mobile 23px) | 1.15 | -0.01em | `--text-heading-lg` |
| heading | Serif | 22px (mobile 20px) | 1.2 | 0 | `--text-heading` |
| subheading | Sans | 18px | 1.25 | -0.02em | `--text-subheading` |
| body-lg | Sans | 16px | 1.4 | -0.015em | `--text-body-lg` |
| body | Sans | 14px | 1.4 | -0.01em | `--text-body` |
| label | Sans | 12px | 1.35 | 0 | `--text-label` |

Rules:

- **16px is the minimum for primary body content.** 14px is allowed for secondary information. **12px is the absolute floor** (badges, small labels). Nothing smaller.
- **Heading trim (2026-10-17, client instruction):** the large end of the scale came down (display 48→44, heading-lg 32→28, heading 24→22, subheading 20→18; mobile proportionally) to calm the platform. Body, body-lg and label are unchanged and stay at the documented floors.
- Line length stays under 80 characters. Serif body text, if used, gets slightly more line height than sans.
- Use sentence case everywhere. Avoid all-caps labels and tracked-out eyebrow text above headings.
- Do not accent a single word in a headline with italic or a different color.
- Tracking tightens at larger sans sizes and relaxes at small sizes. Serif headings stay close to neutral tracking.
- Prices use tabular figures where the font supports them so columns align in the cart and admin tables.

---

## 4. Spacing, Shape and Layout

### 4.1 Density

Compact inside components, airy between sections. Product browsing should feel like wandering a boutique, not scanning a catalog.

### 4.2 Spacing scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 6 | 6px | `--spacing-6` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 48 | 48px | `--spacing-48` |
| 64 | 64px | `--spacing-64` |
| 80 | 80px | `--spacing-80` |

The reference's odd values (10, 11, 38) were dropped to keep the scale clean.

### 4.3 Border radius

| Element | Value |
|---------|-------|
| Cards | 28px |
| Inner product image (inside a card) | 20px |
| Buttons | 9999px |
| Inputs and search | 9999px |
| Chips, badges and pills | 9999px |
| Sheets and modals | 28px |
| Small label chips on images | 12px |

The reference listed pills at 20px in one place and 9999px in another. This system resolves it: **every pill is fully rounded (9999px).** The 20px value belongs only to inner image radius. Multi-line text areas and large admin tables use 20px to avoid awkward ends.

0px radius is only for image edges in tight tile grids.

### 4.4 Shadows

| Name | Value | Token | Use |
|------|-------|-------|-----|
| soft | `0 2px 8px rgba(0,0,0,0.06)` | `--shadow-soft` | Pills, chips, small buttons |
| card | `0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)` | `--shadow-card` | Product cards, hero cards |
| float | `0 4px 24px rgba(0,0,0,0.12)` | `--shadow-float` | Carousel arrows, dropdowns, sticky bars |
| gold-glow | `0 4px 24px rgba(201,162,75,0.34)` | `--shadow-gold-glow` | The primary gold button only |

Use the dual-layer `card` shadow on every elevated card. Never use a single hard shadow.

### 4.5 Layout

- **Page width:** 80% of the viewport, centered (client instruction, 2026-10-17; supersedes the earlier 1200px max-width).
- **Section gap:** 64px on mobile, 80px on desktop.
- **Card padding:** 0 on image cards (the image bleeds to the inner radius frame). Text blocks beneath the image use 12px to 16px.
- **Element gap:** 12px.
- **Grid:** 2 columns on phones, 3 on tablets, 4 on desktop for product grids.
- **Touch targets:** at least 44px by 44px.

### 4.6 Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Canvas | `#FBF8F3` | Page background |
| 1 | Surface | `#FFFFFF` | Header, cards, inputs, pills, sheets |
| 2 | Elevated card | `#FFFFFF` + `card` shadow | Floating hero cards, featured rings |
| 3 | Dark band | `#2B2622` | Announcement bar, footer, dark product tiles holding ivory or white text |

Cards are separated from the canvas by the white-on-ivory shift and the shadow. **Do not add visible borders to elevated cards.**

**Canvas texture (client instruction, 2026-10-19; supersedes the faint 2026-10-18 grain, which superseded the dot lattice of 2026-10-17):** the ivory canvas carries an **irregular grain** — an SVG `feTurbulence` fractal-noise field tinted warm ink, rendered once as a full-canvas overlay in the **root layout** (`PatternBackground`), so every page shares one continuous surface: storefront, account/auth and the admin panel alike. It replaced the even fainter grain that was storefront-only. It is tuned to be **clearly noticeable but still a background**: the warm-ink alpha field is steepened with `feComponentTransfer` (rather than simply raising opacity), so it reads as texture at the same average tint instead of muddying the ivory. It must never read as a repeating grid — that is why the regular lattice of 2026-10-17 was rejected. Placement rule unchanged: canvas only — at the page edges and in the gaps between elevated white surfaces — never on or behind cards, content surfaces or the dark bands. Do not raise its strength further or reuse it on surfaces.

---

## 5. Imagery

- **Product photography is the main source of color.** Rings, stones and metal supply the variety; the UI stays neutral.
- **Required gallery:** up to **four images per ring**, each with an optional label (for example front, side, on left hand, on right hand, close-up). The cover image is the first one.
- **Card crop:** 4:5 aspect ratio on product cards for consistency across the grid **[Confirm]**. The product detail gallery uses a fixed **1:1** frame (§7.10), so mixed-ratio images letterbox inside it rather than resizing the layout.
- **Framed look:** the card radius (28px) is always larger than the inner image radius (20px), leaving a thin white frame. Never crop an image to the card's exact outer shape.
- **Background guidance for photos:** clean, neutral or soft warm backgrounds that let gold and gems read clearly. Consistent lighting across a catalog matters more than any single beautiful shot.
- **Icons:** minimal outlined strokes in Warm Ink at idle, Deep Gold or Champagne Gold when active. Category icons use a single color (gold or ink), never multiple brand colors.
- **No illustrations, no 3D, no gradients on product imagery.**
- **Cute detail, used sparingly:** a small sparkle or diamond glyph in Champagne Gold may appear in a few places (for example beside the tagline, empty states, the success page). It should be rare enough to feel like a gift tag, not wallpaper.
- Alt text on every product image uses the image label plus the product name.

---

## 6. Motion

- **One orchestrated moment:** the hero copy and imagery may drift in once on page load. Nothing else animates on its own.
- **Motion that answers an action is welcome:** adding to cart (small confirmation), opening the filter drawer, expanding the delivery estimator, switching currency (prices crossfade briefly), image gallery swipes.
- Keep transitions between 150ms and 250ms with gentle easing.
- Avoid scroll-triggered fade-and-slide on every section and avoid hover animations on every card. A subtle image zoom on desktop hover is enough.
- Respect `prefers-reduced-motion`: remove movement and keep instant state changes.
- Use skeleton placeholders instead of spinners where practical.

---

## 7. Components

### 7.1 Announcement bar (tagline)

**Role:** Carries the brand promise on every page. Replaces the reference's app download banner.

Full-width Charcoal Band, 40px to 48px high, ivory text at 14px, centered. Default text: **"Luxurious rings at an affordable price."** The admin can edit the text and add a short promo line. An optional small gold sparkle sits before the text. Dismissal is not allowed for the tagline itself.

### 7.2 Header

**Role:** Primary navigation. Replaces the reference's left sidebar rail on the storefront.

White surface, sticky on scroll with `float` shadow once the page moves. Left: store wordmark (placeholder until brand name is confirmed). Center on desktop: **three nav items** (nav rework, approved plan 2026-10-19; supersedes the "four links" rule of 2026-10-17) — a **Categories dropdown button** opening a menu with "All rings" plus every admin category, then "Track order" and "Pre-order", all at `label` size with `pill` hover. The category list beyond that lives on the shop page's category pills. Right: search, **currency switcher**, account, cart with item count. On mobile: wordmark, search icon, currency switcher, cart, and a menu button that opens the category sheet (`body` size), which lists every category followed by Track order and Pre-order.

### 7.3 Currency switcher

**Role:** Switch between USD and NGN at any time.

A compact two-option pill (`$ USD` and `₦ NGN`), 9999px radius, white fill, hairline border. The active option has a Gold Wash fill with Warm Ink text and a gold inner outline. Always visible in the header and repeated near the price on the product detail page. Switching crossfades prices without a page reload. The choice is remembered.

### 7.4 Search input

**Role:** Primary discovery control.

White pill, 9999px radius, 1px Hairline border, 4px vertical and 20px left padding. Placeholder at Soft Taupe, 16px. At the right, a 48px circular **Champagne Gold** submit button with a Warm Ink arrow or magnifier glyph and the `gold-glow` shadow. Suggested placeholder: "Search rings".

### 7.5 Buttons

| Variant | Fill | Text | Use |
|---------|------|------|-----|
| Primary | Champagne Gold with `gold-glow` | Warm Ink, 500 | Add to cart, Pre-order now, Pay, Save |
| Secondary | White with 1px Hairline | Warm Ink, 500 | Secondary actions, Continue shopping |
| Quiet | Transparent | Warm Ink or Deep Gold | Tertiary actions, text links |
| Destructive (admin only) | White with 1px Status Error | Status Error | Delete, Cancel order |

All buttons are 9999px radius, at least 44px high, 16px horizontal padding minimum. Disabled buttons use Pale Sand fill with Soft Taupe text. **Only one primary button per view.** Button labels say exactly what will happen ("Add to cart", "Pre-order now", "Save changes"), and the same action keeps its name throughout the flow.

### 7.6 Product card

**Role:** The basic unit of browsing.

White surface, 28px radius, `card` shadow, no border, zero padding around the image. A 4:5 cover image with 20px inner radius. Beneath, a 12px to 16px text block:

1. Product name (14px or 16px, 500)
2. Price in the active currency (16px, 600, tabular figures)
3. Availability badge (see 7.7)

On desktop hover, the second image fades in and the image zooms very slightly. Optional small corner labels: "New", "Featured", "Sold out" as image-edge chips (12px radius, white fill at high opacity, Warm Ink 12px text).

### 7.7 Availability badges

**Role:** Make In Stock vs Pre-order unmistakable. Both must read at a glance without introducing a second accent color.

| State | Style | Content |
|-------|-------|---------|
| In Stock | White fill, 1px Hairline, small Warm Ink dot, Warm Ink 12px text | "In stock" |
| Pre-order | Gold Wash fill, Deep Gold text, small calendar icon | "Pre-order · arrives 12 Dec" |
| Sold out | Pale Sand fill, Soft Taupe text | "Sold out" |

Badges are 9999px radius, 12px text, 6px by 12px padding. The pre-order badge always includes the arrival date wherever it appears (card, detail page, cart, checkout, emails).

### 7.8 Category pill

**Role:** Quick access to categories.

White pill, 9999px radius, 1px Hairline border, `soft` shadow. Left: 16px outlined icon in Warm Ink or Champagne Gold (single color only). Right: 16px label in Warm Ink. Padding 6px vertical, 6px left, 16px right. The active category gets a Gold Wash fill and a gold outline. Categories are admin-created, so pills are generated from data and must wrap or scroll gracefully with any number.

### 7.9 Category section header

Left-aligned serif heading (24px to 32px) in Warm Ink with an optional quiet meta line beside it (result count or section note, `body` in Soft Taupe), and a "See all" link in Deep Gold with a 16px chevron at the right edge (approved plan 2026-10-19; the chevron moved from after the heading to the link). 24px bottom margin before the grid. No background, no border.

### 7.10 Product detail gallery

**Role:** Show a ring from up to four angles.

A large **square (1:1) main image** (20px inner radius inside a 28px card frame; the fixed square frame is the implemented crop — approved plan 2026-10-19) with thumbnails in a rail beneath it on mobile and beside it on desktop. Thumbnails are 56px to 64px squares with 12px radius and 2px gaps; the selected thumbnail has a Champagne Gold 2px outline. Swipe on mobile, click to zoom on desktop. Each image's label (for example "Worn on right hand") shows as a small caption chip on the image. Handles one to four images gracefully; no empty placeholder slots on the storefront.

### 7.11 Price block

Price at 24px or 28px sans, 600, tabular figures, in the active currency, with the currency symbol always visible. A small `$ | ₦` toggle sits next to it. If a compare-at price exists, it shows struck through in Soft Taupe at 14px. Never show two currencies in the same total.

### 7.12 Delivery estimator

**Role:** Show delivery fee and delivery days before checkout.

A white 28px-radius card (or a pill-shaped location input expanding into a card) containing: a location selector (pill input with search over admin-defined locations), then the result.

- In-stock result: "Delivery to Lekki: ₦8,000 · 2 to 4 days"
- Pre-order result: "Arrives 12 Dec. Shipping to Lekki: ₦11,200, then 2 to 4 days after arrival"
- Location not served: "We don't deliver to this location yet." with a contact link.

Fees update instantly when the currency switches. Result text is 14px to 16px Warm Ink; the fee is 600 weight.

### 7.13 Size selector

**Native dropdown**, 48px tall, full width of its half of the row: pill shape (9999px radius), white fill, 1px Hairline border, `body` label above it, and a Soft Taupe chevron on the right (the native arrow is hidden). Unavailable sizes appear as disabled options suffixed "(unavailable)". Size and quantity sit side by side as equal halves, stacking to one column on phones.

*(Amended 2026-10-19, client instruction: this replaced the previous "row of pill chips" rule, which took too much vertical space and wrapped awkwardly on the product page.)*

### 7.14 Filters

Desktop: a left-aligned filter row or panel using pills and checkboxes. Mobile: a slide-up sheet (28px top radius) with a sticky "Show results" primary button. Filter groups: category, type (engagement, female, male), material, color, shape, size, availability, price range. The price-range group is a **dual-thumb slider** over the catalog's price span (the range logic runs in the base currency; the readout and applied chip show the active currency), used in the shop's filter sidebar and the homepage Budget group. Active filters appear as removable chips above the grid.

### 7.15 Cart

A 28px-radius card layout. Items are separated into two clearly labeled groups: **Ready to ship** and **Pre-order**, each with its own delivery or shipping fee line and arrival date where relevant. Line items show a 64px image with 12px radius, name, size, quantity stepper (pill), unit price and line total. The summary shows subtotal, delivery fees (one line per group), and total in the active currency. One primary button: "Checkout".

### 7.16 Checkout

Short stepped layout: contact, delivery location and address, delivery summary, payment. The order summary stays visible (a sticky card on desktop, a collapsible card on mobile) with the tagline reassurance line beneath it. Inputs are pills (single-line) or 20px-radius text areas, with labels above and errors below.

### 7.17 Payment method selector

**Role:** Choose between BACHS and Paystack.

Two selectable cards (28px radius, white, hairline border when idle, gold 2px outline and Gold Wash tint when selected), each with the gateway's name and logo as supplied by the gateway's brand guidelines. If a gateway does not support the active currency, its card is disabled with a short explanation. Do not display gateway logos until permission or brand guidelines are confirmed.

### 7.18 Inputs and forms

Pill inputs (9999px), white fill, 1px Hairline border, 44px to 48px high, 16px text. Focus state: 2px Champagne Gold outline plus a visible offset ring. Error: 1px Status Error border, an icon, and a message below saying what went wrong and how to fix it. Labels sit above fields at 14px. Placeholders are examples, not instructions.

### 7.19 Toasts and banners

White 20px-radius card with `float` shadow and a small status icon. Action and confirmation wording match ("Added to cart", "Saved"). Auto-dismiss after a few seconds, except errors, which stay until dismissed.

### 7.20 Footer

Charcoal Band, columnar link groups (Shop, Help, Policies, Contact), tagline repeated, payment method marks as permitted, ivory text at 14px, hairline dividers at low opacity.

### 7.21 Cookie banner

White 28px-radius card at the bottom with a 14px body, an underlined inline link to the policy, and a pill "Accept" button (secondary style) plus a quiet "Manage" link. Needed because location detection and cookies are used.

### 7.22 Carousel arrow

32px circular white button, `float` shadow, 16px Warm Ink chevron, vertically centered at the right edge of horizontal rails. Rails also support touch swipe and keyboard focus.

### 7.23 Empty, loading and error states

- **Empty:** a short sentence that invites action ("No rings match these filters. Clear filters to see all rings."), one secondary button, optional small gold sparkle.
- **Loading:** skeleton blocks in Pale Sand tint, same radii as the real content.
- **Error:** says what happened and what to do next, in the interface's voice, without apologizing or vague wording.

---

## 8. Page Compositions

### 8.1 Homepage hero

A **centered constellation** on the ivory canvas, contained in the page width (client instruction, 2026-10-19; restores the original constellation and supersedes the editorial split of 2026-10-17).

**Center — copy.** The **tagline as the serif display headline** ("Luxurious rings at an affordable price"), centered, with a short supporting line in soft taupe beneath it, then a centered call-to-action row: the Champagne Gold primary button ("Shop rings") beside the Deep Gold text link ("See the pre-order collection").

**Around the copy — imagery.** Up to four featured-ring cards float around the headline (desktop: absolutely positioned at the corners of the hero box, each rotated a couple of degrees; mobile: two quiet cards in a row above the headline). The cards are `card` surfaces with `card` shadows; they are aria-hidden decoration — every ring is reachable through the grids below. The cards drift in once on load (the one orchestrated entrance, §6). The constellation is the page's one bold moment; keep everything else quiet.

Below the hero: a single centered row of category pills, then the Browse band with its sidebar and product grid. Sections are separated by 64px to 80px of space.

### 8.2 Product listing

Page header with category name and a short line. Filter and sort controls, then the product grid (2, 3 or 4 columns). "Load more" in a secondary pill button.

### 8.3 Product detail

Mobile: square gallery with thumb rail, name, then a **price + availability-badge row** (price block and badge share one line; approved plan 2026-10-19), description directly under the price (client instruction 2026-10-19), size selector (dropdown) and quantity stepper side by side as equal halves, capped at the available stock (in-stock: size stock; pre-order: product cap), delivery estimator, sticky bottom bar with price and the primary action ("Add to cart" for both in-stock and pre-order), then specifications as a **plain two-column definition list, no card** (client instruction 2026-10-19). Desktop: gallery on the left (thumb rail beside the main image), purchase panel on the right, specifications below, related rings after.

### 8.4 Cart and checkout

As in 7.15 and 7.16. Always show totals in the active currency and keep ready-to-ship and pre-order items visibly separate.

---

## 9. Admin Dashboard Design

The admin shares the same tokens and components so it feels like one product, but it favors density and efficiency.

- **Layout:** a **64px left sidebar rail** (white, no border, 24px Warm Ink icons in 48px tap targets, active item filled with Gold Wash at 20px radius, profile avatar at the bottom as a 32px circle with a hairline ring). This is the reference's rail, kept here because the admin has many sections. It expands to show labels on wide screens.
- **Pages:** dashboard, products, categories, orders, payments, delivery locations, settings.
- **Tables:** white surface, 20px outer radius, hairline row dividers, 14px text, sticky header. Status shown with the status colors plus icon and label.
- **Forms:** sectioned cards (Basic info, Specifications, Pricing, Availability, Images, Publishing).
- **Image uploader:** **four fixed slots** in a 2x2 or 4x1 grid of 20px-radius drop zones. Each slot has a drag handle for reordering, a label field (for example "Left hand", "Right hand"), progress, replace and remove controls. The first slot is marked "Cover". A fifth upload is refused with a clear message. Slot count shows "2 of 4 images".
- **Pricing field:** price entered once, with a live preview of the converted amount in the other currency using the current exchange rate.
- **Availability control:** a segmented pill toggle ("In stock" | "Pre-order"). Choosing Pre-order reveals a required arrival-date field.
- **Exchange rate and delivery location screens:** simple forms and tables with clear confirmation of what will change ("This updates the displayed price of 48 rings").
- **Dashboard cards:** white 28px-radius cards with `card` shadow, large figure in 600 weight, small label beneath. Totals show both currencies.

---

## 10. Content and Voice

- Warm, polished, reassuring. Short sentences. Sentence case.
- Name things the way shoppers say them: "Delivery," not "Fulfilment fee"; "Pre-order," not "Backorder."
- Buttons are verbs and say exactly what happens. The same action keeps its name across the flow (the "Pre-order now" button leads to a "Pre-order confirmed" message).
- Errors explain what went wrong and how to fix it. They do not apologize and are never vague.
- Examples: "Pre-order: arriving 12 Dec." "Delivery to Lekki: ₦8,000, 2 to 4 days." "We don't deliver here yet."
- The tagline wording is a product decision. Do not rewrite it. Do not invent claims (materials, certifications, guarantees, discounts) that have not been provided.

---

## 11. Accessibility and Quality Floor

- WCAG 2.1 AA target.
- Mobile first; usable from small phones upward.
- Visible keyboard focus on every interactive element (2px Champagne Gold outline with offset).
- Full keyboard navigation, including the gallery, filters, currency switcher and payment selector.
- Reduced motion respected.
- Contrast verified for every color pair (section 2.3).
- Status never conveyed by color alone.
- Alt text on all product images.
- Tap targets of at least 44px.
- Currency and number formatting uses the correct symbol and separators for the active currency.
- Loading, empty, error and success states exist for every data-driven view.

---

## 12. What Changed From the Reference, and Why

| Reference decision | This system | Reason |
|--------------------|-------------|--------|
| Violet `#5433eb` as the single accent | Champagne Gold `#C9A24B` as the single accent | The brief calls for luxury, gold and elegance |
| Violet-tinted shadow on the submit button | Gold-tinted `gold-glow` on the primary button | Keeps the accent reinforced in elevation, with gold |
| Cool-gray canvas `#F2F4F5` | Warm ivory `#FBF8F3` | Warm tone suits gold and jewelry **[Confirm]** |
| Pure black text `#000000` | Warm ink `#211D19` | Softer, more refined **[Confirm]** |
| White text on accent button | Warm Ink text on gold button | White on gold fails contrast |
| Single proprietary sans, never serif | Serif for display plus sans for UI **[Confirm]** | "Elegance" and luxury cues from the brief |
| Weights all 400 | 400, 500, 600 | Prices and buttons need legible emphasis; still no bold 700 |
| 9px and 11px micro text | 12px absolute floor | Accessibility and legibility on phones |
| Star ratings and review counts | Removed | Reviews are out of scope for version 1 |
| Left sidebar rail on the storefront | Top header on the storefront; sidebar rail kept for admin | Stores need a visible currency switcher, categories and cart |
| App download banner | Tagline announcement bar | The tagline must appear across the platform |
| Category icons in native brand colors | Single-color icons (gold or ink) | Preserves the one-accent rule |
| 1:1 product crops | 4:5 product card crops **[Confirm]** | Matches the product requirements for a consistent ratio; better suits rings on hands |
| "No colored backgrounds, no gradients, no decorative shapes" | Kept, with three exceptions: Gold Wash for badges and selected states, a rare gold sparkle glyph, and the irregular canvas grain (§4.6) | Needed for the "cute" and "gold" requirements without clutter |
| No semantic colors | Three restricted status colors | Needed for payment, order and form feedback |
| Pills at both 20px and 9999px | All pills 9999px; 20px reserved for inner image radius and text areas | Resolves the inconsistency |
| Hero wordmark above floating cards | Tagline headline with an editorial image pair | The tagline is the brand promise and must be prominent |
| Odd spacing values (10, 11, 38) | Clean 4-to-80 scale | Consistency |
| Product category content (fashion, beauty, home) | Admin-created ring categories | Categories are managed by the store owner |
| Earth-tone lifestyle imagery guidance | Neutral or soft warm backdrops that let gold and gems read clearly | Rings are small and reflective |

New components added because the product requires them: currency switcher, availability badges, price block, delivery estimator, size selector, product gallery with labeled angles, cart with two shipment groups, payment method selector, filters, admin forms, four-slot image uploader, tables and status styles.

---

## 13. Open Design Questions

These are unanswered and must be settled with the product owner. Do not treat any **[Confirm]** item as final until they are.

1. **Brand name and logo:** what is the store called, and is there a logo or wordmark? (A placeholder wordmark is used until then.)
2. **Exact gold:** is Champagne Gold `#C9A24B` right, or do you have a brand gold (cooler, warmer, rose gold)?
3. **Canvas and ink:** are warm ivory and warm ink approved, or do you prefer a pure white or cool-gray canvas as in the reference?
4. **Typefaces:** are an elegant serif plus a clean sans approved? Any fonts you already own or prefer? (Remember the `₦` glyph test.)
5. **Product image ratio:** is 4:5 acceptable for cards, or do your photos suggest square or another ratio?
6. **Status colors:** are the restricted green, red and amber acceptable for status messages?
7. **Cute detail:** is a small gold sparkle or diamond glyph the right level of "cute," or do you want something else (or nothing)?
8. **Gateway logos:** do you have permission and brand guidelines to display the BACHS and Paystack logos?
9. **Photography:** do you have product photos in a consistent style, or should placeholders be used? How should placeholders be marked?
10. **Dark mode:** is a dark theme needed, or light only?

---

## 14. Quick Start: CSS Custom Properties

Framework-agnostic. The technology stack is still undecided.

```css
:root {
  /* Colors */
  --color-ivory-canvas: #FBF8F3;
  --color-pure-white: #FFFFFF;
  --color-warm-ink: #211D19;
  --color-soft-taupe: #7A7168;
  --color-hairline: #ECE6DC;
  --color-pale-sand: #D9D2C6;
  --color-champagne-gold: #C9A24B;
  --color-deep-gold: #8A6A1F;
  --color-gold-wash: #F1E6C8;
  --color-charcoal-band: #2B2622;

  /* Status (restricted use) */
  --color-status-success: #3F7A57;
  --color-status-error: #B3402F;
  --color-status-warning: #A8741A;

  /* Typography: families (final choice pending) */
  --font-display: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  /* Typography: scale */
  --text-display: 44px;
  --text-heading-lg: 28px;
  --text-heading: 22px;
  --text-subheading: 18px;
  --text-body-lg: 16px;
  --text-body: 14px;
  --text-label: 12px;

  /* Typography: weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-6: 6px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;

  /* Layout */
  --page-width: 80%;
  --section-gap: 64px;
  --element-gap: 12px;
  --tap-target: 44px;

  /* Radius */
  --radius-card: 28px;
  --radius-image: 20px;
  --radius-textarea: 20px;
  --radius-chip-label: 12px;
  --radius-pill: 9999px;

  /* Shadows */
  --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.10), 0 2px 4px -2px rgba(0, 0, 0, 0.10);
  --shadow-float: 0 4px 24px rgba(0, 0, 0, 0.12);
  --shadow-gold-glow: 0 4px 24px rgba(201, 162, 75, 0.34);

  /* Surfaces */
  --surface-canvas: #FBF8F3;
  --surface-surface: #FFFFFF;
  --surface-elevated-card: #FFFFFF;
  --surface-dark-band: #2B2622;

  /* Motion */
  --motion-fast: 150ms;
  --motion-base: 250ms;
}

@media (max-width: 640px) {
  :root {
    --text-display: 34px;
    --text-heading-lg: 26px;
    --text-heading: 22px;
    --section-gap: 64px;
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-fast: 0ms;
    --motion-base: 0ms;
  }
}
```

---

## 15. Do's and Don'ts

### Do
- Use 28px radius for cards and sheets, 20px for inner images, and 9999px for every button, input, chip and badge.
- Keep gold as the only saturated color. Use it for the primary action, search submit, active states and fine details.
- Put Warm Ink text on gold fills.
- Use the dual-layer `card` shadow on every elevated card, and separate cards by the white-on-ivory shift instead of borders.
- Show price, currency, availability, arrival date and delivery cost clearly, every time.
- Keep 64px to 80px between major sections.
- Test every price string with the `₦` symbol in the chosen fonts.
- Ask the product owner whenever the system does not cover a state, component or token.

### Don't
- Do not add a second accent color. The three status colors are for status only.
- Do not use white text on gold.
- Do not use bold (700+) weights.
- Do not set body text below 16px for primary content, or any text below 12px.
- Do not put gold text at small sizes on light surfaces.
- Do not add visible borders to elevated cards.
- Do not use sharp corners on cards, buttons or inputs.
- Do not use gradients, illustrations or decorative shapes beyond the rare gold sparkle and the canvas grain (§4.6).
- Do not show star ratings or review counts in version 1.
- Do not rely on color alone to convey availability or status.
- Do not reuse the other brand's name, logo, wordmark, copy or fonts.