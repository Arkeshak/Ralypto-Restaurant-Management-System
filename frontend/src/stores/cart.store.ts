import { create } from 'zustand';
import type { MenuItem, Table } from '../api/types';

export interface CartItem {
  id: string; // unique item id in cart
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: any[];
  notes?: string;
}

interface CartState {
  activeTable: Table | null;
  items: CartItem[];
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'qr_self_order';
  setActiveTable: (table: Table | null) => void;
  setOrderType: (type: 'dine_in' | 'takeaway' | 'delivery' | 'qr_self_order') => void;
  addItem: (menuItem: MenuItem, notes?: string, modifiers?: any[]) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getSubtotalCents: () => number;
  getServiceChargeCents: () => number;
  getTotalCents: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  activeTable: null,
  items: [],
  orderType: 'dine_in',

  setActiveTable: (table) => set({ activeTable: table }),
  setOrderType: (orderType) => set({ orderType }),

  addItem: (menuItem, notes = '', modifiers = []) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.menuItem.id === menuItem.id && i.notes === notes
      );

      if (existingIndex > -1) {
        const next = [...state.items];
        next[existingIndex].quantity += 1;
        return { items: next };
      }

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        menuItem,
        quantity: 1,
        selectedModifiers: modifiers,
        notes,
      };

      return { items: [...state.items, newItem] };
    });
  },

  updateQuantity: (id, delta) => {
    set((state) => {
      const next = state.items
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      return { items: next };
    });
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },

  clearCart: () => {
    set({ items: [], activeTable: null });
  },

  getSubtotalCents: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.menuItem.priceCents * item.quantity, 0);
  },

  getServiceChargeCents: () => {
    const subtotal = get().getSubtotalCents();
    // 10% standard restaurant service charge in Sri Lanka for dine-in
    return Math.round(subtotal * 0.1);
  },

  getTotalCents: () => {
    const subtotal = get().getSubtotalCents();
    const serviceCharge = get().getServiceChargeCents();
    return subtotal + serviceCharge;
  },
}));
