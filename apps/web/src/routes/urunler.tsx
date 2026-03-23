import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ProductCard, Thing } from '.'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/utils/orpc'
import Loader from '@/components/loader'
import { proxy, useSnapshot } from "valtio"
import { Filter } from "lucide-react"
import { ScrollArea } from '@/components/ui/scroll-area'

export const Route = createFileRoute('/urunler')({
    component: RouteComponent,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            d: (search.d as string) || undefined,
            q: (search.q as string) || undefined,
        }
    },
})

const state = proxy({
    filters: {
        categories: [] as string[],
        sizes: [] as string[],
        colors: [] as string[],
        sortBy: 'featured' as string
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 12
    },
    ui: {
        isFilterSheetOpen: false
    }
})

function FilterContent({ categories, sizes, colors, snap }: {
    categories: any,
    sizes: any,
    colors: any,
    snap: any
}) {
    const toggleFilter = (type: 'categories' | 'sizes' | 'colors', value: string) => {
        const currentFilters = state.filters[type]
        if (currentFilters.includes(value)) {
            state.filters[type] = currentFilters.filter(item => item !== value)
        } else {
            state.filters[type] = [...currentFilters, value]
        }
        // Reset to first page when filters change
        state.pagination.currentPage = 1
    }

    const clearAllFilters = () => {
        state.filters.categories = []
        state.filters.sizes = []
        state.filters.colors = []
        // Reset to first page when filters are cleared
        state.pagination.currentPage = 1
    }

    return (
        <div className="mx-4 space-y-4 py-4">
            <div className="flex items-center justify-between">
                {(snap.filters.categories.length > 0 || snap.filters.sizes.length > 0 || snap.filters.colors.length > 0) && (
                    <button
                        onClick={clearAllFilters}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Temizle
                    </button>
                )}
            </div>

            <div>
                <p className="text-xl">Kategoriler</p>
                <hr className='text-border my-2' />
                <div className="space-y-3">
                    {categories.data?.map((category: any) => (
                        <div key={category.name} className="flex items-center space-x-2">
                            <Checkbox
                                id={category.name}
                                checked={snap.filters.categories.includes(category.name)}
                                onCheckedChange={() => toggleFilter('categories', category.name)}
                            />
                            <Label htmlFor={category.name} className="flex-1 text-sm cursor-pointer">
                                {category.name}
                            </Label>
                            <span className="text-xs text-muted-foreground">({category.count})</span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xl">Beden</p>
                <hr className='text-border my-2' />
                <div className="space-y-3">
                    {sizes.data?.map((size: any) => (
                        <div key={size.name} className="flex items-center space-x-2">
                            <Checkbox
                                id={`size-${size.name}`}
                                checked={snap.filters.sizes.includes(size.name)}
                                onCheckedChange={() => toggleFilter('sizes', size.name)}
                            />
                            <Label htmlFor={`size-${size.name}`} className="flex-1 text-sm cursor-pointer">
                                {size.name}
                            </Label>
                            <span className="text-xs text-muted-foreground">({size.count})</span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-xl">Renk</p>
                <hr className='text-border my-2' />
                <div className="space-y-3">
                    {colors.data?.map((color: any) => (
                        <div key={color.name} className="flex items-center space-x-2">
                            <Checkbox
                                id={`color-${color.name}`}
                                checked={snap.filters.colors.includes(color.name)}
                                onCheckedChange={() => toggleFilter('colors', color.name)}
                            />
                            <Label htmlFor={`color-${color.name}`} className="flex-1 text-sm cursor-pointer">
                                {color.name}
                            </Label>
                            <span className="text-xs text-muted-foreground">({color.count})</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function RouteComponent() {
    const { d, q } = Route.useSearch()
    const list = useQuery(orpc.productRouter.getAllProducts.queryOptions())
    const categories = useQuery(orpc.productRouter.getCategories.queryOptions())
    const sizes = useQuery(orpc.productRouter.getSizes.queryOptions())
    const colors = useQuery(orpc.productRouter.getColor.queryOptions())
    const snap = useSnapshot(state)

    // Set default category from URL parameter
    React.useEffect(() => {
        if (d && !state.filters.categories.includes(d)) {
            state.filters.categories = [d]
        }
    }, [d])

    if (list.isLoading || categories.isLoading || sizes.isLoading || colors.isLoading) return <Loader />

    const filteredProducts = list.data?.filter(product => {
        if (q && q.trim()) {
            const query = q.toLowerCase();
            const matchesName = product.name.toLowerCase().includes(query);
            const matchesCode = product.stockCode && product.stockCode.toLowerCase().includes(query);
            if (!matchesName && !matchesCode) return false;
        }

        if (snap.filters.categories.length > 0) {
            const hasMatchingCategory = product.categories?.some(cat =>
                snap.filters.categories.includes(cat)
            )
            if (!hasMatchingCategory) return false
        }

        if (snap.filters.sizes.length > 0) {
            const hasMatchingSize = product.Size?.some(size =>
                snap.filters.sizes.includes(`${size.size}`)
            )
            if (!hasMatchingSize) return false
        }

        if (snap.filters.colors.length > 0) {
            const hasMatchingColor = product.Color?.some(color =>
                snap.filters.colors.includes(color.color)
            )
            if (!hasMatchingColor) return false
        }

        return true
    }) || []

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (snap.filters.sortBy) {
            case 'price-low':
                return a.price - b.price
            case 'price-high':
                return b.price - a.price
            // case 'newest':
            //     return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            // case 'rating':
            //     return (b.rating || 0) - (a.rating || 0)
            default:
                return 0
        }
    })

    // Pagination logic
    const totalProducts = sortedProducts.length
    const totalPages = Math.ceil(totalProducts / snap.pagination.itemsPerPage)
    const startIndex = (snap.pagination.currentPage - 1) * snap.pagination.itemsPerPage
    const endIndex = startIndex + snap.pagination.itemsPerPage
    const paginatedProducts = sortedProducts.slice(startIndex, endIndex)

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            state.pagination.currentPage = page
        }
    }

    const goToPreviousPage = () => {
        if (snap.pagination.currentPage > 1) {
            state.pagination.currentPage = snap.pagination.currentPage - 1
        }
    }

    const goToNextPage = () => {
        if (snap.pagination.currentPage < totalPages) {
            state.pagination.currentPage = snap.pagination.currentPage + 1
        }
    }

    return (
        <div className='container'>
            <div className='my-4'>
                <div className="space-y-6 mb-8">
                    {/* <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-balance">Tüm ürünler</h1>
                        <p className="text-lg text-muted-foreground text-pretty">
                            Discover our complete collection of premium products
                        </p>
                    </div> */}

                    <div className="flex flex-row gap-2 sm:gap-4 items-center justify-between w-full">
                        {/* Mobile filter button */}
                        <div className="lg:hidden">
                            <Sheet open={snap.ui.isFilterSheetOpen} onOpenChange={(open) => state.ui.isFilterSheetOpen = open}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        Filtreler
                                        {(snap.filters.categories.length > 0 || snap.filters.sizes.length > 0 || snap.filters.colors.length > 0) && (
                                            <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                                                {snap.filters.categories.length + snap.filters.sizes.length + snap.filters.colors.length}
                                            </span>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-80 sm:w-96">
                                    {/* <SheetHeader>
                                        <SheetTitle>Filtreler</SheetTitle>
                                    </SheetHeader> */}
                                    <ScrollArea className='h-full'>
                                        <FilterContent categories={categories} sizes={sizes} colors={colors} snap={snap} />
                                    </ScrollArea>
                                </SheetContent>
                            </Sheet>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={snap.filters.sortBy} onValueChange={(value) => state.filters.sortBy = value}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="featured">Önerilen sıralama</SelectItem>
                                    <SelectItem value="price-low">Fiyat: Düşükten Yükseğe</SelectItem>
                                    <SelectItem value="price-high">Fiyat: Yüksekten Düşüğe</SelectItem>
                                    {/* <SelectItem value="newest">En Yeni</SelectItem>
                                    <SelectItem value="rating">En Yüksek Puanlı</SelectItem> */}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Desktop sidebar - hidden on mobile */}
                    <aside className="hidden lg:block lg:w-64 flex-shrink-0">
                        <FilterContent categories={categories} sizes={sizes} colors={colors} snap={snap} />
                    </aside>

                    <div className="flex-1">
                        <div className="space-y-6">
                            {/* Results counter */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {totalProducts > 0 ? (
                                        <>
                                            {startIndex + 1}-{Math.min(endIndex, totalProducts)} / {totalProducts} ürün gösteriliyor
                                        </>
                                    ) : (
                                        "Ürün bulunamadı"
                                    )}
                                </p>
                                {totalPages > 1 && (
                                    <p className="text-sm text-muted-foreground">
                                        Sayfa {snap.pagination.currentPage} / {totalPages}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedProducts.length > 0 ? (
                                    paginatedProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            id={`${product.id}`}
                                            img={product.imageUrls[0]}
                                            name={product.name}
                                            price={product.discount ? `${product.price - (product.price * product.discount / 100)}` : `${product.price}`}
                                            imageClass='object-contain'
                                            discountPercentage={product.discount as number}
                                            originalPrice={product.discount ? `${product.price}` : ""}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12">
                                        <p className="text-muted-foreground">Seçilen filtrelere uygun ürün bulunamadı.</p>
                                    </div>
                                )}
                            </div>

                            {totalPages > 1 && (
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={goToPreviousPage}
                                                className={snap.pagination.currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>

                                        {/* Show first page */}
                                        {snap.pagination.currentPage > 3 && (
                                            <>
                                                <PaginationItem>
                                                    <PaginationLink
                                                        onClick={() => goToPage(1)}
                                                        className="cursor-pointer"
                                                    >
                                                        1
                                                    </PaginationLink>
                                                </PaginationItem>
                                                {snap.pagination.currentPage > 4 && (
                                                    <PaginationItem>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                )}
                                            </>
                                        )}

                                        {/* Show pages around current page */}
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(page => {
                                                const current = snap.pagination.currentPage
                                                return page >= Math.max(1, current - 2) && page <= Math.min(totalPages, current + 2)
                                            })
                                            .map(page => (
                                                <PaginationItem key={page}>
                                                    <PaginationLink
                                                        onClick={() => goToPage(page)}
                                                        isActive={page === snap.pagination.currentPage}
                                                        className="cursor-pointer"
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}

                                        {/* Show last page */}
                                        {snap.pagination.currentPage < totalPages - 2 && (
                                            <>
                                                {snap.pagination.currentPage < totalPages - 3 && (
                                                    <PaginationItem>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                )}
                                                <PaginationItem>
                                                    <PaginationLink
                                                        onClick={() => goToPage(totalPages)}
                                                        className="cursor-pointer"
                                                    >
                                                        {totalPages}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            </>
                                        )}

                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={goToNextPage}
                                                className={snap.pagination.currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
