import { db } from "@/drizzle/db";
import { product, productVariant, size, color, orderItem, cartItem, order } from "@/drizzle/schema";
import { protectedProcedure, publicProcedure } from "@/lib/orpc";
import { eq, desc, not } from "drizzle-orm";
import z from "zod";
import crypto from "crypto";
import { ORPCError } from "@orpc/client";

// A new schema to define a single product variant
const createVariantSchema = z.object({
    size: z.preprocess(
        (val) => Number(val),
        z.number().int().positive('Size must be a positive integer')
    ),
    color: z.string().min(1, 'Color name cannot be empty'),
    available: z.boolean().default(true),
    stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
});

// The main product creation schema, now centered around variants
export const createProductSchema = z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters long'),
    price: z.number().int().positive('Price must be a positive integer'),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    stockCode: z.string().min(1, 'Stock code is required'),
    available: z.boolean().default(true),
    imageUrls: z.array(z.string()).nonempty('At least one image URL is required'),
    categories: z.array(z.string()).nonempty('At least one category is required'),
    discount: z.number().int().optional(),
    variants: z.array(createVariantSchema).nonempty('At least one product variant is required'),
});


export const productRouter = {
    getAllProducts: publicProcedure
        .handler(async () => {
            // Get all products
            const products = await db.select().from(product);

            // Get all variants, sizes, and colors
            const variants = await db.select().from(productVariant);
            const sizes = await db.select().from(size);
            const colors = await db.select().from(color);

            // Combine the data
            return products.map(p => ({
                ...p,
                variants: variants.filter(v => v.productId === p.id),
                Size: sizes.filter(s => s.productId === p.id),
                Color: colors.filter(c => c.productId === p.id)
            }));
        }),

    getRandom4Product: publicProcedure
        .handler(async () => {
            // Get all products ordered by id desc
            const products = await db.select().from(product).orderBy(desc(product.id));

            // Get all variants, sizes, and colors
            const variants = await db.select().from(productVariant);
            const sizes = await db.select().from(size);
            const colors = await db.select().from(color);

            // Combine the data
            const productsWithRelations = products.map(p => ({
                ...p,
                variants: variants.filter(v => v.productId === p.id),
                Size: sizes.filter(s => s.productId === p.id),
                Color: colors.filter(c => c.productId === p.id)
            }));

            const shuffled = productsWithRelations.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 4);
        }),

    getSimilarProducts: publicProcedure
        .input(z.string())
        .handler(async ({ input }) => {
            // Get current product
            const [currentProduct] = await db.select().from(product).where(eq(product.id, input));

            if (!currentProduct) {
                return [];
            }

            // Get current product variants
            const currentVariants = await db.select().from(productVariant).where(eq(productVariant.productId, input));

            // Get all other products
            const allProducts = await db.select().from(product).where(not(eq(product.id, input)));

            // Get all variants, sizes, and colors for filtering
            const allVariants = await db.select().from(productVariant);
            const allSizes = await db.select().from(size);
            const allColors = await db.select().from(color);

            // Filter products that share categories or have similar variants
            const currentSizes = currentVariants.map(v => v.size);
            const currentColors = currentVariants.map(v => v.color);

            const similarProducts = allProducts
                .filter(p => {
                    const hasSharedCategory = p.categories?.some(cat =>
                        currentProduct.categories?.includes(cat)
                    );
                    const pVariants = allVariants.filter(v => v.productId === p.id);
                    const hasSharedSize = pVariants.some(v => currentSizes.includes(v.size));
                    const hasSharedColor = pVariants.some(v => currentColors.includes(v.color));

                    return hasSharedCategory || hasSharedSize || hasSharedColor;
                })
                .slice(0, 4)
                .map(p => ({
                    ...p,
                    variants: allVariants.filter(v => v.productId === p.id),
                    Size: allSizes.filter(s => s.productId === p.id),
                    Color: allColors.filter(c => c.productId === p.id)
                }));

            return similarProducts;
        }),

    getProductById: publicProcedure.input(z.string())
        .handler(async ({ input }) => {
            // Get product
            const [prod] = await db.select().from(product).where(eq(product.id, input));

            if (!prod) {
                return null;
            }

            // Get related data
            const variants = await db.select().from(productVariant).where(eq(productVariant.productId, input));
            const sizes = await db.select().from(size).where(eq(size.productId, input));
            const colors = await db.select().from(color).where(eq(color.productId, input));

            return {
                ...prod,
                variants,
                Size: sizes,
                Color: colors
            };
        }),

    deleteProductById: protectedProcedure.input(z.object({
        id: z.string(),
        forceDelete: z.boolean().optional().default(false)
    }))
        .handler(async ({ input, context }) => {
            if (context.session.user.role !== "ADMIN") {
                throw new ORPCError("Only admins can delete products");
            }

            const { id: productId, forceDelete } = input;

            // Check if product exists in any orders
            const existingOrderItems = await db.select({
                id: orderItem.id,
                orderId: orderItem.orderId
            })
                .from(orderItem)
                .where(eq(orderItem.productId, productId));

            if (existingOrderItems.length > 0 && !forceDelete) {
                const orderCount = new Set(existingOrderItems.map(item => item.orderId)).size;
                const error = new ORPCError(`Bu ürün ${orderCount} siparişte kullanılıyor. Ürünü silmek için siparişleri de silmeniz gerekiyor.`);
                throw error;
            }

            if (forceDelete && existingOrderItems.length > 0) {
                // Get unique order IDs
                const orderIds = [...new Set(existingOrderItems.map(item => item.orderId))].filter(Boolean);

                // Delete order items first
                await db.delete(orderItem).where(eq(orderItem.productId, productId));

                // Delete orders that only contained this product
                for (const orderId of orderIds) {
                    if (orderId) {
                        const remainingItems = await db.select()
                            .from(orderItem)
                            .where(eq(orderItem.orderId, orderId))
                            .limit(1);

                        if (remainingItems.length === 0) {
                            await db.delete(order).where(eq(order.id, orderId));
                        }
                    }
                }
            }

            // Delete related cart items first (they have CASCADE, but let's be explicit)
            await db.delete(cartItem).where(eq(cartItem.productId, productId));

            // Delete the product (this will cascade delete variants, sizes, and colors)
            const [deletedProduct] = await db.delete(product)
                .where(eq(product.id, productId))
                .returning();

            if (!deletedProduct) {
                throw new ORPCError("Ürün bulunamadı");
            }

            return {
                ...deletedProduct,
                deletedOrders: forceDelete ? existingOrderItems.length > 0 : false
            };
        }),

    addProduct: protectedProcedure
        .input(createProductSchema)
        .handler(async ({ input, context }) => {
            if (context.session.user.role !== "ADMIN") {
                return "those who are only bound by a contract may use this function";
            }

            const { variants: variantsInput, ...productData } = input;

            // From the variants list, derive the unique sizes and colors
            const uniqueSizes = [...new Map(variantsInput.map(v => [v.size, v])).values()]
                .map(v => ({ size: v.size, available: true }));

            const uniqueColors = [...new Map(variantsInput.map(v => [v.color, v])).values()]
                .map(v => ({ color: v.color, available: true }));

            // Insert product
            const productId = crypto.randomUUID();
            const [newProduct] = await db.insert(product)
                .values({
                    id: productId,
                    ...productData
                })
                .returning();

            // Insert variants
            const variantsToInsert = variantsInput.map(variant => ({
                id: crypto.randomUUID(),
                productId: newProduct.id,
                size: variant.size,
                color: variant.color,
                available: variant.available,
                stock: variant.stock,
            }));
            const insertedVariants = await db.insert(productVariant)
                .values(variantsToInsert)
                .returning();

            // Insert sizes
            const sizesToInsert = uniqueSizes.map(s => ({
                id: crypto.randomUUID(),
                productId: newProduct.id,
                ...s
            }));
            const insertedSizes = await db.insert(size)
                .values(sizesToInsert)
                .returning();

            // Insert colors
            const colorsToInsert = uniqueColors.map(c => ({
                id: crypto.randomUUID(),
                productId: newProduct.id,
                ...c
            }));
            const insertedColors = await db.insert(color)
                .values(colorsToInsert)
                .returning();

            return {
                ...newProduct,
                variants: insertedVariants,
                Size: insertedSizes,
                Color: insertedColors,
            };
        }),

    updateProduct: protectedProcedure
        .input(z.object({
            id: z.string()
        }).extend(createProductSchema.shape))
        .handler(async ({ input, context }) => {
            if (context.session.user.role !== "ADMIN") {
                return "those who are only bound by a contract may use this function";
            }

            const { id, variants: variantsInput, ...productData } = input;

            const uniqueSizes = [...new Map(variantsInput.map(v => [v.size, v])).values()]
                .map(v => ({ size: v.size, available: true }));

            const uniqueColors = [...new Map(variantsInput.map(v => [v.color, v])).values()]
                .map(v => ({ color: v.color, available: true }));

            // Update product
            const [updatedProduct] = await db.update(product)
                .set(productData)
                .where(eq(product.id, id))
                .returning();

            // Delete existing variants, sizes, and colors
            await db.delete(productVariant).where(eq(productVariant.productId, id));
            await db.delete(size).where(eq(size.productId, id));
            await db.delete(color).where(eq(color.productId, id));

            // Insert new variants
            const variantsToInsert = variantsInput.map(variant => ({
                id: crypto.randomUUID(),
                productId: id,
                size: variant.size,
                color: variant.color,
                available: variant.available,
                stock: variant.stock,
            }));
            const insertedVariants = await db.insert(productVariant)
                .values(variantsToInsert)
                .returning();

            // Insert new sizes
            const sizesToInsert = uniqueSizes.map(s => ({
                id: crypto.randomUUID(),
                productId: id,
                ...s
            }));
            const insertedSizes = await db.insert(size)
                .values(sizesToInsert)
                .returning();

            // Insert new colors
            const colorsToInsert = uniqueColors.map(c => ({
                id: crypto.randomUUID(),
                productId: id,
                ...c
            }));
            const insertedColors = await db.insert(color)
                .values(colorsToInsert)
                .returning();

            return {
                ...updatedProduct,
                variants: insertedVariants,
                Size: insertedSizes,
                Color: insertedColors,
            };
        }),

    getCategories: publicProcedure.handler(async () => {
        const products = await db.select({
            categories: product.categories
        }).from(product);

        const allCategories = products.flatMap(item => item.categories || []);

        const categoryCount = new Map<string, number>();

        for (const cat of allCategories) {
            categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
        }

        const result = Array.from(categoryCount.entries()).map(([name, count]) => ({
            name,
            count
        }));

        return result;
    }),
    getSizes: publicProcedure.handler(async () => {
        const sizes = await db.select({
            size: size.size,
            productId: size.productId
        }).from(size);

        const sizeCount = new Map<number, Set<string>>();

        for (const s of sizes) {
            if (!sizeCount.has(s.size)) {
                sizeCount.set(s.size, new Set());
            }
            sizeCount.get(s.size)!.add(s.productId);
        }

        const result = Array.from(sizeCount.entries()).map(([sizeValue, products]) => ({
            name: sizeValue.toString(),
            count: products.size
        }));

        return result;
    }),
    getColor: publicProcedure.handler(async () => {
        const colors = await db.select({
            color: color.color,
            productId: color.productId
        }).from(color);

        const colorCount = new Map<string, Set<string>>();

        for (const c of colors) {
            if (!colorCount.has(c.color)) {
                colorCount.set(c.color, new Set());
            }
            colorCount.get(c.color)!.add(c.productId);
        }

        const result = Array.from(colorCount.entries()).map(([colorValue, products]) => ({
            name: colorValue.toString(),
            count: products.size
        }));

        return result;
    })
}
export type ProductRouter = typeof productRouter;