# Ralypto - UI/UX Design System & Ergonomic Rules

In a busy, fast-paced restaurant environment with grease on fingers, bright kitchen lighting, and rushing staff, UI elegance must meet brutal operational speed and ergonomic reliability.

---

## 1. Touch Target & Typography Ergonomics

1. **Touch Targets (Min 48px)**:
   - All interactive touch targets (buttons, table cards, menu cards, keypad numbers) must be at least **48px x 48px** (preferably **56px–64px** for primary actions).
   - Touch padding between adjacent buttons must be at least **8px** to prevent accidental mis-taps.
2. **High-Legibility POS Typography**:
   - Base font size on POS and Kitchen screens must be **at least 16px** (`text-base`).
   - Prices, table numbers, and order totals must use large bold typography (**18px to 28px**).
   - Sinhala and Tamil scripts must use `@fontsource/noto-sans-sinhala` and `@fontsource/noto-sans-tamil` for clean rendering without vertical clipping.
3. **Icons MUST Have Visible Text Labels**:
   - Never render an isolated icon without an accompanying text label.
   - Example: `<SendIcon /> Send to Kitchen` (NOT just an airplane or arrow icon).
   - Exception: Pure standard navigation breadcrumbs or numeric keypad buttons.

---

## 2. Colour Direction (Apple Clean Black & White)

The design aesthetic is inspired directly by **apple.com**: calm, clean, quiet, and premium with generous whitespace.

- **Brand & Base Colours**:
  - Background: Light grey (`#f5f5f7`) in light mode; pure deep charcoal/black in dark mode.
  - Surfaces: Pure white (`#ffffff`) cards with 18px radius and 1px hairline border (`#d2d2d7`).
  - Typography: Near-black text (`#1d1d1f`), secondary muted text (`#6e6e73`).
  - **Black is the brand colour**: Primary action buttons, active navigation indicator, and brand mark are solid black (`#1d1d1f` / `#000000`).
  - **No brand red, no gradients, no neon accents, no colored card backgrounds**.
  - Blue (`#0071e3`) is reserved strictly for links and accessibility keyboard focus rings.

- **Status Colours (Small Elements Only)**:
  Status colours are used *only* on small indicators (status pills, 8px dots, badge outlines). They are never applied as large card or screen backgrounds. Status must always be communicated via **Color + Icon + Text**, never color alone:

| Semantic State | Tone | Hex | Meaning in Ralypto |
| :--- | :--- | :--- | :--- |
| **Free / Done / Paid** | `success` | `#248a3d` (soft: `#e9f6ec`) | Table is vacant; kitchen ticket ready; payment received |
| **Waiting / Low Stock** | `warning` | `#b25000` (soft: `#fff4e5`) | Food is cooking; order pending; inventory below reorder |
| **Busy** | `busy` | `#c93400` (soft: `#fdeee6`) | Table is occupied; kitchen line busy |
| **Information / Neutral** | `info` | `#0071e3` (soft: `#e8f2fd`) | Takeaway / Delivery note; shift details |
| **Danger / Problem** | `danger` | `#d70015` (soft: `#fdebed`) | Void item; cancel order; refund; delete action |

---

## 3. High-Speed Operational Workflow Rules

1. **One Primary Button Per Screen**:
   - Every screen has at most ONE solid black primary action button. Secondary actions are outlined or subtle text buttons.
2. **Four Mandatory UI States**:
   Every data-driven view must implement:
   - **Loading State**: Subtle animated skeleton (`Skeleton.tsx`), no spinner jumps.
   - **Empty State**: Clear icon + encouraging headline + call to action button.
   - **Error State**: Plain language explanation + "Try Again" button.
   - **Normal State**: High-contrast, beautifully formatted data.
3. **Max 3 Taps for Daily Floor Actions**:
   - *Example: Adding an item to table order*:
     1. Tap Table -> 2. Tap Menu Item -> 3. Tap "Send to Kitchen". (Done in 3 seconds).
   - *Example: Quick Cash Settlement*:
     1. Tap "Pay" -> 2. Tap "Exact Cash" -> 3. Receipt Prints automatically.
4. **Simple, Action-Oriented Language**:
   - Use straightforward words that frontline staff understand instantly.
   - Use: **"Send to Kitchen"** (NOT "Dispatch KOT")
   - Use: **"Print Bill"** (NOT "Generate Invoice")
   - Use: **"Split Bill"** (NOT "Partition Ledger")
   - Use: **"Table Available"** (NOT "Vacant Entity")
5. **Confirmations: Only for Dangerous Actions**:
   - Do NOT interrupt routine workflows with "Are you sure?" dialogs.
   - Confirmation modals (with Manager PIN prompt) are reserved exclusively for:
     - Voiding an entire order.
     - Deleting an item already cooking in the kitchen.
     - Issuing a cash refund.
     - Closing the cashier shift with a cash shortage.

---

## 4. Dark Mode & Hardware Layouts

- **Theme Toggle**:
  - The top navigation bar provides **Auto** (system default), **Light**, and **Dark** modes.
  - The choice is saved in `localStorage` (`ralypto_theme`).
- **Kitchen Display (KDS)**:
  - The Kitchen Board is **permanently in OLED dark mode** (`data-theme="dark"` / `#000000` background) regardless of global theme settings, ensuring low glare under harsh commercial kitchen fluorescent lighting.
- **80mm Thermal Receipt Layout**:
  - Receipts use `@media print` with explicit 80mm column width (`max-width: 80mm`), monospace tabular numerals, zero browser headers/footers, and immediate auto-print trigger.
