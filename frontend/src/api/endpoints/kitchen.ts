import { apiClient } from '../client';
import type { KitchenTicket } from '../types';

export const kitchenApi = {
  getTickets: (station?: 'kitchen' | 'bar') =>
    apiClient<KitchenTicket[]>('/kitchen/orders', {
      params: station ? { station } : undefined,
    }),

  updateTicketStatus: (
    id: string,
    status: 'new' | 'preparing' | 'ready' | 'collected'
  ) =>
    apiClient<KitchenTicket>(`/kitchen/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
