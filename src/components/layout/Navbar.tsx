'use client'

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useState, useEffect } from "react";
import { ShoppingCart, LogOut, Menu } from "lucide-react";
import NotificationToggle from "@/components/notifications/NotificationToggle";

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { getItemCount } = useCartStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const cartCount = mounted ? getItemCount() : 0

  return (
    <nav className="w-full border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-navy tracking-tight">
          NexCommerce
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/catalog" className="text-navy hover:text-purple transition-colors">
            Catálogo
          </Link>
          {user && (
            <Link href="/orders" className="text-navy hover:text-purple transition-colors">
              Mis pedidos
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin/dashboard" className="text-navy hover:text-purple transition-colors">
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-6">
          {user && (
            <div className="hidden md:block">
              <NotificationToggle />
            </div>
          )}
          <Link href="/cart" className="relative p-2 text-navy hover:text-purple transition-colors" aria-label="Ir al carrito">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold hidden sm:inline text-navy">{user.name}</span>
              <button 
                onClick={logout}
                className="text-navy hover:text-purple transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-bold text-navy hover:text-purple transition-colors">
              Iniciar sesión
            </Link>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menú"
            className="md:hidden text-navy"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-4 shadow-lg">
          {user && (
            <div>
              <NotificationToggle />
            </div>
          )}
          <Link href="/catalog" className="block text-navy font-medium hover:text-purple transition-colors">
            Catálogo
          </Link>
          {user && (
            <Link href="/orders" className="block text-navy font-medium hover:text-purple transition-colors">
              Mis pedidos
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin/dashboard" className="block text-navy font-medium hover:text-purple transition-colors">
              Admin
            </Link>
          )}
          <Link href="/cart" className="block text-navy font-medium hover:text-purple transition-colors">
            Carrito ({cartCount})
          </Link>
        </div>
      )}
    </nav>
  );
}
