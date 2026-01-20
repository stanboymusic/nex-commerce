"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { apiClient } from "@/lib/apiClient";

export default function ProductForm({ initialData = null }) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [name, setName] = useState(initialData?.name || "");
  const [price, setPrice] = useState(initialData?.price || 0);
  const [stock, setStock] = useState(initialData?.stock || 0);
  const [isPreorder, setIsPreorder] = useState(initialData?.isPreorder || false);
  const [estimatedArrivalDate, setEstimatedArrivalDate] = useState(
    initialData?.estimatedArrivalDate?.split("T")[0] || ""
  );
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData();
      if (isEditing) form.append("id", initialData.id);

      form.append("name", name);
      form.append("price", price.toString());
      form.append("stock", stock.toString());
      form.append("isPreorder", String(isPreorder));

      if (estimatedArrivalDate)
        form.append("estimatedArrivalDate", new Date(estimatedArrivalDate).toISOString());

      images.forEach((img) => form.append("images", img));

      if (isEditing) {
        await apiClient.put("/products", form);
      } else {
        await apiClient.post("/products", form);
      }

      router.push("/products");
      router.refresh();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-2xl bg-white p-8 rounded-3xl shadow-sm border border-border">
      <div className="space-y-2">
        <label htmlFor="product-name" className="text-sm font-bold text-oxford">Nombre del Producto</label>
        <input
          id="product-name"
          className="w-full p-4 rounded-xl border border-border focus:ring-2 focus:ring-purple/20 outline-none transition-all"
          placeholder="Ej. NexPhone Ultra"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          title="Nombre del producto"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="product-price" className="text-sm font-bold text-oxford">Precio ($)</label>
          <input
            id="product-price"
            type="number"
            className="w-full p-4 rounded-xl border border-border focus:ring-2 focus:ring-purple/20 outline-none transition-all"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
            title="Precio del producto"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="product-stock" className="text-sm font-bold text-oxford">Stock</label>
          <input
            id="product-stock"
            type="number"
            className="w-full p-4 rounded-xl border border-border focus:ring-2 focus:ring-purple/20 outline-none transition-all"
            placeholder="0"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            required
            title="Stock disponible"
          />
        </div>
      </div>

      <div className="p-4 bg-muted/30 rounded-2xl space-y-4">
        <label htmlFor="is-preorder" className="flex items-center gap-3 cursor-pointer">
          <input
            id="is-preorder"
            type="checkbox"
            className="w-5 h-5 rounded border-border text-purple focus:ring-purple"
            checked={isPreorder}
            onChange={(e) => setIsPreorder(e.target.checked)}
            title="Es una preventa"
          />
          <span className="font-bold text-oxford">Este producto es una preventa</span>
        </label>

        {isPreorder && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label htmlFor="arrival-date" className="text-sm font-bold text-oxford">Fecha Estimada de Llegada</label>
            <input
              id="arrival-date"
              type="date"
              className="w-full p-4 rounded-xl border border-border focus:ring-2 focus:ring-purple/20 outline-none transition-all"
              value={estimatedArrivalDate}
              onChange={(e) => setEstimatedArrivalDate(e.target.value)}
              title="Fecha estimada de llegada"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="product-images" className="text-sm font-bold text-oxford">Imágenes</label>
        <input
          id="product-images"
          type="file"
          multiple
          accept="image/*"
          className="w-full p-4 rounded-xl border border-dashed border-border hover:border-purple transition-all cursor-pointer"
          onChange={(e) => e.target.files && setImages(Array.from(e.target.files))}
          title="Seleccionar imágenes"
        />
        <p className="text-xs text-text-light">Puedes seleccionar varios archivos a la vez.</p>
      </div>

      <button 
        disabled={loading} 
        className="w-full bg-purple text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple/20"
      >
        {loading ? "Procesando..." : isEditing ? "Actualizar Producto" : "Crear Producto"}
      </button>
    </form>
  );
}
