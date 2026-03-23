import { formSchema, } from "@/components/product-create-schemas";
import type z from "zod";

export function transformProductFormValuesForApi(data: z.infer<typeof formSchema>) {
    const variants = Object.entries(data.variantMatrix || {})
        .map(([key, value]) => {
            const [size, color] = key.split('_');
            const parsedSize = parseInt(size);
            return {
                size: isNaN(parsedSize) ? 0 : parsedSize,
                color,
                stock: value.stock,
                available: value.available,
            };
        })
        .filter(v => v.size > 0 && v.color && v.color.trim().length > 0);

    const {
        variantMatrix,
        availableColors,
        availableSizes,
        ...rest
    } = data;

    return {
        ...rest,
        imageUrls: rest.imageUrls.map(u => u.value),
        categories: rest.categories.map(c => c.value),
        variants,
    };
}
