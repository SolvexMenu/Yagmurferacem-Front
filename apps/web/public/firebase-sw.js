importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyD6TW1ZpfEuew5YRuo_ZaJUuVI_pfD4U4A",
  authDomain: "yagmurferacem-dev.firebaseapp.com",
  projectId: "yagmurferacem-dev",
  storageBucket: "yagmurferacem-dev.firebasestorage.app",
  messagingSenderId: "941905980549",
  appId: "1:941905980549:web:8e69ca144860ffd7b44dec",
  measurementId: "G-4FMR1J3GS3"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});