
import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category");

    const pb = await getAdminPocketBase();

    let filter = "";
    if (categoryId) {
      filter = `category = "${categoryId}"`;
    }

    const records = await pb.collection("products").getFullList({
      sort: "-created",
      expand: "category",
      filter
    });

    const products = records.map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      price: r.price,
      stock: r.stock,
      isPreorder: r.isPreorder,
      estimatedArrival: r.estimatedArrival || null,
      category: r.expand?.category || null,
      image: r.image ? pb.files.getUrl(r, r.image) : null,
      images: r.images?.length
        ? r.images.map((f: string) => pb.files.getUrl(r, f))
        : []
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
