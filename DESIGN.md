# DESIGN.md: Sapphire UI Design System

> Flat, dense, quiet surfaces. One gold accent. Dark and light, side by side.

**Theme:** light (default) + dark (manual toggle)
**Product:** Luxury ring e-commerce store (storefront and admin dashboard)
**Brand promise:** Luxurious rings at an affordable price.
**Brand feel:** Sleek, a little cute, luxurious, gold, elegant.

---

## 0. Source and Precedence

This design system was **replaced on 2026-10-20**. Its structure now derives from a personal-finance dashboard reference (flat surfaces, 10px cards, hairline rows, a card header of *title + subtitle + scope control*, a data/status palette, and a first-class dark theme). That reference supplied the *layout and component grammar*; it did **not** supply the brand.

**Deliberate deviations from that reference (client decisions, 2026-10-20):**

1. **One gold accent is kept.** The reference uses no brand accent and lets data colors lead. Sapphire keeps **gold as the only brand accent** (§2.4) for the wordmark, primary actions and active states. Data/status colors (§2.5) are reserved for data and status, exactly as in the reference.
2. **Commerce components are kept.** The reference is a finance app; this is a ring store. Cart, currency switcher, availability badges, price block, delivery estimator, size selector, product gallery, filters and the four-slot image uploader remain, restyled to the new grammar.
3. **Imagery still leads the storefront.** The reference is text-and-data first; Sapphire's storefront keeps the ring photography as the hero (§5).

The previous gold/ivory/serif system is preserved in **Appendix A — Superseded (2026-10-20)**. Section 12 records what changed and why. Items marked **[Confirm]** are proposals awaiting the product owner (see §15).

---

## 1. Design Principles

1. **Quiet surfaces, loud data.** Surfaces are low-contrast against each other; the eye goes to figures and charts first. On the storefront, the eye goes to the ring photography first.
2. **Cards are widgets.** Every block is a self-contained card with its own title, a contextual subtitle, and (where scope applies) a dropdown. Cards separate by tone change and hairlines, never by heavy boxes or shadows.
3. **Title plus context.** Card headers pair a title with a muted descriptor on the same baseline: `Orders  Most recent`, `Revenue  Last 30 days`, `Goals  Your top 2 priorities`. The descriptor carries the key fact or scope.
4. **One gold accent.** Gold marks the brand and the primary action. Keeping it singular is what keeps it precious.
5. **Colour means status, never decoration.** Red is negative or over-budget; green is positive or progress; amber is pending or low. Status is always paired with an icon and a label, never colour alone.
6. **Clarity before charm.** Price, currency, availability, arrival date and delivery cost must always be easy to read.
7. **Mobile first.** Most customers shop on phones. Design the phone layout first.
8. **Flat and disciplined.** Depth comes from tone (three surface levels), not shadows. No glows on cards.

---

## 2. Foundations

### 2.1 Surfaces (three tones)

Depth is expressed by three surface levels only. There are **no card drop shadows** (the sole exception is menus/popovers, §2.8).

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--surface-app` | `#F6F6F4` | `#171717` | Page canvas, sidebar background, top bar |
| `--surface-card` | `#FFFFFF` | `#202020` | Cards, sheets, inputs, tables |
| `--surface-raised` | `#F0F0EE` | `#262626` | Dropdown triggers, actions, active nav item, icon chips |
| `--surface-hover` | `#EAEAE7` | `#2A2A2A` | Row and nav hover |
| `--surface-active` | `#E4E4E0` | `#2B2B2B` | Active nav item, pressed controls |

The dark theme's three tones (`#171717` / `#202020` / `#262626`) are the reference's values. The light theme is the reference's derived light mapping (§14), tuned warm by one step to suit gold.

### 2.2 Lines, tracks and hairlines

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--border-subtle` | `#E6E6E3` | `#2C2C2C` | Card header and row dividers, dropdown outlines |
| `--border-default` | `#D6D6D2` | `#3A3A3A` | Control outlines, chart gridlines (lower alpha) |
| `--track` | `#E6E6E3` | `#333333` | Empty portion of progress bars, axis baseline |
| `--track-flat` | `#ECECE9` | `#2B2B26` | Empty bar for a zero budget (near-invisible) |

