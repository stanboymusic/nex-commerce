
"use client";

import { useEffect, useState } from "react";
import ProductForm from "@/components/admin/ProductForm";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/products"); // Reusing public GET as per prompt Step 64? Prompt says fetch("/api/products")
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error("Error loading products", e);
    }
  };

  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("Eliminar producto?")) return;
    try {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      console.error("Error deleting", e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-oxford">Gestión de Productos</h1>
      </div>

      <ProductForm
        initial={editing}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />

      <div className="space-y-3">
        {products.map(p => (
          <div key={p.id} className="bg-white border p-4 rounded-xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            {p.image ? (
              <img src={p.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">No img</div>
            )}

            <div className="flex-1">
              <b className="text-lg text-oxford block">{p.name}</b>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-green-600">${p.price}</span>
                <span className="mx-2 text-gray-300">|</span>
                Stock: {p.stock}
              </div>
              {p.isPreorder && (
                <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  PREVENTA {p.estimatedArrival ? `(${new Date(p.estimatedArrival).toLocaleDateString()})` : "(sin fecha)"}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditing(p)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                Editar
              </button>
              <button
                onClick={() => del(p.id)}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <p className="text-center text-gray-500 py-10">No hay productos registrados.</p>
        )}
      </div>
    </div>
  );
}
