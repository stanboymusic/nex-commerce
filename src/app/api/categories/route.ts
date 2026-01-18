import { initPocketBase } from '@/lib/pocketbase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'ADMIN';
    const filter = isAdmin ? '' : `user = "${user.id}"`;

    const records = await pb.collection('categories').getFullList({ sort: 'name', filter });

    const categories = records.map(r => ({ id: r.id, name: r.name, user: r.user }));

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: error.message || 'Error fetching categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    if (!data.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const record = await pb.collection('categories').create({
      name: data.name,
      user: user.id,
    });

    return NextResponse.json({ id: record.id, name: record.name });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Error creating category' }, { status: 500 });
  }
}
