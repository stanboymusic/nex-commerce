import { initPocketBase } from "@/lib/pocketbase";
import { NextRequest, NextResponse } from "next/server";

export async function requireAdmin(req: NextRequest) {
  const pb = await initPocketBase(req);
  const user = pb.authStore.model;

  if (!user || user.role !== "ADMIN") {
    // Instead of redirecting in an API helper, we should probably throw or return null
    // But keeping it consistent with the previous implementation's intent
    return null;
  }

  return user;
}
