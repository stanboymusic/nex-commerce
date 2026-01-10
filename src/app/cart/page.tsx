'use client'

import { useCartStore } from '@/store/cart.store'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import axios from 'axios'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const { token, user } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleGoToCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/cart')
      return
    }
    router.push('/checkout')
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-almond/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="h-10 w-10 text-oxford" />
        </div>
        <h2 className="text-2xl font-bold text-oxford mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-8">Parece que aún no has añadido ningún producto.</p>
        <Link 
          href="/catalog" 
          className="inline-flex items-center gap-2 bg-oxford text-white px-6 py-3 rounded-md font-bold hover:bg-navy transition-colors"
        >
          Ir al Catálogo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-oxford mb-10">Tu Carrito</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="relative h-24 w-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                )}
              </div>
              
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-oxford text-lg">{item.name}</h3>
                    {item.isPreorder && (
                      <span className="text-[10px] font-bold text-purple uppercase">Preventa</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label="Eliminar producto"
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-oxford">
                    ${(item.price * item.quantity).toLocaleString()}
                  </span>
                  
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-10">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Disminuir cantidad"
                      className="px-3 hover:bg-gray-50 transition-colors border-r border-gray-200"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-4 font-bold text-oxford min-w-[40px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Aumentar cantidad"
                      className="px-3 hover:bg-gray-50 transition-colors border-l border-gray-200"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={clearCart}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" /> Limpiar carrito
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-oxford text-white p-8 rounded-2xl shadow-xl sticky top-24">
            <h2 className="text-xl font-bold mb-6 pb-6 border-b border-white/10">Resumen del Pedido</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>${getTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Envío</span>
                <span className="text-green-400 font-medium">Gratis</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-almond">${getTotal().toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 text-xs text-red-400 bg-red-400/10 p-2 rounded">
                {error}
              </div>
            )}

            <button 
              onClick={handleGoToCheckout}
              disabled={loading}
              className="w-full bg-almond text-oxford py-4 rounded-xl font-bold text-lg hover:bg-white transition-all active:scale-95 shadow-lg shadow-black/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Continuar al Pago
            </button>
            
            <p className="mt-4 text-center text-xs text-gray-400">
              Al crear la orden, la empresa recibirá tu solicitud para procesar el pedido.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
