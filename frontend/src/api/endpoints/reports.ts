import { apiClient } from '../client';
import type { Order } from '../types';

export const reportsApi = {
  getDashboard: () =>
    apiClient<{
      todaySalesCents: number;
      ordersCount: number;
      activeTables: number;
      averageTicketCents: number;
      recentOrders: Order[];
    }>('/reports/dashboard'),

  getSalesReport: (params?: { startDate?: string; endDate?: string }) =>
    apiClient<{
      totalSalesCents: number;
      totalOrders: number;
      paymentBreakdown: {
        cashCents: number;
        cardCents: number;
      };
    }>('/reports/sales', { params }),
};
