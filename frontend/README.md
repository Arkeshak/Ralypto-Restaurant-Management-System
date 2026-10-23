# Ralypto - Frontend Starter & Engineering Guide

This is the progressive web application (PWA) for **Ralypto Restaurant OS**, built with React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, react-i18next, and Mock Service Worker (MSW).

---

## 1. Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server with mock API
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173). The application will launch with mock service worker pre-enabled.

### Test Credentials (Pre-seeded)
You can log in either via **Email / Password** or **4-Digit Terminal PIN** (Restaurant Code: `CEY101`):

| Role | Email Login | 4-Digit PIN | Redirect Landing Route |
| :--- | :--- | :---: | :--- |
| **Owner / Manager** | `owner@ralypto.com` / `pass123` | `1234` | `/dashboard` |
| **Cashier (POS)** | `cashier@ralypto.com` / `pass123` | `2222` | `/pos` |
| **Floor Waiter** | `waiter@ralypto.com` / `pass123` | `3333` | `/waiter` |
| **Kitchen Chef** | `kitchen@ralypto.com` / `pass123` | `4444` | `/kitchen` |
| **Accountant** | `accountant@ralypto.com` / `pass123` | `5555` | `/accounting` |
| **Super Admin** | `admin@ralypto.com` / `pass123` | `9999` | `/admin` |

---

## 2. Testing Subscription Tiers (Mock Plan Switcher)

In the top navigation bar, use the **Plan Switcher dropdown**:
- **Basic**: Unlocks POS and KDS. Locks Waiter App, Inventory, Delivery, and Accounting (displays the *"Upgrade to Unlock"* card).
- **Standard**: Unlocks Waiter App, QR Self-Ordering, Inventory & Recipe Costing, Delivery aggregator orders.
- **Premium**: Unlocks everything, including Double-entry Accounting, Payroll, and Google Gemini AI Assistant.

---

## 3. Switching Between Mock API and Real Backend

To connect the frontend to the backend service:
1. Open `.env` (or copy from `.env.example`).
2. Toggle the `VITE_USE_MOCKS` flag:
   ```env
   # Set to false to send real HTTP/WebSocket requests to the backend
   VITE_USE_MOCKS=false
   VITE_API_BASE_URL=http://localhost:4000/api/v1
   VITE_WS_URL=ws://localhost:4000/ws
   ```
3. Restart `npm run dev`.

---

## 4. Architecture & Folder Conventions

We follow a strict **"One Feature = One Folder"** structure:

```
src/
├── api/             # API client, TypeScript endpoints, WebSocket client
├── app/             # Router, context providers, guards (RequireAuth, RequireRole, RequirePlanFeature)
├── components/      # Common UI primitives (BigButton, StatusPill, MoneyText, ConfirmDialog)
├── features/        # Business feature modules:
│   ├── auth/        # Login & PIN login
│   ├── pos/         # POS floor table map, cart, and payment drawer
│   ├── waiter/      # Waiter mobile ordering flow
│   ├── kitchen/     # Kitchen Display System (KDS)
│   ├── qr-menu/     # Public customer digital menu
│   ├── inventory/   # Stock items, GRN, and recipe costing
│   ├── accounting/  # P&L, balance sheet, and payroll
│   ├── reports/     # Executive KPI dashboard & reports
│   ├── subscription/# Plan comparison and invoices
│   └── ai/          # Gemini AI chat assistant and insights
├── hooks/           # Custom React hooks (useAuth, useFeature, useOnlineStatus)
├── i18n/            # English (en), Sinhala (si), and Tamil (ta) translations
├── lib/             # formatMoney (LKR), dates, permissions helpers
├── mocks/           # MSW mock handlers and realistic restaurant fixtures
├── offline/         # Dexie.js IndexedDB schema and sync queue
├── stores/          # Zustand state stores (auth, cart, ui)
└── styles/          # Tailwind tokens.css and globals.css
```

---

## 5. How to Add a New Screen

1. Create a new folder under `src/features/your-feature/YourFeaturePage.tsx`.
2. Add route definition in [`src/app/router.tsx`](src/app/router.tsx).
3. Wrap with `<RequireRole allowedRoles={[...]}>` and/or `<RequirePlanFeature feature="...">` if restricted.
4. Add sidebar link in [`src/components/layout/Sidebar.tsx`](src/components/layout/Sidebar.tsx).
5. Add localized title in `src/i18n/locales/en.json`, `si.json`, and `ta.json`.

---

## 6. Available Scripts

- **`npm run dev`**: Start local Vite dev server
- **`npm run build`**: Typecheck and build production bundle
- **`npm run lint`**: Run ESLint across all TypeScript and TSX files
- **`npm run typecheck`**: Run `tsc --noEmit` to verify type safety
- **`npm run test`**: Run Vitest unit tests
- **`npm run format`**: Prettier formatting
