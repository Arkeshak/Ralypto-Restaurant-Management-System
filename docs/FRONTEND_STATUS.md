# Ralypto Frontend Status Report (Phase 2)

**Generated:** October 2026  
**Theme:** Apple Minimalist Black & White  
**Target Platform:** Tablet (1024px / 768px), Desktop (1280px+), Mobile (390px)  
**Localization:** English (`en`), Sinhala (`si`), Tamil (`ta`) — 100.0% Key Coverage  
**Unit Test Suite:** 65/65 passing (Vitest)  
**E2E / A11y / Responsive Suite:** 33/33 passing (Playwright Chromium)  

---

## 1. Screen & Feature Matrix

| Screen / Feature | Route | Status | Mocked Data Source | Backend Endpoints Needed | 4 States Handled? | Mobile / Tablet Ready? | Notes |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :--- |
| **Email Login** | `/login` | **Done** | MSW `POST /auth/login` | `POST /auth/login` | Yes | Yes (100%) | Form validation with Zod, error banner, dev chips only in mock mode. |
| **Terminal PIN Login** | `/pin-login` | **Done** | MSW `POST /auth/pin-login` | `POST /auth/pin-login` | Yes | Yes (100%) | 4-digit keypad (56px targets), restaurant code persistence, auto-submit. |
| **Table Management** | `/tables` | **Done** | MSW `GET /tables` | `GET /tables`, `POST /tables/move`, `POST /tables/merge` | Yes | Yes (100%) | Real Move (free target) & Merge (occupied target with combined cart preview). |
| **POS Billing & Cart** | `/billing`, `/pos` | **Done** | MSW `GET /menu/items`, `GET /categories` | `GET /menu`, `POST /orders`, `POST /orders/{id}/pay` | Yes | Yes (100%) | Sticky order panel, modifier sheet, rapid `/` search, shift-closed lock. |
| **Cash Drawer Shifts** | Modal in TopBar & POS | **Done** | MSW `/shifts/*` | `GET /shifts/current`, `POST /shifts/open`, `POST /shifts/close` | Yes | Yes (100%) | Float entry keypad, live cash difference (green/amber/red), summary print. |
| **Payment & Bill Split** | PaymentModal | **Done** | Client-side math & MSW | `POST /orders/{id}/pay` | Yes | Yes (100%) | Single, mixed (cash + card balance), equal split (2-6 parts), itemized split. |
| **Thermal Receipt** | ReceiptModal | **Done** | Client state & printer API | `GET /orders/{id}/receipt` | Yes | Yes (100%) | 80mm thermal `@media print`, WhatsApp direct bill dispatch (`wa.me`), SMS bill. |
| **Order History** | `/orders` | **Done** | MSW `GET /orders` | `GET /orders`, `POST /orders/{id}/refund`, `POST /orders/{id}/void` | Yes | Yes (100%) | TanStack Virtual table, search, date/status/payment filters, 80mm reprint, PIN void. |
| **Kitchen Display (KDS)** | `/kitchen` | **Done** | MSW `GET /kitchen/tickets` | `GET /kitchen/tickets`, `PATCH /kitchen/tickets/{id}/status` | Yes | Yes (100%) | OLED pure dark mode, Station switch (Kitchen/Bar/All), mute, recall, 10m/20m late timers. |
| **Waiter App** | `/waiter` | **Done** | MSW tables & kitchen | `GET /tables`, `POST /orders`, `POST /orders/{id}/request-bill` | Yes | Yes (100%) | Single-hand mobile thumb UI, ready tickets badge counter, request bill action. |
| **Public QR Menu** | `/qr/:code/:table` | **Done** | MSW public menu | `GET /public/menu/{code}`, `POST /public/orders` | Yes | Yes (100%) | Zero auth required, table context banner, call waiter, send order to kitchen. |
| **Menu Manager** | `/menu` | **Done** | MSW `GET /menu/items` | `GET /menu/items`, `PATCH /menu/items/{id}` | Yes | Yes (100%) | Category tabs, 86/sold-out optimistic toggle with rollback on network fail. |
| **Reports Center** | `/dashboard`, `/reports` | **Done** | MSW report generator | `GET /reports/*` | Yes | Yes (100%) | 12 core reports, virtualized `ReportTable`, CSV export, Print, interactive Recharts. |
| **Staff Directory** | `/staff` | **Done** | MSW `GET /staff` | `GET /staff`, `POST /staff`, `PATCH /staff/{id}` | Yes | Yes (100%) | 4-digit PIN setup, active/inactive switch, Basic 3-user cap upgrade banner. |
| **Settings** | `/settings` | **Done** | MSW settings store | `GET /settings`, `PATCH /settings` | Yes | Yes (100%) | 8 tabs: Restaurant, Tax & Service, Receipt 80mm, Tables & Areas, QR Codes, Sync. |
| **QR Code Printing** | `/settings` > QR Tab | **Done** | `qrcode.react` generator | `GET /tables` | Yes | Yes (100%) | Generates SVG QR codes per table; A4 multi-table grid printing layout. |
| **Subscription & Plans** | `/subscription`, `/upgrade` | **Done** | MSW `/auth/me` | `GET /subscription`, `POST /subscription/upgrade` | Yes | Yes (100%) | Tier comparison (Basic, Standard, Premium), grace-period amber banner, read-only guard. |
| **Setup Wizard** | `/onboarding` | **Done** | MSW onboarding store | `POST /onboarding/complete` | Yes | Yes (100%) | 5-step guided wizard saving real mock restaurant profile, tables, categories. |
| **Inventory & GRN** | `/stock` | **Phase 3 Placeholder** | Clean upgrade card | `GET /inventory`, `POST /grn` | Yes | Yes | Intentionally held for Phase 3 (pilot phase). Basic/Standard locked appropriately. |
| **Double-Entry Accounting** | `/accounts` | **Phase 3 Placeholder** | Clean upgrade card | `GET /accounting/*` | Yes | Yes | Intentionally held for Phase 3. Premium plan guard active. |
| **Delivery Integrations** | `/delivery` | **Phase 3 Placeholder** | Clean upgrade card | `GET /delivery/orders` | Yes | Yes | Uber Eats / PickMe integration placeholder for Phase 3. |
| **Admin Super Panel** | `/admin` | **Phase 3 Placeholder** | Clean admin shield | `GET /admin/tenants` | Yes | Yes | Super-admin tenant provisioning placeholder. |

