"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { isGameLocked, usePremium } from "@/lib/premium";

/** Shows the game, or a friendly "ask a grown-up" screen when it needs Premium. */
export function PremiumGate({ gameId, title, children }: { gameId: string; title: string; children: ReactNode }) {
  const { entitlement, checked, now } = usePremium();
  // Nothing known yet (first visit, still asking the API): wait briefly instead of flashing the game.
  if (!entitlement && !checked) return <main className="game-screen grid place-items-center bg-world-blue"><p className="rounded-full bg-white px-5 py-3 text-sm font-black text-ink">Getting the game ready…</p></main>;
  if (!isGameLocked(entitlement, gameId, now)) return children;

  return <main className="game-screen grid place-items-center bg-world-blue px-4 py-8">
    <div className="w-full max-w-md rounded-[2rem] border-[3px] border-white/70 bg-cream p-7 text-center shadow-[0_8px_0_rgba(42,91,145,0.25)] sm:p-10">
      <p aria-hidden="true" className="text-7xl">🔒</p>
      <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sunshine px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-ink"><span aria-hidden="true">⭐</span>Premium</p>
      <h1 className="mt-3 text-3xl font-black text-ink">{title} is a Premium game</h1>
      <p className="mt-3 leading-7 text-muted-ink">Ask a grown-up to unlock it in the parent area.</p>
      <div className="mt-6 grid gap-3">
        <Link href="/grown-ups" className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-ink bg-[#ffd16a] px-6 font-extrabold text-ink shadow-[0_5px_0_#d99052] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">Grown-ups: unlock Premium</Link>
        <Link href="/games" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 font-extrabold text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">Play another game</Link>
      </div>
    </div>
  </main>;
}
