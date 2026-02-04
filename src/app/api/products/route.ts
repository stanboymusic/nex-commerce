import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function GET() {
  try {
    const pb = await getAdminPocketBase();

    const records = await pb.collection("products").getFullList({
      sort: "-created",
      requestKey: null
    });

    const products = records.map((r: any) => {
      const imageFiles = Array.isArray(r.image)
        ? r.image
        : r.image
          ? [r.image]
          : Array.isArray(r.images)
            ? r.images
            : [];

      const images = imageFiles.map((f: string) => ({
        id: f,
        url: pb.files.getUrl(r, f)
      }));

      return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      price: Number(r.price ?? 0),
      priceUSD: Number(r.priceUSD ?? r.price ?? 0),
      stock: Number(r.stock ?? 0),
      isPreorder: !!r.isPreorder,
      estimatedArrivalDate: r.estimatedArrivalDate ?? null,
      category: r.category ?? null,

      // principal
      image: images[0]?.url || null,

      // images array
      images,
      gallery: images.slice(1).map((img: { id: string; url: string }) => img.url)
    };
    });

    return NextResponse.json(products);
  } catch (e: any) {
    console.error("[GET /api/products] error:", e?.data || e?.message || e);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
