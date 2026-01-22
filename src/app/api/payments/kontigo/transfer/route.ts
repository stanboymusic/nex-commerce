import { NextRequest, NextResponse } from "next/server";
import { initPocketBase, getAdminPocketBase } from "@/lib/pocketbase";
import { kontigoFetch } from "@/lib/kontigo";

export async function POST(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference, amount, currency, description } = await req.json();

    const data = await kontigoFetch("/transfers", {
      reference,
      amount,
      currency,
      description
    });

    // Update order with kontigoTransferId
    const adminPb = await getAdminPocketBase();
    await adminPb.collection("orders").update(reference, {
      kontigoTransferId: data.id,
      paymentReference: data.id,
      paymentUrl: data.paymentUrl
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Kontigo transfer error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}