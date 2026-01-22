import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pb = await getAdminPocketBase();

        // Fetch the active settings record
        const record = await pb
            .collection("settings")
            .getFirstListItem("active=true")
            .catch(() => null);

        if (!record) {
            return NextResponse.json({ usdToCopRate: 4000, kontigoQR: null });
        }

        return NextResponse.json({
            usdToCopRate: record.usdToCopRate,
            kontigoQR: record.kontigoQR
                ? `${pb.baseUrl}/api/files/settings/${record.id}/${record.kontigoQR}`
                : null
        });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}
