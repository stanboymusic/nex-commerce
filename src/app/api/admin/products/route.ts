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

    const created = await pb.collection("products").create(form);
    return NextResponse.json(created);
  } catch (e: any) {
    console.error("[POST /api/admin/products]", e?.data || e?.message || e);
    return NextResponse.json({ error: e?.data?.message || e?.message || "Create failed" }, { status: 500 });
  }
}
