# Firebase Push Notifications Sistemi

Bu proje Firebase Cloud Messaging (FCM) kullanarak push notification sistemi içerir.

## Kurulum ve Yapılandırma

### 1. Firebase Admin SDK Yapılandırması

`apps/server/.env` dosyasında aşağıdaki değişkenleri ayarlayın:

```env
FIREBASE_PROJECT_ID="yagmurferacem-dev"
FIREBASE_CLIENT_EMAIL="your-service-account-email@yagmurferacem-dev.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

### 2. Web Uygulaması Yapılandırması

`apps/web/.env` dosyasında VAPID key zaten mevcut:

```env
VITE_VAPID_KEY=BEcU8Swij3Ab7j5byKw7W32qEI38DOhqAnJ2eZ860EetEwiBzCqwMuiGISbIgRAEk5gN5m1-0NqQVMACPxGKmVM
```

## Kullanım

### Web Uygulamasında

```tsx
import { useFirebaseNotifications } from './hooks/useFirebaseNotifications';

function App() {
  const { token, isInitialized } = useFirebaseNotifications(userId);

  useEffect(() => {
    if (token) {
      console.log('FCM Token:', token);
      // Token otomatik olarak localStorage'a kaydedilir
      // Kayıtlı kullanıcılar için sunucuya da gönderilir
    }
  }, [token]);

  return <div>App Content</div>;
}
```

### Server Tarafında Bildirim Gönderme

```typescript
// Tek kullanıcıya bildirim gönder
await customerRouter.sendNotification({
  userId: "user123",
  title: "Yeni Sipariş",
  body: "Siparişiniz onaylandı!",
  data: { orderId: "order123" }
});

// Tüm kullanıcılara bildirim gönder
await customerRouter.sendNotification({
  sendToAll: true,
  title: "Yeni Ürün",
  body: "Yeni ürünler eklendi!",
  data: { category: "clothing" }
});
```

## Özellikler

### ✅ Tamamlanan Özellikler

- **FCM Token Yönetimi**: Kayıtlı ve misafir kullanıcılar için token saklama
- **Bildirim İzinleri**: Otomatik izin isteme ve yönetimi
- **Foreground Bildirimleri**: Uygulama açıkken bildirim gösterimi
- **Background Bildirimleri**: Service worker ile arka plan bildirimleri
- **Çoklu Bildirim**: Tek seferde birden fazla kullanıcıya bildirim
- **Veri Payloads**: Bildirimlerle birlikte özel veri gönderimi

### 🔧 Teknik Detaylar

- **Misafir Kullanıcılar**: FCM token localStorage'da saklanır
- **Kayıtlı Kullanıcılar**: Token hem localStorage hem de veritabanında saklanır
- **Service Worker**: `firebase-sw.js` background mesajları yönetir
- **Otomatik Temizlik**: Kullanıcı çıkış yaptığında token temizlenir

### 📱 Desteklenen Platformlar

- Web browsers (Chrome, Firefox, Safari, Edge)
- PWA (Progressive Web App) desteği
- Mobile web browsers

## API Endpoints

### `storeFcmToken`
FCM token'ını saklar (kayıtlı kullanıcılar için)

### `sendNotification`
Bildirim gönderir (admin yetkisi gerekli)

## Güvenlik

- Firebase Admin SDK server-side kullanılır
- VAPID key environment variable olarak saklanır
- Token'lar güvenli şekilde veritabanında saklanır