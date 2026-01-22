import { NextRequest, NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pb = await getAdminPocketBase();

  const { transferId, status } = body;

  // Buscar la orden vinculada a esta transferencia
  const orders = await pb.collection("orders").getFullList({
    filter: `paymentReference = '${transferId}'`,
    limit: 1
  });

  if (!orders.length) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const order = orders[0];

  if (status === "COMPLETED") {
    // Cambiar estado a PAYMENT_REPORTED
    await pb.collection("orders").update(order.id, { status: "PAYMENT_REPORTED" });
  }

  return NextResponse.json({ success: true });
}