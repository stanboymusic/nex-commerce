
import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const pb = await getAdminPocketBase();
    const form = await req.formData();

    // VALIDACIÓN CRÍTICA
    const hasFile =
      form.get("kontigoQr") instanceof File &&
      (form.get("kontigoQr") as File).size > 0;

    if (!form.get("method")) form.set("method", "KONTIGO");

    const instructions = form.get("kontigoInstructions");
    const hasInstructions =
      typeof instructions === "string" && instructions.trim().length > 0;

    if (!hasFile && !hasInstructions) {
      return NextResponse.json(
        { error: "No data provided" },
        { status: 400 }
      );
    }

    const data = new FormData();
    data.set("method", "KONTIGO");
    if (hasInstructions) data.set("kontigoInstructions", String(instructions));
    if (hasFile) {
      const file = form.get("kontigoQr");
      if (file instanceof File) {
        const name = file.name || "kontigo-qr.png";
        const type = file.type || "image/png";
        const buffer = await file.arrayBuffer();
        const safeFile = new File([buffer], name, { type });
        data.set("kontigoQr", safeFile);
      }
    }

    const existing = await pb
      .collection("payment_settings")
      .getList(1, 1, {
        filter: `method="KONTIGO"`,
        requestKey: null,
      });

    let saved;
    if (existing.items.length) {
      saved = await pb
        .collection("payment_settings")
        .update(existing.items[0].id, data);
    } else {
      saved = await pb
        .collection("payment_settings")
        .create(data);
    }

    return NextResponse.json({ success: true, saved });
  } catch (e: any) {
    console.error("[POST /api/admin/payment-settings]", e?.data || e?.message || e);
    return NextResponse.json(
      { error: e?.data?.message || e?.message || "Save failed" },
      { status: 500 }
    );
  }
}
