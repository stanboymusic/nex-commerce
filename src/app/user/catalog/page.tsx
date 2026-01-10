import { getProducts } from "@/services/product.service";
import CatalogClient from "./CatalogClient";

export default async function CatalogPage() {
  const products = await getProducts();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <CatalogClient products={products} />
    </div>
  );
}
