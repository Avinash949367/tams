import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { initializeFirestore, type Firestore, persistentLocalCache, persistentSingleTabManager } from "firebase/firestore";
import { setLogLevel } from "firebase/app";

let app: FirebaseApp | undefined;
let analytics: Analytics | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    // Reduce noisy logs in console
    try { setLogLevel("error" as any); } catch {}
    app = initializeApp({
      apiKey: "AIzaSyAugQgcCkXtE78RwCfMKfdWKhTkM0U65uQ",
      authDomain: "tams-78aa4.firebaseapp.com",
      projectId: "tams-78aa4",
      storageBucket: "tams-78aa4.appspot.com",
      messagingSenderId: "1003635673668",
      appId: "1:1003635673668:web:b04c1ec93bd9614d29ca11",
      measurementId: "G-RMM2M76W94",
    });
  } else {
    app = getApps()[0];
  }
  return app!;
}

export async function getFirebaseAnalytics(): Promise<Analytics | undefined> {
  if (typeof window === "undefined") return undefined;
  if (!app) getFirebaseApp();
  if (!analytics && (await isSupported())) {
    analytics = getAnalytics(app!);
  }
  return analytics;
}

export async function getFirebaseAuth(): Promise<Auth> {
  if (!app) getFirebaseApp();
  if (!auth) {
    auth = getAuth(app!);
    await setPersistence(auth, browserLocalPersistence);
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        // ignore if already signed in
      }
    }
  }
  return auth!;
}

export function getDb(): Firestore {
  if (!app) getFirebaseApp();
  if (!db) {
    const transport = typeof window !== "undefined" ? window.localStorage.getItem("firestoreTransport") : null;
    const forceLongPolling = transport === "force";
    const autoDetect = transport === "auto";
    db = initializeFirestore(app!, {
      experimentalForceLongPolling: forceLongPolling,
      experimentalAutoDetectLongPolling: autoDetect,
      localCache: persistentLocalCache(),
    });
  }
  return db!;
}

export function onAuthReady(cb: (uid: string) => void): void {
  getFirebaseAuth().then((a) => {
    if (a.currentUser) cb(a.currentUser.uid);
    onAuthStateChanged(a, (u) => {
      if (u?.uid) cb(u.uid);
    });
  });
}


