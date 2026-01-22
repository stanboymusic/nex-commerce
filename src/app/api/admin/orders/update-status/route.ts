import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

const allowedTransitions = {
  PAYMENT_REPORTED: ["CONFIRMED"],
  CONFIRMED: ["PREPARING"],
  PREPARING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
};

export async function POST(req: Request) {
  const { orderId, newStatus } = await req.json();
  const pb = await getAdminPocketBase();

  const order = await pb.collection("orders").getOne(orderId);

  if (!allowedTransitions[order.status as keyof typeof allowedTransitions]?.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  }

  const updated = await pb.collection("orders").update(orderId, {
    status: newStatus,
  });

  return NextResponse.json({ success: true });
}