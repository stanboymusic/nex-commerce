'use client'

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import {
    FileText,
    CheckCircle,
    User,
    MapPin,
    Package,
    CreditCard,
    Clock,
    AlertCircle,
    Download
} from 'lucide-react';

interface OrderDetailModalProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export const OrderDetailModal = ({ order, isOpen, onClose, onUpdate }: OrderDetailModalProps) => {
    const [loading, setLoading] = useState(false);

    if (!order) return null;

    const handleConfirmOrder = async () => {
        setLoading(true);
        try {
            await apiClient.patch(`/orders/${order.id}`, { status: 'CONFIRMED' });
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Error confirming order:", error);
            alert("No se pudo confirmar la orden");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalles de la Orden #${order.id.slice(-6).toUpperCase()}`} maxWidth="max-w-4xl">
            <div className="print-area space-y-8">
                {/* Print Header (Only visible when printing) */}
                <div className="hidden print:block mb-8 border-b pb-4">
                    <h1 className="text-3xl font-black text-oxford">NexCommerce - Factura de Pedido</h1>
                    <p className="text-text-medium mt-1">ID Orden: {order.id}</p>
                    <p className="text-text-medium">Fecha: {new Date(order.created).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Customer Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-oxford uppercase tracking-widest flex items-center gap-2">
                            <User className="h-4 w-4 text-purple" /> Cliente
                        </h3>
                        <div className="bg-muted/50 p-4 rounded-2xl border border-border">
                            <p className="font-bold text-oxford">{order.user?.name || order.customerName || 'N/A'}</p>
                            <p className="text-sm text-text-medium">{order.user?.email || 'No disponible'}</p>
                            <p className="text-sm text-text-medium">{order.user?.phone || 'No disponible'}</p>
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-oxford uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-purple" /> Entrega y Notas
                        </h3>
                        <div className="bg-muted/50 p-4 rounded-2xl border border-border">
                            <p className="text-sm font-bold text-oxford">Dirección:</p>
                            <p className="text-sm text-text-medium mb-3">{order.address || 'N/A'}</p>
                            <p className="text-sm font-bold text-oxford">Notas:</p>
                            <p className="text-sm text-text-medium">{order.notes || 'Sin notas adicionales'}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-oxford uppercase tracking-widest flex items-center gap-2">
                        <Package className="h-4 w-4 text-purple" /> Productos
                    </h3>
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-muted/50 text-xs font-black text-text-medium uppercase tracking-tight">
                                <tr>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3 text-center">Cant.</th>
                                    <th className="px-4 py-3 text-right">Precio Unit.</th>
                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {order.items?.map((item: any) => (
                                    <tr key={item.id} className="text-sm">
                                        <td className="px-4 py-3 font-medium text-oxford">
                                            {item.name}
                                            {item.product?.isPreorder && (
                                                <Badge variant="warning" className="ml-2 scale-75 origin-left">PRE-VENTA</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right">${item.price?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-bold text-oxford">${(item.price * item.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-muted/30">
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-right font-bold text-oxford">Total ({order.currency})</td>
                                    <td className="px-4 py-4 text-right font-black text-purple text-lg">${order.total?.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Payment Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-oxford uppercase tracking-widest flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-purple" /> Pago
                        </h3>
                        <div className="flex items-center gap-3">
                            <Badge variant="neutral">{order.paymentMethod}</Badge>
                            <Badge variant="neutral">{order.currency}</Badge>
                            <Badge variant={order.status === 'CONFIRMED' ? 'success' : 'warning'}>
                                {order.status}
                            </Badge>
                        </div>
                    </div>

                    {/* Pre-order warning */}
                    {order.isPreorder && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4">
                            <div className="bg-amber-200 p-2 rounded-xl text-amber-700">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-800">Orden de Pre-venta</p>
                                <p className="text-xs text-amber-700">Este pedido contiene productos que aún no están disponibles para entrega inmediata.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions (Hidden in Print) */}
                <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-border print:hidden">
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="flex-1"
                        leftIcon={<Download className="h-5 w-5" />}
                    >
                        Descargar PDF
                    </Button>
                    {order.status !== 'CONFIRMED' && (
                        <Button
                            onClick={handleConfirmOrder}
                            isLoading={loading}
                            className="flex-1 bg-purple hover:bg-purple/90"
                            leftIcon={<CheckCircle className="h-5 w-5" />}
                        >
                            Confirmar Orden
                        </Button>
                    )}
                </div>
            </div>

            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </Modal>
    );
};
