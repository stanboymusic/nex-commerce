import { Edit, Trash2, Package } from "lucide-react";
import Image from "next/image";

interface ProductCardAdminProps {
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    isPreorder: boolean;
    images?: { url: string }[];
  };
}

export default function ProductCardAdmin({ product }: ProductCardAdminProps) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4 group hover:shadow-md transition-all">
      <div className="relative aspect-video bg-gray-50 rounded-2xl overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <Image 
            src={product.images[0].url} 
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <Package className="h-12 w-12" />
          </div>
        )}
        {product.isPreorder && (
          <span className="absolute top-3 left-3 bg-purple text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-purple/20">
            Preventa
          </span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-oxford line-clamp-1 mb-1">{product.name}</h3>
        <div className="flex items-center justify-between">
          <p className="text-lg font-black text-purple">${product.price.toLocaleString()}</p>
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${product.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            Stock: {product.stock}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-oxford hover:bg-gray-100 py-2.5 rounded-xl text-xs font-bold transition-colors">
          <Edit className="h-3.5 w-3.5" />
          Editar
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-xl text-xs font-bold transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
          Borrar
        </button>
      </div>
    </div>
  );
}
