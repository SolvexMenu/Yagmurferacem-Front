import { db } from "@/drizzle/db";
import { user, cart, cartItem, product, color, size } from "@/drizzle/schema";
import { protectedProcedure, userProcedure } from "@/lib/orpc";
import { eq, isNotNull } from "drizzle-orm";
import { sendNotificationToToken, sendNotificationToMultipleTokens } from "@/lib/firebase-admin";
import z from "zod";

export const customerRouter = {
    getCustomers: protectedProcedure.handler(async () => {
        const list = await db
            .select()
            .from(user)
            .leftJoin(cart, eq(user.id, cart.userId))
            .where(eq(user.role, "CUSTOMER"));

        // Group the results to match Prisma's include structure
        const groupedResults = list.reduce((acc, row) => {
            const existingUser = acc.find(u => u.id === row.user.id);
            if (existingUser) {
                if (row.cart && !existingUser.cart) {
                    existingUser.cart = row.cart;
                }
            } else {
                acc.push({
                    ...row.user,
                    cart: row.cart
                });
            }
            return acc;
        }, [] as any[]);

        return groupedResults;
    }),

    getCustomerCart: protectedProcedure.input(z.string())
        .handler(async ({ input }) => {
            const cartResult = await db
                .select()
                .from(cart)
                .leftJoin(cartItem, eq(cart.id, cartItem.cartId))
                .leftJoin(product, eq(cartItem.productId, product.id))
                .leftJoin(color, eq(cartItem.colorId, color.id))
                .leftJoin(size, eq(cartItem.sizeId, size.id))
                .where(eq(cart.userId, input));

            if (cartResult.length === 0) {
                return null;
            }

            // Group the results to match Prisma's include structure
            const cartData = cartResult[0].cart;
            const items = cartResult
                .filter(row => row.cartItem)
                .map(row => ({
                    ...row.cartItem,
                    Color: row.color,
                    product: row.product,
                    Size: row.size
                }));

            return {
                ...cartData,
                items
            };
        }),

    storeFcmToken: userProcedure
        .input(z.object({
            token: z.string(),
            userId: z.string().optional()
        }))
        .handler(async ({ input, context }) => {
            if (input.userId) {
                // Kayıtlı kullanıcı için token güncelle
                await db
                    .update(user)
                    .set({ fcmToken: input.token })
                    .where(eq(user.id, context.session.user.id));
            }
            // Misafir kullanıcılar için localStorage'da saklanacak
            return { success: true };
        }),

    sendNotification: protectedProcedure
        .input(z.object({
            userId: z.string().optional(),
            title: z.string(),
            body: z.string(),
            data: z.json().optional(),
        }))
        .handler(async ({ input }) => {
            if (input.userId) {
                // Belirli kullanıcıya bildirim gönder
                const userData = await db
                    .select({ fcmToken: user.fcmToken })
                    .from(user)
                    .where(eq(user.id, input.userId))
                    .limit(1);

                if (userData[0]?.fcmToken) {
                    return await sendNotificationToToken(userData[0].fcmToken, {
                        title: input.title,
                        body: input.body,
                        data: input.data as any
                    });
                }
            }

            return { success: false, error: 'No valid tokens found' };
        })
}
export type CustomerRouter = typeof customerRouter;