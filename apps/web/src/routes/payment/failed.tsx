import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { XCircle, CreditCard, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export const Route = createFileRoute('/payment/failed')({
  component: PaymentFailedComponent,
})

function PaymentFailedComponent() {
  const navigate = useNavigate()

  useEffect(() => {
    // Show error message
    toast.error('Ödeme işlemi başarısız oldu')
  }, [])

  const handleRetry = () => {
    // Go back to payment page
    navigate({ to: '/urun/pay' })
  }

  const handleGoHome = () => {
    navigate({ to: '/' })
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">
              Ödeme Başarısız
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-2">
                Ödeme işlemi tamamlanamadı
              </p>
              <p className="text-sm text-muted-foreground">
                Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">Olası Nedenler</span>
              </div>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Kart bilgilerinde hata</li>
                <li>• Yetersiz bakiye</li>
                <li>• Kart limiti aşımı</li>
                <li>• Banka tarafından işlem reddedildi</li>
                <li>• İnternet bağlantısı sorunu</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Not:</strong> Ödeme başarısız olduğu için siparişiniz oluşturulmadı. 
                Sepetinizdeki ürünler korundu, tekrar ödeme yapabilirsiniz.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleRetry} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Tekrar Dene
              </Button>
              <Button 
                variant="outline" 
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Ana Sayfaya Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}