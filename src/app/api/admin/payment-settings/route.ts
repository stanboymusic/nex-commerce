
import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const pb = await getAdminPocketBase();
    const form = await req.formData();

    // enforce method
    if (!form.get("method")) form.set("method", "KONTIGO");

    const existing = await pb.collection("payment_settings").getList(1, 1, {
      filter: `method="KONTIGO"`,
      requestKey: null
    });

    let saved;
    if (existing.items.length) {
      saved = await pb.collection("payment_settings").update(existing.items[0].id, form);
    } else {
      saved = await pb.collection("payment_settings").create(form);
    }

    return NextResponse.json({ success: true, saved });
  } catch (e: any) {
    console.error("[POST /api/admin/payment-settings]", e?.data || e?.message || e);
    return NextResponse.json({ error: e?.data?.message || e?.message || "Save failed" }, { status: 500 });
  }
}
