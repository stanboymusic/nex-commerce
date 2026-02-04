import { NextRequest, NextResponse } from 'next/server';
import { initPocketBase } from '@/lib/pocketbase';
import { getAdminPocketBase } from '@/lib/admin';
import { getDefaultStatusMessage, recordOrderStatusEvent } from '@/lib/order-status-events';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      const record = await pb.collection('orders').getOne(id, {
        expand: 'order_items(order).product,user'
      });

      // RBAC check: Only owner or ADMIN can view
      const isAdmin = (user as any).role === 'ADMIN';
      if (!isAdmin && record.user !== (user as any).id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json(record);
    } catch (error: any) {
      if (error.status === 404) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Fetch order error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only ADMIN can update order status or other fields for now
    if ((user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const adminPb = await getAdminPocketBase();
    const existing = await adminPb.collection('orders').getOne(id);
    const { statusMessage, statusVisible, ...updateData } = data || {};
    const updated = await adminPb.collection('orders').update(id, updateData, {
      expand: 'order_items(order).product,user'
    });

    if (data?.status && data.status !== existing.status) {
      await recordOrderStatusEvent({
        pb: adminPb,
        orderId: id,
        status: data.status,
        message: statusMessage || getDefaultStatusMessage(data.status),
        visibleToUser: statusVisible !== false,
        actorRole: 'ADMIN',
        actorId: (user as any).id,
        notifyUserId: existing.user
      });
    } else if (statusMessage) {
      await recordOrderStatusEvent({
        pb: adminPb,
        orderId: id,
        status: data?.status || existing.status,
        message: statusMessage,
        visibleToUser: statusVisible !== false,
        actorRole: 'ADMIN',
        actorId: (user as any).id,
        notifyUserId: existing.user
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: error.message || 'Error updating order' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only ADMIN can delete orders
    if ((user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pb.collection('orders').delete(id);

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Delete order error:', error);
    return NextResponse.json({ error: error.message || 'Error deleting order' }, { status: 500 });
  }
}
