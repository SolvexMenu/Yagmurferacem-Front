import { createFileRoute, Link } from '@tanstack/react-router'
import Loader from '@/components/loader'
import { orpc } from '@/utils/orpc'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Search } from "lucide-react"

export const Route = createFileRoute('/dashboard/orders/')({
    component: RouteComponent,
})

function RouteComponent() {
    const orders = useQuery(orpc.orderRouter.getAllOrders.queryOptions())
    const [searchTerm, setSearchTerm] = useState('')

    const filteredOrders = useMemo(() => {
        if (!orders.data) return []
        if (!searchTerm.trim()) return orders.data

        const term = searchTerm.toLowerCase()
        
        return orders.data.filter(order => {
            let parsedNotes: any = null
            if (order.notes) {
                try {
                    parsedNotes = JSON.parse(order.notes as string)
                } catch {
                    // ignore
                }
            }
            
            const name = (order.User?.name || parsedNotes?.customerName || '').toLowerCase()
            const email = (order.User?.email || parsedNotes?.customerEmail || '').toLowerCase()
            const phone = (order.phoneNumber || '').toLowerCase()
            const orderId = (order.id || '').toLowerCase()
            const trackingId = (order.trackingId || '').toLowerCase()
            
            return name.includes(term) || email.includes(term) || phone.includes(term) || orderId.includes(term) || trackingId.includes(term)
        })
    }, [orders.data, searchTerm])

    if (orders.isLoading) return <Loader />

    const getStatusBadge = (status: string) => {
        const statusMap = {
            PENDING: { label: 'Beklemede', variant: 'outline' as const },
            COMPLETED: { label: 'Ödendi', variant: 'default' as const },
            CONFIRMED: { label: 'Onaylandı', variant: 'default' as const },
            SHIPPED: { label: 'Kargoda', variant: 'outline' as const },
            DELIVERED: { label: 'Teslim Edildi', variant: 'default' as const },
            CANCELLED: { label: 'İptal Edildi', variant: 'destructive' as const },
            FAILED: { label: 'Başarısız', variant: 'destructive' as const }
        }
        const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const }
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(price)
    }

    return (
        <div className="p-8 space-y-4">
            <div className="flex items-center gap-3 w-full max-w-xl">
                <Search className="w-5 h-5 text-gray-500 shrink-0" />
                <Input 
                    placeholder="Sipariş No, İsim, E-posta veya Telefon Numarası ile Ara..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
            </div>
            <div className="border rounded-md">
                <Table>
                    <TableCaption>Sipariş listesi - Teslim edilenler hariç</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Takip No</TableHead>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Müşteri</TableHead>
                            <TableHead>Ürün Sayısı</TableHead>
                            <TableHead>Toplam Tutar</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.map((order) => {
                            let parsedNotes: any = null
                            if (order.notes) {
                                try {
                                    parsedNotes = JSON.parse(order.notes as string)
                                } catch {
                                    // ignore
                                }
                            }
                            
                            return (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        {order.id ? <Badge variant={"outline"}>{order.id}</Badge> : <Badge variant={"outline"}>Takip numarası yok</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(order.createdAt.toString())}
                                    </TableCell>
                                    <TableCell>
                                        {order.User?.name || parsedNotes?.customerName || 'Bilinmeyen'}
                                    </TableCell>
                                    <TableCell>
                                        {order.items?.length || 0} ürün
                                    </TableCell>
                                    <TableCell>
                                        {formatPrice(order.totalAmount)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(order.status)}
                                    </TableCell>
                                    <TableCell>
                                        <Link to="/dashboard/orders/$orderId" params={{ orderId: order.id }}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4 mr-2" />
                                                Detay
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {filteredOrders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    Arama kriterlerine uygun sipariş bulunamadı
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