### 2.3 Text

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--text-primary` | `#1A1A1A` | `#F5F5F5` | Titles, values, row names, active nav labels |
| `--text-secondary` | `#5A5A5A` | `#B3B3B3` | Nav labels (inactive), control text, axis labels |
| `--text-muted` | `#6B6B6B` | `#8C8C8C` | Card subtitles, meta lines, dates |
| `--text-disabled` | `#A0A0A0` | `#5E5E5E` | Disabled controls |

**Do not go lighter than `--text-muted` for informational text.** In dark mode `#8C8C8C` on `#202020` is about 4.9:1 (AA). In light mode `#6B6B6B` on `#FFFFFF` is about 5.3:1 (AA). Verify any change against WCAG AA.

### 2.4 Brand accent (gold)

Gold is the **only** brand accent: the wordmark mark, the primary button, active/selected indicators, the search submit and focus rings. It is not a data colour.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--accent` | `#C9A24B` | `#D9B45F` | Primary fills, selected states, focus ring |
| `--accent-strong` | `#8A6A1F` | `#E6C77A` | Gold as *text or small icons on light/dark surfaces* (links, price highlights, pre-order date) |
| `--accent-wash` | `#F1E6C8` | `#3A2F17` | Soft gold tint for badge fills and selected surfaces |
| `--accent-contrast` | `#211D19` | `#211D19` | Text/icons placed **on** a gold fill (never white) |

**Gold fails as small text on a light surface.** Use `--accent-strong`, not `--accent`, for gold-toned text. Text on a gold fill is always `--accent-contrast`. The dark-theme gold is lightened slightly so it reads on near-black.

### 2.5 Data and status colours (restricted use)

These never appear on chrome, buttons or the wordmark. They mean data or status only, always with an icon or label.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--danger` | `#C93A3F` | `#E5484D` | Over-budget bars, failed payment |
| `--danger-text` | `#C93A3F` | `#F26B6F` | Negative amounts, downward trends |
| `--success` | `#1F9D4F` | `#3DBE6B` | Paid, positive delta, goal progress |
| `--warning` | `#A8741A` | `#F5B83A` | Pending payment, low stock, "this period" |
| `--info` | `#2255D6` | `#5B8DEF` | Informational tags, category dots |

Twelve data series maximum are drawn from `--accent`, `--accent-strong`, `--info`, `--warning`, `--success`, `--danger` and tint steps between them. Charts (§7) always carry a label per series, so colour is never the only signal.

### 2.6 Typography

- **Family:** **Inter** only (display and body). Playfair Display is **dropped** from headings; hierarchy comes from size, weight and spacing, not family contrast (client decision, 2026-10-20).
- **Numerals:** `font-variant-numeric: tabular-nums` on every currency value so columns align.
- **Weights:** 400 body, 500 labels/controls, 600 titles and primary values. **Never 700+.**
- **Sentence case everywhere.** Never all caps, never letter-spacing tricks, never decorative eyebrow labels.

| Role | Size / line-height | Weight | Colour | Example |
|------|--------------------|--------|--------|---------|
| Page greeting | 20 / 28 | 600 | primary | "Welcome back, Ada" |
| Card title | 19 / 26 | 600 | primary | "Orders", "Revenue" |
| Card subtitle (inline) | 17 / 26 | 400 | muted | "Most recent" |
| Hero metric | 20 / 28 | 600 | primary | "$1,213.11 revenue" |
| Delta metric | 17 / 24 | 500 | success / danger-text | "$86.65 average" |
| Row label (large) | 17 / 24 | 500 | primary | "In stock", "Pre-order" |
| Row value | 15 / 22 | 500 | primary | "$9,800 spent" |
| Row meta | 15 / 22 | 400 | muted | "$8,000 budget" |
| Nav item | 16 / 24 | 500 | secondary / primary when active | "Orders" |
| Table amount | 17 / 24 | 500 | primary, tabular | "$1,830.00" |
| Chart axis label | 13 / 16 | 400 | secondary | "Day 17", "$11K", "Sep 15" |
| Chart legend | 12 / 16 | 400 | muted | "This month last year" |
| Caption | 13 / 18 | 400 | muted | "Vacation" |

This scale replaces the old one. The old 12px floor still applies: **nothing smaller than 12px**; primary body is 15–16px, secondary is 13–15px.

