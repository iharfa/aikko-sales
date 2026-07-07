import { getSales, recordSale, voidSale } from "@/lib/db";

export async function GET() {
  return Response.json(await getSales());
}

export async function POST(req: Request) {
  const { items, payment, total, cash, note } = await req.json();
  if (!Array.isArray(items) || !items.length || !(total >= 0) || !(cash >= 0 && cash <= total))
    return new Response("bad request", { status: 400 });
  return Response.json(await recordSale(items, payment, total, cash, note));
}

export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return new Response("bad request", { status: 400 });
  await voidSale(id);
  return Response.json({ ok: true });
}
