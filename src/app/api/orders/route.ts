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
    const { items, address, notes, currency = "COP", paymentMethod, kontigoReference, binanceTxHash } = body;

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

    // 1.5) Obtener tasa de cambio activa desde EXCHANGE_RATES
    const rateRecord = await adminPb
      .collection("exchange_rates")
      .getFirstListItem('targetCurrency="COP" && active=true')
      .catch(() => ({ rate: 4000 })); // Default

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
      status: paymentMethod === "KONTIGO" || paymentMethod?.startsWith("CASH") || paymentMethod === "BINANCE"
        ? "PAYMENT_REPORTED"
        : "PENDING_PAYMENT",
      paymentStatus: paymentMethod === "KONTIGO" || paymentMethod?.startsWith("CASH") || paymentMethod === "BINANCE"
        ? "REPORTED"
        : "UNPAID",
      paymentReference: paymentMethod === "KONTIGO" ? (kontigoReference || "PENDING") : null,
      binanceTxHash: paymentMethod === "BINANCE" ? (binanceTxHash || null) : null,
      paymentReportedAt: paymentMethod === "KONTIGO" ? new Date().toISOString() : null,
      address,
      notes,
      isPreorder,
      estimatedDeliveryDate: estimatedDelivery || null
    });

    // 4) Crear order_items + 5) Descontar stock
    const itemErrors: Array<{ productId: string; step: string; message: string }> = [];
    for (const item of items) {
      const productId = item.productId || item.id;
      const product = productsMap[productId];
      const quantity = Number(
        item.quantity ?? item.qty ?? item.count ?? item.amount ?? 0
      );

      try {
        await adminPb.collection("order_items").create({
          order: order.id,
          product: product.id,
          name: product.name,
          quantity,
          price: product.price
        });
      } catch (err: any) {
        console.error("ORDER_ITEM_CREATE_ERROR:", err);
        itemErrors.push({
          productId,
          step: "create_order_item",
          message: err?.message || "Failed to create order item"
        });
      }

      // 5) Descontar stock SOLO si no es preventa
      if (!product.isPreorder) {
        const currentStock = Number(product.stock);
        if (!Number.isFinite(currentStock) || !Number.isFinite(quantity)) {
          console.error("STOCK_UPDATE_ERROR: invalid current stock", {
            productId,
            stock: product.stock,
            quantity: item.quantity
          });
          itemErrors.push({
            productId,
            step: "update_stock",
            message: "Invalid current stock or quantity value"
          });
        } else {
          const newStock = Math.max(0, currentStock - quantity);
          if (!Number.isFinite(newStock)) {
            console.error("STOCK_UPDATE_ERROR: invalid computed stock", {
              productId,
              currentStock,
              quantity
            });
            itemErrors.push({
              productId,
              step: "update_stock",
              message: "Invalid computed stock value"
            });
            continue;
          }
          try {
            // Use direct REST call to avoid SDK quirks with numeric zero
            const baseUrl = adminPb.baseUrl || (process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://nexcommerce.fly.dev');
            const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
            const payload = { stock: Number.isFinite(newStock) ? Math.round(newStock) : newStock };
            const resp = await fetch(`${url}/api/collections/products/records/${product.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminPb.authStore.token}`
              },
              body: JSON.stringify(payload)
            });
            if (!resp.ok) {
              const text = await resp.text();
              let parsed: any = null;
              try { parsed = JSON.parse(text); } catch (_) { /* ignore */ }
              // Fallback: include required fields if PB treats stock as blank
              if (parsed?.data?.stock?.code === 'validation_required') {
                const fallbackPayload = {
                  stock: payload.stock,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  category: product.category,
                  user: product.user
                };
                const retry = await fetch(`${url}/api/collections/products/records/${product.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminPb.authStore.token}`
                  },
                  body: JSON.stringify(fallbackPayload)
                });
                if (retry.ok) {
                  continue;
                }
                const retryText = await retry.text();
                throw new Error(retryText || text || `HTTP ${resp.status}`);
              }
              throw new Error(text || `HTTP ${resp.status}`);
            }
          } catch (err: any) {
            console.error("STOCK_UPDATE_ERROR:", err?.message || err);
            itemErrors.push({
              productId,
              step: "update_stock",
              message: err?.message || "Failed to update stock"
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      order: { id: order.id },
      warnings: itemErrors.length ? itemErrors : undefined
    });
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
      totalUSD: r.totalUSD,
      totalLocal: r.totalLocal,
      exchangeRate: r.exchangeRate,
      status: r.status,
      paymentStatus: r.paymentStatus,
      paymentReference: r.paymentReference,
      paymentProof: r.paymentProof,
      paymentReportedAt: r.paymentReportedAt,
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
