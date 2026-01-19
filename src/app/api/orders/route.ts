import { initPocketBase } from '@/lib/pocketbase';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminPocketBase } from '@/lib/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Array para almacenar funciones de reversión (rollback)
  const rollbacks: (() => Promise<void>)[] = [];

  try {
    // 1. Verificar sesión del usuario
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) {
      console.error('[OrdersAPI] Unauthorized access attempt. Model is null.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[OrdersAPI] User authorized:', (user as any).id);

    // 2. Obtener datos y validar
    const body = await req.json();
    const { items, total, paymentMethod, currency, address, notes } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!address || !paymentMethod || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isPreorder = items.some((i: { isPreorder?: boolean }) => i.isPreorder);

    // 3. Obtener cliente ADMIN
    const adminPb = await getAdminPocketBase();

    // 4. Crear la orden (con admin para evitar fallos de permisos)
    const order = await adminPb.collection('orders').create({
      user: (user as any).id,
      total,
      isPreorder,
      paymentMethod,
      currency,
      address,
      notes,
      status: 'PENDING_PAYMENT',
    });

    // Registrar rollback para la orden
    rollbacks.push(async () => {
      await adminPb.collection('orders').delete(order.id);
      console.log(`Rollback: Orden ${order.id} eliminada`);
    });

    // 5. Crear items y actualizar stock de forma "transaccional"
    for (const item of items) {
      // Validar stock antes de crear nada si no es preorder
      if (!item.isPreorder) {
        const product = await adminPb.collection('products').getOne(item.id);
        if ((product.stock || 0) < item.quantity) {
          throw new Error(`Stock insuficiente para el producto: ${item.name}`);
        }

        // Actualizar stock
        const oldStock = product.stock || 0;
        await adminPb.collection('products').update(item.id, {
          stock: oldStock - item.quantity,
        });

        // Registrar rollback para el stock
        rollbacks.push(async () => {
          await adminPb.collection('products').update(item.id, {
            stock: oldStock,
          });
          console.log(`Rollback: Stock de ${item.id} restaurado a ${oldStock}`);
        });
      }

      // Crear order item
      const orderItem = await adminPb.collection('order_items').create({
        order: order.id,
        product: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      });

      // Registrar rollback para el item
      rollbacks.push(async () => {
        await adminPb.collection('order_items').delete(orderItem.id);
        console.log(`Rollback: Item ${orderItem.id} eliminado`);
      });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Order transaction error, starting rollback:', error.message);

    // Ejecutar todos los rollbacks en orden inverso
    for (let i = rollbacks.length - 1; i >= 0; i--) {
      try {
        await rollbacks[i]();
      } catch (rollbackError) {
        console.error('Critical: Rollback operation failed:', rollbackError);
      }
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = (user as any).role === 'ADMIN';
    const filter = isAdmin ? '' : `user = "${(user as any).id}"`;

    const records = await pb.collection('orders').getFullList({
      sort: '-created',
      filter,
      expand: 'order_items(order).product,user',
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
      estimatedDeliveryDate: r.estimatedDeliveryDate,
      created: r.created,
      createdAt: r.created,
      updatedAt: r.updated,
      customerName: r.expand?.user?.name || 'N/A',
      user: r.expand?.user
        ? {
          id: r.expand.user.id,
          name: r.expand.user.name,
          email: r.expand.user.email,
          phone: r.expand.user.phone,
        }
        : null,
      items:
        r.expand?.['order_items(order)']?.map((oi: any) => ({
          id: oi.id,
          productId: oi.product,
          name: oi.name,
          quantity: oi.quantity,
          price: oi.price,
          product: oi.expand?.product,
        })) || [],
    }));

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
