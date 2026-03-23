import * as z from "zod";

export const colorSchema = z.object({
    value: z.string().min(2, { message: "Renk en az 2 karakter olmalıdır." })
});

export const sizeSchema = z.object({
    value: z.preprocess(
        (val) => String(val),
        z.string().min(1, { message: "Beden boş olamaz." })
    )
});

export const formSchema = z.object({
    name: z.string().min(2, { message: "Ürün adı en az 2 karakter olmalıdır." }),
    price: z.coerce.number().int().positive({ message: "Fiyat 0'dan büyük ve tam sayı olmalıdır." }),
    description: z.string().min(10, { message: "Açıklama en az 10 karakter olmalıdır." }),
    stockCode: z.string().min(1, { message: "Stok kodu gereklidir." }),
    discount: z.coerce.number().int().optional(),
    available: z.boolean().optional(),
    imageUrls: z.array(z.object({ value: z.string().url({ message: "Lütfen geçerli bir URL girin." }) })).nonempty("En az bir görsel link'i ekleyin."),
    categories: z.array(z.object({ value: z.string().min(1, { message: "Kategori boş olamaz." }) })).nonempty("En az bir kategori ekleyin."),
    availableSizes: z.array(sizeSchema).nonempty("En az bir beden tanımlayın."),
    availableColors: z.array(colorSchema).nonempty("En az bir renk tanımlayın."),
    variantMatrix: z.record(z.string(), z.object({
        stock: z.coerce.number().int().min(0, "Stok negatif olamaz."),
        available: z.boolean().default(true),
    })).optional(),
});

export type ProductFormValues = {
    name: string;
    price: number;
    description: string;
    stockCode: string;
    discount?: number;
    available?: boolean;
    imageUrls: { value: string }[];
    categories: { value: string }[];
    availableSizes: { value: string }[];
    availableColors: { value: string }[];
    variantMatrix?: Record<string, { stock: number; available: boolean }>;
};
