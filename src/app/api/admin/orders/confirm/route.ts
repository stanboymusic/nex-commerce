import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";
import { generateInvoicePDF } from "@/lib/pdf";
import { sendOrderConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { orderId } = await req.json();
  const pb = await getAdminPocketBase();

  const order = await pb.collection("orders").getOne(orderId, {
    expand: "order_items(order).product,user"
  });

  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  // 1️⃣ Cambiar estado
  await pb.collection("orders").update(orderId, {
    status: "CONFIRMED",
    paymentStatus: "VERIFIED",
  });

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