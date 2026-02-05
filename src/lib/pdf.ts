import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

type ReceiptOptions = {
  paymentProofUrl?: string;
  logoUrl?: string;
};

export async function generateOrderReceiptPDF(order: any, options?: ReceiptOptions) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  let page = pdf.addPage([pageWidth, pageHeight]);
  const margin = 48;
  let y = pageHeight - margin;

  const colors = {
    navy: rgb(0.05, 0.12, 0.22),
    purple: rgb(0.48, 0.32, 0.9),
    blue: rgb(0.25, 0.55, 0.95),
    light: rgb(0.95, 0.96, 0.99),
    muted: rgb(0.4, 0.45, 0.55)
  };

  const drawText = (text: string, size = 12, isBold = false, color = colors.navy) => {
    page.drawText(text, { x: margin, y, font: isBold ? boldFont : font, size, color });
    y -= size + 6;
  };

  const drawSectionTitle = (title: string) => {
    y -= 4;
    page.drawRectangle({
      x: margin,
      y: y - 2,
      width: pageWidth - margin * 2,
      height: 22,
      color: colors.light
    });
    page.drawText(title, {
      x: margin + 10,
      y: y + 4,
      font: boldFont,
      size: 11,
      color: colors.navy
    });
    y -= 18;
  };

  // Header
  page.drawRectangle({
    x: 0,
    y: pageHeight - 90,
    width: pageWidth,
    height: 90,
    color: colors.navy
  });
  page.drawRectangle({
    x: 0,
    y: pageHeight - 90,
    width: pageWidth,
    height: 8,
    color: colors.purple
  });

  let logoDrawn = false;
  if (options?.logoUrl) {
    try {
      const logoResponse = await fetch(options.logoUrl);
      if (logoResponse.ok) {
        const buffer = await logoResponse.arrayBuffer();
        const isPng = options.logoUrl.toLowerCase().endsWith('.png');
        const logo = isPng ? await pdf.embedPng(buffer) : await pdf.embedJpg(buffer);
        const targetHeight = 36;
        const scale = targetHeight / logo.height;
        const targetWidth = logo.width * scale;
        page.drawImage(logo, {
          x: margin,
          y: pageHeight - 70,
          width: targetWidth,
          height: targetHeight
        });
        logoDrawn = true;
      }
    } catch (error) {
      // ignore logo failures
    }
  }

  page.drawText('Comprobante de Orden', {
    x: logoDrawn ? margin + 160 : margin,
    y: pageHeight - 64,
    font: boldFont,
    size: 18,
    color: rgb(1, 1, 1)
  });
  page.drawText(`Orden #${order.id}`, {
    x: logoDrawn ? margin + 160 : margin,
    y: pageHeight - 84,
    font,
    size: 10,
    color: rgb(0.85, 0.87, 0.95)
  });

  y = pageHeight - 110;
  drawText(`Fecha: ${new Date(order.createdAt || order.created).toLocaleString()}`, 11, false, colors.muted);

  drawSectionTitle('Cliente');
  drawText(`Nombre: ${order.customerName || order.expand?.user?.name || 'N/A'}`, 12, true);
  drawText(`Email: ${order.customerEmail || order.expand?.user?.email || 'N/A'}`, 11, false, colors.muted);
  if (order.expand?.user?.phone) {
    drawText(`Teléfono: ${order.expand.user.phone}`, 11, false, colors.muted);
  }

  drawSectionTitle('Envío');
  drawText(`Dirección: ${order.address || 'N/A'}`, 11);
  const shippingCost = typeof order.shippingCost === 'number' ? order.shippingCost : null;
  drawText(`Costo de envío: ${shippingCost !== null ? formatMoney(shippingCost, order.currency) : 'Por definir'}`, 11);

  drawSectionTitle('Pago');
  drawText(`Método de pago: ${order.paymentMethod || 'N/A'}`, 11);
  if (order.paymentReference) {
    drawText(`Referencia Kontigo: ${order.paymentReference}`, 11);
  }
  if (order.binanceTxHash) {
    drawText(`Transacción Binance: ${order.binanceTxHash}`, 11);
  }

  drawSectionTitle('Productos');
  page.drawText('Producto', { x: margin, y, font: boldFont, size: 10, color: colors.navy });
  page.drawText('Cant.', { x: 330, y, font: boldFont, size: 10, color: colors.navy });
  page.drawText('Unitario', { x: 385, y, font: boldFont, size: 10, color: colors.navy });
  page.drawText('Total', { x: 480, y, font: boldFont, size: 10, color: colors.navy });
  y -= 16;

  let itemsTotal = 0;
  for (const item of order.items || []) {
    const qty = Number(item.quantity || 0);
    const unit = Number(item.price || 0);
    const lineTotal = qty * unit;
    itemsTotal += lineTotal;

    if (y < 120) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    page.drawText(`${item.name || item.product?.name || 'Producto'}`, { x: margin, y, font, size: 10, color: colors.navy });
    page.drawText(`${qty}`, { x: 330, y, font, size: 10, color: colors.navy });
    page.drawText(`${formatMoney(unit, order.currency)}`, { x: 385, y, font, size: 10, color: colors.navy });
    page.drawText(`${formatMoney(lineTotal, order.currency)}`, { x: 480, y, font, size: 10, color: colors.navy });
    y -= 14;
  }

  y -= 6;
  page.drawText(`Subtotal productos: ${formatMoney(itemsTotal, order.currency)}`, { x: 330, y, font: boldFont, size: 10, color: colors.navy });
  y -= 14;
  if (shippingCost !== null) {
    page.drawText(`Envío: ${formatMoney(shippingCost, order.currency)}`, { x: 330, y, font: boldFont, size: 10, color: colors.navy });
    y -= 14;
  }
  page.drawText(`Total orden: ${formatMoney(order.total, order.currency)}`, { x: 330, y, font: boldFont, size: 12, color: colors.purple });
  y -= 22;

  if (order.paymentProof || options?.paymentProofUrl) {
    drawSectionTitle('Comprobante de pago');
    drawText(`Archivo: ${order.paymentProof || 'Adjunto'}`, 10, false, colors.muted);
  }

  if (options?.paymentProofUrl) {
    try {
      const response = await fetch(options.paymentProofUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const isPng = options.paymentProofUrl.toLowerCase().endsWith('.png');
        const image = isPng ? await pdf.embedPng(buffer) : await pdf.embedJpg(buffer);
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = 260;
        const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;

        if (y < drawHeight + 40) {
          page = pdf.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        page.drawRectangle({
          x: margin,
          y: y - drawHeight - 10,
          width: drawWidth + 20,
          height: drawHeight + 20,
          color: colors.light
        });
        page.drawImage(image, {
          x: margin + 10,
          y: y - drawHeight,
          width: drawWidth,
          height: drawHeight
        });
        y -= drawHeight + 30;
      }
    } catch (error) {
      // If proof cannot be embedded, ignore and keep PDF valid
    }
  }

  return await pdf.save();
}
