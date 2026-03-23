import { db } from "@/drizzle/db";
import { cart, cartItem, product, size, color, productVariant } from "@/drizzle/schema";
import { userProcedure } from "@/lib/orpc";
import { eq, and, asc, sql } from "drizzle-orm";
import z from "zod";

async function getOrCreateCart(userId: string) {
    const existingCart = await db.select().from(cart).where(eq(cart.userId, userId)).limit(1);

    if (existingCart.length > 0) {
        return existingCart[0];
    }

    const newCart = await db.insert(cart).values({
        id: crypto.randomUUID(),
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }).returning();

    return newCart[0];
}

const addToCartSchema = z.object({
    productId: z.string(),
    quantity: z.number().min(1, 'Miktar en az 1 olmalıdır.'),
    sizeId: z.string(),
    colorId: z.string(),
})

export const cartRouter = {
    getCart: userProcedure.handler(async ({ context }) => {
        const userCart = await db.select().from(cart).where(eq(cart.userId, context.session.user.id)).limit(1);

        if (userCart.length === 0) {
            return {
                id: null,
                items: [],
                totalPrice: 0,
                totalItems: 0,
            };
        }

        const items = await db
            .select({
                id: cartItem.id,
                cartId: cartItem.cartId,
                productId: cartItem.productId,
                variantId: cartItem.variantId,
                quantity: cartItem.quantity,
                createdAt: cartItem.createdAt,
                updatedAt: cartItem.updatedAt,
                sizeId: cartItem.sizeId,
                colorId: cartItem.colorId,
                product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    imageUrls: product.imageUrls,
                    discount: product.discount,
                    stockCode: product.stockCode,
                    available: product.available,
                    categories: product.categories,
                },
                Size: {
                    id: size.id,
                    size: size.size,
                    available: size.available,
                    productId: size.productId,
                },
                Color: {
                    id: color.id,
                    color: color.color,
                    available: color.available,
                    productId: color.productId,
                },
            })
            .from(cartItem)
            .leftJoin(product, eq(cartItem.productId, product.id))
            .leftJoin(size, eq(cartItem.sizeId, size.id))
            .leftJoin(color, eq(cartItem.colorId, color.id))
            .where(eq(cartItem.cartId, userCart[0].id))
            .orderBy(asc(cartItem.createdAt));

        let totalPrice = 0;
        let totalItems = 0;
        for (const item of items) {
            if (item.product) {
                totalPrice += item.product.price * item.quantity;
                totalItems += item.quantity;
            }
        }

        return { ...userCart[0], items, totalPrice, totalItems };
    }),

    addItem: userProcedure.input(addToCartSchema)
        .handler(async ({ input, context }) => {
            const { productId, quantity, sizeId, colorId } = input;
            const userCart = await getOrCreateCart(context.session.user.id);

            const sizeResult = await db.select().from(size).where(eq(size.id, sizeId)).limit(1);
            const colorResult = await db.select().from(color).where(eq(color.id, colorId)).limit(1);

            if (sizeResult.length === 0 || colorResult.length === 0) {
                throw new Error("Size or color not found");
            }

            const sizeData = sizeResult[0];
            const colorData = colorResult[0];

            const variant = await db
                .select()
                .from(productVariant)
                .where(
                    and(
                        eq(productVariant.productId, productId),
                        eq(productVariant.size, sizeData.size),
                        eq(productVariant.color, colorData.color)
                    )
                )
                .limit(1);

            if (variant.length === 0) {
                throw new Error("Variant not found");
            }

            // Check if item already exists in cart
            const existingItem = await db
                .select()
                .from(cartItem)
                .where(
                    and(
                        eq(cartItem.cartId, userCart.id),
                        eq(cartItem.productId, productId),
                        eq(cartItem.variantId, variant[0].id)
                    )
                )
                .limit(1);

            if (existingItem.length > 0) {
                // Update existing item
                const updatedItem = await db
                    .update(cartItem)
                    .set({
                        quantity: sql`${cartItem.quantity} + ${quantity}`,
                        updatedAt: new Date().toISOString(),
                    })
                    .where(eq(cartItem.id, existingItem[0].id))
                    .returning();

                return updatedItem[0];
            } else {
                // Create new item
                const newItem = await db
                    .insert(cartItem)
                    .values({
                        id: crypto.randomUUID(),
                        cartId: userCart.id,
                        productId,
                        quantity,
                        variantId: variant[0].id,
                        sizeId,
                        colorId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    })
                    .returning();

                return newItem[0];
            }
        }),

    updateQuantity: userProcedure
        .input(z.object({
            cartItemId: z.string(),
            quantity: z.number().min(0, 'Miktar 0\'dan küçük olamaz.'),
        }))
        .handler(async ({ input, context }) => {
            const { session } = context;
            const { cartItemId, quantity } = input;

            const itemToUpdate = await db
                .select()
                .from(cartItem)
                .leftJoin(cart, eq(cartItem.cartId, cart.id))
                .where(
                    and(
                        eq(cartItem.id, cartItemId),
                        eq(cart.userId, session.user.id)
                    )
                )
                .limit(1);

            if (itemToUpdate.length === 0) {
                return { code: 'NOT_FOUND', message: 'Sepet öğesi bulunamadı.' };
            }

            if (quantity === 0) {
                const deletedItem = await db
                    .delete(cartItem)
                    .where(eq(cartItem.id, cartItemId))
                    .returning();

                return deletedItem[0];
            }

            const updatedItem = await db
                .update(cartItem)
                .set({
                    quantity,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(cartItem.id, cartItemId))
                .returning();

            return updatedItem[0];
        }),

    removeItem: userProcedure
        .input(z.object({ cartItemId: z.string() }))
        .handler(async ({ input, context }) => {
            const { session } = context;

            const itemToRemove = await db
                .select()
                .from(cartItem)
                .leftJoin(cart, eq(cartItem.cartId, cart.id))
                .where(
                    and(
                        eq(cartItem.id, input.cartItemId),
                        eq(cart.userId, session.user.id)
                    )
                )
                .limit(1);

            if (itemToRemove.length === 0) {
                return { code: 'NOT_FOUND', message: 'Sepet öğesi bulunamadı.' };
            }

            const deletedItem = await db
                .delete(cartItem)
                .where(eq(cartItem.id, input.cartItemId))
                .returning();

            return deletedItem[0];
        }),

    clearCart: userProcedure
        .handler(async ({ context }) => {
            const { session } = context;

            const userCart = await db
                .select({ id: cart.id })
                .from(cart)
                .where(eq(cart.userId, session.user.id))
                .limit(1);

            if (userCart.length === 0) {
                return { success: true };
            }

            await db
                .delete(cartItem)
                .where(eq(cartItem.cartId, userCart[0].id));

            return { success: true };
        })
}
export type CartRouter = typeof cartRouter