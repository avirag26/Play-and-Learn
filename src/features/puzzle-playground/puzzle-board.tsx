"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { PuzzleArt } from "@/features/puzzle-playground/puzzle-art";
import { slotId, type Puzzle, type PuzzleLevelConfig } from "@/lib/puzzle-data";
import type { PuzzlePiece, PuzzleState } from "@/lib/puzzle-game";

/** One cell of the picture: the whole drawing, shifted so only this cell shows. Pieces always match their slot. */
export function ArtCell({ puzzle, cell, className = "", style }: { puzzle: Puzzle; cell: number; className?: string; style?: CSSProperties }) {
  const col = cell % puzzle.cols;
  const row = Math.floor(cell / puzzle.cols);
  return <span aria-hidden="true" className={`relative block overflow-hidden ${className}`} style={style}>
    <span className="absolute block" style={{ width: `${puzzle.cols * 100}%`, height: `${puzzle.rows * 100}%`, left: `${-col * 100}%`, top: `${-row * 100}%` }}><PuzzleArt art={puzzle.art} /></span>
  </span>;
}

// Each picture is as wide as the screen allows while the board and tray both fit above the feedback bubble.
const boardWidth: Record<string, string> = {
  "2x2": "w-[min(100%,36dvh,21rem)]",
  "3x2": "w-[min(100%,44dvh,30rem)]",
  "3x3": "w-[min(100%,33dvh,25rem)]",
};
const pieceSize: Record<string, string> = {
  "2x2": "w-24 sm:w-28",
  "3x2": "w-16 sm:w-24",
  "3x3": "w-14 sm:w-20",
};

/** Movement (in px) after which a press becomes a drag instead of a tap. */
const DRAG_START = 8;

type Props = {
  puzzle: Puzzle;
  state: PuzzleState;
  guide: PuzzleLevelConfig["guide"];
  /** The slot that just turned a piece away (it wiggles), and the one that just took a piece (it pops). */
  wrongSlot: string | null;
  fittedSlot: string | null;
  onSelect: (pieceId: string | null) => void;
  onPlace: (pieceId: string, slotId: string) => void;
};

