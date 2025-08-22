"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { setAnswer } from "@/lib/db";
import { subscribeDoc } from "@/lib/realtime";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Dice } from "@/components/ui/Dice";
import type { Round, Venue, Team, Answer } from "@/lib/types";

export default function PlayPage() {
  const router = useRouter();
  const { teamId, teamName, venueId } = useSessionStore();
  const [isDisqualified, setIsDisqualified] = useState<boolean>(false);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [remaining, setRemaining] = useState<number>(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [teamAnswer, setTeamAnswer] = useState<Answer | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!teamId || !venueId) {
      router.replace("/register");
      return;
    }
    const unsubVenue = subscribeDoc<Venue>({ col: "venues", id: venueId }, (data) => {
      if (data?.currentRoundId) {
        const unsubRound = subscribeDoc<Round>({ col: "rounds", id: data.currentRoundId }, (rd) => {
          if (!rd) { 
            setRound(null); 
            setQuestion(""); 
            setAnswerSubmitted(false);
            setTeamAnswer(null);
            return; 
          }
          setRound(rd);
          if (rd.questionId) {
            getDoc(doc(getDb(), "questions", rd.questionId)).then((qSnap) => {
              const q = qSnap.data() as { text: string; options?: string[] } | undefined;
              setQuestion(q?.text ?? "");
              setOptions(q?.options ?? []);
            });
          } else {
            setQuestion("");
            setOptions([]);
          }
        });
        return () => unsubRound();
      } else {
        setRound(null);
        setQuestion("");
        setAnswerSubmitted(false);
        setTeamAnswer(null);
      }
    });
    return () => unsubVenue();
  }, [teamId, venueId, router]);

  useEffect(() => {
    if (!teamId) return;
    const unsubTeam = subscribeDoc<Team>({ col: "teams", id: teamId }, (t) => {
      setIsDisqualified(Boolean(t?.isDisqualified));
      setTeamData(t);
    });
    return () => unsubTeam();
  }, [teamId]);

  // Check if team has already submitted an answer for this round
  useEffect(() => {
    if (!teamId || !round?.id) return;
    
    const checkExistingAnswer = async () => {
      try {
        const answerId = `${teamId}_${round.id}`;
        const answerDoc = await getDoc(doc(getDb(), "answers", answerId));
        if (answerDoc.exists()) {
          const answerData = answerDoc.data() as Answer;
          setTeamAnswer(answerData);
          setAnswerSubmitted(true);
          setContent(answerData.content || "");
          setReason(answerData.reason || "");
          setSelectedOptionIndex(answerData.selectedOptionIndex);
        } else {
          setTeamAnswer(null);
          setAnswerSubmitted(false);
        }
      } catch (error) {
        console.error("Error checking existing answer:", error);
      }
    };
    
    checkExistingAnswer();
  }, [teamId, round?.id]);

  const autoSubmit = useCallback(async () => {
    if (!teamId || !round?.id || isDisqualified || answerSubmitted) return;
    await setAnswer(round.id, teamId, content, true, selectedOptionIndex, reason);
    setAnswerSubmitted(true);
  }, [teamId, round?.id, content, isDisqualified, selectedOptionIndex, reason, answerSubmitted]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (round?.state === "answering" && round?.answerEndsAt && !answerSubmitted) {
      timerRef.current = setInterval(() => {
        const ms = Math.max(0, round.answerEndsAt! - Date.now());
        setRemaining(Math.ceil(ms / 1000));
        if (ms <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          autoSubmit();
        }
      }, 250);
    } else {
      setRemaining(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [round?.state, round?.answerEndsAt, autoSubmit, answerSubmitted]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId || !round?.id || isDisqualified || answerSubmitted) return;
    setSubmitting(true);
    try {
      await setAnswer(round.id, teamId, content, false, selectedOptionIndex, reason);
      setAnswerSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  const statusText = useMemo(() => {
    if (!round) return "Waiting for admin to start the roll...";
    if (isDisqualified) return "Disqualified for this round";
    if (round.state === "rolling") return "Dice is rolling...";
    if (round.state === "answering") {
      if (answerSubmitted) return "Answer submitted - waiting for evaluation";
      return "Answer the question";
    }
    if (round.state === "evaluating") return "Admin is evaluating";
    return "";
  }, [round, isDisqualified, answerSubmitted]);

  const statusColor = useMemo(() => {
    if (!round) return "text-gray-600 dark:text-gray-400";
    if (round.state === "rolling") return "text-blue-600 dark:text-blue-400";
    if (round.state === "answering") {
      if (answerSubmitted) return "text-green-600 dark:text-green-400";
      return "text-green-600 dark:text-green-400";
    }
    if (round.state === "evaluating") return "text-purple-600 dark:text-purple-400";
    return "text-gray-600 dark:text-gray-400";
  }, [round, answerSubmitted]);

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
              {teamData && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Score: {teamData.totalScore || 0} pts • Currency: ${teamData.currency || 0} • Rounds: {teamData.roundsParticipated || 0}
                </div>
              )}
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
      {round?.state === "rolling" && !isDisqualified && (
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
      {round?.state === "rolling" && isDisqualified && (
        <Card variant="outlined" className="border-red-200 dark:border-red-800">
          <div className="p-6 text-center text-red-800 dark:text-red-200">
            You are disqualified for this round and will be skipped.
          </div>
        </Card>
      )}

      {/* Question answering */}
      {round?.state === "answering" && !isDisqualified && (
        <Card variant="elevated">
          <CardHeader 
            title="Question" 
            subtitle={answerSubmitted ? "Answer submitted successfully!" : `Time left: ${remaining}s`}
          />
          {!answerSubmitted && (
            <div className="mb-4">
              <div className={`text-center text-2xl font-bold ${remaining <= 10 ? 'text-red-600' : remaining <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                {remaining}s
              </div>
            </div>
          )}
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-gray-900 dark:text-white leading-relaxed">
                  {question || "Loading question..."}
                </div>
              </div>
              {options.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Select an option</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {options.map((opt, idx) => (
                      <label key={idx} className={`flex items-center gap-3 p-3 border rounded cursor-pointer ${
                        selectedOptionIndex === idx 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-300 dark:border-gray-600'
                      } ${answerSubmitted ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <input
                          type="radio"
                          name="answerOption"
                          checked={selectedOptionIndex === idx}
                          onChange={() => !answerSubmitted && setSelectedOptionIndex(idx)}
                          disabled={answerSubmitted}
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {!answerSubmitted ? (
                <form onSubmit={onSubmit} className="space-y-4">
                  <Textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why did you choose that answer?"
                    className="min-h-[100px]"
                    label="Reason"
                  />
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
                      disabled={submitting || (!content.trim() && (options.length > 0 && selectedOptionIndex === undefined))}
                      loading={submitting}
                      className="min-w-[120px]"
                    >
                      {submitting ? "Submitting..." : "Submit Answer"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-3 text-green-800 dark:text-green-200">
                      <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <div className="font-semibold">Answer Submitted Successfully!</div>
                        <div className="text-sm">Your answer has been recorded. Wait for admin evaluation.</div>
                      </div>
                    </div>
                  </div>
                  
                  {teamAnswer && (
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="text-sm font-medium mb-2">Your Submitted Answer:</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {teamAnswer.content}
                        </div>
                      </div>
                      {teamAnswer.reason && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="text-sm font-medium mb-2">Your Reason:</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {teamAnswer.reason}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {round?.state === "answering" && isDisqualified && (
        <Card variant="outlined" className="border-red-200 dark:border-red-800">
          <div className="p-6 text-center text-red-800 dark:text-red-200">
            You are disqualified for this round and cannot answer.
          </div>
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


