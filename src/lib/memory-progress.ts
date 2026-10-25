import { markPlayed } from "@/lib/activity";
import { isMemoryPictureId, type MemoryPictureId } from "@/lib/memory-data";
import { isMemoryLevel, memoryLevels, type MemoryLevel } from "@/lib/memory-game";

export const MEMORY_PROGRESS_KEY = "play-learn-memory-match-v1";
export type MemoryProgress = {
  started: MemoryLevel[];
  /** Each finished level earns its star once; replaying never adds another. */
  completed: MemoryLevel[];
  /** Pictures matched at least once. */
  found: MemoryPictureId[];
  /** Games played to the end, with their pairs and attempts added up. */
  games: number;
  pairs: number;
  attempts: number;
};

export const emptyMemoryProgress: MemoryProgress = { started: [], completed: [], found: [], games: 0, pairs: 0, attempts: 0 };
const count = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : 0;
const list = <T,>(value: unknown, keep: (item: unknown) => item is T): T[] => Array.isArray(value) ? [...new Set(value.filter(keep))] : [];

export function parseMemoryProgress(value: unknown): MemoryProgress {
  if (!value || typeof value !== "object") return emptyMemoryProgress;
  const item = value as Partial<Record<keyof MemoryProgress, unknown>>;
  const pairs = count(item.pairs);
  return {
    started: list(item.started, isMemoryLevel),
    completed: list(item.completed, isMemoryLevel),
    found: list(item.found, isMemoryPictureId),
    games: count(item.games),
    pairs,
    // Every pair takes at least one attempt.
    attempts: Math.max(count(item.attempts), pairs),
  };
}

export function readMemoryProgress(): MemoryProgress {
  if (typeof window === "undefined") return emptyMemoryProgress;
  try { return parseMemoryProgress(JSON.parse(window.localStorage.getItem(MEMORY_PROGRESS_KEY) ?? "null")); }
  catch { return emptyMemoryProgress; }
}

/** Returns false when the device would not save (private mode, storage full); the game keeps working. */
export function saveMemoryProgress(progress: MemoryProgress): boolean {
  try { window.localStorage.setItem(MEMORY_PROGRESS_KEY, JSON.stringify(progress)); markPlayed("memory-match"); return true; }
  catch { return false; }
}

/** Adds an item to a progress list once; returns the same progress when nothing changes. */
export function withItem<K extends "started" | "completed" | "found">(progress: MemoryProgress, key: K, value: MemoryProgress[K][number]): MemoryProgress {
  const current = progress[key] as readonly unknown[];
  return current.includes(value) ? progress : { ...progress, [key]: [...current, value] };
}

/** Adds one finished game: its level's star (once), its pictures, and its pairs and attempts. */
export function recordGame(progress: MemoryProgress, game: { level: MemoryLevel; pictures: readonly MemoryPictureId[]; pairs: number; attempts: number }): MemoryProgress {
  let next: MemoryProgress = { ...progress, games: progress.games + 1, pairs: progress.pairs + game.pairs, attempts: progress.attempts + Math.max(game.attempts, game.pairs) };
  next = withItem(next, "completed", game.level);
  for (const picture of game.pictures) next = withItem(next, "found", picture);
  return next;
}

/** Stars are the levels finished at least once: one each, three in all. */
export function starsEarned(progress: MemoryProgress): number {
  return memoryLevels.filter((level) => progress.completed.includes(level)).length;
}

/** "Play" picks up at the first level not finished yet, or starts over once all are done. */
export function nextLevel(progress: MemoryProgress): MemoryLevel {
  return memoryLevels.find((level) => !progress.completed.includes(level)) ?? memoryLevels[0];
}
