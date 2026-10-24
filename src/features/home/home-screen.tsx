"use client";

import Link from "next/link";
import { FillScreenMarker } from "@/components/layout/fill-screen-marker";
import { Padlock } from "@/components/ui/padlock";
import { BearMascot, HomeScene } from "@/features/home/illustrations";
import { SafariMascot } from "@/features/shape-safari/shape-art";
import { games } from "@/lib/games";
import { isGameLocked, usePremium } from "@/lib/premium";

const focusRing = "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";

/** A sunny welcome with one big way in (Explore Games), then a tile for every game. */
export function HomeScreen() {
  const { entitlement, now } = usePremium();
  return (
    <main className="home-screen page-container bg-world-blue">
      <FillScreenMarker />
      <div className="home-panel mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[2rem] border-[3px] border-white/70 bg-[#b6e4ed] p-3 sm:gap-5 sm:p-6 [@media(max-height:700px)]:gap-2">
        {/* Phones: words, picture, button stacked. Wide screens: words and button left, picture right. */}
        <section aria-labelledby="home-title" className="flex flex-1 flex-col items-center overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-white via-sky to-[#d8f3e4] px-4 pt-4 text-center sm:pt-8 lg:grid lg:grid-cols-[1fr_1.15fr] lg:gap-x-6 lg:px-10 lg:pt-6 lg:text-left">
          <div className="flex flex-col items-center lg:col-start-1 lg:row-start-1 lg:items-start lg:self-end">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/70 [@media(max-height:700px)]:hidden">Little Wonder World</p>
            <h1 id="home-title" className="mt-1 flex items-center gap-2 text-[clamp(2rem,9vw,3.75rem)] font-black leading-none tracking-tight text-ink [@media(max-height:700px)]:text-[1.85rem]"><span aria-hidden="true" className="grid size-[0.9em] place-items-center rounded-[30%] bg-sunshine text-[0.6em]">✦</span>Play &amp; Learn</h1>
            <p className="mt-2 text-lg font-black text-ink sm:text-2xl [@media(max-height:700px)]:mt-1">Play Smart. Grow Bright.</p>
            <p className="mt-0.5 text-sm font-bold text-ink/75 sm:text-base [@media(max-height:700px)]:hidden">Pick a game and let&apos;s play together!</p>
          </div>
          {/* The scene keeps its shape (8:5), so the friends always sit on the hill beside the tablet; its sides fade into the sky. */}
          <div className="relative mt-auto aspect-[8/5] w-[min(100%,48dvh,34rem)] pt-2 [mask-image:linear-gradient(to_right,transparent,black_9%,black_91%,transparent)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:w-full lg:self-end [@media(max-height:700px)]:w-[min(100%,31dvh)]">
            <HomeScene className="absolute inset-0 h-full w-full" />
            <span className="absolute bottom-[4%] left-[2%] block w-[31%]"><span className="shape-bob block"><BearMascot className="block h-auto w-full" /></span></span>
            <span className="absolute bottom-[4%] right-[2%] block w-[29%]"><span className="shape-bob block" style={{ animationDelay: "600ms" }}><SafariMascot className="block h-auto w-full" /></span></span>
          </div>
          <Link href="/games" className={`mb-4 mt-3 inline-flex min-h-14 w-full max-w-sm items-center justify-center gap-2 rounded-full border-2 border-ink bg-[#ffd16a] px-8 text-xl font-black text-ink shadow-[0_5px_0_#d99052] transition-all hover:-translate-y-0.5 sm:mb-7 sm:min-h-16 sm:text-2xl lg:col-start-1 lg:row-start-2 lg:mt-5 lg:self-start [@media(max-height:700px)]:mb-3 [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:min-h-12 [@media(max-height:700px)]:text-lg ${focusRing}`}>Explore Games <span aria-hidden="true">→</span></Link>
        </section>

        <section aria-labelledby="quick-title" className="rounded-[1.75rem] bg-white p-3 sm:p-5">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 id="quick-title" className="text-lg font-black text-ink sm:text-2xl">Quick Learning</h2>
            <Link href="/games" className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-black text-ink underline underline-offset-4 ${focusRing}`}>See all</Link>
          </div>
          <ul className="mt-1 grid grid-cols-5 gap-1.5 sm:mt-3 sm:gap-3">{games.map((game) => {
            const premium = entitlement?.premiumGameIds.includes(game.id) ?? false;
            const locked = isGameLocked(entitlement, game.id, now);
            return <li key={game.id} className="min-w-0"><Link href={game.href} aria-label={`${game.title}${locked ? " (Premium, locked)" : ""}`} className={`flex h-full flex-col items-center gap-1 rounded-2xl p-1.5 text-center transition-transform hover:-translate-y-1 sm:gap-2 sm:p-3 ${focusRing}`}>
              <span aria-hidden="true" className={`relative grid aspect-square w-full max-w-20 place-items-center rounded-2xl text-[clamp(1.6rem,8vw,2.75rem)] leading-none shadow-[0_3px_0_rgba(42,91,145,0.15)] ${game.tint}`}>{game.emoji}{premium ? <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-white bg-white p-0.5 shadow-[0_2px_0_rgba(42,91,145,0.25)]"><Padlock locked={locked} className="size-full" /></span> : null}</span>
              <span className="w-full text-[clamp(0.62rem,2.9vw,1rem)] font-black leading-tight text-ink">{game.short}</span>
            </Link></li>;
          })}</ul>
        </section>

        <Link href="/missions" className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cream px-4 text-sm font-black text-ink ${focusRing}`}><span aria-hidden="true">🏡</span> Home Missions</Link>
      </div>
    </main>
  );
}
