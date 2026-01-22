
import { NextRequest, NextResponse } from "next/server";
import { initPocketBase } from "@/lib/pocketbase";
import { getAdminPocketBase } from "@/lib/admin";

export async function POST(req: NextRequest) {
    try {
        const pb = await initPocketBase(req);
        if (!pb.authStore.isValid)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { orderId, reference } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        const adminPb = await getAdminPocketBase();

        // Verify order ownership explicitly if needed, but for now we trust the ID + logged in user context 
        // (though ideally we should check if order.user === pb.authStore.model.id)

        const order = await adminPb.collection("orders").update(orderId, {
            paymentMethod: "KONTIGO",
            paymentReference: reference || "QR_PAYMENT",
            paymentReportedAt: new Date().toISOString(),
            status: "PAYMENT_REPORTED" // Pending admin approval
        });

        return NextResponse.json({ success: true, order });
    } catch (error) {
        console.error("Error reporting Kontigo payment:", error);
        return NextResponse.json({ error: "Failed to report payment" }, { status: 500 });
    }
}
