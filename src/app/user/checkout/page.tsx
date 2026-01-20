'use client'

import { useCartStore } from '@/store/cart.store'
import { useAuthStore } from '@/store/auth.store'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import {
  CreditCard,
  MapPin,
  Wallet,
  Banknote,
  Truck,
  ArrowLeft,
  Loader2,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

type Currency = 'COP' | 'USD'
type PaymentMethod = 'KONTIGO' | 'CASH_COP' | 'CASH_USD' | 'CASH_ON_DELIVERY'

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore()
  const { token, user } = useAuthStore()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [currency, setCurrency] = useState<Currency>('COP')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_COP')

  useEffect(() => {
    setMounted(true)
    if (mounted && !user) {
      router.push('/login?redirect=/checkout')
    }
  }, [mounted, user, router])

  if (!mounted || !user) return null
  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  const handlePlaceOrder = async () => {
    if (!address) {
      setError('La dirección de envío es obligatoria')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/orders', {
        items,
        total: getTotal(),
        paymentMethod,
        currency,
        address,
        notes
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true // Ensure cookies are sent if relying on them
      })

      clearCart()
      router.push(`/orders?id=${response.data.order.id}&success=true`)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Error al procesar el pedido')
      } else {
        setError('Error al procesar el pedido')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link href="/cart" className="inline-flex items-center text-sm text-gray-500 hover:text-oxford mb-8 group">
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Volver al carrito
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Checkout Form */}
        <div className="space-y-10">
          <section>
            <label htmlFor="address" className="text-2xl font-bold text-oxford mb-6 flex items-center gap-3 cursor-pointer">
              <MapPin className="text-purple" /> Dirección de Envío
            </label>
            <textarea
              id="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-almond outline-none min-h-[100px] transition-all"
              placeholder="Ingresa tu dirección exacta..."
            />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-oxford mb-6 flex items-center gap-3">
              <Banknote className="text-purple" /> Moneda de Pago
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setCurrency('COP'); setPaymentMethod('CASH_COP'); }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${currency === 'COP' ? 'border-purple bg-purple/5' : 'border-gray-100'}`}
              >
                <span className="block font-bold text-oxford">Pesos Colombianos</span>
                <span className="text-sm text-gray-500">COP</span>
              </button>
              <button
                onClick={() => { setCurrency('USD'); setPaymentMethod('CASH_USD'); }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${currency === 'USD' ? 'border-purple bg-purple/5' : 'border-gray-100'}`}
              >
                <span className="block font-bold text-oxford">Dólares</span>
                <span className="text-sm text-gray-500">USD</span>
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-oxford mb-6 flex items-center gap-3">
              <Wallet className="text-purple" /> Método de Pago
            </h2>
            <div className="space-y-3">
              <PaymentOption
                id="KONTIGO"
                title="Kontigo"
                description="Paga con tarjeta o transferencia local"
                selected={paymentMethod === 'KONTIGO'}
                onClick={() => setPaymentMethod('KONTIGO')}
                icon={<CreditCard className="w-5 h-5" />}
              />
              <PaymentOption
                id={currency === 'COP' ? 'CASH_COP' : 'CASH_USD'}
                title={currency === 'COP' ? 'Efectivo COP' : 'Efectivo USD'}
                description="Paga al reportar tu comprobante"
                selected={paymentMethod === 'CASH_COP' || paymentMethod === 'CASH_USD'}
                onClick={() => setPaymentMethod(currency === 'COP' ? 'CASH_COP' : 'CASH_USD')}
                icon={<Banknote className="w-5 h-5" />}
              />
              <PaymentOption
                id="CASH_ON_DELIVERY"
                title="Contraentrega"
                description="Paga al recibir tus productos"
                selected={paymentMethod === 'CASH_ON_DELIVERY'}
                onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                icon={<Truck className="w-5 h-5" />}
              />
            </div>
          </section>

          <section>
            <label htmlFor="notes" className="text-xl font-bold text-oxford mb-4 block cursor-pointer">Notas adicionales (opcional)</label>
            <input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 rounded-xl border border-gray-200 outline-none"
              placeholder="Alguna instrucción especial..."
            />
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sticky top-24">
            <h2 className="text-xl font-bold text-oxford mb-6 border-b pb-4">Tu Pedido</h2>
            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex gap-3">
                    <span className="font-bold text-purple">{item.quantity}x</span>
                    <span className="text-oxford line-clamp-1">{item.name}</span>
                  </div>
                  <span className="font-semibold">${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 py-6 border-t border-b mb-6">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>${getTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Envío</span>
                <span className="text-green-600">Gratis</span>
              </div>
              <div className="flex justify-between text-2xl font-black text-oxford pt-2">
                <span>Total</span>
                <span>${getTotal().toLocaleString()} <span className="text-xs font-medium text-gray-400">{currency}</span></span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-oxford text-white py-4 rounded-xl font-bold text-lg hover:bg-navy transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-oxford/20"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Confirmar Pedido
                </>
              )}
            </button>

            <p className="mt-6 text-center text-xs text-gray-400">
              Al confirmar, un asesor se pondrá en contacto contigo para coordinar el pago y la entrega.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentOption({ id, title, description, selected, onClick, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left ${selected ? 'border-purple bg-purple/5 ring-1 ring-purple' : 'border-gray-100 hover:border-gray-200'
        }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selected ? 'bg-purple text-white' : 'bg-gray-100 text-gray-500'}`}>
        {icon}
      </div>
      <div>
        <span className="block font-bold text-oxford">{title}</span>
        <span className="text-xs text-gray-500">{description}</span>
      </div>
      {selected && <CheckCircle2 className="w-5 h-5 text-purple ml-auto" />}
    </button>
  )
}
