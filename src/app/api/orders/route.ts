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

    const isPreorder = items.some((i: { isPreorder?: boolean }) => i.isPreorder);

    const order = await pb.collection('orders').create({
      user: user.id,
      total,
      isPreorder,
      paymentMethod,
      currency,
      address,
      notes,
      status: 'PENDING_PAYMENT',
    });

    await Promise.all(items.map(async (item: { id: string; name: string; quantity: number; price: number; isPreorder?: boolean }) => {
      await pb.collection('order_items').create({
        order: order.id,
        product: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      });

      if (!item.isPreorder) {
        const product = await pb.collection('products').getOne(item.id);
        await pb.collection('products').update(item.id, { stock: Math.max(0, product.stock - item.quantity) });
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

    const records = await pb.collection('orders').getFullList({ 
        sort: '-created', 
        filter, 
        expand: 'order_items(order).product,user' 
    });

    // Map to stable interface
    const orders = records.map(r => ({
      id: r.id,
      total: r.total,
      status: r.status,
      paymentMethod: r.paymentMethod,
      currency: r.currency,
      address: r.address,
      notes: r.notes,
      isPreorder: r.isPreorder,
      createdAt: r.created,
      updatedAt: r.updated,
      user: r.expand?.user ? {
        id: r.expand.user.id,
        name: r.expand.user.name,
        email: r.expand.user.email,
        phone: r.expand.user.phone
      } : null,
      items: r.expand?.['order_items(order)']?.map((oi: any) => ({
        id: oi.id,
        productId: oi.product,
        name: oi.name,
        quantity: oi.quantity,
        price: oi.price,
        product: oi.expand?.product
      })) || []
    }));

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
