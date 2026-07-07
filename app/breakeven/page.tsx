"use client";
import { useEffect, useState } from "react";
import { PRICES, SIZES, TOTAL_COST, fmt } from "@/lib/config";
import type { Sale } from "@/lib/types";

export default function Breakeven() {
  const [sales, setSales] = useState<Sale[]>([]);
  useEffect(() => { fetch("/api/sales").then((r) => r.json()).then(setSales); }, []);

  const revenue = sales.reduce((a, s) => a + s.total, 0);
  const units = sales.flatMap((s) => s.items).reduce((a, i) => a + i.qty, 0);
  const remaining = Math.max(0, TOTAL_COST - revenue);
  const pct = Math.min(100, (revenue / TOTAL_COST) * 100);
  const avg = units > 0 ? revenue / units : 0;
  const card = "rounded-card border border-line bg-surface p-4";

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">Break-even</h1>

      <div className={`${card} mb-3`}>
        <div className="flex items-end justify-between">
          <div>
            <span className="block text-xs text-muted">Earned so far</span>
            <span className="font-mono text-2xl font-bold">{fmt(revenue)}</span>
          </div>
          <div className="text-right">
            <span className="block text-xs text-muted">Costs to cover</span>
            <span className="font-mono text-lg">{fmt(TOTAL_COST)}</span>
          </div>
        </div>
        <div className="mt-3 h-3 rounded-full bg-line">
          <div className={`h-3 rounded-full ${remaining === 0 ? "bg-good" : "bg-accent"}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm">
          {remaining === 0 ? (
            <span className="font-semibold text-good">Broke even — {fmt(revenue - TOTAL_COST)} profit so far 🎉</span>
          ) : (
            <>
              <b className="font-mono">{fmt(remaining)}</b> to go · {pct.toFixed(0)}% there
            </>
          )}
        </p>
      </div>

      {remaining > 0 && (
        <div className={`${card} mb-3`}>
          <h2 className="mb-2 text-sm font-semibold">Prints needed to break even</h2>
          {avg > 0 && (
            <p className="mb-2 border-b border-line pb-2 text-sm">
              At your average so far ({fmt(avg)}/print): <b className="font-mono">{Math.ceil(remaining / avg)} prints</b>
            </p>
          )}
          {SIZES.map((s) => (
            <p key={s} className="flex justify-between py-0.5 text-sm">
              <span>{s} only</span>
              <span className="font-mono">
                {Math.ceil(remaining / PRICES[s].single)}–{Math.ceil(remaining / PRICES[s].bundle)} prints
              </span>
            </p>
          ))}
          <p className="mt-1 text-xs text-muted">Range: everything at full price → everything at bundle price.</p>
        </div>
      )}

      <p className="text-xs text-muted">
        Costs are set in <span className="font-mono">lib/config.ts</span> (currently {fmt(TOTAL_COST)}).
      </p>
    </div>
  );
}
