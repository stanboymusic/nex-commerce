import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";
import { getDefaultStatusMessage, recordOrderStatusEvent } from "@/lib/order-status-events";

export async function POST(req: Request) {
    try {
        const { orderId, reason } = await req.json();
        const pb = await getAdminPocketBase();

        // Fetch order items to rollback stock
        const order = await pb.collection("orders").getOne(orderId, {
            expand: "order_items(order)"
        });

        if (order.status !== "CANCELLED" && order.status !== "REJECTED") {
            const items = order.expand?.["order_items(order)"] || [];
            for (const item of items) {
                const product = await pb.collection("products").getOne(item.product);
                if (!product.isPreorder) {
                    await pb.collection("products").update(item.product, {
                        stock: (product.stock || 0) + item.quantity
                    });
                }
            }
        }

        const updated = await pb.collection("orders").update(orderId, {
            paymentStatus: "REJECTED",
            status: "CANCELLED",
            notes: reason || "Pago rechazado"
        });

        if (order.status !== "CANCELLED") {
          await recordOrderStatusEvent({
            pb,
            orderId,
            status: "CANCELLED",
            message: reason || getDefaultStatusMessage("CANCELLED"),
            visibleToUser: true,
            actorRole: 'ADMIN',
            notifyUserId: order.user
          });
        }

        return NextResponse.json({ success: true, order: updated });
    } catch (error) {
        console.error("Error rejecting payment:", error);
        return NextResponse.json({ error: "Failed to reject payment" }, { status: 500 });
    }
}
