import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateInvoicePDF(order: any) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 750]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText(`Factura Orden: ${order.id}`, { x: 50, y: 700, font, size: 18 });
  page.drawText(`Cliente: ${order.customerName}`, { x: 50, y: 680, font, size: 12 });
  page.drawText(`Total: ${order.total} ${order.currency}`, { x: 50, y: 660, font, size: 12 });
  page.drawText(`Método de pago: ${order.paymentMethod}`, { x: 50, y: 640, font, size: 12 });

  let y = 610;
  for (const item of order.items) {
    page.drawText(`${item.name} x${item.quantity} - ${item.price}`, { x: 50, y, font, size: 12 });
    y -= 20;
  }

  return await pdf.save();
}