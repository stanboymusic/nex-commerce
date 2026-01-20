import { NextRequest, NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function PUT(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    const pb = await getAdminPocketBase();

    await pb.collection("orders").update(id, { status });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("UPDATE_ORDER_STATUS_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
