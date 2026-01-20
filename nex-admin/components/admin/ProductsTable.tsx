"use client";

import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: { url: string }[];
}

interface ProductsTableProps {
  products: Product[];
  onReload: () => void;
}

export default function ProductsTable({ products, onReload }: ProductsTableProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar producto?")) return;
    try {
      await apiClient.delete(`/products?id=${id}`);
      onReload();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error al eliminar el producto");
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-3xl shadow-sm border border-border">
      <table className="w-full text-left">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-6 py-4 font-bold text-oxford">Imagen</th>
            <th className="px-6 py-4 font-bold text-oxford">Nombre</th>
            <th className="px-6 py-4 font-bold text-oxford">Precio</th>
            <th className="px-6 py-4 font-bold text-oxford">Stock</th>
            <th className="px-6 py-4 font-bold text-oxford text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-6 py-4">
                {p.images?.length > 0 ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border">
                    <Image
                      src={p.images[0].url}
                      alt={p.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-text-light text-[10px] font-bold">
                    N/A
                  </div>
                )}
              </td>
              <td className="px-6 py-4 font-medium text-oxford">{p.name}</td>
              <td className="px-6 py-4 font-bold text-purple">${p.price.toLocaleString()}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {p.stock}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end gap-3">
                  <Link 
                    href={`/products/${p.id}/edit`}
                    className="p-2 hover:bg-purple/10 text-purple rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
