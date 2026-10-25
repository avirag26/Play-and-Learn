import { CardBack, CardFace } from "@/features/memory-match/memory-art";
import { getMemoryPicture } from "@/lib/memory-data";
import type { MemoryCard as Card } from "@/lib/memory-game";

/**
 * One card as a real button. Cards that can't be turned right now stay focusable (aria-disabled)
 * so keyboard focus never jumps away mid-game; the game itself ignores those taps.
 */
export function MemoryCard({ card, position, total, canFlip, onFlip }: { card: Card; position: number; total: number; canFlip: boolean; onFlip: (id: string) => void }) {
  const name = getMemoryPicture(card.picture).name;
  const state = card.matched ? `${name}, matched` : card.faceUp ? name : "face down";
  const blocked = !canFlip || card.matched || card.faceUp;
  return <button type="button" onClick={() => onFlip(card.id)} aria-label={`Card ${position + 1} of ${total}: ${state}`} aria-disabled={blocked} data-face-up={card.faceUp}
    className={`memory-card relative block aspect-[4/5] w-full rounded-[1.6rem] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink ${blocked ? "cursor-default" : "cursor-pointer"}`}>
    <span className={`memory-card-inner rounded-[inherit] ${card.matched ? "memory-found" : ""}`}>
      <span className={`memory-card-side rounded-[inherit] shadow-[0_6px_0_rgba(42,91,145,0.22)] transition-transform ${blocked ? "" : "hover:-translate-y-1"}`}><CardBack className="h-full w-full" /></span>
      <span className={`memory-card-side memory-card-front rounded-[inherit] shadow-[0_6px_0_rgba(42,91,145,0.22)] ${card.matched ? "ring-4 ring-[#377a4f]" : ""}`}>
        <CardFace picture={card.picture} className="h-full w-full" />
        {/* A tick as well as the green ring, so a match never relies on color alone. */}
        {card.matched ? <span aria-hidden="true" className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full border-2 border-white bg-[#377a4f] text-sm font-black sm:size-9 sm:text-lg text-white shadow-[0_2px_0_rgba(42,91,145,0.25)]">✓</span> : null}
      </span>
    </span>
  </button>;
}
