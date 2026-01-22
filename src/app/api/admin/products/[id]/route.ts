```typescript

import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pb = await getAdminPocketBase();
    const form = await req.formData();

    // Slug generation fallback if name changes (optional, usually slug shouldn't change, but let's stick to simple update)
    if (form.has("name") && !form.has("slug")) {
      // We generally don't update slug automatically on edit to preserve SEO, 
      // unless explicitly requested. Skipping auto-slug for PUT.
    }

    const updated = await pb.collection("products").update(id, form);
    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pb = await getAdminPocketBase();
    await pb.collection("products").delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
```