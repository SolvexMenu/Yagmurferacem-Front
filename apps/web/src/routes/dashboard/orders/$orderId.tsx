import { createFileRoute, Link } from '@tanstack/react-router'
import Loader from '@/components/loader'
import { orpc } from '@/utils/orpc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Package, User, MapPin, Phone, FileText } from "lucide-react"
import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/dashboard/orders/$orderId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { orderId } = Route.useParams()
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [trackId, setTrackId] = useState<string>('')
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')

  const order = useQuery(orpc.orderRouter.getOrderById.queryOptions({ input: orderId, enabled: !!orderId }))

  const updateStatus = useMutation(orpc.orderRouter.updateOrderStatus.mutationOptions({
    onSuccess: () => {
      toast.success('Sipariş durumu güncellendi')
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Bir hata oluştu')
    }
  }))

  const refund = useMutation(orpc.paytrRouter.refundOrder.mutationOptions({
    onSuccess: () => {
      toast.success('İade işlemi başlatıldı')
      setIsRefundModalOpen(false)
      setConfirmationText('')
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'İade işlemi sırasında bir hata oluştu')
    }
  }))

  const handleStatusUpdate = () => {
    if (selectedStatus === "SHIPPED" && selectedStatus !== order.data?.status) {
      updateStatus.mutate({
        orderId: orderId,
        status: selectedStatus as any,
        trackingId: trackId
      })
    } else if (selectedStatus && selectedStatus !== order.data?.status) {
      updateStatus.mutate({
        orderId: orderId,
        status: selectedStatus as any
      })
    }
  }

  const handleRefund = () => {
    if (confirmationText === 'Onaylıyorum') {
      refund.mutate({ orderId })
    } else {
      toast.error('Lütfen "Onaylıyorum" yazarak işlemi onaylayın')
    }
  }

  if (order.isLoading) return <Loader />
  if (!order.data) return <div className="p-8">Sipariş bulunamadı</div>

  const orderData = order.data

  let parsedNotes: any = null
  if (orderData.notes) {
    try {
      parsedNotes = JSON.parse(orderData.notes as string)
    } catch {
      // ignore
    }
  }

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
      month: 'long',
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

  // yurtiçi kargo takip url
  // https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=908883558933

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/dashboard/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sipariş Detayı - {orderData.id}
          </h1>
          <p className="text-gray-600">{formatDate(orderData.createdAt.toString())}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status and Actions */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Sipariş Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Mevcut Durum:</span>
                {getStatusBadge(orderData.status)}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Durumu Güncelle:</label>
                <Select value={selectedStatus || orderData.status} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Beklemede</SelectItem>
                    <SelectItem value="COMPLETED">Ödendi</SelectItem>
                    <SelectItem value="CONFIRMED">Onaylandı</SelectItem>
                    <SelectItem value="SHIPPED">Kargoda</SelectItem>
                    <SelectItem value="DELIVERED">Teslim Edildi</SelectItem>
                    <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
                {selectedStatus === "SHIPPED" ? (
                  <Input placeholder='Kargo takip numarası' required value={trackId} onChange={(e) => setTrackId(e.target.value)} />
                ) : null}
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || selectedStatus === orderData.status || updateStatus.isPending}
                  className="w-full"
                >
                  {updateStatus.isPending ? 'Güncelleniyor...' : 'Durumu Güncelle'}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Toplam Tutar: <span className="font-semibold text-gray-900">{formatPrice(orderData.totalAmount)}</span></div>
                  <div>Ürün Sayısı: <span className="font-semibold text-gray-900">{orderData.items.length}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">İsim:</span>
                <div className="font-medium">{orderData.User?.name || parsedNotes?.customerName || 'Bilinmeyen'}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">E-posta:</span>
                <div className="font-medium">{orderData.User?.email || parsedNotes?.customerEmail || 'Bilinmeyen'}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Telefon:
                </span>
                <div className="font-medium">{orderData.phoneNumber}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Teslimat Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Teslimat Adresi:</span>
                <div className="font-medium mt-1">{orderData.shippingAddress}</div>
              </div>
              {orderData.billingAddress && (
                <div>
                  <span className="text-sm text-gray-600">Fatura Adresi:</span>
                  <div className="font-medium mt-1">{orderData.billingAddress}</div>
                </div>
              )}
              {orderData.notes && (
                <div>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Notlar:
                  </span>
                  <div>
                    <p className="font-medium mt-1">{parsedNotes?.originalNotes || (typeof parsedNotes === 'object' && parsedNotes !== null ? "Not yok" : orderData.notes)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Sipariş Ürünleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderData.items?.map((item) => {
                  const price = item.product?.discount
                    ? item.product.price - (item.product.price * item.product.discount / 100)
                    : item.product?.price;

                  return (
                    <div key={item.product?.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="relative w-24 h-32 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.product?.imageUrls?.[0] || '/placeholder.jpg'}
                          alt={item.product?.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div>
                          <h4 className="font-medium text-base sm:text-lg line-clamp-2">{item.product?.name}</h4>
                          <div className="text-sm text-gray-600 space-y-0.5 mt-1">
                            <div>Beden: {item.size?.size || 'Belirtilmemiş'}</div>
                            <div>Renk: {item.color?.color || 'Belirtilmemiş'}</div>
                            <div>Adet: {item.orderItem.quantity}</div>
                          </div>
                        </div>
                        <div className="text-left mt-1 border-t pt-2">
                          <div className="font-medium text-base">{formatPrice(price as number)}</div>
                          {item.product?.discount && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatPrice(item.product.price)}
                            </div>
                          )}
                          <div className="text-sm font-semibold text-gray-900 mt-1">
                            Ara Toplam: {formatPrice((price as number) * item.orderItem.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">İade Aç</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>İade İşlemi</DialogTitle>
                <DialogDescription>
                  Bu siparişin iadesini başlatmak istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    İşlemi onaylamak için "Onaylıyorum" yazın:
                  </label>
                  <Input
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Onaylıyorum"
                    className="mt-1"
                  />
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div>Sipariş ID: <span className="font-medium">{orderData.trackingId}</span></div>
                  <div>Toplam Tutar: <span className="font-medium">{formatPrice(orderData.totalAmount)}</span></div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRefundModalOpen(false)
                    setConfirmationText('')
                  }}
                >
                  İptal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRefund}
                  disabled={confirmationText !== 'Onaylıyorum' || refund.isPending}
                >
                  {refund.isPending ? 'İşleniyor...' : 'İade Başlat'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}