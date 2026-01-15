'use client'

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { Users, Search, UserPlus, Mail, Shield } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await apiClient.get('/users');
                setUsers(response.data || []);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

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
                <Button leftIcon={<UserPlus className="h-5 w-5" />}>
                    Nuevo Usuario
                </Button>
            </div>

            <Card className="mb-8">
                <Input
                    placeholder="Buscar por nombre o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-5 w-5" />}
                />
            </Card>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple"></div>
                </div>
            ) : (
                <Card className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-bold text-oxford">Usuario</th>
                                    <th className="px-6 py-4 text-sm font-bold text-oxford">Correo</th>
                                    <th className="px-6 py-4 text-sm font-bold text-oxford">Rol</th>
                                    <th className="px-6 py-4 text-sm font-bold text-oxford">Fecha Registro</th>
                                    <th className="px-6 py-4 text-sm font-bold text-oxford">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-purple/10 flex items-center justify-center text-purple text-xs font-bold uppercase">
                                                        {user.name?.slice(0, 2) || '??'}
                                                    </div>
                                                    <span className="text-sm font-medium text-oxford">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-medium">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={user.role === 'ADMIN' ? 'purple' : 'neutral'}>
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-light">
                                                {new Date(user.created).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button variant="ghost" size="sm">Editar</Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-text-medium">
                                            No se encontraron usuarios.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </>
    );
}
