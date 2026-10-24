import { db, type LocalOrder, type CachedMenuItem, type CachedTable } from './db';
import { ordersApi } from '../api/endpoints/orders';
import { toast } from 'sonner';

const BACKOFF_DELAYS_MS = [5000, 15000, 60000];

type SyncListener = (state: { isSyncing: boolean; syncingCount: number }) => void;
const syncListeners: Set<SyncListener> = new Set();

let isSyncInProgress = false;

export function subscribeSyncState(listener: SyncListener): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

function notifySyncState(isSyncing: boolean, syncingCount: number) {
  syncListeners.forEach((fn) => fn({ isSyncing, syncingCount }));
}

/**
 * Queue an offline order with a unique client-generated UUID
 */
export async function queueOfflineOrder(order: LocalOrder): Promise<void> {
  const finalOrder: LocalOrder = {
    ...order,
    clientUuid: order.clientUuid || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    syncStatus: 'pending',
    retryCount: 0,
    createdAt: order.createdAt || new Date().toISOString(),
  };

  await db.offlineOrders.put(finalOrder);
  await db.syncQueue.add({
    clientUuid: finalOrder.clientUuid,
    queuedAt: new Date().toISOString(),
    nextRetryAt: Date.now(),
  });
}

/**
 * Reconcile offline queue with server using backoff retry
 */
export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (isSyncInProgress) {
    return { synced: 0, failed: 0 };
  }

  isSyncInProgress = true;
  let synced = 0;
  let failed = 0;

  try {
    const now = Date.now();
    const queuedItems = await db.syncQueue.toArray();
    const eligibleItems = queuedItems.filter((i) => !i.nextRetryAt || i.nextRetryAt <= now);

    if (eligibleItems.length === 0) {
      return { synced: 0, failed: 0 };
    }

    notifySyncState(true, eligibleItems.length);

    for (const item of eligibleItems) {
      const localOrder = await db.offlineOrders.get(item.clientUuid);
      if (!localOrder) {
        if (item.id) await db.syncQueue.delete(item.id);
        continue;
      }

      // Skip already synced
      if (localOrder.syncStatus === 'synced') {
        if (item.id) await db.syncQueue.delete(item.id);
        continue;
      }

      try {
        await db.offlineOrders.update(localOrder.clientUuid, { syncStatus: 'syncing' });

        // Post order with idempotent clientUuid
        const serverOrder = await ordersApi.createOrder({
          tableId: localOrder.tableId,
          orderType: localOrder.orderType,
          clientCreatedUuid: localOrder.clientUuid,
          items: localOrder.items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            notes: i.notes,
          })),
        });

        // Settle payment if cash payment occurred while offline
        if (localOrder.payment && localOrder.payment.method === 'cash') {
          try {
            await ordersApi.pay(serverOrder.id, {
              amountCents: localOrder.payment.amountCents,
              paymentMethod: 'cash',
              tenderedCents: localOrder.payment.amountCents,
            });
          } catch {
            // Payment settlement error; server has the order
          }
        }

        // Mark synced and delete from syncQueue
        await db.offlineOrders.update(localOrder.clientUuid, {
          syncStatus: 'synced',
          lastError: undefined,
        });

        if (item.id) {
          await db.syncQueue.delete(item.id);
        }
        synced++;
      } catch (error: any) {
        const nextRetry = (localOrder.retryCount || 0) + 1;
        const delayIdx = Math.min(nextRetry - 1, BACKOFF_DELAYS_MS.length - 1);
        const delayMs = BACKOFF_DELAYS_MS[delayIdx];

        await db.offlineOrders.update(localOrder.clientUuid, {
          syncStatus: 'failed',
          retryCount: nextRetry,
          lastError: error?.message || 'Network error syncing order',
        });

        if (item.id) {
          await db.syncQueue.update(item.id, {
            nextRetryAt: Date.now() + delayMs,
          });
        }
        failed++;
      }
    }

    if (synced > 0) {
      toast.success(`${synced} order${synced > 1 ? 's' : ''} synced`);
    }
  } finally {
    isSyncInProgress = false;
    notifySyncState(false, 0);
  }

  return { synced, failed };
}

/**
 * Manually retry a failed offline order
 */
export async function retryFailedOrder(clientUuid: string): Promise<boolean> {
  const localOrder = await db.offlineOrders.get(clientUuid);
  if (!localOrder) return false;

  await db.offlineOrders.update(clientUuid, { syncStatus: 'pending' });
  const existingQueue = await db.syncQueue.where('clientUuid').equals(clientUuid).first();
  if (existingQueue && existingQueue.id) {
    await db.syncQueue.update(existingQueue.id, { nextRetryAt: Date.now() });
  } else {
    await db.syncQueue.add({
      clientUuid,
      queuedAt: new Date().toISOString(),
      nextRetryAt: Date.now(),
    });
  }

  const res = await processSyncQueue();
  return res.synced > 0;
}

/**
 * Menu and Table Caching for full offline resilience
 */
export async function cacheMenu(items: CachedMenuItem[]): Promise<void> {
  await db.cachedMenu.clear();
  await db.cachedMenu.bulkPut(items);
}

export async function getCachedMenu(): Promise<CachedMenuItem[]> {
  return db.cachedMenu.toArray();
}

export async function cacheTables(tables: CachedTable[]): Promise<void> {
  await db.cachedTables.clear();
  await db.cachedTables.bulkPut(tables);
}

export async function getCachedTables(): Promise<CachedTable[]> {
  return db.cachedTables.toArray();
}

/**
 * Initialize offline sync listeners on app startup
 */
export function initOfflineSync(): () => void {
  // Run on startup
  processSyncQueue().catch(() => {});

  const handleOnline = () => {
    processSyncQueue().catch(() => {});
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    // Recurring check every 15s for retries
    const interval = setInterval(() => {
      if (navigator.onLine) {
        processSyncQueue().catch(() => {});
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }

  return () => {};
}
