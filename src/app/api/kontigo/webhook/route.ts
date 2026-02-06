import { NextRequest, NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";
import { getDefaultStatusMessage, recordOrderStatusEvent } from "@/lib/order-status-events";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pb = await getAdminPocketBase();

  const { transferId, status } = body;

  // 1) Buscar la orden vinculada a esta transferencia
  const orders = await pb
    .collection("orders")
    .getFullList({
      filter: `paymentReference = '${transferId}'`,
      limit: 1,
    })
    .catch(() => []);

  if (orders.length) {
    const order = orders[0];

    if (status === "COMPLETED") {
      // Cambiar estado a PAYMENT_REPORTED
      await pb.collection("orders").update(order.id, { status: "PAYMENT_REPORTED" });

      if (order.status !== "PAYMENT_REPORTED") {
        await recordOrderStatusEvent({
          pb,
          orderId: order.id,
          status: "PAYMENT_REPORTED",
          message: getDefaultStatusMessage("PAYMENT_REPORTED"),
          visibleToUser: true,
          actorRole: "SYSTEM",
        });
      }
    }

    return NextResponse.json({ success: true, type: "order" });
  }

  // 2) Buscar una factura de comision vinculada (billing_invoices)
  const invoices = await pb
    .collection("billing_invoices")
    .getFullList({
      filter: `kontigoTransferId = '${transferId}' || paymentReference = '${transferId}'`,
      limit: 1,
    })
    .catch(() => []);

  if (!invoices.length) {
    return NextResponse.json({ error: "Orden/Factura no encontrada" }, { status: 404 });
  }

  const invoice = invoices[0];
  if (status === "COMPLETED") {
    await pb.collection("billing_invoices").update(invoice.id, {
      status: "PAID",
      paymentMethod: "KONTIGO",
      paymentReference: transferId,
    });
  }

  return NextResponse.json({ success: true, type: "invoice" });
}
