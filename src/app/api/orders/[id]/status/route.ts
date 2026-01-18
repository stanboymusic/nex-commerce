import { NextRequest, NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'

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

    const updatedOrder = await pb.collection('orders').update(id, { status }, {
      expand: 'order_items(order).product,user'
    })

    return NextResponse.json(updatedOrder)
  } catch (error: any) {
    console.error('Update order status error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
