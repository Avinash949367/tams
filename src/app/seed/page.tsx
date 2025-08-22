"use client";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { useEffect, useState } from "react";

interface VenueData {
  id: string;
  name: string;
}

export default function SeedPage() {
  const [done, setDone] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [venuesInput, setVenuesInput] = useState<string>("a,b,c,d,e,f,g");
  const [existing, setExisting] = useState<VenueData[]>([]);

  useEffect(() => {
    const db = getDb();
    getDocs(collection(db, "venues")).then((snap) => {
      setExisting(snap.docs.map((d) => ({ 
        id: d.id, 
        name: (d.data() as { name: string }).name 
      })));
    }).catch(() => {});
  }, []);

  async function seed() {
    setErr("");
    setDone("");
    try {
      // Ensure we are authenticated (anonymous) so rules permitting auth users pass
      await getFirebaseAuth();
      const db = getDb();
      const venues = venuesInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 20);
      for (const v of venues) {
        const id = v.toLowerCase().replace(/\s+/g, "-");
        await setDoc(doc(db, "venues", id), { 
          name: v, 
          isActive: true, 
          currentRoundId: null, 
          cooldownUntil: null 
        });
      }
      const questions = [
        "Explain the concept of supply and demand.",
        "What strategies would you use to pitch a new product?",
        "Describe a time you solved a complex problem.",
        "How would you allocate a budget of $10,000 across marketing channels?",
      ];
      for (let i = 0; i < questions.length; i++) {
        const id = `q${i + 1}`;
        await setDoc(doc(db, "questions", id), { text: questions[i] });
      }
      setDone("Seeded venues and questions.");
    } catch (e: unknown) {
      const error = e as { message?: string };
      setErr(error?.message || "Failed to seed. Check Firestore rules and auth.");
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-xl mx-auto space-y-4">
      <div className="space-y-2">
        <label className="text-sm">Venue names (comma-separated)</label>
        <input 
          value={venuesInput} 
          onChange={(e) => setVenuesInput(e.target.value)} 
          className="w-full border rounded px-3 py-2" 
          placeholder="a,b,c,d,e,f,g" 
        />
      </div>
      <button onClick={seed} className="bg-black text-white px-4 py-2 rounded">Seed</button>
      {done && <div className="mt-4 text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">{done}</div>}
      {err && (
        <div className="mt-4 text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {err}
        </div>
      )}
      <div>
        <div className="text-sm font-semibold mb-1">Existing venues</div>
        {existing.length ? (
          <ul className="list-disc ml-5 text-sm">
            {existing.map((v) => (<li key={v.id}>{v.name} <span className="text-gray-500">({v.id})</span></li>))}
          </ul>
        ) : (
          <div className="text-xs text-gray-600">No venues yet.</div>
        )}
      </div>
      <div className="mt-4 text-xs text-gray-600">
        If you see permission errors:
        <ol className="list-decimal ml-5 mt-1 space-y-1">
          <li>Enable Anonymous sign-in: Firebase Console → Authentication → Sign-in method → Anonymous → Enable.</li>
          <li>Set Firestore dev rules to allow authenticated users (including anonymous) read/write and Publish.</li>
        </ol>
      </div>
    </div>
  );
}


