import { apiClient } from '../client';
import type { Order } from '../types';

export const reportsApi = {
  getAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    apiClient<Record<string, Array<Record<string, any>>>>('/reports/analytics', { params }),

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
