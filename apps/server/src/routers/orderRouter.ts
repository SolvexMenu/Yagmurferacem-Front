import { db } from "@/drizzle/db";
import { cart, cartItem, order, orderItem, product, productVariant, size, color, user } from "@/drizzle/schema";
import { protectedProcedure, publicProcedure, userProcedure } from "@/lib/orpc";
import { eq, ne, desc, and } from "drizzle-orm";
import { sendNotificationToToken } from "@/lib/firebase-admin";
import z from "zod";

const placeOrderSchema = z.object({
    shippingAddress: z.string().min(10, "Teslimat adresi en az 10 karakter olmalıdır"),
    billingAddress: z.string().optional(),
    phoneNumber: z.string().min(10, "Telefon numarası geçerli olmalıdır"),
    notes: z.string().optional()
});

export const orderRouter = {
    placeOrder: userProcedure
        .input(placeOrderSchema)
        .handler(async ({ context, input }) => {
            const userId = context.session.user.id;

            // Get user's cart with items
            const userCart = await db
                .select()
                .from(cart)
                .where(eq(cart.userId, userId))
                .limit(1);

            if (!userCart.length) {
                throw new Error("Sepetiniz boş");
            }

            const cartItems = await db
                .select({
                    cartItem,
                    product,
                    variant: productVariant,
                    size,
                    color
                })
                .from(cartItem)
                .leftJoin(product, eq(cartItem.productId, product.id))
                .leftJoin(productVariant, eq(cartItem.variantId, productVariant.id))
                .leftJoin(size, eq(cartItem.sizeId, size.id))
                .leftJoin(color, eq(cartItem.colorId, color.id))
                .where(eq(cartItem.cartId, userCart[0].id));

            if (!cartItems.length) {
                throw new Error("Sepetiniz boş");
            }

            // Calculate total amount
            let totalAmount = 0;
            for (const item of cartItems) {
                const price = item.product!.discount
                    ? item.product!.price - (item.product!.price * item.product!.discount / 100)
                    : item.product!.price;
                totalAmount += price * item.cartItem.quantity;
            }

            // Create order and copy cart items to order
            const result = await db.transaction(async (tx) => {
                // Create the order
                const newOrder = await tx
                    .insert(order)
                    .values({
                        id: crypto.randomUUID(),
                        trackingId: "",
                        totalAmount,
                        shippingAddress: input.shippingAddress,
                        billingAddress: input.billingAddress,
                        phoneNumber: input.phoneNumber,
                        notes: input.notes,
                        userId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })
                    .returning();

                // Create new order items
                const orderItemsData = cartItems.map(item => ({
                    id: crypto.randomUUID(),
                    productId: item.cartItem.productId,
                    variantId: item.cartItem.variantId,
                    quantity: item.cartItem.quantity,
                    sizeId: item.cartItem.sizeId,
                    colorId: item.cartItem.colorId,
                    orderId: newOrder[0].id,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));

                // Insert order items
                await tx.insert(orderItem).values(orderItemsData);

                // Clear the original cart items
                await tx
                    .delete(cartItem)
                    .where(eq(cartItem.cartId, userCart[0].id));

                // Get order items with relations for return
                const orderItemsWithRelations = await tx
                    .select({
                        orderItem,
                        product,
                        variant: productVariant,
                        size,
                        color
                    })
                    .from(orderItem)
                    .leftJoin(product, eq(orderItem.productId, product.id))
                    .leftJoin(productVariant, eq(orderItem.variantId, productVariant.id))
                    .leftJoin(size, eq(orderItem.sizeId, size.id))
                    .leftJoin(color, eq(orderItem.colorId, color.id))
                    .where(eq(orderItem.orderId, newOrder[0].id));

                return {
                    ...newOrder[0],
                    items: orderItemsWithRelations
                };
            });

            // Sipariş oluşturulduğunda bildirim gönder
            const userData = await db
                .select({ fcmToken: user.fcmToken, name: user.name })
                .from(user)
                .where(eq(user.id, userId))
                .limit(1);

            if (userData[0]?.fcmToken) {
                try {
                    await sendNotificationToToken(userData[0].fcmToken, {
                        title: '🛍️ Sipariş Oluşturuldu',
                        body: `Merhaba ${userData[0].name}, siparişiniz başarıyla oluşturuldu. Toplam: ${totalAmount}₺`,
                        data: {
                            orderId: result.id,
                            totalAmount: totalAmount.toString(),
                            type: 'order_created'
                        }
                    });
                    console.log(`Order creation notification sent for order ${result.id}`);
                } catch (error) {
                    console.error('Failed to send order creation notification:', error);
                }
            }

            return {
                success: true,
                orderId: result.id,
                trackingId: result.trackingId,
                totalAmount: result.totalAmount
            };
        }),

    getMyOrders: userProcedure.handler(async ({ context }) => {
        const orders = await db
            .select()
            .from(order)
            .where(eq(order.userId, context.session.user.id))
            .orderBy(desc(order.createdAt));

        // Get order items for each order
        const ordersWithItems = await Promise.all(
            orders.map(async (orderRecord) => {
                const items = await db
                    .select({
                        orderItem,
                        product,
                        variant: productVariant,
                        size,
                        color
                    })
                    .from(orderItem)
                    .leftJoin(product, eq(orderItem.productId, product.id))
                    .leftJoin(productVariant, eq(orderItem.variantId, productVariant.id))
                    .leftJoin(size, eq(orderItem.sizeId, size.id))
                    .leftJoin(color, eq(orderItem.colorId, color.id))
                    .where(eq(orderItem.orderId, orderRecord.id));

                return {
                    ...orderRecord,
                    items
                };
            })
        );

        return ordersWithItems;
    }),

    getOrderById: userProcedure
        .input(z.string())
        .handler(async ({ context, input }) => {
            const orderRecord = await db
                .select({
                    order,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                })
                .from(order)
                .leftJoin(user, eq(order.userId, user.id))
                .where(eq(order.id, input))
                .limit(1);

            if (!orderRecord.length) {
                throw new Error("Sipariş bulunamadı");
            }

            const items = await db
                .select({
                    orderItem,
                    product,
                    variant: productVariant,
                    size,
                    color
                })
                .from(orderItem)
                .leftJoin(product, eq(orderItem.productId, product.id))
                .leftJoin(productVariant, eq(orderItem.variantId, productVariant.id))
                .leftJoin(size, eq(orderItem.sizeId, size.id))
                .leftJoin(color, eq(orderItem.colorId, color.id))
                .where(eq(orderItem.orderId, input));

            return {
                ...orderRecord[0].order,
                User: orderRecord[0].user,
                items
            };
        }),

    getAllOrders: protectedProcedure
        .handler(async () => {
            const orders = await db
                .select({
                    order,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                })
                .from(order)
                .leftJoin(user, eq(order.userId, user.id))
                .where(and(
                    // ne(order.status, "DELIVERED"),
                    ne(order.status, "CANCELLED"),
                    ne(order.status, "FAILED")
                ))
                .orderBy(desc(order.createdAt));

            // Get order items for each order
            const ordersWithItems = await Promise.all(
                orders.map(async (orderRecord) => {
                    const items = await db
                        .select({
                            orderItem,
                            product,
                            variant: productVariant,
                            size,
                            color
                        })
                        .from(orderItem)
                        .leftJoin(product, eq(orderItem.productId, product.id))
                        .leftJoin(productVariant, eq(orderItem.variantId, productVariant.id))
                        .leftJoin(size, eq(orderItem.sizeId, size.id))
                        .leftJoin(color, eq(orderItem.colorId, color.id))
                        .where(eq(orderItem.orderId, orderRecord.order.id));

                    return {
                        ...orderRecord.order,
                        User: orderRecord.user,
                        items
                    };
                })
            );

            return ordersWithItems;
        }),

    updateOrderStatus: protectedProcedure
        .input(z.object({
            orderId: z.string(),
            status: z.enum(['PENDING', 'COMPLETED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
            trackingId: z.string().optional()
        }))
        .handler(async ({ input }) => {
            const updateData: any = {
                status: input.status,
                updatedAt: new Date().toISOString()
            };

            if (input.trackingId) {
                updateData.trackingId = input.trackingId;
            }

            await db
                .update(order)
                .set(updateData)
                .where(eq(order.id, input.orderId));

            // Get updated order with relations
            const updatedOrderRecord = await db
                .select({
                    order,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        fcmToken: user.fcmToken
                    }
                })
                .from(order)
                .leftJoin(user, eq(order.userId, user.id))
                .where(eq(order.id, input.orderId))
                .limit(1);

            const items = await db
                .select({
                    orderItem,
                    product,
                    variant: productVariant,
                    size,
                    color
                })
                .from(orderItem)
                .leftJoin(product, eq(orderItem.productId, product.id))
                .leftJoin(productVariant, eq(orderItem.variantId, productVariant.id))
                .leftJoin(size, eq(orderItem.sizeId, size.id))
                .leftJoin(color, eq(orderItem.colorId, color.id))
                .where(eq(orderItem.orderId, input.orderId));

            if (updatedOrderRecord[0]?.user?.fcmToken) {
                const statusMessages = {
                    'PENDING': {
                        title: '📋 Sipariş Alındı',
                        body: 'Siparişiniz başarıyla alındı ve işleme konuldu.'
                    },
                    'CONFIRMED': {
                        title: '✅ Sipariş Onaylandı',
                        body: 'Siparişiniz onaylandı ve hazırlanmaya başlandı.'
                    },
                    'SHIPPED': {
                        title: '🚚 Sipariş Kargoya Verildi',
                        body: input.trackingId
                            ? `Siparişiniz kargoya verildi. Yurtiçi Kargo Takip No: ${input.trackingId}`
                            : 'Siparişiniz kargoya verildi.'
                    },
                    'DELIVERED': {
                        title: '🎉 Sipariş Teslim Edildi',
                        body: 'Siparişiniz başarıyla teslim edildi. Teşekkür ederiz!'
                    },
                    'COMPLETED': {
                        title: '✅ Sipariş Tamamlandı',
                        body: 'Siparişiniz başarıyla tamamlandı. Bizi tercih ettiğiniz için teşekkür ederiz!'
                    },
                    'CANCELLED': {
                        title: '❌ Sipariş İptal Edildi',
                        body: 'Siparişiniz iptal edildi. Detaylar için iletişime geçebilirsiniz.'
                    }
                };

                const notificationData = statusMessages[input.status];

                try {
                    await sendNotificationToToken(updatedOrderRecord[0].user.fcmToken, {
                        title: notificationData.title,
                        body: notificationData.body,
                        data: {
                            orderId: input.orderId,
                            status: input.status,
                            trackingId: input.trackingId || '',
                            type: 'order_status_update'
                        }
                    });
                    console.log(`Notification sent for order ${input.orderId} status change to ${input.status}`);
                } catch (error) {
                    console.error('Failed to send notification:', error);
                }
            }

            return {
                ...updatedOrderRecord[0].order,
                User: {
                    id: updatedOrderRecord[0].user?.id,
                    name: updatedOrderRecord[0].user?.name,
                    email: updatedOrderRecord[0].user?.email
                },
                items
            };
        }),

    trackOrder: publicProcedure
        .input(z.object({
            trackingId: z.string().min(1, "Takip numarası gereklidir"),
            phone: z.string().min(1, "Telefon numarası gereklidir")
        }))
        .handler(async ({ input }) => {
            const orderRecord = await db
                .select({
                    order,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                })
                .from(order)
                .leftJoin(user, eq(order.userId, user.id))
                .where(eq(order.id, input.trackingId))
                .limit(1);

            if (!orderRecord.length) {
                throw new Error("Sipariş bulunamadı");
            }

            // Phone number kontrolü
            if (orderRecord[0].order.phoneNumber !== input.phone) {
                throw new Error("Bu siparişe erişim yetkiniz yok");
            }

            const items = await db
                .select({
                    orderItem,
                    product,
                    variant: productVariant,
                    size,
                    color
                })
                .from(orderItem)
                .leftJoin(product, eq(orderItem.productId, product.id))
                .leftJoin(productVariant, eq(orderItem.variantId, productVariant.id))
                .leftJoin(size, eq(orderItem.sizeId, size.id))
                .leftJoin(color, eq(orderItem.colorId, color.id))
                .where(eq(orderItem.orderId, input.trackingId));

            return {
                ...orderRecord[0].order,
                User: orderRecord[0].user,
                items
            };
        }),
}

export type OrderRouter = typeof orderRouter;