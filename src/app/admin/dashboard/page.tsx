import AdminLayout from "@/components/admin/AdminLayout";
import DashboardCard from "@/components/admin/DashboardCard";
import { getAdminPocketBase } from "@/lib/admin";
import { initPocketBaseServer } from "@/lib/pocketbase";
import { redirect } from "next/navigation";
import { Users, ShoppingBag, Package, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const pbAuth = await initPocketBaseServer();
  
  if (!pbAuth.authStore.model || pbAuth.authStore.model.role !== 'ADMIN') {
    redirect('/');
  }

  const pb = await getAdminPocketBase();
  
  // Fetch stats using PocketBase
  const usersList = await pb.collection('users').getList(1, 1);
  const totalUsers = usersList.totalItems;

  const ordersList = await pb.collection('orders').getList(1, 1);
  const totalOrders = ordersList.totalItems;

  const productsList = await pb.collection('products').getList(1, 1);
  const totalProducts = productsList.totalItems;
  
  // Calculate total revenue
  const orders = await pb.collection('orders').getFullList({
    filter: 'status != "CANCELLED"',
    fields: 'total'
  });
  const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  const lowStockResult = await pb.collection('products').getList(1, 1, {
    filter: 'stock < 10 && isPreorder = false'
  });
  const lowStockCount = lowStockResult.totalItems;

  return (
    <AdminLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-black text-oxford tracking-tight">Welcome, Admin</h1>
        <p className="text-gray-400 font-medium mt-1">Here is a summary of what is happening in NexCommerce today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <DashboardCard 
          title="Total Sales" 
          value={`$${revenue.toLocaleString()}`} 
          icon={<DollarSign className="h-7 w-7" />}
          trend={{ value: 12, isPositive: true }}
          color="bg-emerald-500"
        />
        <DashboardCard 
          title="Orders" 
          value={totalOrders} 
          icon={<ShoppingBag className="h-7 w-7" />}
          trend={{ value: 8, isPositive: true }}
          color="bg-purple"
        />
        <DashboardCard 
          title="Customers" 
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
              Inventory
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Products</p>
              <p className="text-3xl font-black text-oxford">{totalProducts}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-6">
              <p className="text-sm font-medium text-red-600/70 mb-1">Low Stock</p>
              <p className="text-3xl font-black text-red-600">{lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Recent Activity
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-almond rounded-lg flex items-center justify-center text-purple">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-oxford">New order registered</p>
                <p className="text-xs text-gray-400">Just now</p>
              </div>
            </div>
            {lowStockCount > 0 && (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-red-50 text-red-600">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Stock Alert!</p>
                  <p className="text-xs">{lowStockCount} products below limit</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
