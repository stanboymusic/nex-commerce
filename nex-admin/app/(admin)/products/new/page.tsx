'use client'

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
    return (
        <>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/products" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft className="h-6 w-6 text-oxford" />
                </Link>
                <div>
                    <h1 className="text-4xl font-black text-oxford tracking-tight">Nuevo Producto</h1>
                    <p className="text-text-medium font-medium">Agrega un nuevo artículo a tu catálogo.</p>
                </div>
            </div>

            <ProductForm />
        </>
    );
}
