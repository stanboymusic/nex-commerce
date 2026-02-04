import { NextRequest, NextResponse } from 'next/server';
import { initPocketBase } from '@/lib/pocketbase';
import { getAdminPocketBase } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const endpoint = body?.endpoint;
    if (!endpoint) {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    const adminPb = await getAdminPocketBase();
    const existing = await adminPb.collection('push_subscriptions').getFirstListItem(
      `endpoint = "${endpoint}" && user = "${user.id}"`
    ).catch(() => null);

    if (existing?.id) {
      await adminPb.collection('push_subscriptions').delete(existing.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUSH_UNSUBSCRIBE_ERROR:', error);
    return NextResponse.json({ error: error.message || 'Failed to unsubscribe' }, { status: 500 });
  }
}
