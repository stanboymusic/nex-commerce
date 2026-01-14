import { NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'
import { getAdminPocketBase } from '@/lib/admin'

export async function POST(req: Request) {
  try {
    const pb = await initPocketBase();
    let user = pb.authStore.model;

    // Fallback: Check for Bearer token in Authorization header if cookie auth failed
    if (!user) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        pb.authStore.save(token, null); // Save token without model initially
        try {
          // Refresh to validate token and get user model
          // Note: We're refreshing against 'users' collection. 
          // If you have admins creating orders, might need logic adjustment.
          // For now, assume client-side orders are users.
          const authData = await pb.collection('users').authRefresh();
          user = authData.record;
        } catch (_) {
          // Token invalid
          pb.authStore.clear();
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { items, total, paymentMethod, currency, address, notes } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    if (!address || !paymentMethod || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if any item is a preorder
    // We can assume frontend sends isPreorder, or we verify with product fetch
    // distinct from Prisma 'items.some', we trust input or should refetch products
    // Trusting input for now to match logic flow, but ideally refetch
    const isPreorder = items.some((item: any) => item.isPreorder)

    // 1. Create the order
    // 1. Create the order using Admin privileges
    const orderData = {
      user: user.id,
      total,
      isPreorder,
      paymentMethod,
      currency,
      address,
      notes,
      status: 'PENDING_PAYMENT',
      // paymentReportedAt: '', // Removed to avoid Date validation errors with empty strings
    };

    console.log('Attempting to create order with data:', orderData);

    // Initialize Admin Client
    const pbAdmin = await getAdminPocketBase();

    const order = await pbAdmin.collection('orders').create(orderData);
    console.log('Order created successfully:', order.id);
    console.log('Processing items:', JSON.stringify(items, null, 2));

    // 2. Create order items and update stock
    // PocketBase doesn't have ACID transactions over API like Prisma, so we proceed sequentially
    // Use Promise.all for speed, but handle errors carefully

    const itemPromises = items.map(async (item: any) => {
      // Create order item
      try {
        await pbAdmin.collection('order_items').create({
          order: order.id,
          product: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        });
      } catch (err: any) {
        console.error(`Failed to create order item for product ${item.id}:`, JSON.stringify(err?.data || err, null, 2));
        throw err;
      }

      // Update stock if not preorder
      if (!item.isPreorder) {
        try {
          // Fetch current stock to decrement safely (Read-Modify-Write)
          // Note: potential race condition here without locking, acceptable for MVP
          const product = await pbAdmin.collection('products').getOne(item.id);
          const newStock = Math.max(0, product.stock - item.quantity);

          await pbAdmin.collection('products').update(item.id, {
            stock: newStock
          });
        } catch (err) {
          console.error(`Failed to update stock for product ${item.id}`, err);
          // Continue execution, don't fail the order just for stock update failure in MVP
        }
      }
    });

    await Promise.all(itemPromises);

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Order creation error details:', JSON.stringify({
      message: error?.message,
      data: error?.data,
      status: error?.status,
    }, null, 2));

    // Return the actual error message from PocketBase if available
    const errorMessage = error?.data?.message || error?.message || 'Internal server error';
    return NextResponse.json({ error: errorMessage, details: error?.data }, { status: error?.status || 500 })
  }
}

export async function GET(req: Request) {
  try {
    const pb = await initPocketBase();
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Determine filter based on role
    // Assuming role is checked by checking if user is admin
    // For now, let's assume we just filter by user.id unless we explicitly know they are admin
    // If you have a role field:
    // const filter = (user as any).role === 'ADMIN' ? '' : `user = "${user.id}"`;

    // Default to user's orders
    const filter = `user = "${user.id}"`;

    const records = await pb.collection('orders').getFullList({
      sort: '-created',
      filter: filter,
      expand: 'order_items(order).product,user'
      // Note: reverse relation expansion typically requires the field name of the relation in the other collection
      // 'order_items(order)' means expand order_items where 'order' field points to this record
    });

    return NextResponse.json(records)
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
