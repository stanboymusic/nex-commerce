import { NextRequest, NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    const pb = await getAdminPocketBase();

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const orders = await pb.collection("orders").getFullList({
      filter: `created >= "${startOfDay}" && created < "${endOfDay}" && (status = "PAYMENT_REPORTED" || status = "CONFIRMED")`,
      sort: "-created"
    });

    const totalRevenue = orders.reduce((a, o) => a + (o.totalUSD || 0), 0);

    return NextResponse.json({
      date: today.toISOString().split('T')[0],
      totalOrders: orders.length,
      totalRevenue,
      orders: orders.map(o => ({
        id: o.id,
        totalUSD: o.totalUSD,
        status: o.status,
        created: o.created
      }))
    });
  } catch (error: any) {
    console.error('Closure report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}