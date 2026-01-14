'use client'

import ProductCard from '@/components/cards/ProductCard'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2 } from 'lucide-react'

// Define Product interface to match API response
interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  isPreorder: boolean
  arrivalDate?: string
  images: { id: string, url: string }[]
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products')
        setProducts(response.data)
      } catch (err) {
        console.error('Failed to fetch products:', err)
        setError('Error al cargar el catálogo')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-oxford" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-oxford">Nuestro Catálogo</h1>
          <p className="text-gray-500 mt-1">Explora nuestros productos premium disponibles.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters would go here */}
          <select aria-label="Ordenar productos" className="border border-gray-200 rounded-md px-3 py-2 text-sm text-oxford focus:outline-none focus:ring-2 focus:ring-almond">
            <option>Más recientes</option>
            <option>Precio: Menor a Mayor</option>
            <option>Precio: Mayor a Menor</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No hay productos disponibles en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={p.price}
              stock={p.stock}
              isPreorder={p.isPreorder}
              arrivalDate={p.arrivalDate}
              image={p.images?.[0]?.url || ''} // Use first image url if available
            />
          ))}
        </div>
      )}
    </div>
  )
}
