# Ralypto - Architectural Decision Records (ADRs)

This document records the architectural and technology decisions made for Ralypto.

---

## ADR 001: Monorepo Architecture
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: Ralypto consists of a frontend web/PWA application, a backend REST/WebSocket service, an OpenAPI contract, and shared documentation.
- **Decision**: Use a single monorepo (`ralypto`) containing `/frontend`, `/backend`, `/api-contract`, `/docs`, and root configuration files.
- **Consequences**:
  - Both developers see contract changes and documentation in one Git commit.
  - Simplifies local container orchestration (`docker-compose.yml`).
  - Clear branch and PR policies keep contributions coordinated.

---

## ADR 002: Single Frontend App with Role-Based Route Groups
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: We need interfaces for Cashiers, Waiters, Kitchen staff, Owners, Accountants, and Public QR diners.
- **Decision**: Build a single progressive web application (`frontend/`) powered by React Router with role guards (`RequireAuth`, `RequireRole`, `RequirePlanFeature`).
- **Consequences**:
  - Shared UI components, state stores, i18n dictionaries, and API client.
  - Decreases build and maintenance overhead compared to managing 4 separate applications.
  - Seamless switching between Cashier and Waiter roles on floor tablets via quick PIN login.

---

## ADR 003: Relational Database: PostgreSQL 16
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: Restaurant operations require strict ACID transactional guarantees for inventory depletion, cash balances, double-entry ledger, and order state transitions.
- **Decision**: PostgreSQL 16 is chosen as the primary relational database.
- **Consequences**:
  - High performance, foreign key integrity, row-level security (RLS) support for multi-tenancy, and JSONB support for flexible menu modifiers.

---

## ADR 004: Cache & Real-Time Transport: Redis 7 & WebSocket
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: KDS screens, waiter notifications, and table occupancy need instant sub-second synchronization without aggressive HTTP polling.
- **Decision**: Standard WebSockets backed by Redis Pub/Sub for inter-process message broadcasting.
- **Consequences**:
  - Instant order dispatch to kitchen display screens (`order.created`, `kitchen.ticket.status_changed`).
  - Redis caches session tokens, active shift states, and rate limits.

---

## ADR 005: Financial Representation: Integer Cents / Numeric
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: IEEE-754 floating point arithmetic introduces rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`), which is unacceptable in billing and accounting.
- **Decision**: All monetary amounts are stored as integer cents (e.g. LKR 1,500.00 is stored as `150000`) or `NUMERIC(14,2)` in PostgreSQL.
- **Consequences**:
  - Guarantees exact reconciliation across POS bills, shift z-reports, and P&L financial statements.
  - Frontend utilizes standard helper `formatMoney(cents)` for rendering.

---

## ADR 006: Offline Storage: IndexedDB via Dexie.js
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: Cashiers must be able to ring up bills and print customer receipts even during internet dropouts.
- **Decision**: Use Dexie.js wrapper around browser IndexedDB to persist active menu catalog and queued offline orders.
- **Consequences**:
  - Zero disruption to dining floor during Wi-Fi or broadband outages.
  - Client-generated UUIDs ensure idempotent reconciliation when connection is restored.

---

## ADR 007: Contract-Driven Development via OpenAPI 3.0 & MSW
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: Frontend and backend development will proceed in parallel without either team member blocking the other.
- **Decision**: OpenAPI 3.0 is the formal contract. Frontend intercepts HTTP calls using Mock Service Worker (MSW) matching OpenAPI response schemas.
- **Consequences**:
  - Arkesh can build rich, interactive UI screens with realistic mock data immediately.
  - Backend developer can build and test API endpoints against the identical specification.

---

## ADR 008: Backend Framework Flexibility
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: The backend developer should work with the framework where they have maximum velocity and expertise.
- **Decision**: The backend folder provides handover specifications, database containers, and the OpenAPI contract. The backend lead may choose between Node.js (NestJS / Fastify) or Python (FastAPI).

---

## ADR 009: Localization: Tri-Lingual Support (English, Sinhala, Tamil)
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: Sri Lankan restaurant staff and customers speak English, Sinhala, and Tamil.
- **Decision**: `react-i18next` with modular JSON translation dictionaries (`en.json`, `si.json`, `ta.json`). No hardcoded text strings in UI components.

---

## ADR 010: Apple Minimalist Aesthetic & Strict Black-and-White Palette
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: Restaurant staff have minimal IT proficiency and work in high-speed, noisy dining environments. Complex decorations, saturated gradients, and busy layouts cause cognitive fatigue and order-taking errors.
- **Decision**: Implement an Apple.com-inspired UI:
  - **Colors**: White (`#ffffff`) and very light grey (`#f5f5f7`) backgrounds, near-black text (`#1d1d1f`), and solid black (`#1d1d1f`) as the primary brand color for action buttons, active indicators, and logos. No red brand colors, no gradients, no neon.
  - **Status Colors**: Confined strictly to small indicators (pills, dots, icons), never as full-card backgrounds. Status is always presented via color + Lucide icon + text word.
  - **Surfaces & Shape**: 18px rounded cards, hairline 1px borders, subtle soft shadows, pill-shaped buttons with scale tap feedback (`0.97`).
  - **Touch Targets**: Standard buttons >= 48px; primary POS actions >= 56px.
  - **Kitchen Board**: OLED pure black dark mode (`[data-theme="dark"]`).

