import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const pb = await getAdminPocketBase();
    const form = await req.formData();

    // slug auto
    if (!form.get("slug")) {
      const name = String(form.get("name") || "");
      form.set("slug", name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, ""));
    }

    // New products are visible in Nex Users by default unless admin disables them.
    if (!form.has("Active")) {
      form.set("Active", "true");
    }

    const created = await pb.collection("products").create(form);
    return NextResponse.json(created);
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string };
    console.error("[POST /api/admin/products]", err?.data || err?.message || e);
    return NextResponse.json({ error: err?.data?.message || err?.message || "Create failed" }, { status: 500 });
  }
}
