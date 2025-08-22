"use client";

import { useEffect, useState } from "react";
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
import type { Venue, Round, Team, Answer } from "@/lib/types";

interface VenueData {
  id: string;
  name: string;
}

interface TeamData extends Team {
  venueId: string;
}

interface AnswerData extends Answer {
  roundId: string;
}

export default function AdminPage() {
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [venues, setVenues] = useState<VenueData[]>([]);
  const [answerTime, setAnswerTime] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [answers, setAnswers] = useState<AnswerData[]>([]);

  useEffect(() => {
    async function fetchVenues() {
      try {
        const venuesSnapshot = await getDocs(collection(getDb(), "venues"));
        const venuesData = venuesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: (doc.data() as { name: string }).name
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

    const unsubVenue = subscribeDoc<Venue>({ col: "venues", id: selectedVenueId }, (venue) => {
      if (venue?.currentRoundId) {
        const unsubRound = subscribeDoc<Round>({ col: "rounds", id: venue.currentRoundId }, (round) => {
          setCurrentRound(round);
        });
        return () => unsubRound();
      } else {
        setCurrentRound(null);
      }
    });

    const unsubTeams = subscribeDoc({ col: "teams", id: selectedVenueId }, () => {
      // Fetch teams when venue changes
      getDocs(collection(getDb(), "teams")).then((teamsSnapshot) => {
        const teamsData = teamsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as TeamData))
          .filter((team: TeamData) => team.venueId === selectedVenueId);
        setTeams(teamsData);
      });
    });

    return () => {
      unsubVenue();
      unsubTeams();
    };
  }, [selectedVenueId]);

  useEffect(() => {
    if (!currentRound?.id) return;
    const unsubAnswers = subscribeDoc({ col: "answers", id: currentRound.id }, () => {
      // Fetch answers when round changes
      getDocs(collection(getDb(), "answers")).then((answersSnapshot) => {
        const answersData = answersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as AnswerData))
          .filter((answer: AnswerData) => answer.roundId === currentRound.id);
        setAnswers(answersData);
      });
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
      await startRoll(selectedVenueId);
    } catch (err) {
      console.error("Error starting roll:", err);
      setError("Failed to start roll. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFinalizeRoll() {
    if (!currentRound?.id) {
      setError("No active round to finalize.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const dice = Math.floor(Math.random() * 6) + 1;
      const questionsSnapshot = await getDocs(collection(getDb(), "questions"));
      const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      await finalizeRoll(currentRound.id, dice, randomQuestion.id, answerTime * 1000);
    } catch (err) {
      console.error("Error finalizing roll:", err);
      setError("Failed to finalize roll. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBeginEvaluation() {
    if (!currentRound?.id) {
      setError("No active round to evaluate.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await beginEvaluation(currentRound.id);
    } catch (err) {
      console.error("Error beginning evaluation:", err);
      setError("Failed to begin evaluation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAwardAndDisqualify() {
    if (!selectedVenueId) {
      setError("No venue selected.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const lowestScoringTeam = teams
        .filter((team: TeamData) => !team.isDisqualified)
        .sort((a: TeamData, b: TeamData) => (a.currency || 0) - (b.currency || 0))[0];

      if (lowestScoringTeam) {
        await awardAndDisqualify(selectedVenueId, [lowestScoringTeam.id]);
      }
    } catch (err) {
      console.error("Error awarding/disqualifying:", err);
      setError("Failed to process award/disqualification. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const getRoundStatusText = () => {
    if (!currentRound) return "No active round";
    switch (currentRound.state) {
      case "waiting": return "Waiting to start";
      case "rolling": return "Dice rolling";
      case "answering": return "Teams answering";
      case "evaluating": return "Evaluating answers";
      case "completed": return "Round completed";
      default: return "Unknown state";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Admin Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Control the Monopoly event and manage game flow
        </p>
      </div>

      {error && (
        <Notice type="error">
          {error}
        </Notice>
      )}

      <Card>
        <CardHeader title="Venue Selection" />
        <div className="space-y-4">
          <Select
            label="Select Venue"
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
          >
            <option value="">Choose a venue</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </Select>

          {selectedVenueId && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-sm text-green-700 dark:text-green-300">
                Selected: <span className="font-medium">{venues.find(v => v.id === selectedVenueId)?.name}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {selectedVenueId && (
        <>
          <Card>
            <CardHeader title="Round Control" />
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Answer Time (seconds)"
                  type="number"
                  value={answerTime}
                  onChange={(e) => setAnswerTime(parseInt(e.target.value) || 60)}
                  min="10"
                  max="300"
                />
                <div className="flex items-end">
                  <Button
                    onClick={handleStartRoll}
                    disabled={isLoading || currentRound?.state !== "waiting"}
                    loading={isLoading}
                    className="w-full"
                  >
                    Start Roll
                  </Button>
                </div>
              </div>

              {currentRound && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Round Status: <span className="font-medium">{getRoundStatusText()}</span>
                  </div>
                  {currentRound.dice && (
                    <div className="mt-2">
                      <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">Dice Result:</div>
                      <Dice value={currentRound.dice} size="sm" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleFinalizeRoll}
                  disabled={isLoading || currentRound?.state !== "rolling"}
                  loading={isLoading}
                  variant="secondary"
                >
                  Finalize Roll
                </Button>
                <Button
                  onClick={handleBeginEvaluation}
                  disabled={isLoading || currentRound?.state !== "answering"}
                  loading={isLoading}
                  variant="secondary"
                >
                  Begin Evaluation
                </Button>
                <Button
                  onClick={handleAwardAndDisqualify}
                  disabled={isLoading || currentRound?.state !== "evaluating"}
                  loading={isLoading}
                  variant="destructive"
                >
                  Award & Disqualify
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Teams & Answers" />
            <div className="space-y-4">
              {teams.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No teams registered for this venue
                </div>
              ) : (
                <div className="space-y-4">
                  {teams.map((team) => {
                    const teamAnswer = answers.find(a => a.teamId === team.id);
                    return (
                      <div key={team.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold">{team.name}</div>
                            <div className="text-sm text-gray-500">
                              {team.isDisqualified ? "Disqualified" : "Active"}
                            </div>
                          </div>
                          {teamAnswer && (
                            <div className="text-sm text-gray-600">
                              {teamAnswer.isAutoSubmitted ? "Auto-submitted" : "Submitted"}
                            </div>
                          )}
                        </div>
                        
                        {teamAnswer && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-sm font-medium mb-1">Answer:</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {teamAnswer.content}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}


