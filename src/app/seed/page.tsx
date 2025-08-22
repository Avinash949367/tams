"use client";
import { collection, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore";
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

  async function clearQuestions() {
    setErr("");
    setDone("");
    try {
      await getFirebaseAuth();
      const db = getDb();
      const questionsSnap = await getDocs(collection(db, "questions"));
      for (const q of questionsSnap.docs) {
        await deleteDoc(q.ref);
      }
      setDone("Cleared all existing questions.");
    } catch (e: unknown) {
      const error = e as { message?: string };
      setErr(error?.message || "Failed to clear questions.");
    }
  }

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
          cooldownUntil: null,
          gameEnded: false
        });
      }
      
      // Questions with multiple choice options
      const questions = [
        {
          text: "What is the primary goal of a business?",
          options: [
            "To make money",
            "To help people",
            "To create jobs",
            "To innovate technology"
          ]
        },
        {
          text: "Which marketing strategy focuses on building long-term customer relationships?",
          options: [
            "Transactional marketing",
            "Relationship marketing", 
            "Mass marketing",
            "Direct marketing"
          ]
        },
        {
          text: "What is the main advantage of diversification in business?",
          options: [
            "Reduced risk",
            "Lower costs",
            "Faster growth",
            "Simpler operations"
          ]
        },
        {
          text: "Which financial statement shows a company's profitability over time?",
          options: [
            "Balance sheet",
            "Income statement",
            "Cash flow statement",
            "Statement of equity"
          ]
        },
        {
          text: "What is the key principle of supply and demand?",
          options: [
            "Price increases with demand",
            "Supply always equals demand",
            "Price decreases with supply",
            "Market equilibrium"
          ]
        },
        {
          text: "Which leadership style encourages team input and collaboration?",
          options: [
            "Autocratic",
            "Democratic",
            "Laissez-faire",
            "Transactional"
          ]
        }
      ];
      
      for (let i = 0; i < questions.length; i++) {
        const id = `q${i + 1}`;
        await setDoc(doc(db, "questions", id), { 
          text: questions[i].text,
          options: questions[i].options,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      setDone("Seeded venues and multiple-choice questions.");
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
      <div className="flex gap-2">
        <button onClick={seed} className="bg-black text-white px-4 py-2 rounded">Seed Questions & Venues</button>
        <button onClick={clearQuestions} className="bg-red-600 text-white px-4 py-2 rounded">Clear Questions</button>
      </div>
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
        <p className="font-semibold mb-2">New Features:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Questions now have 4 multiple-choice options</li>
          <li>Players must select an option and provide a reason</li>
          <li>Admin can see selected option and reason for evaluation</li>
        </ul>
        <p className="font-semibold mt-4 mb-2">Setup Instructions:</p>
        <ol className="list-decimal ml-5 mt-1 space-y-1">
          <li>Click &quot;Clear Questions&quot; to remove old questions</li>
          <li>Click &quot;Seed Questions &amp; Venues&quot; to create new multiple-choice questions</li>
          <li>Enable Anonymous sign-in: Firebase Console → Authentication → Sign-in method → Anonymous → Enable.</li>
          <li>Set Firestore dev rules to allow authenticated users (including anonymous) read/write and Publish.</li>
        </ol>
      </div>
    </div>
  );
}


