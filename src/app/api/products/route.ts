import { getAdminPocketBase, initPocketBase } from '@/lib/pocketbase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const pb = await getAdminPocketBase();

    const records = await pb.collection('products').getFullList({
      sort: '-created',
      expand: 'category'
    });

    const products = records.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      price: r.price,
      stock: r.stock,
      isPreorder: r.isPreorder,
      arrivalDate: r.arrivalDate,
      estimatedDeliveryDate: r.estimatedDeliveryDate,
      images: r.images?.map((img: string) => ({ id: img, url: pb.files.getUrl(r, img) })) || [],
      categoryId: r.category,
      category: r.expand?.category,
      userId: r.user,
      createdAt: r.created,
      updatedAt: r.updated,
    }));

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message || 'Error fetching products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    if (!data.name || !data.price || !data.category)
      return NextResponse.json({ error: 'Missing required fields (name, price, category)' }, { status: 400 });

    const slug = data.slug || data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const record = await pb.collection('products').create({ ...data, slug, user: user.id });

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Error creating product' }, { status: 500 });
  }
}
