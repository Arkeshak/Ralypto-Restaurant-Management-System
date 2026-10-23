import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db, type LocalOrder } from './db';
import { queueOfflineOrder, processSyncQueue } from './syncQueue';
import { ordersApi } from '../api/endpoints/orders';

vi.mock('../api/endpoints/orders', () => ({
  ordersApi: {
    createOrder: vi.fn().mockResolvedValue({ id: 'ord-server-123' }),
    pay: vi.fn().mockResolvedValue({ id: 'pay-123' }),
  },
}));

describe('Offline Sync Queue', () => {
  beforeEach(async () => {
    await db.offlineOrders.clear();
    await db.syncQueue.clear();
    vi.clearAllMocks();
  });

  it('queues an offline order with unique clientUuid and stores in Dexie', async () => {
    const mockOrder: LocalOrder = {
      clientUuid: 'order-client-uuid-001',
      restaurantId: 'rest-cey-101',
      tableId: 't-1',
      orderType: 'dine_in',
      items: [
        {
          menuItemId: 'dish-1',
          name: 'Chicken Kottu',
          quantity: 2,
          unitPriceCents: 145000,
        },
      ],
      subtotalCents: 290000,
      totalCents: 319000,
      status: 'confirmed',
      syncStatus: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await queueOfflineOrder(mockOrder);

    const saved = await db.offlineOrders.get('order-client-uuid-001');
    expect(saved).toBeDefined();
    expect(saved?.clientUuid).toBe('order-client-uuid-001');
    expect(saved?.syncStatus).toBe('pending');

    const queueItems = await db.syncQueue.toArray();
    expect(queueItems).toHaveLength(1);
    expect(queueItems[0].clientUuid).toBe('order-client-uuid-001');
  });

  it('syncs offline order once online and marks it as synced', async () => {
    const mockOrder: LocalOrder = {
      clientUuid: 'order-client-uuid-002',
      restaurantId: 'rest-cey-101',
      tableId: 't-2',
      orderType: 'dine_in',
      items: [
        {
          menuItemId: 'dish-2',
          name: 'Egg Roti',
          quantity: 1,
          unitPriceCents: 25000,
        },
      ],
      subtotalCents: 25000,
      totalCents: 27500,
      status: 'confirmed',
      syncStatus: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await queueOfflineOrder(mockOrder);
    const result = await processSyncQueue();

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(ordersApi.createOrder).toHaveBeenCalledTimes(1);
    expect(ordersApi.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        clientCreatedUuid: 'order-client-uuid-002',
      })
    );

    const updated = await db.offlineOrders.get('order-client-uuid-002');
    expect(updated?.syncStatus).toBe('synced');

    const queueItems = await db.syncQueue.toArray();
    expect(queueItems).toHaveLength(0);
  });
});
