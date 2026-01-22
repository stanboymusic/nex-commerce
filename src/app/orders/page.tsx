'use client'

import { useState, useEffect } from 'react'
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
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'text-amber-600 bg-amber-50',
  PAYMENT_REPORTED: 'text-blue-600 bg-blue-50',
  CONFIRMED: 'text-green-600 bg-green-50',
  PREPARING: 'text-purple-600 bg-purple-50',
  SHIPPED: 'text-indigo-600 bg-indigo-50',
  DELIVERED: 'text-emerald-600 bg-emerald-50',
  CANCELLED: 'text-red-600 bg-red-50',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Esperando Pago',
  PAYMENT_REPORTED: 'Pago Reportado',
  CONFIRMED: 'Confirmada',
  PREPARING: 'En Preparación',
  SHIPPED: 'Enviada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
}

import { Suspense } from 'react'

function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user, token } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)

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

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportingId || !reference.trim()) return

    setSubmitting(true)
    try {
      await axios.post(`/api/orders/${reportingId}/report-payment`, { reference }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setReportingId(null)
      setReference('')
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

      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-oxford mb-2">No tienes pedidos aún</h2>
          <p className="text-gray-500 mb-6">Cuando realices un pedido, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const StatusIcon = STATUS_ICONS[order.status] || AlertCircle
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-50">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Orden #{order.id.slice(-8)}</p>
                      <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${STATUS_COLORS[order.status]}`}>
                        <StatusIcon className="h-4 w-4" />
                        {STATUS_LABELS[order.status]}
                      </div>
                      <div className="text-right">
                        <span className="block text-xl font-bold text-oxford">${order.total.toLocaleString()}</span>
                        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-500 uppercase">{order.currency}</span>
                      </div>
                    </div>
                  </div>

                  {order.status === 'PENDING_PAYMENT' && (
                    <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      {reportingId === order.id ? (
                        <form onSubmit={handleReportPayment} className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Referencia de pago..."
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="flex-grow px-4 py-2 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                            required
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors disabled:opacity-50"
                          >
                            {submitting ? 'Enviando...' : 'Confirmar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportingId(null)}
                            className="text-amber-600 px-2 text-sm font-bold"
                          >
                            Cancelar
                          </button>
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

                  {order.status === 'PAYMENT_REPORTED' && order.paymentReference && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2 text-blue-800">
                      <CheckCircle className="h-5 w-5" />
                      <p className="text-sm font-medium">Pago reportado (Ref: {order.paymentReference}). Esperando verificación.</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-50 rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold text-oxford">{item.product.name}</p>
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
