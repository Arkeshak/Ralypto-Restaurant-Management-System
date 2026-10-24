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
      const payments = body.allocations?.length
        ? body.allocations
            .filter((allocation: { amountCents: number }) => allocation.amountCents > 0)
            .map((allocation: { amountCents: number; paymentMethod: string }) => ({
              id: `pay-${Date.now()}-${allocation.paymentMethod}`,
              orderId: order.id,
              amountCents: allocation.amountCents,
              paymentMethod: allocation.paymentMethod,
              status: 'completed',
              createdAt: new Date().toISOString(),
            }))
        : [{
            id: `pay-${Date.now()}`,
            orderId: order.id,
            amountCents: body.amountCents || order.totalCents,
            paymentMethod: body.paymentMethod || 'cash',
            status: 'completed',
            tenderedCents: body.tenderedCents,
            changeCents: body.changeCents,
            createdAt: new Date().toISOString(),
          }];
      const amountPaidCents = payments.reduce(
        (total: number, payment: { amountCents: number }) => total + payment.amountCents,
        0
      );
      const outstandingCents = Math.max(0, order.totalCents - amountPaidCents);
      order.status = outstandingCents === 0 ? 'completed' : 'billed';
      return HttpResponse.json({
        order,
        payment: payments[0],
        payments,
        amountPaidCents,
        outstandingCents,
      });
    }
    return HttpResponse.json({ code: 'ORDER_NOT_FOUND', message: 'Order not found' }, { status: 404 });
  }),

  http.post('*/orders/:id/void', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { managerPin: string; reason: string; voidedBy?: string };

    if (!['1234', '1111', '2222'].includes(body.managerPin)) {
      return HttpResponse.json(
        { code: 'FORBIDDEN', message: 'Invalid Manager PIN authorization' },
        { status: 403 }
      );
    }

    const order = orders.find((o) => o.id === id);
    if (order) {
      order.status = 'voided';
      (order as any).voidedAt = new Date().toISOString();
      (order as any).voidedBy = body.voidedBy || 'Manager';
      (order as any).voidReason = body.reason;
      return HttpResponse.json(order);
    }
    return HttpResponse.json({ code: 'ORDER_NOT_FOUND', message: 'Order not found' }, { status: 404 });
  }),

  http.post('*/orders/:id/refund', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as { managerPin: string; reason: string; refundedBy?: string };

    if (!['1234', '1111', '2222'].includes(body.managerPin)) {
      return HttpResponse.json(
        { code: 'FORBIDDEN', message: 'Invalid Manager PIN authorization' },
        { status: 403 }
      );
    }

    const order = orders.find((o) => o.id === id);
    if (order) {
      (order as any).status = 'refunded';
      (order as any).refundedAt = new Date().toISOString();
      (order as any).refundedBy = body.refundedBy || 'Manager';
      (order as any).refundReason = body.reason;
      return HttpResponse.json(order);
    }
    return HttpResponse.json({ code: 'ORDER_NOT_FOUND', message: 'Order not found' }, { status: 404 });
  }),
];
