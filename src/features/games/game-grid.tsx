import Link from "next/link";
import { games } from "@/lib/games";

/** Every game as a big tappable box, two per row. Stretches to fill its parent's height on phones. */
export function GameGrid({ showModes = false }: { showModes?: boolean }) {
  return <ul className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3 sm:gap-5 md:flex-none">
    {games.map((game, position) => (
      <li key={game.id} className="min-w-0">
        <Link href={game.href} aria-label={`Play ${game.title}`} className="flex h-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-white bg-white p-3 text-center shadow-[0_6px_0_rgba(42,91,145,0.22)] transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink sm:gap-3 sm:p-6">
          <span aria-hidden="true" className={`grid size-[clamp(4.5rem,17dvh,9rem)] shrink-0 place-items-center rounded-full text-[clamp(2.75rem,10dvh,5rem)] leading-none [@media(max-height:700px)]:size-[clamp(3.5rem,13dvh,9rem)] [@media(max-height:700px)]:text-[clamp(2.25rem,8dvh,5rem)] ${game.tint}`}>{game.emoji}</span>
          <span className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-muted-ink">Game {position + 1}</span>
          <span className="flex min-h-[2.5em] items-center text-base font-black leading-tight text-ink sm:min-h-0 sm:text-xl">{game.title}</span>
          <span className="text-xs font-bold text-muted-ink sm:text-sm [@media(max-height:700px)]:hidden">{game.description}</span>
          {showModes ? <span className="flex w-full flex-col gap-1.5 [@media(max-height:700px)]:hidden" aria-label={`${game.modes.length} ways to play`}>{game.modes.map((mode) => <span key={mode.label} className={`flex items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-black sm:text-sm ${mode.soon ? "bg-cream text-muted-ink" : `${game.tint} text-ink`}`}><span aria-hidden="true">{mode.emoji}</span>{mode.label}{mode.soon ? <span className="font-bold"> · soon</span> : null}</span>)}</span> : null}
          <span aria-hidden="true" className="mt-1 inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-sm font-black text-white shadow-[0_3px_0_#22384c]">Play →</span>
        </Link>
      </li>
    ))}
  </ul>;
}
