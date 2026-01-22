
import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function POST(req: Request) {
    try {
        const pb = await getAdminPocketBase();
        const form = await req.formData();

        const records = await pb.collection("payment_settings").getList(1, 1);

        if (records.items.length) {
            await pb.collection("payment_settings").update(records.items[0].id, form);
        } else {
            await pb.collection("payment_settings").create(form);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating payment settings:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
