import { describe, it, expect } from 'vitest';

export function isManagerPinRequiredForDiscount(
  mode: 'percent' | 'amount',
  value: number,
  subtotalCents: number
): boolean {
  if (mode === 'percent') {
    return value > 20;
  }
  // Amount mode: value in rupees -> value * 100 in cents
  const discountCents = value * 100;
  const percentEquivalent = (discountCents / subtotalCents) * 100;
  return discountCents > 200000 || percentEquivalent > 20;
}

export function validateDiscountInput(
  value: number,
  mode: 'percent' | 'amount',
  subtotalCents: number,
  reason: string
) {
  if (!reason || reason.trim() === '') {
    return { valid: false, error: 'A discount reason must be specified' };
  }
  if (value <= 0) {
    return { valid: false, error: 'Discount value must be greater than zero' };
  }
  if (mode === 'percent' && value > 100) {
    return { valid: false, error: 'Percentage discount cannot exceed 100%' };
  }
  if (mode === 'amount' && value * 100 > subtotalCents) {
    return { valid: false, error: 'Fixed discount cannot exceed order subtotal' };
  }
  return { valid: true, error: null };
}

describe('Discount Authorization & Business Rules', () => {
  it('does not require manager PIN for standard 5%, 10%, 15%, 20% discounts', () => {
    expect(isManagerPinRequiredForDiscount('percent', 5, 500000)).toBe(false);
    expect(isManagerPinRequiredForDiscount('percent', 10, 500000)).toBe(false);
    expect(isManagerPinRequiredForDiscount('percent', 15, 500000)).toBe(false);
    expect(isManagerPinRequiredForDiscount('percent', 20, 500000)).toBe(false);
  });

  it('requires manager PIN when percentage exceeds 20%', () => {
    expect(isManagerPinRequiredForDiscount('percent', 25, 500000)).toBe(true);
    expect(isManagerPinRequiredForDiscount('percent', 50, 500000)).toBe(true);
    expect(isManagerPinRequiredForDiscount('percent', 100, 500000)).toBe(true);
  });

  it('requires manager PIN when fixed discount exceeds Rs. 2,000 threshold', () => {
    // Subtotal Rs. 20,000, fixed discount Rs. 2,500 (> Rs. 2,000 limit)
    expect(isManagerPinRequiredForDiscount('amount', 2500, 2000000)).toBe(true);
    // Subtotal Rs. 20,000, fixed discount Rs. 1,500 (< Rs. 2,000 and < 20%)
    expect(isManagerPinRequiredForDiscount('amount', 1500, 2000000)).toBe(false);
  });

  it('rejects discount without a reason', () => {
    const res = validateDiscountInput(10, 'percent', 100000, '');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('A discount reason must be specified');
  });

  it('rejects percentage discount greater than 100%', () => {
    const res = validateDiscountInput(120, 'percent', 100000, 'Special promo');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Percentage discount cannot exceed 100%');
  });

  it('rejects fixed discount exceeding the total subtotal', () => {
    // Subtotal Rs. 1,000, discount Rs. 1,500
    const res = validateDiscountInput(1500, 'amount', 100000, 'Promo voucher');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Fixed discount cannot exceed order subtotal');
  });
});
