"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSessionStore } from "@/store/useSessionStore";
import { useRouter } from "next/navigation";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, updateDoc, where } from "firebase/firestore";
import { beginEvaluation, finalizeRoll, refs, awardAndDisqualify, startRoll } from "@/lib/db";
import { subscribeDoc, subscribeQueryEq } from "@/lib/realtime";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function AdminPage() {
  const router = useRouter();
  const { venueId } = useSessionStore();
  const setSession = useSessionStore((s) => s.setSession);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [diceDisplay, setDiceDisplay] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [questionText, setQuestionText] = useState<string>("");
  const [evaluateRemaining, setEvaluateRemaining] = useState<number>(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [answerDuration, setAnswerDuration] = useState<number>(60);
  const evalTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ensure we are signed in anonymously for Firestore writes
    getFirebaseAuth().catch(() => {});
    // load venues for selection
    getDocs(collection(getDb(), "venues")).then((snap) => {
      setVenues(snap.docs.map((d) => ({ id: d.id, name: (d.data() as any).name })));
    });
  }, []);

  useEffect(() => {
    if (!venueId) return;
    const unsubVenue = subscribeDoc({ col: "venues", id: venueId }, (data) => {
      if (data?.cooldownUntil && data.cooldownUntil > Date.now()) {
        const iv = setInterval(() => {
          const ms = Math.max(0, (data.cooldownUntil as number) - Date.now());
          setCooldownRemaining(Math.ceil(ms / 1000));
        }, 250);
        return () => clearInterval(iv as any);
      } else {
        setCooldownRemaining(0);
      }
      if (data?.currentRoundId) {
        const unsubRound = subscribeDoc({ col: "rounds", id: data.currentRoundId }, async (rd) => {
          if (!rd) { setCurrentRound(null); setQuestionText(""); return; }
          setCurrentRound(rd);
          if (rd.questionId) {
            const qSnap = await getDoc(doc(getDb(), "questions", rd.questionId));
            setQuestionText((qSnap.data() as any)?.text ?? "");
          } else {
            setQuestionText("");
          }
        });
        return () => unsubRound();
      } else {
        setCurrentRound(null);
        setQuestionText("");
      }
    });
    return () => unsubVenue();
  }, [venueId]);

  useEffect(() => {
    if (!currentRound?.id) return;
    if (currentRound.state === "evaluating" && currentRound.evaluateEndsAt) {
      if (evalTimerRef.current) clearInterval(evalTimerRef.current as any);
      evalTimerRef.current = setInterval(() => {
        const ms = Math.max(0, currentRound.evaluateEndsAt - Date.now());
        setEvaluateRemaining(Math.ceil(ms / 1000));
      }, 250);
    } else {
      setEvaluateRemaining(0);
      if (evalTimerRef.current) clearInterval(evalTimerRef.current as any);
    }
    return () => {
      if (evalTimerRef.current) clearInterval(evalTimerRef.current as any);
    };
  }, [currentRound?.state, currentRound?.evaluateEndsAt, currentRound?.id]);

  useEffect(() => {
    if (!currentRound?.id) return;
    const unsub = subscribeQueryEq({ col: "answers", field: "roundId", value: currentRound.id }, (rows) => setAnswers(rows));
    return () => unsub();
  }, [currentRound?.id]);

  async function handleStartRoll() {
    if (!venueId) return;
    await getFirebaseAuth();
    setRolling(true);
    const r = await startRoll(venueId);
    // Animate dice for both admin and users via state 'rolling'
    let ticks = 20;
    const iv = setInterval(() => {
      setDiceDisplay(randomInt(1, 6));
      ticks--;
      if (ticks <= 0) {
        clearInterval(iv);
        const finalValue = randomInt(1, 6);
        setDiceDisplay(finalValue);
        chooseQuestionAndLock(r.id, finalValue);
        setRolling(false);
      }
    }, 100);
  }

  async function chooseQuestionAndLock(roundId: string, finalDice: number) {
    // pick a random question
    const qs = await getDocs(collection(getDb(), "questions"));
    const arr = qs.docs;
    const chosen = arr[Math.floor(Math.random() * Math.max(1, arr.length))];
    await finalizeRoll(roundId, finalDice, chosen?.id || "", answerDuration * 1000);
  }

  async function openEvaluation() {
    if (!currentRound?.id) return;
    await beginEvaluation(currentRound.id);
  }

  async function finishRound() {
    if (!venueId) return;
    // Determine lowest scored teams
    const scored = answers.filter((a) => typeof a.score === "number");
    let lowestTeams: string[] = [];
    if (scored.length > 0) {
      const minScore = Math.min(...scored.map((a: any) => a.score as number));
      lowestTeams = scored.filter((a: any) => a.score === minScore).map((a: any) => a.teamId as string);
    }
    await awardAndDisqualify(venueId, lowestTeams);
  }

  async function setScore(ansId: string, score: number) {
    await updateDoc(doc(getDb(), "answers", ansId), { score });
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin Control</h1>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-sm">Venue</label>
          <select value={venueId || ""} onChange={(e) => setSession({ venueId: e.target.value, isAdmin: true })} className="border rounded px-3 py-2 ml-2">
            <option value="">Select venue</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        {cooldownRemaining > 0 && (
          <div className="px-3 py-2 rounded bg-yellow-50 border text-yellow-800">Cooldown {cooldownRemaining}s</div>
        )}
      </div>
      {!currentRound && venueId && (
        <div className="flex items-end gap-3">
          <div>
            <label className="text-sm">Answer time (seconds)</label>
            <input type="number" min={10} max={300} value={answerDuration} onChange={(e) => setAnswerDuration(Number(e.target.value))} className="border rounded px-2 py-1 w-36 ml-2" />
          </div>
          <button onClick={handleStartRoll} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50" disabled={rolling}>
            {rolling ? "Rolling..." : "Start Roll"}
          </button>
        </div>
      )}

      {currentRound?.state === "rolling" && (
        <div className="text-center space-y-2">
          <div className="text-sm">Dice is rolling...</div>
          <div className="text-7xl">{diceDisplay ?? "🎲"}</div>
        </div>
      )}

      {currentRound?.state === "answering" && (
        <div className="space-y-3">
          <div className="text-sm">Question</div>
          <div className="p-4 border rounded">{questionText}</div>
          <button onClick={openEvaluation} className="bg-blue-600 text-white px-4 py-2 rounded">Start Evaluation</button>
        </div>
      )}

      {currentRound?.state === "evaluating" && (
        <div className="space-y-4">
          <div className="text-sm">Time remaining</div>
          <div className="font-mono">{evaluateRemaining}s</div>
          <div className="space-y-2">
            <div className="font-semibold">Answers</div>
            <div className="grid gap-3">
              {answers.map((a) => (
                <div key={a.id} className="border rounded p-3">
                  <div className="text-sm text-gray-500">Team: {a.teamId}</div>
                  <div className="whitespace-pre-wrap">{a.content || "(empty)"}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="number" min={0} max={1000} defaultValue={a.score ?? 0} onChange={(e) => setScore(a.id, Number(e.target.value))} className="border rounded px-2 py-1 w-28" />
                    <span className="text-sm">/ 1000</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={finishRound} className="bg-green-600 text-white px-4 py-2 rounded">Finish Round</button>
        </div>
      )}
    </div>
  );
}


