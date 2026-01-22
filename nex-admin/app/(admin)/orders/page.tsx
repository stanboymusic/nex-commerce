"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/orders")
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiClient.put("/orders/status", { id, status });
      // Update local state instead of reloading
      setOrders(orders.map((o: any) => o.id === id ? { ...o, status } : o));
    } catch (error) {
      alert("Error al actualizar el estado");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-oxford tracking-tight">Gestión de Pedidos</h1>
        <p className="text-text-medium font-medium mt-1">Controla y actualiza el estado de las compras de tus clientes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.map((o: any) => (
          <Card key={o.id} className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-text-light uppercase tracking-wider">Orden #{o.id.slice(-8)}</p>
                <p className="font-bold text-oxford">{o.user?.name || o.user?.email || "Cliente"}</p>
                <p className="text-sm text-text-medium">{new Date(o.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="text-right mr-4">
                  <p className="text-xl font-black text-purple">${o.total.toLocaleString()}</p>
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-bold text-text-light uppercase">{o.currency}</p>
                    <Badge variant="neutral" className="text-[10px] mt-1">{o.paymentMethod || 'N/A'}</Badge>
                  </div>
                </div>

                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm font-bold text-oxford outline-none focus:ring-2 focus:ring-purple/20"
                >
                  <option value="PENDING_PAYMENT">Pendiente Pago</option>
                  <option value="PAYMENT_REPORTED">Pago Reportado</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="PREPARING">Preparando</option>
                  <option value="SHIPPED">Enviado</option>
                  <option value="DELIVERED">Entregado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-border">
          <p className="text-text-medium font-medium">No hay pedidos registrados aún.</p>
        </div>
      )}
    </div>
  );
}
