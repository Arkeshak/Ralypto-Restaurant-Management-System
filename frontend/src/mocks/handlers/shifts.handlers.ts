import { http, HttpResponse } from 'msw';
import { MOCK_SHIFT } from '../data/mockData';

let currentShift = { ...MOCK_SHIFT };

export const shiftsHandlers = [
  http.get('*/shifts/current', () => {
    return HttpResponse.json(currentShift);
  }),

  http.post('*/shifts/open', async ({ request }) => {
    const body = (await request.json()) as any;
    currentShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      closedAt: null,
      openingFloatCents: body.openingFloatCents || 1000000,
      cashSalesCents: 0,
      cardSalesCents: 0,
      expectedCashCents: body.openingFloatCents || 1000000,
      status: 'open',
    };
    return HttpResponse.json(currentShift, { status: 201 });
  }),

  http.post('*/shifts/close', async ({ request }) => {
    const body = (await request.json()) as any;
    currentShift.status = 'closed';
    currentShift.closedAt = new Date().toISOString();
    currentShift.closingCashCents = body.closingCashCents;
    currentShift.cashDifferenceCents =
      (body.closingCashCents || 0) - (currentShift.expectedCashCents || 0);
    return HttpResponse.json(currentShift);
  }),
];
