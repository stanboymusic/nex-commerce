import { Product } from "@/types/product";

export async function getProducts(): Promise<Product[]> {
  // Use absolute URL for server components if necessary, 
  // but relative works for client-side and many SSR setups depending on config.
  // For Next.js App Router server components, we often fetch directly from Prisma 
  // but if we use a service, we should handle the environment.
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const res = await fetch(`${baseUrl}/api/products`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Error loading products");

  return res.json();
}
