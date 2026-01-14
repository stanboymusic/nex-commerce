import { getAdminPocketBase } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pb = await getAdminPocketBase();
    const records = await pb.collection('products').getFullList({
      sort: '-created',
      requestKey: null
    });

    const products = records.map(record => {
      // Transform images to match expected structure
      const images = record.images ? record.images.map((filename: string) => ({
        id: filename, // Use filename as ID since PB doesn't store separate image IDs
        url: pb.files.getUrl(record, filename)
      })) : [];

      return {
        id: record.id,
        name: record.name,
        slug: record.slug,
        description: record.description,
        price: record.price,
        stock: record.stock,
        isPreorder: record.isPreorder,
        arrivalDate: record.arrivalDate,
        estimatedDeliveryDate: record.estimatedDeliveryDate,
        images: images,
        categoryId: record.category,
        createdAt: record.created,
        updatedAt: record.updated,
      };
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Error fetching products" }, { status: 500 });
  }
}
