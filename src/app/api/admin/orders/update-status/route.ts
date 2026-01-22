import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

const allowed: Record<string, string[]> = {
  CONFIRMED: ["PREPARING"],
  PREPARING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"]
};

export async function POST(req: Request) {
  try {
    const { orderId, newStatus } = await req.json();
    const pb = await getAdminPocketBase();

    const order = await pb.collection("orders").getOne(orderId);

    if (!allowed[order.status]?.includes(newStatus)) {
      return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
    }

    const updated = await pb.collection("orders").update(orderId, { status: newStatus });
    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}