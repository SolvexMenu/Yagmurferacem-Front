import { userProcedure } from "@/lib/orpc";
import { db } from "@/drizzle/db";
import { address } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

export const addressRouter = {
    getUserAddresses: userProcedure.handler(async ({ context }) => {
        return await db
            .select()
            .from(address)
            .where(eq(address.userId, context.session.user.id))
            .orderBy(desc(address.createdAt));
    }),

    createAddress: userProcedure
        .input(z.object({
            title: z.string().min(1, "Adres başlığı gerekli"),
            name: z.string().min(1, "İsim gerekli"),
            surname: z.string().min(1, "Soyisim gerekli"),
            phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
            city: z.string().min(1, "Şehir gerekli"),
            district: z.string().min(1, "İlçe gerekli"),
            fullAddress: z.string().min(10, "Adres çok kısa")
        }))
        .handler(async ({ input, context }) => {
            const newAddress = {
                id: uuidv4(),
                userId: context.session.user.id,
                ...input,
                updatedAt: new Date().toISOString()
            };

            await db.insert(address).values(newAddress as any);
            return { success: true, address: newAddress };
        }),

    deleteAddress: userProcedure
        .input(z.string())
        .handler(async ({ input, context }) => {
            await db
                .delete(address)
                .where(and(
                    eq(address.id, input),
                    eq(address.userId, context.session.user.id)
                ));
            
            return { success: true };
        })
};
