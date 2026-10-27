import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

const app = isFirebaseConfigured ? (!getApps().length ? initializeApp(firebaseConfig) : getApp()) : null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const auth = isFirebaseConfigured ? getAuth(app as any) : null;
const googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = isFirebaseConfigured ? getFirestore(app as any) : null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const storage = isFirebaseConfigured ? getStorage(app as any) : null;

export { app, auth, db, googleProvider, storage };
