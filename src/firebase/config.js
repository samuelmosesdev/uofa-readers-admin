import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// All values come from environment variables (see .env.example).
// Never hard-code Firebase keys into source files that get committed.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Session persistence (security):
 * - User stays logged in only while this browser tab/window session is open.
 * - Closing the browser (all tabs for this site) ends the session.
 * - This is safer than "remember forever" on shared devices (lab PCs, cyber cafés).
 *
 * To allow "stay logged in" across browser restarts, switch to:
 *   import { browserLocalPersistence } from "firebase/auth"
 *   setPersistence(auth, browserLocalPersistence)
 */
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.warn("Could not set auth persistence:", err);
});

export const db = getFirestore(app);
export const storage = getStorage(app);
