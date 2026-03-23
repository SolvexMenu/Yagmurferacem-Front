import { type ProductFormValues } from "./product-create-schemas";
import { useFormContext } from "react-hook-form";
import { FormField, FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface VariantStockTableRowProps {
    size: ProductFormValues["availableSizes"][number];
    availableColors: ProductFormValues["availableColors"];
}

export function VariantStockTableRow({ size, availableColors }: VariantStockTableRowProps) {
    const { control } = useFormContext<ProductFormValues>();

    return (
        <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{size.value}</td>
            {availableColors.map(color => color.value && (
                <td key={color.value} className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <FormField
                            control={control as any}
                            name={`variantMatrix.${size.value}_${color.value}.stock`}
                            defaultValue={0}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl><Input type="number" placeholder="Stok" className="w-24" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control as any}
                            name={`variantMatrix.${size.value}_${color.value}.available`}
                            defaultValue={true}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </td>
            ))}
        </tr>
    );
}
