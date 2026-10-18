"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Confetti, type ConfettiHandle } from "@/components/ui/confetti";
import { Padlock } from "@/components/ui/padlock";
import { getCurrentUser, getPlan, type AuthUser, type PublicPlan } from "@/lib/auth-client";
import { games } from "@/lib/games";
import { refreshPremium } from "@/lib/premium";

const longDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
const linkButton = "inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-ink px-7 text-lg font-extrabold text-ink transition-all hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";

/** Where the payment gateway's return lands after a successful payment. */
export default function PremiumSuccessPage() {
  const confetti = useRef<ConfettiHandle>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [plan, setPlan] = useState<PublicPlan | null>(null);

  useEffect(() => {
    // Unlock the games straight away, and show what was bought.
    void refreshPremium();
    Promise.all([getCurrentUser(), getPlan()]).then(([current, premiumPlan]) => { setUser(current); setPlan(premiumPlan); }).catch(() => { /* The celebration still works without the details. */ });
  }, []);

  const until = user?.subscription.status === "active" ? user.subscription.currentPeriodEnd : null;
  const unlocked = plan ? games.filter((game) => plan.premiumGameIds.includes(game.id)) : [];

  return <main className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden bg-gradient-to-b from-sky via-cream to-sunshine/40 py-10 sm:py-16">
    <Confetti ref={confetti} />
    <span aria-hidden="true" className="success-float pointer-events-none absolute left-[6%] top-16 text-5xl sm:text-7xl">🎈</span>
    <span aria-hidden="true" className="success-float pointer-events-none absolute right-[8%] top-28 text-4xl [animation-delay:-1.5s] sm:text-6xl">🎈</span>
    <span aria-hidden="true" className="success-twinkle pointer-events-none absolute left-[18%] top-[55%] text-3xl">✨</span>
    <span aria-hidden="true" className="success-twinkle pointer-events-none absolute right-[16%] top-[62%] text-3xl [animation-delay:-.8s]">⭐</span>

    <div className="page-container relative mx-auto max-w-xl text-center">
      <div className="success-pop mx-auto flex items-end justify-center gap-2 sm:gap-4" aria-hidden="true">
        <span className="success-popper-left text-6xl sm:text-7xl">🎉</span>
        <span className="grid size-28 place-items-center rounded-full border-4 border-white bg-white p-5 text-5xl shadow-[0_8px_0_rgba(42,91,145,0.25)] sm:size-32 sm:p-6"><Padlock locked={false} celebrate delay={700} className="size-full" /></span>
        <span className="success-popper-right text-6xl sm:text-7xl">🎉</span>
      </div>

      <p className="success-rise mt-8 text-xs font-black uppercase tracking-[0.25em] text-muted-ink">Payment successful</p>
      <h1 className="success-rise mt-2 text-4xl font-black tracking-tight text-ink [animation-delay:.1s] sm:text-6xl">Premium unlocked!</h1>
      <p className="success-rise mx-auto mt-4 max-w-md text-lg leading-8 text-muted-ink [animation-delay:.2s]">
        Thank you{user ? `, ${user.name.split(" ")[0]}` : ""}! Your little learner can now play every game.
        {until ? <> Premium is active until <span className="font-black text-ink">{longDate(until)}</span>.</> : null}
      </p>

      {unlocked.length ? <Card className="success-rise mt-8 bg-white/90 p-5 text-left [animation-delay:.3s] sm:p-6">
        <h2 className="text-center text-sm font-black uppercase tracking-[0.18em] text-muted-ink">Now unlocked</h2>
        <ul className="mt-4 grid gap-3">{unlocked.map((game) => <li key={game.id}>
          <Link href={game.href} className="flex items-center gap-4 rounded-2xl bg-cream p-3 transition hover:-translate-y-0.5 hover:bg-sky focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink">
            <span aria-hidden="true" className={`grid size-14 shrink-0 place-items-center rounded-2xl text-3xl ${game.tint}`}>{game.emoji}</span>
            <span className="min-w-0 flex-1"><span className="block font-black text-ink">{game.title}</span><span className="block text-sm text-muted-ink">{game.description}</span></span>
            <span aria-hidden="true" className="text-xl font-black text-ink">→</span>
          </Link>
        </li>)}</ul>
      </Card> : null}

      <div className="success-rise mt-8 flex flex-col items-stretch justify-center gap-3 [animation-delay:.4s] sm:flex-row sm:items-center">
        <Link href="/games" className={`${linkButton} bg-[#ffd16a] shadow-[0_5px_0_#d99052]`}>Start playing <span aria-hidden="true">🎮</span></Link>
        <Link href="/grown-ups?payment=success" className={`${linkButton} bg-cream shadow-[0_4px_0_#d99052]`}>Parent dashboard</Link>
      </div>
      <button type="button" onClick={() => confetti.current?.burst()} className="mt-6 rounded-full px-4 py-2 text-sm font-black text-ink underline underline-offset-4 hover:bg-white/60 focus-visible:outline-3 focus-visible:outline-ink">Pop the confetti again <span aria-hidden="true">🎊</span></button>
    </div>
  </main>;
}
