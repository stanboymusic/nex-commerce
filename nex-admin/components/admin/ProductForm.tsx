
"use client";

import { useState } from "react";

export default function ProductForm({ initial = null, onSaved }: any) {
  const editing = !!initial?.id;

  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price || 0);
  const [stock, setStock] = useState(initial?.stock || 0);
  const [isPreorder, setIsPreorder] = useState(initial?.isPreorder || false);
  const [estimatedArrival, setEstimatedArrival] = useState(
    initial?.estimatedArrival ? initial.estimatedArrival.split("T")[0] : ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData();
      form.append("name", name);
      form.append("price", String(price));
      form.append("stock", String(stock));
      form.append("isPreorder", String(isPreorder));

      // Assuming there is a description field too, but sticking to prompt for now.
      // Prompt didn't explicitly ask for description in the form but API sends it. I'll check user prompt 63 again.
      // Step 63 ProductForm doesn't have description input. I will stick to what was asked.

      if (estimatedArrival) form.append("estimatedArrival", new Date(estimatedArrival).toISOString());

      // Single image
      if (file) form.append("image", file);

      // Gallery
      gallery.forEach(f => form.append("images", f));

      const url = editing ? `/api/admin/products/${initial.id}` : `/api/admin/products`;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, { method, body: form });
      if (!res.ok) throw new Error("Failed to save");

      onSaved?.();
    } catch (err) {
      console.error(err);
      alert("Error al guardar producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-bold">{editing ? "Editar Producto" : "Nuevo Producto"}</h3>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del producto"
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Precio (USD)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(Number(e.target.value))}
              placeholder="0.00"
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={e => setStock(Number(e.target.value))}
              placeholder="0"
              required
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="border p-4 rounded bg-gray-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPreorder}
              onChange={e => setIsPreorder(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-medium">Habilitar Preventa</span>
          </label>

          {isPreorder && (
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Fecha estimada de llegada</label>
              <input
                type="date"
                value={estimatedArrival}
                onChange={e => setEstimatedArrival(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Imagen Principal</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Galería</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={e => setGallery(Array.from(e.target.files || []))}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-oxford text-white rounded hover:bg-oxford/90 disabled:opacity-50"
        >
          {loading ? "Guardando..." : (editing ? "Actualizar" : "Crear")}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => onSaved?.()} // Close form logic depends on parent, but sticking to prompt style
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
