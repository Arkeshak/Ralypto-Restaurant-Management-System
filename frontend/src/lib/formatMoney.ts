// Money is stored in cents (integer). 245000 -> "Rs. 2,450" (or "Rs. 2,450.00" if withDecimals=true)
export function formatMoney(cents: number | null | undefined, withDecimals = false): string {
  const value = (cents ?? 0) / 100;
  return (
    'Rs. ' +
    value.toLocaleString('en-LK', {
      minimumFractionDigits: withDecimals ? 2 : 0,
      maximumFractionDigits: withDecimals ? 2 : 0,
    })
  );
}

export function parseRupeesToCents(rupees: number | string): number {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}
