import { PDFDocument, StandardFonts } from "pdf-lib";

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

const formatMoney = (value: number | null | undefined, currency: string) => {
  const safe = Number.isFinite(value) ? Number(value) : 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2
  }).format(safe);
};

export async function generateOrderReceiptPDF(
  order: any,
  options?: { paymentProofUrl?: string }
) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 600;
  const pageHeight = 800;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 50;

  const drawText = (text: string, size = 12, isBold = false) => {
    page.drawText(text, { x: 50, y, font: isBold ? boldFont : font, size });
    y -= size + 6;
  };

  drawText('Comprobante de Orden', 18, true);
  drawText(`Código de orden: ${order.id}`, 12, true);
  drawText(`Fecha: ${new Date(order.createdAt || order.created).toLocaleString()}`);

  y -= 6;
  drawText('Cliente', 14, true);
  drawText(`Nombre: ${order.customerName || order.expand?.user?.name || 'N/A'}`);
  drawText(`Email: ${order.customerEmail || order.expand?.user?.email || 'N/A'}`);
  if (order.expand?.user?.phone) {
    drawText(`Teléfono: ${order.expand.user.phone}`);
  }

  y -= 6;
  drawText('Envío', 14, true);
  drawText(`Dirección: ${order.address || 'N/A'}`);
  const shippingCost = typeof order.shippingCost === 'number' ? order.shippingCost : null;
  drawText(`Costo de envío: ${shippingCost !== null ? formatMoney(shippingCost, order.currency) : 'Por definir'}`);

  y -= 6;
  drawText('Pago', 14, true);
  drawText(`Método de pago: ${order.paymentMethod || 'N/A'}`);
  if (order.paymentReference) {
    drawText(`Referencia: ${order.paymentReference}`);
  }
  if (order.binanceTxHash) {
    drawText(`Transacción Binance: ${order.binanceTxHash}`);
  }

  y -= 10;
  drawText('Productos', 14, true);
  drawText('Nombre | Cantidad | Unitario | Total', 11, true);

  let itemsTotal = 0;
  for (const item of order.items || []) {
    const qty = Number(item.quantity || 0);
    const unit = Number(item.price || 0);
    const lineTotal = qty * unit;
    itemsTotal += lineTotal;

    const line = `${item.name || item.product?.name || 'Producto'} | ${qty} | ${formatMoney(unit, order.currency)} | ${formatMoney(lineTotal, order.currency)}`;
    if (y < 120) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    drawText(line, 10);
  }

  y -= 6;
  drawText(`Subtotal productos: ${formatMoney(itemsTotal, order.currency)}`, 12, true);
  if (shippingCost !== null) {
    drawText(`Envío: ${formatMoney(shippingCost, order.currency)}`, 12, true);
  }
  drawText(`Total orden: ${formatMoney(order.total, order.currency)}`, 13, true);

  if (order.paymentProof || options?.paymentProofUrl) {
    drawText(`Comprobante de pago: ${order.paymentProof || 'Adjunto'}`, 12, true);
  }

  if (options?.paymentProofUrl) {
    try {
      const response = await fetch(options.paymentProofUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const isPng = options.paymentProofUrl.toLowerCase().endsWith('.png');
        const image = isPng ? await pdf.embedPng(buffer) : await pdf.embedJpg(buffer);
        const { width, height } = image.scale(0.5);

        if (y < 180) {
          page = pdf.addPage([pageWidth, pageHeight]);
          y = pageHeight - 60;
        }

        drawText('Comprobante de pago', 14, true);
        page.drawImage(image, {
          x: 50,
          y: y - height,
          width,
          height
        });
        y -= height + 20;
      }
    } catch (error) {
      // If proof cannot be embedded, ignore and keep PDF valid
    }
  }

  return await pdf.save();
}
