import { describe, it, expect } from 'vitest';
import { splitEqual } from './cartMath';

export function splitByItems(
  items: Array<{ id: string; priceCents: number; qty: number }>,
  selectedItemIds: string[]
) {
  const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));
  const unselectedItems = items.filter((i) => !selectedItemIds.includes(i.id));

  const splitSubtotal = selectedItems.reduce((acc, i) => acc + i.priceCents * i.qty, 0);
  const remainingSubtotal = unselectedItems.reduce((acc, i) => acc + i.priceCents * i.qty, 0);

  return { selectedItems, unselectedItems, splitSubtotal, remainingSubtotal };
}

describe('Split Bill Mathematical Precision', () => {
  it('splits equally into 2 parts without losing cents', () => {
    // LKR 1,450.00 (145,000 cents) split 2 ways: exactly 72,500 and 72,500
    const parts = splitEqual(145000, 2);
    expect(parts.length).toBe(2);
    expect(parts[0]).toBe(72500);
    expect(parts[1]).toBe(72500);
    expect(parts[0] + parts[1]).toBe(145000);
  });

  it('splits equally into 3 parts with remainder distributed properly', () => {
    // 100,000 cents split 3 ways: 33,334, 33,333, 33,333 -> sum = 100,000
    const parts = splitEqual(100000, 3);
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe(33334);
    expect(parts[1]).toBe(33333);
    expect(parts[2]).toBe(33333);
    const sum = parts.reduce((a, b) => a + b, 0);
    expect(sum).toBe(100000);
  });

  it('splits equally into 6 parts with perfect conservation of cents', () => {
    const totalCents = 387523;
    const parts = splitEqual(totalCents, 6);
    expect(parts.length).toBe(6);
    const sum = parts.reduce((a, b) => a + b, 0);
    expect(sum).toBe(totalCents);
  });

  it('correctly calculates split by selected items', () => {
    const items = [
      { id: 'item-1', priceCents: 145000, qty: 2 }, // 290,000
      { id: 'item-2', priceCents: 45000, qty: 2 },  // 90,000
      { id: 'item-3', priceCents: 220000, qty: 1 }, // 220,000
    ]; // Total = 600,000

    // Guest 1 pays for HBC (item-3) and 1x item-2
    const split = splitByItems(items, ['item-3']);
    expect(split.splitSubtotal).toBe(220000);
    expect(split.remainingSubtotal).toBe(380000);
    expect(split.splitSubtotal + split.remainingSubtotal).toBe(600000);
  });

  it('handles single part and non-positive parts gracefully', () => {
    expect(splitEqual(10000, 1)).toEqual([10000]);
    expect(splitEqual(10000, 0)).toEqual([10000]);
  });
});
