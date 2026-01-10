import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Users, Bell, LogOut } from "lucide-react";
import { useAdminStore } from "@/store/admin.store";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";

export default function Sidebar() {
  const logout = useAdminStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-oxford min-h-screen text-white p-6 flex flex-col gap-8 shadow-xl">
      <div className="flex items-center gap-2 px-2">
        <div className="w-8 h-8 bg-purple rounded-lg flex items-center justify-center">
          <span className="font-black text-xl">N</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">NexCommerce</h1>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2">Menu Principal</p>
        
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium group">
          <LayoutDashboard className="h-4 w-4 text-gray-400 group-hover:text-purple transition-colors" />
          Dashboard
        </Link>
        
        <Link href="/products" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium group">
          <Package className="h-4 w-4 text-gray-400 group-hover:text-purple transition-colors" />
          Productos
        </Link>
        
        <Link href="/orders" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium group">
          <ShoppingCart className="h-4 w-4 text-gray-400 group-hover:text-purple transition-colors" />
          Órdenes
        </Link>
        
        <Link href="/users" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium group">
          <Users className="h-4 w-4 text-gray-400 group-hover:text-purple transition-colors" />
          Usuarios
        </Link>
        
        <Link href="/notifications" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium group">
          <Bell className="h-4 w-4 text-gray-400 group-hover:text-purple transition-colors" />
          Alertas
        </Link>
      </nav>

      <div className="pt-6 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-medium group text-gray-400"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
