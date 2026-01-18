import { NextRequest, NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await initPocketBase(req);

    // Attempt to fetch, getOne throws 404 if not found
    try {
      const record = await pb.collection('products').getOne(id, {
        expand: 'category'
      });

      const images = record.images ? record.images.map((filename: string) => ({
        id: filename,
        url: pb.files.getUrl(record, filename)
      })) : [];

      const product = {
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
        category: record.expand?.category, // Include expanded category if needed
        createdAt: record.created,
        updatedAt: record.updated,
      };

      return NextResponse.json(product)
    } catch (err: any) {
      if (err.status === 404) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      throw err;
    }

  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
