# Ralypto Backend Progress

**Updated:** 2026-10-24  
**Framework:** FastAPI  
**Scope:** Core FastAPI backend plus connection fixes in the existing frontend. No visual redesign was made.

## What is in place

- FastAPI application in `app/main.py`, served under `/api/v1`, with interactive API docs at `/docs`.
- SQLAlchemy persistence models for restaurants, users, menu categories and items, dining tables, orders and line items, kitchen tickets, payments, shifts, audit logs, and invoices.
- Environment-based configuration for the database URL, JWT secrets and lifetimes, CORS origins, and demo mode.
- Tenant-scoped access checks on authenticated API queries, role checks on menu administration, and manager PIN authorization with an audit record for order voids.
- Email/password and four-digit PIN login, JWT access tokens, refresh-token endpoint, `/auth/me`, and plan feature flags.
- Menu and table endpoints; order creation and item addition; kitchen dispatch, ticket status changes, bill requests, payment, void, and split summary endpoints.
- Shift opening, current shift lookup, and shift closing with cash reconciliation.
- Public QR menu, self-order, waiter-call, and active bill-request endpoints, tenant WebSocket broadcasting, subscription and invoice endpoints, and dashboard/sales/analytics report endpoints.
- QR self-orders are created against the restaurant/table/menu, dispatched into kitchen tickets, and can be billed from the public table page.
- POS uses server orders, discounts, tax/service settings returned by the API, split/mixed/partial payments, refunds, voids, and server-backed receipt data.
- Menu catalog availability/price changes, table views, kitchen tickets, reports, and waiter orders/ready queue now load and mutate through backend endpoints instead of demo arrays.
- Reservations and waitlist screens use their tenant-scoped create/update/list/delete endpoints.
- Staff directory now lists persisted tenant users, creates accounts with hashed PINs, updates contact/role/PIN/active state, and deactivates rather than destroying accounts. The owner is protected.
- Settings persist restaurant identity, receipt fields, tax/service preferences, and QR self-order permission. Tax/service rates are applied to the restaurant configuration; public QR checkout respects the self-order toggle.
- Settings table management now uses the table API for list/create/delete; active tables cannot be deleted.
- Inventory has a persisted ingredient quantity/reorder-threshold register with low-stock status.
- Delivery has persisted order/contact/address/provider data and a mutable dispatch status tracker. Marketplace webhooks and rider apps are not integrated.
- Accounting has a persisted expense register and total outflows. Double-entry, bank reconciliation, payroll, and filings are not implemented.
- AI screens use actual completed-order analytics for summaries and best-seller/margin/low-sales questions. Forecast labels no longer claim unimplemented weather/holiday prediction or fabricate supplier stock data.
- Standard demo plan exposes showcase feature flags so the operational pages can be exercised; Basic plan restrictions remain.
- CORS allows both `http://localhost:5173` and `http://127.0.0.1:5173`, which resolved the browser login request failure.
- `seed.py` seeds the Ceylon Spice Bistro demo tenant, four staff roles from the handover guide, an accountant demo user, five tables, 20 Sri Lankan menu items, and a demo invoice.

## Local run

Start the backend and frontend development servers from their folders as described in `backend/README.md` and `frontend/README.md`. The current sandbox could not bind local ports, so servers are not confirmed running from this turn.

- Frontend: <http://127.0.0.1:5173/>
- Backend: <http://127.0.0.1:4000/>
- Swagger UI: <http://127.0.0.1:4000/docs>
- Health check: <http://127.0.0.1:4000/health>

The local backend currently uses SQLite (`backend/ralypto.db`) because no database URL was set. Set `DATABASE_URL` in `backend/.env` to use the PostgreSQL service from the repository's Docker Compose setup.

## Demo credentials

All demo passwords are `pass123`.

| Role | Email | PIN |
| --- | --- | --- |
| Owner | `owner@ralypto.com` | `1234` |
| Cashier | `cashier@ralypto.com` | `2222` |
| Waiter | `waiter@ralypto.com` | `3333` |
| Kitchen | `kitchen@ralypto.com` | `4444` |
| Accountant | `accountant@ralypto.com` | `5555` |

Restaurant code for PIN login: `CEY101`.

## Verification so far

- The persisted-module backend tests pass against an in-memory seeded SQLite database: staff create/update/deactivate, no PIN disclosure, settings upsert and restaurant tax/name updates, inventory/delivery/accounting CRUD, and unknown collection rejection.
- Existing core API integration tests from the prior run passed against a disposable seeded database for auth/role checks, menu availability, reservations, waitlist, POS checkout/refund, waiter-to-kitchen, and public QR flows.
- Frontend Vitest passed 71 tests across 14 files; production Vite/PWA build succeeded after these changes. A final typecheck passed as part of the production build.
- Browser E2E specs were corrected for current demo PINs, real table labels, and actual backend data. The expanded E2E suite was not run because this sandbox denied binding localhost ports.
- Browser checks showed 20 live menu items, persisted availability and price edits (then restored), real table records, live kitchen empty-state instead of sample tickets, waiter menu/table data, QR menu and a successful waiter-call toast.
- Browser and API checks did not place a lasting order or payment in the showcase database.

## Current demo behavior

No completed orders or payments are seeded, so report pages correctly show empty data until an order completes.

## Remaining external or advanced integrations

- Connected external delivery marketplace APIs, inbound order webhooks, and rider dispatch are still provider-dependent.
- Inventory does not yet deduct recipe ingredients automatically and has no supplier purchase orders or spoilage/audit workflow.
- Accounting is a basic expense register; it is not a statutory or double-entry accounting product.
- AI is a data-backed analytics assistant and historical ranking, not an LLM integration or trained demand forecast.
- Language/theme and offline diagnostics remain device-local preferences/status, which is intentional for browser-level settings.

## Next backend work

- Add formal Alembic migrations rather than relying on SQLAlchemy `create_all` during application import.
- Run the updated Playwright suite using a dedicated disposable API database and local ports after the execution environment permits localhost binding.
- Integrate Redis for cross-process WebSocket fan-out if multiple backend workers are used.
