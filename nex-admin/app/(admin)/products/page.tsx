"use client";

import { useEffect, useState } from "react";
import { Plus, PackageSearch, RefreshCw } from "lucide-react";
import ProductsTable from "./ProductsTable";
import ProductFormModal from "./ProductFormModal";
import { getProducts, getCategories, saveProduct, deleteProduct } from "./actions";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, cData] = await Promise.all([getProducts(), getCategories()]);
      setProducts(pData);
      setCategories(cData);
    } catch (error) {
      console.error("Failed to load products/categories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.")) return;
    const res = await deleteProduct(id);
    if (res.success) {
      loadData();
    } else {
      alert("Error al eliminar: " + res.error);
    }
  };

  const handleSave = async (formData: FormData) => {
    const res = await saveProduct(formData);
    if (res.success) {
      setShowModal(false);
      loadData();
    } else {
      alert("Error al guardar: " + res.error);
    }
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-oxford">Gestión de Productos</h1>
          <p className="text-sm text-gray-500">Administra el inventario, precios y estados de preventa.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={loadData}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-500"
            title="Refrescar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-purple text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-dark transition-all active:scale-95 shadow-lg shadow-purple/20"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3 border-2 border-dashed rounded-2xl border-gray-100">
            <RefreshCw className="w-10 h-10 animate-spin opacity-20" />
            <p className="font-medium">Cargando catálogo...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-4 border-2 border-dashed rounded-2xl border-gray-100">
            <PackageSearch className="w-12 h-12 opacity-20" />
            <div className="text-center">
              <p className="font-bold text-gray-500">No hay productos aún</p>
              <p className="text-xs">Comienza añadiendo tu primer producto al inventario.</p>
            </div>
            <button
              onClick={handleCreate}
              className="text-purple font-bold text-sm hover:underline"
            >
              + Crear mi primer producto
            </button>
          </div>
        ) : (
          <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
            <ProductsTable
              products={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>

      {showModal && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
