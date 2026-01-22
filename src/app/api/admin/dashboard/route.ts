import { NextRequest, NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    const pb = await getAdminPocketBase();

    const orders = await pb.collection("orders").getFullList();
    const totalRevenue = orders.reduce((a, o) => a + (o.totalUSD || 0), 0);

    return NextResponse.json({
      totalRevenue,
      totalOrders: orders.length,
      // Add more KPIs as needed
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}