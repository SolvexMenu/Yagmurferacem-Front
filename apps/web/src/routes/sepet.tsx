import { createFileRoute, Link } from '@tanstack/react-router'
import { useLocalCart } from '@/state/cart'
import { useGuestCart } from '@/hooks/use-guest-cart'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import Loader from '@/components/loader'

export const Route = createFileRoute('/sepet')({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    updateQuantity,
    removeItem,
    clearCart,
    items: localItems // Add this to ensure component re-renders on cart changes
  } = useLocalCart()

  const guestCart = useGuestCart()

  if (guestCart.isLoading) {
    return <Loader />
  }

  if (guestCart.isEmpty || guestCart.data.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingBag />
            </EmptyMedia>
            <EmptyTitle>Sepetiniz boş</EmptyTitle>
            <EmptyDescription>
              Henüz sepetinize ürün eklemediniz.
            </EmptyDescription>
          </EmptyHeader>
          <Link to="/urunler" search={{ d: undefined, q: undefined }}>
            <Button className="mt-4">Alışverişe Başla</Button>
          </Link>
        </Empty>
      </div>
    )
  }

  const { items, totalPrice, totalItems } = guestCart.data

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sepetim ({totalItems} ürün)</h1>
        <Button
          variant="outline"
          onClick={clearCart}
          className="text-red-500 hover:text-red-700"
        >
          Sepeti Temizle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sepet Ürünleri */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item: any) => (
            <div
              key={item?.id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={item?.product.imageUrls[0] || '/placeholder.jpg'}
                  alt={item?.product.name}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                  {item?.product.name}
                </h3>

                {/* Variants */}
                <div className="flex flex-wrap gap-3 mb-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Beden: {item?.Size?.size}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Renk: {item?.Color?.color}
                      </span>
                </div>
                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-gray-900">
                    {item?.unitPrice}₺
                  </span>
                  {item?.product.discount && (
                    <span className="text-sm text-gray-500 line-through">
                      {item.product.price}₺
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls & Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-white"
                    onClick={() => updateQuantity(item.productId, item.sizeId, item.colorId, item.quantity - 1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-gray-900">
                    {item.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-white"
                    onClick={() => updateQuantity(item.productId, item.sizeId, item.colorId, item.quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Total Price & Remove */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {item.totalPrice}₺
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    onClick={() => removeItem(item.productId, item.sizeId, item.colorId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sipariş Özeti */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Sipariş Özeti</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Ürünlerin Toplamı:</span>
                <span>{totalPrice}₺</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Toplam:</span>
                <span>{totalPrice}₺</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link to="/urun/pay">
                <Button className="w-full">
                  Siparişi tamamla
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}