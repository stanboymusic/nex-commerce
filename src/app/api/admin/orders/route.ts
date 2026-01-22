import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function GET() {
    try {
        const pb = await getAdminPocketBase();

        const orders = await pb.collection("orders").getFullList({
            sort: "-created",
            expand: "user,order_items(order)"
        });

        const mapped = orders.map((o: any) => ({
            id: o.id,
            created: o.created,
            status: o.status,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            currency: o.currency,
            totalUSD: o.totalUSD,
            totalLocal: o.totalLocal,
            exchangeRate: o.exchangeRate,
            address: o.address,
            notes: o.notes,
            paymentReference: o.paymentReference,
            paymentReportedAt: o.paymentReportedAt,
            customer: o.expand?.user
                ? { id: o.expand.user.id, name: o.expand.user.name, email: o.expand.user.email }
                : null,
            items: o.expand?.["order_items(order)"]?.map((it: any) => ({
                id: it.id,
                productId: it.product,
                name: it.name,
                quantity: it.quantity,
                price: it.price
            })) || []
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error("Error fetching admin orders:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
