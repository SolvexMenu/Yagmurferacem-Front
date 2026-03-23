import { useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { useLocalCart } from '@/state/cart'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '@/utils/orpc'

export function useCartSync() {
  const { data: session } = authClient.useSession()
  const { items: localItems, clearCart } = useLocalCart()
  const addToServerCart = useMutation(orpc.cartRouter.addItem.mutationOptions())
  const queryClient = useQueryClient()

  useEffect(() => {
    const syncCart = async () => {
      // Kullanıcı giriş yaptı ve localStorage'da ürün var
      if (session?.user && localItems.length > 0) {
        try {
          console.log('Syncing local cart to server...', localItems)
          
          // Her ürünü server sepetine ekle
          for (const item of localItems) {
            await addToServerCart.mutateAsync({
              productId: item.productId,
              sizeId: item.sizeId,
              colorId: item.colorId,
              quantity: item.quantity
            })
          }

          // Başarılı olursa localStorage sepetini temizle
          clearCart()
          
          // Server sepetini yenile
          await queryClient.invalidateQueries({ 
            queryKey: orpc.cartRouter.getCart.queryKey() 
          })
          
          console.log('Cart sync completed successfully')
        } catch (error) {
          console.error('Failed to sync cart:', error)
        }
      }
    }

    syncCart()
  }, [session?.user, localItems.length]) // Sadece giriş durumu ve sepet ürün sayısı değiştiğinde çalış

  return null
}