import { Edit, Trash2, Package } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-4 group hover:shadow-lg transition-all">
      <div className="relative aspect-video bg-muted rounded-xl overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0].url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-light">
            <Package className="h-12 w-12" />
          </div>
        )}
        {product.isPreorder && (
          <Badge variant="warning" className="absolute top-3 left-3 shadow-lg">
            Preventa
          </Badge>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-oxford text-lg line-clamp-1 mb-1">{product.name}</h3>
        <div className="flex items-center justify-between">
          <p className="text-xl font-black text-purple">${product.price.toLocaleString()}</p>
          <Badge variant={product.stock > 0 ? 'success' : 'error'}>
            {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin Stock'}
          </Badge>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" className="flex-1" leftIcon={<Edit className="h-4 w-4" />}>
          Editar
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-error hover:bg-error/10 hover:text-error" leftIcon={<Trash2 className="h-4 w-4" />}>
          Borrar
        </Button>
      </div>
    </div>
  );
}
