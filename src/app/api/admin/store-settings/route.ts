import { NextRequest, NextResponse } from 'next/server';
import { getAdminPocketBase } from '@/lib/admin';

export async function GET() {
  try {
    const pb = await getAdminPocketBase();
    const record = await pb.collection('store_settings').getFirstListItem('').catch(() => null);
    return NextResponse.json(record || {});
  } catch (error: any) {
    console.error('[GET /api/admin/store-settings]', error);
    return NextResponse.json({ error: 'Failed to fetch store settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const pb = await getAdminPocketBase();
    const body = await req.json();
    const vipDiscountPercent = Number(body?.vipDiscountPercent ?? 0);
    const vipEnabled = body?.vipEnabled !== false;

    const existing = await pb.collection('store_settings').getFirstListItem('').catch(() => null);
    if (existing?.id) {
      const updated = await pb.collection('store_settings').update(existing.id, {
        vipDiscountPercent,
        vipEnabled
      });
      return NextResponse.json(updated);
    }
    const created = await pb.collection('store_settings').create({
      vipDiscountPercent,
      vipEnabled
    });
    return NextResponse.json(created);
  } catch (error: any) {
    console.error('[POST /api/admin/store-settings]', error);
    return NextResponse.json({ error: 'Failed to save store settings' }, { status: 500 });
  }
}
