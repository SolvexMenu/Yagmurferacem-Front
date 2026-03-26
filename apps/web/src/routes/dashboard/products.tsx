import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle, Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { ProductEditModal } from "@/components/edit-product";
import { ProductCreateModal } from "@/components/product-create-modal";
import { useState, useMemo, useEffect } from "react";
import Loader from "@/components/loader";
import { useSearchStore } from "@/state/search";
import { Plus, Package, Trash, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard/products")({
  component: RouteComponent,
});

const ITEMS_PER_PAGE = 10;

function ProductDeleteButton({ 
  product, 
  onDelete, 
  isLoading,
  showForceDialog,
  orderCount,
  onShowForceDialog,
  onHideForceDialog
}: { 
  product: any, 
  onDelete: (id: string, forceDelete?: boolean) => void,
  isLoading: boolean,
  showForceDialog: boolean,
  orderCount: number,
  onShowForceDialog: () => void,
  onHideForceDialog: () => void
}) {
  const handleFirstDelete = () => {
    onDelete(product.id, false);
  };

  const handleForceDelete = () => {
    onDelete(product.id, true);
    onHideForceDialog();
  };

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size={"icon"} variant={"destructive"} disabled={isLoading}>
            <Trash className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{product.name}" ürününü silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz ve ürünle ilgili tüm veriler silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFirstDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showForceDialog} onOpenChange={onHideForceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişlerle Birlikte Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ürün {orderCount} siparişte kullanılıyor. Ürünü silmek için bu siparişleri de silmeniz gerekiyor.
              <br /><br />
              <strong>Uyarı:</strong> Bu işlem geri alınamaz ve ilgili tüm siparişler silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Siliniyor..." : "Siparişlerle Birlikte Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RouteComponent() {
  const productList = useQuery(orpc.productRouter.getAllProducts.queryOptions());
  const addItem = useMutation(orpc.productRouter.addProduct.mutationOptions());
  const { searchQuery, setSearchQuery } = useSearchStore();
  const removeItem = useMutation({
    ...orpc.productRouter.deleteProductById.mutationOptions(),
    onSuccess: () => {
      productList.refetch();
      setForceDialogState({ show: false, productId: "", orderCount: 0 });
    }
  });

  const [forceDialogState, setForceDialogState] = useState({
    show: false,
    productId: "",
    orderCount: 0
  });

  const [filters, setFilters] = useState({
    category: "ALL",
    color: "ALL",
    size: "ALL",
    stock: "ALL",
    minPrice: "",
    maxPrice: ""
  });

  const handleProductDelete = (productId: string, forceDelete = false) => {
    removeItem.mutate(
      { id: productId, forceDelete },
      {
        onError: (error: any) => {
          if (error) {
            setForceDialogState({
              show: true,
              productId,
              orderCount: error.orderCount || 0
            });
          } else {
            alert(error.message || "Ürün silinirken bir hata oluştu");
          }
        }
      }
    );
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const uniqueValues = useMemo(() => {
    if (!productList.data) return { categories: [], colors: [], sizes: [] };
    
    const categories = new Set<string>();
    const colors = new Set<string>();
    const sizes = new Set<string>();

    productList.data.forEach(p => {
      p.categories?.forEach(cat => categories.add(cat));
      p.Color?.forEach(c => colors.add(c.color));
      p.Size?.forEach(s => sizes.add(s.size.toString()));
    });

    return {
      categories: Array.from(categories).sort(),
      colors: Array.from(colors).sort(),
      sizes: Array.from(sizes).sort((a, b) => parseFloat(a) - parseFloat(b))
    };
  }, [productList.data]);

  const paginatedData = useMemo(() => {
    if (!productList.data) return { products: [], totalPages: 0 };

    let filtered = productList.data;

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.stockCode.toLowerCase().includes(q)
      );
    }

    // Category Filter
    if (filters.category !== "ALL") {
      filtered = filtered.filter(p => p.categories?.includes(filters.category));
    }

    // Color Filter
    if (filters.color !== "ALL") {
      filtered = filtered.filter(p => p.Color?.some(c => c.color === filters.color));
    }

    // Size Filter
    if (filters.size !== "ALL") {
      filtered = filtered.filter(p => p.Size?.some(s => s.size.toString() === filters.size));
    }

    // Stock Filter
    if (filters.stock !== "ALL") {
      const isAvailable = filters.stock === "AVAILABLE";
      filtered = filtered.filter(p => p.available === isAvailable);
    }

    // Price Filter
    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= parseFloat(filters.maxPrice));
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const products = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    return { products, totalPages };
  }, [productList.data, currentPage, searchQuery, filters]);

  if (productList.isLoading) return <Loader />;

  const { products, totalPages } = paginatedData;

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Ürün Yönetimi</CardTitle>
              <CardDescription className="mt-1">
                Toplam {productList.data?.length || 0} ürün
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-72 bg-background border rounded-lg px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  type="search"
                  placeholder="Ürün ara..."
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <ProductCreateModal />
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-wrap gap-2 items-center pt-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-2">
              <Filter className="h-4 w-4" />
              Filtreler:
            </div>
            
            <Select value={filters.category} onValueChange={(v) => setFilters(f => ({ ...f, category: v }))}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
                {uniqueValues.categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.color} onValueChange={(v) => setFilters(f => ({ ...f, color: v }))}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue placeholder="Renk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Renkler</SelectItem>
                {uniqueValues.colors.map(color => (
                  <SelectItem key={color} value={color}>{color}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.size} onValueChange={(v) => setFilters(f => ({ ...f, size: v }))}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue placeholder="Beden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Bedenler</SelectItem>
                {uniqueValues.sizes.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.stock} onValueChange={(v) => setFilters(f => ({ ...f, stock: v }))}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue placeholder="Stok" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Stoklar</SelectItem>
                <SelectItem value="AVAILABLE">Stokta Var</SelectItem>
                <SelectItem value="UNAVAILABLE">Stokta Yok</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Input 
                placeholder="Min ₺" 
                type="number" 
                className="w-20 h-8 text-xs" 
                value={filters.minPrice}
                onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))}
              />
              <span className="text-muted-foreground">-</span>
              <Input 
                placeholder="Max ₺" 
                type="number" 
                className="w-20 h-8 text-xs" 
                value={filters.maxPrice}
                onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
              />
            </div>

            {(filters.category !== "ALL" || filters.color !== "ALL" || filters.size !== "ALL" || filters.stock !== "ALL" || filters.minPrice || filters.maxPrice) && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setFilters({
                  category: "ALL",
                  color: "ALL",
                  size: "ALL",
                  stock: "ALL",
                  minPrice: "",
                  maxPrice: ""
                })}
              >
                <X className="h-3 w-3 mr-1" />
                Sıfırla
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-20">Görsel</TableHead>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead className="w-28">Fiyat</TableHead>
                  <TableHead className="w-24">İndirim</TableHead>
                  <TableHead className="w-24">Stok</TableHead>
                  <TableHead className="w-32">Renkler</TableHead>
                  <TableHead className="w-32">Bedenler</TableHead>
                  <TableHead className="w-24 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Package className="h-10 w-10 mb-2 opacity-50" />
                        <p>Henüz ürün bulunmuyor</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <img
                          src={product.imageUrls?.[0]}
                          alt={product.name}
                          className="w-14 h-14 rounded-lg object-cover border"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-semibold">{product.price}₺</TableCell>
                      <TableCell>
                        {product.discount ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            %{product.discount}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.available ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Var
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            Yok
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.Color.slice(0, 3).map((c, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {c.color}
                            </Badge>
                          ))}
                          {product.Color.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.Color.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.Size.slice(0, 3).map((s, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {s.size}
                            </Badge>
                          ))}
                          {product.Size.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.Size.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right self-center">
                        <div className="flex gap-2 justify-end">
                          <ProductEditModal product={product as any} />
                          <ProductDeleteButton
                            product={product}
                            onDelete={handleProductDelete}
                            isLoading={removeItem.isPending}
                            showForceDialog={forceDialogState.show && forceDialogState.productId === product.id}
                            orderCount={forceDialogState.orderCount}
                            onShowForceDialog={() => setForceDialogState(prev => ({ ...prev, show: true, productId: product.id }))}
                            onHideForceDialog={() => setForceDialogState(prev => ({ ...prev, show: false }))}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
