import { getInventory, upsertItem } from "@/lib/db";

export async function GET() {
  return Response.json(await getInventory());
}

export async function POST(req: Request) {
  const { design, size, start } = await req.json();
  if (!design || !size || !(start >= 0)) return new Response("bad request", { status: 400 });
  await upsertItem(String(design).trim(), size, Math.floor(start));
  return Response.json(await getInventory());
}
