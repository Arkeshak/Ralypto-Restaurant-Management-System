# Ralypto - Frontend Engineering & Operational Guide

This is the progressive web application (PWA) for **Ralypto Restaurant OS**, built with React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, react-i18next, and Mock Service Worker (MSW).

---

## 1. Quick Start & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run local development server with mock API
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173). The application will launch with mock service worker pre-enabled.

### Test Credentials (Pre-seeded Demo Mode)
You can log in either via **Email / Password** or **4-Digit Terminal PIN** (Restaurant Code: `CEY101`):

| Role | Email Login | 4-Digit PIN | Redirect Landing Route | Notes |
| :--- | :--- | :---: | :--- | :--- |
| **Owner** | `owner@ralypto.com` / `pass123` | `1111` | `/dashboard` | Executive reports, settings, subscription management |
| **Manager** | `manager@ralypto.com` / `pass123` | `2222` | `/dashboard` | Floor operations, refunds, table merge authorization |
| **Cashier (POS)**| `cashier@ralypto.com` / `pass123` | `3333` | `/billing` | Fast billing, shift opening/closing, payments |
| **Floor Waiter** | `waiter@ralypto.com` / `pass123` | `4444` | `/tables` | Mobile table ordering, bill requests, kitchen alerts |
| **Kitchen Chef** | `kitchen@ralypto.com` / `pass123` | `5555` | `/kitchen` | OLED dark KDS, ticket prep advancement |
| **Accountant** | `accountant@ralypto.com` / `pass123` | `6666` | `/accounts` | Financial statements & P&L (Premium tier) |
| **Super Admin** | `admin@ralypto.com` / `pass123` | `9999` | `/admin` | Tenant administration & global settings |

---

## 2. Testing Scripts

```bash
# Run unit & component tests (65 tests)
npm run test

# Run full end-to-end and accessibility test suite (33 tests via Playwright)
npm run test:e2e

# Run i18n parity check (EN, SI, TA key consistency)
npm run i18n:check

# TypeScript type validation
npm run typecheck

# Code quality and style linting
npm run lint

# Production build bundle check
npm run build
```

---

## 3. Switching Between Mock API and Real Backend

To connect the frontend directly to the real backend service:
1. Open `.env` (or copy from `.env.example`).
2. Toggle the `VITE_USE_MOCKS` flag:
   ```env
   # Set to false to send real HTTP/WebSocket requests to the backend
   VITE_USE_MOCKS=false
   VITE_API_BASE_URL=http://localhost:4000/api/v1
   VITE_WS_URL=ws://localhost:4000/ws
   ```
3. Restart `npm run dev`.
When `VITE_USE_MOCKS=false`, the Mock Service Worker is never started, and demo quick-login chips are excluded from the bundle.

---

## 4. How to Add a New Screen

1. Create a new folder and component under `src/features/<feature-name>/<FeatureName>Page.tsx`.
2. Ensure the screen implements **all 4 UI states**:
   - `loading`: `<PageLoading />` or skeleton rows.
   - `empty`: `<EmptyState icon={...} title="..." description="..." actionLabel="..." />`
   - `error`: Error banner with a "Retry" button.
   - `normal`: High-contrast, Apple-style clean layout.
3. Add the route definition in [`src/app/router.tsx`](src/app/router.tsx).
4. Guard the route with `<RequireRole allowedRoles={[...]}>` and/or `<RequirePlanFeature feature="...">`.
5. Add navigation link in [`src/components/layout/Sidebar.tsx`](src/components/layout/Sidebar.tsx).
6. Register translation keys in `src/i18n/locales/en.json`, `si.json`, and `ta.json`, then run `npm run i18n:check`.

---

## 5. How to Add a New Report

Ralypto uses a centralized virtualized reporting engine (`ReportTable.tsx`):

1. Define the report ID, name, column schema, and data row type in [`src/features/reports/reportsData.ts`](src/features/reports/reportsData.ts).
2. Add the report card to the category group in `REPORTS_CATALOG`:
   ```ts
   {
     id: 'sales_by_delivery_partner',
     name: 'Sales by Delivery Partner',
     description: 'Breakdown across Uber Eats, PickMe, and Direct Takeaway',
     category: 'sales',
     minPlan: 'standard', // 'basic' | 'standard' | 'premium'
     columns: [
       { key: 'partner', header: 'Platform' },
       { key: 'orders', header: 'Total Orders', align: 'right' },
       { key: 'revenue', header: 'Revenue', align: 'right', isMoney: true },
     ],
     dataGenerator: (dateRange) => generatePartnerSales(dateRange),
   }
   ```
3. The report automatically inherits:
   - Dynamic date range presets (Today, Yesterday, Last 7 Days, This Month).
   - TanStack Virtual list for rendering 10,000+ rows smoothly.
   - One-click CSV export (`text/csv;charset=utf-8`).
   - 80mm and A4 clean thermal print styles (`@media print`).
   - Subscription tier access gates (`basic` sees 10, `standard`/`premium` see all).

---

## 6. Architecture & Folder Conventions

```
src/
├── api/             # HTTP client (single-flight 401 refresh), socket client, OpenAPI types
├── app/             # Router, providers, and route guards (RequireAuth, RequireRole, RequirePlanFeature)
├── components/      # Apple design tokens: BigButton, StatusPill, MoneyText, ConfirmDialog, Skeleton
├── features/        # High-cohesion feature modules:
│   ├── auth/        # Email login & terminal 4-digit PIN login
│   ├── pos/         # POS floor map, order cart, modifier sheet, split bill & payment drawer
│   ├── orders/      # Virtualized Order History with reprint and manager PIN refund/void
│   ├── kitchen/     # OLED dark KDS with station filter (Kitchen/Bar), sound mute, late timers
│   ├── waiter/      # Single-hand mobile waiter order flow & ready notifications
│   ├── qr-menu/     # Public table ordering & service call menu (zero auth required)
│   ├── menu-manager/# Catalog editor with optimistic sold-out toggle
│   ├── reports/     # Reports Center with 12 core reports, CSV export, and Recharts
│   ├── staff/       # Staff directory, 4-digit PIN reset, Basic 3-user cap upgrade prompt
│   ├── settings/    # Restaurant profile, tax & service charge, 80mm receipt customizer, table QRs
│   └── onboarding/  # 5-step guided setup wizard with practice mode toggle
├── hooks/           # useAuth, useFeature, useReadOnly, useOnlineStatus
├── i18n/            # English (en), Sinhala (si), and Tamil (ta) locale dictionaries
├── lib/             # formatMoney (LKR), date helpers, permissions matrix
├── mocks/           # Mock Service Worker handlers & mock restaurant datasets
├── offline/         # Dexie IndexedDB sync queue with exponential retry backoff
└── stores/          # Zustand stores (auth, cart, shift, ui)
```
