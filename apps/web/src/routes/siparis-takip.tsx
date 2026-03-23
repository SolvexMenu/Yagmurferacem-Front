import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/utils/orpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Package, Search, CheckCircle, Clock, Truck, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import * as z from 'zod'

const searchSchema = z.object({
  trackingId: z.string().optional(),
  phone: z.string().optional()
})

export const Route = createFileRoute('/siparis-takip')({
  component: RouteComponent,
  validateSearch: searchSchema
})

const orderStatusMap = {
  PENDING: { label: 'Beklemede', color: 'bg-yellow-500', icon: Clock },
  CONFIRMED: { label: 'Onaylandı', color: 'bg-blue-500', icon: CheckCircle },
  // PROCESSING: { label: 'Hazırlanıyor', color: 'bg-orange-500', icon: Package },
  SHIPPED: { label: 'Kargoda', color: 'bg-purple-500', icon: Truck },
  DELIVERED: { label: 'Teslim Edildi', color: 'bg-green-500', icon: CheckCircle },
  CANCELLED: { label: 'İptal Edildi', color: 'bg-red-500', icon: CheckCircle }
}

function RouteComponent() {
  const search = Route.useSearch()
  const [trackingId, setTrackingId] = useState(search.trackingId || '')
  const [phone, setPhone] = useState(search.phone || '')
  const [shouldFetch, setShouldFetch] = useState(!!search.trackingId && !!search.phone)

  const { data: order, isLoading, error, refetch } = useQuery(orpc.orderRouter.trackOrder.queryOptions({
    input: {
      phone,
      trackingId
    },
    enabled: shouldFetch && !!trackingId && !!phone,
    retry: false
  }))

  const handleSearch = () => {
    if (!trackingId.trim()) {
      toast.error('Lütfen takip numarasını giriniz')
      return
    }
    if (!phone.trim()) {
      toast.error('Lütfen telefon numaranızı giriniz')
      return
    }
    setShouldFetch(true)
    refetch()
  }

  const getStatusInfo = (status: string) => {
    return orderStatusMap[status as keyof typeof orderStatusMap] || orderStatusMap.PENDING
  }

  let parsedNotes: any = null
  if (order?.notes) {
    try {
      parsedNotes = JSON.parse(order.notes as string)
    } catch {
      // ignore
    }
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Sipariş Takip</h1>
          <p className="text-muted-foreground">
            Sipariş numaranız ve telefon numaranızla siparişinizi takip edebilirsiniz
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Sipariş Sorgula
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trackingId">Takip Numarası</Label>
                <Input
                  id="trackingId"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="GS1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon Numarası</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+905551234567"
                />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isLoading} className="w-full">
              {isLoading ? 'Sorgulanıyor...' : 'Sipariş Sorgula'}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p className="font-medium">Sipariş bulunamadı</p>
                <p className="text-sm mt-1">
                  Lütfen takip numaranızı ve telefon numaranızı kontrol ediniz
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {order && (
          <div className="space-y-6">
            {/* Sipariş Durumu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Sipariş Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">#{order.trackingId}</h3>
                    <p className="text-sm text-muted-foreground">
                      Sipariş Tarihi: {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getStatusInfo(order.status).color} text-white`}>
                      {getStatusInfo(order.status).label}
                    </Badge>
                    <p className="text-lg font-semibold mt-1">{order.totalAmount} TL</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Müşteri Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Teslimat Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{order.User?.name || 'Müşteri'}</p>
                  <p className="text-sm text-muted-foreground">{order.User?.email}</p>
                  <p className="text-sm text-muted-foreground">{order.phoneNumber}</p>
                </div>
                <div>
                  <p className="font-medium">Teslimat Adresi:</p>
                  <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                </div>
                {order.notes && (
                  <div>
                    <p className="font-medium">Sipariş Notu:</p>
                    <p className="text-sm text-muted-foreground">{parsedNotes?.originalNotes || (typeof parsedNotes === 'object' && parsedNotes !== null ? "Not yok" : order.notes)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sipariş Ürünleri */}
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item) => (
                    <div key={item.product?.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      {item.product?.imageUrls?.[0] && (
                        <img
                          src={item.product.imageUrls[0]}
                          alt={item.product?.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product?.name}</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {item.size && <p>Beden: {item.size.size}</p>}
                          {item.color && <p>Renk: {item.color.color}</p>}
                          <p>Adet: {item.orderItem.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {(item.product?.price ?? 0) * item.orderItem.quantity} TL
                        </p>
                        {item.product?.discount && (
                          <p className="text-sm text-muted-foreground line-through">
                            {(item.product?.price ?? 0) * item.orderItem.quantity} TL
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-semibold text-lg">
                      <span>Toplam:</span>
                      <span>{order.totalAmount} TL</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sipariş Durumu Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Süreci</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(orderStatusMap).map(([status, info], index) => {
                    const isCompleted = Object.keys(orderStatusMap).indexOf(order.status) >= index
                    const isCurrent = order.status === status
                    const Icon = info.icon

                    return (
                      <div key={status} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? info.color : 'bg-gray-200'
                          }`}>
                          <Icon className={`h-4 w-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {info.label}
                          </p>
                        </div>
                        {isCurrent && (
                          <Badge variant="outline" className="text-primary border-primary">
                            Mevcut Durum
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}