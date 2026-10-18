import { countObjects, getCountObject, MAX_NUMBER, type AdventureChallenge, type CountObjectId } from "@/lib/count-data";
import { arrangeChoices, shuffle } from "@/lib/random";

/**
 * Difficulty starts with 1–5, then brings in 6–10. Levels move with recent first-try answers;
 * they are never shown to the child as a grade.
 */
export type CountLevel = 1 | 2 | 3;
export const countLevels: Record<CountLevel, { min: number; max: number; choices: number; label: string }> = {
  1: { min: 1, max: 5, choices: 3, label: "Numbers 1 to 5" },
  2: { min: 1, max: 10, choices: 3, label: "Numbers 1 to 10" },
  3: { min: 5, max: 10, choices: 4, label: "Big numbers 5 to 10" },
};
export function isCountLevel(value: unknown): value is CountLevel { return value === 1 || value === 2 || value === 3; }

/** How many recent first tries are remembered, and how many are needed before the level moves. */
export const RECENT_WINDOW = 8;
export const MIN_RECENT_FOR_CHANGE = 6;

/** Harder after mostly-right rounds, simpler after many tries; otherwise stays put. */
export function nextLevel(level: CountLevel, recent: readonly boolean[]): CountLevel {
  const window = recent.slice(-RECENT_WINDOW);
  if (window.length < MIN_RECENT_FOR_CHANGE) return level;
  const accuracy = window.filter(Boolean).length / window.length;
  if (accuracy >= 0.85 && level < 3) return (level + 1) as CountLevel;
  if (accuracy < 0.5 && level > 1) return (level - 1) as CountLevel;
  return level;
}

export type CountQuestion = { id: string; count: number; object: CountObjectId; prompt: string };

const promptTemplates: readonly ((many: string) => string)[] = [
  (many) => `How many ${many} can you see?`,
  (many) => `Count the ${many}!`,
  (many) => `How many ${many} are there?`,
];

/** Every number with every object: 50 questions, each with its own prompt. */
export const countQuestions: readonly CountQuestion[] = Array.from({ length: MAX_NUMBER }, (_, index) => index + 1).flatMap((count) => countObjects.map((object, position): CountQuestion => ({ id: `${count}-${object.id}`, count, object: object.id, prompt: promptTemplates[(count + position) % promptTemplates.length](object.many) })));

export const COUNT_SESSION_LENGTH = 10;

/**
 * A round of distinct questions within the level's numbers: no question repeats, the same number
 * never comes twice in a row, and numbers are spread evenly.
 */
export function makeCountSession(level: CountLevel, length = COUNT_SESSION_LENGTH, random: () => number = Math.random): CountQuestion[] {
  const { min, max } = countLevels[level];
  const pool = shuffle(countQuestions.filter((question) => question.count >= min && question.count <= max), random);
  const session: CountQuestion[] = [];
  const used = new Map<number, number>();
  while (session.length < length && pool.length) {
    const previous = session.at(-1)?.count;
    // The least-used number that isn't the one just asked (the shuffled pool breaks ties).
    let position = -1;
    for (const [index, question] of pool.entries()) {
      if (question.count === previous) continue;
      if (position < 0 || (used.get(question.count) ?? 0) < (used.get(pool[position].count) ?? 0)) position = index;
    }
    if (position < 0) position = 0;
    const [question] = pool.splice(position, 1);
    used.set(question.count, (used.get(question.count) ?? 0) + 1);
    session.push(question);
  }
  return session;
}

/** The answer plus nearby numbers (close enough to make a child count, never the same). */
export function makeNumberChoices(question: CountQuestion, level: CountLevel, previousCorrectPosition = -1, random: () => number = Math.random): number[] {
  const { choices } = countLevels[level];
  const nearby = shuffle(Array.from({ length: MAX_NUMBER }, (_, index) => index + 1).filter((value) => value !== question.count && Math.abs(value - question.count) <= 3), random);
  const others = shuffle(Array.from({ length: MAX_NUMBER }, (_, index) => index + 1).filter((value) => value !== question.count && !nearby.includes(value)), random);
  return arrangeChoices(question.count, [...nearby, ...others].slice(0, choices - 1), previousCorrectPosition, random);
}

