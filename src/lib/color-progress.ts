import { isColorId, isDetectiveMissionId, type ColorId } from "@/lib/color-data";
import { isPictureId, type PictureId } from "@/lib/coloring-pictures";

export const COLOR_PROGRESS_KEY = "play-learn-color-quest-v1";
export type ColorMode = "meet" | "find" | "paint" | "detective";
export const colorModes: readonly ColorMode[] = ["meet", "find", "paint", "detective"];
export type ColorProgress = {
  started: ColorMode[];
  completed: ColorMode[];
  /** Colors opened in Meet the Colors. */
  discovered: ColorId[];
  attempted: number;
  correct: number;
  /** Pictures fully colored at least once. */
  colored: PictureId[];
  /** Color Detective missions a grown-up marked as done. */
  missions: string[];
};

export const emptyColorProgress: ColorProgress = { started: [], completed: [], discovered: [], attempted: 0, correct: 0, colored: [], missions: [] };
const modes = new Set<string>(colorModes);
const isMode = (value: unknown): value is ColorMode => typeof value === "string" && modes.has(value);
const count = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : 0;
const list = <T,>(value: unknown, keep: (item: unknown) => item is T): T[] => Array.isArray(value) ? [...new Set(value.filter(keep))] : [];

export function parseColorProgress(value: unknown): ColorProgress {
  if (!value || typeof value !== "object") return emptyColorProgress;
  const item = value as Partial<Record<keyof ColorProgress, unknown>>;
  const attempted = count(item.attempted);
  return {
    started: list(item.started, isMode),
    completed: list(item.completed, isMode),
    discovered: list(item.discovered, isColorId),
    attempted,
    correct: Math.min(count(item.correct), attempted),
    colored: list(item.colored, isPictureId),
    missions: list(item.missions, isDetectiveMissionId),
  };
}

export function readColorProgress(): ColorProgress {
  if (typeof window === "undefined") return emptyColorProgress;
  try { return parseColorProgress(JSON.parse(window.localStorage.getItem(COLOR_PROGRESS_KEY) ?? "null")); }
  catch { return emptyColorProgress; }
}

export function saveColorProgress(progress: ColorProgress): void {
  try { window.localStorage.setItem(COLOR_PROGRESS_KEY, JSON.stringify(progress)); }
  catch { /* Storage may be unavailable; the current session still works. */ }
}

/** Adds an item to a progress list once; returns the same progress when nothing changes. */
export function withItem<K extends "started" | "completed" | "discovered" | "colored" | "missions">(progress: ColorProgress, key: K, value: ColorProgress[K][number]): ColorProgress {
  const current = progress[key] as readonly unknown[];
  return current.includes(value) ? progress : { ...progress, [key]: [...current, value] };
}

/** Counts a quiz answer: a question is attempted once (its first try) and is correct at most once. */
export function recordAnswer(progress: ColorProgress, firstAttempt: boolean, correct: boolean): ColorProgress {
  return { ...progress, attempted: progress.attempted + (firstAttempt ? 1 : 0), correct: progress.correct + (correct ? 1 : 0) };
}
