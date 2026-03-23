import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "./ui/button"
import { ShoppingBag, ShoppingCart, Trash2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { orpc } from "@/utils/orpc"
import Loader from "./loader"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { Link } from "@tanstack/react-router"
import { useLocalCart } from "@/state/cart"
import { authClient } from "@/lib/auth-client"
import { useGuestCart } from "../hooks/use-guest-cart"

export default function CartMenu() {
    const { data: session } = authClient.useSession()
    const isLoggedIn = !!session?.user
    
    // Server sepeti (giriş yapmış kullanıcılar için)
    const serverCart = useQuery({
        ...orpc.cartRouter.getCart.queryOptions(),
        enabled: isLoggedIn
    })
    const removeServerItem = useMutation(orpc.cartRouter.removeItem.mutationOptions())
    const queryClient = useQueryClient()
    
    // Local sepet (giriş yapmamış kullanıcılar için)
    const { removeItem: removeLocalItem } = useLocalCart()
    const guestCart = useGuestCart()

    if (isLoggedIn && serverCart.isLoading) return <Loader />
    if (!isLoggedIn && guestCart.isLoading) return <Loader />

    // Hangi sepeti kullanacağımızı belirle
    const cartData = isLoggedIn ? serverCart.data : guestCart.data
    const items = cartData?.items ?? []
    const totalItems = cartData?.totalItems ?? 0

    async function removeItem(itemId?: string, productId?: string, sizeId?: string, colorId?: string) {
        if (isLoggedIn && itemId) {
            await removeServerItem.mutateAsync({ cartItemId: itemId });
            await queryClient.refetchQueries({ queryKey: orpc.cartRouter.getCart.queryKey() });
        } else if (!isLoggedIn && productId && sizeId && colorId) {
            removeLocalItem(productId, sizeId, colorId);
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size={"icon"} className="relative">
                    <ShoppingCart />
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                            {totalItems}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3">
                {items.length === 0 ? (
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
                        <div className="mt-4 flex justify-center">
                            <Link to="/urunler" search={{ d: undefined, q: undefined }}>
                                <Button size="sm">Alışverişe Başla</Button>
                            </Link>
                        </div>
                    </Empty>
                ) : (
                    <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                        {items.map((item: any) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 border-b pb-2 last:border-b-0"
                            >
                                <div className="relative w-14 h-14 rounded overflow-hidden">
                                    <img
                                        src={item.product.imageUrls[0] || '/placeholder.jpg'}
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
                                        {item.quantity} × {item.unitPrice || item.product.price}₺
                                    </p>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => {
                                        if (isLoggedIn) {
                                            removeItem(item.id)
                                        } else {
                                            removeItem(undefined, item.productId, item.sizeId, item.colorId)
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
                {items.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <span className="font-semibold">
                            Toplam: {cartData?.totalPrice || 0}₺
                        </span>
                        {isLoggedIn ? (
                            <Link to="/profil/cart">
                                <Button size="sm">Sepeti görüntüle</Button>
                            </Link>
                        ) : (
                            <Link to="/sepet">
                                <Button size="sm">Sepeti görüntüle</Button>
                            </Link>
                        )}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}