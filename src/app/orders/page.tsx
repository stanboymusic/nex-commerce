'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth.store'
import axios from 'axios'
import { Package, Clock, CheckCircle, Truck, XCircle, AlertCircle, ExternalLink, ShoppingBag, Banknote, PartyPopper } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

const STATUS_ICONS: Record<string, any> = {
  PENDING_PAYMENT: Clock,
  PAYMENT_REPORTED: ExternalLink,
  CONFIRMED: CheckCircle,
  PREPARING: Package,
  SHIPPED: Truck,
  DELIVERED: ShoppingBag,
  CANCELLED: XCircle,
  REJECTED: AlertCircle,
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'text-amber-600 bg-amber-50',
  PAYMENT_REPORTED: 'text-blue-600 bg-blue-50',
  CONFIRMED: 'text-green-600 bg-green-50',
  PREPARING: 'text-purple-600 bg-purple-50',
  SHIPPED: 'text-indigo-600 bg-indigo-50',
  DELIVERED: 'text-emerald-600 bg-emerald-50',
  CANCELLED: 'text-red-600 bg-red-50',
  REJECTED: 'text-red-700 bg-red-100',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Esperando Pago',
  PAYMENT_REPORTED: 'Pago Reportado',
  CONFIRMED: 'Confirmada',
  PREPARING: 'En Preparación',
  SHIPPED: 'Enviada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
  REJECTED: 'Pago Rechazado',
}

import { Suspense } from 'react'

