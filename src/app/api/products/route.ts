import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function GET() {
  try {
    const pb = await getAdminPocketBase();

    const records = await pb.collection("products").getFullList({
      sort: "-created",
      requestKey: null
    });

    const products = records.map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      priceUSD: r.priceUSD ?? r.price ?? 0,
      stock: r.stock ?? 0,
      isPreorder: !!r.isPreorder,
      preorderArrivalDate: r.preorderArrivalDate ?? null,
      category: r.category ?? null,

      // principal
      image: r.image ? pb.files.getUrl(r, r.image) : null,

      // gallery
      gallery: Array.isArray(r.gallery)
        ? r.gallery.map((f: string) => pb.files.getUrl(r, f))
        : Array.isArray(r.images)
          ? r.images.map((f: string) => pb.files.getUrl(r, f))
          : []
    }));

    return NextResponse.json(products);
  } catch (e: any) {
    console.error("[GET /api/products] error:", e?.data || e?.message || e);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
