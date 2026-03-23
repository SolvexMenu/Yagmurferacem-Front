import { createFileRoute, Link } from '@tanstack/react-router'
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Check, ShoppingCart, CreditCard, ArrowLeft, ArrowRight } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeftIcon } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { orpc } from '@/utils/orpc';
import { toast } from 'sonner';

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

import { useNavigate } from '@tanstack/react-router';
import { mesafeliSatisTemplate, replacePlaceholders } from '@/utils/legalstuff';
import { authClient } from '@/lib/auth-client';
import { useGuestCart } from '@/hooks/use-guest-cart';
import { useLocalCart } from '@/state/cart';

export const Route = createFileRoute('/urun/pay')({
  component: RouteComponent,
})

export interface ActionResponse<T = any> {
  success: boolean;
  message: string;
  errors?: {
    [K in keyof T]?: string[];
  };
  inputs?: T;
}

export const orderFormSchema = z.object({
  // Müşteri bilgileri (guest için)
  customerName: z.string("Lütfen isim ve soyisim giriniz").optional(),
  customerEmail: z.email("Geçerli bir email adresi giriniz").optional(),

  // Adres bilgileri
  shippingAddress: z.string().min(10, "Teslimat adresi en az 10 karakter olmalıdır"),
  billingAddress: z.string().optional(),
  phoneNumber: z.string().min(10, "Telefon numarası geçerli olmalıdır"),
  notes: z.string().optional(),
  il: z.string().min(1, "Lütfen il seçin"),
  ilce: z.string().min(1, "Lütfen ilçe seçin"),
  terms: z.boolean().refine(val => val === true, { message: "Mesafeli satış sözleşmesini kabul etmelisiniz" }),
}).refine((data) => {
  // Eğer kullanıcı giriş yapmamışsa, isim ve email zorunlu
  return true; // Bu kontrolü component içinde yapacağız
}, {
  message: "Misafir siparişi için ad soyad ve email gereklidir"
});

type OrderFormSchema = z.infer<typeof orderFormSchema>;

interface CityData {
  name: string;
  areaCode: string | null;
  cityCode: string;
  countryCode: string;
}

interface ApiResponse {
  result: boolean;
  additionalMessage: string;
  data: CityData[];
}

interface CityData2 {
  name: string;
  districtID: number;
  cityCode: string;
  regionCode: string | null;
  countryCode: string;
}

interface ApiResponse2 {
  result: boolean;
  additionalMessage: string;
  data: CityData2[];
}

const fetchCityData = async (): Promise<ApiResponse> => {
  const response = await fetch('https://api.geliver.io/api/v1/cities?countryCode=TR');
  if (!response.ok) {
    throw new Error('İl verileri getirilemedi');
  }
  return response.json();
};

const fetchDistrictData = async (cityCode: string): Promise<ApiResponse2> => {
  if (!cityCode) return { result: false, additionalMessage: 'No city code', data: [] };
  const response = await fetch(`https://api.geliver.io/api/v1/districts?countryCode=TR&cityCode=${cityCode}`);
  if (!response.ok) {
    throw new Error('İlçe verileri getirilemedi');
  }
  return response.json();
}

