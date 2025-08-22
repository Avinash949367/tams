import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, Timestamp, updateDoc, where, addDoc, getDocs, orderBy, limit } from "firebase/firestore";
import { getDb } from "./firebase";
import type { Venue, Team, Question, Round, Answer } from "./types";

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
  const teamDoc = await addDoc(refs.teams(), {
    name,
    venueId,
    currency: 0,
    isDisqualified: false,
    createdAt: Date.now(),
  } as Omit<Team, "id">);
  return { id: teamDoc.id, name, venueId, currency: 0, isDisqualified: false, createdAt: Date.now() };
}

export async function startRoll(venueId: string): Promise<Round> {
  const venueSnap = await getDoc(refs.venue(venueId));
  const venue = venueSnap.data() as any;
  const now = Date.now();
  if (venue?.cooldownUntil && venue.cooldownUntil > now) {
    throw new Error("Cooldown active. Please wait before starting next roll.");
  }
  const roundDoc = await addDoc(refs.rounds(), {
    venueId,
    dice: null,
    questionId: null,
    state: "rolling",
    rollStartedAt: Date.now(),
  } as Omit<Round, "id">);
  await updateDoc(refs.venue(venueId), { currentRoundId: roundDoc.id });
  const snap = await getDoc(roundDoc);
  return { id: roundDoc.id, ...(snap.data() as any) } as Round;
}

export async function finalizeRoll(roundId: string, dice: number, questionId: string, answerDurationMs: number = 60_000): Promise<void> {
  await updateDoc(refs.round(roundId), {
    dice,
    questionId,
    state: "answering",
    answerEndsAt: Date.now() + answerDurationMs,
  });
}

export async function setAnswer(roundId: string, teamId: string, content: string, autoSubmitted: boolean): Promise<void> {
  const id = `${teamId}_${roundId}`;
  await setDoc(refs.answer(id), {
    id,
    roundId,
    teamId,
    content,
    submittedAt: Date.now(),
    autoSubmitted,
  } as Answer);
}

export async function beginEvaluation(roundId: string): Promise<void> {
  await updateDoc(refs.round(roundId), {
    state: "evaluating",
    evaluateEndsAt: Date.now() + 5 * 60_000,
  });
}

export async function scoreTeam(answerId: string, score: number): Promise<void> {
  await updateDoc(refs.answer(answerId), { score });
}

export async function awardAndDisqualify(venueId: string, disqualifiedTeamIds: string[]): Promise<void> {
  // Fetch answers for last round
  const venueSnap = await getDoc(refs.venue(venueId));
  const currentRoundId = (venueSnap.data() as any)?.currentRoundId as string | undefined;
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
      await updateDoc(teamRef, { currency: newCurrency });
    }
  }
  // Disqualify lowest scored or provided list
  for (const id of disqualifiedTeamIds) {
    await updateDoc(refs.team(id), { isDisqualified: true });
  }

  // Set cooldown 15s
  await updateDoc(refs.venue(venueId), { cooldownUntil: Date.now() + 15_000, currentRoundId: null });
  await updateDoc(refs.round(currentRoundId), { state: "completed" });
}


