import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function POST(req: Request) {
  const { orderId } = await req.json();
  const pb = await getAdminPocketBase();

  const updated = await pb.collection("orders").update(orderId, {
    status: "CANCELLED",
    paymentStatus: "REJECTED",
  });

  return NextResponse.json({ success: true });
}