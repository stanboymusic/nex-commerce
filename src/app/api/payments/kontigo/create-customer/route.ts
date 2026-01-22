import { NextRequest, NextResponse } from "next/server";
import { initPocketBase } from "@/lib/pocketbase";
import { kontigoFetch } from "@/lib/kontigo";

export async function POST(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone } = await req.json();

    const data = await kontigoFetch("/customers", {
      name,
      email,
      phone
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Kontigo create customer error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}