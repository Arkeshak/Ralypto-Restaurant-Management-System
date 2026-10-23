# Ralypto - Comprehensive Project Plan & Roadmap

This document outlines the multi-phase engineering and delivery plan for **Ralypto Restaurant Management OS**. Each phase has well-defined boundaries, core objectives, deliverables, and exit criteria.

---

## Overview of Phases

| Phase | Title | Focus Area | Target Milestone |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Foundations & Architecture** | Monorepo, API contract, CI/CD, mock server | Week 1 |
| **Phase 1** | **Core MVP (Dine-in & POS)** | POS Billing, Menu, Tables, Shifts, KDS Basics | Weeks 2–4 |
| **Phase 2** | **Waiter App & QR Self-Order** | Mobile PIN flow, QR table ordering, 10 Core Reports | Weeks 5–6 |
| **Phase 3** | **Inventory & Offline Mode** | IndexedDB POS offline sync, GRN, Recipe Costing | Weeks 7–9 |
| **Phase 4** | **SaaS Subscriptions & Admin** | Basic/Standard/Premium tiers, Super Admin panel | Weeks 10–11 |
| **Phase 5** | **Accounting, HR & Delivery** | Double-entry ledger, Payroll, Uber Eats / PickMe | Weeks 12–14 |
| **Phase 6** | **AI Intelligence Suite** | Gemini sales assistant, Menu insights, Forecasting | Weeks 15–16 |
| **Phase 7** | **Polish, Hardening & Launch** | Security audits, Load testing, Pilot restaurant launch | Weeks 17–18 |

---

## Detailed Phase Breakdown

### Phase 0: Foundations & Architecture (Current Phase)
- **Goal**: Establish the monorepo, OpenAPI 3.0 specification, containerized dev database, frontend starter with role routing and MSW mock data.
- **Deliverables**:
  - Monorepo folder layout with Git workflow and CI pipeline.
  - Complete `api-contract/openapi.yaml` with schema definitions and mock examples.
  - React + TypeScript + Vite frontend with Tailwind, shadcn design tokens, and role-based routes.
  - Mock Service Worker (MSW) simulating all primary backend endpoints and mock role/plan switcher.
  - Architectural decisions documented in `docs/DECISIONS.md`.
- **Exit Criteria**: Frontend compiles and runs with mock data; backend lead can run `docker compose up -d` and inspect openapi schema.

### Phase 1: Core MVP (Dine-in POS & Kitchen Display)
- **Goal**: Enable a single restaurant to take orders, print KOTs, view tickets in the kitchen, and settle bills.
- **Frontend Scope**:
  - Touch-optimized POS screen: Table map with real-time status indicators.
  - Menu catalog grid with category filters, search, and modifier sheet.
  - Order cart with line-item discounts, split bill calculation, and tax computation.
  - Cashier Shift management: Open shift with opening cash float, cash movements, close shift with discrepancy reporting.
  - Kitchen Display System (KDS): Ticket grid grouped by station (Kitchen vs. Bar), status toggles (New -> Preparing -> Ready).
- **Backend Scope**:
  - PostgreSQL schema migration: `restaurants`, `users`, `roles`, `tables`, `categories`, `menu_items`, `orders`, `order_items`, `kot_tickets`, `payments`, `shifts`.
  - Auth endpoints (email/password & 4-digit PIN login with JWT).
  - Order state machine (`draft` -> `confirmed` -> `preparing` -> `ready` -> `completed` / `voided`).
  - Manager PIN authorization for order voids and item cancellations.
  - Real-time WebSocket gateway for order placement and kitchen ticket status.
- **Exit Criteria**: Cashier can open shift, take an order on Table 5, fire KOT to Kitchen display, kitchen marks Ready, cashier settles payment with cash/card and prints receipt.

### Phase 2: Waiter App, Customer QR Menu & Core Reports
- **Goal**: Empower floor staff with mobile ordering and allow diners to scan QR codes at tables.
- **Frontend Scope**:
  - Dedicated mobile-first Waiter App interface with quick PIN switch.
  - Customer-facing QR menu: Progressive web view, zero authentication, English/Sinhala/Tamil localization, table-specific ordering.
  - Waiter calling button with instant buzzer on Waiter/POS screens.
  - Core Reporting: Daily Sales Summary, Category breakdown, Payment method summary, Top 10 items.
