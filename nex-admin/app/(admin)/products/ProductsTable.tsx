"use client";

import { Edit, Trash2, Package, Calendar } from "lucide-react";

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    categoryName: string;
    isPreorder: boolean;
    estimatedArrivalDate: string;
    image?: string;
}

interface Props {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
}

export default function ProductsTable({ products, onEdit, onDelete }: Props) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 font-bold text-oxford uppercase tracking-wider w-20"></th>
                            <th className="px-6 py-4 font-bold text-oxford uppercase tracking-wider">Producto</th>
                            <th className="px-6 py-4 font-bold text-oxford uppercase tracking-wider">Categoría</th>
                            <th className="px-6 py-4 font-bold text-oxford uppercase tracking-wider">Precio</th>
                            <th className="px-6 py-4 font-bold text-oxford uppercase tracking-wider text-center">Stock</th>
                            <th className="px-6 py-4 font-bold text-oxford uppercase tracking-wider text-center">Preventa</th>
                            <th className="px-6 py-4 font-bold text-oxford uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {p.image ? (
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://nexcommerce.fly.dev'}/api/files/products/${p.id}/${p.image}`}
                                            alt={p.name}
                                            className="w-12 h-12 rounded-lg object-contain bg-gray-50 border border-gray-100"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] text-gray-300">
                                            No img
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-oxford">{p.name}</div>
                                    <div className="text-[10px] text-gray-400 font-mono">{p.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-bold uppercase">
                                        {p.categoryName}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-green-600">
                                    ${p.price?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1 font-bold ${p.stock > 0 ? 'text-gray-700' : 'text-red-500'}`}>
                                        <Package className="w-3 h-3" />
                                        {p.stock}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {p.isPreorder ? (
                                        <div className="flex flex-col items-center">
                                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1">Sí</span>
                                            {p.estimatedArrivalDate && (
                                                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                                                    <Calendar className="w-2.5 h-2.5" />
                                                    {new Date(p.estimatedArrivalDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-[10px] font-bold uppercase">No</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(p)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(p.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
