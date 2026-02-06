import { NextRequest, NextResponse } from "next/server";
import { initPocketBase } from "@/lib/pocketbase";
import { getAdminPocketBase } from "@/lib/admin";
import { kontigoFetch } from "@/lib/kontigo";

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

    const adminPb = await getAdminPocketBase();
    const invoice = await adminPb.collection("billing_invoices").getOne(id);

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (String((invoice as any).status || "").toUpperCase() === "PAID") {
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
    }

    // If we already created a Kontigo payment URL, return it.
    if ((invoice as any).paymentUrl) {
      return NextResponse.json({ paymentUrl: (invoice as any).paymentUrl });
    }

    const amount = Number((invoice as any).feeAmount || 0);
    const currency = String((invoice as any).currency || "USD").toUpperCase();
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid invoice amount" }, { status: 400 });
    }

    const reference = `NEX-FEE-${(invoice as any).period || ""}-${id}`.slice(0, 50);
    const description = `Comision NexCommerce ${(invoice as any).period || ""}`.trim();

    const data = await kontigoFetch("/transfers", {
      reference,
      amount,
      currency,
      description,
    });

    await adminPb.collection("billing_invoices").update(id, {
      paymentMethod: "KONTIGO",
      kontigoTransferId: data?.id || null,
      paymentReference: data?.id || null,
      paymentUrl: data?.paymentUrl || null,
    });

    return NextResponse.json({ paymentUrl: data?.paymentUrl || null, transferId: data?.id || null });
  } catch (error: any) {
    console.error("[POST /api/admin/billing/invoices/:id/kontigo]", error);
    return NextResponse.json({ error: error.message || "Failed to create Kontigo payment" }, { status: 500 });
  }
}
