import { NextRequest, NextResponse } from "next/server";
import { initPocketBase } from "@/lib/pocketbase";
import { getAdminPocketBase } from "@/lib/admin";
import { getBillingConfigFromEnv, getBillingOverview } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminPb = await getAdminPocketBase();
    const config = getBillingConfigFromEnv();

    const overview = await getBillingOverview(adminPb, config, new Date());

    // Public info to show payment instructions in NexAdmin.
    const binanceAddress = process.env.BILLING_BINANCE_ADDRESS || "";
    const binanceQrUrl = process.env.BILLING_BINANCE_QR_URL || "";
    const binanceInstructions =
      process.env.BILLING_BINANCE_INSTRUCTIONS ||
      "Realiza el pago por Binance y registra el hash de la transacción.";

    const kontigoEnabled = (process.env.BILLING_KONTIGO_ENABLED ?? "true").toLowerCase() !== "false";
    const binanceEnabled = (process.env.BILLING_BINANCE_ENABLED ?? "true").toLowerCase() !== "false";

    return NextResponse.json({
      ...overview,
      paymentMethods: {
        kontigo: { enabled: kontigoEnabled },
        binance: {
          enabled: binanceEnabled,
          address: binanceAddress,
          qrUrl: binanceQrUrl,
          instructions: binanceInstructions,
        },
      },
    });
  } catch (error: any) {
    console.error("[GET /api/admin/billing]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch billing overview" }, { status: 500 });
  }
}

