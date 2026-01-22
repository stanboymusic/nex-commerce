import { useState, useEffect } from 'react';
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

    const formatLocalDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        // If it's a date-only string (YYYY-MM-DD), append T12:00:00 to avoid TZ shift
        const normalizedDate = dateStr.includes(' ') || dateStr.includes('T') 
            ? dateStr 
            : `${dateStr}T12:00:00`;
        return new Date(normalizedDate).toLocaleDateString();
    };

    useEffect(() => {
        if (isOpen && order) {
            setEstimatedDate(order.estimatedDeliveryDate || '');
            // Auto-trigger confirmation mode if it's pending and has no date
            if (order.status !== 'CONFIRMED' && !order.estimatedDeliveryDate) {
                setIsConfirming(true);
            } else {
                setIsConfirming(false);
            }
        }
    }, [isOpen, order]);

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
            const endpoint = `/orders/${order.id}`;
            console.log(`[OrderDetail] Attempting PATCH to: ${apiClient.defaults.baseURL}${endpoint}`);
            
            await apiClient.post(`/admin/orders/confirm`, {
                orderId: order.id
            });
            
            onUpdate();
            setIsConfirming(false);
            onClose();
        } catch (error: any) {
            console.error("Error confirming order:", error);
            
            let message = "Error desconocido";
            if (error.response) {
                // Server responded with non-2xx
                message = error.response.data?.error || `Status: ${error.response.status}`;
            } else if (error.request) {
                // Request made but no response (Network Error)
                message = `Error de red: No se pudo conectar con el servidor en ${apiClient.defaults.baseURL}. Verifique su conexión o la URL del API.`;
            } else {
                message = error.message;
            }
            
            alert(`No se pudo confirmar la orden: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalles de la Orden #${order.id.slice(-6).toUpperCase()}`} maxWidth="max-w-4xl">
            <div id="order-print-area" className="print-area space-y-8">
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
                            <p className="font-bold">{formatLocalDate(order.created)}</p>
                        </div>
                        {(order.estimatedDeliveryDate || (isConfirming && estimatedDate)) && (
                            <div className="text-right">
                                <p className="text-xs font-black text-text-medium uppercase tracking-widest">Fecha Estimada de Entrega</p>
                                <p className="font-bold text-purple">
                                    {formatLocalDate(order.estimatedDeliveryDate || estimatedDate)}
                                </p>
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
                    {(order.estimatedDeliveryDate || isConfirming) && (
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
                                        {formatLocalDate(order.estimatedDeliveryDate)}
                                    </p>
                                )}
                                {isConfirming && estimatedDate && (
                                    <p className="hidden print:block font-bold text-oxford">
                                        {formatLocalDate(estimatedDate)}
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
                    {order.status !== 'CONFIRMED' && order.status !== 'CANCELLED' && (
                        <div className="flex gap-2 flex-1">
                            <Button
                                onClick={handleConfirmOrder}
                                isLoading={loading}
                                className={`${isConfirming ? 'bg-green-600 hover:bg-green-700' : 'bg-purple hover:bg-purple/90'}`}
                                leftIcon={<CheckCircle className="h-5 w-5" />}
                            >
                                {isConfirming ? 'Confirmar Pago y Entrega' : 'Confirmar Orden'}
                            </Button>
                            <Button
                                onClick={async () => {
                                    if (confirm('¿Seguro que deseas rechazar esta orden?')) {
                                        try {
                                            await apiClient.post('/admin/orders/reject', { orderId: order.id });
                                            onUpdate();
                                            onClose();
                                        } catch (error) {
                                            alert('Error al rechazar la orden');
                                        }
                                    }
                                }}
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                                Rechazar
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Print styles */}
            <style jsx global>{`
                @media print {
                    /* Ocultar todo lo que no sea el área de impresión */
                    body * {
                        visibility: hidden !important;
                    }
                    
                    /* Asegurar que el área de impresión y todos sus hijos sean visibles */
                    #order-print-area,
                    #order-print-area * {
                        visibility: visible !important;
                    }

                    /* Forzar que el área de impresión ocupe toda la página y esté al frente */
                    #order-print-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 40px !important;
                        background: white !important;
                        z-index: 9999999 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Asegurar que el grid se vea bien en impresión */
                    .grid {
                        display: grid !important;
                    }
                    .md\\:grid-cols-2 {
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    }
                    .space-y-8 > :not([hidden]) ~ :not([hidden]) {
                        margin-top: 2rem !important;
                    }

                    /* Ajustes específicos para tablas en impresión */
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    th, td {
                        border-bottom: 1px solid #eee !important;
                    }

                    /* Ocultar elementos marcados como print:hidden */
                    .print\\:hidden {
                        display: none !important;
                    }

                    @page {
                        size: A4;
                        margin: 0;
                    }
                }
            `}</style>
        </Modal>
    );
};
