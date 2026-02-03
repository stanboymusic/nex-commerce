import { Product } from "@/types/product";
import ProductCard from "@/components/cards/ProductCard";

export default function GridView({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg font-medium">No hay productos disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          id={p.id}
          name={p.name}
          slug={p.slug}
          price={p.price}
          image={typeof p.images?.[0] === 'string' ? p.images[0] : p.images?.[0]?.url}
          stock={p.stock}
          isPreorder={p.isPreorder}
          estimatedArrivalDate={p.estimatedArrivalDate}
        />
      ))}
    </div>
  );
}
