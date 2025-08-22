import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { getDb } from "./firebase";
import type { RealtimeDoc, RealtimeCallback } from "./types";

function isRealtimeDisabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("firestoreRealtime") === "off";
}

export function subscribeDoc<T = Record<string, unknown>>(
  path: RealtimeDoc, 
  cb: RealtimeCallback<T>
): () => void {
  const db = getDb();
  if (isRealtimeDisabled()) {
    let cancelled = false;
    const tick = async () => {
      try {
        const snap = await getDoc(doc(db, path.col, path.id));
        if (!cancelled) cb(snap.exists() ? { id: snap.id, ...(snap.data() as T) } : null);
      } catch {
        // Ignore errors
      }
    };
    const iv = setInterval(tick, 1500);
    tick();
    return () => { cancelled = true; clearInterval(iv); };
  }
  const unsubscribe = onSnapshot(doc(db, path.col, path.id), (snap) => {
    cb(snap.exists() ? { id: snap.id, ...(snap.data() as T) } : null);
  });
  return unsubscribe;
}

export function subscribeQueryEq<T = Record<string, unknown>>(
  path: { col: string; field: string; value: string | number | boolean }, 
  cb: (rows: (T & { id: string })[]) => void
): () => void {
  const db = getDb();
  if (isRealtimeDisabled()) {
    let cancelled = false;
    const tick = async () => {
      try {
        const qs = await getDocs(query(collection(db, path.col), where(path.field, "==", path.value)));
        const rows = qs.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
        if (!cancelled) cb(rows);
      } catch {
        // Ignore errors
      }
    };
    const iv = setInterval(tick, 1500);
    tick();
    return () => { cancelled = true; clearInterval(iv); };
  }
  const q = query(collection(db, path.col), where(path.field, "==", path.value));
  const unsub = onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })));
  });
  return unsub;
}


