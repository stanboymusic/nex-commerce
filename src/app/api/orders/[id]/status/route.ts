import { NextRequest, NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'
import { getDefaultStatusMessage, recordOrderStatusEvent } from '@/lib/order-status-events'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await req.json()
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const existing = await pb.collection('orders').getOne(id)
    const updatedOrder = await pb.collection('orders').update(id, { status }, {
      expand: 'order_items(order).product,user'
    })

    if (status !== existing.status) {
      await recordOrderStatusEvent({
        pb,
        orderId: id,
        status,
        message: getDefaultStatusMessage(status),
        visibleToUser: true,
        actorRole: 'ADMIN',
        actorId: user.id
      })
    }

    return NextResponse.json(updatedOrder)
  } catch (error: any) {
    console.error('Update order status error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
