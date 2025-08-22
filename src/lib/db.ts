import { collection, doc, getDoc, setDoc, updateDoc, addDoc, getDocs, query, where } from "firebase/firestore";
import { getDb } from "./firebase";
import type { Team, Round, Answer } from "./types";

const db = getDb();

export const refs = {
  venues: () => collection(db, "venues"),
  venue: (id: string) => doc(db, "venues", id),
  teams: () => collection(db, "teams"),
  team: (id: string) => doc(db, "teams", id),
  questions: () => collection(db, "questions"),
  question: (id: string) => doc(db, "questions", id),
  rounds: () => collection(db, "rounds"),
  round: (id: string) => doc(db, "rounds", id),
  answers: () => collection(db, "answers"),
  answer: (id: string) => doc(db, "answers", id),
};

export async function registerTeam(name: string, venueId: string): Promise<Team> {
  const now = Date.now();
  const teamData = {
    name,
    venueId,
    currency: 0,
    isDisqualified: false,
    createdAt: now,
    updatedAt: now,
  };
  const teamDoc = await addDoc(refs.teams(), teamData);
  return { id: teamDoc.id, ...teamData };
}

export async function startRoll(venueId: string): Promise<Round> {
  const venueSnap = await getDoc(refs.venue(venueId));
  const venue = venueSnap.data() as { cooldownUntil?: number };
  const now = Date.now();
  if (venue?.cooldownUntil && venue.cooldownUntil > now) {
    throw new Error("Cooldown active. Please wait before starting next roll.");
  }
  const roundData = {
    venueId,
    state: "rolling" as const,
    rollStartedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  const roundDoc = await addDoc(refs.rounds(), roundData);
  await updateDoc(refs.venue(venueId), { currentRoundId: roundDoc.id });
  return { id: roundDoc.id, ...roundData };
}

export async function finalizeRoll(roundId: string, dice: number, questionId: string, answerDurationMs: number = 60_000): Promise<void> {
  await updateDoc(refs.round(roundId), {
    dice,
    questionId,
    state: "answering",
    answerEndsAt: Date.now() + answerDurationMs,
    updatedAt: Date.now(),
  });
}

export async function setAnswer(roundId: string, teamId: string, content: string, autoSubmitted: boolean): Promise<void> {
  // Prevent disqualified teams from submitting answers
  const teamSnap = await getDoc(refs.team(teamId));
  const team = teamSnap.data() as Team | undefined;
  if (team?.isDisqualified) {
    throw new Error("Team is disqualified for this round.");
  }
  const now = Date.now();
  const answerData = {
    roundId,
    teamId,
    content,
    isAutoSubmitted: autoSubmitted,
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  const id = `${teamId}_${roundId}`;
  await setDoc(refs.answer(id), answerData);
}

export async function beginEvaluation(roundId: string): Promise<void> {
  await updateDoc(refs.round(roundId), {
    state: "evaluating",
    evaluateEndsAt: Date.now() + 5 * 60_000,
    updatedAt: Date.now(),
  });
}

export async function scoreTeam(answerId: string, score: number): Promise<void> {
  await updateDoc(refs.answer(answerId), { score, updatedAt: Date.now() });
}

export async function awardAndDisqualify(venueId: string, disqualifiedTeamIds: string[]): Promise<void> {
  // Fetch answers for last round
  const venueSnap = await getDoc(refs.venue(venueId));
  const currentRoundId = (venueSnap.data() as { currentRoundId?: string })?.currentRoundId as string | undefined;
  if (!currentRoundId) return;

  // Award currency up to max 1000
  const answersQ = query(refs.answers(), where("roundId", "==", currentRoundId));
  const answers = await getDocs(answersQ);
  for (const ans of answers.docs) {
    const a = ans.data() as Answer;
    if (a.score && a.score > 0) {
      const teamRef = refs.team(a.teamId);
      const teamSnap = await getDoc(teamRef);
      const team = teamSnap.data() as Team;
      const newCurrency = Math.min(1000, (team?.currency ?? 0) + a.score);
      await updateDoc(teamRef, { currency: newCurrency, updatedAt: Date.now() });
    }
  }

  // Clear previous round disqualifications for this venue so the flag applies for exactly one round
  const disqQ = query(refs.teams(), where("venueId", "==", venueId), where("isDisqualified", "==", true));
  const disqTeams = await getDocs(disqQ);
  for (const t of disqTeams.docs) {
    await updateDoc(refs.team(t.id), { isDisqualified: false, updatedAt: Date.now() });
  }

  // Disqualify lowest scoring teams
  for (const teamId of disqualifiedTeamIds) {
    await updateDoc(refs.team(teamId), { isDisqualified: true, updatedAt: Date.now() });
  }

  // Set cooldown
  await updateDoc(refs.venue(venueId), { 
    currentRoundId: null, 
    cooldownUntil: Date.now() + 30_000,
    updatedAt: Date.now(),
  });
}


