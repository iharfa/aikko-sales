"use client";
import { useEffect, useMemo, useState } from "react";
import { PAYMENTS, PRICES, SIZES, fmt, type Size } from "@/lib/config";
import { priceCart, type CartLine } from "@/lib/pricing";
import type { InvRow } from "@/lib/types";

export default function Sell() {
  const [inv, setInv] = useState<InvRow[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [payment, setPayment] = useState<string>(PAYMENTS[0]);
  const [splitCash, setSplitCash] = useState("");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");

  const load = () => fetch("/api/inventory").then((r) => r.json()).then(setInv);
  useEffect(() => { load(); }, []);

  const designs = useMemo(() => {
    const map = new Map<string, Partial<Record<Size, InvRow>>>();
    for (const r of inv) {
      if (!map.has(r.design)) map.set(r.design, {});
      map.get(r.design)![r.size] = r;
    }
    return [...map.entries()].filter(([d]) => d.toLowerCase().includes(q.toLowerCase()));
  }, [inv, q]);

  const inCart = (design: string, size: Size) =>
    cart.find((l) => l.design === design && l.size === size)?.qty ?? 0;

  const add = (design: string, size: Size) =>
    setCart((c) => {
      const i = c.findIndex((l) => l.design === design && l.size === size);
      if (i >= 0) return c.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { design, size, qty: 1 }];
    });

  const bump = (i: number, d: number) =>
    setCart((c) => c.map((l, j) => (j === i ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0));

  const override = (i: number) => {
    const cur = priced[i].unit;
    const v = window.prompt(`Custom unit price for ${cart[i].design} ${cart[i].size}?`, String(cur));
    if (v === null) return;
    const n = parseFloat(v);
    setCart((c) => c.map((l, j) => (j === i ? { ...l, override: isNaN(n) ? undefined : n } : l)));
  };

  const { priced, total, saved } = priceCart(cart);
  const units = cart.reduce((a, l) => a + l.qty, 0);

  async function checkout() {
    const cash = payment === "Cash" ? total : payment === "Transfer" ? 0 : parseFloat(splitCash);
    if (!(cash >= 0 && cash <= total)) {
      setOpen(true);
      return alert(`Enter the cash portion of the split (0–${total})`);
    }
    setSaving(true);
    const items = priced.map(({ design, size, qty, unit }) => ({ design, size, qty, unit }));
    const res = await fetch("/api/sales", {
      method: "POST",
      body: JSON.stringify({ items, payment, total, cash }),
    });
    setSaving(false);
    if (!res.ok) return alert("Failed to save — try again");
    setCart([]); setOpen(false); setSplitCash(""); load();
    setFlash(`Sale recorded · ${fmt(total)}`);
    setTimeout(() => setFlash(""), 2500);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Sell</h1>
      <p className="mb-3 text-sm text-muted">
        Pairs pricing: 2+ same size → {SIZES.map((s) => `${s} ${fmt(PRICES[s].bundle)}`).join(" · ")}
      </p>
      <input
        value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search designs…"
        className="mb-3 w-full rounded-card border border-line bg-surface px-3 py-2.5 text-base"
      />
      <div className="flex flex-col gap-2">
        {designs.map(([design, sizes]) => (
          <div key={design} className="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-medium" style={{ overflowWrap: "anywhere" }}>{design}</span>
            {SIZES.map((s) => {
              const row = sizes[s];
              if (!row) return <span key={s} className="w-14" />;
              const left = row.start - row.sold - inCart(design, s);
              const out = left <= 0;
              return (
                <button key={s} onClick={() => add(design, s)} disabled={out}
                  className={`w-14 rounded-card border py-1.5 text-center text-sm leading-tight active:translate-y-px ${
                    out ? "border-line text-muted opacity-40"
                    : inCart(design, s) ? "border-accent bg-accent-soft text-accent"
                    : "border-line"}`}>
                  <span className="block font-semibold">{s}</span>
                  <span className={`block text-xs ${left <= 2 && !out ? "text-warn" : "text-muted"}`}>
                    {out ? "out" : `${left} left`}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        {!designs.length && <p className="py-8 text-center text-muted">No designs match “{q}”</p>}
      </div>

      {flash && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 rounded-card bg-ink px-4 py-2 text-sm text-surface">
          {flash}
        </div>
      )}

      {units > 0 && (
        <div className="fixed inset-x-0 bottom-14 border-t border-line bg-surface pb-2">
          <div className="mx-auto max-w-lg px-4">
            {open && (
              <div className="max-h-[45vh] overflow-y-auto py-2">
                {priced.map((l, i) => (
                  <div key={l.design + l.size} className="flex items-center gap-2 border-b border-line py-2 last:border-0">
                    <span className="min-w-0 flex-1 truncate text-sm">{l.design} <b>{l.size}</b></span>
                    <button onClick={() => override(i)} className="font-mono text-sm underline decoration-dotted">
                      {l.discounted && <s className="mr-1 text-muted">{fmt(PRICES[l.size].single)}</s>}
                      {fmt(l.unit)}
                      {l.override != null && <span className="text-warn">*</span>}
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => bump(i, -1)} className="h-9 w-9 rounded-card border border-line text-lg">−</button>
                      <span className="w-6 text-center font-mono text-sm">{l.qty}</span>
                      <button onClick={() => bump(i, 1)} className="h-9 w-9 rounded-card border border-line text-lg">+</button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-3">
                  {PAYMENTS.map((p) => (
                    <button key={p} onClick={() => setPayment(p)}
                      className={`flex-1 rounded-card border py-2 text-sm ${payment === p ? "border-accent bg-accent-soft font-semibold text-accent" : "border-line"}`}>
                      {p}
                    </button>
                  ))}
                </div>
                {payment === "Split" && (
                  <div className="flex items-center gap-2 pt-2 text-sm">
                    <span>Cash</span>
                    <input type="number" inputMode="decimal" min="0" max={total} step="0.5" value={splitCash}
                      onChange={(e) => setSplitCash(e.target.value)} placeholder="0"
                      className="w-20 rounded-card border border-line px-2 py-2 font-mono" />
                    <span className="text-muted">
                      + transfer {fmt(Math.max(0, total - (parseFloat(splitCash) || 0)))}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setOpen(!open)} className="flex-1 text-left">
                <span className="block text-sm text-muted">{units} print{units > 1 ? "s" : ""}{saved > 0 && ` · saving ${fmt(saved)}`}</span>
                <span className="font-mono text-xl font-bold">{fmt(total)}</span>
              </button>
              <button onClick={() => setOpen(!open)} className="rounded-card border border-line px-4 py-3 text-sm">
                {open ? "Hide" : "Edit"}
              </button>
              <button onClick={checkout} disabled={saving}
                className="rounded-card bg-accent px-5 py-3 font-semibold text-surface disabled:opacity-50 active:translate-y-px">
                {saving ? "Saving…" : `Charge ${payment}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
