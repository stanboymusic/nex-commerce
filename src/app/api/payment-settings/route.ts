
import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pb = await getAdminPocketBase();
        // Use getList(1, 1) to get the single settings record
        const kontigo = await pb.collection("payment_settings").getFirstListItem('method="KONTIGO"').catch(() => null);
        const binance = await pb.collection("payment_settings").getFirstListItem('method="BINANCE"').catch(() => null);

        return NextResponse.json({
            kontigoQr: kontigo?.kontigoQr
                ? pb.files.getUrl(kontigo, kontigo.kontigoQr)
                : null,
            kontigoInstructions: kontigo?.kontigoInstructions || "",
            kontigoActive: kontigo?.kontigoActive !== false,
            binanceQr: binance?.binanceQr
                ? pb.files.getUrl(binance, binance.binanceQr)
                : null,
            binanceInstructions: binance?.binanceInstructions || "",
            binanceActive: binance?.binanceActive !== false
        });
    } catch (error) {
        console.error("Error fetching payment settings:", error);
        return NextResponse.json(null, { status: 500 });
    }
}
