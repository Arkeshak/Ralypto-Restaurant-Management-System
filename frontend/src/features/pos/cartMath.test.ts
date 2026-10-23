import { describe, it, expect } from 'vitest';
import { calcTotals, splitEqual, type CartLine } from './cartMath';

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

  it('supports service charge toggled OFF per order', () => {
    const lines: CartLine[] = [{ priceCents: 200000, qty: 1 }]; // Rs. 2,000

    // Service charge turned off (0%)
    const totalsNoService = calcTotals(lines, {
      servicePercent: 0,
      taxPercent: 8,
    });

    expect(totalsNoService.subtotal).toBe(200000);
    expect(totalsNoService.service).toBe(0);
    expect(totalsNoService.tax).toBe(16000); // 8% of 200,000
    expect(totalsNoService.total).toBe(216000); // 200,000 + 16,000

    // Service charge toggled ON (10%)
    const totalsWithService = calcTotals(lines, {
      servicePercent: 10,
      taxPercent: 8,
    });

    expect(totalsWithService.service).toBe(20000); // 10% of 200,000
    expect(totalsWithService.tax).toBe(17600); // 8% of (200,000 + 20,000 = 220,000)
    expect(totalsWithService.total).toBe(237600);
  });

  it('calculates combined percent and fixed discount capped properly', () => {
    const lines: CartLine[] = [{ priceCents: 500000, qty: 1 }]; // Rs. 5,000

    // 10% (50,000) + 20,000 fixed = 70,000 discount
    const combined = calcTotals(lines, {
      discountPercent: 10,
      discountCents: 20000,
    });

    expect(combined.discount).toBe(70000);
    expect(combined.total).toBe(430000);

    // Huge discount exceeding subtotal caps at subtotal
    const capped = calcTotals(lines, {
      discountPercent: 50,
      discountCents: 400000, // 250,000 + 400,000 = 650,000 > 500,000
    });

    expect(capped.discount).toBe(500000);
    expect(capped.total).toBe(0);
  });

  it('correctly rounds integer cents on non-divisible amounts', () => {
    // 3 items at Rs. 333.33 each = 99,999 cents
    const lines: CartLine[] = [{ priceCents: 33333, qty: 3 }];
    // 15% discount -> 99999 * 0.15 = 14999.85 -> rounds to 15000 cents
    const totals = calcTotals(lines, { discountPercent: 15 });

    expect(Number.isInteger(totals.discount)).toBe(true);
    expect(totals.discount).toBe(15000);
    expect(totals.total).toBe(84999);
  });

  describe('splitEqual', () => {
    it('splits evenly divisible totals into equal parts', () => {
      const parts = splitEqual(300000, 3); // Rs. 3,000 into 3 parts
      expect(parts).toEqual([100000, 100000, 100000]);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(300000);
    });

    it('distributes non-divisible remainder cents without losing a cent', () => {
      // 100 cents split into 3 parts = 34, 33, 33
      const parts = splitEqual(100, 3);
      expect(parts).toEqual([34, 33, 33]);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(100);

      // Rs. 3,190 (319,000 cents) split into 4 parts
      const parts4 = splitEqual(319000, 4);
      expect(parts4.reduce((a, b) => a + b, 0)).toBe(319000);
    });

    it('handles 1 part or edge cases gracefully', () => {
      expect(splitEqual(50000, 1)).toEqual([50000]);
      expect(splitEqual(50000, 0)).toEqual([50000]);
    });
  });
});
