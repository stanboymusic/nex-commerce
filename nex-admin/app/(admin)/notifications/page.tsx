'use client'

import { Bell, AlertTriangle, Package, CheckCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function NotificationsPage() {
    const notifications = [
        {
            id: 1,
            title: "Stock Bajo: NexPhone Pro",
            description: "Quedan menos de 5 unidades en el almacén.",
            type: "warning",
            time: "Hace 10 minutos",
            icon: AlertTriangle
        },
        {
            id: 2,
            title: "Nueva Orden Recibida",
            description: "El cliente Juan Pérez ha realizado una compra por $250.",
            type: "success",
            time: "Hace 1 hora",
            icon: CheckCircle
        },
        {
            id: 3,
            title: "Actualización de Sistema",
            description: "La sincronización con la tienda se completó correctamente.",
            type: "info",
            time: "Hoy 08:30 AM",
            icon: Info
        }
    ];

    const getVariant = (type: string) => {
        switch (type) {
            case 'warning': return 'warning';
            case 'success': return 'success';
            case 'error': return 'error';
            default: return 'info';
        }
    };

    return (
        <>
            <div className="mb-10">
                <h1 className="text-4xl font-black text-oxford tracking-tight">Alertas de Sistema</h1>
                <p className="text-text-medium font-medium mt-1">Mantente al tanto de lo que sucede en tu tienda.</p>
            </div>

            <div className="max-w-4xl space-y-4">
                {notifications.map((notif) => {
                    const Icon = notif.icon;
                    return (
                        <Card key={notif.id} className="hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl bg-${getVariant(notif.type)}/10 text-${getVariant(notif.type)}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-oxford">{notif.title}</h3>
                                        <span className="text-xs text-text-light">{notif.time}</span>
                                    </div>
                                    <p className="text-sm text-text-medium mb-3">{notif.description}</p>
                                    <div className="flex gap-2">
                                        <Badge variant={getVariant(notif.type)}>{notif.type.toUpperCase()}</Badge>
                                        <Button variant="ghost" size="sm">Descartar</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {notifications.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-border">
                    <Bell className="h-12 w-12 text-text-light mx-auto mb-4" />
                    <p className="text-text-medium font-bold">No tienes alertas pendientes</p>
                </div>
            )}
        </>
    );
}
