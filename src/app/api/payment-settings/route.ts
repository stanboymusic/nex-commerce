
import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pb = await getAdminPocketBase();
        // Use getList(1, 1) to get the single settings record
        const records = await pb.collection("payment_settings").getList(1, 1);

        if (!records.items.length) {
            return NextResponse.json(null);
        }

        const s = records.items[0];

        return NextResponse.json({
            kontigoQr: s.kontigoQr
                ? pb.files.getUrl(s, s.kontigoQr)
                : null,
            kontigoInstructions: s.kontigoInstructions || ""
        });
    } catch (error) {
        console.error("Error fetching payment settings:", error);
        return NextResponse.json(null, { status: 500 });
    }
}
