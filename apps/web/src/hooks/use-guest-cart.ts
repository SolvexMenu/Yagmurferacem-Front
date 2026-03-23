import { useQuery } from '@tanstack/react-query'
import { useLocalCart } from '@/state/cart'
import { orpc } from '@/utils/orpc'

export function useGuestCart() {
    const { items: localItems } = useLocalCart()

    // LocalStorage'daki ürünlerin detaylarını server'dan çek
    const { data: cartData, isLoading } = useQuery({
        queryKey: ['guest-cart', localItems.map(item => ({
            productId: item.productId,
            sizeId: item.sizeId,
            colorId: item.colorId,
            quantity: item.quantity // Include quantity in queryKey to trigger updates
        }))],
        queryFn: async () => {
            if (localItems.length === 0) return { items: [], totalPrice: 0, totalItems: 0 }

            const products = await orpc.guestOrderRouter.getProductsForCart.call(
                localItems.map(item => ({
                    productId: item.productId,
                    sizeId: item.sizeId,
                    colorId: item.colorId
                }))
            )

            // LocalStorage ürünleri ile server'dan gelen ürün bilgilerini birleştir
            const enrichedItems = localItems.map(localItem => {
                const product = products.find(p => p.id === localItem.productId)
                if (!product) return null

                const price = product.discount
                    ? product.price - (product.price * product.discount / 100)
                    : product.price

                return {
                    id: `${localItem.productId}-${localItem.sizeId}-${localItem.colorId}`,
                    productId: localItem.productId,
                    quantity: localItem.quantity,
                    sizeId: localItem.sizeId,
                    colorId: localItem.colorId,
                    product: {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        imageUrls: product.imageUrls,
                        discount: product.discount
                    },
                    Size: product.selectedSize ? {
                        id: product.selectedSize.id,
                        size: product.selectedSize.size
                    } : null,
                    Color: product.selectedColor ? {
                        id: product.selectedColor.id,
                        color: product.selectedColor.color
                    } : null,
                    unitPrice: price,
                    totalPrice: price * localItem.quantity
                }
            }).filter(Boolean)

            const totalPrice = enrichedItems.reduce((sum, item) => sum + (item?.totalPrice || 0), 0)
            const totalItems = enrichedItems.reduce((sum, item) => sum + (item?.quantity || 0), 0)

            return {
                items: enrichedItems,
                totalPrice,
                totalItems
            }
        },
        enabled: localItems.length > 0,
        staleTime: 0 // Always refetch when queryKey changes
    })

    return {
        data: cartData || { items: [], totalPrice: 0, totalItems: 0 },
        isLoading,
        isEmpty: localItems.length === 0
    }
}