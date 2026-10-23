# Ralypto - Offline Mode Architecture & Sync Specification

Internet connectivity in commercial restaurants can experience intermittent fiber cuts, Wi-Fi interference, or power switch resets. Ralypto provides an offline-first POS architecture ensuring that **taking customer orders and printing bills is never blocked by an internet outage**.

---

## 1. Scope for Version 1

| Functionality | Supported Offline? | Storage / Implementation |
| :--- | :---: | :--- |
| **Menu Catalog Browsing** | **Yes** | Cached in IndexedDB (`dexie`) during last online sync |
| **Table Status Viewing** | **Yes** | Cached locally with last known status |
| **Order Creation & Item Modification** | **Yes** | Saved to local `offlineOrders` collection |
| **Receipt & Bill Printing** | **Yes** | Rendered locally and printed via direct ESC/POS or browser print |
| **Order Payment (Cash)** | **Yes** | Marked as paid offline with client timestamp |
| **Payment (Card / Online)** | **No** | Requires payment gateway connectivity |
| **Kitchen KDS Real-time Dispatch** | **Partial** | Cached locally; printed to physical thermal kitchen printer if connected on LAN |
| **Inventory Depletion & GRN** | **No** | Reconciled server-side once connection is restored |
| **Accounting, Reports & HR** | **No** | Server-side only; requires active connection |

---

## 2. IndexedDB Schema (Dexie.js)

The frontend uses **Dexie.js** to manage browser persistence:

```typescript
// frontend/src/offline/db.ts
import Dexie, { type Table } from 'dexie';

export interface LocalOrder {
  clientUuid: string;          // Client-generated UUID v4
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    selectedModifiers: any[];
    notes?: string;
  }>;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  status: 'draft' | 'confirmed' | 'billed' | 'completed';
  payment?: {
    method: 'cash';
    amountCents: number;
    timestamp: string;
  };
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  createdAt: string;
}

export interface CachedMenuItem {
  id: string;
  categoryId: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
}

export class RalyptoDatabase extends Dexie {
  offlineOrders!: Table<LocalOrder, string>;
  cachedMenu!: Table<CachedMenuItem, string>;
  syncQueue!: Table<{ id?: number; clientUuid: string; queuedAt: string }, number>;

  constructor() {
    super('RalyptoDB');
    this.version(1).stores({
      offlineOrders: 'clientUuid, syncStatus, createdAt',
      cachedMenu: 'id, categoryId',
      syncQueue: '++id, clientUuid, queuedAt'
    });
  }
}

export const db = new RalyptoDatabase();
```

---

## 3. Conflict Resolution Rules

When the device transitions from **Offline -> Online**, the client sync worker iterates over the `syncQueue` and POSTs pending orders to `POST /api/v1/orders/offline-sync`.

### The Fundamental Conflict Rules:
1. **Catalog & Prices: SERVER WINS**
   - The server is the absolute authority on menu pricing, taxes, and availability.
   - If a manager updated the price of "Chicken Kottu" from LKR 1,200 to LKR 1,350 on the server while the POS was offline:
     - The offline order was billed to the customer at LKR 1,200.
     - The server honors the transaction at LKR 1,200 as an audited price exception with flag `offline_price_override`, but future orders immediately pull the updated LKR 1,350 catalog.
2. **New Orders: CLIENT WINS (Idempotent UUID)**
   - Every order created on the frontend is stamped with a unique `client_created_uuid`.
   - The backend checks for existing records with that `client_created_uuid`:
     - If not found: Order is inserted as a new order, KOTs are backfilled, and payment is recorded.
     - If already found (e.g. timeout on previous attempt): Backend returns the existing order record without duplicating.
3. **Table Conflicts**:
   - If Table 5 was occupied offline by Cashier A, while another terminal occupied Table 5:
     - The server merges both tabs under Table 5 or prompts the cashier: *"Table 5 already has an active order. Merge items or reassign to Table 6?"*

---

## 4. Visual Offline Indicators (UX)

- When `navigator.onLine === false` or heartbeat ping to `/health` fails:
  - The **`OfflineBadge`** turns vibrant amber with the text: **"Offline Mode - Orders Stored Locally"**.
  - A small floating pill displays the pending sync counter: `[3 unsynced orders]`.
  - When connection returns, the badge turns emerald: **"Syncing 3 orders..."** -> **"Online & Synced"**.
