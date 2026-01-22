import { NextRequest, NextResponse } from "next/server";
import { initPocketBase } from "@/lib/pocketbase";
import { getAdminPocketBase } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    if (!pb.authStore.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = pb.authStore.model;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { items, address, notes, currency = "COP", paymentMethod } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    const adminPb = await getAdminPocketBase();

    let totalUSD = 0;

    // 1) Validar productos y calcular total base (COP)
    const productsMap: any = {};

    for (const item of items) {
      const productId = item.productId || item.id;
      const product = await adminPb.collection("products").getOne(productId);

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      if (!product.isPreorder && product.stock < item.quantity) {
        return NextResponse.json({ error: `Not enough stock for ${product.name}` }, { status: 400 });
      }

      totalUSD += product.price * item.quantity;
      productsMap[productId] = product;
    }

    // 1.5) Obtener tasa de cambio activa
    const rateRecord = await adminPb
      .collection("exchange_rates")
      .getFirstListItem("active=true");

    const exchangeRate = rateRecord.rate;

    const totalLocal = totalUSD * exchangeRate;

    // 1.6) Lógica preorder
    const isPreorder = items.some((i: any) => i.isPreorder);

    let estimatedDelivery = null;
    if (isPreorder) {
      estimatedDelivery = body.estimatedDelivery || null;
    }

    // 2) Fecha de entrega
    if (!isPreorder) {
      estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    // 3) Crear orden
    const order = await adminPb.collection("orders").create({
      user: user.id,
      currency,
      paymentMethod,
      total: currency === "USD" ? totalUSD : totalLocal,
      totalUSD,
      totalLocal,
      exchangeRate,
      status: "PENDING_PAYMENT",
      address,
      notes,
      isPreorder,
      estimatedDeliveryDate: estimatedDelivery || null
    });

    // 4) Crear order_items
    for (const item of items) {
      const productId = item.productId || item.id;
      const product = productsMap[productId];

      await adminPb.collection("order_items").create({
        order: order.id,
        product: product.id,
        name: product.name,
        quantity: item.quantity,
        price: product.price
      });

      // 5) Descontar stock SOLO si no es preventa
      if (!product.isPreorder) {
        const newStock = Math.max(0, (product.stock || 0) - item.quantity);

        await adminPb.collection("products").update(product.id, {
          stock: newStock
        });
      }
    }

    return NextResponse.json({ success: true, order: { id: order.id } });
  } catch (error: any) {
    console.error("ORDER_ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
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
