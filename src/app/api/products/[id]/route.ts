import { NextRequest, NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await initPocketBase(req);

    // Attempt to fetch by ID or Slug
    try {
      let record;
      try {
        // First try as ID
        record = await pb.collection('products').getOne(id, {
          expand: 'category'
        });
      } catch (e) {
        // If not ID, try as Slug
        record = await pb.collection('products').getFirstListItem(`slug="${id}"`, {
          expand: 'category'
        });
      }

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
        estimatedArrivalDate: record.estimatedArrivalDate,
        images: images,
        categoryId: record.category,
        category: record.expand?.category, // Include expanded category if needed
        createdAt: record.created,
        updatedAt: record.updated,
      };

      return NextResponse.json(product)
    } catch (error) {
      const err = error as { status?: number };
      if (err.status === 404) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      throw error;
    }

  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await pb.collection('products').getOne(id);
    const isAdmin = user.role === 'ADMIN';

    if (!isAdmin && existing.user !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const updated = await pb.collection('products').update(id, data);

    return NextResponse.json(updated);
  } catch (error) {
    const err = error as { message?: string };
    console.error("Error updating product:", err);
    return NextResponse.json({ error: err.message || 'Error al actualizar el producto' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await pb.collection('products').getOne(id);
    const isAdmin = user.role === 'ADMIN';

    if (!isAdmin && existing.user !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pb.collection('products').delete(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const err = error as { message?: string };
    console.error("Error deleting product:", err);
    return NextResponse.json({ error: err.message || 'Error al eliminar el producto' }, { status: 500 })
  }
}
