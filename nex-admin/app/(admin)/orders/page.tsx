"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import {
  Search, RefreshCw, ChevronRight, MapPin, User, Clock,
  CreditCard, Package, Truck, CheckCircle, XCircle, Eye,
  AlertCircle, FileText
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showProof, setShowProof] = useState(false);
  const [statusChoice, setStatusChoice] = useState("");
  const [paymentSettings, setPaymentSettings] = useState<{
    kontigoQR?: string | null;
    binanceQR?: string | null;
  } | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [shippingMessage, setShippingMessage] = useState("");
  const [orderMessages, setOrderMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);

  const statusOptions = [
    { value: "PENDING_PAYMENT", label: "Pendiente Pago" },
    { value: "PAYMENT_REPORTED", label: "Pago Reportado" },
    { value: "CONFIRMED", label: "Confirmado" },
    { value: "PREPARING", label: "En Preparación" },
    { value: "SHIPPED", label: "Enviado" },
    { value: "DELIVERED", label: "Entregado" },
    { value: "CANCELLED", label: "Cancelado" },
  ];

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
      // Update selected order data if it's already selected
      if (selected) {
        const updated = res.data.find((o: any) => o.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (error) {
      console.error("Error loading orders", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data } = await apiClient.get("/settings");
      setPaymentSettings({
        kontigoQR: data?.kontigoQR || null,
        binanceQR: data?.binanceQR || null
      });
    } catch (error) {
      console.error("Error loading payment settings", error);
    }
  };

  useEffect(() => {
    load();
    loadSettings();
  }, []);
  useEffect(() => {
    if (selected?.status) {
      setStatusChoice(selected.status);
    }
    if (selected?.estimatedDeliveryDate) {
      setDeliveryDate(selected.estimatedDeliveryDate.slice(0, 10));
      setDeliveryMessage(`Fecha de entrega asignada para ${new Date(selected.estimatedDeliveryDate).toLocaleDateString()}. Te notificaremos el día correspondiente.`);
    } else {
      setDeliveryDate("");
      setDeliveryMessage("");
    }
    if (typeof selected?.shippingCost === "number") {
      setShippingCost(String(selected.shippingCost));
      setShippingMessage(`Costo de envío asignado: ${selected.shippingCost} ${selected.currency}.`);
    } else {
      setShippingCost("");
      setShippingMessage("");
    }
    if (selected?.id) {
      loadMessages(selected.id);
    } else {
      setOrderMessages([]);
    }
  }, [selected?.id, selected?.status, selected?.estimatedDeliveryDate, selected?.shippingCost, selected?.currency]);

  const loadMessages = async (orderId: string) => {
    try {
      setMessagesLoading(true);
      const res = await apiClient.get(`/orders/${orderId}/messages`);
      setOrderMessages(res.data || []);
    } catch (error) {
      console.error("Error loading order messages", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selected) return;
    const message = messageInput.trim();
    if (!message) return;
    try {
      await apiClient.post(`/orders/${selected.id}/messages`, { message });
      setMessageInput("");
      loadMessages(selected.id);
    } catch (error) {
      alert("Error al enviar el mensaje");
    }
  };

  const approve = async (id: string) => {
    if (!confirm("¿Aprobar el pago de esta orden?")) return;
    try {
      await apiClient.post("/admin/orders/approve-payment", { orderId: id });
      load();
    } catch (err) {
      alert("Error al aprobar el pago");
    }
  };

  const reject = async (id: string) => {
    if (!reason) return alert("Por favor ingresa un motivo para el rechazo.");
    if (!confirm("¿Rechazar pago y cancelar orden? Esta acción restablecerá el stock.")) return;
    try {
      await apiClient.post("/admin/orders/reject-payment", { orderId: id, reason });
      setReason("");
      load();
    } catch (err) {
      alert("Error al rechazar el pago");
    }
  };

  const advanceStatus = async (id: string, newStatus: string) => {
    let msg = "¿Cambiar estado de la orden?";
    if (newStatus === "CANCELLED") msg = "¿Seguro que quieres CANCELAR la orden? Se perderá el progreso actual.";

    if (!confirm(msg)) return;
    try {
      await apiClient.post("/admin/orders/update-status", { orderId: id, newStatus });
      load();
    } catch (err) {
      alert("Error al actualizar el estado");
    }
  };

  const assignDeliveryDate = async () => {
    if (!selected) return;
    if (!deliveryDate) return alert("Selecciona una fecha de entrega.");

    const isoDate = new Date(deliveryDate).toISOString();
    const message = deliveryMessage?.trim()
      ? deliveryMessage.trim()
      : `Fecha de entrega asignada para ${new Date(deliveryDate).toLocaleDateString()}. Te notificaremos el día correspondiente.`;

    if (!confirm("¿Asignar esta fecha de entrega y notificar al cliente?")) return;
    try {
      await apiClient.patch(`/orders/${selected.id}`, {
        estimatedDeliveryDate: isoDate,
        statusMessage: message,
        statusVisible: true
      });
      load();
    } catch (err) {
      alert("Error al asignar la fecha de entrega");
    }
  };

  const assignShippingCost = async () => {
    if (!selected) return;
    if (!shippingCost) return alert("Ingresa el costo de envío.");
    const costValue = Number(shippingCost);
    if (!Number.isFinite(costValue) || costValue < 0) {
      return alert("Costo de envío inválido.");
    }

    const message = shippingMessage?.trim()
      ? shippingMessage.trim()
      : `Costo de envío asignado: ${costValue} ${selected.currency}.`;

    if (!confirm("¿Asignar costo de envío y notificar al cliente?")) return;
    try {
      await apiClient.patch(`/orders/${selected.id}`, {
        shippingCost: costValue,
        statusMessage: message,
        statusVisible: true
      });
      load();
    } catch (err) {
      alert("Error al asignar el costo de envío");
    }
  };

  const clearShippingCost = async () => {
    if (!selected) return;
    if (!confirm("¿Quitar el costo de envío y notificar al cliente?")) return;
    try {
      await apiClient.patch(`/orders/${selected.id}`, {
        shippingCost: null,
        statusMessage: "El costo de envío ha sido retirado. Te notificaremos si se asigna uno nuevo.",
        statusVisible: true
      });
      load();
    } catch (err) {
      alert("Error al quitar el costo de envío");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT": return <Badge variant="neutral">Pendiente Pago</Badge>;
      case "PAYMENT_REPORTED": return <Badge variant="info" className="animate-pulse">Pago Reportado</Badge>;
      case "CONFIRMED": return <Badge variant="success">Confirmado</Badge>;
      case "PREPARING": return <Badge variant="purple">En Preparación</Badge>;
      case "SHIPPED": return <Badge variant="info">Enviado</Badge>;
      case "DELIVERED": return <Badge variant="success">Entregado</Badge>;
      case "CANCELLED": return <Badge variant="error" className="opacity-70">Cancelado</Badge>;
      case "REJECTED": return <Badge variant="error">Rechazado</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://nex-pb.fly.dev";

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6 overflow-hidden">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black text-oxford tracking-tight">Órdenes</h1>
          <p className="text-text-medium font-medium mt-1">Gestiona los pedidos y estados de entrega.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID, nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-purple/5 focus:border-purple/30 outline-none transition-all shadow-sm"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Orders List */}
        <div className="lg:col-span-4 bg-white border border-gray-100 rounded-[35px] shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-black text-oxford text-sm uppercase tracking-widest">Lista de Pedidos</h3>
            <span className="bg-gray-50 text-[10px] font-black px-2 py-1 rounded-lg text-gray-400">{filteredOrders.length} Totales</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
            {loading && orders.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-8 h-8 animate-spin opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Cargando órdenes...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-sm font-medium">No se encontraron pedidos</p>
              </div>
            ) : (
              filteredOrders.map(o => (
                <div
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className={`p-6 cursor-pointer group transition-all relative ${selected?.id === o.id ? "bg-purple/[0.03]" : "hover:bg-gray-50"}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className="font-black text-oxford text-base tracking-tight">#{o.id.slice(0, 8)}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {new Date(o.created).toLocaleDateString()}
                      </span>
                    </div>
                    {getStatusBadge(o.status)}
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-gray-600 truncate max-w-[150px]">{o.customer?.name || "Cliente Final"}</div>
                      <div className="text-xs text-gray-400 font-medium">
                        {o.items.length} {o.items.length === 1 ? 'producto' : 'productos'}
                      </div>
                      {o.paymentMethod === "BINANCE" && (
                        <div className="text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-100 inline-flex px-2 py-0.5 rounded-full">
                          Binance
                        </div>
                      )}
                      {o.paymentMethod === "KONTIGO" && (
                        <div className="text-[9px] font-black text-purple uppercase tracking-widest bg-purple/10 border border-purple/20 inline-flex px-2 py-0.5 rounded-full">
                          Kontigo
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-black text-oxford text-sm">
                        {o.currency === 'USD' ? '$' : ''}{o.currency === 'USD' ? o.totalUSD : o.totalLocal.toLocaleString()}
                        <span className="text-[9px] text-gray-400 ml-1 font-bold">{o.currency}</span>
                      </div>
                    </div>
                  </div>

                  {selected?.id === o.id && (
                    <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-purple" />
                  )}
                  <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-200 transition-all ${selected?.id === o.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-[35px] shadow-sm flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-gray-300 p-12 text-center"
              >
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-xl font-black text-oxford mb-2">Vista de Detalle</h3>
                <p className="text-sm font-medium max-w-xs">Selecciona un pedido de la lista para gestionar el pago, envío y estados.</p>
              </motion.div>
            ) : (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col h-full"
              >
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-10">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-50 pb-8 mb-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-oxford tracking-tight">#{selected.id}</h2>
                        {getStatusBadge(selected.status)}
                      </div>
                      <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Recibida el {new Date(selected.created).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-3xl text-right min-w-[200px]">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total del Pedido</div>
                      <div className="text-3xl font-black text-oxford">
                        {selected.currency === 'USD' ? '$' : ''}{selected.currency === 'USD' ? selected.totalUSD : selected.totalLocal.toLocaleString()}
                        <span className="text-sm text-gray-400 font-bold ml-1 uppercase">{selected.currency}</span>
                      </div>
                      {selected.currency !== 'USD' && (
                        <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase italic">
                          Tasa: {selected.exchangeRate} | Ref: ${selected.totalUSD} USD
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3 h-3 text-purple" /> Información del Cliente
                      </h4>
                      <div className="bg-white border border-gray-50 p-6 rounded-3xl shadow-sm">
                        <div className="font-black text-oxford text-lg">{selected.customer?.name}</div>
                        <div className="text-sm text-gray-500 font-medium mt-1">{selected.customer?.email}</div>
                        {selected.customer?.phone && (
                          <div className="text-xs text-gray-400 mt-2 font-bold tracking-tight">{selected.customer.phone}</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-purple" /> Dirección de Entrega
                      </h4>
                      <div className="bg-white border border-gray-50 p-6 rounded-3xl shadow-sm">
                        <p className="text-sm text-oxford font-semibold leading-relaxed">{selected.address}</p>
                        {selected.notes && (
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 italic font-medium">"{selected.notes}"</p>
                          </div>
                        )}
                      </div>
                  </div>
                  </div>

                  <div className="mb-10 bg-slate-50 border border-slate-100 rounded-[30px] p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-slate-600" />
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Costo de envío</h4>
                        <p className="text-xs text-slate-600 font-medium">Opcional. Si se asigna, el cliente será notificado.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Monto</label>
                        <input
                          type="number"
                          min="0"
                          value={shippingCost}
                          onChange={(e) => setShippingCost(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl text-sm font-bold text-oxford outline-none focus:ring-4 focus:ring-slate-200/50"
                          placeholder={`Ej: 15000 (${selected.currency})`}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Mensaje para el cliente</label>
                        <input
                          type="text"
                          value={shippingMessage}
                          onChange={(e) => setShippingMessage(e.target.value)}
                          placeholder="Ej: El envío tiene un costo adicional."
                          className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl text-sm font-bold text-oxford outline-none focus:ring-4 focus:ring-slate-200/50"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={assignShippingCost}
                        className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/10"
                      >
                        Asignar y notificar
                      </button>
                      {typeof selected?.shippingCost === "number" && (
                        <button
                          onClick={clearShippingCost}
                          className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all"
                        >
                          Quitar costo
                        </button>
                      )}
                    </div>
                    {typeof selected?.shippingCost === "number" && (
                      <p className="text-xs text-slate-600 font-medium">
                        Costo actual: {selected.shippingCost} {selected.currency}
                      </p>
                    )}
                  </div>

                  {selected?.items?.some((it: any) => it.product?.isPreorder) && !selected?.estimatedDeliveryDate && (
                    <div className="mb-10 bg-amber-50 border border-amber-100 rounded-[30px] p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-amber-600" />
                        <div>
                          <h4 className="text-sm font-black text-amber-900">Preventa: asignar fecha de entrega</h4>
                          <p className="text-xs text-amber-700 font-medium">El cliente solo será notificado cuando asignes la fecha.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                          <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest block mb-2">Fecha de entrega</label>
                          <input
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            className="w-full bg-white border border-amber-200 px-4 py-3 rounded-2xl text-sm font-bold text-oxford outline-none focus:ring-4 focus:ring-amber-200/50"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest block mb-2">Mensaje para el cliente</label>
                          <input
                            type="text"
                            value={deliveryMessage}
                            onChange={(e) => setDeliveryMessage(e.target.value)}
                            placeholder="Ej: Tu pedido en preventa ya tiene fecha asignada."
                            className="w-full bg-white border border-amber-200 px-4 py-3 rounded-2xl text-sm font-bold text-oxford outline-none focus:ring-4 focus:ring-amber-200/50"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={assignDeliveryDate}
                          className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/10"
                        >
                          Asignar y notificar
                        </button>
                      </div>
                    </div>
                  )}

                  {selected?.items?.some((it: any) => it.product?.isPreorder) && selected?.estimatedDeliveryDate && (
                    <div className="mb-10 bg-emerald-50 border border-emerald-100 rounded-[30px] p-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h4 className="text-sm font-black text-emerald-900">Preventa: fecha asignada</h4>
                          <p className="text-xs text-emerald-700 font-medium">
                            Fecha actual: {new Date(selected.estimatedDeliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6 mb-10">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Package className="w-3 h-3 text-purple" /> Resumen de Productos
                    </h4>
                    <div className="bg-white border border-gray-50 rounded-[30px] overflow-hidden shadow-sm">
                      <table className="w-full">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="p-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                            <th className="p-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Cant.</th>
                            <th className="p-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">P. Unitario</th>
                            <th className="p-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {selected.items.map((it: any) => (
                            <tr key={it.id} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="p-5">
                                <span className="font-black text-oxford text-sm">{it.name}</span>
                                {it.product?.isPreorder && <Badge variant="info" className="ml-2 scale-75">PREVENTA</Badge>}
                              </td>
                              <td className="p-5 text-center">
                                <span className="bg-purple/5 px-2 py-1 rounded-lg text-purple font-black text-xs">{it.quantity}</span>
                              </td>
                              <td className="p-5 text-right text-gray-500 font-bold text-sm">${it.price.toLocaleString()}</td>
                              <td className="p-5 text-right font-black text-oxford text-sm">${(it.quantity * it.price).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50/50">
                          <tr>
                            <td colSpan={3} className="p-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Subtotal Bruto</td>
                            <td className="p-5 text-right font-black text-oxford">${selected.totalUSD.toLocaleString()} USD</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Payment Proof Section */}
                  {selected.paymentStatus === "REPORTED" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="bg-blue-50 border-2 border-blue-100 p-8 rounded-[40px] space-y-6 mb-10"
                    >
                      <div className="flex justify-between items-center border-b border-blue-200 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="font-black text-blue-900 text-lg">Validación de Pago</h5>
                            <p className="text-xs text-blue-700 font-bold uppercase tracking-tight">El cliente ha reportado una transferencia</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="block text-[9px] font-black text-blue-400 uppercase">Método</span>
                          <span className="font-bold text-blue-900 uppercase">{selected.paymentMethod}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-black text-blue-400 uppercase">Referencia</span>
                          <span className="font-bold text-blue-900 underline">{selected.paymentReference || "N/A"}</span>
                        </div>
                      </div>
                      {(selected.paymentMethod === "KONTIGO" || selected.paymentMethod === "BINANCE") && (
                        <div className="mt-4">
                          <span className="block text-[9px] font-black text-blue-400 uppercase">QR del método</span>
                          {selected.paymentMethod === "KONTIGO" && paymentSettings?.kontigoQR && (
                            <img
                              src={paymentSettings.kontigoQR}
                              alt="QR Kontigo"
                              className="mt-2 w-full max-w-[220px] rounded-2xl border border-blue-100"
                            />
                          )}
                          {selected.paymentMethod === "BINANCE" && paymentSettings?.binanceQR && (
                            <img
                              src={paymentSettings.binanceQR}
                              alt="QR Binance"
                              className="mt-2 w-full max-w-[220px] rounded-2xl border border-blue-100"
                            />
                          )}
                          {((selected.paymentMethod === "KONTIGO" && !paymentSettings?.kontigoQR) ||
                            (selected.paymentMethod === "BINANCE" && !paymentSettings?.binanceQR)) && (
                            <p className="text-[10px] text-blue-600 font-bold mt-2">QR no configurado</p>
                          )}
                        </div>
                      )}
                          {selected.binanceTxHash && (
                            <div className="text-xs">
                              <span className="block text-[9px] font-black text-blue-400 uppercase">Hash Binance</span>
                              <span className="font-bold text-blue-900 break-all">{selected.binanceTxHash}</span>
                            </div>
                          )}

                          {selected.paymentProof && (
                            <div className="relative group cursor-pointer" onClick={() => setShowProof(true)}>
                              <div className="aspect-video w-full bg-blue-100 rounded-2xl overflow-hidden relative">
                                <img
                                  src={`${pbUrl}/api/files/orders/${selected.id}/${selected.paymentProof}`}
                                  alt="Proof"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="text-white w-8 h-8" />
                                </div>
                              </div>
                              <p className="text-[10px] text-blue-600 font-black text-center mt-2 uppercase tracking-widest">Click para ampliar comprobante</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-blue-400 uppercase block tracking-widest">Motivo de Rechazo (Opcional)</label>
                            <textarea
                              value={reason}
                              onChange={e => setReason(e.target.value)}
                              placeholder="Ej: Monto incompleto, imagen ilegible..."
                              className="w-full p-4 bg-white border border-blue-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-200/50 transition-all h-24"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => approve(selected.id)}
                              className="flex-1 bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-900/10 active:scale-95"
                            >
                              <CheckCircle className="w-4 h-4" /> Aprobar
                            </button>
                            <button
                              onClick={() => reject(selected.id)}
                              className="flex-1 bg-red-100 text-red-700 px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-200 transition-all active:scale-95"
                            >
                              <XCircle className="w-4 h-4" /> Rechazar
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="mb-10 bg-slate-50 border border-slate-100 rounded-[30px] p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Mensajería de la orden</h4>
                        <p className="text-xs text-slate-600 font-medium">Conversación directa con el cliente.</p>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {messagesLoading ? (
                        <p className="text-xs text-slate-500">Cargando mensajes...</p>
                      ) : orderMessages.length ? (
                        orderMessages.map((msg: any) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-2xl text-sm ${
                              msg.senderRole === "ADMIN"
                                ? "bg-purple-50 text-purple-900 border border-purple-100"
                                : "bg-white text-slate-800 border border-slate-200"
                            }`}
                          >
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                              <span>{msg.senderRole === "ADMIN" ? "Administrador" : "Cliente"}</span>
                              <span>{new Date(msg.createdAt).toLocaleString()}</span>
                            </div>
                            <p>{msg.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">Aún no hay mensajes en esta orden.</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Escribe un mensaje para el cliente..."
                        className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-2xl text-sm font-bold text-oxford outline-none focus:ring-4 focus:ring-slate-200/60"
                      />
                      <button
                        onClick={sendMessage}
                        className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/10"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fixed Footer Actions */}
                <div className="shrink-0 p-8 border-t border-gray-50 flex flex-wrap items-center justify-between gap-4 bg-white/50 backdrop-blur-sm">
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avance de Estado:</span>
                    <div className="flex flex-wrap gap-2">
                      {selected.status === "CONFIRMED" && (
                        <button
                          onClick={() => advanceStatus(selected.id, "PREPARING")}
                          className="bg-purple text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-navy transition-all shadow-xl shadow-purple/10"
                        >
                          <Package className="w-4 h-4" /> Iniciar Preparación
                        </button>
                      )}

                      {selected.status === "PREPARING" && (
                        <button
                          onClick={() => advanceStatus(selected.id, "SHIPPED")}
                          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/10"
                        >
                          <Truck className="w-4 h-4" /> Marcar como Enviado
                        </button>
                      )}

                      {selected.status === "SHIPPED" && (
                        <button
                          onClick={() => advanceStatus(selected.id, "DELIVERED")}
                          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/10"
                        >
                          <CheckCircle className="w-4 h-4" /> Confirmar Entrega
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 ml-auto">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cambiar estado:</label>
                      <select
                        value={statusChoice}
                        onChange={(e) => {
                          const nextStatus = e.target.value;
                          setStatusChoice(nextStatus);
                          if (nextStatus !== selected.status) {
                            advanceStatus(selected.id, nextStatus);
                          }
                        }}
                        className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-black text-oxford outline-none focus:ring-2 focus:ring-purple/20"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    {(selected.status !== "CANCELLED" && selected.status !== "DELIVERED") && (
                      <button
                        onClick={() => advanceStatus(selected.id, "CANCELLED")}
                        className="text-red-400 font-black text-[10px] uppercase tracking-widest hover:text-red-600 transition-all flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-xl"
                      >
                        <XCircle className="w-3 h-3" /> Cancelar Orden
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Proof Modal */}
      <Modal
        isOpen={showProof}
        onClose={() => setShowProof(false)}
        title="Comprobante de Pago"
        maxWidth="max-w-4xl"
      >
        {selected?.paymentProof && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
              <img
                src={`${pbUrl}/api/files/orders/${selected.id}/${selected.paymentProof}`}
                alt="Full Proof"
                className="w-full h-auto max-h-[70vh] object-contain mx-auto"
              />
            </div>
            <div className="flex gap-4 w-full">
              <a
                href={`${pbUrl}/api/files/orders/${selected.id}/${selected.paymentProof}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black text-center text-sm hover:bg-gray-200 transition-all"
              >
                Abrir en nueva pestaña
              </a>
              <button
                onClick={() => setShowProof(false)}
                className="flex-1 bg-oxford text-white py-4 rounded-2xl font-black text-sm hover:bg-navy transition-all"
              >
                Cerrar Vista
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
