import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";
import { getDefaultStatusMessage, recordOrderStatusEvent } from "@/lib/order-status-events";

export async function POST(req: Request) {
    try {
        const { orderId } = await req.json();
        const pb = await getAdminPocketBase();

        const existing = await pb.collection("orders").getOne(orderId);

        const baseUpdate: any = {
          paymentStatus: "VERIFIED",
          status: "CONFIRMED"
        };

        // Best effort: record when the payment was verified (used for monthly billing).
        let updated: any = null;
        try {
          updated = await pb.collection("orders").update(orderId, {
            ...baseUpdate,
            paymentVerifiedAt: new Date().toISOString()
          });
        } catch (err: any) {
          const msg = String(err?.message || "");
          const unknownField =
            !!err?.data?.data?.paymentVerifiedAt ||
            msg.toLowerCase().includes("paymentverifiedat") ||
            msg.toLowerCase().includes("unknown field");

          if (!unknownField) {
            throw err;
          }

          // Field is not yet present in PocketBase schema; fallback to original update.
          updated = await pb.collection("orders").update(orderId, baseUpdate);
        }

        if (existing.status !== "CONFIRMED") {
          await recordOrderStatusEvent({
            pb,
            orderId,
            status: "CONFIRMED",
            message: getDefaultStatusMessage("CONFIRMED"),
            visibleToUser: true,
            actorRole: 'ADMIN'
          });
        }

        return NextResponse.json({ success: true, order: updated });
    } catch (error) {
        console.error("Error approving payment:", error);
        return NextResponse.json({ error: "Failed to approve payment" }, { status: 500 });
    }
}
