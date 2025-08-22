"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { refs, setAnswer } from "@/lib/db";
import { subscribeDoc } from "@/lib/realtime";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Dice } from "@/components/ui/Dice";

export default function PlayPage() {
  const router = useRouter();
  const { teamId, teamName, venueId } = useSessionStore();
  const [isDisqualified, setIsDisqualified] = useState<boolean>(false);
  const [round, setRound] = useState<any>(null);
  const [question, setQuestion] = useState<string>("");
  const [remaining, setRemaining] = useState<number>(0);
  const [content, setContent] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!teamId || !venueId) {
      router.replace("/register");
      return;
    }
    const unsubVenue = subscribeDoc({ col: "venues", id: venueId }, async (data) => {
      if (data?.currentRoundId) {
        const unsubRound = subscribeDoc({ col: "rounds", id: data.currentRoundId }, async (rd) => {
          if (!rd) { setRound(null); setQuestion(""); return; }
          setRound(rd);
          if (rd.questionId) {
            const qSnap = await getDoc(doc(getDb(), "questions", rd.questionId));
            setQuestion((qSnap.data() as any)?.text ?? "");
          } else {
            setQuestion("");
          }
        });
        return () => unsubRound();
      } else {
        setRound(null);
        setQuestion("");
      }
    });
    return () => unsubVenue();
  }, [teamId, venueId, router]);

  useEffect(() => {
    if (!teamId) return;
    const unsubTeam = subscribeDoc({ col: "teams", id: teamId }, (t) => {
      setIsDisqualified(Boolean(t?.isDisqualified));
    });
    return () => unsubTeam();
  }, [teamId]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current as any);
    if (round?.state === "answering" && round?.answerEndsAt) {
      timerRef.current = setInterval(() => {
        const ms = Math.max(0, round.answerEndsAt - Date.now());
        setRemaining(Math.ceil(ms / 1000));
        if (ms <= 0) {
          clearInterval(timerRef.current as any);
          autoSubmit();
        }
      }, 250);
    } else {
      setRemaining(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current as any);
    };
  }, [round?.state, round?.answerEndsAt]);

  async function autoSubmit() {
    if (!teamId || !round?.id) return;
    await setAnswer(round.id, teamId, content, true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId || !round?.id) return;
    await setAnswer(round.id, teamId, content, false);
  }

  const statusText = useMemo(() => {
    if (!round) return "Waiting for admin to start the roll...";
    if (round.state === "rolling") return "Dice is rolling...";
    if (round.state === "answering") return "Answer the question";
    if (round.state === "evaluating") return "Admin is evaluating";
    return "";
  }, [round]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Team</div>
          <div className="font-semibold">{teamName}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Status</div>
          <div className="font-semibold">{statusText}</div>
        </div>
      </div>

      {isDisqualified && (
        <div className="px-3 py-2 rounded text-amber-800 bg-amber-50 border border-amber-200">You have been disqualified and cannot participate in the next roll.</div>
      )}

      {round?.state === "rolling" && (
        <div className="w-full flex justify-center items-center">
          <Dice rolling value={round?.dice} />
        </div>
      )}

      {round?.state === "answering" && (
        <Card>
          <CardHeader title="Question" subtitle={`Time left: ${remaining}s`} />
          <div className="space-y-3">
            <div className="p-3 rounded bg-white border">{question || "..."}</div>
            <form onSubmit={onSubmit} className="space-y-3">
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type your answer here..." className="min-h-[140px]" />
              <Button>Submit</Button>
            </form>
          </div>
        </Card>
      )}

      {round?.state === "evaluating" && (
        <Card>
          <div>Your answer was submitted. Waiting for evaluation...</div>
        </Card>
      )}
    </div>
  );
}


