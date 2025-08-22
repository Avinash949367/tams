"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { getDocs, collection } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { startRoll, finalizeRoll, beginEvaluation, awardAndDisqualify } from "@/lib/db";
import { subscribeDoc } from "@/lib/realtime";
import { signInAnonymously, getAuth } from "firebase/auth";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { Dice } from "@/components/ui/Dice";

export default function AdminPage() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [venues, setVenues] = useState<Array<{ id: string; name: string }>>([]);
  const [answerTime, setAnswerTime] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchVenues() {
      try {
        const venuesSnapshot = await getDocs(collection(getDb(), "venues"));
        const venuesData = venuesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setVenues(venuesData);
      } catch (err) {
        console.error("Error fetching venues:", err);
        setError("Failed to load venues. Please try again.");
      }
    }
    fetchVenues();
  }, []);

  useEffect(() => {
    if (!selectedVenueId) return;

    // Ensure anonymous authentication
    const auth = getAuth();
    if (!auth.currentUser) {
      signInAnonymously(auth);
    }

    const unsubVenue = subscribeDoc({ col: "venues", id: selectedVenueId }, async (venue) => {
      if (venue?.currentRoundId) {
        const unsubRound = subscribeDoc({ col: "rounds", id: venue.currentRoundId }, (round) => {
          setCurrentRound(round);
        });
        return () => unsubRound();
      } else {
        setCurrentRound(null);
      }
    });

    const unsubTeams = subscribeDoc({ col: "teams", id: selectedVenueId }, async () => {
      const teamsSnapshot = await getDocs(collection(getDb(), "teams"));
      const teamsData = teamsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((team: any) => team.venueId === selectedVenueId);
      setTeams(teamsData);
    });

    return () => {
      unsubVenue();
      unsubTeams();
    };
  }, [selectedVenueId]);

  useEffect(() => {
    if (!currentRound?.id) return;
    const unsubAnswers = subscribeDoc({ col: "answers", id: currentRound.id }, async () => {
      const answersSnapshot = await getDocs(collection(getDb(), "answers"));
      const answersData = answersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((answer: any) => answer.roundId === currentRound.id);
      setAnswers(answersData);
    });
    return () => unsubAnswers();
  }, [currentRound?.id]);

  async function handleStartRoll() {
    if (!selectedVenueId) {
      setError("Please select a venue first.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      await startRoll(selectedVenueId);
      setSession({ venueId: selectedVenueId, isAdmin: true });
    } catch (err: any) {
      console.error("Start roll error:", err);
      setError(err.message || "Failed to start roll. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFinalizeRoll() {
    if (!currentRound?.id) return;

    setIsLoading(true);
    setError("");

    try {
      const dice = Math.floor(Math.random() * 6) + 1;
      const questionsSnapshot = await getDocs(collection(getDb(), "questions"));
      const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      await finalizeRoll(currentRound.id, dice, randomQuestion.id, answerTime * 1000);
    } catch (err: any) {
      console.error("Finalize roll error:", err);
      setError(err.message || "Failed to finalize roll. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBeginEvaluation() {
    if (!currentRound?.id) return;

    setIsLoading(true);
    setError("");

    try {
      await beginEvaluation(currentRound.id);
    } catch (err: any) {
      console.error("Begin evaluation error:", err);
      setError(err.message || "Failed to begin evaluation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAwardAndDisqualify() {
    if (!selectedVenueId) return;

    setIsLoading(true);
    setError("");

    try {
      const lowestScoringTeam = teams
        .filter((team: any) => !team.isDisqualified)
        .sort((a: any, b: any) => (a.currency || 0) - (b.currency || 0))[0];

      if (lowestScoringTeam) {
        await awardAndDisqualify(selectedVenueId, [lowestScoringTeam.id]);
      }
    } catch (err: any) {
      console.error("Award and disqualify error:", err);
      setError(err.message || "Failed to award and disqualify. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader 
          title="Admin Control" 
          subtitle="Manage the Monopoly event for your venue"
        />
        
        <div className="space-y-4">
          <Select
            label="Venue"
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
          >
            <option value="">Select venue</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </Select>

          <Input
            label="Answer time (seconds)"
            type="number"
            value={answerTime}
            onChange={(e) => setAnswerTime(Number(e.target.value))}
            min={30}
            max={300}
          />

          {error && <Notice type="error">{error}</Notice>}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleStartRoll}
              disabled={isLoading || !selectedVenueId || currentRound?.state === "rolling"}
              className="flex-1"
            >
              {isLoading ? "Starting..." : "Start Roll"}
            </Button>
            
            <Button 
              onClick={handleFinalizeRoll}
              disabled={isLoading || currentRound?.state !== "rolling"}
              variant="secondary"
              className="flex-1"
            >
              {isLoading ? "Finalizing..." : "Finalize Roll"}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleBeginEvaluation}
              disabled={isLoading || currentRound?.state !== "answering"}
              variant="primary"
              className="flex-1"
            >
              {isLoading ? "Starting..." : "Begin Evaluation"}
            </Button>
            
            <Button 
              onClick={handleAwardAndDisqualify}
              disabled={isLoading || currentRound?.state !== "evaluating"}
              variant="secondary"
              className="flex-1"
            >
              {isLoading ? "Processing..." : "Award & Disqualify"}
            </Button>
          </div>
        </div>
      </Card>

      {currentRound && (
        <Card>
          <CardHeader title="Current Round Status" />
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="text-sm font-medium text-blue-800">State</div>
                <div className="text-blue-900 font-semibold capitalize">{currentRound.state}</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200">
                <div className="text-sm font-medium text-emerald-800">Teams</div>
                <div className="text-emerald-900 font-semibold">{teams.length}</div>
              </div>
            </div>
            
            {currentRound.state === "rolling" && (
              <div className="flex justify-center">
                <Dice rolling value={currentRound.dice} />
              </div>
            )}
            
            {currentRound.state === "answering" && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200">
                <div className="text-sm font-medium text-amber-800">Answers Received</div>
                <div className="text-amber-900 font-semibold">{answers.length} / {teams.length}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {teams.length > 0 && (
        <Card>
          <CardHeader title="Teams" subtitle={`${teams.length} teams registered`} />
          <div className="space-y-2">
            {teams.map((team: any) => (
              <div key={team.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div>
                  <div className="font-medium">{team.name}</div>
                  <div className="text-sm text-gray-500">Currency: {team.currency || 0}</div>
                </div>
                {team.isDisqualified && (
                  <div className="text-red-600 text-sm font-medium">Disqualified</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}


