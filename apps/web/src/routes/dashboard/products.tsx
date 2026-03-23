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
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { ProductEditModal } from "@/components/edit-product";
import { ProductCreateModal } from "@/components/product-create-modal";
import { useState, useMemo, useEffect } from "react";
import Loader from "@/components/loader";
import { useSearchStore } from "@/state/search";
import { Plus, Package, Trash } from "lucide-react";
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
  const { searchQuery } = useSearchStore();
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
  }, [searchQuery]);

  const paginatedData = useMemo(() => {
    if (!productList.data) return { products: [], totalPages: 0 };

    let filtered = productList.data;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = productList.data.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.stockCode.toLowerCase().includes(q)
      );
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const products = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    return { products, totalPages };
  }, [productList.data, currentPage, searchQuery]);

  if (productList.isLoading) return <Loader />;

  const { products, totalPages } = paginatedData;

  return (
    <div className="p-2">
      <div className="mx-auto space-y-6">
        <div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-2xl font-bold">Ürün Yönetimi</CardTitle>
              <CardDescription className="mt-1">
                Toplam {productList.data?.length || 0} ürün
              </CardDescription>
            </div>
            <ProductCreateModal />
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
        </div>
      </div>

    </div>
  );
}
