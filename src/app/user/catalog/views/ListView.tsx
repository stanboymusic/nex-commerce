import { Product } from "@/types/product";
import ListRow from "../components/ListRow";

export default function ListView({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg font-medium">No hay productos disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 px-4">
      {/* Table-like Header for Desktop */}
      <div className="hidden md:grid grid-cols-12 gap-4 py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
        <div className="col-span-6">Producto</div>
        <div className="col-span-2 text-center">Estado</div>
        <div className="col-span-2 text-right">Precio</div>
        <div className="col-span-2 text-right">Acción</div>
      </div>
      
      {products.map((p) => (
        <ListRow key={p.id} product={p} />
      ))}
    </div>
  );
}
