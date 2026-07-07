import { changeSize, getInventory, renameDesign, upsertItem } from "@/lib/db";
import { SIZES } from "@/lib/config";

export async function GET() {
  return Response.json(await getInventory());
}

export async function POST(req: Request) {
  const { design, size, start } = await req.json();
  if (!design || !size || !(start >= 0)) return new Response("bad request", { status: 400 });
  await upsertItem(String(design).trim(), size, Math.floor(start));
  return Response.json(await getInventory());
}

// Edits after the fact: rename a design (all sizes + sales history),
// or change one row's size.
export async function PATCH(req: Request) {
  const body = await req.json();
  let error: string | null = "bad request";
  if (body.rename?.from && body.rename?.to)
    error = await renameDesign(String(body.rename.from).trim(), String(body.rename.to).trim());
  else if (body.id && SIZES.includes(body.size))
    error = await changeSize(Number(body.id), body.size);
  if (error) return Response.json({ error }, { status: 409 });
  return Response.json(await getInventory());
}
