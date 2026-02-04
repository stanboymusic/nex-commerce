
import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const pb = await getAdminPocketBase();
    const form = await req.formData();

    const methodRaw = form.get("method");
    const method = typeof methodRaw === "string" ? methodRaw.toUpperCase() : "KONTIGO";
    if (method !== "KONTIGO" && method !== "BINANCE") {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }

    const isKontigo = method === "KONTIGO";
    const qrField = isKontigo ? "kontigoQr" : "binanceQr";
    const instructionsField = isKontigo ? "kontigoInstructions" : "binanceInstructions";

    // VALIDACIÓN CRÍTICA
    const hasFile =
      form.get(qrField) instanceof File &&
      (form.get(qrField) as File).size > 0;

    if (!form.get("method")) form.set("method", method);

    const instructions = form.get(instructionsField);
    const hasInstructions =
      typeof instructions === "string" && instructions.trim().length > 0;

    if (!hasFile && !hasInstructions) {
      return NextResponse.json(
        { error: "No data provided" },
        { status: 400 }
      );
    }

    const data = new FormData();
    data.set("method", method);
    if (hasInstructions) data.set(instructionsField, String(instructions));
    if (hasFile) {
      const file = form.get(qrField);
      if (file instanceof File) {
        const name = file.name || `${method.toLowerCase()}-qr.png`;
        const type = file.type || "image/png";
        const buffer = await file.arrayBuffer();
        const safeFile = new File([buffer], name, { type });
        data.set(qrField, safeFile);
      }
    }

    const existing = await pb
      .collection("payment_settings")
      .getList(1, 1, {
        filter: `method="${method}"`,
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
