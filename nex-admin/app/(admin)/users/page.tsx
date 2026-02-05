"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import {
    Users, Search, UserPlus, Mail, Shield,
    MoreHorizontal, ChevronRight, UserCircle,
    ShieldCheck, ShieldAlert
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);
    const [vipUpdating, setVipUpdating] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/users');
            setUsers(response.data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleRole = async (user: any) => {
        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        if (!confirm(`¿Cambiar el rol de ${user.name} a ${newRole}?`)) return;

        try {
            setUpdating(user.id);
            await apiClient.patch(`/users/${user.id}`, { role: newRole });
            await fetchUsers();
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Error al actualizar el rol");
        } finally {
            setUpdating(null);
        }
    };

    const toggleVip = async (user: any) => {
        const nextVip = !user.isVip;
        if (!confirm(`¿${nextVip ? 'Marcar' : 'Quitar'} VIP a ${user.name}?`)) return;
        try {
            setVipUpdating(user.id);
            await apiClient.patch(`/users/${user.id}`, { isVip: nextVip });
            await fetchUsers();
        } catch (error) {
            console.error("Error updating VIP:", error);
            alert("Error al actualizar VIP");
        } finally {
            setVipUpdating(null);
        }
    };

    const filteredUsers = users.filter((user: any) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-oxford tracking-tight">Usuarios</h1>
                    <p className="text-text-medium font-medium mt-1">Administra los roles y el acceso a la plataforma.</p>
                </div>
            </div>

            <div className="mb-8 max-w-xl">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[20px] shadow-sm outline-none focus:ring-4 focus:ring-purple/5 focus:border-purple transition-all font-medium"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-10 h-10 border-4 border-purple/20 border-t-purple rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-bold">Cargando comunidad...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredUsers.map((user: any, index: number) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card className="p-8 hover:shadow-2xl transition-all group relative overflow-hidden rounded-[40px] border-gray-50">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-purple to-pink-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-purple/20">
                                            {user.name?.slice(0, 2).toUpperCase() || '??'}
                                        </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <Badge variant={user.role === 'ADMIN' ? 'purple' : 'neutral'} className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {user.role}
                                        </Badge>
                                        {user.isVip && (
                                            <Badge variant="success" className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                VIP
                                            </Badge>
                                        )}
                                    </div>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-xl font-black text-oxford leading-tight group-hover:text-purple transition-colors">
                                            {user.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-text-light">
                                            <Mail className="w-3 h-3 text-gray-300" />
                                            <p className="text-xs font-medium truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            Desde {new Date(user.created).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleVip(user)}
                                                disabled={vipUpdating === user.id}
                                                className={`p-3 rounded-2xl transition-all active:scale-90 ${user.isVip
                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                                title={user.isVip ? "Quitar VIP" : "Marcar VIP"}
                                            >
                                                {vipUpdating === user.id ? (
                                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <ShieldCheck className="w-5 h-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => toggleRole(user)}
                                                disabled={updating === user.id}
                                                className={`p-3 rounded-2xl transition-all active:scale-90 ${user.role === 'ADMIN'
                                                        ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                                        : 'bg-purple/10 text-purple hover:bg-purple/20'
                                                    }`}
                                                title="Cambiar rol"
                                            >
                                                {updating === user.id ? (
                                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : user.role === 'ADMIN' ? (
                                                    <ShieldAlert className="w-5 h-5" />
                                                ) : (
                                                    <ShieldCheck className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Decorative background icon */}
                                    <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:scale-125 transition-transform">
                                        <UserCircle className="w-40 h-40 text-oxford" />
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </>
    );
}

