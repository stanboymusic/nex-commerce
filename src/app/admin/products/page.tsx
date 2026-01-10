import AdminLayout from "@/components/admin/AdminLayout";
import ProductCardAdmin from "@/components/admin/ProductCardAdmin";
import prisma from "@/lib/prisma";
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { images: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-oxford tracking-tight">Productos</h1>
          <p className="text-gray-400 font-medium mt-1">Gestiona el catálogo, stock y preventas.</p>
        </div>

        <Link 
          href="/products/new" 
          className="flex items-center gap-2 bg-purple text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple/20 hover:scale-105 transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Nuevo Producto
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCardAdmin key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100 mt-8">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-gray-200" />
          </div>
          <h3 className="text-xl font-bold text-oxford mb-2">No hay productos aún</h3>
          <p className="text-gray-400 max-w-xs mx-auto mb-8">Comienza agregando tu primer producto al catálogo de NexCommerce.</p>
          <Link 
            href="/products/new" 
            className="text-purple font-bold hover:underline"
          >
            Agregar producto ahora
          </Link>
        </div>
      )}
    </AdminLayout>
  );
}
