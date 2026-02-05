import { NextResponse } from "next/server";
import { getPocketBase } from "@/lib/pocketbase";
import { getAdminPocketBase } from "@/lib/admin";
import { getStoreSettingsRecord } from "@/lib/store-settings";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pb = getPocketBase();

        // Fetch COP rate from exchange_rates
        const rateRecord = await pb.collection("exchange_rates").getFirstListItem('targetCurrency="COP" && active=true').catch(() => null);

        // Fetch Kontigo settings
        const paymentRecord = await pb.collection("payment_settings").getFirstListItem('method="KONTIGO"').catch(() => null);
        // Fetch Binance settings
        const binanceRecord = await pb.collection("payment_settings").getFirstListItem('method="BINANCE"').catch(() => null);
        const adminPb = await getAdminPocketBase();
        const { record: storeSettings } = await getStoreSettingsRecord(adminPb);

        return NextResponse.json({
            usdToCopRate: rateRecord?.rate || 4000,
            kontigoQR: paymentRecord?.kontigoQr
                ? pb.files.getUrl(paymentRecord, paymentRecord.kontigoQr)
                : null,
            kontigoInstructions: paymentRecord?.kontigoInstructions || "Reporta tu pago adjuntando el comprobante.",
            kontigoActive: paymentRecord?.kontigoActive !== false,
            binanceQR: binanceRecord?.binanceQr
                ? pb.files.getUrl(binanceRecord, binanceRecord.binanceQr)
                : null,
            binanceInstructions: binanceRecord?.binanceInstructions || "Escanea el QR, realiza el pago en Binance y reporta el comprobante.",
            binanceActive: binanceRecord?.binanceActive !== false,
            vipDiscountPercent: Number(storeSettings?.vipDiscountPercent ?? 0),
            vipEnabled: storeSettings?.vipEnabled !== false
        });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}
