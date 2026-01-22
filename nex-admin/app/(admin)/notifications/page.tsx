"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import {
    Bell, AlertTriangle, Package, CheckCircle, Info,
    ChevronRight, DollarSign, Clock, Calendar
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsPage() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const [ordersRes, productsRes] = await Promise.all([
                apiClient.get('/orders').catch(() => ({ data: [] })),
                apiClient.get('/products').catch(() => ({ data: [] }))
            ]);

            const orders = ordersRes.data || [];
            const products = productsRes.data || [];

            const gathered: any[] = [];

            // 1. Critical Stock
            products.filter((p: any) => (p.stock || 0) < 5 && !p.isPreorder).forEach((p: any) => {
                gathered.push({
                    id: `stock-${p.id}`,
                    type: 'error',
                    category: 'Inventario',
                    title: `Stock Crítico: ${p.name}`,
                    description: `Quedan solo ${p.stock || 0} unidades disponibles. Considera reponer stock pronto.`,
                    icon: <Package className="w-6 h-6" />,
                    link: '/products'
                });
            });

            // 2. Pending Payments
            orders.filter((o: any) => o.status === 'PAYMENT_REPORTED').forEach((o: any) => {
                gathered.push({
                    id: `order-${o.id}`,
                    type: 'info',
                    category: 'Pagos',
                    title: `Validación de Pago Requerida`,
                    description: `La orden #${o.id.slice(0, 8)} tiene un reporte de pago esperando revisión.`,
                    icon: <DollarSign className="w-6 h-6" />,
                    link: '/orders'
                });
            });

            // 3. Pre-order Arrivals (within 7 days)
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);

            products.filter((p: any) => p.isPreorder && p.estimatedArrival).forEach((p: any) => {
                const arrival = new Date(p.estimatedArrival);
                if (arrival >= today && arrival <= nextWeek) {
                    gathered.push({
                        id: `preorder-${p.id}`,
                        type: 'warning',
                        category: 'Preventa',
                        title: `Llegada Próxima: ${p.name}`,
                        description: `Se estima que este producto llegará el ${arrival.toLocaleDateString()}. Prepárate para los envíos.`,
                        icon: <Calendar className="w-6 h-6" />,
                        link: '/products'
                    });
                }
            });

            setAlerts(gathered);
        } catch (error) {
            console.error("Error fetching alerts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAlerts(); }, []);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-black text-oxford tracking-tight">Alertas de Sistema</h1>
                    <p className="text-text-medium font-medium mt-1">Eventos críticos que requieren tu atención inmediata.</p>
                </div>
                <button
                    onClick={fetchAlerts}
                    className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                >
                    <Bell className={`w-5 h-5 text-gray-400 ${loading ? 'animate-pulse' : ''}`} />
                </button>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-10 h-10 border-4 border-purple/20 border-t-purple rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Analizando sistema...</p>
                    </div>
                ) : alerts.length > 0 ? (
                    <AnimatePresence>
                        {alerts.map((alert, index) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div
                                    onClick={() => window.location.href = alert.link}
                                    className={`group cursor-pointer p-8 rounded-[40px] border-2 transition-all hover:shadow-2xl flex items-center justify-between ${alert.type === 'error' ? 'bg-red-50 border-red-100/50 hover:border-red-200' :
                                            alert.type === 'warning' ? 'bg-amber-50 border-amber-100/50 hover:border-amber-200' :
                                                'bg-blue-50 border-blue-100/50 hover:border-blue-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm ${alert.type === 'error' ? 'bg-white text-red-500' :
                                                alert.type === 'warning' ? 'bg-white text-amber-500' :
                                                    'bg-white text-blue-500'
                                            }`}>
                                            {alert.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${alert.type === 'error' ? 'text-red-400' :
                                                        alert.type === 'warning' ? 'text-amber-400' :
                                                            'text-blue-400'
                                                    }`}>
                                                    {alert.category}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-oxford leading-tight group-hover:text-purple transition-colors">
                                                {alert.title}
                                            </h3>
                                            <p className="text-sm text-text-medium mt-1 font-medium max-w-lg">
                                                {alert.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-purple group-hover:border-purple transition-all">
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[50px] p-24 text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center text-green-500 mx-auto mb-6">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-oxford">Sistema Optimizado</h3>
                        <p className="text-gray-400 font-medium max-w-xs mx-auto mt-2">No se han detectado anomalías o tareas pendientes que requieran tu atención hoy.</p>
                        <button
                            onClick={fetchAlerts}
                            className="mt-8 bg-oxford text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-navy transition-all shadow-xl shadow-oxford/10"
                        >
                            Re-escanear
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

