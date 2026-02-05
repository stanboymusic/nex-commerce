import { NextRequest, NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'
import { getAdminPocketBase } from '@/lib/admin'
import { getDefaultStatusMessage, recordOrderStatusEvent } from '@/lib/order-status-events'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData();
    const reference = formData.get('reference') as string;
    const binanceTxHash = formData.get('binanceTxHash') as string;
    const file = formData.get('paymentProof') as File;

    if (!file) {
      return NextResponse.json({ error: 'Payment proof is required' }, { status: 400 })
    }

    // Fetch the order first to check ownership
    const order = await pb.collection('orders').getOne(id);

    if (order.user !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (reference) {
      formData.append('paymentReference', reference);
    }
    if (binanceTxHash) {
      formData.append('paymentMethod', 'BINANCE');
      formData.append('binanceTxHash', binanceTxHash);
    }

    formData.append('paymentStatus', 'REPORTED');
    formData.append('paymentReportedAt', new Date().toISOString());
    formData.append('status', 'PAYMENT_REPORTED');

    const adminPb = await getAdminPocketBase();
    const result = await adminPb.collection('orders').update(id, formData);

    if (order.status !== 'PAYMENT_REPORTED') {
      await recordOrderStatusEvent({
        pb: adminPb,
        orderId: id,
        status: 'PAYMENT_REPORTED',
        message: getDefaultStatusMessage('PAYMENT_REPORTED'),
        visibleToUser: true,
        actorRole: 'USER',
        actorId: user.id
      });
    }
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Report payment error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
