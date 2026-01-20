"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import ProductForm from "@/components/admin/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
      })
      .catch((err) => {
        console.error("Error fetching product:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple"></div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-oxford">Producto no encontrado</h2>
      <Link href="/products" className="text-purple mt-4 block">Volver a productos</Link>
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/products" className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6 text-oxford" />
        </Link>
        <div>
          <h1 className="text-4xl font-black text-oxford tracking-tight">Editar Producto</h1>
          <p className="text-text-medium font-medium">Actualiza la información de {product.name}.</p>
        </div>
      </div>
      <ProductForm initialData={product} />
    </>
  );
}
