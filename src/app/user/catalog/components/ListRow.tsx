"use client";

import { Product } from "@/types/product";
import { useCartStore } from "@/store/cart.store";
import { ShoppingCart, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ListRow({ product }: { product: Product }) {
  const { addItem } = useCartStore();
  const image = typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: image || '',
      stock: product.stock,
      isPreorder: product.isPreorder,
      quantity: 1
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-6 px-4 items-center hover:bg-muted/30 transition-colors group">
      {/* Product Info */}
      <div className="col-span-1 md:col-span-6 flex items-center gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 bg-muted rounded-lg overflow-hidden border border-gray-100">
          {image ? (
            <Image 
              src={image} 
              alt={product.name} 
              fill 
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">
              N/A
            </div>
          )}
        </div>
        <div>
          <Link href={`/product/${product.slug}`} className="font-bold text-oxford hover:text-purple transition-colors block">
            {product.name}
          </Link>
          <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">{product.description}</p>
        </div>
      </div>

      {/* Status */}
      <div className="col-span-1 md:col-span-2 flex justify-center">
        {product.isPreorder ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple bg-purple/10 px-2 py-1 rounded-full uppercase">
            <Info className="w-3 h-3" />
            Preventa
          </span>
        ) : (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
            product.stock > 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
          }`}>
            {product.stock > 0 ? 'En Stock' : 'Agotado'}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="col-span-1 md:col-span-2 text-right">
        <span className="text-lg font-black text-oxford">
          ${product.price.toLocaleString()}
        </span>
      </div>

      {/* Actions */}
      <div className="col-span-1 md:col-span-2 flex justify-end">
        <button 
          onClick={handleAddToCart}
          disabled={product.stock === 0 && !product.isPreorder}
          className="bg-oxford text-white p-3 rounded-xl hover:bg-navy disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm md:opacity-0 group-hover:opacity-100 focus:opacity-100"
          title={product.isPreorder ? "Reservar" : "Añadir al carrito"}
          aria-label={product.isPreorder ? "Reservar producto" : "Añadir al carrito"}
        >
          <ShoppingCart className="h-5 h-5" />
        </button>
      </div>
    </div>
  );
}
