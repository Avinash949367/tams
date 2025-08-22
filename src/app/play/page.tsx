"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { refs, setAnswer } from "@/lib/db";
import { subscribeDoc } from "@/lib/realtime";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
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
  const [submitting, setSubmitting] = useState(false);
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
    setSubmitting(true);
    try {
      await setAnswer(round.id, teamId, content, false);
    } finally {
      setSubmitting(false);
    }
  }

  const statusText = useMemo(() => {
    if (!round) return "Waiting for admin to start the roll...";
    if (round.state === "rolling") return "Dice is rolling...";
    if (round.state === "answering") return "Answer the question";
    if (round.state === "evaluating") return "Admin is evaluating";
    return "";
  }, [round]);

  const statusColor = useMemo(() => {
    if (!round) return "text-gray-600 dark:text-gray-400";
    if (round.state === "rolling") return "text-blue-600 dark:text-blue-400";
    if (round.state === "answering") return "text-green-600 dark:text-green-400";
    if (round.state === "evaluating") return "text-purple-600 dark:text-purple-400";
    return "text-gray-600 dark:text-gray-400";
  }, [round]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header with team info and status */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {teamName?.charAt(0)?.toUpperCase() || "T"}
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Team</div>
              <div className="font-semibold text-lg text-gray-900 dark:text-white">{teamName}</div>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
            <div className={`font-semibold text-lg ${statusColor}`}>{statusText}</div>
          </div>
        </div>
      </div>

      {/* Disqualified notice */}
      {isDisqualified && (
        <Card variant="outlined" className="border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <div className="font-semibold">Disqualified</div>
              <div className="text-sm">You have been disqualified and cannot participate in the next roll.</div>
            </div>
          </div>
        </Card>
      )}

      {/* Dice rolling animation */}
      {round?.state === "rolling" && (
        <Card variant="glass" className="text-center py-12">
          <div className="flex flex-col items-center gap-6">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Rolling the dice...
            </div>
            <div className="w-full flex justify-center">
              <Dice rolling value={round?.dice} />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Wait for the result and get ready to answer!
            </div>
          </div>
        </Card>
      )}

      {/* Question answering */}
      {round?.state === "answering" && (
        <Card variant="elevated">
          <CardHeader 
            title="Question" 
            subtitle={`Time remaining: ${remaining} seconds`}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-gray-900 dark:text-white leading-relaxed">
                  {question || "Loading question..."}
                </div>
              </div>
              
              <form onSubmit={onSubmit} className="space-y-4">
                <Textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="Type your answer here..." 
                  className="min-h-[140px]"
                  label="Your Answer"
                />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {content.length} characters
                  </div>
                  <Button 
                    type="submit" 
                    disabled={submitting || !content.trim()}
                    loading={submitting}
                    className="min-w-[120px]"
                  >
                    {submitting ? "Submitting..." : "Submit Answer"}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation waiting */}
      {round?.state === "evaluating" && (
        <Card variant="glass" className="text-center py-12">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Answer Submitted!
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Your answer has been submitted. Waiting for admin evaluation...
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Waiting for game to start */}
      {!round && (
        <Card variant="glass" className="text-center py-16">
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Waiting for Game
              </div>
              <div className="text-gray-600 dark:text-gray-400 max-w-md">
                The admin will start the game soon. Get ready for an exciting round of Monopoly!
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}


