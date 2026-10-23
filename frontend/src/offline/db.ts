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
  createdAt: string;
}

export interface CachedMenuItem {
  id: string;
  categoryId: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
}

export interface SyncQueueItem {
  id?: number;
  clientUuid: string;
  queuedAt: string;
}

export class RalyptoDatabase extends Dexie {
  offlineOrders!: Table<LocalOrder, string>;
  cachedMenu!: Table<CachedMenuItem, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('RalyptoDB');
    this.version(1).stores({
      offlineOrders: 'clientUuid, syncStatus, createdAt',
      cachedMenu: 'id, categoryId',
      syncQueue: '++id, clientUuid, queuedAt',
    });
  }
}

export const db = new RalyptoDatabase();
