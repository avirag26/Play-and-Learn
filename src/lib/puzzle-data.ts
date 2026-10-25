export type PuzzleLevel = "little" | "explorer" | "master";
export const puzzleLevels: readonly PuzzleLevel[] = ["little", "explorer", "master"];

export type PuzzleLevelConfig = {
  number: number;
  title: string;
  description: string;
  /** How strongly an empty slot shows what belongs in it. */
  guide: "picture" | "faint" | "outline";
};

// Harder levels add pieces and quieter guides; there are never timers, lives, or penalties.
export const puzzleLevelConfig: Record<PuzzleLevel, PuzzleLevelConfig> = {
  little: { number: 1, title: "Little Builder", description: "2 or 3 big pieces.", guide: "picture" },
  explorer: { number: 2, title: "Puzzle Explorer", description: "4 to 6 pieces.", guide: "faint" },
  master: { number: 3, title: "Puzzle Master", description: "6 to 9 pieces.", guide: "outline" },
};

export type PuzzleArtId = "lion" | "owl" | "apple" | "butterfly" | "fish" | "house" | "garden";

export type Puzzle = {
  id: string;
  name: string;
  level: PuzzleLevel;
  art: PuzzleArtId;
  /** The picture is cut into a grid; cells are numbered left to right, top to bottom. */
  cols: number;
  rows: number;
  /** The cells the child places; every other cell starts on the board. */
  missing: readonly number[];
  /** Said when the puzzle starts. */
  intro: string;
  /** Said when the picture is complete. */
  done: string;
};

export const puzzles: readonly Puzzle[] = [
  { id: "lion", name: "Leo the Lion", level: "little", art: "lion", cols: 2, rows: 2, missing: [1, 2], intro: "Let's finish Leo the lion!", done: "Roar! Leo is all done!" },
  { id: "apple", name: "Happy Apple", level: "little", art: "apple", cols: 2, rows: 2, missing: [0, 3], intro: "Let's finish the happy apple!", done: "Yummy! The apple is all done!" },
  { id: "owl", name: "Ollie the Owl", level: "little", art: "owl", cols: 2, rows: 2, missing: [0, 1, 3], intro: "Let's finish Ollie the owl!", done: "Hoot hoot! Ollie is all done!" },
  { id: "butterfly", name: "Bright Butterfly", level: "explorer", art: "butterfly", cols: 3, rows: 2, missing: [0, 2, 3, 5], intro: "Let's build the butterfly!", done: "The butterfly can fly away!" },
  { id: "fish", name: "Little Fish", level: "explorer", art: "fish", cols: 3, rows: 2, missing: [0, 1, 2, 4, 5], intro: "Let's build the little fish!", done: "Splash! The fish is swimming!" },
  { id: "house", name: "Cosy House", level: "master", art: "house", cols: 3, rows: 3, missing: [0, 1, 2, 3, 5, 6, 7, 8], intro: "Let's build the cosy house!", done: "Welcome home! The house is all done!" },
  { id: "garden", name: "Sunny Garden", level: "master", art: "garden", cols: 3, rows: 3, missing: [0, 1, 2, 3, 4, 5, 6, 7, 8], intro: "Let's build the sunny garden!", done: "What a beautiful garden!" },
];

export function getPuzzle(id: string): Puzzle | undefined { return puzzles.find((puzzle) => puzzle.id === id); }
export function puzzlesIn(level: PuzzleLevel): Puzzle[] { return puzzles.filter((puzzle) => puzzle.level === level); }
const puzzleIds = new Set(puzzles.map((puzzle) => puzzle.id));
export function isPuzzleId(value: unknown): value is string { return typeof value === "string" && puzzleIds.has(value); }
const levelIds = new Set<string>(puzzleLevels);
export function isPuzzleLevel(value: unknown): value is PuzzleLevel { return typeof value === "string" && levelIds.has(value); }

/** Each missing cell becomes a piece with its own stable id, which belongs in the slot of the same cell. */
export const pieceId = (puzzle: Puzzle, cell: number) => `${puzzle.id}-${cell}`;
export const slotId = (cell: number) => `slot-${cell}`;

// Short, kind lines only: a piece in the wrong place is just another try.
export const puzzleLines = {
  welcome: "Think, fit, discover!",
  start: "Let's find the right piece!",
  picked: "Now tap where it fits.",
  wrong: "You're getting closer! Try another spot.",
  oneMore: "One more piece!",
  complete: "You completed the puzzle!",
  hint: "Look for the glowing spot!",
} as const;
export const fitCheers = ["Great fit!", "It fits!", "Well done!", "Super!"];
