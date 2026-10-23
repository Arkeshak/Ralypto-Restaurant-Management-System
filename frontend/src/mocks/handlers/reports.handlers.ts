import { http, HttpResponse } from 'msw';
import { MOCK_ORDERS } from '../data/mockData';

export const reportsHandlers = [
  http.get('*/reports/dashboard', () => {
    return HttpResponse.json({
      todaySalesCents: 28450000,
      ordersCount: 76,
      activeTables: 5,
      averageTicketCents: 374342,
      recentOrders: MOCK_ORDERS,
    });
  }),

  http.get('*/reports/sales', () => {
    return HttpResponse.json({
      totalSalesCents: 450200000,
      totalOrders: 1240,
      paymentBreakdown: {
        cashCents: 210000000,
        cardCents: 240200000,
      },
    });
  }),
];
