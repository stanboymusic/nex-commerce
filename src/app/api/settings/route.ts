import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pb = await getAdminPocketBase();

        // Fetch COP rate from exchange_rates
        const rateRecord = await pb.collection("exchange_rates").getFirstListItem('targetCurrency="COP" && active=true').catch(() => null);

        // Fetch Kontigo settings
        const paymentRecord = await pb.collection("payment_settings").getFirstListItem('method="KONTIGO"').catch(() => null);

        return NextResponse.json({
            usdToCopRate: rateRecord?.rate || 4000,
            kontigoQR: paymentRecord?.kontigoQr
                ? pb.files.getUrl(paymentRecord, paymentRecord.kontigoQr)
                : null,
            kontigoInstructions: paymentRecord?.kontigoInstructions || "Reporta tu pago adjuntando el comprobante."
        });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}
