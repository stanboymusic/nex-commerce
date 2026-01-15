import { getAdminPocketBase } from "@/lib/admin";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET() {
  try {
    const pb = await getAdminPocketBase();
    const records = await pb.collection('products').getFullList({
      sort: '-created',
      requestKey: null
    });

    const products = records.map(record => {
      const images = record.images ? record.images.map((filename: string) => ({
        id: filename,
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

export async function POST(req: NextRequest) {
  try {
    const pb = await getAdminPocketBase();
    const data = await req.json();

    // Basic validation
    if (!data.name || !data.price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate slug from name if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const record = await pb.collection('products').create({
      ...data,
      slug,
    });

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: error?.message || "Error creating product" }, { status: 500 });
  }
}
