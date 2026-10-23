# Ralypto API Change Requests

This document tracks formal change requests, missing endpoints, and contract alignments between the Frontend and Backend teams. All items are mocked in the frontend MSW layer until implemented by the backend engineer.

| # | Item | What Frontend Needs | Why | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CR-01** | Table Move | `POST /tables/move`<br>Body: `{ sourceTableId: string, targetTableId: string }` | Waiters and cashiers need to move diners to another free table when guests request seating change. | **Requested** (Mocked in MSW) |
| **CR-02** | Table Merge | `POST /tables/merge`<br>Body: `{ sourceTableId: string, targetTableId: string, managerPin?: string }` | Large dining parties occupy multiple tables and request one combined bill before payment. | **Requested** (Mocked in MSW) |
| **CR-03** | Menu Item Update Method | `PATCH /menu/items/{id}`<br>Body: `Partial<MenuItem>` | Currently openapi.yaml only specifies `POST /menu/items`. Updating availability (86/sold-out) or price should be a `PATCH` on the item ID. | **Requested** (Mocked in MSW) |
| **CR-04** | Modifier Price Validation | Backend catalog validation on `POST /orders` item modifiers | Frontend sends modifier option IDs; backend must compute prices from DB catalog to prevent client tampering. | **Requested** |
| **CR-05** | Tax & Service Charge in Payment | `POST /orders/{id}/pay` response includes:<br>`subtotalCents`, `discountCents`, `serviceChargeCents` (10%), `vatCents`, `ssclCents`, `totalCents`, `tenderedCents`, `changeCents` | Thermal receipts and legal accounting in Sri Lanka require exact itemized breakdown of service charge and taxes. | **Requested** (Mocked in MSW) |
| **CR-06** | Public QR Route Auth Bypass | Exclude `/public/menu/**`, `/public/orders`, `/public/call-waiter` from JWT Bearer auth | Customers scanning physical table QR codes are anonymous diners who must not be challenged with staff login tokens. | **Requested** |
| **CR-07** | WebSocket Event Envelope | Standard envelope for all events:<br>`{ event: string, timestamp: string, payload: any }` | Frontend socket client requires uniform event deserialization and dispatching. | **Requested** |
| **CR-08** | Shift Summary Calculation | `POST /shifts/close` response includes:<br>`openingFloatCents`, `expectedCashCents`, `closingCashCents`, `differenceCents`, `breakdownByMethod` | POS requires cash drawer reconciliation to alert managers immediately if cash is short or over. | **Requested** (Mocked in MSW) |
| **CR-09** | Order Discount Endpoint | `POST /orders/{id}/discount`<br>Body: `{ type: 'percent' \| 'fixed', value: number, reason: string, managerPin?: string }` | Cashiers need to apply promotions, staff discounts, or goodwill discounts with manager approval above threshold. | **Requested** (Mocked in MSW) |
| **CR-10** | Order Refund & Audit Trail | `POST /orders/{id}/refund`<br>Body: `{ amountCents: number, reason: string, managerPin: string }` | Settled bills requiring return or item void after payment need audit logs with manager PIN and timestamp. | **Requested** (Mocked in MSW) |
