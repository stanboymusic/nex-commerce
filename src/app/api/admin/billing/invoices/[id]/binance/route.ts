import { NextRequest, NextResponse } from "next/server";
import { initPocketBase } from "@/lib/pocketbase";
import { getAdminPocketBase } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pb = await initPocketBase(req);
    const user = pb.authStore.model as any;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const binanceTxHash =
      (formData.get("binanceTxHash") as string) ||
      (formData.get("txHash") as string) ||
      "";
    const proof = formData.get("paymentProof") as File | null;

    if (!binanceTxHash.trim()) {
      return NextResponse.json({ error: "Missing binanceTxHash" }, { status: 400 });
    }

    const adminPb = await getAdminPocketBase();
    const invoice = await adminPb.collection("billing_invoices").getOne(id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    if (String((invoice as any).status || "").toUpperCase() === "PAID") {
      return NextResponse.json({ success: true, invoice });
    }

    const update = new FormData();
    update.append("paymentMethod", "BINANCE");
    update.append("binanceTxHash", binanceTxHash.trim());
    update.append("status", "PAID");
    if (proof) update.append("paymentProof", proof);

    const updated = await adminPb.collection("billing_invoices").update(id, update);
    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: any) {
    console.error("[POST /api/admin/billing/invoices/:id/binance]", error);
    return NextResponse.json({ error: error.message || "Failed to report Binance payment" }, { status: 500 });
  }
}

