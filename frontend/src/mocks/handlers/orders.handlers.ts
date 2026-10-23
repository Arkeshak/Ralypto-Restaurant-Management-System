import { http, HttpResponse } from 'msw';
import { MOCK_ORDERS } from '../data/mockData';
import type { Order } from '../../api/types';

let orders = [...MOCK_ORDERS];

export const ordersHandlers = [
  http.get('*/orders', () => {
    return HttpResponse.json(orders);
  }),

  http.get('*/orders/:id', ({ params }) => {
    const { id } = params;
    const order = orders.find((o) => o.id === id);
    if (order) return HttpResponse.json(order);
    return HttpResponse.json({ code: 'ORDER_NOT_FOUND', message: 'Order not found' }, { status: 404 });
  }),

  http.post('*/orders', async ({ request }) => {
    const body = (await request.json()) as any;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      tableId: body.tableId,
      tableNumber: body.tableId ? 'Table 5' : null,
      orderType: body.orderType || 'dine_in',
      status: 'confirmed',
      items: (body.items || []).map((item: any, idx: number) => ({
        id: `ord-item-${idx}`,
        menuItemId: item.menuItemId,
        name: 'Chicken Kottu',
        quantity: item.quantity,
        unitPriceCents: 145000,
        subtotalCents: item.quantity * 145000,
        notes: item.notes,
        status: 'pending',
      })),
      subtotalCents: 290000,
      discountCents: 0,
      taxCents: 0,
      serviceChargeCents: 29000,
      totalCents: 319000,
      clientCreatedUuid: body.clientCreatedUuid || null,
      createdAt: new Date().toISOString(),
    };
    orders.unshift(newOrder);
    return HttpResponse.json(newOrder, { status: 201 });
  }),

  http.post('*/orders/:id/send-to-kitchen', ({ params }) => {
    const { id } = params;
    const order = orders.find((o) => o.id === id);
    if (order) {
      order.status = 'preparing';
      order.items.forEach((item) => {
        if (item.status === 'pending') item.status = 'preparing';
      });
      return HttpResponse.json(order);
    }
    return HttpResponse.json({ code: 'ORDER_NOT_FOUND', message: 'Order not found' }, { status: 404 });
  }),

  http.post('*/orders/:id/request-bill', ({ params }) => {
    const { id } = params;
    const order = orders.find((o) => o.id === id);
    if (order) {
      order.status = 'billed';
      return HttpResponse.json(order);
    }
    return HttpResponse.json({ code: 'ORDER_NOT_FOUND', message: 'Order not found' }, { status: 404 });
  }),

  http.post('*/orders/:id/pay', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as any;
    const order = orders.find((o) => o.id === id);
    if (order) {
      order.status = 'completed';
      return HttpResponse.json({
        id: `pay-${Date.now()}`,
        orderId: order.id,
        amountCents: body.amountCents || order.totalCents,
        paymentMethod: body.paymentMethod || 'cash',
        status: 'completed',
        tenderedCents: body.tenderedCents,
        changeCents: body.changeCents,
        createdAt: new Date().toISOString(),
      });
    }
    return HttpResponse.json({ code: 'ORDER_NOT_FOUND', message: 'Order not found' }, { status: 404 });
  }),

  http.post('*/orders/:id/void', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { managerPin: string; reason: string };

    if (body.managerPin !== '1234') {
      return HttpResponse.json(
        { code: 'FORBIDDEN', message: 'Invalid Manager PIN authorization' },
        { status: 403 }
      );
    }

    const order = orders.find((o) => o.id === id);
    if (order) {
      order.status = 'voided';
      return HttpResponse.json(order);
    }
    return HttpResponse.json({ code: 'ORDER_NOT_FOUND', message: 'Order not found' }, { status: 404 });
  }),
];
