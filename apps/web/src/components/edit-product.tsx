// Imports remain the same
import { useEffect, useState } from "react";
import {
    useForm,
    useFieldArray,
    type Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

// --- TYPE DEFINITIONS & SCHEMA ---
interface Size {
    id: string;
    size: number;
    available: boolean;
}

interface Color {
    id: string;
    color: string;
    available: boolean;
}

interface ProductVariant {
    id: string;
    size: number;
    color: string;
    available: boolean;
    stock: number;
}

interface ProductWithRelations {
    id: string;
    name: string;
    price: number;
    description: string;
    imageUrls: string[];
    discount: number | null;
    stockCode: string;
    available: boolean;
    categories: string[];
    variants: ProductVariant[];
}

interface ProductEditModalProps {
    product: ProductWithRelations;
}

const formSchema = z.object({
    name: z.string().min(2, { message: "Ürün adı en az 2 karakter olmalıdır." }),
    price: z.preprocess(
        (val) => (val === "" ? NaN : Number(val)),
        z
            .number({ error: "Geçerli bir fiyat girin." })
            .positive({ message: "Fiyat 0'dan büyük olmalıdır." }),
    ),
    description: z
        .string()
        .min(10, { message: "Açıklama en az 10 karakter olmalıdır." }),
    stockCode: z.string().optional(),
    discount: z.preprocess(
        (val) => (String(val).trim() === "" ? undefined : Number(val)),
        z
            .number({ error: "İndirim bir sayı olmalıdır." })
            .int()
            .default(0)
            .optional(),
    ),
    available: z.boolean().default(true),
    imageUrls: z.array(
        z.object({
            value: z.string().url({ message: "Lütfen geçerli bir URL girin." }),
        }),
    ),
    categories: z.array(
        z.object({ value: z.string().min(1, { message: "Kategori boş olamaz." }) }),
    ),
    variants: z.array(
        z.object({
            id: z.string().optional(),
            size: z.preprocess(
                (val) => (val === "" ? NaN : Number(val)),
                z
                    .number({ error: "Beden bir sayı olmalıdır." })
                    .int()
                    .positive({ message: "Beden pozitif bir sayı olmalıdır." }),
            ),
            color: z.string().min(1, { message: "Renk adı zorunludur." }),
            available: z.boolean().default(true),
            stock: z.preprocess(
                (val) => (val === "" ? NaN : Number(val)),
                z
                    .number({ error: "Stok miktarı bir sayı olmalıdır." })
                    .int()
                    .min(0, { message: "Stok miktarı 0 veya pozitif olmalıdır." }),
            ),
        }),
    ),
});

type ProductFormValues = z.infer<typeof formSchema>;

// ====================================================================
// 1. EXTRACTED FORM BODY COMPONENT
// This component now contains all the form fields and their logic.
// ====================================================================
function ProductFormBody({
    control,
}: {
    control: Control<ProductFormValues>;
}) {
    const {
        fields: imageUrlFields,
        append: appendImageUrl,
        remove: removeImageUrl,
    } = useFieldArray({ control, name: "imageUrls" });
    const {
        fields: categoryFields,
        append: appendCategory,
        remove: removeCategory,
    } = useFieldArray({ control, name: "categories" });
    const {
        fields: variantFields,
        append: appendVariant,
        remove: removeVariant,
    } = useFieldArray({ control, name: "variants" });

    return (
        <ScrollArea className="h-[60vh] sm:h-[70vh] px-1 sm:px-4">
            <div className="space-y-6 sm:space-y-8 pb-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ürün Adı</FormLabel>
                                <FormControl>
                                    <Input placeholder="Örn: Pamuklu Tişört" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="stockCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stok Kodu</FormLabel>
                                <FormControl>
                                    <Input placeholder="Örn: TSH-001" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fiyat (TL)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Örn: 299" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="discount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>İndirim Oranı (%)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Örn: 10 (Boş bırakılabilir)"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Açıklama</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ürün hakkında detaylı bilgi..."
                                    className="resize-y"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="available"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel>Satışa Açık mı?</FormLabel>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Dynamic Fields */}
                <div className="space-y-4">
                    <FormLabel>Görsel URL'leri</FormLabel>
                    {imageUrlFields.map((field, index) => (
                        <FormField
                            key={field.id}
                            control={control}
                            name={`imageUrls.${index}.value`}
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                    <FormControl>
                                        <Input placeholder="https://..." {...field} />
                                    </FormControl>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeImageUrl(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendImageUrl({ value: "" })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Yeni Görsel Ekle
                    </Button>
                </div>

                <div className="space-y-4">
                    <FormLabel>Kategoriler</FormLabel>
                    {categoryFields.map((field, index) => (
                        <FormField
                            key={field.id}
                            control={control}
                            name={`categories.${index}.value`}
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-2">
                                    <FormControl>
                                        <Input placeholder="kışlık" {...field} />
                                    </FormControl>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeCategory(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendCategory({ value: "" })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Yeni Kategori Ekle
                    </Button>
                </div>

                <div className="space-y-4">
                    <FormLabel>Ürün Varyantları</FormLabel>
                    {variantFields.map((field, index) => (
                        <div key={field.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Varyant {index + 1}</h4>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => removeVariant(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormField
                                    control={control}
                                    name={`variants.${index}.size`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Beden</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="42" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`variants.${index}.color`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Renk</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Mavi" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`variants.${index}.stock`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Stok Miktarı</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="50" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`variants.${index}.available`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel>Satışa Açık</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendVariant({
                            size: 0,
                            color: "",
                            stock: 0,
                            available: true
                        })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Yeni Varyant Ekle
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );
}

export function ProductEditModal({ product }: ProductEditModalProps) {
    const [open, setOpen] = useState(false);
    const edit = useMutation(orpc.productRouter.updateProduct.mutationOptions())

    const form = useForm<ProductFormValues>({
        // @ts-ignore
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            price: 0,
            description: "",
            stockCode: "",
            available: true,
            discount: undefined,
            imageUrls: [],
            categories: [],
            variants: [],
        },
    });

    useEffect(() => {
        if (product && open) {
            form.reset({
                name: product.name,
                price: product.price,
                description: product.description,
                stockCode: product.stockCode,
                available: product.available,
                discount: product.discount ?? undefined,
                imageUrls: product.imageUrls.map((url) => ({ value: url })),
                categories: product.categories.map((cat) => ({ value: cat })),
                variants: product.variants || [],
            });
        }
    }, [product, open, form]);

    async function onSubmit(data: ProductFormValues) {
        try {
            await edit.mutateAsync({
                id: product.id,
                name: data.name,
                price: data.price,
                description: data.description,
                stockCode: data.stockCode ?? "",
                available: data.available,
                discount: data.discount,
                imageUrls: data.imageUrls.map((url) => url.value),
                categories: data.categories.map((cat) => cat.value),
                variants: data.variants.map(variant => ({
                    size: variant.size,
                    color: variant.color,
                    available: variant.available,
                    stock: variant.stock,
                })),
            });

            toast.success("Ürün başarıyla güncellendi!");
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Bir hata oluştu.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Düzenle</Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-4xl sm:w-full rounded-lg sm:rounded-xl">
                <DialogHeader className="text-left">
                    <DialogTitle>Ürünü Düzenle</DialogTitle>
                    <DialogDescription>
                        "{product.name}" ürününün bilgilerini güncelleyin.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    {/* @ts-ignore */}
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        {/* @ts-ignore */}
                        <ProductFormBody control={form.control} />
                        <DialogFooter className="pt-4 sm:pt-6">
                            <Button className="w-full sm:w-auto" type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting
                                    ? "Kaydediliyor..."
                                    : "Değişiklikleri Kaydet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}