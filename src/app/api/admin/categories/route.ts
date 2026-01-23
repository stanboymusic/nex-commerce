import { NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/admin";

export async function GET() {
  const pb = await getAdminPocketBase();
  const records = await pb.collection("categories").getFullList({
    sort: "name",
    requestKey: null
  });

  return NextResponse.json(records.map((r: any) => ({ id: r.id, name: r.name })));
}

export async function POST(req: Request) {
  try {
    const pb = await getAdminPocketBase();
    const body = await req.json();
    if (!body?.name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

    const created = await pb.collection("categories").create({ name: body.name });
    return NextResponse.json({ id: created.id, name: created.name });
  } catch (e: any) {
    console.error("[POST /api/admin/categories] error:", e?.data || e?.message || e);
    return NextResponse.json({ error: e?.data?.message || e?.message || "Failed to create category" }, { status: 500 });
  }
}
