import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { messaging, db } from "../firebase/config";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Ask for permission and save the device token
 */
export async function registerFcmToken(uid) {
  if (!messaging || !uid || !VAPID_KEY) {
    console.warn("FCM not available");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Register the service worker
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      // Save token under the user document
      await setDoc(
        doc(db, "users", uid),
        {
          fcmTokens: {
            [token]: {
              updatedAt: serverTimestamp(),
              platform: "web",
            },
          },
        },
        { merge: true }
      );

      console.log("FCM token saved");
    }

    return token;
  } catch (err) {
    console.error("FCM registration error:", err);
    return null;
  }
}

/**
 * Listen for messages while the app is open (foreground)
 */
export function listenForForegroundMessages(onReceive) {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    if (onReceive) onReceive(payload);
  });
}