function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reference, setReference] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { user, token } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [openChatId, setOpenChatId] = useState<string | null>(null)
  const [messagesByOrder, setMessagesByOrder] = useState<Record<string, any[]>>({})
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({})
  const [messagesLoadingId, setMessagesLoadingId] = useState<string | null>(null)
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string>>({})
  const [messageSummary, setMessageSummary] = useState<Record<string, any>>({})
  const lastAlertedRef = useRef<Record<string, string>>({})

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchOrders()
  }, [user, token, router])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('orderMessagesLastSeen')
      if (stored) {
        setLastSeenMap(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id?.slice(-6)?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesMethod = methodFilter === 'ALL' || order.paymentMethod === methodFilter;
    const orderDate = new Date(order.createdAt || order.created);
    const fromOk = !dateFrom || orderDate >= new Date(dateFrom);
    const toOk = !dateTo || orderDate <= new Date(`${dateTo}T23:59:59`);
    return matchesSearch && matchesStatus && matchesMethod && fromOk && toOk;
  });

  const handleDownloadReceipt = async (orderId: string) => {
    try {
      const response = await axios.get(`/api/orders/${orderId}/receipt`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orden-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('No se pudo descargar el comprobante.');
    }
  };

  const loadMessages = async (orderId: string) => {
    try {
      setMessagesLoadingId(orderId);
      const res = await axios.get(`/api/orders/${orderId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessagesByOrder((prev) => ({ ...prev, [orderId]: res.data || [] }));
    } catch (error) {
      alert('No se pudieron cargar los mensajes.');
    } finally {
      setMessagesLoadingId(null);
    }
  };

  const fetchMessageSummary = async (orderIds: string[]) => {
    if (!orderIds.length) return;
    try {
      const res = await axios.post(
        '/api/orders/messages-summary',
        { orderIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessageSummary(res.data || {});
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!orders.length) return;
    const orderIds = orders.map((o) => o.id);
    fetchMessageSummary(orderIds);
    const interval = setInterval(() => fetchMessageSummary(orderIds), 15000);
    return () => clearInterval(interval);
  }, [orders, token]);

  const markMessagesSeen = (orderId: string) => {
    const now = new Date().toISOString()
    const next = { ...lastSeenMap, [orderId]: now }
    setLastSeenMap(next)
    try {
      localStorage.setItem('orderMessagesLastSeen', JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const sendMessage = async (orderId: string) => {
    const message = (messageDrafts[orderId] || '').trim();
    if (!message) return;
    try {
      await axios.post(`/api/orders/${orderId}/messages`, { message }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessageDrafts((prev) => ({ ...prev, [orderId]: '' }));
      await loadMessages(orderId);
      markMessagesSeen(orderId);
    } catch (error) {
      alert('No se pudo enviar el mensaje.');
    }
  };

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!orders.length) return;
    let shouldPlay = false;
    for (const order of orders) {
      const summary = messageSummary[order.id];
      if (!summary?.lastMessageAt) continue;
      const lastSeen = lastSeenMap[order.id] ? new Date(lastSeenMap[order.id]).getTime() : 0;
      const lastMessageAt = new Date(summary.lastMessageAt).getTime();
      const isFromAdmin = summary.lastSenderRole === 'ADMIN';
      if (isFromAdmin && lastMessageAt > lastSeen) {
        const lastAlerted = lastAlertedRef.current[order.id];
        if (lastAlerted !== summary.lastMessageAt) {
          lastAlertedRef.current[order.id] = summary.lastMessageAt;
          shouldPlay = true;
        }
      }
    }
    if (shouldPlay) {
      playNotificationSound();
    }
  }, [messageSummary, lastSeenMap, orders]);

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportingId || !reference.trim()) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('reference', reference)
      if (file) formData.append('paymentProof', file)

      await axios.post(`/api/orders/${reportingId}/report-payment`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setReportingId(null)
      setReference('')
      setFile(null)
      fetchOrders()
    } catch (error) {
      alert('Error al reportar el pago')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-oxford">Cargando pedidos...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {showSuccess && (
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <PartyPopper className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-900">¡Pedido realizado con éxito!</h3>
            <p className="text-green-700">Tu orden ha sido registrada. Pronto nos pondremos en contacto contigo.</p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="ml-auto text-green-600 hover:text-green-800 font-bold"
          >
            Cerrar
          </button>
        </div>
      )}
      <h1 className="text-3xl font-bold text-oxford mb-8">Mis Pedidos</h1>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Buscar orden</label>
            <input
              type="text"
              placeholder="Código o ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="ALL">Todos</option>
              {Object.keys(STATUS_LABELS).map((key) => (
                <option key={key} value={key}>{STATUS_LABELS[key]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Método</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="KONTIGO">Kontigo</option>
              <option value="BINANCE">Binance</option>
              <option value="CASH_COP">Efectivo COP</option>
              <option value="CASH_USD">Efectivo USD</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Mostrando {filteredOrders.length} de {orders.length} pedidos
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setMethodFilter('ALL');
              setDateFrom('');
              setDateTo('');
            }}
            className="text-xs font-bold text-oxford hover:text-purple transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-oxford mb-2">
            {orders.length === 0 ? 'No tienes pedidos aún' : 'Sin resultados'}
          </h2>
          <p className="text-gray-500 mb-6">
            {orders.length === 0
              ? 'Cuando realices un pedido, aparecerá aquí.'
              : 'No hay pedidos que coincidan con los filtros.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const StatusIcon = STATUS_ICONS[order.status] || AlertCircle
            const history = (order.statusHistory?.length
              ? order.statusHistory
              : [{
                  id: `${order.id}-current`,
                  status: order.status,
                  message: STATUS_LABELS[order.status],
                  createdAt: order.updatedAt || order.createdAt
                }])
            const summary = messageSummary[order.id];
            const lastSeen = lastSeenMap[order.id] ? new Date(lastSeenMap[order.id]).getTime() : 0;
            const lastMessageAt = summary?.lastMessageAt ? new Date(summary.lastMessageAt).getTime() : 0;
            const hasNewMessage = summary?.lastSenderRole === 'ADMIN' && lastMessageAt > lastSeen;
            return (
              <div key={order.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${hasNewMessage ? 'order-new-highlight' : ''}`}>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-50">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Orden #{order.id.slice(-6).toUpperCase()}</p>
                      <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                      {order.estimatedDeliveryDate && (
                        <p className="text-xs text-emerald-600 font-bold mt-2">
                          Fecha asignada de entrega: {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${STATUS_COLORS[order.status]}`}>
                        <StatusIcon className="h-4 w-4" />
                        {STATUS_LABELS[order.status]}
                      </div>
                      {hasNewMessage ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200 animate-pulse">
                          1 nuevo
                        </span>
                      ) : null}
                      {typeof order.shippingCost === 'number' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
                          Envío asignado
                        </span>
                      )}
                      <button
                        onClick={() => handleDownloadReceipt(order.id)}
                        className="text-xs font-bold text-oxford border border-oxford/20 px-3 py-1.5 rounded-full hover:bg-oxford/5 transition-colors"
                      >
                        Descargar PDF
                      </button>
                      <div className="text-right">
                        <span className="block text-xl font-bold text-oxford">
                          ${order.totalUSD?.toLocaleString()} USD
                        </span>
                        {order.totalLocal && (
                          <span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded font-bold text-blue-600 uppercase">
                            ≈ ${order.totalLocal?.toLocaleString()} COP
                          </span>
                        )}
                        {typeof order.shippingCost === 'number' ? (
                          <span className="block text-[10px] bg-emerald-50 px-2 py-0.5 rounded font-bold text-emerald-700 uppercase mt-2">
                            Envío: ${order.shippingCost.toLocaleString()} {order.currency}
                          </span>
                        ) : (
                          <span className="block text-[10px] text-gray-400 font-bold uppercase mt-2">
                            Envío por definir
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {order.status === 'PENDING_PAYMENT' && (
                    <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      {reportingId === order.id ? (
                        <form onSubmit={handleReportPayment} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-amber-800 uppercase">Referencia de Pago</label>
                              <input
                                type="text"
                                placeholder="Ej: Transacción #12345"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-amber-800 uppercase">Comprobante (Imagen)</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="w-full px-4 py-1.5 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setReportingId(null)
                                setFile(null)
                              }}
                              className="text-amber-600 px-4 py-2 text-sm font-bold hover:text-amber-800"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={submitting}
                              className="bg-amber-600 text-white px-8 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {submitting ? 'Enviando...' : 'Confirmar Reporte'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-amber-800">
                            <Banknote className="h-5 w-5" />
                            <p className="text-sm font-medium">Por favor, reporta tu pago para procesar la orden.</p>
                          </div>
                          <button
                            onClick={() => setReportingId(order.id)}
                            className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
                          >
                            Reportar Pago
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {order.status === 'PAYMENT_REPORTED' && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                      <div className="flex items-center gap-2 text-blue-800">
                        <CheckCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">Pago reportado correctamente. Esperando verificación.</p>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-blue-600 font-medium">
                        {order.paymentReference && <span>Ref: {order.paymentReference}</span>}
                        {order.paymentReportedAt && <span>Fecha: {new Date(order.paymentReportedAt).toLocaleString()}</span>}
                        {order.paymentProof && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_POCKETBASE_URL || ''}/api/files/orders/${order.id}/${order.paymentProof}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 underline"
                          >
                            Ver comprobante <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {order.status === 'REJECTED' && (
                    <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-red-800">
                          <XCircle className="h-5 w-5" />
                          <div>
                            <p className="text-sm font-bold">Pago Rechazado</p>
                            <p className="text-xs">Hubo un problema con tu pago. Por favor, intenta de nuevo o contacta a soporte.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setReportingId(order.id)}
                          className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                        >
                          Reintentar Reporte
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-sm font-black text-oxford uppercase tracking-wider mb-4">Seguimiento del pedido</h3>
                    <div className="space-y-4">
                      {history.map((event: any, index: number) => {
                        const Icon = STATUS_ICONS[event.status] || AlertCircle
                        const isLast = index === history.length - 1
                        return (
                          <div key={event.id} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${STATUS_COLORS[event.status] || 'text-gray-500 bg-gray-100'}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              {!isLast && <div className="w-px flex-1 bg-gray-200 mt-2" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-oxford">
                                {STATUS_LABELS[event.status] || 'Estado actualizado'}
                              </p>
                              {event.message && (
                                <p className="text-sm text-gray-500 mt-1">{event.message}</p>
                              )}
                              {event.createdAt && (
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(event.createdAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mb-8 bg-slate-50 border border-slate-100 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-black text-oxford uppercase tracking-wider">Mensajería de la orden</h3>
                        <p className="text-xs text-slate-500">Comunicación directa con el administrador.</p>
                      </div>
                      <button
                        onClick={() => {
                          const next = openChatId === order.id ? null : order.id;
                          setOpenChatId(next);
                          if (next) {
                            loadMessages(order.id);
                            markMessagesSeen(order.id);
                          }
                        }}
                        className={`text-xs font-bold text-oxford border border-oxford/20 px-3 py-1.5 rounded-full hover:bg-oxford/5 transition-colors ${hasNewMessage ? 'animate-pulse' : ''}`}
                      >
                        {openChatId === order.id ? 'Ocultar' : 'Ver mensajes'}
                      </button>
                    </div>

                    {openChatId === order.id && (
                      <div className="space-y-4">
                        <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                          {messagesLoadingId === order.id ? (
                            <p className="text-xs text-slate-500">Cargando mensajes...</p>
                          ) : (messagesByOrder[order.id]?.length ? (
                            messagesByOrder[order.id].map((msg: any) => {
                              const lastSeen = lastSeenMap[order.id] ? new Date(lastSeenMap[order.id]).getTime() : 0
                              const createdAt = new Date(msg.createdAt).getTime()
                              const isNew = msg.senderRole === 'ADMIN' && createdAt > lastSeen
                              return (
                              <div
                                key={msg.id}
                                className={`p-3 rounded-xl text-sm border transition-all ${
                                  msg.senderRole === 'ADMIN'
                                    ? 'bg-purple-50 text-purple-900 border-purple-100'
                                    : 'bg-white text-slate-800 border-slate-200'
                                } ${isNew ? 'ring-2 ring-purple/30 shadow-sm' : ''}`}
                              >
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                  <span className={isNew ? 'text-purple-700' : ''}>{msg.senderRole === 'ADMIN' ? 'Administrador' : 'Cliente'}</span>
                                  <span>{new Date(msg.createdAt).toLocaleString()}</span>
                                </div>
                                {isNew && (
                                  <span className="inline-flex text-[9px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mb-2 animate-pulse">
                                    Nuevo
                                  </span>
                                )}
                                <p>{msg.message}</p>
                              </div>
                            )})
                          ) : (
                            <p className="text-xs text-slate-500">Aún no hay mensajes en esta orden.</p>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={messageDrafts[order.id] || ''}
                            onChange={(e) => setMessageDrafts((prev) => ({ ...prev, [order.id]: e.target.value }))}
                            placeholder="Escribe tu mensaje..."
                            className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium text-oxford outline-none focus:ring-4 focus:ring-slate-200/60"
                          />
                          <button
                            onClick={() => sendMessage(order.id)}
                            className="bg-oxford text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-navy transition-colors"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-50 rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold text-oxford">{item.product?.name || item.name || 'Producto'}</p>
                          <p className="text-xs text-gray-500">Cantidad: {item.quantity} x ${item.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-oxford">Cargando pedidos...</div>}>
      <OrdersContent />
    </Suspense>
  )
}
