"use client";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const [mode, setMode] = useState<string>("force");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = window.localStorage.getItem("firestoreTransport") || "force";
    setMode(current);
  }, []);
  function apply(m: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("firestoreTransport", m);
    window.location.reload();
  }
  return (
    <div className="min-h-screen p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Debug</h1>
      <div className="space-y-2">
        <div className="text-sm text-gray-600">Firestore transport</div>
        <div className="flex gap-2">
          <button onClick={() => apply("force")} className={`px-3 py-2 rounded border ${mode === "force" ? "bg-black text-white" : ""}`}>Force long polling</button>
          <button onClick={() => apply("auto")} className={`px-3 py-2 rounded border ${mode === "auto" ? "bg-black text-white" : ""}`}>Auto-detect</button>
          <button onClick={() => apply("default")} className={`px-3 py-2 rounded border ${mode === "default" ? "bg-black text-white" : ""}`}>Default</button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm text-gray-600">Realtime listeners</div>
        <div className="flex gap-2">
          <button onClick={() => { localStorage.setItem("firestoreRealtime", "on"); location.reload(); }} className="px-3 py-2 rounded border">Enable</button>
          <button onClick={() => { localStorage.setItem("firestoreRealtime", "off"); location.reload(); }} className="px-3 py-2 rounded border">Disable (polling)</button>
        </div>
      </div>
    </div>
  );
}


