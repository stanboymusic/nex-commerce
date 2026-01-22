import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function POST(req: Request) {
    try {
        const { orderId } = await req.json();
        const pb = await getAdminPocketBase();

        const updated = await pb.collection("orders").update(orderId, {
            paymentStatus: "VERIFIED",
            status: "CONFIRMED"
        });

        return NextResponse.json({ success: true, order: updated });
    } catch (error) {
        console.error("Error approving payment:", error);
        return NextResponse.json({ error: "Failed to approve payment" }, { status: 500 });
    }
}
