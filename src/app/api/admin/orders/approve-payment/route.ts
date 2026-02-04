import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";
import { getDefaultStatusMessage, recordOrderStatusEvent } from "@/lib/order-status-events";

export async function POST(req: Request) {
    try {
        const { orderId } = await req.json();
        const pb = await getAdminPocketBase();

        const existing = await pb.collection("orders").getOne(orderId);
        const updated = await pb.collection("orders").update(orderId, {
            paymentStatus: "VERIFIED",
            status: "CONFIRMED"
        });

        if (existing.status !== "CONFIRMED") {
          await recordOrderStatusEvent({
            pb,
            orderId,
            status: "CONFIRMED",
            message: getDefaultStatusMessage("CONFIRMED"),
            visibleToUser: true,
            actorRole: 'ADMIN',
            notifyUserId: existing.user
          });
        }

        return NextResponse.json({ success: true, order: updated });
    } catch (error) {
        console.error("Error approving payment:", error);
        return NextResponse.json({ error: "Failed to approve payment" }, { status: 500 });
    }
}
