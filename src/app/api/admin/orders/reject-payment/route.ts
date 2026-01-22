import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

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

        return NextResponse.json({ success: true, order: updated });
    } catch (error) {
        console.error("Error rejecting payment:", error);
        return NextResponse.json({ error: "Failed to reject payment" }, { status: 500 });
    }
}
