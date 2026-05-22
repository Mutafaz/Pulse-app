import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy_key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy_domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy_project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy_bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy_sender",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy_app_id"
};

// Initialize Firebase only on the client side to prevent SSR errors
let app, auth, db;

if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  
  auth = getAuth(app);
  // Explicitly set auth persistence to local to survive PWA restarts
  setPersistence(auth, browserLocalPersistence).catch(console.error);
  
  db = getFirestore(app);
  // Enable offline caching so getDoc works instantly without network
  enableIndexedDbPersistence(db).catch((err) => {
    console.warn("Firestore offline persistence failed:", err.code);
  });
}

export { app, auth, db };
