import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";
import { getDefaultStatusMessage, recordOrderStatusEvent } from "@/lib/order-status-events";

export async function POST(req: Request) {
    try {
        const { orderId } = await req.json();
        const pb = await getAdminPocketBase();

        const existing = await pb.collection("orders").getOne(orderId);
        const verifiedAt = new Date().toISOString();

        const baseUpdate = {
          paymentStatus: "VERIFIED",
          status: "CONFIRMED",
          paymentReportedAt: verifiedAt,
        };

        // Best effort: record when the payment was verified (used for monthly billing).
        let updated: unknown = null;
        try {
          updated = await pb.collection("orders").update(orderId, {
            ...baseUpdate,
            paymentVerifiedAt: verifiedAt
          });
        } catch (err: unknown) {
          const pbErr = err as { data?: { data?: Record<string, unknown> }; message?: string };
          const fieldErrors = pbErr?.data?.data || {};
          const msg = String(pbErr?.message || "");
          const unknownField =
            !!fieldErrors?.paymentVerifiedAt ||
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
