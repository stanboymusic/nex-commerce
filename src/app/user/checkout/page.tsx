'use client'

import { useCartStore } from '@/store/cart.store'
import { useAuthStore } from '@/store/auth.store'
import { useRefreshCurrentUser } from '@/hooks/useRefreshCurrentUser'
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
  CheckCircle2,
  Coins
} from 'lucide-react'
import Link from 'next/link'

type Currency = 'COP' | 'USD'
type PaymentMethod = 'KONTIGO' | 'BINANCE' | 'CASH_COP' | 'CASH_USD'

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore()
  const { token, user } = useAuthStore()
  const router = useRouter()
  useRefreshCurrentUser()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rate, setRate] = useState<number>(0)

  // Form State
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [currency, setCurrency] = useState<Currency>('COP')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_COP')
  const [binanceTxHash, setBinanceTxHash] = useState('')
  const [binanceProof, setBinanceProof] = useState<File | null>(null)
  const [binanceProofPreview, setBinanceProofPreview] = useState<string | null>(null)
  const [kontigoReference, setKontigoReference] = useState('')
  const [kontigoProof, setKontigoProof] = useState<File | null>(null)
  const [kontigoProofPreview, setKontigoProofPreview] = useState<string | null>(null)
  const [paymentSettings, setPaymentSettings] = useState<{
    kontigoQr: string | null
    kontigoInstructions: string
    binanceQr: string | null
    binanceInstructions: string
    kontigoActive?: boolean
    binanceActive?: boolean
    vipDiscountPercent?: number
    vipEnabled?: boolean
  } | null>(null)

  useEffect(() => {
    setMounted(true)
    if (mounted && !user) {
      router.push('/login?redirect=/checkout')
    }

    const fetchSettings = async () => {
      try {
        const { data } = await axios.get("/api/settings");
        setRate(data.usdToCopRate || 4000);
        setPaymentSettings({
          kontigoQr: data.kontigoQR,
          kontigoInstructions: data.kontigoInstructions || "Reporta tu pago adjuntando el comprobante.",
          kontigoActive: data.kontigoActive !== false,
          binanceQr: data.binanceQR,
          binanceInstructions: data.binanceInstructions || "Escanea el QR, realiza el pago en Binance y reporta el comprobante.",
          binanceActive: data.binanceActive !== false,
          vipDiscountPercent: Number(data.vipDiscountPercent ?? 0),
          vipEnabled: data.vipEnabled !== false
        });
      } catch (err) {
        console.error("Error fetching settings", err);
      }
    }

    if (mounted) {
      fetchSettings();
    }
  }, [mounted, user, router])

  useEffect(() => {
    if (!paymentSettings) return;
    if (currency === 'USD') {
      if (paymentMethod === 'KONTIGO' && !paymentSettings.kontigoQr) {
        setPaymentMethod('CASH_USD')
      }
      if (paymentMethod === 'BINANCE' && !paymentSettings.binanceQr) {
        setPaymentMethod('CASH_USD')
      }
    }
    if (currency === 'USD') {
      if (paymentMethod === 'KONTIGO' && paymentSettings.kontigoActive === false) {
        setPaymentMethod('CASH_USD')
      }
      if (paymentMethod === 'BINANCE' && paymentSettings.binanceActive === false) {
        setPaymentMethod('CASH_USD')
      }
    }
  }, [paymentSettings, currency, paymentMethod])

  if (!mounted || !user) return null
  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  const getConvertedTotal = () => {
    const baseTotal = getTotal(); // USD base
    const vipRate = user?.isVip && paymentSettings?.vipEnabled !== false && (paymentSettings?.vipDiscountPercent || 0) > 0
      ? Math.min(Math.max(Number(paymentSettings?.vipDiscountPercent || 0), 0), 90) / 100
      : 0;
    const discountedTotal = baseTotal * (1 - vipRate);
    if (currency === 'USD') return discountedTotal;
    return discountedTotal * rate; // to COP
  }

  const handlePlaceOrder = async () => {
    if (!address) {
      setError('La dirección de envío es obligatoria')
      return
    }
    const kontigoEnabled = !!paymentSettings?.kontigoQr && paymentSettings?.kontigoActive !== false
    const binanceEnabled = !!paymentSettings?.binanceQr && paymentSettings?.binanceActive !== false

    if (paymentMethod === 'KONTIGO' && !kontigoEnabled) {
      setError('El método Kontigo no está disponible en este momento')
      return
    }
    if (paymentMethod === 'BINANCE' && !binanceEnabled) {
      setError('El método Binance no está disponible en este momento')
      return
    }
    if (paymentMethod === 'KONTIGO' && !kontigoProof) {
      setError('Debes subir el comprobante de pago para continuar')
      return
    }
    if (paymentMethod === 'BINANCE' && (!binanceTxHash || !binanceProof)) {
      setError('Debes ingresar el hash y subir el comprobante de Binance')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/orders', {
        items,
        // Send explicit totals and currency info
        currency,
        paymentMethod,
        address,
        notes,
        binanceTxHash: paymentMethod === 'BINANCE' ? binanceTxHash : undefined,
        kontigoReference: paymentMethod === 'KONTIGO' ? (kontigoReference || 'PENDING') : undefined,
        estimatedDelivery: undefined
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      })

      const orderId = response.data.order.id;

      // Handle payment methods
      if (paymentMethod === 'KONTIGO') {
        const formData = new FormData();
        if (kontigoReference) formData.append('reference', kontigoReference);
        if (kontigoProof) formData.append('paymentProof', kontigoProof);

        await axios.post(`/api/orders/${orderId}/report-payment`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        });
      }

      if (paymentMethod === 'BINANCE') {
        const formData = new FormData();
        formData.append('binanceTxHash', binanceTxHash);
        if (binanceProof) formData.append('paymentProof', binanceProof);

        await axios.post(`/api/orders/${orderId}/report-payment`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        });
      }

      clearCart()
      router.push(`/orders?id=${orderId}&success=true`)
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
                <span className="block font-bold text-oxford text-sm">Pesos</span>
                <span className="text-xs text-gray-500">COP</span>
              </button>
              <button
                onClick={() => { setCurrency('USD'); setPaymentMethod('CASH_USD'); }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${currency === 'USD' ? 'border-purple bg-purple/5' : 'border-gray-100'}`}
              >
                <span className="block font-bold text-oxford text-sm">Dólares</span>
                <span className="text-xs text-gray-500">USD</span>
              </button>
            </div>
          </section>


          {paymentMethod === 'BINANCE' && paymentSettings?.binanceQr && paymentSettings?.binanceActive !== false && (
            <section className="space-y-4 border-2 border-emerald-100 rounded-xl p-6 bg-emerald-50/40">
              <h3 className="font-bold text-oxford flex items-center gap-2">
                <Coins className="text-emerald-600 w-5 h-5" />
                Instrucciones de Pago Binance
              </h3>

              <div className="flex justify-center py-4">
                <img src={paymentSettings.binanceQr} alt="QR Binance" className="max-w-[200px] rounded-xl border border-gray-200 shadow-sm" />
              </div>

              <p className="text-sm text-gray-600 whitespace-pre-wrap text-center">
                {paymentSettings.binanceInstructions || "Escanea el QR y reporta tu pago"}
              </p>

              <div className="pt-4 border-t border-emerald-100 space-y-4">
                <div>
                  <label htmlFor="binanceTxHash" className="text-sm font-bold text-oxford mb-2 block cursor-pointer">Hash de transacción Binance</label>
                  <input
                    id="binanceTxHash"
                    type="text"
                    value={binanceTxHash}
                    onChange={(e) => setBinanceTxHash(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-200 outline-none bg-white"
                    placeholder="Ingresa el hash de la transacción..."
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-oxford mb-2 block">Comprobante de pago (obligatorio)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setBinanceProof(file);
                      setBinanceProofPreview(file ? URL.createObjectURL(file) : null);
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 transition-all cursor-pointer"
                  />
                  {binanceProofPreview && (
                    <div className="mt-3 flex justify-center">
                      <img
                        src={binanceProofPreview}
                        alt="Comprobante de Binance"
                        className="max-w-[220px] rounded-xl border border-gray-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {paymentMethod === 'KONTIGO' && paymentSettings?.kontigoQr && paymentSettings?.kontigoActive !== false && (
            <section className="space-y-4 border-2 border-purple/10 rounded-xl p-6 bg-purple/5">
              <h3 className="font-bold text-oxford flex items-center gap-2">
                <CreditCard className="text-purple w-5 h-5" />
                Instrucciones de Pago
              </h3>

              <div className="flex justify-center py-4">
                <img src={paymentSettings.kontigoQr} alt="QR de pago" className="max-w-[200px] rounded-xl border border-gray-200 shadow-sm" />
              </div>

              <p className="text-sm text-gray-600 whitespace-pre-wrap text-center">
                {paymentSettings.kontigoInstructions || "Escanea el QR y reporta el pago"}
              </p>

              <div className="pt-4 border-t border-purple/10">
                <label htmlFor="kontigoReference" className="text-sm font-bold text-oxford mb-2 block cursor-pointer">Referencia de pago (Opcional)</label>
                <input
                  id="kontigoReference"
                  type="text"
                  value={kontigoReference}
                  onChange={(e) => setKontigoReference(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 outline-none bg-white"
                  placeholder="Número de comprobante..."
                />
                <div className="mt-3">
                  <label className="text-sm font-bold text-oxford mb-2 block">Comprobante de pago (opcional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setKontigoProof(file);
                      setKontigoProofPreview(file ? URL.createObjectURL(file) : null);
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-purple/10 file:text-purple hover:file:bg-purple/20 transition-all cursor-pointer"
                  />
                  {kontigoProofPreview && (
                    <div className="mt-3 flex justify-center">
                      <img
                        src={kontigoProofPreview}
                        alt="Comprobante de pago"
                        className="max-w-[220px] rounded-xl border border-gray-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-bold text-oxford mb-6 flex items-center gap-3">
              <Wallet className="text-purple" /> Método de Pago
            </h2>
            <div className="space-y-3">
              {currency === 'COP' && (
                <>
                  <PaymentOption
                    title="Efectivo COP"
                    description="Paga al reportar tu comprobante"
                    selected={paymentMethod === 'CASH_COP'}
                    onClick={() => setPaymentMethod('CASH_COP')}
                    icon={<Banknote className="w-5 h-5" />}
                  />
                </>
              )}

              {currency === 'USD' && (
                <>
                  <PaymentOption
                    title="Efectivo USD"
                    description="Paga al reportar tu comprobante"
                    selected={paymentMethod === 'CASH_USD'}
                    onClick={() => setPaymentMethod('CASH_USD')}
                    icon={<Banknote className="w-5 h-5" />}
                  />
                  {paymentSettings?.binanceQr && paymentSettings?.binanceActive !== false && (
                    <PaymentOption
                      title="Binance"
                      description="Paga con USDT de forma segura"
                      selected={paymentMethod === 'BINANCE'}
                      onClick={() => setPaymentMethod('BINANCE')}
                      icon={<Coins className="w-5 h-5" />}
                    />
                  )}
                  {paymentSettings?.kontigoQr && paymentSettings?.kontigoActive !== false && (
                    <PaymentOption
                      title="Kontigo"
                      description="Paga con USDC (equivale a USD)"
                      selected={paymentMethod === 'KONTIGO'}
                      onClick={() => setPaymentMethod('KONTIGO')}
                      icon={<CreditCard className="w-5 h-5" />}
                    />
                  )}
                </>
              )}
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
              {items.map((item) => {
                const vipRate = user?.isVip && paymentSettings?.vipEnabled !== false && (paymentSettings?.vipDiscountPercent || 0) > 0
                  ? Math.min(Math.max(Number(paymentSettings?.vipDiscountPercent || 0), 0), 90) / 100
                  : 0;
                const baseItemTotal = item.price * item.quantity;
                const discountedItemTotal = baseItemTotal * (1 - vipRate);
                const convertedItemTotal = currency === 'COP' ? discountedItemTotal * rate : discountedItemTotal;

                return (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex gap-3">
                      <span className="font-bold text-purple">{item.quantity}x</span>
                      <span className="text-oxford line-clamp-1">{item.name}</span>
                    </div>
                    <span className="font-semibold">
                      {currency === 'USD' ? '$' : ''}
                      {convertedItemTotal.toLocaleString(undefined, { minimumFractionDigits: currency === 'COP' ? 0 : 2, maximumFractionDigits: currency === 'COP' ? 0 : 2 })}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="space-y-3 py-6 border-t border-b mb-6">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>
                  {currency === 'USD' ? '$' : ''}
                  {(() => {
                    const baseTotal = getTotal();
                    const subtotal = currency === 'USD' ? baseTotal : baseTotal * rate;
                    return subtotal.toLocaleString(undefined, { minimumFractionDigits: currency === 'COP' ? 0 : 2, maximumFractionDigits: currency === 'COP' ? 0 : 2 });
                  })()}
                  <span className="ml-1 text-[10px]">{currency}</span>
                </span>
              </div>
              {user?.isVip && paymentSettings?.vipEnabled !== false && (paymentSettings?.vipDiscountPercent || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Descuento VIP (-{paymentSettings?.vipDiscountPercent}%)</span>
                  <span>
                    {currency === 'USD' ? '$' : ''}
                    {(() => {
                      const baseTotal = getTotal();
                      const vipRate = Math.min(Math.max(Number(paymentSettings?.vipDiscountPercent || 0), 0), 90) / 100;
                      const discount = baseTotal * vipRate;
                      const converted = currency === 'USD' ? discount : discount * rate;
                      return converted.toLocaleString(undefined, { minimumFractionDigits: currency === 'COP' ? 0 : 2, maximumFractionDigits: currency === 'COP' ? 0 : 2 });
                    })()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Envío</span>
                <span className="text-gray-400 font-bold uppercase text-xs">Por definir</span>
              </div>
              <div className="flex justify-between text-2xl font-black text-oxford pt-2">
                <span>Total</span>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {currency === 'USD' && <span className="text-xl">$</span>}
                    <span>{getConvertedTotal().toLocaleString(undefined, { minimumFractionDigits: currency === 'COP' ? 0 : 2, maximumFractionDigits: currency === 'COP' ? 0 : 2 })}</span>
                  </div>
                  <span className="block text-xs font-medium text-gray-400">{currency}</span>
                </div>
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

interface PaymentOptionProps {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

function PaymentOption({ title, description, selected, onClick, icon }: PaymentOptionProps) {
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
