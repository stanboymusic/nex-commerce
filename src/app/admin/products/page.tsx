import AdminLayout from "@/components/admin/AdminLayout";
import ProductCardAdmin from "@/components/admin/ProductCardAdmin";
import { getAdminPocketBase } from "@/lib/admin";
import { initPocketBaseServer } from "@/lib/pocketbase";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const pbAuth = await initPocketBaseServer();
  
  if (!pbAuth.authStore.model || pbAuth.authStore.model.role !== 'ADMIN') {
    redirect('/');
  }

  const pb = await getAdminPocketBase();
  const records = await pb.collection('products').getFullList({
    sort: '-created',
    expand: 'category'
  });

  const products = records.map(r => ({
    ...r,
    images: r.images?.map((img: string) => ({ id: img, url: pb.files.getUrl(r, img) })) || [],
    createdAt: r.created,
  }));

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-oxford tracking-tight">Products</h1>
          <p className="text-gray-400 font-medium mt-1">Manage catalog, stock, and pre-orders.</p>
        </div>

        <Link 
          href="/admin/products/new" 
          className="flex items-center gap-2 bg-purple text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple/20 hover:scale-105 transition-transform active:scale-95"
        >
          <Plus className="h-5 w-5" />
          New Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        {products.map((product: any) => (
          <ProductCardAdmin key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100 mt-8">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-gray-200" />
          </div>
          <h3 className="text-xl font-bold text-oxford mb-2">No products yet</h3>
          <p className="text-gray-400 max-w-xs mx-auto mb-8">Start by adding your first product to the NexCommerce catalog.</p>
          <Link 
            href="/admin/products/new" 
            className="text-purple font-bold hover:underline"
          >
            Add product now
          </Link>
        </div>
      )}
    </AdminLayout>
  );
}
