import { describe, it, expect } from 'vitest';
import { formatMoney, parseRupeesToCents } from './formatMoney';

describe('formatMoney', () => {
  it('formats integer cents into Sri Lankan Rupee representation without decimals by default', () => {
    expect(formatMoney(245000)).toBe('Rs. 2,450');
    expect(formatMoney(145000)).toBe('Rs. 1,450');
    expect(formatMoney(0)).toBe('Rs. 0');
    expect(formatMoney(null)).toBe('Rs. 0');
    expect(formatMoney(undefined)).toBe('Rs. 0');
  });

  it('formats integer cents with decimals when withDecimals is true', () => {
    expect(formatMoney(245000, true)).toBe('Rs. 2,450.00');
    expect(formatMoney(145050, true)).toBe('Rs. 1,450.50');
    expect(formatMoney(0, true)).toBe('Rs. 0.00');
  });

  it('correctly parses rupees to integer cents', () => {
    expect(parseRupeesToCents(2450)).toBe(245000);
    expect(parseRupeesToCents('2450.50')).toBe(245050);
    expect(parseRupeesToCents('invalid')).toBe(0);
  });
});
