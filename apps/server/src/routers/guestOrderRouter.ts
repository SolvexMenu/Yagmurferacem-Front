import { db } from "@/drizzle/db";
import { product, size, color, order, orderItem, productVariant } from "@/drizzle/schema";
import { publicProcedure } from "@/lib/orpc";
import { eq, inArray, and } from "drizzle-orm";
import z from "zod";

const guestOrderSchema = z.object({
    // Müşteri bilgileri
    customerName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
    customerEmail: z.string().email("Geçerli bir email adresi giriniz"),
    customerPhone: z.string().min(10, "Telefon numarası geçerli olmalıdır"),

    // Adres bilgileri
    shippingAddress: z.string().min(10, "Teslimat adresi en az 10 karakter olmalıdır"),
    billingAddress: z.string().optional(),
    city: z.string().min(1, "Şehir bilgisi gereklidir"),
    district: z.string().min(1, "İlçe bilgisi gereklidir"),

    // Sipariş bilgileri
    notes: z.string().optional(),

    // Sepet ürünleri
    items: z.array(z.object({
        productId: z.string(),
        sizeId: z.string().optional(),
        colorId: z.string().optional(),
        quantity: z.number().min(1, "Miktar en az 1 olmalıdır")
    })).min(1, "En az bir ürün seçmelisiniz")
});

const guestOrderTrackingSchema = z.object({
    trackingId: z.string().min(1, "Takip numarası gereklidir"),
    email: z.string().email("Geçerli bir email adresi giriniz")
});

