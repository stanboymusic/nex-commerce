import { User, Bell, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-16 w-full flex justify-between items-center bg-white px-8 border-b border-gray-100 sticky top-0 z-10">
      <div className="relative w-96 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-purple transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar..." 
          className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-6">
        <button aria-label="Notificaciones" className="relative p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-gray-100 mx-2"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-oxford leading-none">Admin Nex</p>
            <p className="text-[10px] text-gray-400 font-medium">Administrador</p>
          </div>
          <div className="w-10 h-10 bg-almond rounded-xl flex items-center justify-center text-purple group-hover:scale-105 transition-transform shadow-sm">
            <User className="h-6 w-6" />
          </div>
        </div>
      </div>
    </header>
  );
}
