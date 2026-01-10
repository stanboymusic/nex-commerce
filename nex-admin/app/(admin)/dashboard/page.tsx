'use client'

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardCard from "@/components/admin/DashboardCard";
import { apiClient } from "@/lib/apiClient";
import { Users, ShoppingBag, Package, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    revenue: 0,
    lowStockCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // We assume the backend has an endpoint for metrics or we fetch multiple
        const [usersRes, ordersRes, productsRes] = await Promise.all([
          apiClient.get('/users/count'), // Hypothetical or adjusted
          apiClient.get('/orders'),
          apiClient.get('/products')
        ]);

        const orders = ordersRes.data;
        const revenue = orders.reduce((sum: number, o: any) => sum + (o.status !== 'CANCELLED' ? o.total : 0), 0);
        const lowStock = productsRes.data.filter((p: any) => p.stock < 10 && !p.isPreorder).length;

        setMetrics({
          totalUsers: usersRes.data.count || 0,
          totalOrders: orders.length,
          totalProducts: productsRes.data.length,
          revenue,
          lowStockCount: lowStock
        });
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-black text-oxford tracking-tight">Bienvenido, Admin</h1>
        <p className="text-gray-400 font-medium mt-1">Aquí tienes un resumen de lo que está pasando en NexCommerce hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <DashboardCard 
          title="Ventas Totales" 
          value={`$${metrics.revenue.toLocaleString()}`} 
          icon={<DollarSign className="h-7 w-7" />}
          trend={{ value: 12, isPositive: true }}
          color="bg-emerald-500"
        />
        <DashboardCard 
          title="Órdenes" 
          value={metrics.totalOrders} 
          icon={<ShoppingBag className="h-7 w-7" />}
          trend={{ value: 8, isPositive: true }}
          color="bg-purple"
        />
        <DashboardCard 
          title="Clientes" 
          value={metrics.totalUsers} 
          icon={<Users className="h-7 w-7" />}
          trend={{ value: 5, isPositive: true }}
          color="bg-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-purple" />
              Inventario
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Productos</p>
              <p className="text-3xl font-black text-oxford">{metrics.totalProducts}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-6">
              <p className="text-sm font-medium text-red-600/70 mb-1">Stock Bajo</p>
              <p className="text-3xl font-black text-red-600">{metrics.lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Actividad Reciente
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-almond rounded-lg flex items-center justify-center text-purple">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-oxford">Sistema operativo</p>
                <p className="text-xs text-gray-400">Verificando sincronización...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
