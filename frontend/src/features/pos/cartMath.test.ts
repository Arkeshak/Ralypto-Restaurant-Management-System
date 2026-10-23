import { describe, it, expect } from 'vitest';
import { calcTotals, type CartLine } from './cartMath';

describe('calcTotals', () => {
  it('calculates subtotal correctly with no discounts or taxes', () => {
    const lines: CartLine[] = [
      { priceCents: 145000, qty: 2 }, // 290,000
      { priceCents: 220000, qty: 1 }, // 220,000
    ];
    const totals = calcTotals(lines);

    expect(totals.subtotal).toBe(510000);
    expect(totals.discount).toBe(0);
    expect(totals.service).toBe(0);
    expect(totals.tax).toBe(0);
    expect(totals.total).toBe(510000);
  });

  it('calculates percentage discount and fixed discount correctly', () => {
    const lines: CartLine[] = [{ priceCents: 100000, qty: 1 }]; // 100,000 cents = Rs. 1,000

    // 10% discount
    const withPercent = calcTotals(lines, { discountPercent: 10 });
    expect(withPercent.subtotal).toBe(100000);
    expect(withPercent.discount).toBe(10000);
    expect(withPercent.total).toBe(90000);

    // Fixed cents discount
    const withFixed = calcTotals(lines, { discountCents: 25000 });
    expect(withFixed.discount).toBe(25000);
    expect(withFixed.total).toBe(75000);

    // Discount cannot exceed subtotal
    const overDiscount = calcTotals(lines, { discountCents: 150000 });
    expect(overDiscount.discount).toBe(100000);
    expect(overDiscount.total).toBe(0);
  });

  it('calculates service charge and tax following discount first, service next, tax last', () => {
    const lines: CartLine[] = [{ priceCents: 100000, qty: 1 }]; // 100,000

    // Discount 10% -> after-discount = 90,000
    // Service charge 10% on after-discount -> 9,000
    // Tax 10% on (after-discount + service = 99,000) -> 9,900
    // Total = 90,000 + 9,000 + 9,900 = 108,900
    const totals = calcTotals(lines, {
      discountPercent: 10,
      servicePercent: 10,
      taxPercent: 10,
    });

    expect(totals.subtotal).toBe(100000);
    expect(totals.discount).toBe(10000);
    expect(totals.service).toBe(9000);
    expect(totals.tax).toBe(9900);
    expect(totals.total).toBe(108900);
  });

  it('handles empty cart gracefully', () => {
    const totals = calcTotals([], { servicePercent: 10, taxPercent: 10 });
    expect(totals.subtotal).toBe(0);
    expect(totals.discount).toBe(0);
    expect(totals.service).toBe(0);
    expect(totals.tax).toBe(0);
    expect(totals.total).toBe(0);
  });
});
