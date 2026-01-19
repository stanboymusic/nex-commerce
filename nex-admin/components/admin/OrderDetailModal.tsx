'use client'

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
    Download,
    Calendar
} from 'lucide-react';

interface OrderDetailModalProps {
    order: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export const OrderDetailModal = ({ order, isOpen, onClose, onUpdate }: OrderDetailModalProps) => {
    const [loading, setLoading] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [estimatedDate, setEstimatedDate] = useState('');

    if (!order) return null;

    const handleConfirmOrder = async () => {
        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }

        if (!estimatedDate) {
            alert("Por favor ingrese una fecha estimada de entrega");
            return;
        }

        setLoading(true);
        try {
            await apiClient.patch(`/orders/${order.id}`, { 
                status: 'CONFIRMED',
                estimatedDeliveryDate: estimatedDate
            });
            onUpdate();
            setIsConfirming(false);
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
                <div className="hidden print:block mb-8 border-b-2 border-oxford pb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-black text-oxford uppercase tracking-tighter">Factura de Pedido</h1>
                            <p className="text-xl font-bold text-purple mt-1">NexCommerce</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-oxford uppercase tracking-widest">ID Orden</p>
                            <p className="text-lg font-bold">#{order.id.toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div>
                            <p className="text-xs font-black text-text-medium uppercase tracking-widest">Fecha de Creación</p>
                            <p className="font-bold">{new Date(order.created).toLocaleString()}</p>
                        </div>
                        {order.estimatedDeliveryDate && (
                            <div className="text-right">
                                <p className="text-xs font-black text-text-medium uppercase tracking-widest">Fecha Estimada de Entrega</p>
                                <p className="font-bold text-purple">{new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>
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
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item: any) => (
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-text-medium italic">
                                            No hay productos registrados en esta orden.
                                        </td>
                                    </tr>
                                )}
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

                    {/* Estimated Delivery Date (Visible in Modal and Print) */}
                    {(order.estimatedDeliveryDate || (isConfirming && estimatedDate)) && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-oxford uppercase tracking-widest flex items-center gap-2">
                                <Clock className="h-4 w-4 text-purple" /> Entrega Estimada
                            </h3>
                            <div className="bg-purple/5 p-4 rounded-2xl border border-purple/20">
                                {isConfirming ? (
                                    <div className="space-y-3 print:hidden">
                                        <p className="text-xs font-bold text-purple uppercase">¿Cuándo sería la fecha estimada de entrega?</p>
                                        <Input
                                            type="date"
                                            value={estimatedDate}
                                            onChange={(e) => setEstimatedDate(e.target.value)}
                                            leftIcon={<Calendar className="h-4 w-4" />}
                                            className="bg-white"
                                        />
                                    </div>
                                ) : (
                                    <p className="font-bold text-oxford">
                                        {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
                                    </p>
                                )}
                                {isConfirming && estimatedDate && (
                                    <p className="hidden print:block font-bold text-oxford">
                                        {new Date(estimatedDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

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
                            className={`flex-1 ${isConfirming ? 'bg-green-600 hover:bg-green-700' : 'bg-purple hover:bg-purple/90'}`}
                            leftIcon={<CheckCircle className="h-5 w-5" />}
                        >
                            {isConfirming ? 'Confirmar Pago y Entrega' : 'Confirmar Orden'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    /* Reset everything */
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                    }
                    
                    /* Hide everything by default */
                    body > * {
                        display: none !important;
                    }

                    /* Show only the print area and its containers if needed, but easier to move it to top level */
                    /* Alternative: position the print-area specifically */
                    .print-area {
                        display: block !important;
                        position: relative !important;
                        visibility: visible !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    /* Ensure parent containers of print-area don't hide it */
                    .print-area,
                    .print-area * {
                        visibility: visible !important;
                        display: block !important;
                    }

                    /* Specific layout fixes for print */
                    .print-area .grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    }
                    
                    .print-area table {
                        display: table !important;
                        width: 100% !important;
                    }

                    .print-area thead { display: table-header-group !important; }
                    .print-area tbody { display: table-row-group !important; }
                    .print-area tr { display: table-row !important; }
                    .print-area td, .print-area th { display: table-cell !important; }

                    /* Hide modal UI elements */
                    .print-hidden, 
                    button,
                    [role="button"],
                    .X {
                        display: none !important;
                    }

                    /* Fix for modal clipping */
                    div[class*="fixed"], 
                    div[class*="absolute"],
                    div[class*="relative"] {
                        position: static !important;
                        overflow: visible !important;
                        max-height: none !important;
                        height: auto !important;
                        width: auto !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: transparent !important;
                        box-shadow: none !important;
                    }

                    /* Force backgrounds */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                }
            `}</style>
        </Modal>
    );
};
