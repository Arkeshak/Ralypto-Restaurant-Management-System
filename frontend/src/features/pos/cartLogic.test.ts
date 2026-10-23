import { describe, it, expect } from 'vitest';
import type { CartItem } from './OrderCartPanel';

export class CartState {
  items: CartItem[] = [];

  addItem(
    dish: { id: string; name: string; priceCents: number },
    modifiers: Array<{ id: string; name: string; priceDeltaCents: number }> = [],
    notes?: string
  ) {
    const modifierKey = modifiers
      .map((m) => m.id)
      .sort()
      .join('-');
    const existingIndex = this.items.findIndex(
      (i) =>
        i.name === dish.name &&
        (i.modifiers?.map((m) => m.id).sort().join('-') || '') === modifierKey &&
        (i.notes || '') === (notes || '')
    );

    const modSum = modifiers.reduce((acc, m) => acc + m.priceDeltaCents, 0);
    const linePrice = dish.priceCents + modSum;

    if (existingIndex > -1) {
      this.items[existingIndex].qty += 1;
    } else {
      this.items.push({
        id: `cart-line-${Date.now()}-${Math.random()}`,
        name: dish.name,
        priceCents: linePrice,
        qty: 1,
        modifiers: modifiers.length > 0 ? modifiers : undefined,
        notes,
      });
    }
  }

  updateQty(id: string, delta: number) {
    const index = this.items.findIndex((i) => i.id === id);
    if (index > -1) {
      const nextQty = this.items[index].qty + delta;
      if (nextQty <= 0) {
        this.items.splice(index, 1);
      } else {
        this.items[index].qty = nextQty;
      }
    }
  }

  updateNotes(id: string, notes: string) {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.notes = notes;
    }
  }

  clear() {
    this.items = [];
  }
}

describe('POS Cart Store & Line Logic', () => {
  it('adds a dish to an empty cart', () => {
    const cart = new CartState();
    cart.addItem({ id: 'item-1', name: 'Chicken Kottu', priceCents: 145000 });

    expect(cart.items.length).toBe(1);
    expect(cart.items[0].name).toBe('Chicken Kottu');
    expect(cart.items[0].qty).toBe(1);
    expect(cart.items[0].priceCents).toBe(145000);
  });

  it('increments quantity when identical dish without modifiers is added again', () => {
    const cart = new CartState();
    cart.addItem({ id: 'item-1', name: 'Chicken Kottu', priceCents: 145000 });
    cart.addItem({ id: 'item-1', name: 'Chicken Kottu', priceCents: 145000 });

    expect(cart.items.length).toBe(1);
    expect(cart.items[0].qty).toBe(2);
  });

  it('creates a separate line when dish has different modifiers', () => {
    const cart = new CartState();
    cart.addItem({ id: 'item-1', name: 'Chicken Kottu', priceCents: 145000 });
    cart.addItem(
      { id: 'item-1', name: 'Chicken Kottu', priceCents: 145000 },
      [{ id: 'mod-cheese', name: 'Extra Cheese', priceDeltaCents: 35000 }]
    );

    expect(cart.items.length).toBe(2);
    expect(cart.items[0].priceCents).toBe(145000);
    expect(cart.items[1].priceCents).toBe(180000); // 145,000 + 35,000
  });

  it('updates quantity and removes line when quantity reaches zero', () => {
    const cart = new CartState();
    cart.addItem({ id: 'item-1', name: 'Chicken Kottu', priceCents: 145000 });
    const lineId = cart.items[0].id;

    cart.updateQty(lineId, 1);
    expect(cart.items[0].qty).toBe(2);

    cart.updateQty(lineId, -1);
    expect(cart.items[0].qty).toBe(1);

    cart.updateQty(lineId, -1);
    expect(cart.items.length).toBe(0);
  });

  it('updates kitchen preparation notes on a line item', () => {
    const cart = new CartState();
    cart.addItem({ id: 'item-1', name: 'Chicken Kottu', priceCents: 145000 });
    const lineId = cart.items[0].id;

    cart.updateNotes(lineId, 'Very spicy, no onions');
    expect(cart.items[0].notes).toBe('Very spicy, no onions');
  });

  it('clears all items on void or ticket checkout', () => {
    const cart = new CartState();
    cart.addItem({ id: 'item-1', name: 'Chicken Kottu', priceCents: 145000 });
    cart.addItem({ id: 'item-2', name: 'Lime Juice', priceCents: 45000 });
    expect(cart.items.length).toBe(2);

    cart.clear();
    expect(cart.items.length).toBe(0);
  });
});
