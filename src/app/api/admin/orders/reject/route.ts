import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";
import { getDefaultStatusMessage, recordOrderStatusEvent } from "@/lib/order-status-events";

export async function POST(req: Request) {
  const { orderId } = await req.json();
  const pb = await getAdminPocketBase();

  const existing = await pb.collection("orders").getOne(orderId);
  const updated = await pb.collection("orders").update(orderId, {
    status: "CANCELLED",
    paymentStatus: "REJECTED",
  });

  if (existing.status !== "CANCELLED") {
    await recordOrderStatusEvent({
      pb,
      orderId,
      status: "CANCELLED",
      message: getDefaultStatusMessage("CANCELLED"),
      visibleToUser: true,
      actorRole: 'ADMIN'
    });
  }

  return NextResponse.json({ success: true });
}
