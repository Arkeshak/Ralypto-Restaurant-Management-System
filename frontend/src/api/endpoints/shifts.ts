import { apiClient } from '../client';
import type { Shift } from '../types';

export const shiftsApi = {
  getCurrentShift: () => apiClient<Shift | null>('/shifts/current'),

  openShift: (openingFloatCents: number, notes?: string) =>
    apiClient<Shift>('/shifts/open', {
      method: 'POST',
      body: JSON.stringify({ openingFloatCents, notes }),
    }),

  closeShift: (closingCashCents: number, notes?: string) =>
    apiClient<Shift>('/shifts/close', {
      method: 'POST',
      body: JSON.stringify({ closingCashCents, notes }),
    }),
};
