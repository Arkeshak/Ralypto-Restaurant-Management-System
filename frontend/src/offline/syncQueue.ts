import { db, type LocalOrder } from './db';
import { ordersApi } from '../api/endpoints/orders';

/**
 * Offline Sync Queue Manager
 * Reconciles locally stored orders with the backend server upon internet restoration.
 */
export async function queueOfflineOrder(order: LocalOrder): Promise<void> {
  await db.offlineOrders.put(order);
  await db.syncQueue.add({
    clientUuid: order.clientUuid,
    queuedAt: new Date().toISOString(),
  });
}

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  const queuedItems = await db.syncQueue.toArray();
  let synced = 0;
  let failed = 0;

  for (const item of queuedItems) {
    const localOrder = await db.offlineOrders.get(item.clientUuid);
    if (!localOrder) {
      if (item.id) await db.syncQueue.delete(item.id);
      continue;
    }

    try {
      // Mark syncing
      await db.offlineOrders.update(localOrder.clientUuid, { syncStatus: 'syncing' });

      // Post order to backend
      await ordersApi.createOrder({
        tableId: localOrder.tableId,
        orderType: localOrder.orderType,
        clientCreatedUuid: localOrder.clientUuid,
        items: localOrder.items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes,
        })),
      });

      // If order had cash payment settled offline, settle on backend
      if (localOrder.payment && localOrder.payment.method === 'cash') {
        // TODO: Call ordersApi.pay with client payment details
      }

      await db.offlineOrders.update(localOrder.clientUuid, { syncStatus: 'synced' });
      if (item.id) await db.syncQueue.delete(item.id);
      synced++;
    } catch (error) {
      console.error(`[OfflineSync] Failed to sync order ${localOrder.clientUuid}`, error);
      await db.offlineOrders.update(localOrder.clientUuid, {
        syncStatus: 'failed',
        retryCount: (localOrder.retryCount || 0) + 1,
      });
      failed++;
    }
  }

  return { synced, failed };
}
