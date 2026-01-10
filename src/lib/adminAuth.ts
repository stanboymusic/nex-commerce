import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const payload = verifyToken(token);
    if (!payload || payload.role !== "ADMIN") throw new Error("No autorizado");
    return payload;
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
