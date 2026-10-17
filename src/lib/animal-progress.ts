import { markPlayed } from "@/lib/activity";
import { isAnimalId, type AnimalId } from "@/lib/animal-data";

export const ANIMAL_PROGRESS_KEY = "play-learn-animal-safari-v1";
export type AnimalMode = "meet" | "sound" | "find";
export type AnimalProgress = {
  discovered: AnimalId[];
  attempted: number;
  correct: number;
  completed: AnimalMode[];
};

export const emptyAnimalProgress: AnimalProgress = { discovered: [], attempted: 0, correct: 0, completed: [] };
const modes = new Set<AnimalMode>(["meet", "sound", "find"]);
const count = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : 0;

export function parseAnimalProgress(value: unknown): AnimalProgress {
  if (!value || typeof value !== "object") return emptyAnimalProgress;
  const item = value as Partial<Record<keyof AnimalProgress, unknown>>;
  return {
    discovered: Array.isArray(item.discovered) ? [...new Set(item.discovered.filter(isAnimalId))] : [],
    attempted: count(item.attempted),
    correct: count(item.correct),
    completed: Array.isArray(item.completed) ? [...new Set(item.completed.filter((mode): mode is AnimalMode => modes.has(mode as AnimalMode)))] : [],
  };
}

export function readAnimalProgress(): AnimalProgress {
  if (typeof window === "undefined") return emptyAnimalProgress;
  try { return parseAnimalProgress(JSON.parse(window.localStorage.getItem(ANIMAL_PROGRESS_KEY) ?? "null")); }
  catch { return emptyAnimalProgress; }
}

export function saveAnimalProgress(progress: AnimalProgress): void {
  try { window.localStorage.setItem(ANIMAL_PROGRESS_KEY, JSON.stringify(progress)); markPlayed("animal-safari"); }
  catch { /* Storage may be unavailable; the current session still works. */ }
}
