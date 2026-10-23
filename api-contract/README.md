# Ralypto - API Contract & WebSocket Specifications

This directory contains the authoritative API specification for Ralypto.

---

## 1. The Single Source of Truth

The file [`openapi.yaml`](openapi.yaml) defines the contract between Arkesh (Frontend) and the Backend Lead.

> [!IMPORTANT]
> **Contract-First Rule**:
> Never build a feature or introduce a new field in code without updating `openapi.yaml` first.
> Any change to an endpoint, schema, parameter, or status code must be committed to this contract and agreed upon before modifying application code.

---

## 2. How to Preview & Validate the Contract

### Option A: Local Interactive Preview via Redocly (Recommended)
You can launch an interactive documentation viewer locally:
```bash
npx @redocly/cli preview-docs api-contract/openapi.yaml
```
Open [http://127.0.0.1:8080](http://127.0.0.1:8080) to browse and test endpoints with full syntax highlighting.

### Option B: Lint and Validate the Schema
Ensure the contract has no syntax or schema violations:
```bash
npx @redocly/cli lint api-contract/openapi.yaml
```

### Option C: Online Swagger Editor
Copy the content of `openapi.yaml` into [editor.swagger.io](https://editor.swagger.io).

---

## 3. Real-Time WebSocket Events Specification

In addition to REST endpoints, Ralypto uses a bidirectional WebSocket connection on `/ws` (or `ws://localhost:4000/ws`) for sub-second floor coordination.

### WebSocket Connection & Handshake
- **Connection URL**: `ws://localhost:4000/ws?token=<JWT_ACCESS_TOKEN>`
- **Room / Channel Subscription**: Upon connection, clients are automatically bound to room: `tenant:<restaurant_id>`.

### Event Catalog

#### 1. `order.created`
- **Fired When**: An order is placed by Cashier, Waiter, or Customer QR self-order.
- **Subscribers**: POS Terminals, Waiter Tablets, Kitchen KDS.
- **Payload**:
  ```json
  {
    "event": "order.created",
    "timestamp": "2026-10-23T10:15:00Z",
    "data": {
      "orderId": "ord-1005",
      "orderNumber": "ORD-1005",
      "tableNumber": "Table 5",
      "orderType": "dine_in",
      "itemCount": 3,
      "totalCents": 379500
    }
  }
  ```

#### 2. `order.updated`
- **Fired When**: Items are added, bill requested, or payment settled.
- **Subscribers**: POS Terminals, Waiter Tablets.
- **Payload**:
  ```json
  {
    "event": "order.updated",
    "timestamp": "2026-10-23T10:30:00Z",
    "data": {
      "orderId": "ord-1005",
      "status": "billed",
      "subtotalCents": 345000,
      "totalCents": 379500
    }
  }
  ```

#### 3. `kitchen.ticket.status_changed`
- **Fired When**: Chef marks an item/ticket `preparing`, `ready`, or `collected`.
- **Subscribers**: POS Terminals, Waiter Tablets, Customer QR status view.
- **Payload**:
  ```json
  {
    "event": "kitchen.ticket.status_changed",
    "timestamp": "2026-10-23T10:28:00Z",
    "data": {
      "ticketId": "kot-042",
      "orderId": "ord-1005",
      "orderNumber": "ORD-1005",
      "tableNumber": "Table 5",
      "station": "kitchen",
      "status": "ready"
    }
  }
  ```

#### 4. `table.status_changed`
- **Fired When**: Table state toggles (`available` -> `occupied` -> `billed` -> `cleaning`).
- **Subscribers**: Cashier POS Table Map, Waiter App Table Map.
- **Payload**:
  ```json
  {
    "event": "table.status_changed",
    "timestamp": "2026-10-23T10:15:00Z",
    "data": {
      "tableId": "table-005",
      "tableNumber": "Table 5",
      "previousStatus": "available",
      "newStatus": "occupied",
      "activeOrderId": "ord-1005"
    }
  }
  ```

#### 5. `waiter.called`
- **Fired When**: Customer presses the "Call Waiter" or "Request Bill" button on the QR web app.
- **Subscribers**: Waiter Mobile App (triggers audio chime and visual alert), POS Cashier.
- **Payload**:
  ```json
  {
    "event": "waiter.called",
    "timestamp": "2026-10-23T10:40:00Z",
    "data": {
      "tableId": "table-005",
      "tableNumber": "Table 5",
      "requestType": "bill",
      "customerName": "Kasun"
    }
  }
  ```
