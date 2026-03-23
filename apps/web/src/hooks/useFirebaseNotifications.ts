import { useEffect, useState } from 'react';
import { 
  initializeFirebaseMessaging, 
  getStoredFcmToken, 
  clearStoredFcmToken 
} from '../utils/firebase';

export const useFirebaseNotifications = (userId?: string) => {
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        // Önce localStorage'dan token'ı kontrol et
        const storedToken = getStoredFcmToken();
        if (storedToken) {
          setToken(storedToken);
        }

        // Firebase messaging'i başlat
        const newToken = await initializeFirebaseMessaging(userId);
        if (newToken) {
          setToken(newToken);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Firebase notifications:', error);
        setIsInitialized(true);
      }
    };

    initNotifications();
  }, [userId]);

  const clearToken = () => {
    clearStoredFcmToken();
    setToken(null);
  };

  return {
    token,
    isInitialized,
    clearToken
  };
};