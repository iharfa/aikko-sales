import { getInventory, resetDb } from "@/lib/db";

// Wipes all inventory and sales and repopulates from lib/seed.ts.
// Guarded by a passcode so it can't be triggered by anyone with the URL.
export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
  if (code !== (process.env.RESET_CODE || "aikko2026"))
    return new Response("wrong code", { status: 403 });
  await resetDb();
  return Response.json(await getInventory());
}
