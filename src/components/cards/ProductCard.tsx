'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Plus, Minus, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCartStore } from '@/store/cart.store'

interface ProductCardProps {
  id: string;
  name: string;
  slug: string; // OBLIGATORIO
  price: number;
  stock: number;
  isPreorder: boolean;
  arrivalDate?: string;
  image?: string;
}

export default function ProductCard({ id, name, slug, price, image, stock, isPreorder, arrivalDate }: ProductCardProps) {
  const { addItem } = useCartStore()

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      image: image || '',
      stock,
      isPreorder,
      quantity: 1
    })
  }
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full transition-all hover:shadow-xl hover:border-almond/50"
    >
      <Link href={`/product/${slug}`} className="relative h-56 w-full block bg-muted/30">
        {image ? (
          <Image 
            src={image} 
            alt={name} 
            fill 
            className="object-contain p-4"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-gray-400">
            <span className="text-sm font-medium">Sin imagen</span>
          </div>
        )}
        
        {isPreorder && (
          <div className="absolute top-3 right-3 bg-purple text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase shadow-lg backdrop-blur-sm">
            Preventa
          </div>
        )}
        
        {stock === 0 && !isPreorder && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase shadow-lg">
            Agotado
          </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex-grow">
          <Link href={`/product/${slug}`} className="text-oxford font-bold text-lg hover:text-purple transition-colors line-clamp-1">
            {name}
          </Link>
          
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-oxford">
              ${price.toLocaleString()}
            </span>
          </div>

          <div className="mt-3">
            {isPreorder ? (
              <div className="inline-flex items-center text-[11px] font-semibold text-purple bg-purple/10 px-2 py-1 rounded-md">
                <Info className="h-3 w-3 mr-1" />
                Disponible el {arrivalDate ? new Date(arrivalDate).toLocaleDateString() : 'Próximamente'}
              </div>
            ) : (
              <div className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-md ${
                stock > 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
              }`}>
                {stock > 0 ? `${stock} en stock` : 'Sin stock disponible'}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button 
            onClick={handleAddToCart}
            disabled={stock === 0 && !isPreorder}
            className="w-full bg-oxford text-white py-3 px-4 rounded-xl text-sm font-bold hover:bg-navy disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            {isPreorder ? 'Reservar' : 'Añadir al carrito'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
