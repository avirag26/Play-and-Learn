import { memoryPictures, type MemoryPictureId } from "@/lib/memory-data";
import { shuffle } from "@/lib/random";

export type MemoryLevel = "little" | "curious" | "master";
export const memoryLevels: readonly MemoryLevel[] = ["little", "curious", "master"];

export type MemoryLevelConfig = {
  number: number;
  title: string;
  description: string;
  pairs: number;
  /** Fixed pictures, or null to pick `pairs` different pictures for every game. */
  pictures: readonly MemoryPictureId[] | null;
  /** How long every card is shown face up before the game starts. */
  previewMs: number;
  /** Never deal a pair side by side, so the child has to remember where each one was. */
  spreadPairs: boolean;
};

// Harder levels only add cards: there are no timers, lives, or penalties.
export const memoryLevelConfig: Record<MemoryLevel, MemoryLevelConfig> = {
  little: { number: 1, title: "Little Explorer", description: "Find 2 pairs.", pairs: 2, pictures: ["apple", "lion"], previewMs: 2500, spreadPairs: false },
  curious: { number: 2, title: "Curious Explorer", description: "Find 3 pairs.", pairs: 3, pictures: ["apple", "lion", "star"], previewMs: 3000, spreadPairs: false },
  master: { number: 3, title: "Memory Master", description: "Find 4 pairs.", pairs: 4, pictures: null, previewMs: 3500, spreadPairs: true },
};

/** How long two different cards stay face up before turning back over. */
export const MISMATCH_DELAY_MS = 1300;

const levelIds = new Set<string>(memoryLevels);
export function isMemoryLevel(value: unknown): value is MemoryLevel { return typeof value === "string" && levelIds.has(value); }

/** One card on the table. Its two copies share `picture` but each has its own `id`. */
export type MemoryCard = { id: string; picture: MemoryPictureId; faceUp: boolean; matched: boolean };

/**
 * preview: every card is shown face up for a moment; taps are ignored.
 * playing: the child may turn over a face-down card.
 * checking: two different pictures are showing; taps are ignored until they turn back.
 * complete: every pair is found.
 */
export type MemoryStatus = "preview" | "playing" | "checking" | "complete";

export type MemoryState = {
  level: MemoryLevel;
  /** Changes with every deal, so a timer from an earlier game never touches a new one. */
  round: number;
  cards: MemoryCard[];
  first: string | null;
  second: string | null;
  pairsFound: number;
  /** Each time two cards are turned over counts as one attempt. */
  attempts: number;
  status: MemoryStatus;
  /** What the last attempt turned up, for the feedback bubble. */
  lastResult: { kind: "match"; picture: MemoryPictureId } | { kind: "miss" } | null;
};

export type MemoryAction =
  | { type: "deal"; level: MemoryLevel; round: number; cards: readonly MemoryCard[] }
  | { type: "hide"; round: number }
  | { type: "flip"; id: string }
  | { type: "resolve"; round: number };

/** The pictures for one game: the level's own, or a fresh mix for Memory Master. */
export function pickPictures(level: MemoryLevel, random: () => number = Math.random): MemoryPictureId[] {
  const config = memoryLevelConfig[level];
  return config.pictures ? [...config.pictures] : shuffle(memoryPictures, random).slice(0, config.pairs).map((picture) => picture.id);
}

function hasNeighbourPair(cards: readonly MemoryCard[]): boolean {
  return cards.some((card, index) => index > 0 && cards[index - 1].picture === card.picture);
}

const sameLayout = (cards: readonly MemoryCard[], previous: readonly MemoryCard[]) => cards.length === previous.length && cards.every((card, index) => card.picture === previous[index].picture);

/**
 * Shuffles two copies of each picture. A replay never repeats the layout just played, and
 * Memory Master never puts a pair side by side.
 */
export function dealCards(level: MemoryLevel, random: () => number = Math.random, previous: readonly MemoryCard[] = []): MemoryCard[] {
  const pictures = pickPictures(level, random);
  const pack = pictures.flatMap((picture) => [1, 2].map((copy) => ({ id: `${picture}-${copy}`, picture, faceUp: false, matched: false })));
  let cards = shuffle(pack, random);
  for (let tries = 0; tries < 50 && (sameLayout(cards, previous) || (memoryLevelConfig[level].spreadPairs && hasNeighbourPair(cards))); tries++) cards = shuffle(pack, random);
  return cards;
}

export function totalPairs(state: Pick<MemoryState, "cards">): number {
  return state.cards.length / 2;
}

/**
 * The whole game as one pure function: every tap, timer, and restart goes through here, so a
 * double tap, a tap on a matched card, or a late timer simply returns the same state.
 */
export function memoryReducer(state: MemoryState, action: MemoryAction): MemoryState {
  switch (action.type) {
    case "deal":
      return { level: action.level, round: action.round, cards: action.cards.map((card) => ({ ...card, faceUp: true, matched: false })), first: null, second: null, pairsFound: 0, attempts: 0, status: "preview", lastResult: null };
    case "hide":
      if (state.status !== "preview" || action.round !== state.round) return state;
      return { ...state, status: "playing", cards: state.cards.map((card) => card.faceUp ? { ...card, faceUp: false } : card) };
    case "resolve":
      if (state.status !== "checking" || action.round !== state.round) return state;
      return { ...state, status: "playing", first: null, second: null, cards: state.cards.map((card) => card.id === state.first || card.id === state.second ? { ...card, faceUp: false } : card) };
    case "flip": {
      if (state.status !== "playing") return state;
      const card = state.cards.find((item) => item.id === action.id);
      // A matched card, or the card already turned over, can't be picked again.
      if (!card || card.matched || card.faceUp) return state;
      const turned = state.cards.map((item) => item.id === card.id ? { ...item, faceUp: true } : item);
      if (state.first === null) return { ...state, cards: turned, first: card.id };
      const first = state.cards.find((item) => item.id === state.first);
      const attempts = state.attempts + 1;
      if (first && first.id !== card.id && first.picture === card.picture) {
        const pairsFound = state.pairsFound + 1;
        return { ...state, cards: turned.map((item) => item.id === first.id || item.id === card.id ? { ...item, matched: true } : item), first: null, second: null, attempts, pairsFound, status: pairsFound === totalPairs(state) ? "complete" : "playing", lastResult: { kind: "match", picture: card.picture } };
      }
      return { ...state, cards: turned, second: card.id, attempts, status: "checking", lastResult: { kind: "miss" } };
    }
  }
}

/** The state before the first deal; it has no cards, so every tap is ignored. */
export function emptyMemoryState(level: MemoryLevel = "little"): MemoryState {
  return { level, round: 0, cards: [], first: null, second: null, pairsFound: 0, attempts: 0, status: "preview", lastResult: null };
}

/** Grid columns that keep the cards big: 2×2, 3×2, and 4×2. */
export function boardColumns(level: MemoryLevel): number {
  return Math.min(memoryLevelConfig[level].pairs, 4);
}
