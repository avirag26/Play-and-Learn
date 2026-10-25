"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { MissionMap } from "@/features/missions/mission-map";
import { MissionPlayer } from "@/features/missions/mission-player";
import { dayNumber, journey, readMissionDays, recordFinish, saveMissionDays, type JourneyStep, type MissionDays } from "@/lib/mission-journey";
import { missionCategories, missionCategoryInfo, type MissionCategory, homeMissions } from "@/lib/missions";
import { readCompletedMissions, saveCompletedMissions } from "@/lib/app-settings";
import { firstPremiumMissionDay, usePremium } from "@/lib/premium";

const categoryDone = (category: MissionCategory, completed: readonly string[]) => homeMissions.filter((mission) => mission.category === category && completed.includes(mission.id)).length;
const categoryTotal = (category: MissionCategory) => homeMissions.filter((mission) => mission.category === category).length;

export default function MissionsPage() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [days, setDays] = useState<MissionDays>({});
  const [today, setToday] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [earnedBadge, setEarnedBadge] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const { entitlement, now } = usePremium();
  useEffect(() => { const timer = window.setTimeout(() => { setCompleted(readCompletedMissions()); setDays(readMissionDays()); setToday(dayNumber(Date.now())); }, 0); return () => window.clearTimeout(timer); }, []);

  const steps = today ? journey(completed, days, today, firstPremiumMissionDay(entitlement, now)) : [];
  const current = steps.find((step) => step.status === "today" || step.status === "tomorrow" || step.status === "premium");
  const doneCount = homeMissions.filter((mission) => completed.includes(mission.id)).length;
  const active = homeMissions.find((mission) => mission.id === activeId) ?? null;
  // After finishing, "Next mission" only appears when another mission is already open today.
  const nextOpen = steps.find((step) => step.status === "today" && step.mission.id !== activeId);

  function open(step: JourneyStep) { setNote(""); setEarnedBadge(null); setActiveId(step.mission.id); }
  function locked(step: JourneyStep) {
    setNote(step.status === "tomorrow" ? `Day ${step.day} opens tomorrow. See you then! 🌙` : step.premium ? `Day ${step.day} is a Premium mission. Ask a grown-up to unlock it! ⭐` : `Day ${step.day} opens after the missions before it. One new mission each day!`);
  }
  function complete(id: string) {
    if (completed.includes(id)) return;
    const next = [...completed, id];
    const category = homeMissions.find((mission) => mission.id === id)?.category;
    setEarnedBadge(category && categoryDone(category, next) === categoryTotal(category) ? missionCategoryInfo[category].badge : null);
    const nextDays = recordFinish(days, id, dayNumber(Date.now()));
    setCompleted(next);
    saveCompletedMissions(next);
    setDays(nextDays);
    saveMissionDays(nextDays);
  }
  /** A grown-up can take a finish back; the mission's day is forgotten too. */
  function undo(id: string) {
    const next = completed.filter((item) => item !== id);
    const nextDays = Object.fromEntries(Object.entries(days).filter(([item]) => item !== id));
    setCompleted(next);
    saveCompletedMissions(next);
    setDays(nextDays);
    saveMissionDays(nextDays);
  }

  return <main className="min-h-[calc(100vh-4.5rem)] bg-cream pb-16 pt-8 sm:pt-12"><PageContainer className="max-w-3xl">
    <Link href="/" className="text-sm font-black text-ink underline underline-offset-4">← Back home</Link>
    <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
      <div><p className="text-xs font-black uppercase tracking-[0.2em] text-muted-ink">One little adventure each day</p><h1 className="mt-2 text-4xl font-black tracking-tight text-ink sm:text-5xl">Home Missions <span aria-hidden="true">🏡</span></h1><p className="mt-3 max-w-xl text-lg leading-7 text-muted-ink">Do today&apos;s mission together, away from the screen. Finish it to earn a star, and tomorrow the next one opens!</p></div>
      <Card className="bg-white p-5 sm:w-64">
        <div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-ink">Your stars</p><p className="text-2xl font-black text-ink"><span aria-hidden="true">⭐ </span>{doneCount}<span className="text-base text-muted-ink"> / {homeMissions.length}</span></p></div>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-sky" role="progressbar" aria-label="Missions finished" aria-valuemin={0} aria-valuemax={homeMissions.length} aria-valuenow={doneCount}><div className="h-full rounded-full bg-gradient-to-r from-sunshine to-[#ffb36b] transition-[width] duration-700" style={{ width: `${(doneCount / homeMissions.length) * 100}%` }} /></div>
      </Card>
    </div>

    {today ? <Card className="mt-6 flex flex-wrap items-center gap-4 overflow-hidden bg-gradient-to-br from-sunshine/70 via-[#ffe9b0] to-coral/40 p-4 sm:p-5">
      {current?.status === "today" ? <>
        <span aria-hidden="true" className="mission-bob grid size-16 shrink-0 place-items-center rounded-3xl border-4 border-white bg-white/70 text-4xl">{current.mission.emoji}</span>
        <div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-[0.18em] text-ink/70">Day {current.day} · Today&apos;s mission</p><h2 className="text-2xl font-black leading-tight text-ink">{current.mission.title}</h2></div>
        <button type="button" onClick={() => open(current)} className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border-2 border-ink bg-white px-5 font-extrabold text-ink shadow-[0_4px_0_#d99052] transition hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">Let&apos;s go! <span aria-hidden="true">🚀</span></button>
      </> : current?.status === "premium" ? <>
        <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-3xl border-4 border-white bg-sunshine text-4xl">⭐</span>
        <div className="min-w-[12rem] flex-1"><h2 className="text-2xl font-black leading-tight text-ink">More missions with Premium</h2><p className="text-sm font-bold leading-6 text-ink/75">You finished the free days! Day {current.day} and the rest open with Premium.</p></div>
        <Link href="/grown-ups" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full max-sm:w-full border-2 border-ink bg-white px-5 text-sm font-extrabold text-ink shadow-[0_4px_0_#d99052] transition hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">Grown-ups: unlock</Link>
      </> : current?.status === "tomorrow" ? <>
        <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-3xl border-4 border-white bg-[#2b356f] text-4xl">🌙</span>
        <div className="min-w-0 flex-1"><h2 className="text-2xl font-black leading-tight text-ink">Great job today!</h2><p className="text-sm font-bold leading-6 text-ink/75">Day {current.day} opens tomorrow. Come back for a new adventure!</p></div>
      </> : <>
        <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-3xl border-4 border-white bg-white/70 text-4xl">🏆</span>
        <div className="min-w-0 flex-1"><h2 className="text-2xl font-black leading-tight text-ink">Journey complete!</h2><p className="text-sm font-bold leading-6 text-ink/75">Every mission is done. Tap any star on the map to play it again.</p></div>
      </>}
    </Card> : null}

    <section className="mt-6" aria-labelledby="journey-title">
      <h2 id="journey-title" className="sr-only">Mission journey</h2>
      <p role="status" aria-live="polite" className={`mb-3 min-h-0 rounded-2xl text-center text-sm font-black text-ink ${note ? "bg-white px-4 py-3 shadow-[0_3px_0_rgba(42,91,145,0.12)]" : ""}`}>{note}</p>
      {steps.length ? <MissionMap steps={steps} onOpen={open} onLocked={locked} /> : null}
    </section>

    <section className="mt-8" aria-labelledby="badges-title">
      <h2 id="badges-title" className="text-xl font-black text-ink">Badges to collect</h2>
      <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">{missionCategories.map((category) => {
        const info = missionCategoryInfo[category];
        const done = categoryDone(category, completed);
        const total = categoryTotal(category);
        const earned = done === total;
        return <li key={category} className={`flex flex-col items-center rounded-3xl p-3 text-center ${earned ? "bg-white shadow-[0_4px_0_rgba(42,91,145,0.18)]" : "bg-white/50"}`}>
          <span aria-hidden="true" className={`relative grid size-14 place-items-center rounded-full text-3xl ${earned ? `${info.tint} ring-4 ring-sunshine` : "bg-cream grayscale opacity-50"}`}>{info.emoji}{earned ? <span className="absolute -bottom-1 -right-1 text-lg">🏅</span> : null}</span>
          <span className="mt-2 text-xs font-black leading-tight text-ink">{info.badge}</span>
          <span className="mt-0.5 text-[0.7rem] font-bold text-muted-ink">{earned ? "Earned!" : `${done} / ${total}`}</span>
        </li>;
      })}</ul>
    </section>
    <p className="mt-8 text-center text-sm font-bold text-muted-ink">A grown-up should help choose a safe space and stay nearby during missions.</p>

    <MissionPlayer mission={active} completed={active ? completed.includes(active.id) : false} earnedBadge={earnedBadge} onComplete={complete} onUndo={undo} onClose={() => setActiveId(null)} onNext={nextOpen ? () => open(nextOpen) : undefined} />
  </PageContainer></main>;
}
