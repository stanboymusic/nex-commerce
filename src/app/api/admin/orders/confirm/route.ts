import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";
import { generateInvoicePDF } from "@/lib/pdf";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getDefaultStatusMessage, recordOrderStatusEvent } from "@/lib/order-status-events";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { orderId } = await req.json();
  const pb = await getAdminPocketBase();

  const order = await pb.collection("orders").getOne(orderId, {
    expand: "order_items(order).product,user"
  });

  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  const verifiedAt = new Date().toISOString();

  // 1️⃣ Cambiar estado
  try {
    await pb.collection("orders").update(orderId, {
      status: "CONFIRMED",
      paymentStatus: "VERIFIED",
      paymentReportedAt: verifiedAt,
      paymentVerifiedAt: verifiedAt,
    });
  } catch (err: unknown) {
    const pbErr = err as { data?: { data?: Record<string, unknown> }; message?: string };
    const fieldErrors = pbErr?.data?.data || {};
    const msg = String(pbErr?.message || "");
    const unknownField =
      !!fieldErrors?.paymentVerifiedAt ||
      msg.toLowerCase().includes("paymentverifiedat") ||
      msg.toLowerCase().includes("unknown field");

    if (!unknownField) {
      throw err;
    }

    await pb.collection("orders").update(orderId, {
      status: "CONFIRMED",
      paymentStatus: "VERIFIED",
      paymentReportedAt: verifiedAt,
    });
  }

  if (order.status !== "CONFIRMED") {
    await recordOrderStatusEvent({
      pb,
      orderId,
      status: "CONFIRMED",
      message: getDefaultStatusMessage("CONFIRMED"),
      visibleToUser: true,
      actorRole: 'ADMIN'
    });
  }

  // 2️⃣ Generar PDF
  const pdfBuffer = await generateInvoicePDF(order);

  // 3️⃣ Enviar email
  if (order.expand?.user?.email) {
    await sendOrderConfirmationEmail(
      order.expand.user.email,
      `Orden Confirmada: ${order.id}`,
      `<p>Su orden ha sido confirmada.</p>`,
      pdfBuffer
    );
  }

  return NextResponse.json({ success: true });
}
