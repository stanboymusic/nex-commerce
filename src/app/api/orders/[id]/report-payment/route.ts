import { NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reference } = await req.json()
    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
    }

    // Fetch the order first to check ownership if not admin
    const order = await pb.collection('orders').getOne(id);
    
    if (order.user !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update order status and set reference
    const updatedOrder = await pb.collection('orders').update(id, {
      status: 'PAYMENT_REPORTED',
      paymentReference: reference,
      paymentReportedAt: new Date(),
    })

    return NextResponse.json(updatedOrder)
  } catch (error: any) {
    console.error('Report payment error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
