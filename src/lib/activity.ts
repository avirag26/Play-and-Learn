export const ACTIVITY_STORAGE_KEY = "play-learn-activity-v1";
export type GameId = "alphabet-adventure" | "animal-safari" | "color-quest" | "count-the-stars" | "shape-safari";
/** When each game last saved new progress, as epoch milliseconds. */
export type LastPlayed = Partial<Record<GameId, number>>;

const gameIds = new Set<string>(["alphabet-adventure", "animal-safari", "color-quest", "count-the-stars", "shape-safari"]);

export function parseLastPlayed(value: unknown): LastPlayed {
  if (!value || typeof value !== "object") return {};
  const result: LastPlayed = {};
  for (const [id, time] of Object.entries(value)) if (gameIds.has(id) && Number.isSafeInteger(time) && (time as number) > 0) result[id as GameId] = time as number;
  return result;
}

export function readLastPlayed(): LastPlayed {
  if (typeof window === "undefined") return {};
  try { return parseLastPlayed(JSON.parse(window.localStorage.getItem(ACTIVITY_STORAGE_KEY) ?? "null")); }
  catch { return {}; }
}

/** Notes that a game just saved progress, for the grown-up "last played" summary. */
export function markPlayed(gameId: GameId, now = Date.now()): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify({ ...readLastPlayed(), [gameId]: now })); }
  catch { /* Storage may be unavailable; the current session still works. */ }
}
