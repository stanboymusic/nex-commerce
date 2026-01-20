import { NextRequest, NextResponse } from "next/server";
import { initPocketBase, getAdminPocketBase } from "@/lib/pocketbase";

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
      estimatedArrivalDate: r.estimatedArrivalDate,
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
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const name = formData.get("name") as string;

    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }

    if (!formData.has("slug")) {
      const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
      formData.set("slug", slug);
    }

    const record = await pb.collection("products").create(formData);
    return NextResponse.json(record);
  } catch (err: any) {
    console.error("CREATE_PRODUCT_ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const id = formData.get("id") as string;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const record = await pb.collection("products").update(id, formData);
    return NextResponse.json(record);
  } catch (err: any) {
    console.error("UPDATE_PRODUCT_ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await pb.collection("products").delete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE_PRODUCT_ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
