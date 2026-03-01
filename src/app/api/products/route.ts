import { NextRequest, NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    const pb = await getAdminPocketBase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const safeCategory = category ? category.replace(/"/g, '\\"') : "";

    const records = await pb.collection("products").getFullList({
      sort: "-created",
      requestKey: null,
      filter: safeCategory ? `category="${safeCategory}"` : undefined,
    });

    const mappedProducts = records
      .map((r) => {
      const record = r as Record<string, unknown>;
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
      id: String(record.id ?? ""),
      name: String(record.name ?? ""),
      slug: String(record.slug ?? ""),
      description: typeof record.description === "string" ? record.description : "",
      price: Number(record.price ?? 0),
      priceUSD: Number(record.priceUSD ?? record.price ?? 0),
      stock: Number(record.stock ?? 0),
      isPreorder: !!record.isPreorder,
      estimatedArrivalDate: (record.estimatedArrivalDate as string | null) ?? null,
      category: (record.category as string | null) ?? null,
      active: record.Active !== false,
      createdAt: (record.created as string | null) ?? null,
      updatedAt: (record.updated as string | null) ?? null,

      // principal
      image: images[0]?.url || null,

      // images array
      images,
      gallery: images.slice(1).map((img: { id: string; url: string }) => img.url)
    };
    });

    // Compatibility mode:
    // If the store still has no product explicitly marked as Active=true,
    // we return all products to avoid an empty storefront.
    // Once at least one product is marked as Active=true, only active items are shown (unless includeInactive=true).
    const hasAnyActiveTrue = mappedProducts.some((p) => p.active === true);
    const products = includeInactive
      ? mappedProducts
      : hasAnyActiveTrue
        ? mappedProducts.filter((p) => p.active === true)
        : mappedProducts;

    return NextResponse.json(products);
  } catch (e: unknown) {
    const err = e as { data?: unknown; message?: string };
    console.error("[GET /api/products] error:", err?.data || err?.message || e);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
