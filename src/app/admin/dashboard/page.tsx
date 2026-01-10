import AdminLayout from "@/components/admin/AdminLayout";
import DashboardCard from "@/components/admin/DashboardCard";
import prisma from "@/lib/prisma";
import { Users, ShoppingBag, Package, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const totalUsers = await prisma.user.count();
  const totalOrders = await prisma.order.count();
  const totalProducts = await prisma.product.count();
  
  // Calculate total revenue (example for COP/USD mix, simplified)
  const orders = await prisma.order.findMany({
    where: { status: { not: 'CANCELLED' } },
    select: { total: true }
  });
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  const lowStockCount = await prisma.product.count({
    where: { stock: { lt: 10 }, isPreorder: false }
  });

  return (
    <AdminLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-black text-oxford tracking-tight">Bienvenido, Admin</h1>
        <p className="text-gray-400 font-medium mt-1">Aquí tienes un resumen de lo que está pasando en NexCommerce hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <DashboardCard 
          title="Ventas Totales" 
          value={`$${revenue.toLocaleString()}`} 
          icon={<DollarSign className="h-7 w-7" />}
          trend={{ value: 12, isPositive: true }}
          color="bg-emerald-500"
        />
        <DashboardCard 
          title="Órdenes" 
          value={totalOrders} 
          icon={<ShoppingBag className="h-7 w-7" />}
          trend={{ value: 8, isPositive: true }}
          color="bg-purple"
        />
        <DashboardCard 
          title="Clientes" 
          value={totalUsers} 
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
              <p className="text-3xl font-black text-oxford">{totalProducts}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-6">
              <p className="text-sm font-medium text-red-600/70 mb-1">Stock Bajo</p>
              <p className="text-3xl font-black text-red-600">{lowStockCount}</p>
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
            {/* Placeholder for real activity log */}
            <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-almond rounded-lg flex items-center justify-center text-purple">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-oxford">Nueva orden registrada</p>
                <p className="text-xs text-gray-400">Hace 5 minutos</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-oxford">Nuevo cliente: Juan Pérez</p>
                <p className="text-xs text-gray-400">Hace 12 minutos</p>
              </div>
            </div>
            {lowStockCount > 0 && (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-red-50 text-red-600">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">¡Alerta de Stock!</p>
                  <p className="text-xs">{lowStockCount} productos por debajo del límite</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
