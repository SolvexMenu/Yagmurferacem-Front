import { type ProductFormValues } from "./product-create-schemas";
import { VariantStockTableHeader } from "./variant-stock-table-header";
import { VariantStockTableRow } from "./variant-stock-table-row";
import { useFormContext } from "react-hook-form";

export function VariantStockTable() {
    const { watch } = useFormContext<ProductFormValues>();
    const availableSizes = watch("availableSizes");
    const availableColors = watch("availableColors");

    if (availableSizes.length === 0 || availableColors.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <h3 className="text-lg font-medium">Varyant Stok Yönetimi</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <VariantStockTableHeader availableColors={availableColors} />
                    <tbody className="bg-white divide-y divide-gray-200">
                        {availableSizes.map(size => size.value && (
                            <VariantStockTableRow key={size.value} size={size} availableColors={availableColors} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
