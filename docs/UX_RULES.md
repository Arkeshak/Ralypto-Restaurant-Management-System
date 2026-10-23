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

## 2. Fixed Semantic Color Code

Color meanings are universal and strictly preserved across all modules to reduce cognitive load:

| Semantic State | Color Palette | Tailwind Class | Restaurant Context Meaning |
| :--- | :--- | :--- | :--- |
| **Available / Done / Success** | **Emerald Green** | `bg-emerald-600` / `text-emerald-500` | Table is free; ticket is ready; payment received |
| **Busy / Occupied / Problem** | **Crimson Red** | `bg-red-600` / `text-red-500` | Table is occupied; delayed order; voided item; alert |
| **Waiting / In Progress** | **Amber Yellow** | `bg-amber-500` / `text-amber-500` | Food is cooking in kitchen; bill requested; pending |
| **Information / Neutral** | **Sky Blue** | `bg-sky-600` / `text-sky-500` | Takeaway order; active shift details; notes |
| **Dark Theme Slate** | **Charcoal / Zinc** | `bg-zinc-900` / `bg-zinc-950` | Default high-contrast dark theme background |

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
