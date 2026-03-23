import { useEffect, useState } from "react";
import { useForm, useFieldArray, type SubmitHandler, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Trash2, Check, ChevronsUpDown } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { formSchema, type ProductFormValues } from "./product-create-schemas";
import { transformProductFormValuesForApi } from "@/lib/product-utils";
import { VariantStockTable } from "./variant-stock-table";
import { cn } from "@/lib/utils";

const generateStockCode = (name: string) => {
    if (!name || name.trim() === "") return "";
    return name
        .toUpperCase()
        .replace(/İ/g, 'I')
        .replace(/Ğ/g, 'G')
        .replace(/Ü/g, 'U')
        .replace(/Ş/g, 'S')
        .replace(/Ö/g, 'O')
        .replace(/Ç/g, 'C')
        .replace(/[^A-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 0)
        .slice(0, 3)
        .map(w => w.substring(0, 4))
        .join('-');
};

export function ProductCreateModal() {
    const [open, setOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const queryClient = useQueryClient();
    const addItem = useMutation(orpc.productRouter.addProduct.mutationOptions({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orpc.productRouter.getAllProducts.queryKey() });
            queryClient.invalidateQueries({ queryKey: orpc.productRouter.getCategories.queryKey() });
        }
    }));
    const { data: existingCategories } = useQuery(orpc.productRouter.getCategories.queryOptions());

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            price: 0,
            description: "",
            stockCode: "",
            available: true,
            discount: undefined,
            imageUrls: [],
            categories: [],
            availableSizes: [],
            availableColors: [],
            variantMatrix: {},
        },
    });

    const { control, setValue } = form;
    const nameValue = useWatch({ control, name: "name" });

    useEffect(() => {
        if (nameValue) {
            setValue("stockCode", generateStockCode(nameValue), { shouldValidate: true });
        }
    }, [nameValue, setValue]);

    const { fields: imageUrlFields, append: appendImageUrl, remove: removeImageUrl } = useFieldArray({
        control: form.control,
        name: "imageUrls",
    });

    const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
        control: form.control,
        name: "categories",
    });

    const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
        control: form.control,
        name: "availableSizes",
    });

    const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
        control: form.control,
        name: "availableColors",
    });

    const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
        const payload = transformProductFormValuesForApi(data);

        if (payload.variants.length === 0) {
            toast.error("En az bir varyant için stok bilgisi girmelisiniz.");
            return;
        }

        addItem.mutate(payload as any, {
            onSuccess: () => {
                toast.success("Ürün başarıyla oluşturuldu!");
                form.reset();
                setOpen(false);
            },
            onError: (error) => {
                console.error("Mutation Error:", error);
                toast.error(`Bir hata oluştu: ${error.message}`);
            }
        });
    };

    const toggleCategory = (catName: string) => {
        const index = categoryFields.findIndex(c => c.value === catName);
        if (index > -1) {
            removeCategory(index);
        } else {
            appendCategory({ value: catName });
        }
    };

    const handleAddNewCategory = () => {
        if (newCategoryName.trim()) {
            toggleCategory(newCategoryName.trim());
            setNewCategoryName("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Yeni Ürün Ekle</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Yeni Ürün Oluştur</DialogTitle>
                    <DialogDescription>
                        Ürün bilgilerini ve varyantlarını eksiksiz olarak girin.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)}>
                        <ScrollArea className="h-[70vh] p-4">
                            <div className="space-y-8">
                                {/* Basic Product Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField 
                                        control={form.control as any} 
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
                                        control={form.control as any} 
                                        name="stockCode" 
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-blue-600 font-semibold">Stok Kodu (Otomatik Oluşturulur)</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="Ürün adı girince otomatik oluşur" 
                                                        {...field} 
                                                        readOnly 
                                                        disabled
                                                        className="bg-gray-100 cursor-not-allowed border-dashed" 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} 
                                    />
                                    
                                    <FormField 
                                        control={form.control as any} 
                                        name="price" 
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fiyat (TL)</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="Örn: 299" 
                                                        {...field}
                                                        onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value) || 0))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} 
                                    />
                                    
                                    <FormField 
                                        control={form.control as any} 
                                        name="discount" 
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>İndirim Oranı (%)</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="Örn: 10 (Boş bırakılabilir)" 
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            field.onChange(val === '' ? undefined : Math.round(parseFloat(val)));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} 
                                    />
                                </div>

                                {/* Description */}
                                <FormField 
                                    control={form.control as any} 
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

                                {/* Availability Toggle */}
                                <FormField 
                                    control={form.control as any} 
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

                                {/* Image URLs */}
                                <div className="space-y-4 rounded-lg border p-4">
                                    <FormLabel>Görsel Linkleri</FormLabel>
                                    {imageUrlFields.map((field, index) => (
                                        <FormField
                                            key={field.id}
                                            control={form.control as any}
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
                                        <PlusCircle className="mr-2 h-4 w-4" /> 
                                        Yeni Görsel Ekle
                                    </Button>
                                </div>

                                {/* Categories */}
                                <div className="space-y-4 rounded-lg border p-4">
                                    <FormLabel>Kategoriler</FormLabel>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {categoryFields.map((field, index) => (
                                            <Badge key={field.id} variant="secondary">
                                                {field.value}
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-3 w-3 ml-1 p-0 hover:bg-transparent"
                                                    onClick={() => removeCategory(index)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                Kategori Seç...
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0">
                                            <div className="p-2">
                                                <div className="flex gap-2 mb-2">
                                                    <Input 
                                                        placeholder="Yeni kategori..." 
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewCategory())}
                                                    />
                                                    <Button type="button" size="sm" onClick={handleAddNewCategory}>
                                                        Ekle
                                                    </Button>
                                                </div>
                                                <ScrollArea className="h-48">
                                                    <div className="space-y-1">
                                                        {(existingCategories || []).map((cat) => (
                                                            <div 
                                                                key={cat.name} 
                                                                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                                                                onClick={() => toggleCategory(cat.name)}
                                                            >
                                                                <Checkbox 
                                                                    checked={categoryFields.some(c => c.value === cat.name)}
                                                                />
                                                                <label className="text-sm cursor-pointer flex-1">
                                                                    {cat.name} ({cat.count})
                                                                </label>
                                                                {categoryFields.some(c => c.value === cat.name) && (
                                                                    <Check className="h-4 w-4" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Sizes and Colors */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Sizes */}
                                    <div className="space-y-4 rounded-lg border p-4">
                                        <FormLabel>Beden Seçenekleri</FormLabel>
                                        {sizeFields.map((field, index) => (
                                            <FormField
                                                key={field.id}
                                                control={form.control as any}
                                                name={`availableSizes.${index}.value`}
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2">
                                                        <FormControl>
                                                            <Input placeholder="42" {...field} />
                                                        </FormControl>
                                                        <Button 
                                                            type="button" 
                                                            variant="destructive" 
                                                            size="icon" 
                                                            onClick={() => removeSize(index)}
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
                                            onClick={() => appendSize({ value: "" })}
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" /> 
                                            Beden Ekle
                                        </Button>
                                    </div>

                                    {/* Colors */}
                                    <div className="space-y-4 rounded-lg border p-4">
                                        <FormLabel>Renk Seçenekleri</FormLabel>
                                        {colorFields.map((field, index) => (
                                            <FormField
                                                key={field.id}
                                                control={form.control as any}
                                                name={`availableColors.${index}.value`}
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2">
                                                        <FormControl>
                                                            <Input placeholder="Mavi" {...field} />
                                                        </FormControl>
                                                        <Button 
                                                            type="button" 
                                                            variant="destructive" 
                                                            size="icon" 
                                                            onClick={() => removeColor(index)}
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
                                            onClick={() => appendColor({ value: "" })}
                                        >
                                            <PlusCircle className="mr-2 h-4 w-4" /> 
                                            Renk Ekle
                                        </Button>
                                    </div>
                                </div>

                                {/* Variant Stock Table */}
                                <VariantStockTable />
                            </div>
                        </ScrollArea>
                        <DialogFooter className="pt-6">
                            <Button type="submit" disabled={addItem.isPending}>
                                {addItem.isPending ? "Kaydediliyor..." : "Ürünü Kaydet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}