import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";
import { getDefaultStatusMessage, recordOrderStatusEvent } from "@/lib/order-status-events";

const allowedStatuses = new Set([
  "PENDING_PAYMENT",
  "PAYMENT_REPORTED",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED"
]);

export async function POST(req: Request) {
  try {
    const { orderId, newStatus } = await req.json();
    const pb = await getAdminPocketBase();

    const order = await pb.collection("orders").getOne(orderId, {
      expand: "order_items(order)"
    });

    if (!allowedStatuses.has(newStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
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

    const nowISO = new Date().toISOString();
    const orderPaymentStatus = String(order.paymentStatus || "").toUpperCase();
    const shouldForceVerifiedOnDelivered =
      newStatus === "DELIVERED" && orderPaymentStatus !== "REJECTED" && orderPaymentStatus !== "VERIFIED";

    const payload: Record<string, unknown> = { status: newStatus };
    if (shouldForceVerifiedOnDelivered) {
      payload.paymentStatus = "VERIFIED";
      payload.paymentReportedAt = nowISO;
    }

    let updated: unknown = null;
    try {
      if (shouldForceVerifiedOnDelivered) {
        payload.paymentVerifiedAt = nowISO;
      }
      updated = await pb.collection("orders").update(orderId, payload);
    } catch (err: unknown) {
      const pbErr = err as { data?: { data?: Record<string, unknown> }; message?: string };
      const fieldErrors = pbErr?.data?.data || {};
      const msg = String(pbErr?.message || "");
      const unknownField =
        !!fieldErrors?.paymentVerifiedAt ||
        msg.toLowerCase().includes("paymentverifiedat") ||
        msg.toLowerCase().includes("unknown field");

      if (!unknownField || !shouldForceVerifiedOnDelivered) {
        throw err;
      }

      // Legacy schema without paymentVerifiedAt.
      delete payload.paymentVerifiedAt;
      updated = await pb.collection("orders").update(orderId, payload);
    }

    if (newStatus !== order.status) {
      await recordOrderStatusEvent({
        pb,
        orderId,
        status: newStatus,
        message: getDefaultStatusMessage(newStatus),
        visibleToUser: true,
        actorRole: 'ADMIN'
      });
    }
    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
