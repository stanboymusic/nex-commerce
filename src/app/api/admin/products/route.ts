
import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function POST(req: Request) {
  try {
    const pb = await getAdminPocketBase();
    const form = await req.formData();

    // slug autogenerado si no viene
    if (!form.get("slug")) {
      const name = String(form.get("name") || "");
      const slug = name.toLowerCase().trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
      form.set("slug", slug);
    }

    const created = await pb.collection("products").create(form);
    return NextResponse.json({ success: true, product: created });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}