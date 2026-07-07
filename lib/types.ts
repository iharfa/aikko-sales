import type { Size } from "./config";

export type InvRow = {
  id: number;
  design: string;
  size: Size;
  start: number; // starting stock
  sold: number;
};

export type SaleItem = { design: string; size: Size; qty: number; unit: number };

export type Sale = {
  id: number;
  ts: string | null; // null = imported from the fest spreadsheet (time unknown)
  payment: string | null;
  cash?: number | null; // amount paid in cash (total−cash was transferred); set for all new sales
  total: number;
  items: SaleItem[];
  note?: string;
};
