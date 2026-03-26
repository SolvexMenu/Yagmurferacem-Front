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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Search } from "lucide-react"

export const Route = createFileRoute('/dashboard/orders/')({
    component: RouteComponent,
})

function RouteComponent() {
    const orders = useQuery(orpc.orderRouter.getAllOrders.queryOptions())
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const filteredOrders = useMemo(() => {
        if (!orders.data) return []
        
        let filtered = orders.data

        // Status Filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(order => order.status === statusFilter)
        }

        // Search Filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(order => {
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
        }

        return filtered
    }, [orders.data, searchTerm, statusFilter])

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
        <div className="p-4 md:p-8">
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
                    <div>
                        <CardTitle className="text-2xl font-bold">Sipariş Yönetimi</CardTitle>
                        <CardDescription className="mt-1">
                            Toplam {orders.data?.length || 0} sipariş
                        </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="Durum Seç" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tümü</SelectItem>
                                <SelectItem value="PENDING">Beklemede</SelectItem>
                                <SelectItem value="COMPLETED">Ödendi</SelectItem>
                                <SelectItem value="CONFIRMED">Onaylandı</SelectItem>
                                <SelectItem value="SHIPPED">Kargoda</SelectItem>
                                <SelectItem value="DELIVERED">Teslim Edildi</SelectItem>
                                <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                                <SelectItem value="FAILED">Başarısız</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 w-full sm:w-72 bg-background border rounded-lg px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
                            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Input 
                                placeholder="Sipariş Ara..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-9 w-full"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md bg-white">
                        <Table>
                            <TableCaption>Sipariş listesi - Teslim edilenler hariç</TableCaption>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead>Takip No</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Müşteri</TableHead>
                                    <TableHead>Ürün Sayısı</TableHead>
                                    <TableHead>Toplam Tutar</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
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
                                        <TableRow key={order.id} className="hover:bg-gray-50/50">
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
                                            <TableCell className="font-semibold text-primary">
                                                {formatPrice(order.totalAmount)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(order.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
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
                </CardContent>
            </Card>
        </div>
    )
}
