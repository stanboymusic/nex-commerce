import { Product } from "@/types/product";
import { headers } from "next/headers";

function normalizeBaseUrl(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw}`.replace(/\/$/, "");
}

async function resolveApiBaseUrl() {
  const envBase =
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeBaseUrl(process.env.APP_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.SITE_URL) ||
    normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeBaseUrl(process.env.VERCEL_URL);

  if (envBase) return envBase;

  // Fallback for SSR when no public env URL is configured.
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) {
    throw new Error("Missing host header while resolving API base URL");
  }
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function getProducts(): Promise<Product[]> {
  const url =
    typeof window === "undefined"
      ? `${await resolveApiBaseUrl()}/api/products`
      : "/api/products";

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Error loading products");

  return res.json();
}
