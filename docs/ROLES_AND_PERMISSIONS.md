# Ralypto - Roles, Permissions & Security Matrix

This document defines the Role-Based Access Control (RBAC) model implemented across Ralypto, including permission levels per module and the Manager-PIN security protocol for sensitive floor operations.

---

## 1. System Roles

1. **Super Admin**: Platform operator managing restaurant tenants, subscriptions, and platform-wide configurations.
2. **Owner**: Restaurant business proprietor with unrestricted access across all branch operations, accounting, staff management, and billing settings.
3. **Manager**: Floor supervisor responsible for day-to-day operations, shift approvals, inventory adjustments, and authorising restricted actions (voids, discounts, refunds).
4. **Cashier**: Counter staff operating the POS billing terminal, opening/closing cash drawers, processing payments, and printing customer receipts.
5. **Waiter**: Floor service staff using mobile/tablet devices to enter table orders, check kitchen ticket status, and handle table service requests.
6. **Kitchen / Bar Staff**: Kitchen Display System (KDS) operators viewing live prep tickets and marking item preparation stages.
7. **Accountant**: Financial auditor managing journal entries, expense vouchers, payroll reconciliation, and tax/P&L statements.
8. **Customer (QR)**: Public diners accessing the digital menu via table-specific QR codes with self-order and waiter-calling capabilities (no login credentials required).

---

## 2. Module Permission Matrix

Legend:
- **CRUD**: Full access (Create, Read, Update, Delete)
- **CRU**: Create, Read, Update (Cannot Delete)
- **RU**: Read & Update
- **R**: Read Only (View)
- **CR**: Create & Read
- **None**: No Access (Hidden from UI / Denied by API)

| Module | Super Admin | Owner | Manager | Cashier | Waiter | Kitchen | Accountant | Customer (QR) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **POS Billing** | R | CRUD | CRUD | CRU* | None | None | R | None |
| **Table Management** | R | CRUD | CRUD | RU | RU | None | None | R (Own Table) |
| **Menu Catalog** | CRUD | CRUD | CRUD | R | R | R | R | R (Active Only) |
| **Kitchen Display (KDS)** | R | CRUD | CRUD | R | R | RU | None | None |
| **Waiter App** | None | CRUD | CRUD | R | CRUD | None | None | None |
| **QR Self-Ordering** | None | CRUD | CRUD | R | R | None | None | CR (Own Table) |
| **Inventory & GRN** | R | CRUD | CRUD | None | None | None | R | None |
| **Accounting & Expenses** | R | CRUD | R | None | None | None | CRUD | None |
| **HR & Payroll** | R | CRUD | RU (Attendance) | None | None | None | CRUD | None |
| **Reports (Basic)** | CRUD | CRUD | CRUD | R (Own Shift) | None | None | CRUD | None |
| **Reports (Advanced / P&L)** | CRUD | CRUD | R | None | None | None | CRUD | None |
| **Delivery Orders** | R | CRUD | CRUD | CRU | None | R | R | None |
| **AI Insights Suite** | R | CRUD | CRUD | None | None | None | R | None |
| **Tenant Subscriptions** | CRUD | CRUD | None | None | None | None | None | None |

*\* Note: Cashiers can create and update active orders, but cannot void orders or apply line-item discounts above 10% without an authorized Manager PIN.*

---

## 3. The Manager-PIN Protocol (High-Risk Actions)

To prevent revenue leakage and inventory discrepancies, high-risk actions in the POS terminal require dual authorization via a **Manager PIN Prompt**:

### Actions Requiring Manager PIN:
1. **Voiding an Order**: Canceling an order after items have already been fired to the kitchen.
2. **Deleting a Sent Item**: Removing an individual line-item that is marked `preparing` or `ready`.
3. **Applying Custom Discount**: Manual bill discounts exceeding standard cashier limits (e.g. > 10% or > LKR 1,000).
4. **Processing a Refund**: Reversing a finalized payment transaction or reopening a settled bill.
5. **Drawer Pop (No Sale)**: Opening the electronic cash drawer without a cash transaction.
6. **Reprinting Past Shift Summaries**: Accessing historical shift z-reports.

### Workflow & Security Rule:
- When an operator initiates a restricted action, the frontend opens a secure numeric keypad modal requesting a **Manager PIN**.
- The frontend sends the operation payload along with header `X-Manager-Pin: <4-digit-pin>` or as part of the request body (e.g. `POST /api/v1/orders/{id}/void`).
- The backend verifies that the PIN belongs to a user with role `Owner` or `Manager` assigned to the **same `restaurant_id`**.
- Upon approval, the action is executed and an immutable record is logged in the `audit_logs` table containing:
  - `action_type`: `ORDER_VOID` | `ITEM_CANCEL` | `CUSTOM_DISCOUNT` | `REFUND`
  - `initiated_by_user_id`: Cashier ID
  - `authorized_by_user_id`: Manager ID
  - `reason`: Mandatory text description entered by manager
  - `timestamp`: UTC datetime
  - `metadata`: Prior state and affected values

---

## 4. Default Home Route by Role

Upon successful authentication, the frontend router automatically redirects users to their primary workspace:

| Role | Landing Route |
| :--- | :--- |
| **Owner** | `/reports/dashboard` (Executive KPI Dashboard) |
| **Manager** | `/reports/dashboard` (Floor Operations Summary) |
| **Cashier** | `/pos` (Interactive Floor & Table Map) |
| **Waiter** | `/waiter` (Mobile Table & Order Dispatcher) |
| **Kitchen** | `/kitchen` (KDS Ticket Board) |
| **Accountant** | `/accounting` (Financial Ledger & Invoices) |
| **Super Admin** | `/admin` (Tenant Management & Subscriptions) |
| **Customer** | `/qr/{restaurantCode}/{tableNumber}` (Customer Digital Menu) |
