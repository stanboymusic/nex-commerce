import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { useAuthStore } from './auth.store'

export interface CartItem {
  id: string // Product ID
  name: string
  price: number
  quantity: number
  stock: number
  isPreorder: boolean
  image?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  loadFromBackend: () => Promise<void>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: async (newItem) => {
        const currentItems = get().items
        const existingItem = currentItems.find(item => item.id === newItem.id)

        // Optimistic update
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

        // Sync with backend if logged in
        const { user, token } = useAuthStore.getState()
        if (user && token) {
          try {
            await axios.post('/api/cart', {
              productId: newItem.id,
              quantity: newItem.quantity
            }, {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            })
          } catch (error) {
            console.error("Failed to sync cart add:", error)
          }
        }
      },

      removeItem: async (id) => {
        // Optimistic update
        set({ items: get().items.filter(item => item.id !== id) })

        // Sync with backend if logged in
        const { user, token } = useAuthStore.getState()
        if (user && token) {
          try {
            await axios.delete(`/api/cart?productId=${id}`, {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            })
          } catch (error) {
            console.error("Failed to sync cart remove:", error)
          }
        }
      },

      updateQuantity: async (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        // Optimistic update
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        })

        // Sync with backend if logged in
        const { user, token } = useAuthStore.getState()
        if (user && token) {
          try {
            await axios.put('/api/cart', {
              productId: id,
              quantity: quantity
            }, {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true
            })
          } catch (error) {
            console.error("Failed to sync cart update:", error)
          }
        }
      },

      clearCart: () => {
        set({ items: [] })
        // If logged in, we might want to clear backend too? 
        // Usually clearCart assumes clearing the session cart.
        // But if explicit "Clear Cart" button is pressed, yes.
        // For now, let's keep it local unless we add a clear endpoint.
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },

      loadFromBackend: async () => {
        try {
          const { token } = useAuthStore.getState()
          const response = await axios.get('/api/cart', token ? {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
          } : undefined);
          if (response.data && response.data.items) {
            // Replace local items with backend items to avoid "ghost items"
            // Or merge? User said "not in cache", implies backend is truth.
            set({ items: response.data.items });
          }
        } catch (error) {
          console.error("Failed to load cart from backend:", error);
        }
      }
    }),
    {
      name: 'cart-storage-v2', // Changed version to clear old ghost items
    }
  )
)
