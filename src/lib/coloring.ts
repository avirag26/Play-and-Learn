import type { ColorId } from "@/lib/color-data";
import type { ColoringPicture } from "@/lib/coloring-pictures";

export type Fills = Readonly<Record<string, ColorId>>;
/** The current fills plus earlier versions for Undo. */
export type ColoringState = { fills: Fills; history: readonly Fills[] };

export const emptyColoring: ColoringState = { fills: {}, history: [] };
export const MAX_UNDO = 50;

function remember(state: ColoringState, fills: Fills): ColoringState {
  return { fills, history: [...state.history, state.fills].slice(-MAX_UNDO) };
}

/** Paints one region. Unknown regions and repainting the same color change nothing (and add no undo step). */
export function fillRegion(state: ColoringState, picture: ColoringPicture, regionId: string, color: ColorId): ColoringState {
  if (!picture.regions.some((region) => region.id === regionId) || state.fills[regionId] === color) return state;
  return remember(state, { ...state.fills, [regionId]: color });
}

export function undoColoring(state: ColoringState): ColoringState {
  if (state.history.length === 0) return state;
  return { fills: state.history[state.history.length - 1], history: state.history.slice(0, -1) };
}

/** Clears the picture. Undo brings the colors back, so a mistaken tap is never a loss. */
export function resetColoring(state: ColoringState): ColoringState {
  return Object.keys(state.fills).length === 0 ? state : remember(state, {});
}

export function isPictureComplete(picture: ColoringPicture, fills: Fills): boolean {
  return picture.regions.every((region) => Boolean(fills[region.id]));
}

export function coloredCount(picture: ColoringPicture, fills: Fills): number {
  return picture.regions.filter((region) => Boolean(fills[region.id])).length;
}