- **Backend Scope**:
  - Public QR endpoints: `/public/menu/{restaurantCode}/{tableNumber}`, `/public/orders`, `/public/call-waiter`.
  - Rate limiting and session verification for public QR orders.
  - Waiter assignment to tables/orders.
  - Aggregation queries for 10 basic reports.
- **Exit Criteria**: Customer scans Table 3 QR code, places order for 2 Kottu & 2 Lime Juice; waiter is notified; order appears on KDS and POS.

### Phase 3: Inventory Management & Offline POS Mode
- **Goal**: Track stock levels, ingredient depletion via recipe bill of materials (BOM), and ensure zero POS downtime during internet outages.
- **Frontend Scope**:
  - Dexie (IndexedDB) local cache for menu catalog and pending order queue.
  - Seamless offline detection: auto-switch to local order queue; background sync upon internet reconnection.
  - Inventory screens: Stock catalog, Goods Received Note (GRN) entry, Supplier directory, Wastage log.
- **Backend Scope**:
  - Inventory schema: `stock_items`, `suppliers`, `grn`, `recipes`, `recipe_items`, `stock_movements`, `wastage`.
  - Automatic ingredient depletion trigger on completed order items.
  - Low-stock email/in-app alert triggers.
  - Idempotent sync endpoint for offline order reconciliation with conflict resolution.
- **Exit Criteria**: Unplug router -> Cashier rings up 3 orders -> Router reconnected -> Orders sync cleanly to backend with zero duplicates.

### Phase 4: SaaS Subscription Engine & Super Admin Panel
- **Goal**: Monetize the platform with self-serve subscription plans, feature gating, and platform administration.
- **Frontend Scope**:
  - Super Admin dashboard: Manage tenant restaurants, view subscriptions, override status.
  - Restaurant Owner Subscription screen: View current plan (Basic / Standard / Premium), view invoices, upgrade plan.
  - Dynamic UI feature locking (`RequirePlanFeature` guard) displaying upgrade CTAs.
- **Backend Scope**:
  - Multi-tenant billing engine with 7-day grace period for unpaid invoices.
  - Automated feature flag injection into `/auth/me` payload.
  - Payment gateway integration (PayHere Sri Lanka / Bank Transfer slip upload).
- **Exit Criteria**: A restaurant on Basic plan is denied access to Waiter App and Inventory until upgraded to Standard.

### Phase 5: Accounting, HR/Payroll & Delivery Integration
- **Goal**: Deliver a comprehensive back-office ERP suite and integrate third-party delivery channels.
- **Frontend Scope**:
  - Double-entry accounting views: Profit & Loss (P&L), Balance Sheet, General Ledger, Expense claims.
  - HR & Staff Attendance: Clock-in/clock-out, basic monthly salary calculation with allowances and deductions.
  - Delivery management hub: Manual order entry for Uber Eats and PickMe with separate delivery commission tracking.
- **Backend Scope**:
  - Accounting journal entries auto-generated from POS sales, inventory purchases, and expenses.
  - Employee payroll calculation module.
  - Delivery order ingestion and status pipeline.
- **Exit Criteria**: P&L report accurately balances revenue against food cost (COGS) and recorded operational expenses.

### Phase 6: AI Hospitality Suite (Premium Tier)
- **Goal**: Infuse Google Gemini models to unlock automated intelligence for restaurant owners.
- **Frontend & Backend Scope**:
  - Natural language sales assistant chat: "What was my best-selling dessert last Friday?"
  - AI stock demand forecasting: Predictive alerts based on weather, day of week, and historical volume.
  - Menu engineering matrix: Stars, Plowhorses, Puzzles, and Dogs classification with profit margin suggestions.
  - AI Menu digitizer: Snap a photo of a printed paper menu -> automatically parse into categories, items, and prices.
  - Smart upsell prompts: Suggested add-ons displayed to cashier during order creation.
- **Exit Criteria**: Owner snaps a photo of a menu sheet; system creates structured menu catalog in under 15 seconds.

### Phase 7: Polish, Hardening & Commercial Launch
- **Goal**: Achieve enterprise stability, sub-second latency, security compliance, and pilot rollouts.
- **Tasks**:
  - End-to-end load testing (simulating 100 concurrent orders/second per tenant).
  - Security pen-test: verify multi-tenant isolation (zero tenant data leakage).
  - ESC/POS thermal printer driver testing across standard USB, Bluetooth, and LAN receipt printers.
  - Onboard 3 pilot restaurants in Colombo for 30-day live trials.
