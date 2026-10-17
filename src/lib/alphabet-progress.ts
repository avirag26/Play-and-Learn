import { alphabet } from "@/lib/alphabet-data";

export const ALPHABET_PROGRESS_KEY = "play-learn-alphabet-v1";
export type AlphabetMode = "discover" | "find" | "match";
export type AlphabetProgress = {
  discovered: string[];
  attempted: number;
  correct: number;
  completed: AlphabetMode[];
};

export const emptyAlphabetProgress: AlphabetProgress = { discovered: [], attempted: 0, correct: 0, completed: [] };
const letters = new Set(alphabet.map((item) => item.upper));
const modes = new Set<AlphabetMode>(["discover", "find", "match"]);

export function parseAlphabetProgress(value: unknown): AlphabetProgress {
  if (!value || typeof value !== "object") return emptyAlphabetProgress;
  const item = value as Partial<AlphabetProgress>;
  return {
    discovered: Array.isArray(item.discovered) ? [...new Set(item.discovered.filter((letter): letter is string => typeof letter === "string" && letters.has(letter)))] : [],
    attempted: Number.isSafeInteger(item.attempted) && (item.attempted ?? -1) >= 0 ? item.attempted! : 0,
    correct: Number.isSafeInteger(item.correct) && (item.correct ?? -1) >= 0 ? item.correct! : 0,
    completed: Array.isArray(item.completed) ? [...new Set(item.completed.filter((mode): mode is AlphabetMode => modes.has(mode as AlphabetMode)))] : [],
  };
}

export function readAlphabetProgress(): AlphabetProgress {
  if (typeof window === "undefined") return emptyAlphabetProgress;
  try { return parseAlphabetProgress(JSON.parse(window.localStorage.getItem(ALPHABET_PROGRESS_KEY) ?? "null")); }
  catch { return emptyAlphabetProgress; }
}

export function saveAlphabetProgress(progress: AlphabetProgress): void {
  try { window.localStorage.setItem(ALPHABET_PROGRESS_KEY, JSON.stringify(progress)); }
  catch { /* Storage may be unavailable; the current session still works. */ }
}