---

## 2. Mock vs. Real Integration Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Ralypto Frontend                     │
│    (React 18 + Zustand + TanStack Query + i18next)    │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
        (VITE_USE_MOCKS=true)      (VITE_USE_MOCKS=false)
               │                          │
               ▼                          ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│  MSW (Mock Service Worker)   │ │      Real API & Sockets      │
│  - Realistic Latency (150ms) │ │  - Axios HTTP Client (15s)   │
│  - 12 Complete Reports       │ │  - Single-flight 401 refresh │
│  - IndexedDB Sync Queue      │ │  - WebSocket event envelope  │
│  - Mock Shifts & Cash Drawer │ │  - 10s Polling fallback      │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 3. What Needs the Real Backend (Handover Checklist)

1. **Shift Lifecycle & Cash Balancing**:
   - `POST /shifts/open` with `openingFloatCents`.
   - `POST /shifts/close` with `closingCashCents` returning mathematical cash difference and breakdown by payment method.
2. **Table Operations**:
   - `POST /tables/move`: moves active orders between tables.
   - `POST /tables/merge`: merges two occupied tables and items with optional manager PIN.
3. **Item Patching**:
   - `PATCH /menu/items/{id}` for fast sold-out/availability toggling.
4. **WebSocket Envelope**:
   - Emits `{ event: "order.created" | "kitchen.ticket.status_changed" | "table.status_changed", timestamp: string, payload: any }`.
5. **Multi-Tenant Public QR Access**:
   - Whitelist `/public/**` from JWT authentication checks so customer phones can browse and order without login tokens.