### 2.7 Spacing, radius and layout

**Spacing** — 4px base, 8px dominant rhythm:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Icon-to-text micro gaps |
| `--space-2` | 8px | Gap between inline items |
| `--space-3` | 12px | Gap between icon chip and label |
| `--space-4` | 16px | Gap between cards; control padding |
| `--space-5` | 20px | Card inner padding |
| `--space-6` | 24px | Section separation |
| `--space-8` | 32px | Large separation |

**Radius:**

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Controls, dropdown triggers, buttons, thumbnails |
| `--radius-md` | 10px | Cards, sheets, sidebar active item, promo blocks |
| `--radius-full` | 999px | Progress bars, avatars, icon chips, dots, pills |

The reference has no pill *buttons*; Sapphire keeps pill controls **only** for the currency switcher, availability badges and filter chips (where they read as "cute" per the brief), and uses the 6px control radius elsewhere.

**Layout:**
- **App shell:** `grid-template-columns: var(--sidebar-w) 1fr`. Sidebar `--sidebar-w` = 224px, fixed, full height, same tone as the canvas.
- **Dashboard grid:** 2 equal columns, `repeat(2, minmax(0, 1fr))`, 16px gap, independent masonry-style column stacks. Left/right split as the page requires.
- **Storefront page width:** 80% of the viewport, centred (retained), or a 1200px cap on very wide screens **[Confirm]**.
- **Section gap:** 64px mobile, 80px desktop.
- **Grid:** 2 columns phones, 3 tablets, 4 desktop for product grids.
- **Touch targets:** at least 44px; icon buttons at least 36×36.

### 2.8 Elevation

Flat by default. Cards use no shadow; depth is tone change only (§2.1). The **only** permitted shadows:

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-menu` | `0 8px 24px rgba(0,0,0,.5)` (dark) / `0 8px 24px rgba(0,0,0,.12)` (light) | Menus, popovers, dropdowns |
| `--shadow-float` | `0 4px 24px rgba(0,0,0,.12)` | Sticky header on scroll, toasts |

No glows. The old `gold-glow` and `card` shadows are removed.

### 2.9 Motion

Minimal and purposeful. All values in milliseconds.

| Interaction | Spec |
|-------------|------|
| Hover / press transitions | 120ms ease-out on background and border colour |
| Dropdown open | 140ms fade + 4px translate-y, ease-out |
| Chart first render | Line draws left→right over 600ms; area fades in over 400ms; bars grow 400ms — once per page load |
| Progress bars | Width animates 400ms ease-out on first paint and on data change |
| Hero entrance (storefront) | The one orchestrated moment: hero copy/imagery drift in once on load |
| Reduced motion | Disable draw-in, translate and drift; keep instant state/colour changes |

No entrance animation on every card, no parallax, no hover lift.

---

## 3. Iconography

- Outline icons, 1.5px stroke, 20px box, Lucide/Feather style.
- Icon colour follows its label (secondary; primary when active; gold when it is the active/selected indicator).
- Header utility icons (search, bell, settings, theme toggle, sidebar toggle) are 20px in 36×36 targets, 36px apart.
- Category glyphs in lists are single-colour (gold or ink), never multi-colour.

---

## 4. Application shell (admin and storefront)

### 4.1 Admin shell

```
┌────────────┬──────────────────────────────────────────────────────────┐
│ 224px rail │  Page title                              [ Add product ] │
│            │                                                          │
│ nav …      │  ┌─────────────┐  ┌─────────────┐                        │
│            │  │ card        │  │ card        │   ← 2-col grid, 16px   │
│ ─────────  │  └─────────────┘  └─────────────┘                        │
│ trial/user │                                                          │
└────────────┴──────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Sidebar | 224px, fixed, full height, `--surface-app`, no border |
| Nav item | 44px tall, `0 12px` padding, radius 10, icon 20px + 12px gap + label, secondary; active = `--surface-active` + primary |
| Content | `--surface-app`; page padding 16–24px; dashboard 2-col grid, 16px gap |
| Top bar | ~64px; page title left-aligned with the first column; primary action right |
| Collapse | 1024–1279px → icon rail (64px) via the sidebar toggle; 640–1023px → overlay drawer; <640px → bottom tab bar |

