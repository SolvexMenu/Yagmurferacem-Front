import { type ProductFormValues } from "./product-create-schemas";

interface VariantStockTableHeaderProps {
    availableColors: ProductFormValues["availableColors"];
}

export function VariantStockTableHeader({ availableColors }: VariantStockTableHeaderProps) {
    return (
        <thead className="bg-gray-50">
            <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beden</th>
                {availableColors.map(color => color.value && (
                    <th key={color.value} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{color.value}</th>
                ))}
            </tr>
        </thead>
    );
}
