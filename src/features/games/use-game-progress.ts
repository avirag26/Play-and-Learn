"use client";

import { useCallback, useEffect, useState } from "react";

type SavedProgress = { completedGames: string[]; stars: number };
const STORAGE_KEY = "play-learn-progress-v1";
const emptyProgress: SavedProgress = { completedGames: [], stars: 0 };

function parseSavedProgress(value: unknown): SavedProgress {
  if (!value || typeof value !== "object") return emptyProgress;
  const candidate = value as Partial<SavedProgress>;
  return {
    completedGames: Array.isArray(candidate.completedGames) ? candidate.completedGames.filter((item): item is string => typeof item === "string") : [],
    stars: typeof candidate.stars === "number" && Number.isFinite(candidate.stars) && candidate.stars >= 0 ? candidate.stars : 0,
  };
}

export function useGameProgress(gameId: string) {
  const [saved, setSaved] = useState<SavedProgress>(emptyProgress);
  useEffect(() => { const timer = window.setTimeout(() => { try { const value = window.localStorage.getItem(STORAGE_KEY); if (value) setSaved(parseSavedProgress(JSON.parse(value))); } catch { /* local storage may be blocked */ } }, 0); return () => window.clearTimeout(timer); }, []);
  const recordCompletion = useCallback((stars: number) => { setSaved((previous) => { const alreadyCompleted = previous.completedGames.includes(gameId); const next = { completedGames: alreadyCompleted ? previous.completedGames : [...previous.completedGames, gameId], stars: alreadyCompleted ? previous.stars : previous.stars + stars }; try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* local storage may be blocked */ } return next; }); }, [gameId]);
  return { saved, recordCompletion };
}
