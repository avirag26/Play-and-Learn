import { markPlayed } from "@/lib/activity";
import { isSafariObjectId, isShapeId, type SafariObjectId, type ShapeId } from "@/lib/shape-data";

export const SHAPE_PROGRESS_KEY = "play-learn-shape-safari-v1";
export type ShapeLevel = "meet" | "match" | "safari";
export const shapeLevels: readonly ShapeLevel[] = ["meet", "match", "safari"];
export type ShapeProgress = {
  started: ShapeLevel[];
  /** Each finished level earns its star once; replaying never adds another. */
  completed: ShapeLevel[];
  /** Shapes seen in Meet the Shapes. */
  met: ShapeId[];
  /** Objects named correctly in Shape Safari. */
  spotted: SafariObjectId[];
  /** Questions answered (counted on their first try), and how many were right. */
  attempted: number;
  correct: number;
  /** Every tap on an answer, retries included. */
  tries: number;
};

export const emptyShapeProgress: ShapeProgress = { started: [], completed: [], met: [], spotted: [], attempted: 0, correct: 0, tries: 0 };
const levels = new Set<string>(shapeLevels);
const isLevel = (value: unknown): value is ShapeLevel => typeof value === "string" && levels.has(value);
const count = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : 0;
const list = <T,>(value: unknown, keep: (item: unknown) => item is T): T[] => Array.isArray(value) ? [...new Set(value.filter(keep))] : [];

export function parseShapeProgress(value: unknown): ShapeProgress {
  if (!value || typeof value !== "object") return emptyShapeProgress;
  const item = value as Partial<Record<keyof ShapeProgress, unknown>>;
  const attempted = count(item.attempted);
  return {
    started: list(item.started, isLevel),
    completed: list(item.completed, isLevel),
    met: list(item.met, isShapeId),
    spotted: list(item.spotted, isSafariObjectId),
    attempted,
    correct: Math.min(count(item.correct), attempted),
    tries: Math.max(count(item.tries), attempted),
  };
}

export function readShapeProgress(): ShapeProgress {
  if (typeof window === "undefined") return emptyShapeProgress;
  try { return parseShapeProgress(JSON.parse(window.localStorage.getItem(SHAPE_PROGRESS_KEY) ?? "null")); }
  catch { return emptyShapeProgress; }
}

/** Returns false when the device would not save (private mode, storage full); the game keeps working. */
export function saveShapeProgress(progress: ShapeProgress): boolean {
  try { window.localStorage.setItem(SHAPE_PROGRESS_KEY, JSON.stringify(progress)); markPlayed("shape-safari"); return true; }
  catch { return false; }
}

/** Adds an item to a progress list once; returns the same progress when nothing changes. */
export function withItem<K extends "started" | "completed" | "met" | "spotted">(progress: ShapeProgress, key: K, value: ShapeProgress[K][number]): ShapeProgress {
  const current = progress[key] as readonly unknown[];
  return current.includes(value) ? progress : { ...progress, [key]: [...current, value] };
}

/** Every tap is a try; a question is attempted once (its first try) and correct at most once. */
export function recordAnswer(progress: ShapeProgress, firstAttempt: boolean, correct: boolean): ShapeProgress {
  return {
    ...progress,
    tries: progress.tries + 1,
    attempted: progress.attempted + (firstAttempt ? 1 : 0),
    correct: progress.correct + (correct && firstAttempt ? 1 : 0),
  };
}

/** Stars are the levels finished at least once: one each, three in all. */
export function starsEarned(progress: ShapeProgress): number {
  return shapeLevels.filter((level) => progress.completed.includes(level)).length;
}

/** "Let's Play!" picks up at the first level not finished yet, or starts over once all are done. */
export function nextLevel(progress: ShapeProgress): ShapeLevel {
  return shapeLevels.find((level) => !progress.completed.includes(level)) ?? shapeLevels[0];
}
