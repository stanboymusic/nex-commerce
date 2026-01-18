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

    // 1. Create Order
    let order;
    try {
      order = await pb.collection('orders').create({
        user: user.id,
        total,
        isPreorder,
        paymentMethod,
        currency,
        address,
        notes,
        status: 'PENDING_PAYMENT',
      });
    } catch (orderError: any) {
      console.error('PB Order Creation Error:', orderError.data || orderError.message);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // 2. Create Order Items and Update Stock
    try {
      const adminPb = await import('@/lib/admin').then(m => m.getAdminPocketBase());

      await Promise.all(items.map(async (item: { id: string; name: string; quantity: number; price: number; isPreorder?: boolean }) => {
        // Create order item
        await pb.collection('order_items').create({
          order: order.id,
          product: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        });

        // Update stock if not preorder
        if (!item.isPreorder) {
          try {
            const product = await adminPb.collection('products').getOne(item.id);
            await adminPb.collection('products').update(item.id, {
              stock: Math.max(0, (product.stock || 0) - item.quantity)
            });
            console.log(`Stock updated for product ${item.id}: ${product.stock} -> ${Math.max(0, (product.stock || 0) - item.quantity)}`);
          } catch (stockError) {
            console.warn(`Failed to update stock for product ${item.id}:`, stockError);
          }
        }
      }));
    } catch (itemsError: any) {
      console.error('PB Order Items Creation Error:', itemsError.data || itemsError.message);
      // Even if items fail, the order exists. But usually we want both.
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Order processing error:', error);
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

    const orders = records.map(r => ({
      id: r.id,
      total: r.total,
      status: r.status,
      paymentMethod: r.paymentMethod,
      currency: r.currency,
      address: r.address,
      notes: r.notes,
      isPreorder: r.isPreorder,
      created: r.created, // For nex-admin compatibility
      createdAt: r.created,
      updatedAt: r.updated,
      customerName: r.expand?.user?.name || 'N/A', // For nex-admin compatibility
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
