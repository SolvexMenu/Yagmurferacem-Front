import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LocalCartItem {
  productId: string
  quantity: number
  sizeId: string
  colorId: string
  // Ürün bilgilerini cache'lemek için
  product?: {
    id: string
    name: string
    price: number
    imageUrls: string[]
  }
  size?: {
    id: string
    size: number
  }
  color?: {
    id: string
    color: string
  }
}

interface LocalCartState {
  items: LocalCartItem[]
  addItem: (item: Omit<LocalCartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string, sizeId: string, colorId: string) => void
  updateQuantity: (productId: string, sizeId: string, colorId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemKey: (productId: string, sizeId: string, colorId: string) => string
}

export const useLocalCart = create<LocalCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const { items } = get()
        const existingItemIndex = items.findIndex(
          item => 
            item.productId === newItem.productId && 
            item.sizeId === newItem.sizeId && 
            item.colorId === newItem.colorId
        )

        if (existingItemIndex >= 0) {
          // Mevcut ürünün miktarını artır
          const updatedItems = [...items]
          updatedItems[existingItemIndex].quantity += newItem.quantity || 1
          set({ items: updatedItems })
        } else {
          // Yeni ürün ekle
          set({ 
            items: [...items, { ...newItem, quantity: newItem.quantity || 1 }] 
          })
        }
      },

      removeItem: (productId, sizeId, colorId) => {
        set(state => ({
          items: state.items.filter(
            item => !(
              item.productId === productId && 
              item.sizeId === sizeId && 
              item.colorId === colorId
            )
          )
        }))
      },

      updateQuantity: (productId, sizeId, colorId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, sizeId, colorId)
          return
        }

        set(state => ({
          items: state.items.map(item =>
            item.productId === productId && 
            item.sizeId === sizeId && 
            item.colorId === colorId
              ? { ...item, quantity }
              : item
          )
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.product?.price || 0
          return total + (price * item.quantity)
        }, 0)
      },

      getItemKey: (productId, sizeId, colorId) => {
        return `${productId}-${sizeId}-${colorId}`
      }
    }),
    {
      name: 'local-cart-storage',
      version: 1,
    }
  )
)