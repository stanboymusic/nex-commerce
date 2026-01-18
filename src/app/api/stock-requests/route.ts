import { NextRequest, NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'

export async function POST(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, message } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const record = await pb.collection('stock_requests').create({
      product: productId,
      user: user.id,
      message: message || 'Customer is requesting this product.',
    })

    return NextResponse.json(record)
  } catch (error: any) {
    console.error('Stock request error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'ADMIN';
    const filter = isAdmin ? '' : `user = "${user.id}"`;

    const records = await pb.collection('stock_requests').getFullList({
      sort: '-created',
      filter,
      expand: 'product,user'
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Fetch stock requests error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
