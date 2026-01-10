import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  stock: number
  isPreorder: boolean
  image?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => {
        const currentItems = get().items
        const existingItem = currentItems.find(item => item.id === newItem.id)
        
        if (existingItem) {
          set({
            items: currentItems.map(item => 
              item.id === newItem.id 
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            )
          })
        } else {
          set({ items: [...currentItems, newItem] })
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter(item => item.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        
        set({
          items: get().items.map(item => 
            item.id === id ? { ...item, quantity } : item
          )
        })
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      }
    }),
    {
      name: 'cart-storage',
    }
  )
)
