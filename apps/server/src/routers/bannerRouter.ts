import { db } from "@/drizzle/db";
import { banners } from "@/drizzle/schema";
import { protectedProcedure, publicProcedure } from "@/lib/orpc";
import { eq } from "drizzle-orm";
import z from "zod";

export const bannerRouter = {
    getCarousel: publicProcedure.handler(async () => {
        const list = await db.select({
            carousel: banners.carousel
        }).from(banners).limit(1);

        return list[0].carousel;
    }),

    getSeparator: publicProcedure.handler(async () => {
        const list = await db.select({
            separator: banners.separator
        }).from(banners).limit(1);

        return list[0]?.separator;
    }),

    getShippingPrice: publicProcedure.handler(async () => {
        const list = await db.select({
            shippingPrice: banners.shippingPrice
        }).from(banners).limit(1);

        return list[0]?.shippingPrice;
    }),

    updateCarousel: protectedProcedure
        .input(z.string().array().nonempty())
        .handler(async ({ input }) => {
            const t = await db.select({ id: banners.id }).from(banners).limit(1);

            if (!t[0]?.id) return null;

            const list = await db.update(banners)
                .set({ carousel: input })
                .where(eq(banners.id, t[0].id))
                .returning({ carousel: banners.carousel });

            return list[0]?.carousel;
        }),

    updateSeparator: protectedProcedure
        .input(z.string())
        .handler(async ({ input }) => {
            const t = await db.select({ id: banners.id }).from(banners).limit(1);

            if (!t[0]?.id) return null;

            const list = await db.update(banners)
                .set({ separator: input })
                .where(eq(banners.id, t[0].id))
                .returning({ separator: banners.separator });

            return list[0]?.separator;
        }),

    updateShippingPrice: protectedProcedure
        .input(z.number())
        .handler(async ({ input }) => {
            const t = await db.select({ id: banners.id }).from(banners).limit(1);

            if (!t[0]?.id) return null;

            const thing = await db.update(banners)
                .set({ shippingPrice: input })
                .where(eq(banners.id, t[0].id))
                .returning({ shippingPrice: banners.shippingPrice });

            return thing[0]?.shippingPrice;
        })
}