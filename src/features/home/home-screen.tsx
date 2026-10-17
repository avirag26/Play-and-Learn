import Link from "next/link";
import { FillScreenMarker } from "@/components/layout/fill-screen-marker";
import { GameGrid } from "@/features/games/game-grid";
import { BearMascot } from "@/features/home/illustrations";

export function HomeScreen() {
  return (
    <main className="home-screen page-container bg-world-blue">
      <FillScreenMarker />
      <div className="home-panel mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[2rem] border-[3px] border-white/70 bg-[#b6e4ed] p-4 sm:gap-5 sm:p-8 [@media(max-height:700px)]:gap-2 [@media(max-height:700px)]:p-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/70">Little Wonder World</p>
            <h1 className="mt-1 text-[clamp(1.9rem,8vw,3.5rem)] font-black leading-tight tracking-tight text-ink">Play &amp; Learn</h1>
            <p className="mt-1 text-sm text-ink/80 sm:text-base">Pick a game and let&apos;s play together!</p>
          </div>
          <BearMascot className="w-20 shrink-0 sm:w-36" />
        </div>
        <h2 className="text-lg font-black text-ink sm:text-2xl">Games</h2>
        <GameGrid />
        <Link href="/missions" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cream px-4 text-sm font-black text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"><span aria-hidden="true">🏡</span> Home Missions</Link>
      </div>
    </main>
  );
}
