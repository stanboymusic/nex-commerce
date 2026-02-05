import { NextRequest, NextResponse } from 'next/server';
import { getAdminPocketBase } from '@/lib/admin';
import { getStoreSettingsRecord } from '@/lib/store-settings';

export async function GET() {
  try {
    const pb = await getAdminPocketBase();
    const { record } = await getStoreSettingsRecord(pb);
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

    const { collection, record: existing } = await getStoreSettingsRecord(pb);
    if (existing?.id) {
      const updated = await pb.collection(collection).update(existing.id, {
        vipDiscountPercent,
        vipEnabled
      });
      return NextResponse.json(updated);
    }
    const created = await pb.collection(collection).create({
      vipDiscountPercent,
      vipEnabled
    });
    return NextResponse.json(created);
  } catch (error: any) {
    console.error('[POST /api/admin/store-settings]', error);
    return NextResponse.json({ error: 'Failed to save store settings' }, { status: 500 });
  }
}
