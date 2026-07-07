import { PRICES, type Size } from "./config";

export type CartLine = { design: string; size: Size; qty: number; override?: number };

// Bundle rule: 2+ prints of the same size across the whole cart → every unit
// of that size drops to the bundle price. Manual override wins per line.
export function priceCart(lines: CartLine[]) {
  const bySize: Record<string, number> = {};
  for (const l of lines) bySize[l.size] = (bySize[l.size] ?? 0) + l.qty;
  const priced = lines.map((l) => {
    const auto = bySize[l.size] >= 2 ? PRICES[l.size].bundle : PRICES[l.size].single;
    const unit = l.override ?? auto;
    return { ...l, unit, auto, discounted: l.override == null && auto < PRICES[l.size].single };
  });
  const total = priced.reduce((a, l) => a + l.unit * l.qty, 0);
  const full = lines.reduce((a, l) => a + PRICES[l.size].single * l.qty, 0);
  return { priced, total, saved: full - total };
}