function CartSummary() {
  const { data: session } = authClient.useSession();
  const serverCart = useQuery(orpc.cartRouter.getCart.queryOptions({
    enabled: !!session?.user
  }));
  const guestCart = useGuestCart();

  const { data: shippingPrice, isLoading: shippingPriceLoading } = useQuery(orpc.bannerRouter.getShippingPrice.queryOptions());

  const cart = session?.user ? serverCart : guestCart;

  if (cart.isLoading) {
    return <div className="animate-pulse">Sepet yükleniyor...</div>;
  }

  if (!cart.data || cart.data.items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Sepetiniz boş</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Sipariş Özeti
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cart.data.items.map((item: any) => {
          // Fiyat hesaplama - indirim varsa indirimi uygula
          const basePrice = item.product.price;
          const discount = item.product.discount;
          const unitPrice = item.unitPrice || (discount ? basePrice - (basePrice * discount / 100) : basePrice);

          return (
            <div key={item.id} className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{item.product.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.Size && `Beden: ${item.Size.size}`}
                  {item.Size && item.Color && " | "}
                  {item.Color && `Renk: ${item.Color.color}`}
                </p>
                <p className="text-sm">Adet: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{unitPrice * item.quantity} TL</p>
                {discount && (
                  <p className="text-xs text-muted-foreground line-through">
                    {basePrice * item.quantity} TL
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div className="h-px bg-border w-full" />

        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span>Ara Toplam:</span>
          <span>{cart.data.totalPrice} TL</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between items-center">
          <span>Kargo Ücreti:</span>
          <span>
            {shippingPriceLoading ? (
              <span className="text-sm text-muted-foreground">Yükleniyor...</span>
            ) : (
              `${shippingPrice || 0} TL`
            )}
          </span>
        </div>

        <div className="h-px bg-border w-full" />

        {/* Final Total */}
        <div className="flex justify-between items-center font-semibold text-lg">
          <span>Toplam:</span>
          <span>{cart.data.totalPrice + (shippingPrice || 0)} TL</span>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { items: localItems, clearCart } = useLocalCart();
  const guestCart = useGuestCart();
  const [paytrUrl, setPaytrUrl] = useState("")
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const addresses = useQuery((orpc as any).addressRouter.getUserAddresses.queryOptions({
    enabled: !!session?.user
  }));

  const form = useForm<OrderFormSchema>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: session?.user?.name || "",
      customerEmail: session?.user?.email || "",
    }
  });

  const selectedIl = form.watch("il");

  const { data: illerData, isLoading: isIllerLoading } = useQuery<ApiResponse>({
    queryKey: ["iller"],
    queryFn: fetchCityData
  });

  const { data: ilcelerData, isLoading: isIlcelerLoading } = useQuery({
    queryKey: ["ilceler", selectedIl],
    queryFn: () => fetchDistrictData(selectedIl),
    enabled: !!selectedIl,
  });

  // Kullanıcı durumuna göre cart seç
  const serverCart = useQuery(orpc.cartRouter.getCart.queryOptions({
    enabled: !!session?.user
  }));
  const cart = session?.user ? serverCart : guestCart;

  // Kullanıcı durumuna göre sipariş mutation'ı seç
  const placeUserOrder = useMutation(orpc.orderRouter.placeOrder.mutationOptions({
    onSuccess: (data) => {
      toast.success(`Siparişiniz başarıyla oluşturuldu! Takip numarası: ${data.orderId}`);
      queryClient.invalidateQueries({ queryKey: orpc.cartRouter.getCart.queryKey() });
      navigate({ to: '/profil' });
    },
    onError: (error) => {
      toast.error(`Sipariş oluşturulurken hata: ${error.message}`);
    }
  }));

  const placeGuestOrder = useMutation(orpc.guestOrderRouter.placeGuestOrder.mutationOptions({
    onSuccess: (data) => {
      toast.success(`Siparişiniz başarıyla oluşturuldu! Takip numarası: ${data.orderId}`);
      clearCart(); // LocalStorage'ı temizle
      navigate({ to: '/siparis-takip', search: { trackingId: data.orderId, phone: data.customerPhone } });
    },
    onError: (error) => {
      toast.error(`Sipariş oluşturulurken hata: ${error.message}`);
    }
  }));

  const { data: shippingPrice } = useQuery(orpc.bannerRouter.getShippingPrice.queryOptions());

  const paytr = useMutation(orpc.paytrRouter.createPaymentToken.mutationOptions({
    onSuccess: (data) => {
      setPaytrUrl(data.paymentUrl)
    },
    onError: (error) => {
      toast.error(`Ödeme sayfası oluşturulurken hata: ${error.message}`);
    }
  }));

  useEffect(() => {
    form.resetField("ilce");
  }, [selectedIl, form]);

  const handleSubmit = form.handleSubmit(async (data: OrderFormSchema) => {
    if (currentStep === 1) {
      // Guest kullanıcı için ad soyad ve email kontrolü
      if (!session?.user) {
        if (!data.customerName || data.customerName.trim().length < 2) {
          form.setError('customerName', { message: 'Ad soyad en az 2 karakter olmalıdır' });
          return;
        }
        if (!data.customerEmail || !data.customerEmail.includes('@')) {
          form.setError('customerEmail', { message: 'Geçerli bir email adresi giriniz' });
          return;
        }
      }

      // İlk adım: Adres bilgilerini doğrula ve ikinci adıma geç
      setCurrentStep(2);
      return;
    }

    // İkinci adım: PayTR ile ödeme işlemini başlat
    const selectedIlName = illerData?.data.find(il => il.cityCode === data.il)?.name || '';
    const fullAddress = `${data.shippingAddress}, ${data.ilce}, ${selectedIlName}`;

    // Prepare products for PayTR
    const paytrProducts = cart.data?.items.map((item: any) => {
      const basePrice = item.product.price;
      const discount = item.product.discount;
      const unitPrice = item.unitPrice || (discount ? basePrice - (basePrice * discount / 100) : basePrice);

      return {
        id: item.product.id,
        name: item.product.name,
        price: unitPrice.toString(),
        quantity: item.quantity,
        sizeId: item.sizeId || item.Size?.id,
        colorId: item.colorId || item.Color?.id,
        variantId: item.variantId
      };
    }) || [];

    // Calculate total with shipping
    const subtotal = cart.data?.totalPrice || 0;
    const shipping = shippingPrice || 0;
    const totalWithShipping = subtotal + shipping;

    // Start PayTR payment process
    await paytr.mutateAsync({
      address: fullAddress,
      email: session?.user?.email || data.customerEmail!,
      name: session?.user?.name || data.customerName!,
      phone: data.phoneNumber,
      products: paytrProducts,
      totalPrice: totalWithShipping,
    });
  });

  const isExecuting = form.formState.isSubmitting || placeUserOrder.isPending || placeGuestOrder.isPending || paytr.isPending;

  if (cart.isLoading) {
    return <div className="flex justify-center p-8">Sepet kontrol ediliyor...</div>;
  }

  if (!cart.data || cart.data.items.length === 0) {
    return (
      <div className="text-center p-8">
        <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Sepetiniz boş</h2>
        <p className="text-muted-foreground mb-4">Sipariş vermek için önce ürün eklemelisiniz.</p>
        {/* @ts-expect-error search param istiyor ama vermek zorunda değiliz */}
        <Button onClick={() => navigate({ to: '/urunler' })}>
          Alışverişe Devam Et
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {currentStep > 1 ? <Check className="h-4 w-4" /> : '1'}
          </div>
          <span className="font-medium">Adres Bilgileri</span>
        </div>
        <div className={`w-8 h-0.5 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="font-medium">Sipariş Onayı</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Teslimat Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!session?.user && (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Misafir Siparişi:</strong> Hesap oluşturmadan sipariş verebilirsiniz.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Soyad *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Adınız ve soyadınız" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Adresi *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="ornek@email.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {session?.user && (addresses.data as any) && (addresses.data as any).length > 0 && (
                  <div className="space-y-3 mb-6">
                    <FormLabel>Kayıtlı Adreslerim</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(addresses.data as any[]).map((addr: any) => (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            form.setValue("phoneNumber", addr.phone);
                            form.setValue("shippingAddress", addr.fullAddress);
                            form.setValue("customerName", `${addr.name} ${addr.surname}`);
                            
                            // Match city
                            const matchedCity = illerData?.data.find(c => 
                              c.name.toLowerCase() === addr.city.toLowerCase() || 
                              addr.city.toLowerCase().includes(c.name.toLowerCase())
                            );
                            if (matchedCity) {
                              form.setValue("il", matchedCity.cityCode);
                              // We wait for ilceler to load via useEffect/re-render and then try to set ilce if possible
                              // but since it's async, we might just set the string if ilce matches too
                              setTimeout(() => {
                                form.setValue("ilce", addr.district);
                              }, 500);
                            }
                            
                            toast.success(`${addr.title} adresi seçildi`);
                          }}
                          className={`cursor-pointer p-4 border rounded-xl transition-all hover:border-primary/50 ${
                            selectedAddressId === addr.id 
                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                            : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Check className={`h-4 w-4 ${selectedAddressId === addr.id ? "text-primary opacity-100" : "opacity-0"}`} />
                            <span className="font-bold text-sm">{addr.title}</span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-1">{addr.name} {addr.surname}</p>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">{addr.fullAddress}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon Numarası *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="05XX XXX XX XX" 
                          maxLength={14}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="il"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İl *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isIllerLoading}>
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder={isIllerLoading ? "Yükleniyor..." : "İl seçin"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {illerData?.data.map((item) => (
                              <SelectItem key={item.cityCode} value={item.cityCode}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ilce"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İlçe *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedIl || isIlcelerLoading}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder={isIlcelerLoading ? "Yükleniyor..." : "İlçe seçin"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ilcelerData?.data.map((item: any) => (
                              <SelectItem key={item.districtID} value={item.name}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teslimat Adresi *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Mahalle, sokak, kapı no, daire no..."
                          className="resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fatura Adresi (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Boş bırakılırsa teslimat adresi kullanılır"
                          className="resize-none"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sipariş Notu (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Özel taleplerinizi buraya yazabilirsiniz..."
                          className="resize-none"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={contractAccepted}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setIsContractModalOpen(true);
                            } else {
                              setContractAccepted(false);
                              field.onChange(false);
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer" onClick={() => setIsContractModalOpen(true)}>
                          Mesafeli satış sözleşmesini okudum ve kabul ediyorum *
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
                  <DialogContent className='flex max-h-[min(700px,85vh)] flex-col gap-0 p-0 sm:max-w-2xl'>
                    <DialogHeader className='contents space-y-0 text-left'>
                      <DialogTitle className='border-b px-6 py-4'>Mesafeli Satış Sözleşmesi</DialogTitle>
                      <ScrollArea className='flex max-h-full flex-col overflow-hidden'>
                        <DialogDescription asChild>
                          <div className='p-6'>
                            <div className='whitespace-pre-wrap text-sm leading-relaxed'>
                              {replacePlaceholders(mesafeliSatisTemplate, {
                                namesurname: session?.user?.name || form.getValues("customerName") || 'Müşteri Adı Soyadı',
                                adress: form.getValues('shippingAddress') || 'Teslimat Adresi',
                                phoneNumber: form.getValues('phoneNumber') || 'Telefon Numarası',
                                email: session?.user?.email || form.getValues('customerEmail'),
                                currentDate: new Date().toLocaleDateString('tr-TR')
                              })}
                            </div>
                          </div>
                        </DialogDescription>
                        <DialogFooter className='px-6 pb-6 sm:justify-between'>
                          <DialogClose asChild>
                            <Button variant='outline' onClick={() => {
                              setContractAccepted(false);
                              form.setValue('terms', false);
                            }}>
                              <ChevronLeftIcon className="h-4 w-4 mr-2" />
                              İptal
                            </Button>
                          </DialogClose>
                          <Button
                            type='button'
                            onClick={() => {
                              setContractAccepted(true);
                              form.setValue('terms', true);
                              setIsContractModalOpen(false);
                              toast.success('Mesafeli satış sözleşmesi kabul edildi');
                            }}
                          >
                            Kabul Ediyorum
                          </Button>
                        </DialogFooter>
                      </ScrollArea>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Onayı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 h-full">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Teslimat Bilgileri</h3>
                  <p><strong>Telefon:</strong> {form.getValues('phoneNumber')}</p>
                  <p><strong>Adres:</strong> {form.getValues('shippingAddress')}</p>
                  <p><strong>İl/İlçe:</strong> {illerData?.data.find(il => il.cityCode === form.getValues('il'))?.name} / {form.getValues('ilce')}</p>
                  {form.getValues('notes') && (
                    <p><strong>Not:</strong> {form.getValues('notes')}</p>
                  )}
                </div>

                <div className="text-center py-8">
                  <iframe src={paytrUrl} frameBorder={0} className='w-full h-[40rem]' />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between items-center pt-4">
            {currentStep === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Geri
              </Button>
            )}

            <div className="flex-1" />

            <Button
              type="submit"
              disabled={isExecuting}
              className="flex items-center gap-2"
            >
              {isExecuting ? (
                paytr.isPending ? "Ödeme sayfası hazırlanıyor..." : "İşleniyor..."
              ) : currentStep === 1 ? (
                <>
                  Devam Et
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Güvenli Ödemeye Geç
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function RouteComponent() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <OrderForm />
          </div>
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      </div>
    </div>
  )
}
