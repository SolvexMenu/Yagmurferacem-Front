import { Control, useFieldArray } from "react-hook-form";
import { ProductFormValues } from "./product-create-schemas";
import { FormField, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";

interface FormFieldArrayProps {
    name: "imageUrls" | "categories" | "availableSizes" | "availableColors";
    label: string;
    placeholder: string;
    control: Control<ProductFormValues>;
    inputType?: string;
}

export function FormFieldArray({ name, label, placeholder, control, inputType = "text" }: FormFieldArrayProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name,
    });

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <FormLabel>{label}</FormLabel>
            {fields.map((field, index) => (
                <FormField
                    key={field.id}
                    control={control}
                    name={`${name}.${index}.value` as const}
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                            <FormControl><Input type={inputType} placeholder={placeholder} {...field} /></FormControl>
                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" } as any)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Yeni Ekle
            </Button>
        </div>
    );
}
