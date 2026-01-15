'use client';

import React from 'react';
import { useAdminStore } from '@/store/admin.store';
import { User, Menu } from 'lucide-react';

export const Topbar = () => {
    const admin = useAdminStore((state) => state.admin);

    return (
        <header className="bg-white border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-40 ml-64">
            <div className="flex items-center gap-4">
                {/* Mobile menu trigger could go here */}
                <h2 className="text-lg font-medium text-text-medium">
                    Bienvenido, <span className="text-oxford font-bold">{admin?.name || 'Admin'}</span>
                </h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pl-4 border-l border-border">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-text-dark">{admin?.name || 'Administrador'}</p>
                        <p className="text-xs text-text-light">{admin?.email}</p>
                    </div>
                    <div className="h-10 w-10 bg-oxford/10 rounded-full flex items-center justify-center text-oxford">
                        <User className="h-5 w-5" />
                    </div>
                </div>
            </div>
        </header>
    );
};