---

## ADR 011: Restaurant-Centric Plan Architecture
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: In Phase 1 mock fixtures, different demo users belonged to different subscription plans, creating unrealistic bugs.
- **Decision**: In real restaurant operations, a subscription plan belongs to the `Restaurant` entity, not to individual user accounts. All staff members of a restaurant share the restaurant's subscription tier.
- **Consequences**:
  - The dev mock switcher updates the restaurant's plan, dynamically updating permissions for all users uniformly.
  - In production builds (`VITE_USE_MOCKS=false`), the plan and feature flags are strictly loaded from `GET /auth/me`.

---

## ADR 012: Code Splitting and Bundle Budgeting
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: Low-cost Android/iPad dining tablets on slow restaurant Wi-Fi cannot load large initial bundles. Phase 1 initial chunk exceeded 989 kB due to Lucide barrel imports and eager Recharts loading.
- **Decision**:
  - Replaced barrel icon imports with explicit named imports.
  - Isolated Recharts into dynamic `vendor-recharts` chunk loaded strictly on `/reports` and `/dashboard`.
  - Lazy-loaded Sinhala and Tamil translation dictionaries (`si.json`, `ta.json`).
  - Configured Vite `manualChunks` for React, Router, Motion, Dexie, and TanStack Query.
- **Consequences**:
  - Initial `index.js` chunk reduced from 989 kB to **118.5 kB (35.5 kB gzip)** — well under the 300 kB budget.

---

## ADR 013: Offline Idempotent Sync Queue with Exponential Backoff
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: Network drops during dinner rush must never drop tickets or create duplicate charges on reconnect.
- **Decision**:
  - Queued orders generate a client-side UUID (`crypto.randomUUID()`) prior to IndexedDB write.
  - On network reconnect (`window.addEventListener('online')`), orders are replayed with backoff (5s, 15s, 60s).
  - Orders are only deleted from IndexedDB after HTTP 200/201 confirmation from the server.
  - An interactive "Sync Problems" inspector in Settings allows cashiers to view and manually retry any stalled orders.

---

## ADR 014: Single-Flight Token Refresh Queue
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: When a JWT token expires, multiple concurrent UI queries (tables, kitchen, cart) could simultaneously fire refresh calls, causing race conditions or invalid refresh tokens.
- **Decision**: Implemented single-flight refresh queueing in `src/api/client.ts`. If a 401 is received, subsequent requests wait for the active refresh promise to settle. If refresh fails, storage is wiped and the user is redirected to `/pin-login` cleanly.

---

## ADR 015: Standard WebSocket Envelope and Fallback Polling
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: WebSocket disconnects or network proxies could silently blind kitchen staff from incoming orders.
- **Decision**:
  - All real-time events use a unified envelope: `{ event: string, timestamp: string, payload: any }`.
  - If the socket connection drops, the frontend automatically falls back to HTTP polling every 10 seconds for kitchen tickets and table status, displaying a subtle "Live updates paused" notice in the top bar.

---

## ADR 016: Universal Subscription State Read-Only Hook
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: When a subscription enters "Grace Period" or "Read-Only" mode (due to lapsed payment), mutation buttons must be locked across all 15+ screens without scattering ad-hoc condition checks.
- **Decision**: Implemented `useReadOnly()` hook and `<SubscriptionBanner />`. When `status === 'read_only'`, mutation buttons (create, update, delete, pay) are disabled globally, while reading, reporting, and 80mm thermal receipt printing remain 100% operational.

---

## ADR 017: Virtualized Reporting Framework
- **Date**: 2026-10-23
- **Status**: Accepted
- **Context**: High-volume restaurants generate thousands of item transactions daily. Rendering massive table DOM nodes causes mobile tablet crashes.
- **Decision**: Built a reusable `ReportTable` component utilizing `@tanstack/react-virtual`. It powers all 12 core reports, supports 10,000+ rows with flat memory overhead, and provides built-in CSV export and 80mm/A4 print styling.

