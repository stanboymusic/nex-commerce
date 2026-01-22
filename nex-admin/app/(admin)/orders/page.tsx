"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/orders");
      setOrders(res.data);
    } catch (error) {
      console.error("Error loading orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    if (!confirm("Aprobar pago de esta orden?")) return;
    await apiClient.post("/admin/orders/approve-payment", { orderId: id });
    load();
    setSelected(null);
  };

  const reject = async (id: string) => {
    if (!reason) return alert("Ingrese un motivo");
    if (!confirm("Rechazar pago y cancelar orden?")) return;
    await apiClient.post("/admin/orders/reject-payment", { orderId: id, reason });
    setReason("");
    load();
    setSelected(null);
  };

  const advance = async (id: string, newStatus: string) => {
    if (!confirm(`Cambiar estado a ${newStatus}?`)) return;
    await apiClient.post("/admin/orders/update-status", { orderId: id, newStatus });
    load();
    setSelected(null);
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    const colors: any = {
      PENDING_PAYMENT: "bg-amber-100 text-amber-800",
      PAYMENT_REPORTED: "bg-blue-100 text-blue-800",
      CONFIRMED: "bg-green-100 text-green-800",
      PREPARING: "bg-purple-100 text-purple-800",
      SHIPPED: "bg-indigo-100 text-indigo-800",
      DELIVERED: "bg-emerald-100 text-emerald-800",
      CANCELLED: "bg-red-100 text-red-800",
      REJECTED: "bg-red-200 text-red-900",
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[status] || "bg-gray-100"}`}>{status}</span>;
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-oxford">Gestión de Órdenes</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Buscar por ID o Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple/50 outline-none"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <button onClick={load} className="bg-white border p-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm" title="Actualizar">
            <svg className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden h-full">
        {/* List */}
        <div className="lg:col-span-1 border rounded-xl bg-white overflow-y-auto h-full shadow-sm">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Cargando...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? "No se encontraron órdenes para esta búsqueda." : "No hay órdenes."}
            </div>
          ) : (
            <div className="divide-y text-sm">
              {filteredOrders.map(o => (
                <div
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === o.id ? "bg-purple/5 border-l-4 border-purple" : "border-l-4 border-transparent"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-oxford">#{o.id.slice(0, 8)}</span>
                    <span className="text-xs text-gray-400">{new Date(o.created).toLocaleDateString()}</span>
                  </div>
                  <div className="mb-2">
                    {getStatusBadge(o.status)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">{o.customer?.name || "Cliente desconocido"}</div>
                    <div>{o.items.length} items • {o.currency} {o.currency === 'USD' ? o.totalUSD : o.totalLocal}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 border rounded-xl bg-white p-6 shadow-sm overflow-y-auto h-full">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              Selecciona una orden para ver detalles
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-oxford flex items-center gap-2">
                    Orden #{selected.id}
                    {getStatusBadge(selected.status)}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Creada el {new Date(selected.created).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-oxford">
                    {selected.currency === 'USD' ? `$${selected.totalUSD}` : `$${selected.totalLocal.toLocaleString()}`}
                    <span className="text-sm text-gray-500 font-normal ml-1">{selected.currency}</span>
                  </div>
                  {selected.currency !== 'USD' && (
                    <div className="text-xs text-text-light">
                      Tasa: {selected.exchangeRate} | USD: ${selected.totalUSD}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-oxford mb-2">Cliente</h4>
                  <p>{selected.customer?.name}</p>
                  <p className="text-gray-500">{selected.customer?.email}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-oxford mb-2">Envío</h4>
                  <p>{selected.address}</p>
                  {selected.notes && <p className="text-amber-600 mt-1 italic">Nota: {selected.notes}</p>}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-oxford mb-3">Productos</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="p-3 font-semibold text-gray-600">Producto</th>
                        <th className="p-3 font-semibold text-gray-600 text-center">Cant.</th>
                        <th className="p-3 font-semibold text-gray-600 text-right">Precio Unit.</th>
                        <th className="p-3 font-semibold text-gray-600 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selected.items.map((it: any) => (
                        <tr key={it.id}>
                          <td className="p-3">{it.name}</td>
                          <td className="p-3 text-center">{it.quantity}</td>
                          <td className="p-3 text-right">${it.price}</td>
                          <td className="p-3 text-right font-medium">${it.quantity * it.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-bold text-oxford mb-4">Acciones</h4>

                <div className="flex flex-wrap gap-4">
                  {selected.paymentStatus === "REPORTED" && (
                    <div className="w-full bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-3">
                      <h5 className="font-bold text-blue-900 border-b border-blue-200 pb-2">Gestión de Pago</h5>
                      <div className="flex flex-col gap-2 mb-2 text-sm text-blue-800">
                        <div className="flex items-center gap-2">
                          <span>Método: <b>{selected.paymentMethod}</b></span>
                          {selected.paymentReference && <span>• Ref: <b>{selected.paymentReference}</b></span>}
                        </div>
                        {selected.paymentProof && (
                          <div className="mt-1">
                            <a
                              href={`${process.env.NEXT_PUBLIC_POCKETBASE_URL || ''}/api/files/orders/${selected.id}/${selected.paymentProof}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 font-bold underline flex items-center gap-1"
                            >
                              Ver Comprobante de Pago
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => approve(selected.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 hover:shadow-md transition-all"
                        >
                          Aprobar Pago
                        </button>
                        <div className="flex-1 flex gap-2">
                          <input
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Motivo del rechazo..."
                            className="flex-1 border border-blue-200 px-3 py-2 rounded-lg text-sm bg-white"
                          />
                          <button
                            onClick={() => reject(selected.id)}
                            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-200 transition-colors"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {selected.status === "CONFIRMED" && (
                      <button onClick={() => advance(selected.id, "PREPARING")} className="bg-purple text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-dark transition-colors">
                        Marcar "En Preparación"
                      </button>
                    )}

                    {selected.status === "PREPARING" && (
                      <button onClick={() => advance(selected.id, "SHIPPED")} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                        Marcar "Enviado"
                      </button>
                    )}

                    {selected.status === "SHIPPED" && (
                      <button onClick={() => advance(selected.id, "DELIVERED")} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                        Marcar "Entregado"
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