export function isCorrectCount(question: CountQuestion, choice: number): boolean {
  return choice === question.count;
}

export type MatchGroup = { id: string; count: number; object: CountObjectId };
export type MatchRound = { numbers: number[]; groups: MatchGroup[] };
export const MATCH_ROUNDS = 4;

/** Distinct numbers from the level, shown as number cards and (in a different order) as object groups. */
export function makeMatchRound(level: CountLevel, random: () => number = Math.random): MatchRound {
  const { min, max, choices } = countLevels[level];
  const picked = shuffle(Array.from({ length: max - min + 1 }, (_, index) => min + index), random).slice(0, choices);
  const objects = shuffle(countObjects, random);
  const groups = picked.map((count, position): MatchGroup => ({ id: `${count}-${objects[position % objects.length].id}`, count, object: objects[position % objects.length].id }));
  let numbers = shuffle(picked, random);
  // Never line every card up with its own group.
  if (numbers.every((value, position) => value === groups[position].count)) numbers = [...numbers.slice(1), numbers[0]];
  return { numbers, groups };
}

export type MatchState = { matched: number[]; tried: number[] };
export const emptyMatchState: MatchState = { matched: [], tried: [] };

/**
 * Tries to pair a number card with a group. Each pair's first try is what counts towards scoring;
 * matching an already-matched pair again changes nothing.
 */
export function tryMatch(state: MatchState, number: number, group: MatchGroup): { state: MatchState; correct: boolean; firstAttempt: boolean; counted: boolean } {
  if (state.matched.includes(group.count) || state.matched.includes(number)) return { state, correct: false, firstAttempt: false, counted: false };
  const correct = number === group.count;
  const firstAttempt = !state.tried.includes(group.count);
  return { state: { matched: correct ? [...state.matched, group.count] : state.matched, tried: firstAttempt ? [...state.tried, group.count] : state.tried }, correct, firstAttempt, counted: true };
}

export function isRoundComplete(round: MatchRound, state: MatchState): boolean {
  return round.groups.every((group) => state.matched.includes(group.count));
}

export type FieldItem = { id: string; object: CountObjectId };

/** The challenge's objects (the goal plus a couple spare) mixed with a few other things to skip. */
export function makeChallengeField(challenge: AdventureChallenge, random: () => number = Math.random): FieldItem[] {
  const spare = challenge.goal >= 7 ? 1 : 2;
  const others = shuffle(countObjects.filter((object) => object.id !== challenge.object), random);
  const decoys = Math.min(3, Math.max(2, 12 - challenge.goal - spare));
  const items: FieldItem[] = [
    ...Array.from({ length: challenge.goal + spare }, (_, index): FieldItem => ({ id: `${challenge.object}-${index}`, object: challenge.object })),
    ...Array.from({ length: decoys }, (_, index): FieldItem => ({ id: `decoy-${index}`, object: others[index % others.length].id })),
  ];
  return shuffle(items, random);
}

/** Collects one item; extra taps after the goal, repeated taps, and wrong objects never count. */
export function collectItem(challenge: AdventureChallenge, collected: readonly string[], item: FieldItem): { collected: string[]; result: "collected" | "wrong-object" | "already" | "full" } {
  if (collected.includes(item.id)) return { collected: [...collected], result: "already" };
  if (item.object !== challenge.object) return { collected: [...collected], result: "wrong-object" };
  if (collected.length >= challenge.goal) return { collected: [...collected], result: "full" };
  return { collected: [...collected, item.id], result: "collected" };
}

export function objectHint(challenge: AdventureChallenge, item: FieldItem): string {
  return `That's ${item.object === "apple" ? "an" : "a"} ${getCountObject(item.object).one}. Find the ${getCountObject(challenge.object).many}!`;
}
