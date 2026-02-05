import { NextRequest, NextResponse } from 'next/server';
import { initPocketBase } from '@/lib/pocketbase';
import { getAdminPocketBase } from '@/lib/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const orderIds: string[] = Array.isArray(body?.orderIds) ? body.orderIds : [];
    if (!orderIds.length) {
      return NextResponse.json({});
    }

    const adminPb = await getAdminPocketBase();
    const isAdmin = (user as any).role === 'ADMIN';

    if (!isAdmin) {
      const owned = await adminPb.collection('orders').getFullList({
        filter: orderIds.map((id) => `id = "${id}"`).join(' || ')
      });
      const ownedIds = new Set(owned.filter((o: any) => o.user === (user as any).id).map((o: any) => o.id));
      for (const id of orderIds) {
        if (!ownedIds.has(id)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const filter = orderIds.map((id) => `order = "${id}"`).join(' || ');
    const messages = await adminPb.collection('order_messages').getFullList({
      filter,
      sort: '-created'
    });

    const summary: Record<string, { lastMessageAt: string; lastSenderRole?: string; total: number }> = {};
    for (const msg of messages) {
      summary[msg.order] = summary[msg.order] || { lastMessageAt: msg.created, lastSenderRole: msg.senderRole, total: 0 };
      summary[msg.order].total += 1;
      if (msg.created > summary[msg.order].lastMessageAt) {
        summary[msg.order].lastMessageAt = msg.created;
        summary[msg.order].lastSenderRole = msg.senderRole;
      }
    }

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('ORDER_MESSAGES_SUMMARY_ERROR:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch messages summary' }, { status: 500 });
  }
}
