export type Venue = {
  id: string;
  name: string;
  isActive: boolean;
  currentRoundId?: string;
  cooldownUntil?: number; // epoch millis
};

export type Team = {
  id: string;
  name: string;
  venueId: string;
  currency: number; // 0..1000
  isDisqualified: boolean;
  createdAt: number;
};

export type Question = {
  id: string;
  text: string;
  difficulty?: "easy" | "medium" | "hard";
};

export type Round = {
  id: string;
  venueId: string;
  dice: number | null; // 1..6 when rolled
  questionId: string | null;
  state: "waiting" | "rolling" | "answering" | "evaluating" | "completed";
  rollStartedAt?: number; // ms
  answerEndsAt?: number; // ms
  evaluateEndsAt?: number; // ms
};

export type Answer = {
  id: string; // teamId_roundId
  roundId: string;
  teamId: string;
  content: string;
  submittedAt: number;
  autoSubmitted: boolean;
  score?: number; // 0..1000
};


