'use client'

import ProductCard from '@/components/cards/ProductCard'
import { useState, useEffect, useMemo } from 'react'
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
  estimatedArrivalDate?: string
  images: { id: string, url: string }[]
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("recent")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const sortProducts = (list: Product[], sort: string) => {
    const sorted = [...list]
    if (sort === "price-asc") {
      sorted.sort((a, b) => a.price - b.price)
    } else if (sort === "price-desc") {
      sorted.sort((a, b) => b.price - a.price)
    } else {
      // Default to ID/Created order (assuming API returns recent first)
      // Since we don't have 'created' in the interface, we'll keep API order
    }
    return sorted
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get('/api/products'),
          axios.get('/api/categories')
        ])
        setProducts(sortProducts(productsRes.data, sortBy))
        setCategories(categoriesRes.data)
      } catch (err) {
        console.error('Failed to fetch initial data:', err)
        setError('Error al cargar la información')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const handleCategoryChange = async (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    setLoading(true)
    try {
      const url = categoryId ? `/api/products?category=${categoryId}` : '/api/products'
      const response = await axios.get(url)
      setProducts(sortProducts(response.data, sortBy))
    } catch (err) {
      console.error('Failed to filter products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setProducts(sortProducts(products, sort))
  }

  const visibleProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products
    }

    const normalizedSearch = searchTerm.trim().toLowerCase()
    return products.filter((product) => {
      const name = product.name?.toLowerCase() ?? ""
      const slug = product.slug?.toLowerCase() ?? ""
      return name.includes(normalizedSearch) || slug.includes(normalizedSearch)
    })
  }, [products, searchTerm])

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
          <p className="text-sm text-gray-400 mt-2">
            {visibleProducts.length} producto{visibleProducts.length === 1 ? "" : "s"} encontrado{visibleProducts.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="relative flex items-center">
            <span className="sr-only">Buscar productos</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o slug"
              className="border border-gray-200 rounded-md px-3 py-2 text-sm text-oxford focus:outline-none focus:ring-2 focus:ring-almond transition-all bg-white w-60"
            />
          </label>
          <select
            aria-label="Filtrar por categoría"
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-oxford focus:outline-none focus:ring-2 focus:ring-almond transition-all bg-white"
            value={selectedCategory || ""}
            onChange={(e) => handleCategoryChange(e.target.value || null)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            aria-label="Ordenar productos"
            className="border border-gray-200 rounded-md px-3 py-2 text-sm text-oxford focus:outline-none focus:ring-2 focus:ring-almond transition-all bg-white"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="recent">Más recientes</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No hay productos disponibles en este momento.
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No encontramos productos con ese criterio.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleProducts.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={p.price}
              stock={p.stock}
              isPreorder={p.isPreorder}
              estimatedArrivalDate={p.estimatedArrivalDate}
              categoryName={(p as any).category?.name}
              image={p.images?.[0]?.url || ''} // Use first image url if available
            />
          ))}
        </div>
      )}
    </div>
  )
}
