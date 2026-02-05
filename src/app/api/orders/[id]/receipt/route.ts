import { NextRequest, NextResponse } from 'next/server';
import { initPocketBase } from '@/lib/pocketbase';
import { getAdminPocketBase } from '@/lib/admin';
import { generateOrderReceiptPDF } from '@/lib/pdf';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminPb = await getAdminPocketBase();
    const order = await adminPb.collection('orders').getOne(id, {
      expand: 'order_items(order).product,user'
    });

    const isAdmin = (user as any).role === 'ADMIN';
    if (!isAdmin && order.user !== (user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = order.expand?.['order_items(order)'] || [];
    const mappedItems = items.map((item: any) => ({
      id: item.id,
      name: item.name || item.expand?.product?.name,
      quantity: item.quantity,
      price: item.price,
      product: item.expand?.product
    }));

    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.PB_URL || process.env.POCKETBASE_URL || '';
    const paymentProofUrl = order.paymentProof
      ? `${pbUrl}/api/files/orders/${order.id}/${order.paymentProof}`
      : undefined;

    const pdfBytes = await generateOrderReceiptPDF(
      {
        ...order,
        items: mappedItems,
        customerName: order.expand?.user?.name || 'N/A',
        customerEmail: order.expand?.user?.email || 'N/A',
        createdAt: order.created
      },
      { paymentProofUrl }
    );

    const filename = `orden-${order.id}.pdf`;
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error: any) {
    console.error('Receipt PDF error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
