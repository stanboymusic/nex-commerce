'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { 
  ShoppingBag, 
  ChevronDown, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package, 
  XCircle,
  Banknote,
  Search,
  Filter
} from 'lucide-react'

type OrderStatus = 'PENDING_PAYMENT' | 'PAYMENT_REPORTED' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

interface Order {
  id: string
  createdAt: string
  total: number
  paymentMethod: string
  currency: string
  status: OrderStatus
  paymentReference?: string
  binanceTxHash?: string
  user?: {
    name: string
    email?: string
    phone?: string
  }
}

import AdminLayout from '@/components/admin/AdminLayout'

export default function AdminOrdersPage() {
  const { user, token } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusMessages, setStatusMessages] = useState<Record<string, string>>({})
  const [statusVisibility, setStatusVisibility] = useState<Record<string, boolean>>({})

  const fetchOrders = useCallback(async () => {
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
  }, [token])

  useEffect(() => {
    setMounted(true)
    if (user && user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchOrders()
  }, [user, router, fetchOrders])

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId)
    try {
      const message = statusMessages[orderId]
      const visible = statusVisibility[orderId]
      await axios.patch(`/api/orders/${orderId}`, {
        status: newStatus,
        statusMessage: message,
        statusVisible: visible !== false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Refresh local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (error) {
      alert('Error al actualizar el estado')
    } finally {
      setUpdatingId(null)
    }
  }

  if (!mounted || !user) return null

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-oxford tracking-tight">Ventas</h1>
          <p className="text-gray-400 font-medium mt-1">Controla y procesa las ventas de NexCommerce</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por ID o cliente..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple/20 transition-all shadow-sm"
            />
          </div>
          <button aria-label="Filtrar pedidos" className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 shadow-sm transition-colors">
            <Filter className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pedido</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pago / Moneda</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-purple/20 border-t-purple rounded-full animate-spin"></div>
                      Cargando pedidos...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center text-gray-400 font-medium">
                    No se encontraron pedidos.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-bold text-oxford">#{order.id.slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-gray-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-oxford">{order.user?.name || 'Cliente'}</div>
                      <div className="text-xs text-gray-400 font-medium">{order.user?.email || order.user?.phone}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-purple" />
                        <span className="text-sm font-bold text-oxford">{order.paymentMethod}</span>
                      </div>
                      <div className="flex flex-col gap-1 mt-1.5">
                        <span className="text-[10px] bg-gray-100 px-2.5 py-1 rounded-lg font-black text-gray-500 uppercase w-fit tracking-wider">{order.currency}</span>
                        {order.paymentReference && (
                          <span className="text-[10px] bg-blue-50 px-2.5 py-1 rounded-lg font-black text-blue-600 border border-blue-100 w-fit tracking-wider">
                            REF: {order.paymentReference}
                          </span>
                        )}
                        {order.binanceTxHash && (
                          <span className="text-[10px] bg-emerald-50 px-2.5 py-1 rounded-lg font-black text-emerald-700 border border-emerald-100 w-fit tracking-wider">
                            BINANCE: {order.binanceTxHash}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-oxford text-xl tracking-tight">${order.total.toLocaleString()}</div>
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="space-y-3">
                        <div className="relative inline-block w-full">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                            disabled={updatingId === order.id}
                            aria-label="Estado del pedido"
                            className="appearance-none w-full bg-white border border-gray-200 pl-4 pr-10 py-2.5 rounded-xl text-xs font-bold text-oxford outline-none focus:ring-2 focus:ring-purple/20 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                          >
                            <option value="PENDING_PAYMENT">Esperando Pago</option>
                            <option value="PAYMENT_REPORTED">Pago Reportado</option>
                            <option value="CONFIRMED">Confirmado</option>
                            <option value="PREPARING">En Preparación</option>
                            <option value="SHIPPED">Enviado</option>
                            <option value="DELIVERED">Entregado</option>
                            <option value="CANCELLED">Cancelado</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={statusMessages[order.id] || ''}
                            onChange={(e) => setStatusMessages(prev => ({ ...prev, [order.id]: e.target.value }))}
                            placeholder="Mensaje visible para el cliente (opcional)"
                            className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-medium text-oxford outline-none focus:ring-2 focus:ring-purple/20 transition-all"
                          />
                          <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={statusVisibility[order.id] !== false}
                              onChange={(e) => setStatusVisibility(prev => ({ ...prev, [order.id]: e.target.checked }))}
                              className="h-4 w-4 rounded border-gray-300 text-purple focus:ring-purple"
                            />
                            Visible para el cliente
                          </label>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}


function StatusBadge({ status }: { status: OrderStatus }) {
  const configs: Record<OrderStatus, { label: string, color: string, icon: any }> = {
    PENDING_PAYMENT: { label: 'Esperando Pago', color: 'bg-amber-100 text-amber-700', icon: Clock },
    PAYMENT_REPORTED: { label: 'Pago Reportado', color: 'bg-blue-100 text-blue-700', icon: ExternalLink },
    CONFIRMED: { label: 'Confirmado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    PREPARING: { label: 'En Preparación', color: 'bg-purple-100 text-purple-700', icon: Package },
    SHIPPED: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
    DELIVERED: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-700', icon: ShoppingBag },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
  }

  const config = configs[status] || configs.PENDING_PAYMENT
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  )
}
