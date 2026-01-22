"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import {
  Users, ShoppingBag, Package, DollarSign, TrendingUp,
  AlertCircle, ChevronRight, CheckCircle
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/store/admin.store";

export default function DashboardPage() {
  const { setAdmin, token: storeToken } = useAdminStore();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    revenue: 0,
    lowStockCount: 0
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [usersRes, ordersRes, productsRes] = await Promise.all([
        apiClient.get('/users/count').catch(() => ({ data: { count: 0 } })),
        apiClient.get('/orders').catch(() => ({ data: [] })),
        apiClient.get('/products').catch(() => ({ data: [] }))
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];

      // Calculate revenue in USD (base)
      const revenue = orders.reduce((sum: number, o: any) => sum + (o.status !== 'CANCELLED' && o.status !== 'REJECTED' ? (o.totalUSD || 0) : 0), 0);

      const lowStockProducts = products.filter((p: any) => (p.stock || 0) < 5 && !p.isPreorder);
      const pendingPayments = orders.filter((o: any) => o.status === 'PAYMENT_REPORTED');

      setMetrics({
        totalUsers: usersRes.data.count || 0,
        totalOrders: orders.length,
        totalProducts: products.length,
        revenue,
        lowStockCount: lowStockProducts.length
      });

      // Build system alerts
      const systemAlerts = [
        ...lowStockProducts.map((p: any) => ({
          id: `stock-${p.id}`,
          type: 'warning',
          title: `Stock Crítico: ${p.name}`,
          description: `Quedan solo ${p.stock || 0} unidades.`,
          icon: <Package className="w-5 h-5" />
        })),
        ...pendingPayments.map((o: any) => ({
          id: `order-${o.id}`,
          type: 'info',
          title: `Pago por Validar`,
          description: `Orden #${o.id.slice(0, 8)} del cliente ${o.customer?.name || 'N/A'}.`,
          icon: <DollarSign className="w-5 h-5" />
        }))
      ];

      setAlerts(systemAlerts.slice(0, 10));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!storeToken) {
      const match = document.cookie.match(new RegExp('(^| )pb_auth=([^;]+)'));
      if (match && match[2]) setAdmin({ role: 'ADMIN' }, match[2]);
    }
  }, [storeToken, setAdmin]);

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-purple/20 border-t-purple rounded-full animate-spin" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sincronizando Dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-10">
        <h1 className="text-4xl font-black text-oxford tracking-tight">Panel de Control</h1>
        <p className="text-text-medium font-medium mt-1">Vista general del rendimiento de NexCommerce.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          title="Ingresos (USD)"
          value={`$${metrics.revenue.toLocaleString()}`}
          icon={<DollarSign />}
          color="success"
        />
        <StatCard
          title="Órdenes"
          value={metrics.totalOrders}
          icon={<ShoppingBag />}
          color="purple"
        />
        <StatCard
          title="Clientes"
          value={metrics.totalUsers}
          icon={<Users />}
          color="info"
        />
        <StatCard
          title="Productos"
          value={metrics.totalProducts}
          icon={<Package />}
          color="navy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-red-500" /> Alertas del Sistema
          </h3>
          <div className="space-y-4">
            {alerts.length > 0 ? (
              alerts.map((alert: any) => (
                <div key={alert.id} className={`p-6 rounded-[30px] border flex items-center justify-between transition-all hover:shadow-md ${alert.type === 'warning' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${alert.type === 'warning' ? 'bg-white text-red-500 shadow-sm' : 'bg-white text-blue-500 shadow-sm'}`}>
                      {alert.icon}
                    </div>
                    <div>
                      <p className="font-black text-oxford text-base leading-tight">{alert.title}</p>
                      <p className="text-xs text-text-medium mt-1">{alert.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              ))
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[40px] p-12 text-center">
                <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h4 className="font-black text-oxford">Todo bajo control</h4>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Sin alertas críticas hoy</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Estado Inventario</h3>
          <div className={`p-8 rounded-[40px] border-2 border-dashed flex flex-col items-center justify-center text-center ${metrics.lowStockCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${metrics.lowStockCount > 0 ? 'bg-red-500 text-white animate-bounce' : 'bg-white text-gray-200'}`}>
              <TrendingUp className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-black text-oxford">{metrics.lowStockCount}</h4>
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mt-1">Productos con stock bajo</p>
            {metrics.lowStockCount > 0 && (
              <button
                onClick={() => window.location.href = '/products'}
                className="mt-6 bg-red-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-900/10"
              >
                Gestionar Inventario
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = {
    success: 'bg-green-100 text-green-600 border-green-500',
    purple: 'bg-purple/10 text-purple border-purple',
    info: 'bg-blue-100 text-blue-600 border-blue-500',
    navy: 'bg-oxford/10 text-oxford border-oxford'
  };

  return (
    <div className={`bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group overflow-hidden relative`}>
      <div className="flex items-center gap-6 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-3xl font-black text-oxford tracking-tight">{value}</h3>
        </div>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] group-hover:scale-150 transition-transform ${colors[color].split(' ')[1]}`}>
        {icon}
      </div>
    </div>
  );
}

