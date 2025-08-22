import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth as createAuth, connectAuthEmulator, signInAnonymously, type Auth } from "firebase/auth";
import type { FirebaseConfig } from "./types";

const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyAugQgcCkXtE78RwCfMKfdWKhTkM0U65uQ",
  authDomain: "tams-78aa4.firebaseapp.com",
  projectId: "tams-78aa4",
  storageBucket: "tams-78aa4.firebasestorage.app",
  messagingSenderId: "1003635673668",
  appId: "1:1003635673668:web:b04c1ec93bd9614d29ca11",
  measurementId: "G-RMM2M76W94"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth: Auth = createAuth(app);

// Connect to emulators in development (disabled for now to use real Firebase)
// if (process.env.NODE_ENV === "development") {
//   try {
//     connectFirestoreEmulator(db, "localhost", 8080);
//     connectAuthEmulator(auth, "http://localhost:9099");
//   } catch {
//     // Emulators already connected
//   }
// }

export function getDb() {
  return db;
}

export function getAuth(): Auth {
  return auth;
}

export async function getFirebaseAuth(): Promise<Auth> {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Failed to sign in anonymously:", error);
      throw error;
    }
  }
  return auth;
}

export { app };


