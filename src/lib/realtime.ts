import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { getDb } from "./firebase";

function isRealtimeDisabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("firestoreRealtime") === "off";
}

export function subscribeDoc(path: { col: string; id: string }, cb: (data: any | null) => void): () => void {
  const db = getDb();
  if (isRealtimeDisabled()) {
    let cancelled = false;
    const tick = async () => {
      try {
        const snap = await getDoc(doc(db, path.col, path.id));
        if (!cancelled) cb(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null);
      } catch {}
    };
    const iv = setInterval(tick, 1500);
    tick();
    return () => { cancelled = true; clearInterval(iv as any); };
  }
  const unsubscribe = onSnapshot(doc(db, path.col, path.id), (snap) => {
    cb(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null);
  });
  return unsubscribe;
}

export function subscribeQueryEq(path: { col: string; field: string; value: any }, cb: (rows: any[]) => void): () => void {
  const db = getDb();
  if (isRealtimeDisabled()) {
    let cancelled = false;
    const tick = async () => {
      try {
        const qs = await getDocs(query(collection(db, path.col), where(path.field as any, "==", path.value)));
        const rows = qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        if (!cancelled) cb(rows);
      } catch {}
    };
    const iv = setInterval(tick, 1500);
    tick();
    return () => { cancelled = true; clearInterval(iv as any); };
  }
  const q = query(collection(db, path.col), where(path.field as any, "==", path.value));
  const unsub = onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  });
  return unsub;
}