export const guestOrderRouter = {
    // Misafir sipariş oluşturma
    placeGuestOrder: publicProcedure
        .input(guestOrderSchema)
        .handler(async ({ input }) => {
            // Ürün bilgilerini ve fiyatlarını kontrol et
            const productIds = input.items.map(item => item.productId);
            const products = await db.select().from(product).where(
                and(
                    inArray(product.id, productIds),
                    eq(product.available, true)
                )
            );

            // Get sizes and colors for these products
            const sizes = await db.select().from(size).where(
                inArray(size.productId, productIds)
            );

            const colors = await db.select().from(color).where(
                inArray(color.productId, productIds)
            );

            // Get product variants for these products
            const variants = await db.select().from(productVariant).where(
                inArray(productVariant.productId, productIds)
            );

            if (products.length !== productIds.length) {
                throw new Error("Bazı ürünler bulunamadı veya mevcut değil");
            }

            // Toplam tutarı hesapla
            let totalAmount = 0;
            const validatedItems: Array<any> = [];

            for (const item of input.items) {
                const productData = products.find(p => p.id === item.productId);
                if (!productData) {
                    throw new Error(`Ürün bulunamadı: ${item.productId}`);
                }

                let sizeData = null;
                let colorData = null;
                let variantData = null;

                // Size ve color kontrolü
                if (item.sizeId) {
                    sizeData = sizes.find(s => s.id === item.sizeId && s.productId === item.productId);
                    if (!sizeData || !sizeData.available) {
                        throw new Error(`Seçilen beden mevcut değil: ${productData.name}`);
                    }
                }

                if (item.colorId) {
                    colorData = colors.find(c => c.id === item.colorId && c.productId === item.productId);
                    if (!colorData || !colorData.available) {
                        throw new Error(`Seçilen renk mevcut değil: ${productData.name}`);
                    }
                }

                // Find matching variant if both size and color are provided
                if (sizeData && colorData) {
                    variantData = variants.find(v => 
                        v.productId === item.productId && 
                        v.size === sizeData.size && 
                        v.color === colorData.color
                    );
                    
                    if (!variantData || !variantData.available) {
                        throw new Error(`Seçilen beden ve renk kombinasyonu mevcut değil: ${productData.name}`);
                    }
                }

                const price = productData.discount
                    ? productData.price - (productData.price * productData.discount / 100)
                    : productData.price;

                totalAmount += price * item.quantity;
                validatedItems.push({
                    ...item,
                    product: productData,
                    variant: variantData,
                    unitPrice: price
                });
            }
            // Siparişi oluştur
            const orderResult = await db.transaction(async (tx) => {
                // Siparişi oluştur
                const [newOrder] = await tx.insert(order).values({
                    id: crypto.randomUUID(),
                    trackingId: "", // this one should be empty admin provides it later in the dashboard
                    totalAmount,
                    shippingAddress: `${input.shippingAddress}, ${input.district}, ${input.city}`,
                    billingAddress: input.billingAddress || `${input.shippingAddress}, ${input.district}, ${input.city}`,
                    phoneNumber: input.customerPhone,
                    // Guest order için özel alanlar (notes'a JSON olarak ekleyebiliriz)
                    notes: JSON.stringify({
                        customerName: input.customerName,
                        customerEmail: input.customerEmail,
                        isGuestOrder: true,
                        originalNotes: input.notes
                    }),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }).returning();

                // Sipariş ürünlerini oluştur
                const orderItemsData = validatedItems.map(item => ({
                    id: crypto.randomUUID(),
                    productId: item.productId,
                    variantId: item.variant?.id || null,
                    quantity: item.quantity,
                    sizeId: item.sizeId || null,
                    colorId: item.colorId || null,
                    orderId: newOrder.id,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));

                const createdOrderItems = await tx.insert(orderItem).values(orderItemsData).returning();

                // Get full order items with related data using joins
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
                    .where(eq(orderItem.orderId, newOrder.id));

                return {
                    ...newOrder,
                    items: orderItemsWithRelations
                };
            });

            return {
                success: true,
                orderId: orderResult.id,
                trackingId: orderResult.trackingId,
                totalAmount: orderResult.totalAmount,
                customerEmail: input.customerEmail,
                customerPhone: input.customerPhone
            };
        }),

    // Misafir sipariş takibi
    trackGuestOrder: publicProcedure
        .input(guestOrderTrackingSchema)
        .handler(async ({ input }) => {
            const [orderData] = await db.select().from(order).where(eq(order.id, input.trackingId));

            if (!orderData) {
                throw new Error("Sipariş bulunamadı");
            }

            // Get order items with related data using joins
            const itemsWithRelations = await db
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
                .where(eq(orderItem.orderId, orderData.id));

            const orderWithItems = {
                ...orderData,
                items: itemsWithRelations
            };

            // Guest order bilgilerini parse et
            let guestInfo;
            try {
                guestInfo = JSON.parse(orderWithItems.notes || '{}');
            } catch {
                throw new Error("Sipariş bilgileri okunamadı");
            }

            // Email kontrolü
            if (!guestInfo.isGuestOrder || guestInfo.customerEmail !== input.email) {
                throw new Error("Bu siparişe erişim yetkiniz yok");
            }

            return {
                ...orderWithItems,
                customerName: guestInfo.customerName,
                customerEmail: guestInfo.customerEmail,
                notes: guestInfo.originalNotes
            };
        }),

    // Ürün bilgilerini getir (sepet için)
    getProductsForCart: publicProcedure
        .input(z.array(z.object({
            productId: z.string(),
            sizeId: z.string().optional(),
            colorId: z.string().optional()
        })))
        .handler(async ({ input }) => {
            const productIds = input.map(item => item.productId);

            const products = await db.select().from(product).where(
                and(
                    inArray(product.id, productIds),
                    eq(product.available, true)
                )
            );

            // Get all sizes and colors for these products
            const [sizes, colors] = await Promise.all([
                db.select().from(size).where(inArray(size.productId, productIds)),
                db.select().from(color).where(inArray(color.productId, productIds))
            ]);

            return products.map(productData => {
                const requestedItem = input.find(item => item.productId === productData.id);
                const selectedSize = requestedItem?.sizeId
                    ? sizes.find(s => s.id === requestedItem.sizeId)
                    : null;
                const selectedColor = requestedItem?.colorId
                    ? colors.find(c => c.id === requestedItem.colorId)
                    : null;

                return {
                    ...productData,
                    selectedSize,
                    selectedColor
                };
            });
        })
};

export type GuestOrderRouter = typeof guestOrderRouter;