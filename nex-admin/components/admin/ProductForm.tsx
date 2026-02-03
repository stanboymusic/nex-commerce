
"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";

export default function ProductForm({ initial = null, onSaved }: any) {
  const editing = !!initial?.id;
  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "image/gif",
    "image/webp"
  ]);
  const mimeByExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    svg: "image/svg+xml",
    gif: "image/gif",
    webp: "image/webp"
  };
  const normalizeImageFile = (file: File) => {
    if (allowedMimeTypes.has(file.type)) return file;
    const parts = file.name.split(".");
    const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
    const inferred = mimeByExt[ext];
    if (inferred && allowedMimeTypes.has(inferred)) {
      return new File([file], file.name, { type: inferred });
    }
    return null;
  };

  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price || 0);
  const [stock, setStock] = useState(initial?.stock || 0);
  const [categoryId, setCategoryId] = useState(initial?.category || "");
  const [isPreorder, setIsPreorder] = useState(initial?.isPreorder || false);
  const [estimatedArrivalDate, setEstimatedArrivalDate] = useState(
    initial?.estimatedArrivalDate ? initial.estimatedArrivalDate.split("T")[0] : ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    // Fetch categories
    apiClient.get("/admin/categories")
      .then(res => setCategories(res.data || []))
      .catch(err => console.error("Error loading categories", err));
  }, []);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedMain = file ? normalizeImageFile(file) : null;
      if (file && !normalizedMain) {
        alert("Imagen principal inválida. Usa JPG, PNG, SVG, GIF o WebP.");
        setLoading(false);
        return;
      }
      const normalizedGallery = gallery.map(normalizeImageFile);
      if (normalizedGallery.some((f) => !f)) {
        alert("Hay imágenes de galería inválidas. Usa JPG, PNG, SVG, GIF o WebP.");
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.append("name", name);
      form.append("price", String(price));
      form.append("stock", String(stock));
      form.append("category", categoryId);
      form.append("isPreorder", String(isPreorder));

      // Assuming there is a description field too, but sticking to prompt for now.
      // Prompt didn't explicitly ask for description in the form but API sends it. I'll check user prompt 63 again.
      // Step 63 ProductForm doesn't have description input. I will stick to what was asked.

      if (estimatedArrivalDate) form.append("estimatedArrivalDate", estimatedArrivalDate);

      // Single image
      if (normalizedMain) form.append("image", normalizedMain);

      // Gallery
      normalizedGallery.forEach((f) => {
        if (f) form.append("images", f);
      });

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

        <div>
          <label className="block text-sm font-medium mb-1">Categoría</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            required
            className="w-full p-2 border rounded bg-white"
          >
            <option value="">Seleccionar categoría...</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
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
                value={estimatedArrivalDate}
                onChange={e => setEstimatedArrivalDate(e.target.value)}
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
