import ProductCard from '@/components/cards/ProductCard'

const MOCK_PRODUCTS = [
  {
    id: '1',
    slug: 'laptop-executive-pro',
    name: 'Laptop Executive Pro',
    price: 1200,
    stock: 15,
    isPreorder: false,
  },
  {
    id: '2',
    slug: 'smartphone-nexus-z',
    name: 'Smartphone Nexus Z',
    price: 850,
    stock: 0,
    isPreorder: true,
    arrivalDate: '2026-02-15T00:00:00.000Z',
  },
  {
    id: '3',
    slug: 'wireless-headphones',
    name: 'Wireless Headphones',
    price: 150,
    stock: 45,
    isPreorder: false,
  },
  {
    id: '4',
    slug: 'mechanical-keyboard-rgb',
    name: 'Mechanical Keyboard RGB',
    price: 110,
    stock: 5,
    isPreorder: false,
  },
]

export default function CatalogPage() {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_PRODUCTS.map((p) => (
          <ProductCard 
            key={p.id} 
            id={p.id}
            name={p.name}
            slug={p.slug}
            price={p.price}
            stock={p.stock}
            isPreorder={p.isPreorder}
            arrivalDate={p.arrivalDate}
          />
        ))}
      </div>
    </div>
  )
}