The previous 64px icon rail becomes the *collapsed* state, not the default.

### 4.2 Compositions

- **Dashboard:** stats row (hero + counts), sales trend, category/availability donuts, best sellers, orders-by-status, recent orders.
- **Products / Orders / Payments / Categories / Delivery / Settings / Admins:** a page title row with the primary action, then a full-width card holding a table (hairline rows). List pages may carry a compact metric strip under the title.
- **Storefront:** header, hero, category pills, browse band (sidebar + grid), product detail, cart, checkout, policies — all restyled to the new tokens.

---

## 5. Imagery (storefront)

- Product photography is the main source of colour; the UI stays neutral so gold and stones read.
- **Up to four images per ring**, each with an optional label (front, side, on left hand, on right hand, close-up). Cover is the first.
- **Card crop:** 4:5 aspect ratio; inner image radius 6px inside the card's 10px radius (a thin frame). Product detail uses a fixed 1:1 frame.
- Neutral or soft warm backdrops; consistent lighting across the catalog.
- No illustrations, no 3D, no gradients on product imagery.
- Alt text on every image uses the label plus the product name.
- On the storefront the hero is the one bold moment; keep the rest quiet.

---

## 6. Components

### 6.1 Card (base widget)

```
┌──────────────────────────────────────────────┐
│ Title  Subtitle                  [ Dropdown ▾]│  ← header, 20px pad, bottom hairline
├──────────────────────────────────────────────┤
│ body                                          │
└──────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Background | `--surface-card` |
| Outer border | none (tone difference only) |
| Radius | 10px, `overflow: hidden` |
| Header | 20px padding; flex row, `align-items: center`; title + subtitle baseline-aligned; optional scope control pinned right; 1px `--border-subtle` hairline below |
| Body | Full-bleed rows with dividers, or padded chart/content area |
| Bottom padding | 16–20px so the last divider does not touch the edge |

### 6.2 Dropdown / scope control

Height 36–40px, padding `0 12px 0 16px`, `--surface-raised`, 1px `--border-default`, radius 6, text 16/24 (400) primary, chevron-down 16px secondary right. Hover brightens the border; open rotates the chevron 180° and opens a menu below (same width, min 180px, `--shadow-menu`).

### 6.3 Button

| Variant | Fill | Text | Use |
|---------|------|------|-----|
| Primary | `--accent` | `--accent-contrast`, 500 | Add to cart, Pre-order now, Pay, Save |
| Secondary | `--surface-raised` + 1px `--border-default` | primary, 500 | Secondary actions |
| Quiet | transparent | primary or `--accent-strong` | Tertiary actions, text links |
| Destructive | transparent + 1px `--danger` | `--danger` | Delete, Cancel order (admin) |

Height 36–44px, padding `0 16px`, radius 6. **Only one primary button per view.** Labels say exactly what happens; the same action keeps its name throughout the flow. Disabled uses `--surface-raised` fill + `--text-disabled`.

### 6.4 Nav item / list row / table row

- **Nav item:** 44px tall, radius 10, `--surface-hover` on hover, `--surface-active` when active.
- **List row:** ~50px tall, `0 20px` padding, 1px `--border-subtle` dividers, `--surface-hover` on hover, whole row clickable, single-line ellipsis truncation (never wrap).
- **Table:** `--surface-card`, radius 10, hairline row dividers, 15px text, sticky header, tabular amounts right-aligned. Status = colour + icon + label.

### 6.5 Progress / budget bar

Height 6–8px, radius full, track `--track`. Fill `--accent` for progress, `--success` for goal/reached, `--danger` when over budget. A thin vertical tick marks a budget threshold where relevant. `role="progressbar"` with `aria-valuenow/min/max`. Zero-value bars use `--track-flat`.

### 6.6 Badge / chip / pill

Pills (999px) are reserved for the **currency switcher**, **availability badges** and **filter chips**:

| State | Style | Content |
|-------|-------|---------|
| In stock | `--surface-card` + 1px `--border-subtle`, small ink dot, 12px text | "In stock" |
| Pre-order | `--accent-wash` fill, `--accent-strong` text, calendar icon | "Pre-order · arrives 12 Dec" |
| Sold out | `--track` fill, `--text-muted` text | "Sold out" |

The pre-order badge always includes the arrival date wherever it appears.

### 6.7 Currency switcher

Compact two-option pill (`$ USD` / `₦ NGN`), 999px, `--surface-card`, hairline border; the active option has `--accent-wash` fill, primary text and a gold inner outline. Always visible in the header and repeated near the product-detail price. Switching crossfades prices; the choice is remembered.

### 6.8 Inputs and forms

Single-line controls: `--surface-card`, 1px `--border-default`, radius 6, 44–48px, 16px text, label above at 15px. Focus: 2px `--accent` outline + offset ring. Error: 1px `--danger` border + icon + a message that says how to fix it. Textareas use radius 6 as well.

### 6.9 Toast

`--surface-card`, radius 10, `--shadow-float`, a status icon and a thin status-colour accent at the leading edge, pinned top-right below the header, slides in from the right. Auto-dismiss except errors.

### 6.10 Product card (storefront)

`--surface-card`, radius 10, no shadow, zero padding around the image. 4:5 cover, 6px inner radius. Below: product name (15px, 500), price (16px, 600, tabular), availability badge. Desktop hover: second image fades in, very slight zoom. Optional corner chips ("New", "Featured", "Sold out").

### 6.11 Price block, size selector, delivery estimator

- **Price block:** price at 22–28px, 600, tabular, active currency; a small `$ | ₦` toggle beside it; compare-at struck through in `--text-muted`.
- **Size selector:** native dropdown, 48px, radius 6, `--surface-card`, hairline border, label above, chevron right; unavailable options suffixed "(unavailable)".
- **Delivery estimator:** a `--surface-card` card (radius 10) with a location selector, then the result ("Delivery to Lekki: ₦8,000 · 2 to 4 days"). Fees update instantly on currency switch.

### 6.12 Image uploader (admin)

Four fixed slots in a 2×2 or 4×1 grid, 10px-radius drop zones. Each slot has a drag handle, a label field ("Left hand", "Right hand"), progress, replace and remove. The first slot is marked "Cover". A fifth upload is refused with a clear message; the count shows "2 of 4 images".

---

## 7. Data visualization

Charts are hand-built SVG/HTML (no chart library, project decision) and must satisfy:

- **Accessible:** every chart is a `<figure>` with an `sr-only` data table, or an `aria-label` summary of key values.
- **Labelled:** every series/slice/bar carries a label; colour is never the only signal.
- **Flat:** horizontal gridlines only, 1px `--border-default` at low alpha; no chart borders or backgrounds.
- **Tokens only:** series colours come from §2.4/§2.5; gold leads the primary series.
- **Types in use:** donut (part-to-whole), vertical column trend, ranked horizontal bars, status bars.
- **Empty/error:** flat dashed baseline + one-line explanation; error uses `--danger-text` text, never a red background.
- **Animation:** bars grow and lines draw in once on first render (400–600ms), disabled under reduced motion (§2.9).

Chart axis labels are 13px `--text-secondary`; legends are 12px `--text-muted`.

---

## 8. Content and Voice

- Warm, polished, reassuring. Short sentences. Sentence case. **Never all caps.**
- Name things the way shoppers say them: "Delivery", not "Fulfilment fee"; "Pre-order", not "Backorder".
- Buttons are verbs and say exactly what happens; the same action keeps its name across the flow.
- Errors explain what went wrong and how to fix it; never apologize, never vague.
- Examples: "Pre-order: arriving 12 Dec." "Delivery to Lekki: ₦8,000, 2 to 4 days." "We don't deliver here yet."
- The tagline wording (`Luxurious rings at an affordable price.`) is a product decision. Do not rewrite it, and do not invent claims (materials, certifications, guarantees, discounts) that have not been provided.

---

## 9. Accessibility and Quality Floor

- **WCAG 2.1 AA.** Primary text ~14:1 on cards; muted text at or above 4.5:1. Never go lighter than `--text-muted` for informational text.
- **Colour is never the only signal.** Status pairs colour with an icon and a label; over-budget pairs a red bar with a signed negative amount.
- **Focus:** visible 2px `--accent` outline with offset on every interactive element.
- **Targets:** min 36×36 icon buttons, 44px nav and list rows.
- **Semantics:** sidebar `<nav aria-label="Primary">`; cards `<section aria-labelledby>`; progress `role="progressbar"`; dropdowns follow the listbox/menu-button pattern; charts expose a table or summary.
- **Truncated text:** full text via `title` or tooltip.
- **Reduced motion** respected throughout.
- **Mobile first;** usable from small phones upward.
- Loading, empty, error and success states exist for every data-driven view.

---

## 10. Dark and light theme

- **Default:** light, always (client instruction, 2026-10-21). The theme no longer follows the OS `prefers-color-scheme`.
- **Override:** a manual toggle in the header (storefront) and the sidebar (admin), persisted in `localStorage` and applied via `data-theme="dark|light"` on `<html>`.
- **Implementation:** all colour tokens are defined for `:root` (light) and overridden under `[data-theme="dark"]`. Dark applies only from an explicit saved choice. Components reference tokens only — no hard-coded colours.
- **Both themes are first-class.** Every token pairing must pass contrast in both (§2.3).

---

## 11. Design tokens (copy-paste)

```css
:root {
  color-scheme: light;

  /* Surfaces */
  --surface-app: #F6F6F4;
  --surface-card: #FFFFFF;
  --surface-raised: #F0F0EE;
  --surface-hover: #EAEAE7;
  --surface-active: #E4E4E0;

  /* Lines / tracks */
  --border-subtle: #E6E6E3;
  --border-default: #D6D6D2;
  --track: #E6E6E3;
  --track-flat: #ECECE9;

  /* Text */
  --text-primary: #1A1A1A;
  --text-secondary: #5A5A5A;
  --text-muted: #6B6B6B;
  --text-disabled: #A0A0A0;

  /* Gold accent (brand only) */
  --accent: #C9A24B;
  --accent-strong: #8A6A1F;
  --accent-wash: #F1E6C8;
  --accent-contrast: #211D19;

  /* Data / status (restricted) */
  --danger: #C93A3F;
  --danger-text: #C93A3F;
  --success: #1F9D4F;
  --warning: #A8741A;
  --info: #2255D6;

  /* Type */
  --font-sans: var(--font-inter), Inter, "SF Pro Text", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  /* Space */
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px; --space-8: 32px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-full: 999px;

  /* Elevation (menus/sticky only) */
  --shadow-menu: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-float: 0 4px 24px rgba(0, 0, 0, 0.12);

  /* Layout */
  --sidebar-w: 224px;
  --grid-gap: 16px;
  --row-h: 50px;
  --nav-h: 44px;

  /* Motion */
  --motion-fast: 120ms;
  --motion-base: 140ms;
  --motion-chart: 600ms;
}

