import { NextRequest, NextResponse } from "next/server";
import { initPocketBase } from "@/lib/pocketbase";
import { getAdminPocketBase } from "@/lib/admin";
import { getDefaultStatusMessage, recordOrderStatusEvent } from "@/lib/order-status-events";
import { getStoreSettingsRecord } from "@/lib/store-settings";
import { addDaysUTC, formatPeriodUTC, getBillingConfigFromEnv, upsertMonthlyInvoice } from "@/lib/billing";

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

    // --- Platform billing guard (monthly fee over verified sales; default 0.4%) ---
    // Blocks new sales if the previous month's invoice is unpaid after the grace window.
    const billingConfig = getBillingConfigFromEnv();
    if (billingConfig.enabled && billingConfig.feePercent > 0 && billingConfig.graceDays >= 0) {
      const now = new Date();
      const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      const graceEndsAt = addDaysUTC(currentMonthStart, billingConfig.graceDays);

      if (now.getTime() >= graceEndsAt.getTime()) {
        const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
        const prevPeriod = formatPeriodUTC(prevMonthStart);
        const { invoice } = await upsertMonthlyInvoice(adminPb, prevPeriod, billingConfig);

        const feeAmount = Number(invoice?.feeAmount || 0);
        const status = String(invoice?.status || "").toUpperCase();
        if (invoice && feeAmount > 0 && status !== "PAID") {
          return NextResponse.json(
            {
              error: `Cuenta bloqueada: comisión NexCommerce (${billingConfig.feePercent}%) pendiente del período ${prevPeriod}.`,
              billing: {
                period: prevPeriod,
                amount: feeAmount,
                currency: invoice?.currency || billingConfig.currency,
                invoiceId: invoice?.id,
              },
            },
            { status: 402 }
          );
        }
      }
    }

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
    // - Base currency for products is USD.
    // - exchangeRate represents: 1 USD = X {currency}
    const currencyCode = String(currency || "COP").toUpperCase();
    let exchangeRate = 1;

    if (currencyCode !== "USD") {
      const fetchRate = async (filter: string) => {
        const r = await adminPb.collection("exchange_rates").getFirstListItem(filter).catch(() => null);
        const rate = Number((r as any)?.rate ?? 0);
        return Number.isFinite(rate) && rate > 0 ? rate : null;
      };

      exchangeRate =
        (await fetchRate(`baseCurrency="USD" && targetCurrency="${currencyCode}" && active=true`)) ??
        (await fetchRate(`targetCurrency="${currencyCode}" && active=true`)) ??
        (await fetchRate(`from="USD" && to="${currencyCode}"`)) ??
        (await fetchRate(`to="${currencyCode}"`)) ??
        (currencyCode === "COP" ? 4000 : 0);

      if (!exchangeRate || exchangeRate <= 0) {
        return NextResponse.json(
          { error: `No hay tasa de cambio activa para USD -> ${currencyCode}.` },
          { status: 400 }
        );
      }
    }

    // VIP discount settings
    const { record: storeSettings } = await getStoreSettingsRecord(adminPb);
    const vipDiscountPercent = Number(storeSettings?.vipDiscountPercent ?? 0);
    const vipEnabled = storeSettings?.vipEnabled !== false;
    const userRecord = await adminPb.collection("users").getOne(user.id).catch(() => null);
    const isVip = !!userRecord?.isVip && vipEnabled && vipDiscountPercent > 0;
    const vipRate = isVip ? Math.min(Math.max(vipDiscountPercent, 0), 90) / 100 : 0;

    const totalLocal = totalUSD * exchangeRate;
    const vipDiscountAmountUSD = vipRate ? totalUSD * vipRate : 0;
    const discountedTotalUSD = totalUSD - vipDiscountAmountUSD;
    const discountedTotalLocal = discountedTotalUSD * exchangeRate;

    // 1.6) Lógica preorder
    const isPreorder = items.some((i: any) => i.isPreorder);

    let estimatedDelivery = null;
    if (isPreorder) {
      estimatedDelivery = null;
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
      total: currency === "USD" ? discountedTotalUSD : discountedTotalLocal,
      totalUSD: discountedTotalUSD,
      totalLocal: discountedTotalLocal,
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
      estimatedDeliveryDate: estimatedDelivery || null,
      vipDiscountPercent: vipRate ? vipDiscountPercent : 0,
      vipDiscountAmount: vipRate ? vipDiscountAmountUSD : 0
    });

    await recordOrderStatusEvent({
      pb: adminPb,
      orderId: order.id,
      status: order.status,
      message: getDefaultStatusMessage(order.status),
      visibleToUser: true,
      actorRole: 'SYSTEM'
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
        const unitPrice = vipRate ? Number(product.price) * (1 - vipRate) : Number(product.price);
        await adminPb.collection("order_items").create({
          order: order.id,
          product: product.id,
          name: product.name,
          quantity,
          price: Number(unitPrice.toFixed(2))
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

    const orderIds = records.map(r => r.id);
    let eventsByOrder: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      const orderFilter = orderIds.map(id => `order = "${id}"`).join(' || ');
      const visibilityFilter = isAdmin ? '' : 'visibleToUser = true';
      const combinedFilter = visibilityFilter
        ? `(${orderFilter}) && ${visibilityFilter}`
        : orderFilter;

      const eventRecords = await pb.collection('order_status_events').getFullList({
        filter: combinedFilter,
        sort: 'created'
      }).catch(() => []);

      eventsByOrder = eventRecords.reduce((acc: Record<string, any[]>, ev: any) => {
        if (!acc[ev.order]) acc[ev.order] = [];
        acc[ev.order].push({
          id: ev.id,
          status: ev.status,
          message: ev.message,
          visibleToUser: ev.visibleToUser,
          createdAt: ev.created,
          actorRole: ev.actorRole,
          actorId: ev.actorId
        });
        return acc;
      }, {});
    }

    const adminPb = await getAdminPocketBase();
    const productCache = new Map<string, any>();

    const orders = [];
    for (const r of records) {
      const rawItems = r.expand?.['order_items(order)'] || [];
      const items = [];

      for (const oi of rawItems) {
        let product = oi.expand?.product;
        if (!product && oi.product) {
          if (productCache.has(oi.product)) {
            product = productCache.get(oi.product);
          } else {
            try {
              const fetched = await adminPb.collection('products').getOne(oi.product);
              productCache.set(oi.product, fetched);
              product = fetched;
            } catch (e) {
              productCache.set(oi.product, null);
            }
          }
        }

        items.push({
          id: oi.id,
          productId: oi.product,
          name: oi.name,
          quantity: oi.quantity,
          price: oi.price,
          product
        });
      }

      orders.push({
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
      binanceTxHash: r.binanceTxHash,
      shippingCost: r.shippingCost,
      vipDiscountPercent: r.vipDiscountPercent,
      vipDiscountAmount: r.vipDiscountAmount,
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
        statusHistory: eventsByOrder[r.id] || [],
        items,
      });
    }

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