/** The picture with its empty spots, and the tray of pieces to fit into them. */
export function PuzzleBoard({ puzzle, state, guide, wrongSlot, fittedSlot, onSelect, onPlace }: Props) {
  const shape = `${puzzle.cols}x${puzzle.rows}`;
  const missing = new Set(puzzle.missing);
  const waiting = state.tray.filter((piece) => !Object.values(state.placed).includes(piece.id));
  const ghost = useRef<HTMLSpanElement>(null);
  const press = useRef<{ piece: PuzzlePiece; x: number; y: number; dragging: boolean } | null>(null);
  // The click that follows a drag must not also count as a tap.
  const swallowClick = useRef(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const slotAt = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>("[data-slot]")?.dataset.slot ?? null;
  const moveGhost = (x: number, y: number) => { if (ghost.current) ghost.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(1.08)`; };

  function down(event: PointerEvent<HTMLButtonElement>, piece: PuzzlePiece) {
    if (event.button !== 0 || state.status === "complete") return;
    press.current = { piece, x: event.clientX, y: event.clientY, dragging: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const current = press.current;
    if (!current) return;
    if (!current.dragging) {
      if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < DRAG_START) return;
      current.dragging = true;
      setDragging(current.piece.id);
      if (state.selected !== current.piece.id) onSelect(current.piece.id);
    }
    moveGhost(event.clientX, event.clientY);
    const slot = slotAt(event.clientX, event.clientY);
    setOver((previous) => previous === slot ? previous : slot);
  }

  function up(event: PointerEvent<HTMLButtonElement>) {
    const current = press.current;
    press.current = null;
    if (!current?.dragging) return;
    swallowClick.current = true;
    setDragging(null);
    setOver(null);
    const slot = slotAt(event.clientX, event.clientY);
    if (slot) onPlace(current.piece.id, slot);
  }

  function cancel() {
    press.current = null;
    setDragging(null);
    setOver(null);
  }

  function tapPiece(piece: PuzzlePiece) {
    if (swallowClick.current) { swallowClick.current = false; return; }
    onSelect(piece.id);
  }

  const draggingPiece = waiting.find((piece) => piece.id === dragging);
  return <div className="flex flex-col items-center gap-3 sm:gap-5">
    <div className={`grid overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-[0_6px_0_rgba(42,91,145,0.2)] ${boardWidth[shape]}`} style={{ gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))`, aspectRatio: `${puzzle.cols} / ${puzzle.rows}` }}>
      {Array.from({ length: puzzle.cols * puzzle.rows }, (_, cell) => {
        const id = slotId(cell);
        if (!missing.has(cell)) return <ArtCell key={id} puzzle={puzzle} cell={cell} className="h-full w-full" />;
        const filled = id in state.placed;
        const hinted = state.hinted === id;
        const target = over === id || hinted;
        const label = filled ? `Spot ${cell + 1}, filled` : state.selected ? `Spot ${cell + 1}, empty. Place the piece here` : `Spot ${cell + 1}, empty`;
        return <button key={id} type="button" data-slot={id} aria-label={label} aria-disabled={filled} onClick={() => { if (!filled && state.selected) onPlace(state.selected, id); }}
          className={`relative block h-full w-full focus-visible:z-10 focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-ink ${filled ? "cursor-default" : "cursor-pointer"} ${wrongSlot === id ? "puzzle-wiggle" : ""}`}>
          {filled ? <ArtCell puzzle={puzzle} cell={cell} className={`h-full w-full ${fittedSlot === id ? "puzzle-snap" : ""}`} />
            : <span className={`absolute inset-[3px] block rounded-xl border-[3px] border-dashed ${target ? "border-ink bg-sunshine/50" : "border-ink/35 bg-cream"} ${hinted ? "puzzle-glow" : ""}`}>
              {guide !== "outline" ? <ArtCell puzzle={puzzle} cell={cell} className={`h-full w-full rounded-[0.6rem] ${guide === "picture" ? "opacity-35" : "opacity-[0.12]"} grayscale-[40%]`} /> : null}
              {hinted ? <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-3xl">✨</span> : null}
            </span>}
        </button>;
      })}
    </div>

    <div role="group" aria-label="Puzzle pieces" className="flex min-h-14 flex-wrap justify-center gap-2 sm:gap-3">{waiting.map((piece, index) => {
      const selected = state.selected === piece.id;
      return <button key={piece.id} type="button" data-piece={piece.id} aria-label={`Piece ${index + 1}${selected ? ", picked up" : ""}`} aria-pressed={selected}
        onPointerDown={(event) => down(event, piece)} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={cancel} onClick={() => tapPiece(piece)}
        className={`relative block aspect-square touch-none select-none rounded-2xl border-4 bg-white p-0.5 shadow-[0_5px_0_rgba(42,91,145,0.22)] transition-transform focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink ${pieceSize[shape]} ${selected ? "-translate-y-1.5 border-ink ring-4 ring-sunshine" : "border-white hover:-translate-y-1"} ${dragging === piece.id ? "opacity-30" : ""}`}>
        <ArtCell puzzle={puzzle} cell={piece.cell} className="h-full w-full rounded-xl" />
        {selected ? <span aria-hidden="true" className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full border-2 border-white bg-ink text-sm text-white">✋</span> : null}
      </button>;
    })}</div>

    {/* The piece under the finger while dragging; it never catches pointer events. */}
    {draggingPiece ? <span ref={ghost} aria-hidden="true" className={`pointer-events-none fixed left-0 top-0 z-50 block aspect-square rounded-2xl border-4 border-ink bg-white p-0.5 shadow-[0_12px_24px_rgba(30,40,90,0.35)] ${pieceSize[shape]}`} style={{ transform: "translate(-200px, -200px)" }}><ArtCell puzzle={puzzle} cell={draggingPiece.cell} className="h-full w-full rounded-xl" /></span> : null}
  </div>;
}
