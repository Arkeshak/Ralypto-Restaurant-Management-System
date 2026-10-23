# Ralypto - UI/UX Design System & Ergonomic Rules

In a busy, fast-paced restaurant environment with grease on fingers, bright kitchen lighting, and rushing staff, UI elegance must meet brutal operational speed and ergonomic reliability.

---

## 1. Touch Target & Typography Ergonomics

1. **Touch Targets (Min 48px)**:
   - All interactive touch targets (buttons, table cards, menu cards, keypad numbers) must be at least **48px x 48px** (preferably 56px–64px for primary actions).
   - Touch padding between adjacent buttons must be at least **8px** to prevent accidental mis-taps.
2. **High-Legibility POS Typography**:
   - Base font size on POS and Kitchen screens must be **at least 16px** (`text-base`).
   - Prices, table numbers, and order totals must use large bold typography (**18px to 28px**).
3. **Icons MUST Have Visible Text Labels**:
   - Never render an isolated icon without an accompanying text label.
   - Example: `<SendIcon /> Send to Kitchen` (NOT just an airplane or arrow icon).
   - Exception: Pure standard navigation breadcrumbs or numeric keypad buttons.

---

## 2. Colour Direction (Apple Clean Black & White)

The design aesthetic is inspired directly by **apple.com**: calm, clean, quiet, and premium with generous whitespace.

- **Brand & Base Colours**:
  - Background: Light grey (`#f5f5f7`)
  - Surfaces: Pure white (`#ffffff`) cards with 18px radius and 1px hairline border (`#d2d2d7`)
  - Typography: Near-black text (`#1d1d1f`), secondary muted text (`#6e6e73`)
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

1. **Max 3 Taps for Daily Floor Actions**:
   - *Example: Adding an item to table order*:
     1. Tap Table -> 2. Tap Menu Item -> 3. Tap "Send to Kitchen". (Done in 3 seconds).
   - *Example: Quick Cash Settlement*:
     1. Tap "Pay" -> 2. Tap "Exact Cash" -> 3. Receipt Prints automatically.
2. **Simple, Action-Oriented Language**:
   - Use straightforward language that frontline staff understand instantly.
   - Use: **"Send to Kitchen"** (NOT "Dispatch KOT")
   - Use: **"Print Bill"** (NOT "Generate Invoice")
   - Use: **"Split Bill"** (NOT "Partition Ledger")
   - Use: **"Table Available"** (NOT "Vacant Entity")
3. **Confirmations: Only for Dangerous Actions**:
   - Do NOT interrupt routine workflows with "Are you sure?" dialogs.
   - Confirmation modals (with Manager PIN prompt) are reserved exclusively for:
     - Voiding an entire order.
     - Deleting an item already cooking in the kitchen.
     - Issuing a cash refund.
     - Closing the cashier shift with a cash shortage.

---

## 4. Role-Specific UX Adaptations

- **POS (Cashier)**:
  - 10-inch to 15-inch landscape tablet/desktop view.
  - Left panel: Table map or Menu grid. Right panel: Sticky active order cart with instant numeric keypad for quantities.
- **Waiter App**:
  - 100% single-hand mobile friendly (portrait).
  - Bottom navigation bar with oversized thumb-accessible action bar ("Send Order").
  - Rapid 4-digit PIN lock screen on device idle.
- **Kitchen Display (KDS)**:
  - High-contrast dark mode to reduce glare in warm kitchen environments.
  - Large tickets with elapsed timer counters (`04:32`).
  - Single tap on ticket switches state (`New` -> `Preparing` -> `Ready`).
- **Customer QR Menu**:
  - Zero login / zero friction.
  - Clean card carousel with vibrant food photography, spice indicators, and one-tap waiter call button.

---

## 5. First-Time Walkthrough & Demo Mode

1. **First-Time Guided Tour**:
   - New restaurant accounts have an onboarding checklist progress bar (e.g. "Step 1: Set up tables", "Step 2: Add 5 menu items", "Step 3: Ring first demo order").
2. **Interactive Demo Mode**:
   - A toggle in the navigation bar lets evaluators load realistic pre-seeded restaurant data (Colombo Spice Bistro with 5 active tables, KOT tickets, and LKR currency).
