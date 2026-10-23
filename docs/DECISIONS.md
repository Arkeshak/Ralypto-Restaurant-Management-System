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
