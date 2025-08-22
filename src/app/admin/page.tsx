"use client";

import { useEffect, useState, useCallback } from "react";
import { getDocs, collection, updateDoc, doc, getDoc, query, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { startRoll, finalizeRoll, beginEvaluation, awardAndDisqualify, scoreTeam, endGame, getTeamRankings, refs } from "@/lib/db";
import { subscribeDoc, subscribeQueryEq } from "@/lib/realtime";
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
  const [questionText, setQuestionText] = useState("");
  const [questionOptions, setQuestionOptions] = useState<string[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);
  const [uname, setUname] = useState("");
  const [pass, setPass] = useState("");
  const [gameEnded, setGameEnded] = useState(false);
  const [rankings, setRankings] = useState<TeamData[]>([]);
  const [scoringInputs, setScoringInputs] = useState<Record<string, string>>({});
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<string[]>([]);
  const [roundTimer, setRoundTimer] = useState<number>(0);

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

  const refreshRankings = useCallback(async () => {
    if (!selectedVenueId) return;
    try {
      const rankingsData = await getTeamRankings(selectedVenueId);
      setRankings(rankingsData);
    } catch (err) {
      console.error("Error fetching rankings:", err);
    }
  }, [selectedVenueId]);

  useEffect(() => {
    if (!selectedVenueId) return;

    // Ensure anonymous authentication
    const auth = getAuth();
    if (!auth.currentUser) {
      signInAnonymously(auth);
    }

    // Subscribe to venue changes
    const unsubVenue = subscribeDoc<Venue>({ col: "venues", id: selectedVenueId }, (venue) => {
      if (venue?.currentRoundId) {
        // Subscribe to round changes
        const unsubRound = subscribeDoc<Round>({ col: "rounds", id: venue.currentRoundId }, (round) => {
          setCurrentRound(round);
          if (round?.questionId) {
            getDoc(doc(getDb(), "questions", round.questionId)).then((qSnap) => {
              const q = qSnap.data() as { text?: string; options?: string[] } | undefined;
              setQuestionText(q?.text ?? "");
              setQuestionOptions(q?.options ?? []);
            });
          } else {
            setQuestionText("");
            setQuestionOptions([]);
          }
        });
        return () => unsubRound();
      } else {
        setCurrentRound(null);
        setQuestionText("");
        setQuestionOptions([]);
      }
      // Check if game has ended
      setGameEnded(Boolean(venue?.gameEnded));
    });

    // Subscribe to teams for this venue in real-time
    const unsubTeams = subscribeQueryEq<Team>({ 
      col: "teams", 
      field: "venueId", 
      value: selectedVenueId 
    }, (teamsData) => {
      setTeams(teamsData as TeamData[]);
      // Update rankings when teams change
      refreshRankings();
    });

    return () => {
      unsubVenue();
      unsubTeams();
    };
  }, [selectedVenueId, refreshRankings]);

  useEffect(() => {
    if (!currentRound?.id) return;
    
    // Subscribe to answers for this round in real-time
    const unsubAnswers = subscribeQueryEq<Answer>({ 
      col: "answers", 
      field: "roundId", 
      value: currentRound.id 
    }, (answersData) => {
      const newAnswers = answersData as AnswerData[];
      const previousCount = answers.length;
      
      // Check for new submissions
      if (newAnswers.length > previousCount) {
        const newSubmissions = newAnswers.filter(newAns => 
          !answers.some(oldAns => oldAns.id === newAns.id)
        );
        
        if (newSubmissions.length > 0) {
          const teamNames = newSubmissions.map(ans => {
            const team = teams.find(t => t.id === ans.teamId);
            return team?.name || 'Unknown Team';
          }).join(', ');
          
          const notification = `New answer(s) submitted by: ${teamNames}`;
          setNotifications(prev => [...prev, notification]);
          
          // Auto-remove notification after 5 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n !== notification));
          }, 5000);
        }
      }
      
      setAnswers(newAnswers);
    });
    
    return () => unsubAnswers();
  }, [currentRound?.id, answers.length, teams]);

  // Round timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (currentRound?.state === "answering" && currentRound?.answerEndsAt) {
      timer = setInterval(() => {
        const remaining = Math.max(0, currentRound.answerEndsAt! - Date.now());
        setRoundTimer(Math.ceil(remaining / 1000));
      }, 1000);
    } else {
      setRoundTimer(0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentRound?.state, currentRound?.answerEndsAt]);

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

  async function handleScoreAnswer(answerId: string, score: number) {
    setIsLoading(true);
    setError("");
    
    try {
      await scoreTeam(answerId, score);
      // Clear the scoring input after successful scoring
      setScoringInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[answerId];
        return newInputs;
      });
    } catch (err) {
      console.error("Error scoring answer:", err);
      setError("Failed to score answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddFeedback(answerId: string, feedback: string) {
    if (!feedback.trim()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      await updateDoc(refs.answer(answerId), { 
        feedback: feedback.trim(), 
        updatedAt: Date.now() 
      });
      // Clear the feedback input after successful submission
      setFeedbackInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[answerId];
        return newInputs;
      });
    } catch (err) {
      console.error("Error adding feedback:", err);
      setError("Failed to add feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (uname === "admin" && pass === "admin123") {
      setIsAuthed(true);
      setError("");
    } else {
      setIsAuthed(false);
      setError("Invalid admin credentials.");
    }
  }

  async function handleDisqualifyTeam(teamId: string) {
    setIsLoading(true);
    setError("");
    
    try {
      await updateDoc(refs.team(teamId), { 
        isDisqualified: true, 
        updatedAt: Date.now() 
      });
    } catch (err) {
      console.error("Error disqualifying team:", err);
      setError("Failed to disqualify team. Please try again.");
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

  async function handleEndGame() {
    if (!selectedVenueId) {
      setError("No venue selected.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await endGame(selectedVenueId);
    } catch (err) {
      console.error("Error ending game:", err);
      setError("Failed to end game. Please try again.");
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

  const getSubmissionStatus = (teamId: string) => {
    const answer = answers.find(a => a.teamId === teamId);
    if (!answer) return { status: "Not submitted", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" };
    if (answer.isAutoSubmitted) return { status: "Auto-submitted", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300" };
    return { status: "Submitted", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" };
  };

  const getTeamStatusColor = (team: TeamData, teamAnswer: AnswerData | undefined) => {
    if (team.isDisqualified) return "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10";
    if (teamAnswer && teamAnswer.score !== undefined) return "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10";
    if (teamAnswer) return "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10";
    return "border-gray-200 dark:border-gray-700";
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

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification, index) => (
            <Notice key={index} type="success">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {notification}
              </div>
            </Notice>
          ))}
        </div>
      )}

      {!isAuthed && (
        <Card>
          <CardHeader title="Admin Login" />
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <Input label="Username" value={uname} onChange={(e) => setUname(e.target.value)} placeholder="admin" />
            <Input label="Password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="admin123" />
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </Card>
      )}

      {isAuthed && (
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
      )}

      {isAuthed && selectedVenueId && (
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
                    disabled={isLoading || Boolean(currentRound && currentRound.state !== "waiting") || gameEnded}
                    loading={isLoading}
                    className="w-full"
                  >
                    Start Roll
                  </Button>
                </div>
              </div>

              {currentRound ? (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Round Status: <span className="font-medium">{getRoundStatusText()}</span>
                  </div>
                  {questionText && (
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      Question: {questionText}
                    </div>
                  )}
                  {questionOptions.length > 0 && (
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      Options: {questionOptions.map((o, i) => `${i + 1}. ${o}`).join("  ")}
                    </div>
                  )}
                  {currentRound.dice && (
                    <div className="mt-2">
                      <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">Dice Result:</div>
                      <Dice value={currentRound.dice} size="sm" />
                    </div>
                  )}
                  {currentRound.state === "answering" && (
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      <div className="flex items-center gap-4">
                        <span>Submissions: {answers.length} / {teams.filter(t => !t.isDisqualified).length}</span>
                        {answers.length > 0 && (
                          <span className="text-xs">
                            ({Math.round((answers.length / teams.filter(t => !t.isDisqualified).length) * 100)}% complete)
                          </span>
                        )}
                      </div>
                      {roundTimer > 0 && (
                        <div className="mt-1">
                          <span className="text-xs">Time remaining: </span>
                          <span className={`font-bold text-sm ${
                            roundTimer <= 10 ? 'text-red-600' : 
                            roundTimer <= 30 ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            {roundTimer}s
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : gameEnded ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <span className="font-medium">Game Ended</span> - All teams have been disqualified. The game is over.
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <span className="font-medium">Ready to start!</span> - No active round. Click &quot;Start Roll&quot; to begin a new game round.
                  </div>
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
                <Button
                  onClick={handleEndGame}
                  disabled={isLoading}
                  loading={isLoading}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  End Game
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-4 gap-6">
            {/* Left Container - Teams & Answers (3/4 width) */}
            <div className="col-span-3">
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
                        const submissionStatus = getSubmissionStatus(team.id);
                        const teamStatusColor = getTeamStatusColor(team, teamAnswer);
                        return (
                          <div key={team.id} className={`p-4 border rounded-lg ${teamStatusColor}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="font-semibold text-lg">{team.name}</div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    team.isDisqualified 
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' 
                                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                  }`}>
                                    {team.isDisqualified ? `Eliminated R${team.disqualifiedInRound || '?'}` : "Active"}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Score: {team.totalScore || 0} pts
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Currency: ${team.currency || 0}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Rounds: {team.roundsParticipated || 0}
                                  </span>
                                  {team.lastRoundScore !== undefined && (
                                    <span className="text-green-600 dark:text-green-400">
                                      Last: +{team.lastRoundScore}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${submissionStatus.color}`}>
                                  {submissionStatus.status}
                                </span>
                                {!team.isDisqualified && (
                                  <Button
                                    onClick={() => handleDisqualifyTeam(team.id)}
                                    variant="destructive"
                                    size="sm"
                                    disabled={isLoading}
                                  >
                                    Disqualify
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {teamAnswer && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div>
                                    <div className="text-sm font-medium mb-2">Answer:</div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                      {teamAnswer.content}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                    <div>Submitted:</div>
                                    <div>{teamAnswer.submittedAt ? new Date(teamAnswer.submittedAt).toLocaleTimeString() : 'Unknown'}</div>
                                    {teamAnswer.isAutoSubmitted && (
                                      <div className="text-orange-600 dark:text-orange-400">Auto-submitted</div>
                                    )}
                                  </div>
                                </div>
                                {(teamAnswer.selectedOptionIndex !== undefined) && (
                                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                    <div className="text-sm font-medium mb-2">Selected Option:</div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                      {(() => {
                                        const idx = teamAnswer.selectedOptionIndex as number;
                                        const text = questionOptions[idx] ?? `Option ${idx + 1}`;
                                        return `${idx + 1}. ${text}`;
                                      })()}
                                    </div>
                                  </div>
                                )}
                                {teamAnswer.reason && (
                                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                    <div className="text-sm font-medium mb-2">Reason:</div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                      {teamAnswer.reason}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Enhanced Scoring Section */}
                                <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Score:</span>
                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                      {teamAnswer.score !== undefined ? teamAnswer.score : 'Not scored'}
                                    </span>
                                  </div>
                                  
                                  {teamAnswer.score === undefined && !team.isDisqualified && (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="0-100"
                                        className="w-20"
                                        value={scoringInputs[teamAnswer.id] || ''}
                                        onChange={(e) => setScoringInputs(prev => ({
                                          ...prev,
                                          [teamAnswer.id]: e.target.value
                                        }))}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            const score = parseInt((e.target as HTMLInputElement).value);
                                            if (!isNaN(score) && score >= 0 && score <= 100) {
                                              handleScoreAnswer(teamAnswer.id, score);
                                            }
                                          }
                                        }}
                                      />
                                      <Button
                                        onClick={() => {
                                          const score = parseInt(scoringInputs[teamAnswer.id] || '0');
                                          if (!isNaN(score) && score >= 0 && score <= 100) {
                                            handleScoreAnswer(teamAnswer.id, score);
                                          }
                                        }}
                                        variant="secondary"
                                        size="sm"
                                        disabled={isLoading}
                                      >
                                        Score
                                      </Button>
                                    </div>
                                  )}
                                  
                                  {teamAnswer.score !== undefined && (
                                    <div className="text-sm text-green-600 dark:text-green-400">
                                      ✓ Scored ✓
                                    </div>
                                  )}
                                </div>
                                
                                {/* Feedback Section */}
                                <div className="flex items-center gap-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Feedback:</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {teamAnswer.feedback || 'No feedback yet'}
                                    </span>
                                  </div>
                                  
                                  {!team.isDisqualified && (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        placeholder="Add feedback..."
                                        className="w-48"
                                        value={feedbackInputs[teamAnswer.id] || ''}
                                        onChange={(e) => setFeedbackInputs(prev => ({
                                          ...prev,
                                          [teamAnswer.id]: e.target.value
                                        }))}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            const feedback = feedbackInputs[teamAnswer.id] || '';
                                            if (feedback.trim()) {
                                              handleAddFeedback(teamAnswer.id, feedback);
                                            }
                                          }
                                        }}
                                      />
                                      <Button
                                        onClick={() => {
                                          const feedback = feedbackInputs[teamAnswer.id] || '';
                                          if (feedback.trim()) {
                                            handleAddFeedback(teamAnswer.id, feedback);
                                          }
                                        }}
                                        variant="secondary"
                                        size="sm"
                                        disabled={isLoading}
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {!teamAnswer && currentRound?.state === "answering" && (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-center">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Waiting for answer submission...
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
            </div>

            {/* Right Container - Leaderboard (1/4 width) */}
            <div className="col-span-1">
              <Card>
                <CardHeader title="Live Leaderboard" />
                <div className="space-y-3">
                  {rankings.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      No team data
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rankings.slice(0, 8).map((team, index) => (
                        <div key={team.id} className={`p-2 rounded-lg border text-xs ${
                          team.isDisqualified 
                            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                            : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-400 text-yellow-900' :
                              index === 1 ? 'bg-gray-400 text-gray-900' :
                              index === 2 ? 'bg-amber-600 text-amber-100' :
                              'bg-blue-500 text-white'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="font-semibold truncate">{team.name}</div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold">{team.totalScore || 0} pts</span>
                            <span className="text-gray-600">${team.currency || 0}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            R{team.roundsParticipated || 0}
                            {team.isDisqualified && team.disqualifiedInRound && (
                              <span className="ml-1 text-red-600">
                                (R{team.disqualifiedInRound})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


