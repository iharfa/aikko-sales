"use client";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/config";
import type { Sale } from "@/lib/types";

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [showImported, setShowImported] = useState(false);

  const load = () => fetch("/api/sales").then((r) => r.json()).then(setSales);
  useEffect(() => { load(); }, []);

  async function voidSale(s: Sale) {
    if (!window.confirm(`Void this ${fmt(s.total)} sale and restock the prints?`)) return;
    await fetch(`/api/sales?id=${s.id}`, { method: "DELETE" });
    load();
  }

  const timed = sales.filter((s) => s.ts);
  const imported = sales.filter((s) => !s.ts);
  const days = new Map<string, Sale[]>();
  for (const s of timed) {
    const day = new Date(s.ts!).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
    if (!days.has(day)) days.set(day, []);
    days.get(day)!.push(s);
  }

  const Row = ({ s }: { s: Sale }) => (
    <div className="flex items-start gap-2 border-b border-line px-3 py-2 text-sm last:border-0">
      <div className="min-w-0 flex-1">
        <span style={{ overflowWrap: "anywhere" }}>
          {s.items.map((i) => `${i.design} ${i.size}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(" + ")}
        </span>
        <span className="block text-xs text-muted">
          {s.ts ? new Date(s.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "time unknown"}
          {s.payment === "Split" && s.cash != null
            ? ` · Split — ${fmt(s.cash)} cash + ${fmt(s.total - s.cash)} transfer`
            : s.payment && ` · ${s.payment}`}
          {s.note && ` · ${s.note}`}
        </span>
      </div>
      <span className="font-mono font-semibold">{fmt(s.total)}</span>
      <button onClick={() => voidSale(s)} aria-label="Void sale" className="px-1 text-muted">✕</button>
    </div>
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Sales</h1>
      <p className="mb-3 text-sm text-muted">
        {sales.length} sales · {fmt(sales.reduce((a, s) => a + s.total, 0))} total
      </p>

      {[...days.entries()].map(([day, list]) => (
        <section key={day} className="mb-3">
          <h2 className="mb-1 flex justify-between text-sm font-semibold">
            <span>{day}</span>
            <span className="font-mono">{fmt(list.reduce((a, s) => a + s.total, 0))}</span>
          </h2>
          <div className="rounded-card border border-line bg-surface">
            {list.map((s) => <Row key={s.id} s={s} />)}
          </div>
        </section>
      ))}
      {!timed.length && <p className="mb-3 rounded-card border border-line bg-surface p-4 text-sm text-muted">No new sales yet — sales you record will appear here with their time.</p>}

      {imported.length > 0 && (
        <section>
          <button onClick={() => setShowImported(!showImported)} className="mb-1 flex w-full justify-between text-sm font-semibold">
            <span>Imported from fest sheet ({imported.length})</span>
            <span className="font-mono">{fmt(imported.reduce((a, s) => a + s.total, 0))} {showImported ? "▾" : "▸"}</span>
          </button>
          {showImported && (
            <div className="rounded-card border border-line bg-surface">
              {imported.map((s) => <Row key={s.id} s={s} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
