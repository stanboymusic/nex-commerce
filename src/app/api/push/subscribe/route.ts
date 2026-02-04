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
    const subscription = body?.subscription;
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const adminPb = await getAdminPocketBase();
    const existing = await adminPb.collection('push_subscriptions').getFirstListItem(
      `endpoint = "${subscription.endpoint}" && user = "${user.id}"`
    ).catch(() => null);

    const data = {
      user: user.id,
      role: (user as any).role || 'USER',
      endpoint: subscription.endpoint,
      subscription
    };

    if (existing?.id) {
      await adminPb.collection('push_subscriptions').update(existing.id, data);
    } else {
      await adminPb.collection('push_subscriptions').create(data);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUSH_SUBSCRIBE_ERROR:', error);
    return NextResponse.json({ error: error.message || 'Failed to subscribe' }, { status: 500 });
  }
}
