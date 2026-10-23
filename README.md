# Ralypto - Restaurant Management Operating System

[![CI Pipeline](https://github.com/ralypto/ralypto/actions/workflows/ci.yml/badge.svg)](.github/workflows/ci.yml)
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0-green.svg)](api-contract/openapi.yaml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](frontend)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](frontend)

**Ralypto** is an all-in-one SaaS restaurant operating system built for modern restaurants, cafes, and hospitality businesses. It provides high-speed POS billing, waiter tablet/mobile apps, customer QR digital menus & self-ordering, real-time Kitchen Display Systems (KDS), inventory recipe costing, double-entry accounting, payroll, 35+ analytical reports, delivery aggregator integration, offline resilience, and AI assistant intelligence.

Ralypto is commercialized as a tiered monthly subscription (**Basic**, **Standard**, **Premium**).

---

## 👥 Ownership & Pair Team

| Role | Engineer | Scope |
| :--- | :--- | :--- |
| **Frontend Lead** | **Arkesh** | Single-page PWA app (`frontend/`), UI design system, state, offline storage, role-based views |
| **Backend Lead** | **Vinith** | Multi-tenant API (`backend/`), database migrations, real-time WebSockets, auth, AI integrations |

---

## 🗂️ Monorepo Structure

```
ralypto/
├── .editorconfig                 # Unified code editor styling
├── .env.example                  # Environment variable blueprint (no secrets)
├── .gitignore                    # Git ignore for Node, Python, env, IDE, OS
├── docker-compose.yml            # PostgreSQL 16 & Redis 7 services
├── CONTRIBUTING.md               # Git branching, commit conventions, PR policy
├── README.md                     # Monorepo overview and developer guide
├── .github/
│   ├── workflows/ci.yml          # GitHub Actions CI for frontend & backend
│   ├── pull_request_template.md  # PR checklist & API contract verification
│   └── ISSUE_TEMPLATE/           # Bug report & feature request templates
├── docs/                         # System architecture & product documentation
│   ├── PROJECT_PLAN.md           # 8-phase rollout plan from MVP to launch
│   ├── DECISIONS.md              # Architectural decisions (ADRs) and log
│   ├── ROLES_AND_PERMISSIONS.md  # Role matrix, permissions & manager-PIN rules
│   ├── SUBSCRIPTION_PLANS.md     # Basic / Standard / Premium tiers & feature flags
│   ├── DATABASE_ENTITIES.md      # Data model, relations & money precision rules
│   ├── UX_RULES.md               # Touch sizing, color semantics, ergonomics
│   ├── OFFLINE_MODE.md           # IndexedDB offline orders & sync reconciliation
│   ├── AI_FEATURES.md            # AI features, data inputs, and backend architecture
│   └── WORKFLOW.md               # Pair workflow, mock server & change protocols
├── api-contract/
│   ├── openapi.yaml              # OpenAPI 3.0 single source of truth
│   └── README.md                 # API documentation & WebSocket event specs
├── backend/
│   └── README.md                 # Handover instructions & kick-off guide for Backend Lead
└── frontend/                     # React + Vite + TypeScript PWA application
    ├── public/                   # Static assets, PWA manifest, and app icons
    ├── src/
    │   ├── api/                  # API client, TypeScript endpoints, WebSocket client
    │   ├── app/                  # Router with role groups, context providers, guards
    │   ├── components/           # shadcn/ui primitives, layout shell, touch buttons
    │   ├── features/             # Feature modules (pos, waiter, kitchen, qr, etc.)
    │   ├── hooks/                # Custom React hooks (useAuth, useFeature, useOnline)
    │   ├── i18n/                 # English, Sinhala, and Tamil translations
    │   ├── lib/                  # Currency formatting (LKR), date helpers, permissions
    │   ├── mocks/                # MSW browser mock server & realistic Sri Lankan data
    │   ├── offline/              # Dexie IndexedDB models & offline sync queue
    │   ├── stores/               # Zustand stores for auth, cart, and UI
    │   └── styles/               # Design tokens, brand colors, Tailwind styles
    └── package.json
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20 or v22+
- **Docker Desktop**: For running PostgreSQL & Redis
- **Git**

### 2. Start PostgreSQL & Redis
Run the shared infrastructure container in the background:
```bash
docker compose up -d
```
This spins up:
- **PostgreSQL 16** on `localhost:5432` (db: `ralypto_db`, user: `ralypto_user`, pass: `ralypto_password`)
- **Redis 7** on `localhost:6379`

### 3. Start Frontend Development (Arkesh)
The frontend comes pre-configured with **MSW (Mock Service Worker)** and mock restaurant data (Fried Rice, Kottu, Lime Juice, Table 5, prices in LKR). You can start immediately without a backend:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser:
- Log in with email or 4-digit PIN using the preset demo accounts.
- Test different roles (**Cashier POS**, **Waiter Mobile**, **Kitchen KDS**, **Owner Dashboard**, **Accountant**).
- Test subscription tiers using the interactive **Plan Switcher** in the top bar to preview **Basic**, **Standard**, and **Premium** features.

### 4. Start Backend Development (Backend Lead)
Read the handover guide in [backend/README.md](backend/README.md) first:
1. Review the API contract at [`api-contract/openapi.yaml`](api-contract/openapi.yaml).
2. Choose your preferred framework (**Node/NestJS** or **Python/FastAPI**).
3. Connect to the local PostgreSQL database started via `docker compose up -d`.
4. Implement endpoints following the contract specifications.

---

## 📖 Key Documentation Links

- **Architecture Decisions**: [docs/DECISIONS.md](docs/DECISIONS.md)
- **Product Roadmap**: [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md)
- **API Contract & Specs**: [api-contract/openapi.yaml](api-contract/openapi.yaml)
- **Role Permissions & PIN Rules**: [docs/ROLES_AND_PERMISSIONS.md](docs/ROLES_AND_PERMISSIONS.md)
- **Subscription Tiers & Flags**: [docs/SUBSCRIPTION_PLANS.md](docs/SUBSCRIPTION_PLANS.md)
- **Database Entity Schema**: [docs/DATABASE_ENTITIES.md](docs/DATABASE_ENTITIES.md)
- **UX & Ergonomics Rules**: [docs/UX_RULES.md](docs/UX_RULES.md)
- **Offline & Sync Protocol**: [docs/OFFLINE_MODE.md](docs/OFFLINE_MODE.md)
- **AI Features & Prompts**: [docs/AI_FEATURES.md](docs/AI_FEATURES.md)
- **Pair Team Workflow**: [docs/WORKFLOW.md](docs/WORKFLOW.md)

---

## 📜 License
Proprietary software © Ralypto. All rights reserved.
