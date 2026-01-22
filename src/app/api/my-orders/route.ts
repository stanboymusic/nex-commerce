import { NextRequest, NextResponse } from "next/server";
import { initPocketBase } from "@/lib/pocketbase";

export async function GET(req: NextRequest) {
  const pb = await initPocketBase(req);
  const user = pb.authStore.model;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await pb.collection("orders").getFullList({
    filter: `user="${user.id}"`,
    sort: "-created",
    expand: "order_items(order)"
  });

  return NextResponse.json(orders);
}