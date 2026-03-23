import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { CheckCircle, Package, ArrowRight, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { initializeFirebaseMessaging } from '@/utils/firebase'

export const Route = createFileRoute('/payment/success')({
  component: PaymentSuccessComponent,
})

function PaymentSuccessComponent() {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()

  useEffect(() => {
    // Show success message
    toast.success('Ödemeniz başarıyla tamamlandı!')
  }, [])

  const handleNotificationPermission = async () => {
    try {
      const token = await initializeFirebaseMessaging(session?.user?.id)
      if (token) {
        toast.success('Bildirimler aktif edildi! Sipariş güncellemelerinizi kaçırmayacaksınız.')
      } else {
        toast.error('Bildirim izni verilemedi. Tarayıcı ayarlarınızdan bildirimleri aktif edebilirsiniz.')
      }
    } catch (error) {
      console.error('Notification permission error:', error)
      toast.error('Bildirim ayarlarında bir hata oluştu.')
    }
  }

  const handleContinue = () => {
    if (session?.user) {
      // Registered user - go to profile/orders
      navigate({ to: '/profil' })
    } else {
      // Guest user - go to order tracking
      navigate({ to: '/siparis-takip' })
    }
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Ödeme Başarılı!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-2">
                Siparişiniz başarıyla oluşturuldu
              </p>
              <p className="text-sm text-muted-foreground">
                Ödemeniz güvenli bir şekilde işleme alındı. Siparişiniz en kısa sürede hazırlanacak.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Sonraki Adımlar</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Siparişiniz 1-3 iş günü içinde kargoya verilecek</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">Sipariş Takip Bildirimleri</span>
              </div>
              <p className="text-sm text-amber-700 mb-3">
                Siparişinizin durumu hakkında anlık bildirimler almak ister misiniz?
              </p>
              <Button 
                onClick={handleNotificationPermission}
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <Bell className="w-4 h-4 mr-2" />
                Bildirimleri Aktif Et
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleContinue} className="flex items-center gap-2">
                {session?.user ? 'Siparişlerimi Görüntüle' : 'Sipariş Takip'}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate({ to: '/' })}
              >
                Alışverişe Devam Et
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}