[data-theme="dark"] {
  color-scheme: dark;

  --surface-app: #171717;
  --surface-card: #202020;
  --surface-raised: #262626;
  --surface-hover: #2A2A2A;
  --surface-active: #2B2B2B;

  --border-subtle: #2C2C2C;
  --border-default: #3A3A3A;
  --track: #333333;
  --track-flat: #2B2B26;

  --text-primary: #F5F5F5;
  --text-secondary: #B3B3B3;
  --text-muted: #8C8C8C;
  --text-disabled: #5E5E5E;

  --accent: #D9B45F;
  --accent-strong: #E6C77A;
  --accent-wash: #3A2F17;
  --accent-contrast: #211D19;

  --danger: #E5484D;
  --danger-text: #F26B6F;
  --success: #3DBE6B;
  --warning: #F5B83A;
  --info: #5B8DEF;

  --shadow-menu: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-float: 0 4px 24px rgba(0, 0, 0, 0.5);
}

@media (prefers-reduced-motion: reduce) {
  :root { --motion-fast: 0ms; --motion-base: 0ms; --motion-chart: 0ms; }
}
```

Tailwind (v4) exposes these through `@theme` using `--color-*`, `--radius-*`, `--shadow-*` and `--font-*` names that map to the tokens above.

---

## 12. What Changed on 2026-10-20, and Why

| Previous system | New system | Reason |
|-----------------|------------|--------|
| Detached warm-ivory canvas `#FBF8F3` + grain | Three flat tones; light `#F6F6F4` and dark `#171717` | The finance reference is flat and dark-first; the client asked for light + dark |
| 28px cards, 20px images, pill buttons/inputs | 10px cards, 6px controls, pills only for badges/currency/filters | The reference's tighter radius reads denser and less "templated" |
| Dual-layer `card` shadow on every card | Flat; tone change only; shadow only on menus/sticky | The reference is explicitly flat; shadows on dark read as grime |
| Playfair Display + Inter | Inter only | The reference is single-family; hierarchy from size/weight |
| One gold accent | **Kept** as the sole brand accent (light + dark) | Deliberate deviation: Sapphire's brief is "luxurious gold" (§0) |
| Restricted green/red/amber status | Full data palette (red/orange/green/blue/yellow) + one info blue | Charts and budgets need more than three status colours; still never chrome |
| Light only | Light + dark, light-default + manual toggle | Client instruction (2026-10-20; default changed to light 2026-10-21) |
| Cormorant→Playfair (2026-10-19) | Playfair dropped | Superseded by the single-family decision |

