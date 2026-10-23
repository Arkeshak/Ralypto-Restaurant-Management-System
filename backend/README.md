# Ralypto - Backend Kick-off & Handover Guide

Welcome to the Ralypto backend engineering station! This document gives you everything you need to start building the backend API with zero ambiguity.

---

## 1. Suggested Reading Order

Before writing code, please review these key documents in this exact order:

1. [**`docs/PROJECT_PLAN.md`**](../docs/PROJECT_PLAN.md) — Understand the 8-phase product roadmap and MVP goals.
2. [**`api-contract/openapi.yaml`**](../api-contract/openapi.yaml) — The contract your API endpoints must fulfill.
3. [**`docs/DATABASE_ENTITIES.md`**](../docs/DATABASE_ENTITIES.md) — PostgreSQL schema, entity relations, and monetary precision rules.
4. [**`docs/ROLES_AND_PERMISSIONS.md`**](../docs/ROLES_AND_PERMISSIONS.md) — RBAC matrix and Manager-PIN authorization logic.
5. [**`docs/SUBSCRIPTION_PLANS.md`**](../docs/SUBSCRIPTION_PLANS.md) — Plan tiers (Basic, Standard, Premium) and feature flag keys.
6. [**`api-contract/README.md`**](../api-contract/README.md) — WebSocket real-time event specifications.

---

## 2. Choosing Your Backend Framework

You have full autonomy to select the backend technology stack that allows you to deliver high performance and velocity:
- **Option A: Node.js / TypeScript** (e.g. **NestJS** or **Fastify** with Prisma / Drizzle / TypeORM)
- **Option B: Python** (e.g. **FastAPI** with SQLAlchemy / SQLModel / Alembic)

Initialize your chosen framework right inside this `backend/` directory.

---

## 3. Non-Negotiable Architecture Requirements (Day 1 Must-Haves)

1. **Multi-Tenancy Isolation**:
   - Every database table (except platform-level plans) must have `restaurant_id UUID NOT NULL`.
   - **Every single SQL query** must enforce `WHERE restaurant_id = :currentUserRestaurantId`.
   - Never allow one restaurant's staff to query or mutate another restaurant's data.
2. **Role & Permission Guards**:
   - Protect routes using JWT claims (`role`, `restaurant_id`, `user_id`).
   - Validate Manager PIN for dangerous actions (`/orders/{id}/void`, refunds).
3. **Audit Logging**:
   - Log sensitive actions into `audit_logs` (voids, custom discounts, drawer pops).
4. **Subscription Feature Flags**:
   - The `GET /auth/me` and `GET /subscription` endpoints must return the `featureFlags` boolean object mapped to the restaurant's active plan.
5. **JWT & PIN Authentication**:
   - Support both email/password login and high-speed 4-digit numeric PIN login (`/auth/pin-login`).
   - Implement refresh token rotation.
6. **Real-Time WebSockets**:
   - Implement WebSocket gateway broadcasting `order.created`, `order.updated`, `kitchen.ticket.status_changed`, `table.status_changed`, and `waiter.called` to room `tenant:<restaurant_id>`.

---

## 4. Local Database Infrastructure

Use the shared Docker Compose setup at the root of the repository:
```bash
docker compose up -d
```
- **PostgreSQL 16**: `postgresql://ralypto_user:ralypto_password@localhost:5432/ralypto_db`
- **Redis 7**: `redis://localhost:6379`

---

## 5. Suggested Implementation Sequence (Sprint 1 & 2)

1. **Project Setup**: Framework scaffolding, environment config, linter, test runner.
2. **Database Migrations**: Create initial schema based on `docs/DATABASE_ENTITIES.md`.
3. **Seed Script**: Populate the demo dataset (see below).
4. **Auth Module**: Email login, 4-digit PIN login, token refresh, `/auth/me`.
5. **Menu Module**: `/menu/categories`, `/menu/items` (with modifier options).
6. **Tables Module**: `/tables` listing and status toggle (`PATCH /tables/{id}/status`).
7. **Orders Module**: Create order, add items, send to kitchen, request bill, pay order.
8. **Kitchen (KDS) Module**: `/kitchen/orders` query and ticket status transition.
9. **Shifts Module**: Shift open (cash float) and shift close (reconciliation).
10. **WebSocket Gateway**: Emit events upon order creation and KDS updates.

---

## 6. Seed Script Specification (Wanted for Demo)

Please create a database seed script (`npm run seed` or `python seed.py`) with:
- **1 Tenant Restaurant**:
  - Name: `Ceylon Spice Bistro`, Code: `CEY101`, Currency: `LKR`
- **4 Staff Accounts**:
  - Owner: `owner@ralypto.com` (PIN: `1234`)
  - Cashier: `cashier@ralypto.com` (PIN: `2222`)
  - Waiter: `waiter@ralypto.com` (PIN: `3333`)
  - Kitchen: `kitchen@ralypto.com` (PIN: `4444`)
- **5 Dining Tables**:
  - Table 1 (2 seats), Table 2 (4 seats), Table 3 (4 seats), Table 4 (6 seats), Table 5 (4 seats - occupied).
- **20 Menu Items** (Realistic Sri Lankan Cuisine in LKR):
  - *Rice & Kottu*: Chicken Kottu (LKR 1,450.00), Beef Kottu (LKR 1,750.00), Egg Kottu (LKR 1,100.00), Cheese Kottu (LKR 1,850.00), Seafood Fried Rice (LKR 1,600.00), Chicken Fried Rice (LKR 1,350.00), Vegetable Biryani (LKR 1,200.00).
  - *Short Eats & Starters*: Hot Butter Cuttlefish (LKR 2,200.00), Devilled Chicken (LKR 1,500.00), Vegetable Spring Rolls (LKR 750.00), Fish Cutlets 4pcs (LKR 650.00), Mutton Rolls 2pcs (LKR 850.00).
  - *Beverages*: Fresh Lime Juice (LKR 450.00), Falooda Special (LKR 650.00), King Coconut Water (LKR 350.00), Iced Milo Dinosaur (LKR 550.00), Ceylon Milk Tea (LKR 250.00).
  - *Desserts*: Watalappan with Cashews (LKR 550.00), Curd & Treacle (LKR 450.00), Caramel Pudding (LKR 400.00).

---

## 7. Working with Arkesh (Frontend Lead)

- Arkesh is using Mock Service Worker (MSW) matching `openapi.yaml`.
- Whenever your endpoint is ready to test, let Arkesh know: he can switch `VITE_USE_MOCKS=false` to test live against your backend.
- If you need to change any schema or URL: **update `api-contract/openapi.yaml` first**, give Arkesh a heads-up, and commit it!
