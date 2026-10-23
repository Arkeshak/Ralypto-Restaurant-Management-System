import { apiClient } from '../client';
import type { Plan, FeatureFlags } from '../types';

export const subscriptionApi = {
  getCurrentSubscription: () =>
    apiClient<{
      subscriptionId: string;
      status: string;
      currentPlan: Plan;
      currentPeriodEnd: string;
      featureFlags: FeatureFlags;
    }>('/subscription'),

  getInvoices: () =>
    apiClient<
      Array<{
        id: string;
        invoiceNumber: string;
        amountCents: number;
        status: string;
        dueDate: string;
        paidAt?: string;
      }>
    >('/subscription/invoices'),
};
