'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function NewUserPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "USER"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/users', formData);
            router.push('/users');
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Error al crear usuario. Verifica los datos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/users" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft className="h-6 w-6 text-oxford" />
                </Link>
                <div>
                    <h1 className="text-4xl font-black text-oxford tracking-tight">Nuevo Usuario</h1>
                    <p className="text-text-medium font-medium">Registra un nuevo administrador o cliente.</p>
                </div>
            </div>

            <div className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card title="Información del Usuario">
                        <div className="space-y-6">
                            <Input
                                label="Nombre Completo"
                                placeholder="Ej. Juan Pérez"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Correo Electrónico"
                                type="email"
                                placeholder="juan@ejemplo.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <Input
                                label="Contraseña"
                                type="password"
                                placeholder="********"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-text-dark mb-1">Rol</label>
                                <select
                                    className="w-full rounded-lg border border-border bg-white px-4 py-2 text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="USER">Cliente (USER)</option>
                                    <option value="ADMIN">Administrador (ADMIN)</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <div className="flex flex-col gap-3">
                        <Button type="submit" isLoading={loading} className="w-full text-lg py-6" leftIcon={<Save className="h-5 w-5" />}>
                            Guardar Usuario
                        </Button>
                        <Link href="/users" className="w-full">
                            <Button variant="ghost" className="w-full">Cancelar</Button>
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}
