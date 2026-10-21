import { markPlayed } from "@/lib/activity";
import { isChallengeId, isCountingMissionId, isNumber } from "@/lib/count-data";
import { isCountLevel, nextLevel, RECENT_WINDOW, type CountLevel } from "@/lib/count-questions";

export const COUNT_PROGRESS_KEY = "play-learn-count-stars-v1";
export type CountMode = "meet" | "count" | "match" | "adventure";
export const countModes: readonly CountMode[] = ["meet", "count", "match", "adventure"];
export type CountProgress = {
  started: CountMode[];
  completed: CountMode[];
  /** Numbers opened in Meet the Numbers. */
  met: number[];
  attempted: number;
  correct: number;
  /** Number Adventure challenges finished. */
  challenges: string[];
  /** Real-world counting missions a grown-up marked as done. */
  missions: string[];
  /** Current difficulty, and the latest first-try results that move it. */
  level: CountLevel;
  recent: boolean[];
};

export const emptyCountProgress: CountProgress = { started: [], completed: [], met: [], attempted: 0, correct: 0, challenges: [], missions: [], level: 1, recent: [] };
const modes = new Set<string>(countModes);
const isMode = (value: unknown): value is CountMode => typeof value === "string" && modes.has(value);
const count = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : 0;
const list = <T,>(value: unknown, keep: (item: unknown) => item is T): T[] => Array.isArray(value) ? [...new Set(value.filter(keep))] : [];

export function parseCountProgress(value: unknown): CountProgress {
  if (!value || typeof value !== "object") return emptyCountProgress;
  const item = value as Partial<Record<keyof CountProgress, unknown>>;
  const attempted = count(item.attempted);
  return {
    started: list(item.started, isMode),
    completed: list(item.completed, isMode),
    met: list(item.met, isNumber).sort((a, b) => a - b),
    attempted,
    correct: Math.min(count(item.correct), attempted),
    challenges: list(item.challenges, isChallengeId),
    missions: list(item.missions, isCountingMissionId),
    level: isCountLevel(item.level) ? item.level : 1,
    recent: Array.isArray(item.recent) ? item.recent.filter((entry): entry is boolean => typeof entry === "boolean").slice(-RECENT_WINDOW) : [],
  };
}

export function readCountProgress(): CountProgress {
  if (typeof window === "undefined") return emptyCountProgress;
  try { return parseCountProgress(JSON.parse(window.localStorage.getItem(COUNT_PROGRESS_KEY) ?? "null")); }
  catch { return emptyCountProgress; }
}

export function saveCountProgress(progress: CountProgress): void {
  try { window.localStorage.setItem(COUNT_PROGRESS_KEY, JSON.stringify(progress)); markPlayed("count-the-stars"); }
  catch { /* Storage may be unavailable; the current session still works. */ }
}

/** Adds an item to a progress list once; returns the same progress when nothing changes. */
export function withItem<K extends "started" | "completed" | "met" | "challenges" | "missions">(progress: CountProgress, key: K, value: CountProgress[K][number]): CountProgress {
  const current = progress[key] as readonly unknown[];
  return current.includes(value) ? progress : { ...progress, [key]: [...current, value] };
}

export function withoutItem(progress: CountProgress, key: "missions", value: string): CountProgress {
  return progress[key].includes(value) ? { ...progress, [key]: progress[key].filter((item) => item !== value) } : progress;
}

/** A question is attempted once (its first try) and correct at most once; first tries feed difficulty. */
export function recordAnswer(progress: CountProgress, firstAttempt: boolean, correct: boolean): CountProgress {
  return {
    ...progress,
    attempted: progress.attempted + (firstAttempt ? 1 : 0),
    correct: progress.correct + (correct ? 1 : 0),
    recent: firstAttempt ? [...progress.recent, correct].slice(-RECENT_WINDOW) : progress.recent,
  };
}

/** After a round: move the level if recent answers suggest it, starting fresh at the new level. */
export function adaptLevel(progress: CountProgress): { progress: CountProgress; change: "up" | "down" | null } {
  const level = nextLevel(progress.level, progress.recent);
  if (level === progress.level) return { progress, change: null };
  return { progress: { ...progress, level, recent: [] }, change: level > progress.level ? "up" : "down" };
}

/** A grown-up (or the child) picks the numbers to play with. */
export function chooseLevel(progress: CountProgress, level: CountLevel): CountProgress {
  return level === progress.level ? progress : { ...progress, level, recent: [] };
}
