import { protectedProcedure, publicProcedure } from "@/lib/orpc";
import { paytr } from "@/lib/paytr";
import { db } from "@/drizzle/db";
import { order, orderItem } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import z from "zod";
import crypto from "crypto";

function generateAlphanumeric(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }
    return result;
}
// [["Yeşim Kaşe Kaban (Taş Düğme Detaylı)", "5700",1]]
export const paytrRouter = {
    createPaymentToken: publicProcedure
        .input(z.object({
            totalPrice: z.number(),
            email: z.email(),
            name: z.string(),
            products: z.object({
                id: z.string(),
                name: z.string(),
                price: z.string(),
                quantity: z.number(),
                sizeId: z.string().optional(),
                colorId: z.string().optional(),
                variantId: z.string().optional()
            }).array().nonempty(),
            phone: z.string(),
            address: z.string(),
            notes: z.string().optional(),
            userIp: z.string().optional()
        }))
        .handler(async ({ input, context }) => {
            const merchant_oid = generateAlphanumeric(16)

            const user_basket = JSON.stringify(
                input.products.map(product => [
                    product.name,
                    product.price,
                    product.quantity
                ])
            );

            const user_ip = input.userIp || '127.0.0.1';

            const payment_amount = Math.round(input.totalPrice * 100);

            const resp = await paytr.getToken({
                merchant_oid,
                payment_amount,
                currency: 'TL',
                email: input.email,
                user_ip: user_ip as string,
                user_name: input.name,
                user_phone: input.phone,
                user_address: input.address,
                user_basket: input.products,
                merchant_ok_url: `${process.env.CORS_ORIGIN}/payment/success`,
                merchant_fail_url: `${process.env.CORS_ORIGIN}/payment/failed`,
            });

            console.log({
                merchant_oid,
                payment_amount,
                currency: 'TL',
                email: input.email,
                user_ip: user_ip as string,
                user_name: input.name,
                user_phone: input.phone,
                user_address: input.address,
                user_basket: user_basket as any,
                merchant_ok_url: `${process.env.CORS_ORIGIN}/payment/success`,
                merchant_fail_url: `${process.env.CORS_ORIGIN}/payment/failed`,
            })

            await db.insert(order).values({
                id: merchant_oid,
                userId: context.session?.user?.id || null,
                status: 'PENDING',
                totalAmount: input.totalPrice,
                trackingId: crypto.randomUUID(),
                shippingAddress: input.address,
                phoneNumber: input.phone,
                notes: JSON.stringify({
                    customerName: input.name,
                    customerEmail: input.email,
                    originalNotes: input.notes || ""
                }),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            await db.insert(orderItem).values(
                input.products.map(product => ({
                    id: crypto.randomUUID(),
                    productId: product.id,
                    quantity: product.quantity,
                    sizeId: product.sizeId || null,
                    colorId: product.colorId || null,
                    variantId: product.variantId || null,
                    orderId: merchant_oid,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }))
            );

            return {
                paymentUrl: `https://www.paytr.com/odeme/guvenli/${resp.token}`,
                orderId: merchant_oid
            };
        }),



    // Get order status (for both users and guests)
    getOrderStatus: publicProcedure
        .input(z.object({
            orderId: z.string(),
            phone: z.string().optional() // For guest order verification
        }))
        .handler(async ({ input, context }) => {
            let orderResult;

            if (context.session?.user) {
                // Authenticated user
                orderResult = await db.select().from(order)
                    .where(and(eq(order.id, input.orderId), eq(order.userId, context.session.user.id)));
            } else {
                // Guest user - verify with phone number
                if (!input.phone) {
                    throw new Error('Phone number required for guest orders');
                }
                orderResult = await db.select().from(order)
                    .where(and(eq(order.id, input.orderId), eq(order.phoneNumber, input.phone)));
            }

            const foundOrder = orderResult[0];

            if (!foundOrder) {
                throw new Error('Order not found');
            }

            const items = await db.select().from(orderItem)
                .where(eq(orderItem.orderId, input.orderId));

            return {
                id: foundOrder.id,
                status: foundOrder.status,
                totalAmount: foundOrder.totalAmount,
                paidAmount: foundOrder.paidAmount,
                paymentType: foundOrder.paymentType,
                paymentDate: foundOrder.paymentDate,
                failureReason: foundOrder.failureReason,
                items: items
            };
        }),

    refundOrder: protectedProcedure
        .input(z.object({
            orderId: z.string(),
            refundAmount: z.number().optional(),
            reason: z.string().optional()
        }))
        .handler(async ({ input, context }) => {
            // Only allow authenticated users (admins) to process refunds
            if (!context.session?.user) {
                throw new Error('Authentication required for refunds');
            }

            // Get the order details
            const orderResult = await db.select().from(order)
                .where(eq(order.id, input.orderId));

            const foundOrder = orderResult[0];
            if (!foundOrder) {
                throw new Error('Order not found');
            }

            // Check if order is eligible for refund
            if (foundOrder.status !== 'COMPLETED' && foundOrder.status !== 'DELIVERED') {
                throw new Error('Order must be completed or delivered to process refund');
            }

            if (!foundOrder.paidAmount || foundOrder.paidAmount <= 0) {
                throw new Error('No payment found for this order');
            }

            // Calculate refund amount
            const refundAmount = input.refundAmount || foundOrder.paidAmount;

            if (refundAmount > foundOrder.paidAmount) {
                throw new Error('Refund amount cannot exceed paid amount');
            }

            try {
                // Process refund through PayTR
                const refundResponse = await paytr.refund({
                    merchant_oid: foundOrder.id,
                    return_amount: Math.round(refundAmount * 100), // Convert to kuruş
                    reference_no: generateAlphanumeric(12)
                });

                // Update order status if refund was successful
                if (refundResponse.status === 'success') {
                    await db.update(order)
                        .set({
                            status: refundAmount === foundOrder.paidAmount ? 'CANCELLED' : foundOrder.status,
                            updatedAt: new Date().toISOString(),
                            notes: foundOrder.notes
                                ? `${foundOrder.notes}\İade: ${refundAmount} TL - ${input.reason || 'Sebep paylaşılmadı'}`
                                : `İade: ${refundAmount} TL - ${input.reason || 'Sebep paylaşılmadı'}`
                        })
                        .where(eq(order.id, input.orderId));

                    return {
                        success: true,
                        message: 'Refund processed successfully',
                        refundAmount,
                        refundId: refundResponse.merchantOid || refundResponse.referenceNo
                    };
                } else {
                    throw new Error(refundResponse.status || 'Refund failed');
                }

            } catch (error) {
                console.error('Refund error:', error);
                throw new Error(`Refund processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        })
};

export type PayTRRouter = typeof paytrRouter;