---

## 13. Open Design Questions

1. **Brand name and logo** — final wordmark and logo? (Placeholder in use.)
2. **Exact gold** — `#C9A24B` / `#D9B45F` correct, or a brand gold?
3. **Light canvas warmth** — is `#F6F6F4` right, or a warmer ivory?
4. **Product image ratio** — 4:5 for cards confirmed?
5. **Dark-mode photography** — do product shots work on `#202020`, or do they need a light frame?
6. **Gateway logos** — permission/brand guidelines for BACHS and Paystack logos?
7. **Photography** — real photos or placeholders, and how to mark placeholders?
8. **Default theme** — resolved 2026-10-21: light, with a manual dark toggle.
9. **Storefront page width** — keep 80% or cap at 1200px?

---

## 14. Do's and Don'ts

### Do
- Separate cards by tone and 16px gaps; keep them flat, one radius (10px).
- Keep surfaces low-contrast; let figures, charts and photography lead.
- Put the key number in the card header so it reads without the chart.
- Use tabular numerals for every currency value.
- Pair every status colour with an icon and a label.
- Use gold for the brand and the one primary action per view.
- Use tokens for every colour, radius and shadow — in both themes.

### Don't
- Don't add card shadows, glows or gradients on surfaces.
- Don't use all caps, letter-spacing or decorative eyebrow labels.
- Don't add a second *chrome* accent beyond gold; data colours are for data only.
- Don't put gold text at small sizes on a light surface (use `--accent-strong`).
- Don't put white text on a gold fill (use `--accent-contrast`).
- Don't use weights 700+.
- Don't convey status, over-budget or loss states by colour alone.
- Don't set primary body below 15px or any text below 12px.
- Don't reuse another brand's name, logo, copy or fonts.

