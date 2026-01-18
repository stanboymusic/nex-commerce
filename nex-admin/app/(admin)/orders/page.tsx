'use client'

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { ShoppingCart, Search, Filter, Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/orders');
            setOrders(response.data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter((order: any) =>
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PAID':
            case 'COMPLETED': return 'success';
            case 'PENDING': return 'warning';
            case 'CANCELLED': return 'error';
            case 'SHIPPED': return 'info';
            default: return 'neutral';
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-oxford tracking-tight">Órdenes</h1>
                    <p className="text-text-medium font-medium mt-1">Gestiona los pedidos y estados de envío.</p>
                </div>
            </div>

            <Card className="mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <Input
                        placeholder="Buscar por ID o cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search className="h-5 w-5" />}
                        className="flex-1"
                    />
                    <Button variant="outline" leftIcon={<Filter className="h-5 w-5" />}>
                        Filtros
                    </Button>
                </div>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple"></div>
                </div>
            ) : (
                <Card className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-bold text-oxford">ID Orden</th>
                                    <th className="px-6 py-4 text-sm font-bold text-oxford">Cliente</th>
                                    <th className="px-6 py-4 text-sm font-bold text-oxford">Fecha</th>
                                    <th className="px-6 py-4 text-sm font-bold text-oxford">Total</th>
                                    <th className="px-6 py-4 text-sm font-bold text-oxford">Estado</th>
                                    <th className="px-6 py-4 text-sm font-bold text-oxford">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order: any) => (
                                        <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-oxford">#{order.id.slice(-6)}</td>
                                            <td className="px-6 py-4 text-sm text-text-dark">{order.customerName || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-text-medium">
                                                {new Date(order.created).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-oxford">
                                                ${order.total?.toLocaleString() || '0'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={getStatusVariant(order.status)}>
                                                    {order.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    leftIcon={<Eye className="h-4 w-4" />}
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsModalOpen(true);
                                                    }}
                                                >
                                                    Ver detalle
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-text-medium">
                                            No se encontraron órdenes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <OrderDetailModal
                order={selectedOrder}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={fetchOrders}
            />
        </>
    );
}
