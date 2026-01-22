import { NextRequest, NextResponse } from "next/server";
import { initPocketBase, getAdminPocketBase } from "@/lib/pocketbase";
import PocketBase from "pocketbase";

export async function GET(req: NextRequest) {
  try {
    const pb = await getAdminPocketBase();
    const rates = await pb.collection("exchange_rates").getFullList({
      filter: "active = true"
    });
    return NextResponse.json(rates[0]);
  } catch (error: any) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json({ error: error.message || 'Error fetching exchange rate' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    // RBAC: Only ADMIN can create exchange rates
    if (!pb.authStore.isValid || (pb.authStore.model as any).role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rate } = body;

    if (!rate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Set all others to inactive
    await pb.collection('exchange_rates').update('*', { active: false });

    const record = await pb.collection("exchange_rates").create({ rate, active: true });
    return NextResponse.json(record);
  } catch (err: any) {
    console.error("CREATE_EXCHANGE_RATE_ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
