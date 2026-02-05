import { NextRequest, NextResponse } from 'next/server';
import { initPocketBase } from '@/lib/pocketbase';
import { getAdminPocketBase } from '@/lib/admin';

export const runtime = 'nodejs';

const ensureAccess = async (req: NextRequest, orderId: string) => {
  const pb = await initPocketBase(req);
  const user = pb.authStore.model;

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const adminPb = await getAdminPocketBase();
  const order = await adminPb.collection('orders').getOne(orderId);
  const isAdmin = (user as any).role === 'ADMIN';

  if (!isAdmin && order.user !== (user as any).id) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { pb, adminPb, user, order, isAdmin };
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await ensureAccess(req, id);
    if ('error' in access) return access.error;

    const { adminPb } = access;
    const records = await adminPb.collection('order_messages').getFullList({
      filter: `order = "${id}"`,
      sort: 'created',
      expand: 'sender'
    });

    const messages = records.map((m: any) => ({
      id: m.id,
      order: m.order,
      message: m.message,
      sender: m.sender,
      senderRole: m.senderRole,
      created: m.created,
      createdAt: m.created,
      senderName: m.expand?.sender?.name || 'Usuario'
    }));

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('ORDER_MESSAGES_GET_ERROR:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await ensureAccess(req, id);
    if ('error' in access) return access.error;

    const { adminPb, user } = access;
    const body = await req.json();
    const message = String(body?.message || '').trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const created = await adminPb.collection('order_messages').create({
      order: id,
      sender: (user as any).id,
      senderRole: (user as any).role || 'USER',
      message
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('ORDER_MESSAGES_POST_ERROR:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
