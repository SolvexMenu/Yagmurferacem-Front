import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { client, orpc } from "./orpc";

const firebaseConfig = {
  apiKey: "AIzaSyD6TW1ZpfEuew5YRuo_ZaJUuVI_pfD4U4A",
  authDomain: "yagmurferacem-dev.firebaseapp.com",
  projectId: "yagmurferacem-dev",
  storageBucket: "yagmurferacem-dev.firebasestorage.app",
  messagingSenderId: "941905980549",
  appId: "1:941905980549:web:8e69ca144860ffd7b44dec",
  measurementId: "G-4FMR1J3GS3"
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);

export const requestNotificationPermission = async (userId?: string) => {
  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.register("/firebase-sw.js"),
      });

      if (token) {
        console.log('FCM Token:', token);

        // Token'ı localStorage'a kaydet (misafir kullanıcılar için)
        localStorage.setItem('fcmToken', token);

        // Eğer kullanıcı giriş yapmışsa sunucuya da gönder
        if (userId) {
          try {
            // Burada API çağrısı yapılacak - örnek:
            // await fetch('/api/store-fcm-token', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ token, userId })
            // });
            await client.customerRouter.storeFcmToken({
              token,
              userId
            })
            console.log('Token stored for user:', userId);
          } catch (error) {
            console.error('Failed to store token on server:', error);
          }
        }

        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

export const getStoredFcmToken = () => {
  return localStorage.getItem('fcmToken');
};

export const clearStoredFcmToken = () => {
  localStorage.removeItem('fcmToken');
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);

      // Foreground'da bildirim göster
      if (payload.notification) {
        showNotification(payload.notification.title || '', payload.notification.body || '');
      }

      resolve(payload);
    });
  });

export const showNotification = (title: string, body: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      ...options
    });
  }
};

export const initializeFirebaseMessaging = async (userId?: string) => {
  // Service worker'ı kaydet
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Bildirim izni iste ve token al
  const token = await requestNotificationPermission(userId);

  // Foreground mesajları dinle
  onMessageListener().then((payload: any) => {
    console.log('Received foreground message:', payload);
  }).catch(err => console.log('Failed to receive message:', err));

  return token;
};

export default app;