---

## Appendix A — Superseded (2026-10-20)

The system below was in force from 2026-10-17 to 2026-10-20 and is retained for reference only. Do not build against it. It is the "warm ivory canvas, 28px pillowy cards, Playfair + Inter, one champagne-gold accent, light only" system.

**Summary of the superseded system:**

- **Canvas:** warm ivory `#FBF8F3` with an irregular `feTurbulence` grain, rendered once in the root layout (`PatternBackground`).
- **Surfaces:** Pure White `#FFFFFF` cards; Charcoal Band `#2B2622` for the announcement bar and footer.
- **Text:** Warm Ink `#211D19`; Soft Taupe `#7A7168` secondary; Hairline `#ECE6DC` borders; Pale Sand `#D9D2C6` disabled.
- **Accent:** Champagne Gold `#C9A24B`; Deep Gold `#8A6A1F` for gold text; Gold Wash `#F1E6C8` for tints.
- **Status:** success `#3F7A57`, error `#B3402F`, warning `#A8741A`.
- **Radius:** cards 28px, inner images 20px, everything else 9999px.
- **Shadows:** soft / card (dual-layer) / float / gold-glow.
- **Type:** Playfair Display (display/headings) + Inter (body/UI/prices); scale display 44 / heading-lg 28 / heading 22 / subheading 18 / body-lg 16 / body 14 / label 12.
- **Layout:** storefront page width 80%; admin 64px left icon rail with `max-w-5xl` removed on 2026-10-20.
- **Motion:** one orchestrated hero entrance; 150–250ms transitions; toast and chart draw-ins.

The full prior text of this design system, including its component and page-composition sections, is preserved in the git history at the commit immediately before the 2026-10-20 replacement.
