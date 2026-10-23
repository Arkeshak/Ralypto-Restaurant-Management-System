import { http, HttpResponse } from 'msw';
import { PLAN_FEATURE_FLAGS_MAP } from '../../stores/auth.store';
import {
  getMockRestaurantPlan,
  getMockPlanCode,
  setMockRestaurantPlan,
  MOCK_PLANS,
} from '../data/mockData';

export const subscriptionHandlers = [
  http.get('*/subscription', () => {
    const currentPlan = getMockRestaurantPlan();
    const planCode = getMockPlanCode();

    return HttpResponse.json({
      subscriptionId: 'sub-' + planCode + '-001',
      status: 'active',
      currentPlan,
      currentPeriodEnd: '2026-11-01T00:00:00Z',
      featureFlags: PLAN_FEATURE_FLAGS_MAP[planCode],
    });
  }),

  http.post('*/subscription/switch-plan', async ({ request }) => {
    const body = (await request.json()) as { planCode?: 'basic' | 'standard' | 'premium' };
    if (body.planCode && MOCK_PLANS[body.planCode]) {
      setMockRestaurantPlan(body.planCode);
      return HttpResponse.json({
        success: true,
        currentPlan: getMockRestaurantPlan(),
        featureFlags: PLAN_FEATURE_FLAGS_MAP[body.planCode],
      });
    }
    return HttpResponse.json({ code: 'INVALID_PLAN', message: 'Invalid plan code' }, { status: 400 });
  }),

  http.get('*/subscription/invoices', () => {
    return HttpResponse.json([
      {
        id: 'inv-2026-10',
        invoiceNumber: 'INV-RAL-1042',
        amountCents: 2450000,
        status: 'paid',
        dueDate: '2026-10-01',
        paidAt: '2026-10-02T10:30:00Z',
      },
      {
        id: 'inv-2026-09',
        invoiceNumber: 'INV-RAL-0941',
        amountCents: 2450000,
        status: 'paid',
        dueDate: '2026-09-01',
        paidAt: '2026-09-01T15:20:00Z',
      },
    ]);
  }),
];
