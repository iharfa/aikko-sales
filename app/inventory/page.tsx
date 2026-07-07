"use client";
import { useEffect, useState } from "react";
import { SIZES } from "@/lib/config";
import type { InvRow } from "@/lib/types";

export default function Inventory() {
  const [inv, setInv] = useState<InvRow[]>([]);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetch("/api/inventory").then((r) => r.json()).then(setInv); }, []);

  async function setStart(row: InvRow) {
    const v = window.prompt(`Starting stock for ${row.design} ${row.size}? (sold so far: ${row.sold})`, String(row.start));
    if (v === null) return;
    const start = parseInt(v);
    if (isNaN(start) || start < 0) return;
    setInv(await (await fetch("/api/inventory", { method: "POST", body: JSON.stringify({ design: row.design, size: row.size, start }) })).json());
  }

  async function patch(body: object) {
    const res = await fetch("/api/inventory", { method: "PATCH", body: JSON.stringify(body) });
    if (res.ok) setInv(await res.json());
    else alert((await res.json()).error);
  }

  function rename(design: string) {
    const to = window.prompt(`Rename “${design}” (applies to all sizes and past sales)`, design)?.trim();
    if (to && to !== design) patch({ rename: { from: design, to } });
  }

  function resize(row: InvRow) {
    const size = window.prompt(`Size for ${row.design} (${SIZES.join("/")})`, row.size)?.trim().toUpperCase();
    if (size && size !== row.size) patch({ id: row.id, size });
  }

  async function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = { design: f.get("design"), size: f.get("size"), start: Number(f.get("start")) };
    if (!body.design) return;
    setInv(await (await fetch("/api/inventory", { method: "POST", body: JSON.stringify(body) })).json());
    setAdding(false);
  }

  const rows = inv.filter((r) => r.design.toLowerCase().includes(q.toLowerCase()));
  const totals = rows.reduce((a, r) => ({ start: a.start + r.start, sold: a.sold + r.sold }), { start: 0, sold: 0 });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock</h1>
        <button onClick={() => setAdding(!adding)} className="rounded-card border border-line bg-surface px-3 py-2 text-sm font-medium">
          {adding ? "Cancel" : "+ Add design"}
        </button>
      </div>

      {adding && (
        <form onSubmit={addItem} className="mb-3 flex gap-2 rounded-card border border-line bg-surface p-3">
          <input name="design" placeholder="Design name" required className="min-w-0 flex-1 rounded-card border border-line px-2 py-2 text-sm" />
          <select name="size" className="rounded-card border border-line px-1 py-2 text-sm">
            {SIZES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input name="start" type="number" min="0" defaultValue="5" className="w-16 rounded-card border border-line px-2 py-2 text-sm" />
          <button className="rounded-card bg-accent px-3 py-2 text-sm font-semibold text-surface">Add</button>
        </form>
      )}

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search designs…"
        className="mb-3 w-full rounded-card border border-line bg-surface px-3 py-2.5 text-base" />

      <p className="mb-2 text-sm text-muted">
        {totals.start - totals.sold} of {totals.start} prints remaining · {totals.sold} sold · tap a name, size or stock number to edit
      </p>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3.5rem] gap-1 border-b border-line px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Design</span><span className="text-right">Start</span><span className="text-right">Sold</span><span className="text-right">Left</span>
        </div>
        {rows.map((r) => {
          const left = r.start - r.sold;
          return (
            <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3.5rem] items-center gap-1 border-b border-line px-3 py-2 text-sm last:border-0">
              <span className="truncate" style={{ overflowWrap: "anywhere" }}>
                <button onClick={() => rename(r.design)} className="underline decoration-dotted">{r.design}</button>{" "}
                <button onClick={() => resize(r)} className="font-bold text-muted underline decoration-dotted">{r.size}</button>
              </span>
              <button onClick={() => setStart(r)} className="text-right font-mono underline decoration-dotted">{r.start}</button>
              <span className="text-right font-mono text-muted">{r.sold}</span>
              <span className={`text-right font-mono font-semibold ${left <= 0 ? "text-muted" : left <= 2 ? "text-warn" : "text-good"}`}>
                {left}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
