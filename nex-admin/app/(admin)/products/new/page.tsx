'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { ArrowLeft, Save, Plus, X, Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "",
        isPreorder: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/products', {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock)
            });
            router.push('/products');
        } catch (error) {
            console.error("Error creating product:", error);
        } finally {
            setLoading(false);
        }
    };

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

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-oxford">
                <div className="lg:col-span-2 space-y-8">
                    <Card title="Información General">
                        <div className="space-y-6">
                            <Input
                                label="Nombre del Producto"
                                placeholder="Ej. NexPhone Ultra XL"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-text-dark mb-1">Descripción</label>
                                <textarea
                                    className="w-full rounded-lg border border-border bg-white px-4 py-2 text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple min-h-[150px]"
                                    placeholder="Describe las características principales..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </Card>

                    <Card title="Imágenes del Producto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-text-light hover:border-purple hover:text-purple cursor-pointer transition-all">
                                <Upload className="h-8 w-8 mb-2" />
                                <span className="text-xs font-bold">Subir</span>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card title="Precio y Stock">
                        <div className="space-y-6">
                            <Input
                                label="Precio ($)"
                                type="number"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                            <Input
                                label="Stock Inicial"
                                type="number"
                                placeholder="0"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                required
                            />
                        </div>
                    </Card>

                    <Card title="Opciones">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="preorder"
                                    className="h-5 w-5 rounded border-border text-purple focus:ring-purple cursor-pointer"
                                    checked={formData.isPreorder}
                                    onChange={(e) => setFormData({ ...formData, isPreorder: e.target.checked })}
                                />
                                <label htmlFor="preorder" className="text-sm font-bold cursor-pointer">Es una preventa</label>
                            </div>
                        </div>
                    </Card>

                    <div className="flex flex-col gap-3">
                        <Button type="submit" isLoading={loading} className="w-full text-lg py-6" leftIcon={<Save className="h-5 w-5" />}>
                            Guardar Producto
                        </Button>
                        <Link href="/products" className="w-full">
                            <Button variant="ghost" className="w-full">Cancelar</Button>
                        </Link>
                    </div>
                </div>
            </form>
        </>
    );
}
