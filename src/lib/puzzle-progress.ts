import { markPlayed } from "@/lib/activity";
import { getPuzzle, isPuzzleId, isPuzzleLevel, puzzleLevels, puzzles, type PuzzleLevel } from "@/lib/puzzle-data";

export const PUZZLE_PROGRESS_KEY = "play-learn-puzzle-playground-v1";
export type PuzzleProgress = {
  /** Levels the child has tried. */
  started: PuzzleLevel[];
  /** Each level earns its star the first time any of its puzzles is finished; replaying adds nothing. */
  completed: PuzzleLevel[];
  /** Puzzles finished at least once. */
  solved: string[];
  /** Puzzles played to the end, with the hints asked for along the way. */
  games: number;
  hints: number;
};

export const emptyPuzzleProgress: PuzzleProgress = { started: [], completed: [], solved: [], games: 0, hints: 0 };
const count = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : 0;
const list = <T,>(value: unknown, keep: (item: unknown) => item is T): T[] => Array.isArray(value) ? [...new Set(value.filter(keep))] : [];

export function parsePuzzleProgress(value: unknown): PuzzleProgress {
  if (!value || typeof value !== "object") return emptyPuzzleProgress;
  const item = value as Partial<Record<keyof PuzzleProgress, unknown>>;
  return { started: list(item.started, isPuzzleLevel), completed: list(item.completed, isPuzzleLevel), solved: list(item.solved, isPuzzleId), games: count(item.games), hints: count(item.hints) };
}

export function readPuzzleProgress(): PuzzleProgress {
  if (typeof window === "undefined") return emptyPuzzleProgress;
  try { return parsePuzzleProgress(JSON.parse(window.localStorage.getItem(PUZZLE_PROGRESS_KEY) ?? "null")); }
  catch { return emptyPuzzleProgress; }
}

/** Returns false when the device would not save (private mode, storage full); the game keeps working. */
export function savePuzzleProgress(progress: PuzzleProgress): boolean {
  try { window.localStorage.setItem(PUZZLE_PROGRESS_KEY, JSON.stringify(progress)); markPlayed("puzzle-playground"); return true; }
  catch { return false; }
}

/** Notes that a level was tried; returns the same progress when it already was. */
export function startLevel(progress: PuzzleProgress, level: PuzzleLevel): PuzzleProgress {
  return progress.started.includes(level) ? progress : { ...progress, started: [...progress.started, level] };
}

/** Adds one finished puzzle: its level's star and the puzzle itself only the first time. */
export function recordSolved(progress: PuzzleProgress, puzzleId: string, hints: number): PuzzleProgress {
  const puzzle = getPuzzle(puzzleId);
  if (!puzzle) return progress;
  return {
    ...progress,
    completed: progress.completed.includes(puzzle.level) ? progress.completed : [...progress.completed, puzzle.level],
    solved: progress.solved.includes(puzzleId) ? progress.solved : [...progress.solved, puzzleId],
    games: progress.games + 1,
    hints: progress.hints + Math.max(0, hints),
  };
}

export function starsEarned(progress: PuzzleProgress): number {
  return puzzleLevels.filter((level) => progress.completed.includes(level)).length;
}

/** "Let's Play!" picks the first puzzle not solved yet, or starts the journey again once all are done. */
export function nextPuzzle(progress: PuzzleProgress): string {
  return (puzzles.find((puzzle) => !progress.solved.includes(puzzle.id)) ?? puzzles[0]).id;
}
