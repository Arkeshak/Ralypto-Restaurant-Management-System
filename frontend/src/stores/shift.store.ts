import { create } from 'zustand';
import { shiftsApi } from '../api/endpoints/shifts';
import type { Shift } from '../api/types';

interface ShiftState {
  currentShift: Shift | null;
  isLoading: boolean;
  error: string | null;
  fetchCurrentShift: () => Promise<void>;
  openShift: (openingFloatCents: number, notes?: string) => Promise<Shift>;
  closeShift: (closingCashCents: number, notes?: string) => Promise<Shift>;
  recordPaymentToShift: (method: 'cash' | 'card' | 'qr_code' | 'online_transfer', amountCents: number) => void;
  isOpen: () => boolean;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  currentShift: null,
  isLoading: false,
  error: null,

  fetchCurrentShift: async () => {
    set({ isLoading: true, error: null });
    try {
      const shift = await shiftsApi.getCurrentShift();
      set({ currentShift: shift, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch shift', isLoading: false });
    }
  },

  openShift: async (openingFloatCents: number, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const shift = await shiftsApi.openShift(openingFloatCents, notes);
      set({ currentShift: shift, isLoading: false });
      return shift;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to open shift', isLoading: false });
      throw err;
    }
  },

  closeShift: async (closingCashCents: number, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      const shift = await shiftsApi.closeShift(closingCashCents, notes);
      set({ currentShift: shift, isLoading: false });
      return shift;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to close shift', isLoading: false });
      throw err;
    }
  },

  recordPaymentToShift: (method, amountCents) => {
    const { currentShift } = get();
    if (!currentShift || currentShift.status !== 'open') return;

    const isCash = method === 'cash';
    const cashSales = (currentShift.cashSalesCents || 0) + (isCash ? amountCents : 0);
    const cardSales = (currentShift.cardSalesCents || 0) + (!isCash ? amountCents : 0);
    const expectedCash = (currentShift.openingFloatCents || 0) + cashSales;

    set({
      currentShift: {
        ...currentShift,
        cashSalesCents: cashSales,
        cardSalesCents: cardSales,
        expectedCashCents: expectedCash,
      },
    });
  },

  isOpen: () => {
    const shift = get().currentShift;
    return Boolean(shift && shift.status === 'open');
  },
}));
