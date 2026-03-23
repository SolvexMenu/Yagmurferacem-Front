// src/components/modals/AddProductModal.tsx

import { useState, type FC, type FormEvent, useEffect } from "react";
import { PlusCircle, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

// --- Props Interface ---
interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdd: (product: ProductFormData) => void;
}

export type ProductVariantData = {
  size: number;
  color: string;
  available: boolean;
  stock: number;
};

// This represents the data collected from the form
export type ProductFormData = {
  name: string;
  price: number;
  description: string;
  imageUrls: string[];
  discount?: number;
  stockCode?: string;
  available: boolean;
  categories: string[];
  variants: ProductVariantData[];
};

// --- Initial State Definitions ---
const initialVariantState: ProductVariantData = {
  size: 0,
  color: "",
  available: true,
  stock: 0,
};

const initialProductState: ProductFormData = {
  name: "",
  price: 0,
  description: "",
  imageUrls: [],
  stockCode: "",
  available: true,
  categories: [],
  variants: [],
  discount: 0,
};

// --- Component ---
export const AddProductModal: FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdd,
}) => {
  // --- State Management ---
  const [productData, setProductData] = useState<ProductFormData>(initialProductState);

  // State for temporary inputs for arrays
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [currentCategory, setCurrentCategory] = useState("");
  const [currentVariant, setCurrentVariant] = useState<ProductVariantData>(initialVariantState);

  // Effect to reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setProductData(initialProductState);
      setCurrentImageUrl("");
      setCurrentCategory("");
      setCurrentVariant(initialVariantState);
    }
  }, [isOpen]);

  // --- Handlers for Simple Inputs ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Handle number inputs specifically
    const isNumberField = type === 'number';
    const parsedValue = isNumberField ? (value === '' ? '' : parseFloat(value)) : value;

    setProductData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  // --- Handlers for Image URLs ---
  const handleAddImageUrl = () => {
    if (currentImageUrl && !productData.imageUrls.includes(currentImageUrl)) {
      setProductData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, currentImageUrl],
      }));
      setCurrentImageUrl("");
    }
  };

  const handleRemoveImageUrl = (urlToRemove: string) => {
    setProductData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((url) => url !== urlToRemove),
    }));
  };

  // --- Handlers for Categories ---
  const handleAddCategory = () => {
    if (currentCategory && !productData.categories.includes(currentCategory)) {
      setProductData((prev) => ({
        ...prev,
        categories: [...prev.categories, currentCategory],
      }));
      setCurrentCategory("");
    }
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setProductData((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat !== catToRemove),
    }));
  };

  // --- Handlers for Variants ---
  const handleVariantInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setCurrentVariant(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleAddVariant = () => {
    // Basic validation for variant
    if (!currentVariant.color || !currentVariant.size) {
      toast("Validation Error", { description: "Variant must have a size and color." });
      return;
    }
    setProductData(prev => ({
      ...prev,
      variants: [...prev.variants, currentVariant]
    }));
    setCurrentVariant(initialVariantState); // Reset for next variant
  };

  const handleRemoveVariant = (index: number) => {
    setProductData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };


  // --- Form Submission ---
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!productData.name || productData.price <= 0) {
      toast("Missing Required Fields", {
        description: "Please fill out Name and Price.",
      });
      return;
    }

    // Create final product data object, ensuring numbers are numbers
    const finalProductData: ProductFormData = {
      ...productData,
      price: Number(productData.price),
      discount: productData.discount ? Number(productData.discount) : undefined,
      variants: productData.variants.map(v => ({
        ...v,
        size: Number(v.size),
        stock: Number(v.stock),
      }))
    };

    onProductAdd(finalProductData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ürün oluştur</DialogTitle>
          <DialogDescription>
            Ürün bilgilerini ve varyantlarını eksiksiz olarak girin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="add-product-form" className="space-y-6">
          {/* --- Basic Product Info --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ürün ismi</Label>
              <Input id="name" name="name" value={productData.name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockCode">Stok kodu (Opsiyonel)</Label>
              <Input id="stockCode" name="stockCode" value={productData.stockCode} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Fiyat</Label>
              <Input id="price" name="price" type="number" value={productData.price} onChange={handleInputChange} required min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">İndirim (%)</Label>
              <Input id="discount" name="discount" type="number" value={productData.discount} onChange={handleInputChange} min="0" max="100" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea id="description" name="description" value={productData.description} onChange={handleInputChange} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="available" name="available" checked={productData.available} onCheckedChange={(checked) => setProductData(p => ({ ...p, available: !!checked }))} />
            <Label htmlFor="available">Ürün mevcut mu?</Label>
          </div>

          {/* --- Image URLs --- */}
          <div className="space-y-2">
            <Label>Resim Linkleri</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.png"
                value={currentImageUrl}
                onChange={(e) => setCurrentImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
              />
              <Button type="button" variant="outline" onClick={handleAddImageUrl}>Ekle</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {productData.imageUrls.map((url) => (
                <Badge key={url} variant="secondary">
                  {url}
                  <X className="ml-2 h-4 w-4 cursor-pointer" onClick={() => handleRemoveImageUrl(url)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* --- Categories --- */}
          <div className="space-y-2">
            <Label>Kategoriler</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Electronics, Laptops"
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
              />
              <Button type="button" variant="outline" onClick={handleAddCategory}>Ekle</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {productData.categories.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                  <X className="ml-2 h-4 w-4 cursor-pointer" onClick={() => handleRemoveCategory(cat)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* --- Variants Section --- */}
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-medium">Ürün varyantları</h3>
            {/* Form to add a new variant */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="v-size">Beden</Label>
                <Input id="v-size" name="size" type="number" value={currentVariant.size} onChange={handleVariantInputChange} placeholder="e.g., 42" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-color">Renk</Label>
                <Input id="v-color" name="color" value={currentVariant.color} onChange={handleVariantInputChange} placeholder="e.g., Red" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-stock">Stoktaki ürün sayısı</Label>
                <Input id="v-stock" name="stock" type="number" value={currentVariant.stock} onChange={handleVariantInputChange} />
              </div>
              <Button type="button" onClick={handleAddVariant} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Varyant ekle
              </Button>
            </div>

            {/* Table of added variants */}
            {productData.variants.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beden</TableHead>
                    <TableHead>Renk</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Seçenekler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productData.variants.map((variant, index) => (
                    <TableRow key={index}>
                      <TableCell>{variant.size}</TableCell>
                      <TableCell>{variant.color}</TableCell>
                      <TableCell>{variant.stock}</TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveVariant(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button type="submit" form="add-product-form">Ürün oluştur</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};