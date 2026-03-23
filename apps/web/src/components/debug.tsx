import { orpc } from "@/utils/orpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { button, useControls } from "leva";
import { AddProductModal } from "./miim";
import { useState } from "react";
import { requestNotificationPermission } from "@/utils/firebase";
import { authClient } from "@/lib/auth-client";

export default function DebugStuff() {
    const add = useMutation(orpc.cartRouter.addItem.mutationOptions())
    const cls = useMutation(orpc.cartRouter.clearCart.mutationOptions())
    const payment = useMutation(orpc.paytrRouter.createPaymentToken.mutationOptions())
    const uniqCategories = useQuery(orpc.productRouter.getCategories.queryOptions({ enabled: false }))
    const queryClient = useQueryClient()
    const session = authClient.useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);

    useControls("Cart system", {
        // colorId: "",
        // productId: "",
        // quantity: 1,
        // sizeId: "",
        // addToCart: button(async () => {
        //     await add.mutateAsync({
        //         colorId: "cmg7y6puk0004tf78s2nn2cez",
        //         productId: "cmg7y6puk0000tf78gwxukxx4",
        //         quantity: 1,
        //         sizeId: "cmg7y6puk0003tf78b5mqh87q"
        //     })
        //     await queryClient.refetchQueries({ queryKey: orpc.cartRouter.getCart.queryKey() })
        // }),
        clearCart: button(() => {
            cls.mutate({})
        }),
        openModal: button(() => {
            setIsModalOpen(true)
        })
    })

    useControls("Notification System", {
        requestPermission: button(() => {
            requestNotificationPermission(session.data?.user.id || "")
        })
    })

    useControls("Backend RPC", {
        getCategories: button(() => {
            uniqCategories.refetch()

            console.log(uniqCategories.data)
        })
    })

    return (
        <>
            <AddProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProductAdd={(product) => console.log(product)}
            />
        </>
    )
}