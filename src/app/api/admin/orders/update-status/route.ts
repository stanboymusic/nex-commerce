import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

const allowed: Record<string, string[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAYMENT_REPORTED: ["CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"]
};

export async function POST(req: Request) {
  try {
    const { orderId, newStatus } = await req.json();
    const pb = await getAdminPocketBase();

    const order = await pb.collection("orders").getOne(orderId, {
      expand: "order_items(order)"
    });

    if (!allowed[order.status]?.includes(newStatus)) {
      return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
    }

    // Handle stock rollback if cancelling
    if (newStatus === "CANCELLED" && order.status !== "CANCELLED" && order.status !== "REJECTED") {
      const items = order.expand?.["order_items(order)"] || [];
      for (const item of items) {
        try {
          const product = await pb.collection("products").getOne(item.product);
          if (!product.isPreorder) {
            await pb.collection("products").update(item.product, {
              stock: (product.stock || 0) + item.quantity
            });
          }
        } catch (e) {
          console.error(`Failed to rollback stock for product ${item.product}`, e);
        }
      }
    }

    const updated = await pb.collection("orders").update(orderId, { status: newStatus });
    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
