'use client'

import { useState, useEffect } from "react";
import ProductCardAdmin from "@/components/admin/ProductCardAdmin";
import { apiClient } from "@/lib/apiClient";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-oxford tracking-tight">Gestión de Productos</h1>
          <p className="text-text-medium font-medium mt-1">Administra tu inventario, precios y estados de preventa.</p>
        </div>

        <Link href="/products/new">
          <Button className="shadow-lg shadow-purple/20" leftIcon={<Plus className="h-5 w-5" />}>
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
          {products.map((product: any) => (
            <ProductCardAdmin key={product.id} product={product} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-border mt-8">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-text-light" />
          </div>
          <h3 className="text-xl font-bold text-oxford mb-2">No hay productos aún</h3>
          <p className="text-text-medium max-w-xs mx-auto mb-8">Comienza agregando tu primer producto al catálogo de NexCommerce.</p>
          <Link href="/products/new">
            <Button variant="ghost" className="text-purple font-bold">
              Agregar producto ahora
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
