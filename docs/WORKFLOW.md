# Ralypto - Engineering Pair Workflow & Collaboration Guide

This document defines how **Arkesh (Frontend Lead)** and the **Backend Lead** collaborate efficiently without blocking each other.

---

## 1. Core Operating Principles

1. **API Contract First**:
   - The contract at [`api-contract/openapi.yaml`](../api-contract/openapi.yaml) is the single shared source of truth.
   - Code is written to satisfy the contract, not the other way around.
2. **Frontend Zero-Blocker Independence**:
   - Arkesh develops and tests all frontend screens using **MSW (Mock Service Worker)**.
   - Arkesh never waits for a backend endpoint to be deployed to build a UI.
   - When the backend endpoint is ready, Arkesh simply sets `VITE_USE_MOCKS=false` in `.env` to connect to real endpoints.
3. **Backend Developer Autonomy**:
   - The backend lead can choose either **Node/NestJS** or **Python/FastAPI**.
   - The backend developer does not need to learn React or touch the `frontend/` directory.

---

## 2. API Change Protocol (Who Tells Whom)

If either developer discovers that an endpoint needs to change (e.g. adding a field, altering a payload, or introducing a new route):

1. **Step 1: Open Discussion**:
   - Ping in chat or discuss during daily standup: *"We need a split bill endpoint that accepts an array of customer shares instead of just percentage."*
2. **Step 2: Update `openapi.yaml` First**:
   - The developer proposing the change creates a branch `docs/api-split-bill` and edits `api-contract/openapi.yaml`.
3. **Step 3: Peer Approval**:
   - The other developer reviews the PR and approves the schema change.
4. **Step 4: Parallel Implementation**:
   - Backend developer implements the controller/service against PostgreSQL.
   - Arkesh updates the MSW mock handler in `frontend/src/mocks/handlers/orders.ts` and the frontend TypeScript types in `frontend/src/api/types.ts`.

---

## 3. Standard Test Accounts & Fixtures

The MSW mock system and the backend seed scripts share the exact same credentials for local testing:

| Role | Email Login | 4-Digit PIN | Default Starting Route |
| :--- | :--- | :---: | :--- |
| **Owner / Manager** | `owner@ralypto.com` / `pass123` | `1234` | `/reports/dashboard` |
| **Cashier** | `cashier@ralypto.com` / `pass123` | `2222` | `/pos` |
| **Waiter** | `waiter@ralypto.com` / `pass123` | `3333` | `/waiter` |
| **Kitchen Chef** | `kitchen@ralypto.com` / `pass123` | `4444` | `/kitchen` |
| **Accountant** | `accountant@ralypto.com` / `pass123` | `5555` | `/accounting` |
| **Super Admin** | `admin@ralypto.com` / `pass123` | `9999` | `/admin` |

---

## 4. Communication Cadence

- **Daily Async Standup (Slack / WhatsApp)**:
  - Sent by 10:00 AM every day:
    1. *What I finished yesterday*
    2. *What I am working on today*
    3. *Any blockers or API contract questions*
- **Weekly Sprint Sync (Sunday Evening, 30 min)**:
  - Review weekly progress on the [Project Plan](PROJECT_PLAN.md).
  - Align on upcoming feature milestones and schema contracts.
