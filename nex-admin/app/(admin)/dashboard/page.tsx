'use client'

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { Users, ShoppingBag, Package, DollarSign, TrendingUp } from "lucide-react";
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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we have a cookie but no token in store, sync them
    if (!storeToken) {
      const match = document.cookie.match(new RegExp('(^| )nex_session=([^;]+)'));
      if (match && match[2]) {
        // We set a placeholder admin object, the next API call will fail if token is truly invalid
        setAdmin({ role: 'ADMIN' }, match[2]);
      }
    }
  }, [storeToken, setAdmin]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, ordersRes, productsRes, notificationsRes] = await Promise.all([
          apiClient.get('/users/count').catch(() => ({ data: { count: 0 } })),
          apiClient.get('/orders').catch(() => ({ data: [] })),
          apiClient.get('/products').catch(() => ({ data: [] })),
          apiClient.get('/notifications').catch(() => ({ data: [] }))
        ]);

        const orders = ordersRes.data || [];
        const products = productsRes.data || [];
        const revenue = orders.reduce((sum: number, o: any) => sum + (o.status !== 'CANCELLED' ? (o.total || 0) : 0), 0);
        const lowStock = products.filter((p: any) => p.stock < 10 && !p.isPreorder).length;

        setMetrics({
          totalUsers: usersRes.data.count || 0,
          totalOrders: orders.length,
          totalProducts: products.length,
          revenue,
          lowStockCount: lowStock
        });

        setNotifications(notificationsRes.data.slice(0, 5) || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-10">
        <h1 className="text-4xl font-black text-oxford tracking-tight">Panel de Control</h1>
        <p className="text-text-medium font-medium mt-1">Vista general del rendimiento de NexCommerce hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-success">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center text-success">
              <DollarSign className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-light uppercase tracking-wider mb-1">Ventas Totales</p>
              <div className="flex items-end gap-3">
                <h3 className="text-3xl font-black text-oxford tracking-tight">${metrics.revenue.toLocaleString()}</h3>
                <Badge variant="success">Actualizado</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-purple/10 rounded-2xl flex items-center justify-center text-purple">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-light uppercase tracking-wider mb-1">Órdenes</p>
              <div className="flex items-end gap-3">
                <h3 className="text-3xl font-black text-oxford tracking-tight">{metrics.totalOrders}</h3>
                <Badge variant="info">Real</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-info">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-info/10 rounded-2xl flex items-center justify-center text-info">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-light uppercase tracking-wider mb-1">Clientes</p>
              <div className="flex items-end gap-3">
                <h3 className="text-3xl font-black text-oxford tracking-tight">{metrics.totalUsers}</h3>
                <Badge variant="warning">PB</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Estado del Inventario" description="Resumen de existencias y productos con stock bajo.">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-muted rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-5 w-5 text-oxford" />
                <p className="text-sm font-bold text-text-medium">Total Productos</p>
              </div>
              <p className="text-4xl font-black text-oxford">{metrics.totalProducts}</p>
            </div>
            <div className={`rounded-2xl p-6 border border-border ${metrics.lowStockCount > 0 ? 'bg-error/5 border-error/20' : 'bg-muted'}`}>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className={`h-5 w-5 ${metrics.lowStockCount > 0 ? 'text-error' : 'text-success'}`} />
                <p className={`text-sm font-bold ${metrics.lowStockCount > 0 ? 'text-error' : 'text-text-medium'}`}>Stock Bajo</p>
              </div>
              <p className={`text-4xl font-black ${metrics.lowStockCount > 0 ? 'text-error' : 'text-oxford'}`}>{metrics.lowStockCount}</p>
            </div>
          </div>
        </Card>

        <Card title="Actividad Reciente" description="Últimas alertas de stock y requisitos de clientes.">
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notif: any) => (
                <div key={notif.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${notif.type === 'warning' ? 'bg-error/10 text-error' : 'bg-info/10 text-info'} rounded-lg flex items-center justify-center`}>
                      {notif.type === 'warning' ? <Package className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-oxford group-hover:text-purple transition-colors truncate max-w-[200px]">{notif.title}</p>
                      <p className="text-xs text-text-light truncate max-w-[240px]">{notif.description}</p>
                    </div>
                  </div>
                  <Badge variant={notif.type === 'warning' ? 'error' : 'info'}>{notif.type.toUpperCase()}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-text-light text-sm italic">
                No hay actividad reciente.
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
