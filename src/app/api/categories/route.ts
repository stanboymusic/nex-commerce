import { getAdminPocketBase } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pb = await getAdminPocketBase();

    const records = await pb.collection("categories").getFullList({
      sort: "name",
      requestKey: null,
    });

    return NextResponse.json(
      records.map((r: any) => ({
        id: r.id,
        name: r.name,
      }))
    );
  } catch (e: any) {
    console.error("[GET /api/categories]", e?.data || e?.message || e);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const pb = await getAdminPocketBase();
    const body = await req.json();

    if (!body?.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const created = await pb.collection("categories").create({
      name: body.name,
    });

    return NextResponse.json({ id: created.id, name: created.name });
  } catch (e: any) {
    console.error("[POST /api/categories]", e?.data || e?.message || e);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
