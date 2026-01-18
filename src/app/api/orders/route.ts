import { initPocketBase } from '@/lib/pocketbase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { items, total, paymentMethod, currency, address, notes } = await req.json();
    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    if (!address || !paymentMethod || !currency) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const isPreorder = items.some((i: any) => i.isPreorder);

    const pbAdmin = pb; // solo usamos PocketBase, admin privileges controlados por rol
    const order = await pbAdmin.collection('orders').create({
      user: user.id,
      total,
      isPreorder,
      paymentMethod,
      currency,
      address,
      notes,
      status: 'PENDING_PAYMENT',
    });

    await Promise.all(items.map(async (item: any) => {
      await pbAdmin.collection('order_items').create({
        order: order.id,
        product: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      });

      if (!item.isPreorder) {
        const product = await pbAdmin.collection('products').getOne(item.id);
        await pbAdmin.collection('products').update(item.id, { stock: Math.max(0, product.stock - item.quantity) });
      }
    }));

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'ADMIN';
    const filter = isAdmin ? '' : `user = "${user.id}"`;

    const records = await pb.collection('orders').getFullList({ sort: '-created', filter, expand: 'order_items(product),user' });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
