'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { ShoppingCart, Plus, Minus, Calendar, Package, AlertCircle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCartStore } from '@/store/cart.store'
import { useAuthStore } from '@/store/auth.store'
import axios from 'axios'

export default function ProductDetailsPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [requestingStock, setRequestingStock] = useState(false)
  const [requested, setRequested] = useState(false)
  
  const { addItem } = useCartStore()
  const { user, token } = useAuthStore()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`)
        setProduct(response.data)
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchProduct()
  }, [id])

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-oxford">Cargando producto...</div>
  if (!product) return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-oxford">Producto no encontrado</div>


  const handleIncrement = () => {
    if (product.isPreorder || quantity < product.stock) {
      setQuantity(prev => prev + 1)
    }
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      isPreorder: product.isPreorder,
      quantity
    })
  }

  const handleRequestStock = async () => {
    if (!user) return alert('Debes iniciar sesión')
    setRequestingStock(true)
    try {
      await axios.post('/api/stock-requests', { productId: product.id }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRequested(true)
    } catch (error) {
      alert('Error al enviar solicitud')
    } finally {
      setRequestingStock(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Section */}
        <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {product.images && product.images.length > 0 ? (
            <Image 
              src={product.images[0].url} 
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="h-32 w-32 opacity-20" />
            </div>
          )}
          {product.isPreorder && (
            <div className="absolute top-4 left-4 bg-purple text-white px-4 py-1 rounded-full font-bold uppercase text-sm tracking-wider">
              Preventa
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold text-oxford mb-4">{product.name}</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {product.description}
          </p>

          <div className="mb-8">
            <span className="text-3xl font-bold text-oxford">${product.price.toLocaleString()}</span>
          </div>

          <div className="space-y-6 mb-10">
            {product.isPreorder ? (
              <div className="bg-purple/5 border border-purple/20 p-4 rounded-xl">
                <div className="flex items-center text-purple font-semibold mb-2">
                  <Calendar className="h-5 w-5 mr-2" />
                  Información de Preventa
                </div>
                <ul className="text-sm text-purple/80 space-y-1">
                  <li>Llegada a almacén: {new Date(product.arrivalDate!).toLocaleDateString()}</li>
                  <li>Entrega estimada: {new Date(product.estimatedDelivery!).toLocaleDateString()}</li>
                </ul>
              </div>
            ) : (
              <div className={`flex items-center ${product.stock > 0 ? 'text-green-600' : 'text-red-500'} font-semibold`}>
                <Package className="h-5 w-5 mr-2" />
                {product.stock > 0 ? `${product.stock} unidades en stock` : 'Agotado'}
              </div>
            )}

            {product.stock === 0 && !product.isPreorder && (
              requested ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Solicitud enviada con éxito
                </div>
              ) : (
                <button 
                  onClick={handleRequestStock}
                  disabled={requestingStock}
                  className="flex items-center gap-2 text-navy hover:underline text-sm font-medium disabled:opacity-50"
                >
                  <AlertCircle className="h-4 w-4" />
                  {requestingStock ? 'Enviando...' : 'Solicitar notificación cuando haya stock'}
                </button>
              )
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* Quantity Selector */}
            <div className="flex items-center border border-gray-200 rounded-lg h-12">
              <button
                onClick={handleDecrement}
                aria-label="Disminuir cantidad"
                className="px-4 hover:bg-gray-50 h-full transition-colors border-r border-gray-200"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-6 font-bold text-oxford min-w-[60px] text-center">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                aria-label="Aumentar cantidad"
                className="px-4 hover:bg-gray-50 h-full transition-colors border-l border-gray-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={product.stock === 0 && !product.isPreorder}
              className="w-full sm:flex-1 bg-oxford text-white h-12 rounded-lg font-bold flex items-center justify-center gap-3 hover:bg-navy disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-oxford/10"
            >
              <ShoppingCart className="h-5 w-5" />
              Añadir al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
