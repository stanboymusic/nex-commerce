import { initPocketBase } from '@/lib/pocketbase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const records = await pb.collection('users').getFullList({ sort: '-created' });

    const users = records.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      isVip: !!r.isVip,
      created: r.created,
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
