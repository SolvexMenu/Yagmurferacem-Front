import Loader from '@/components/loader'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { orpc } from '@/utils/orpc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'

export const Route = createFileRoute('/profil/cart')({
  component: RouteComponent,
})

function RouteComponent() {
  const cart = useQuery(orpc.cartRouter.getCart.queryOptions())
  const remove = useMutation(orpc.cartRouter.removeItem.mutationOptions())
  const queryClient = useQueryClient()

  async function removeItem(itemId: string) {
    await remove.mutateAsync({ cartItemId: itemId });
    await queryClient.refetchQueries({ queryKey: orpc.cartRouter.getCart.queryKey() });
  }

  if (cart.isLoading) return <Loader />

  return (
    <div className="py-8 min-h-screen">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className='text-3xl mb-4'>Sepetim</h3>

        <div className='flex flex-col space-y-4'>
          <ScrollArea className='max-h-96'>
            {cart.data?.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b pb-2 mt-2 last:border-b-0"
              >
                <div className="relative size-24 rounded overflow-hidden">
                  <img
                    src={item.product.imageUrls[0]}
                    alt={item.product.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.Size ? `Beden: ${item.Size.size} ` : ""}
                    {item.Color ? `Renk: ${item.Color.color}` : ""}
                  </p>
                  <p className="text-sm">
                    {item.quantity} × {item.product.price}₺
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </ScrollArea>
        </div>

        <div className='absolute right-2'>
          <Link to="/urun/pay">
            <Button>Ödemeye ilerle</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
