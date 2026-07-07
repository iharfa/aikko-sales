// Prices per size. `single` = one-off price, `bundle` = per-unit price when
// the customer buys 2+ prints of that size (matches the fest price sheet:
// A3 2-for-45, A4 2-for-25, A5 2-for-15).
export const SIZES = ["A3", "A4", "A5"] as const;
export type Size = (typeof SIZES)[number];

export const PRICES: Record<Size, { single: number; bundle: number }> = {
  A3: { single: 25, bundle: 22.5 },
  A4: { single: 15, bundle: 12.5 },
  A5: { single: 10, bundle: 7.5 },
};

export const CURRENCY = "$"; // SGD at Creator Super Fest — change per event

export const PAYMENTS = ["Cash", "Transfer", "Split"] as const;

// Event costs (flights, accommodation, printing, …) — the break-even target.
export const TOTAL_COST = 2158;

export const fmt = (n: number) =>
  CURRENCY + (Number.isInteger(n) ? n : n.toFixed(2));
