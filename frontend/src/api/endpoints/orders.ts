import { apiClient } from '../client';
import type { Order, Payment } from '../types';

export const ordersApi = {
  getOrders: (params?: { status?: string; tableId?: string }) =>
    apiClient<Order[]>('/orders', { params }),

  getOrder: (id: string) => apiClient<Order>(`/orders/${id}`),

  createOrder: (data: {
    tableId?: string;
    orderType: 'dine_in' | 'takeaway' | 'delivery' | 'qr_self_order';
    clientCreatedUuid?: string;
    items?: Array<{
      menuItemId: string;
      quantity: number;
      notes?: string;
      modifiers?: any[];
    }>;
  }) =>
    apiClient<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addItems: (
    id: string,
    items: Array<{ menuItemId: string; quantity: number; notes?: string }>
  ) =>
    apiClient<Order>(`/orders/${id}/items`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  sendToKitchen: (id: string) =>
    apiClient<Order>(`/orders/${id}/send-to-kitchen`, {
      method: 'POST',
    }),

  requestBill: (id: string) =>
    apiClient<Order>(`/orders/${id}/request-bill`, {
      method: 'POST',
    }),

  pay: (
    id: string,
    data: {
      amountCents: number;
      paymentMethod: string;
      tenderedCents?: number;
      changeCents?: number;
    }
  ) =>
    apiClient<Payment>(`/orders/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  voidOrder: (id: string, data: { managerPin: string; reason: string }) =>
    apiClient<Order>(`/orders/${id}/void`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  splitBill: (id: string, data: any) =>
    apiClient<any>(`/orders/${id}/split`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
