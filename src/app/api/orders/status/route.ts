import { NextRequest, NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";
import { getDefaultStatusMessage, recordOrderStatusEvent } from "@/lib/order-status-events";

export async function PUT(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    const pb = await getAdminPocketBase();

    const existing = await pb.collection("orders").getOne(id);
    await pb.collection("orders").update(id, { status });

    if (status !== existing.status) {
      await recordOrderStatusEvent({
        pb,
        orderId: id,
        status,
        message: getDefaultStatusMessage(status),
        visibleToUser: true,
        actorRole: 'SYSTEM'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("UPDATE_ORDER_STATUS_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
