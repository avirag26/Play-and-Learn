import { pieceId, slotId, type Puzzle } from "@/lib/puzzle-data";
import { shuffle } from "@/lib/random";

/** A piece the child can place; `cell` is where it belongs in the picture. */
export type PuzzlePiece = { id: string; cell: number };

export type PuzzleState = {
  puzzleId: string;
  /** Changes with every new game, so a timer from an earlier game never touches this one. */
  round: number;
  /** The pieces in the tray, in the order shown. Placed pieces stay listed (and show as placed). */
  tray: PuzzlePiece[];
  /** slot id → piece id, for the missing cells filled so far. */
  placed: Record<string, string>;
  selected: string | null;
  /** Wrong tries and hints asked for: kept for the grown-up report, never shown as a score. */
  tries: number;
  hints: number;
  /** The slot glowing after a hint, if any. */
  hinted: string | null;
  status: "playing" | "complete";
};

export type PuzzleAction =
  | { type: "start"; round: number; puzzleId: string; tray: readonly PuzzlePiece[] }
  | { type: "select"; pieceId: string | null }
  | { type: "place"; pieceId: string; slotId: string }
  | { type: "hint" }
  | { type: "clear-hint"; round: number };

/** What a place action did, so the screen can cheer or encourage. */
export type PlaceResult = "placed" | "complete" | "wrong" | "ignored";

/** The missing pieces, shuffled so the tray never simply matches the board's order. */
export function makeTray(puzzle: Puzzle, random: () => number = Math.random): PuzzlePiece[] {
  const pieces = puzzle.missing.map((cell) => ({ id: pieceId(puzzle, cell), cell }));
  let tray = shuffle(pieces, random);
  for (let tries = 0; tries < 20 && pieces.length > 1 && tray.every((piece, index) => piece.cell === pieces[index].cell); tries++) tray = shuffle(pieces, random);
  return tray;
}

export function emptyPuzzleState(): PuzzleState {
  return { puzzleId: "", round: 0, tray: [], placed: {}, selected: null, tries: 0, hints: 0, hinted: null, status: "playing" };
}

const isPlaced = (state: PuzzleState, piece: string) => Object.values(state.placed).includes(piece);

/** Whether `slot` is one of this puzzle's missing cells and still empty. */
function openSlot(state: PuzzleState, slot: string): boolean {
  return state.tray.some((piece) => slotId(piece.cell) === slot) && !(slot in state.placed);
}

/** The piece a hint should point at: the selected one, or the first still in the tray. */
export function hintPiece(state: PuzzleState): PuzzlePiece | undefined {
  const waiting = state.tray.filter((piece) => !isPlaced(state, piece.id));
  return waiting.find((piece) => piece.id === state.selected) ?? waiting[0];
}

/**
 * The whole puzzle as one pure function. A piece fits only in the slot of its own cell, so the answer
 * never depends on where things happen to be on the screen; anything else returns the same state.
 */
export function puzzleReducer(state: PuzzleState, action: PuzzleAction): PuzzleState {
  switch (action.type) {
    case "start":
      return { ...emptyPuzzleState(), puzzleId: action.puzzleId, round: action.round, tray: [...action.tray] };
    case "select": {
      if (state.status === "complete") return state;
      if (action.pieceId !== null && (!state.tray.some((piece) => piece.id === action.pieceId) || isPlaced(state, action.pieceId))) return state;
      // Tapping the selected piece again puts it back down.
      const selected = action.pieceId === state.selected ? null : action.pieceId;
      return selected === state.selected ? state : { ...state, selected };
    }
    case "place": {
      if (state.status === "complete") return state;
      const piece = state.tray.find((item) => item.id === action.pieceId);
      if (!piece || isPlaced(state, piece.id) || !openSlot(state, action.slotId)) return state;
      if (slotId(piece.cell) !== action.slotId) return { ...state, selected: piece.id, tries: state.tries + 1 };
      const placed = { ...state.placed, [action.slotId]: piece.id };
      const complete = Object.keys(placed).length === state.tray.length;
      return { ...state, placed, selected: null, hinted: state.hinted === action.slotId ? null : state.hinted, status: complete ? "complete" : "playing" };
    }
    case "hint": {
      const piece = state.status === "playing" ? hintPiece(state) : undefined;
      if (!piece) return state;
      return { ...state, selected: piece.id, hinted: slotId(piece.cell), hints: state.hints + 1 };
    }
    case "clear-hint":
      return action.round === state.round && state.hinted ? { ...state, hinted: null } : state;
  }
}

/** What happened when a piece was dropped or tapped onto a slot. */
export function placeResult(before: PuzzleState, after: PuzzleState): PlaceResult {
  if (after === before) return "ignored";
  if (after.status === "complete" && before.status !== "complete") return "complete";
  if (Object.keys(after.placed).length > Object.keys(before.placed).length) return "placed";
  return after.tries > before.tries ? "wrong" : "ignored";
}

export function piecesLeft(state: PuzzleState): number {
  return state.tray.length - Object.keys(state.placed).length;
}
