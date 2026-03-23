import admin from 'firebase-admin';

// Firebase Admin SDK'yı başlat
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require("./yagmurferacem-dev.json")),
  });
}

export const messaging = admin.messaging();

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendNotificationToToken = async (
  token: string,
  payload: NotificationPayload
) => {
  try {
    const message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    };

    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);
    return { success: true, messageId: response };
  } catch (error: any) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
};

export const sendNotificationToMultipleTokens = async (
  tokens: string[],
  payload: NotificationPayload
) => {
  try {
    const message = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log('Successfully sent messages:', response);
    return { success: true, response };
  } catch (error: any) {
    console.error('Error sending messages:', error);
    return { success: false, error: error.message };
  }
};