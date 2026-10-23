import { http, HttpResponse } from 'msw';
import { PLAN_FEATURE_FLAGS_MAP } from '../../stores/auth.store';

export const subscriptionHandlers = [
  http.get('*/subscription', () => {
    return HttpResponse.json({
      subscriptionId: 'sub-std-001',
      status: 'active',
      currentPlan: {
        id: 'plan-std',
        code: 'standard',
        name: 'Standard Plan',
        monthlyPriceCents: 2450000,
      },
      currentPeriodEnd: '2026-11-01T00:00:00Z',
      featureFlags: PLAN_FEATURE_FLAGS_MAP['standard'],
    });
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
