import Dexie, { type Table } from 'dexie';

export interface LocalOrder {
  clientUuid: string;
  restaurantId: string;
  tableId?: string;
  tableNumber?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'qr_self_order';
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    notes?: string;
  }>;
  subtotalCents: number;
  totalCents: number;
  status: 'draft' | 'confirmed' | 'billed' | 'completed';
  payment?: {
    method: 'cash';
    amountCents: number;
    timestamp: string;
  };
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
  createdAt: string;
}

export interface CachedMenuItem {
  id: string;
  categoryId: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
  image?: string;
}

export interface CachedTable {
  id: string;
  number: number;
  seats: number;
  status: string;
  area: string;
  totalCents?: number;
  minutesOpen?: number;
}

export interface SyncQueueItem {
  id?: number;
  clientUuid: string;
  queuedAt: string;
  nextRetryAt?: number;
}

export class RalyptoDatabase extends Dexie {
  offlineOrders!: Table<LocalOrder, string>;
  cachedMenu!: Table<CachedMenuItem, string>;
  cachedTables!: Table<CachedTable, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('RalyptoDB');
    this.version(1).stores({
      offlineOrders: 'clientUuid, syncStatus, createdAt',
      cachedMenu: 'id, categoryId',
      syncQueue: '++id, clientUuid, queuedAt',
    });

    this.version(2).stores({
      offlineOrders: 'clientUuid, syncStatus, createdAt',
      cachedMenu: 'id, categoryId',
      cachedTables: 'id, area',
      syncQueue: '++id, clientUuid, queuedAt, nextRetryAt',
    });
  }
}

export const db = new RalyptoDatabase();
