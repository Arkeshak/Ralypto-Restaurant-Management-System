import { describe, it, expect } from 'vitest';

export function calcPaymentChange(totalCents: number, cashPaidCents: number) {
  if (cashPaidCents < totalCents) {
    return { changeCents: 0, remainingCents: totalCents - cashPaidCents, isExactOrOver: false };
  }
  return { changeCents: cashPaidCents - totalCents, remainingCents: 0, isExactOrOver: true };
}

export function calcMixedPayment(totalCents: number, cashCents: number, cardCents: number) {
  const totalPaid = cashCents + cardCents;
  const remainingCents = Math.max(0, totalCents - totalPaid);
  const changeCents = Math.max(0, totalPaid - totalCents);
  const isSettled = totalPaid >= totalCents;

  return { totalPaid, remainingCents, changeCents, isSettled };
}

describe('Payment & Cash Drawer Calculation Math', () => {
  it('calculates exact change for single cash payment', () => {
    // Bill LKR 3,800.00 (380,000 cents), Paid LKR 5,000.00 (500,000 cents)
    const result = calcPaymentChange(380000, 500000);
    expect(result.changeCents).toBe(120000);
    expect(result.remainingCents).toBe(0);
    expect(result.isExactOrOver).toBe(true);
  });

  it('handles exact tender with 0 change', () => {
    const result = calcPaymentChange(145000, 145000);
    expect(result.changeCents).toBe(0);
    expect(result.remainingCents).toBe(0);
    expect(result.isExactOrOver).toBe(true);
  });

  it('detects short/underpayment and shows remaining balance', () => {
    // Bill LKR 5,000.00, Paid only LKR 3,000.00
    const result = calcPaymentChange(500000, 300000);
    expect(result.changeCents).toBe(0);
    expect(result.remainingCents).toBe(200000);
    expect(result.isExactOrOver).toBe(false);
  });

  it('calculates mixed cash and card payment split', () => {
    // Bill LKR 10,000.00: Customer pays LKR 4,000 in cash, remaining LKR 6,000 on Card
    const mixed = calcMixedPayment(1000000, 400000, 600000);
    expect(mixed.totalPaid).toBe(1000000);
    expect(mixed.remainingCents).toBe(0);
    expect(mixed.changeCents).toBe(0);
    expect(mixed.isSettled).toBe(true);
  });

  it('calculates remaining balance when mixed card amount is insufficient', () => {
    // Bill LKR 10,000.00: Cash 4,000, Card 3,000 -> Remaining 3,000
    const mixed = calcMixedPayment(1000000, 400000, 300000);
    expect(mixed.totalPaid).toBe(700000);
    expect(mixed.remainingCents).toBe(300000);
    expect(mixed.isSettled).toBe(false);
  });

  it('handles cash overpayment during mixed payment', () => {
    // Bill LKR 5,000.00: Card 2,000 + Cash note 4,000 -> Total 6,000 -> 1,000 change
    const mixed = calcMixedPayment(500000, 400000, 200000);
    expect(mixed.totalPaid).toBe(600000);
    expect(mixed.remainingCents).toBe(0);
    expect(mixed.changeCents).toBe(100000);
    expect(mixed.isSettled).toBe(true);
  });
});
