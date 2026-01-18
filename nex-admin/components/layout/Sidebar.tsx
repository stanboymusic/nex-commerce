'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    ShoppingCart,
    Users,
    Bell,
    LogOut
} from 'lucide-react';
import { useAdminStore } from '@/store/admin.store';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Productos', href: '/products', icon: ShoppingBag },
    { label: 'Órdenes', href: '/orders', icon: ShoppingCart },
    { label: 'Usuarios', href: '/users', icon: Users },
    { label: 'Alertas', href: '/notifications', icon: Bell },
];

export const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const logout = useAdminStore((state) => state.logout);

    const handleLogout = () => {
        logout();
        // Clear all possible session cookies
        document.cookie = 'pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'nex_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        router.push('/login');
    };

    return (
        <aside className="w-64 bg-oxford text-white flex flex-col h-screen fixed left-0 top-0 z-50">
            <div className="p-6 border-b border-white/10">
                <h1 className="text-2xl font-bold tracking-tight">NexAdmin</h1>
            </div>

            <nav className="flex-1 py-6 space-y-1 px-3">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive
                                    ? 'bg-purple text-white shadow-md'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'}
              `}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};
