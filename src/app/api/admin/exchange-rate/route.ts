import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function POST(req: Request) {
  const { baseCurrency, targetCurrency, rate } = await req.json();
  const pb = await getAdminPocketBase();

  // Desactivar anteriores
  const all = await pb.collection("exchange_rates").getFullList();
  for (const r of all) {
    if (r.active) {
      await pb.collection("exchange_rates").update(r.id, { active: false });
    }
  }

  const created = await pb.collection("exchange_rates").create({
    baseCurrency,
    targetCurrency,
    rate,
    active: true,
  });

  return NextResponse.json({ success: true, rate: created });
}