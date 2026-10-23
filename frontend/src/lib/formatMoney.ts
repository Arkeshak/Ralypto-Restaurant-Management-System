/**
 * Formats integer cents into formatted Sri Lankan Rupee currency string.
 * Example: formatMoney(145000) => "LKR 1,450.00"
 * Example: formatMoney(145000, { showCurrency: false }) => "1,450.00"
 */
export interface FormatMoneyOptions {
  showCurrency?: boolean;
  currency?: string;
  decimals?: number;
}

export function formatMoney(
  cents: number | null | undefined,
  options: FormatMoneyOptions = {}
): string {
  if (cents === null || cents === undefined || isNaN(cents)) {
    cents = 0;
  }

  const {
    showCurrency = true,
    currency = 'LKR',
    decimals = 2,
  } = options;

  const rupees = cents / 100;
  const formattedNumber = new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rupees);

  return showCurrency ? `${currency} ${formattedNumber}` : formattedNumber;
}

/**
 * Converts a decimal rupee input to integer cents.
 * Example: parseRupeesToCents(1450.50) => 145050
 */
export function parseRupeesToCents(rupees: number | string): number {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}
