import React, { useState } from 'react'
import Loader from '@/components/loader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { orpc } from '@/utils/orpc'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { Package, User, MapPin, Heart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// API utils for cities and districts
const formatPhoneNumber = (value: string) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4)}`;
  }
  if (phoneNumberLength < 9) {
    return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7)}`;
  }
  return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7, 9)} ${phoneNumber.slice(9, 11)}`;
};

const fetchCityData = async () => {
  const response = await fetch('https://api.geliver.io/api/v1/cities?countryCode=TR');
  if (!response.ok) throw new Error('İl verileri getirilemedi');
  return response.json();
};

const fetchDistrictData = async (cityCode: string) => {
  if (!cityCode) return { data: [] };
  const response = await fetch(`https://api.geliver.io/api/v1/districts?countryCode=TR&cityCode=${cityCode}`);
  if (!response.ok) throw new Error('İlçe verileri getirilemedi');
  return response.json();
}

export const Route = createFileRoute('/profil/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: session } = authClient.useSession()
  const orders = useQuery(orpc.orderRouter.getMyOrders.queryOptions())

  if (orders.isLoading) return <Loader />

  return (
    <div className="py-2 md:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <Tabs defaultValue='orders' className="w-full">
          <div className="w-full overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <TabsList className="flex w-max min-w-full sm:w-full h-auto p-1 bg-muted/50 rounded-lg">
              <TabsTrigger className="flex-1 py-2 px-3 sm:px-4 text-[13px] sm:text-base font-medium flex items-center justify-center gap-1.5 sm:gap-2" value="orders">
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="whitespace-nowrap">Siparişlerim</span>
              </TabsTrigger>
              <TabsTrigger className="flex-1 py-2 px-3 sm:px-4 text-[13px] sm:text-base font-medium flex items-center justify-center gap-1.5 sm:gap-2" value="account">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="whitespace-nowrap">Hesabım</span>
              </TabsTrigger>
              <TabsTrigger className="flex-1 py-2 px-3 sm:px-4 text-[13px] sm:text-base font-medium flex items-center justify-center gap-1.5 sm:gap-2" value="address">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="whitespace-nowrap">Adreslerim</span>
              </TabsTrigger>
              <TabsTrigger className="flex-1 py-2 px-3 sm:px-4 text-[13px] sm:text-base font-medium flex items-center justify-center gap-1.5 sm:gap-2" value="favorites">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="whitespace-nowrap">Favorilerim</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="account" className="w-full pt-4">Make changes to your account here.</TabsContent>
          <TabsContent value="address" className="w-full pt-4">
            <AddressSection />
          </TabsContent>
          <TabsContent value="orders" className="w-full">
            {orders.data && orders.data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mt-4">
                {orders.data.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 shadow-sm bg-white flex flex-col h-full">
                    {/* Upper Section: ID + Status + Date */}
                    <div className="flex flex-col mb-4 gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base break-words">Sipariş #{order.id?.split('-')[0] || order.id}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          (order.status === 'CONFIRMED' || order.status === 'COMPLETED') ? 'bg-blue-100 text-blue-800' :
                          order.status === 'PROCESSING' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'SHIPPED' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status === 'PENDING' ? 'Beklemede' :
                           (order.status === 'CONFIRMED' || order.status === 'COMPLETED') ? 'Onaylandı/Ödendi' :
                           order.status === 'PROCESSING' ? 'Hazırlanıyor' :
                           order.status === 'SHIPPED' ? 'Kargoda' :
                           order.status === 'DELIVERED' ? 'Teslim Edildi' :
                           order.status === 'FAILED' ? 'Başarısız' : 'İptal Edildi'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    {/* Middle Section: Items (Quick Look) */}
                    <div className="space-y-3 mb-4 flex-1">
                      {order.items.slice(0, 2).map((item) => (
                        <div
                          key={item.product?.id}
                          className="flex items-start sm:items-center gap-3"
                        >
                          <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-gray-100">
                            <img
                              src={item.product?.imageUrls?.[0]}
                              alt={item.product?.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs sm:text-sm truncate">{item.product?.name}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              {item.size?.size ? `Beden: ${item.size?.size} ` : ""}
                              {item.color?.color ? `Renk: ${item.color?.color}` : ""}
                            </p>
                          </div>
                          <div className="text-xs sm:text-sm font-medium mt-1">
                            {item.orderItem?.quantity || (item as any).quantity || 1} × {item.product?.price}₺
                          </div>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-xs text-muted-foreground pt-2 border-t italic">
                          ve {order.items.length - 2} ürün daha görüntülemek için Detaylara Giriş Yapın
                        </p>
                      )}
                    </div>
                    
                    {/* Bottom Section: Dialog Button & Total Pricing */}
                    <div className="flex items-end justify-between border-t pt-4 mt-auto">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 h-8">
                            <Eye className="w-3.5 h-3.5 shrink-0" /> Detaylar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Sipariş #{order.id?.split('-')[0] || order.id}</DialogTitle>
                            <DialogDescription>
                              {new Date(order.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Tarihinde Oluşturuldu
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col gap-4 py-2">
                            {/* Alıcı Bilgileri */}
                            <div className="bg-muted p-4 rounded-lg space-y-1 text-sm bg-gray-50 border border-gray-100">
                              <h4 className="font-semibold text-gray-900 mb-2 border-b pb-2">Teslimat Bilgileri</h4>
                              {session?.user?.name && <p><strong>İsim:</strong> {session.user.name}</p>}
                              {session?.user?.email && <p><strong>E-Posta:</strong> {session.user.email}</p>}
                              {(order as Record<string, any>).phoneNumber && <p><strong>Telefon:</strong> {(order as Record<string, any>).phoneNumber}</p>}
                              {order.shippingAddress && <p><strong>Adres:</strong> {order.shippingAddress}</p>}
                              {order.notes && <p className="mt-2 pt-2 border-t text-muted-foreground"><strong>Sipariş Notu:</strong> {order.notes}</p>}
                            </div>
                            
                            {/* Ürünler Listesi (Modal İçi) */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Satın Alınan Ürünler ({order.items?.length || 0})</h4>
                              <div className="max-h-[220px] overflow-y-auto pr-2 space-y-3 border-b pb-4">
                                {order.items.map((item) => (
                                  <div key={item.product?.id} className="flex items-center gap-3">
                                    <div className="relative w-12 h-12 shrink-0 rounded overflow-hidden bg-gray-100">
                                      <img src={item.product?.imageUrls?.[0]} alt={item.product?.name} className="object-cover w-full h-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{item.product?.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.size?.size ? `Beden: ${item.size?.size} ` : ""}
                                        {item.color?.color ? `Renk: ${item.color?.color}` : ""}
                                      </p>
                                    </div>
                                    <div className="text-sm font-semibold whitespace-nowrap">
                                      {item.orderItem?.quantity || (item as any).quantity || 1} x {item.product?.price}₺
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 items-end pt-2 text-sm">
                              {(() => {
                                const subTotal = order.items.reduce((acc, item) => acc + ((item.orderItem?.quantity || (item as any).quantity || 1) * (item.product?.price || 0)), 0);
                                const shipping = order.totalAmount - subTotal;
                                return (
                                  <>
                                    <div className="flex justify-between w-full text-muted-foreground">
                                      <span>Ara Toplam</span>
                                      <span>{subTotal} TL</span>
                                    </div>
                                    {shipping > 0 && (
                                      <div className="flex justify-between w-full text-muted-foreground">
                                        <span>Kargo Ücreti</span>
                                        <span>{shipping} TL</span>
                                      </div>
                                    )}
                                  </>
                                )
                              })()}
                              <div className="flex justify-between w-full font-bold text-lg mt-2 pt-2 border-t">
                                <span>Genel Toplam</span>
                                <span className="text-primary">{order.totalAmount} TL</span>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="flex flex-col items-end text-sm">
                        {(() => {
                          const subTotal = order.items.reduce((acc, item) => acc + ((item.orderItem?.quantity || (item as any).quantity || 1) * (item.product?.price || 0)), 0);
                          const shipping = order.totalAmount - subTotal;
                          return shipping > 0 ? (
                            <span className="text-muted-foreground text-[11px] mb-0.5">Kargo: {shipping} TL</span>
                          ) : null;
                        })()}
                        <p className="font-bold text-base sm:text-lg">{order.totalAmount} TL</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Henüz siparişiniz bulunmuyor.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function AddressSection() {
  const queryClient = useQueryClient()
  const addresses = useQuery((orpc as any).addressRouter.getUserAddresses.queryOptions())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")

  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: fetchCityData
  });

  const { data: districts, isLoading: isDistrictsLoading } = useQuery({
    queryKey: ["districts", selectedCity],
    queryFn: () => fetchDistrictData(selectedCity),
    enabled: !!selectedCity
  });

  const createAddress = useMutation((orpc as any).addressRouter.createAddress.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: (orpc as any).addressRouter.getUserAddresses.queryKey() })
      toast.success("Adres başarıyla eklendi")
      setIsAddModalOpen(false)
      setSelectedCity("")
      setSelectedDistrict("")
    },
    onError: (error: any) => {
      toast.error("Adres eklenirken bir hata oluştu: " + error.message)
    }
  }))

  const deleteAddress = useMutation((orpc as any).addressRouter.deleteAddress.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: (orpc as any).addressRouter.getUserAddresses.queryKey() })
      toast.success("Adres silindi")
    }
  }))

  if (addresses.isLoading) return <div className="flex justify-center py-8"><Loader /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Adres Defterim</h2>
          <p className="text-sm text-gray-500">Kayıtlı adreslerinizi buradan yönetebilirsiniz.</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Yeni Adres Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Adres Ekle</DialogTitle>
              <DialogDescription>
                Teslimat bilgilerinizi kaydederek alışverişinizi hızlandırın.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={((e: any) => {
              e.preventDefault();
              const target = e.currentTarget;
              const formData = new FormData(target);
              (createAddress.mutate as any)({
                title: formData.get('title') as string,
                name: formData.get('name') as string,
                surname: formData.get('surname') as string,
                phone: formData.get('phone') as string,
                city: (cities?.data?.find((c: any) => c.cityCode === selectedCity))?.name || "",
                district: selectedDistrict,
                fullAddress: formData.get('fullAddress') as string,
              });
            }) as any} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="title">Adres Başlığı (Örn: Evim, İş Yerim)</Label>
                  <Input id="title" name="title" required placeholder="Evim" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">İsim</Label>
                  <Input id="name" name="name" required placeholder="Ahmet" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Soyisim</Label>
                  <Input id="surname" name="surname" required placeholder="Yılmaz" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="phone">Telefon Numarası</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    required 
                    type="tel" 
                    placeholder="05XX XXX XX XX" 
                    maxLength={14}
                    onChange={(e) => {
                      e.target.value = formatPhoneNumber(e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Şehir</Label>
                  <Select onValueChange={(val) => { setSelectedCity(val); setSelectedDistrict(""); }} value={selectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Şehir seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities?.data?.map((city: any) => (
                        <SelectItem key={city.cityCode} value={city.cityCode}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>İlçe</Label>
                  <Select onValueChange={setSelectedDistrict} value={selectedDistrict} disabled={!selectedCity || isDistrictsLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={isDistrictsLoading ? "Yükleniyor..." : "İlçe seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {districts?.data?.map((district: any) => (
                        <SelectItem key={district.districtID} value={district.name}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="fullAddress">Tam Adres</Label>
                  <Textarea id="fullAddress" name="fullAddress" required placeholder="Mahalle, Sokak, No..." className="min-h-[100px]" />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
                <Button type="submit" disabled={createAddress.isPending}>
                  {createAddress.isPending ? "Kaydediliyor..." : "Adresi Kaydet"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.data && (addresses.data as any[]).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(addresses.data as any[]).map((addr) => (
            <div key={addr.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900">{addr.title}</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 -mt-2 -mr-2"
                  onClick={() => {
                    if(confirm("Bu adresi silmek istediğinize emin misiniz?")) {
                      deleteAddress.mutate(addr.id)
                    }
                  }}
                  disabled={deleteAddress.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="font-semibold text-gray-900">{addr.name} {addr.surname}</p>
                <p>{addr.phone}</p>
                <p className="mt-2 text-gray-800 break-words">{addr.fullAddress}</p>
                <p className="font-medium">{addr.district} / {addr.city}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-12 text-center px-4">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Henüz adres kaydetmediniz</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-6">Sık kullandığınız adresleri kaydederek ödeme adımında zaman kazanın.</p>
        </div>
      )}
    </div>
  )
}