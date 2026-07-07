"use client";
import { useEffect, useMemo, useState } from "react";
import { SIZES, fmt } from "@/lib/config";
import type { InvRow, Sale } from "@/lib/types";

const Bar = ({ label, value, max, money }: { label: string; value: number; max: number; money?: boolean }) => (
  <div className="mb-1.5">
    <div className="flex justify-between text-sm">
      <span className="min-w-0 truncate">{label}</span>
      <span className="font-mono text-muted">{money ? fmt(value) : value}</span>
    </div>
    <div className="h-1.5 rounded-full bg-line">
      <div className="h-1.5 rounded-full bg-accent" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  </div>
);

export default function Stats() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [inv, setInv] = useState<InvRow[]>([]);

  useEffect(() => {
    fetch("/api/sales").then((r) => r.json()).then(setSales);
    fetch("/api/inventory").then((r) => r.json()).then(setInv);
  }, []);

  const s = useMemo(() => {
    const revenue = sales.reduce((a, x) => a + x.total, 0);
    const items = sales.flatMap((x) => x.items);
    const units = items.reduce((a, i) => a + i.qty, 0);
    const bySize = Object.fromEntries(SIZES.map((z) => [z, { units: 0, rev: 0 }]));
    const byDesign = new Map<string, number>();
    for (const i of items) {
      if (bySize[i.size]) { bySize[i.size].units += i.qty; bySize[i.size].rev += i.qty * i.unit; }
      byDesign.set(i.design, (byDesign.get(i.design) ?? 0) + i.qty);
    }
    const top = [...byDesign.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    // Splits contribute their cash portion to Cash and the rest to Transfer
    const byPay = new Map<string, number>();
    let splits = 0;
    for (const x of sales) {
      if (!x.payment) continue;
      if (x.payment === "Split") splits++;
      const cash = x.cash ?? (x.payment === "Cash" ? x.total : 0);
      if (cash > 0) byPay.set("Cash", (byPay.get("Cash") ?? 0) + cash);
      if (x.total - cash > 0) byPay.set("Transfer", (byPay.get("Transfer") ?? 0) + x.total - cash);
    }
    const byDay = new Map<string, number>();
    for (const x of sales) {
      const d = x.ts ? new Date(x.ts).toLocaleDateString([], { day: "numeric", month: "short" }) : "Fest (imported)";
      byDay.set(d, (byDay.get(d) ?? 0) + x.total);
    }
    const stockStart = inv.reduce((a, r) => a + r.start, 0);
    const stockSold = inv.reduce((a, r) => a + r.sold, 0);
    return { revenue, units, bySize, top, byPay: [...byPay.entries()], splits, byDay: [...byDay.entries()], stockStart, stockSold };
  }, [sales, inv]);

  const card = "rounded-card border border-line bg-surface p-3";

  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">Stats</h1>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          ["Revenue", fmt(s.revenue)],
          ["Prints sold", String(s.units)],
          ["Sales", String(sales.length)],
        ].map(([k, v]) => (
          <div key={k} className={card}>
            <span className="block text-xs text-muted">{k}</span>
            <span className="font-mono text-lg font-bold">{v}</span>
          </div>
        ))}
      </div>

      <div className={`${card} mb-3`}>
        <h2 className="mb-2 text-sm font-semibold">Stock sold — {s.stockSold} of {s.stockStart}</h2>
        <div className="h-2 rounded-full bg-line">
          <div className="h-2 rounded-full bg-good" style={{ width: `${s.stockStart ? (s.stockSold / s.stockStart) * 100 : 0}%` }} />
        </div>
      </div>

      <div className={`${card} mb-3`}>
        <h2 className="mb-2 text-sm font-semibold">Revenue by day</h2>
        {s.byDay.map(([d, v]) => <Bar key={d} label={d} value={v} max={Math.max(...s.byDay.map(([, x]) => x))} money />)}
      </div>

      <div className={`${card} mb-3`}>
        <h2 className="mb-2 text-sm font-semibold">By size</h2>
        {SIZES.map((z) => <Bar key={z} label={`${z} · ${fmt(s.bySize[z]?.rev ?? 0)}`} value={s.bySize[z]?.units ?? 0} max={Math.max(...SIZES.map((x) => s.bySize[x]?.units ?? 0))} />)}
      </div>

      <div className={`${card} mb-3`}>
        <h2 className="mb-2 text-sm font-semibold">Top designs (prints)</h2>
        {s.top.map(([d, n]) => <Bar key={d} label={d} value={n} max={s.top[0]?.[1] ?? 0} />)}
      </div>

      {s.byPay.length > 0 && (
        <div className={card}>
          <h2 className="mb-2 text-sm font-semibold">Payment method</h2>
          {s.byPay.map(([p, v]) => <Bar key={p} label={p} value={v} max={Math.max(...s.byPay.map(([, x]) => x))} money />)}
          <p className="mt-1 text-xs text-muted">
            {s.splits > 0 && `Includes ${s.splits} split payment${s.splits > 1 ? "s" : ""}. `}
            Imported fest sales have no payment method recorded.
          </p>
        </div>
      )}
    </div>
  );
}
