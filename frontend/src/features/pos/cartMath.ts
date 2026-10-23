export type CartLine = { priceCents: number; qty: number };

export type Totals = {
  subtotal: number;
  discount: number;
  service: number;
  tax: number;
  total: number;
};

// All values are integer cents. Rates are percent numbers (10 = 10%).
// Order: discount first, then service charge, then tax on (after-discount + service).
export function calcTotals(
  lines: CartLine[],
  opts: { discountPercent?: number; discountCents?: number; servicePercent?: number; taxPercent?: number } = {}
): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.priceCents * l.qty, 0);
  const discount = Math.min(
    subtotal,
    Math.round(subtotal * ((opts.discountPercent ?? 0) / 100)) + (opts.discountCents ?? 0)
  );
  const afterDiscount = Math.max(0, subtotal - discount);
  const service = Math.round(afterDiscount * ((opts.servicePercent ?? 0) / 100));
  const tax = Math.round((afterDiscount + service) * ((opts.taxPercent ?? 0) / 100));
  return {
    subtotal,
    discount,
    service,
    tax,
    total: afterDiscount + service + tax,
  };
}

/**
 * Splits a total amount in integer cents into N equal integer parts,
 * distributing remainder cents so the sum of parts exactly equals totalCents.
 */
export function splitEqual(totalCents: number, parts: number): number[] {
  if (parts <= 1) return [totalCents];
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents % parts;
  const result: number[] = [];
  for (let i = 0; i < parts; i++) {
    result.push(base + (i < remainder ? 1 : 0));
  }
  return result;
}
