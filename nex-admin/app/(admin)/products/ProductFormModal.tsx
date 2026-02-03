"use client";

import { useState, useEffect } from "react";
import { X, Upload, Save, Package } from "lucide-react";

interface Props {
    product?: any;
    categories: any[];
    onSave: (formData: FormData) => void;
    onClose: () => void;
}

export default function ProductFormModal({ product, categories, onSave, onClose }: Props) {
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

    const [form, setForm] = useState({
        name: product?.name || "",
        description: product?.description || "",
        price: product?.price || 0,
        stock: product?.stock || 0,
        category: product?.category || "",
        isPreorder: product?.isPreorder || false,
        estimatedArrivalDate: product?.estimatedArrivalDate ? new Date(product.estimatedArrivalDate).toISOString().split('T')[0] : "",
    });

    const [imagePreview, setImagePreview] = useState<string | null>(
        product?.image ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://nexcommerce.fly.dev'}/api/files/products/${product.id}/${product.image}` : null
    );
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [removeImage, setRemoveImage] = useState(false);

    const [galleryPreviews, setGalleryPreviews] = useState<string[]>(
        product?.images?.map((img: string) => `${process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://nexcommerce.fly.dev'}/api/files/products/${product.id}/${img}`) || []
    );
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const normalizedMain = imageFile ? normalizeImageFile(imageFile) : null;
        if (imageFile && !normalizedMain) {
            alert('Imagen principal inválida. Usa JPG, PNG, SVG, GIF o WebP.');
            return;
        }
        const normalizedGallery = galleryFiles.map(normalizeImageFile);
        if (normalizedGallery.some((file) => !file)) {
            alert('Hay imágenes de galería inválidas. Usa JPG, PNG, SVG, GIF o WebP.');
            return;
        }

        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("description", form.description || "");
        formData.append("price", String(form.price));
        formData.append("stock", String(form.stock));
        formData.append("category", form.category);
        formData.append("isPreorder", String(form.isPreorder));
        if (form.estimatedArrivalDate) {
            formData.append("estimatedArrivalDate", form.estimatedArrivalDate);
        }
        if (product?.id) {
            formData.append("id", product.id);
        }
        if (removeImage) {
            formData.append("image", "");
        } else if (normalizedMain) {
            formData.append("image", normalizedMain);
        }
        normalizedGallery.forEach((file) => {
            if (file) formData.append("images", file);
        });

        // Handle the checkbox specifically as FormData often misses 'false' states
        formData.set("isPreorder", String(form.isPreorder));
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-oxford/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-oxford">
                        {product ? "Editar Producto" : "Nuevo Producto"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Nombre del Producto</label>
                            <input
                                name="name"
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Categoría</label>
                            <select
                                name="category"
                                required
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all"
                            >
                                <option value="">Seleccionar...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Precio (USD)</label>
                            <input
                                type="number"
                                name="price"
                                required
                                step="0.01"
                                value={form.price}
                                onChange={e => setForm({ ...form, price: +e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Stock Actual</label>
                            <input
                                type="number"
                                name="stock"
                                required
                                value={form.stock}
                                onChange={e => setForm({ ...form, stock: +e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Descripción</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all resize-none"
                        />
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isPreorder"
                                checked={form.isPreorder}
                                onChange={e => setForm({ ...form, isPreorder: e.target.checked })}
                                className="w-4 h-4 text-purple rounded border-gray-300 focus:ring-purple"
                            />
                            <label htmlFor="isPreorder" className="text-sm font-bold text-oxford select-none">Este producto es Preventa</label>
                        </div>

                        {form.isPreorder && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-amber-600 uppercase">Fecha de Llegada Estimada</label>
                                <input
                                    type="date"
                                    name="estimatedArrivalDate"
                                    required={form.isPreorder}
                                    value={form.estimatedArrivalDate}
                                    onChange={e => setForm({ ...form, estimatedArrivalDate: e.target.value })}
                                    className="w-full md:w-1/2 px-4 py-2 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                <Upload className="w-3 h-3" /> Imagen Principal
                            </label>

                            {imagePreview && (
                                <div className="relative w-32 h-32 rounded-xl overflow-hidden border bg-gray-50 mb-2">
                                    <img src={imagePreview} className="w-full h-full object-contain" alt="Preview" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImagePreview(null);
                                            setImageFile(null);
                                            setRemoveImage(true);
                                        }}
                                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full hover:bg-white shadow-sm"
                                    >
                                        <X className="w-3 h-3 text-red-500" />
                                    </button>
                                </div>
                            )}

                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setImagePreview(URL.createObjectURL(file));
                                        setImageFile(file);
                                        setRemoveImage(false);
                                    }
                                }}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-purple/10 file:text-purple hover:file:bg-purple/20 transition-all cursor-pointer"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                <Package className="w-3 h-3" /> Galería (Opcional)
                            </label>

                            {galleryPreviews.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {galleryPreviews.map((url, i) => (
                                        <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border bg-gray-50">
                                            <img src={url} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <input
                                type="file"
                                name="images"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setGalleryPreviews(files.map(f => URL.createObjectURL(f)));
                                    setGalleryFiles(files);
                                }}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-all cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2.5 bg-oxford text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-navy transition-all active:scale-95 shadow-lg shadow-oxford/10"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
