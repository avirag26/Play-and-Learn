"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Padlock } from "@/components/ui/padlock";
import { games } from "@/lib/games";
import { hasPremium, isGameLocked, isUnlockNew, markUnlockSeen, usePremium } from "@/lib/premium";

/**
 * Every game as a big tappable box. Phones show one wide row per game so three or more games still fit
 * between the header and the bottom menu; tablets and desktops show tall cards, three per row.
 * Stretches to fill its parent's height on phones.
 */
export function GameGrid({ showModes = false }: { showModes?: boolean }) {
  const { entitlement, now } = usePremium();
  // Just bought Premium: pop the locks open the first time the games are shown.
  const premiumUntil = entitlement && hasPremium(entitlement, now) ? entitlement.premiumUntil : null;
  const celebrate = useMemo(() => premiumUntil !== null && isUnlockNew(premiumUntil), [premiumUntil]);
  useEffect(() => { if (celebrate && premiumUntil) markUnlockSeen(premiumUntil); }, [celebrate, premiumUntil]);
  return <ul className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-3 sm:gap-5 md:flex-none md:grid-cols-2 lg:grid-cols-3">
    {games.map((game, position) => (
      <li key={game.id} className="min-w-0">
        <Link href={game.href} aria-label={`Play ${game.title}${isGameLocked(entitlement, game.id, now) ? " (Premium, locked)" : entitlement?.premiumGameIds.includes(game.id) ? " (Premium)" : ""}`} className="flex h-full items-center gap-3 rounded-3xl border-2 border-white bg-white p-3 text-left shadow-[0_6px_0_rgba(42,91,145,0.22)] transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink sm:gap-4 sm:p-5 md:flex-col md:justify-center md:gap-3 md:p-6 md:text-center">
          <span aria-hidden="true" className={`relative grid size-[clamp(3rem,7.5dvh,6rem)] shrink-0 place-items-center rounded-full text-[clamp(1.75rem,5dvh,3.75rem)] leading-none md:size-[clamp(4.5rem,17dvh,9rem)] md:text-[clamp(2.75rem,10dvh,5rem)] ${game.tint}`}>{game.emoji}{entitlement?.premiumGameIds.includes(game.id) ? <span className="absolute -bottom-1 -right-1 grid size-[45%] min-h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-white p-[8%] text-base shadow-[0_2px_0_rgba(42,91,145,0.25)]"><Padlock locked={isGameLocked(entitlement, game.id, now)} celebrate={celebrate} delay={500 + position * 250} className="size-full" /></span> : null}</span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-none md:items-center md:gap-2">
            <span className="flex flex-wrap items-center gap-1.5 md:justify-center"><span className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-muted-ink">Game {position + 1}</span>{entitlement?.premiumGameIds.includes(game.id) ? <span className="inline-flex items-center gap-1 rounded-full bg-sunshine px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-[0.12em] text-ink"><span aria-hidden="true">⭐</span>{isGameLocked(entitlement, game.id, now) ? "Premium" : "Unlocked"}</span> : null}</span>
            <span className="text-base font-black leading-tight text-ink sm:text-xl">{game.title}</span>
            <span className="text-xs font-bold text-muted-ink sm:text-sm max-md:[@media(max-height:860px)]:hidden [@media(max-height:700px)]:hidden">{game.description}</span>
            {showModes ? <span className="mt-1 flex flex-wrap gap-1.5 md:w-full md:flex-col [@media(max-height:700px)]:hidden" aria-label={`${game.modes.length} ways to play`}>{game.modes.map((mode) => <span key={mode.label} className={`flex items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-black sm:text-sm md:gap-1.5 md:py-1.5 ${mode.soon ? "bg-cream text-muted-ink" : `${game.tint} text-ink`}`}><span aria-hidden="true">{mode.emoji}</span>{mode.label}{mode.soon ? <span className="font-bold"> · soon</span> : null}</span>)}</span> : null}
          </span>
          <span aria-hidden="true" className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-ink px-4 text-sm font-black text-white shadow-[0_3px_0_#22384c] md:mt-1">Play →</span>
        </Link>
      </li>
    ))}
  </ul>;
}
