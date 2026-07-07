// Storage adapter: Neon Postgres when DATABASE_URL is set (shared across
// devices), otherwise a local JSON file — zero-config dev/demo mode.
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { SEED_INVENTORY, SEED_SALES } from "./seed";
import type { InvRow, Sale, SaleItem } from "./types";

const url = () => process.env.DATABASE_URL;

// ---------- JSON file mode ----------
type FileDb = { inventory: InvRow[]; sales: Sale[]; nextInv: number; nextSale: number };
const FILE = path.join(process.cwd(), "data", "db.json");

function fileDb(): FileDb {
  if (!fs.existsSync(FILE)) {
    const db: FileDb = {
      inventory: SEED_INVENTORY.map((r, i) => ({ id: i + 1, ...r } as InvRow)),
      sales: SEED_SALES.map((s, i) => ({ id: i + 1, ts: null, payment: null, ...s } as Sale)),
      nextInv: SEED_INVENTORY.length + 1,
      nextSale: SEED_SALES.length + 1,
    };
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db));
    return db;
  }
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}
const save = (db: FileDb) => fs.writeFileSync(FILE, JSON.stringify(db));

// ---------- Neon mode ----------
let ensured = false;
async function pg() {
  const sql = neon(url()!);
  if (!ensured) {
    await sql`CREATE TABLE IF NOT EXISTS inventory (
      id serial PRIMARY KEY, design text NOT NULL, size text NOT NULL,
      start int NOT NULL DEFAULT 0, sold int NOT NULL DEFAULT 0, UNIQUE(design, size))`;
    await sql`CREATE TABLE IF NOT EXISTS sales (
      id serial PRIMARY KEY, ts timestamptz, payment text, cash real,
      total real NOT NULL, items jsonb NOT NULL, note text)`;
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM inventory`;
    if (n === 0) {
      await sql`INSERT INTO inventory (design, size, start, sold)
        SELECT design, size, start, sold FROM jsonb_to_recordset(${JSON.stringify(SEED_INVENTORY)}::jsonb)
        AS x(design text, size text, start int, sold int)`;
      await sql`INSERT INTO sales (ts, payment, total, items, note)
        SELECT null, null, total, items, note FROM jsonb_to_recordset(${JSON.stringify(SEED_SALES)}::jsonb)
        AS x(total real, items jsonb, note text)`;
    }
    ensured = true;
  }
  return sql;
}

// ---------- public API ----------
export async function getInventory(): Promise<InvRow[]> {
  if (!url()) return fileDb().inventory;
  const sql = await pg();
  return (await sql`SELECT * FROM inventory ORDER BY design, size`) as InvRow[];
}

export async function upsertItem(design: string, size: string, start: number): Promise<void> {
  if (!url()) {
    const db = fileDb();
    const row = db.inventory.find((r) => r.design === design && r.size === size);
    if (row) row.start = start;
    else db.inventory.push({ id: db.nextInv++, design, size: size as InvRow["size"], start, sold: 0 });
    return save(db);
  }
  const sql = await pg();
  await sql`INSERT INTO inventory (design, size, start) VALUES (${design}, ${size}, ${start})
    ON CONFLICT (design, size) DO UPDATE SET start = ${start}`;
}

export async function getSales(): Promise<Sale[]> {
  if (!url()) return fileDb().sales.slice().reverse();
  const sql = await pg();
  return (await sql`SELECT * FROM sales ORDER BY ts DESC NULLS LAST, id DESC`) as Sale[];
}

export async function recordSale(items: SaleItem[], payment: string, total: number, cash: number, note?: string): Promise<Sale> {
  const ts = new Date().toISOString();
  if (!url()) {
    const db = fileDb();
    const sale: Sale = { id: db.nextSale++, ts, payment, cash, total, items, note };
    db.sales.push(sale);
    for (const it of items) {
      const row = db.inventory.find((r) => r.design === it.design && r.size === it.size);
      if (row) row.sold += it.qty;
    }
    save(db);
    return sale;
  }
  const sql = await pg();
  const [sale] = await sql`INSERT INTO sales (ts, payment, cash, total, items, note)
    VALUES (${ts}, ${payment}, ${cash}, ${total}, ${JSON.stringify(items)}, ${note ?? null}) RETURNING *`;
  for (const it of items)
    await sql`UPDATE inventory SET sold = sold + ${it.qty} WHERE design = ${it.design} AND size = ${it.size}`;
  return sale as Sale;
}

export async function voidSale(id: number): Promise<void> {
  if (!url()) {
    const db = fileDb();
    const i = db.sales.findIndex((s) => s.id === id);
    if (i < 0) return;
    for (const it of db.sales[i].items) {
      const row = db.inventory.find((r) => r.design === it.design && r.size === it.size);
      if (row) row.sold = Math.max(0, row.sold - it.qty);
    }
    db.sales.splice(i, 1);
    return save(db);
  }
  const sql = await pg();
  const [sale] = await sql`DELETE FROM sales WHERE id = ${id} RETURNING items`;
  if (sale)
    for (const it of sale.items as SaleItem[])
      await sql`UPDATE inventory SET sold = greatest(0, sold - ${it.qty}) WHERE design = ${it.design} AND size = ${it.size}`;
}
