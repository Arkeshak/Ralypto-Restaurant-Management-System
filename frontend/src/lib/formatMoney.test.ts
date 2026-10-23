import { describe, it, expect } from 'vitest';
import { formatMoney, parseRupeesToCents } from './formatMoney';
import { getRoleLandingRoute } from './permissions';

describe('formatMoney', () => {
  it('formats integer cents into Sri Lankan Rupee representation', () => {
    expect(formatMoney(145000)).toBe('LKR 1,450.00');
    expect(formatMoney(0)).toBe('LKR 0.00');
    expect(formatMoney(null)).toBe('LKR 0.00');
    expect(formatMoney(undefined)).toBe('LKR 0.00');
  });

  it('supports hiding the currency symbol', () => {
    expect(formatMoney(145000, { showCurrency: false })).toBe('1,450.00');
  });

  it('correctly converts rupee decimals to cents', () => {
    expect(parseRupeesToCents(1450)).toBe(145000);
    expect(parseRupeesToCents('1450.50')).toBe(145050);
  });
});

describe('getRoleLandingRoute', () => {
  it('maps cashier to /pos', () => {
    expect(getRoleLandingRoute('cashier')).toBe('/pos');
  });

  it('maps waiter to /waiter', () => {
    expect(getRoleLandingRoute('waiter')).toBe('/waiter');
  });

  it('maps kitchen to /kitchen', () => {
    expect(getRoleLandingRoute('kitchen')).toBe('/kitchen');
  });

  it('maps owner to /dashboard', () => {
    expect(getRoleLandingRoute('owner')).toBe('/dashboard');
  });
});
