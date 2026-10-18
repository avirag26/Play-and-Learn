"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { MissionPlayer } from "@/features/missions/mission-player";
import { missionCategories, missionCategoryInfo, missionOfTheDay, type HomeMission, type MissionCategory, homeMissions } from "@/lib/missions";
import { readCompletedMissions, saveCompletedMissions } from "@/lib/app-settings";

const categoryDone = (category: MissionCategory, completed: readonly string[]) => homeMissions.filter((mission) => mission.category === category && completed.includes(mission.id)).length;
const categoryTotal = (category: MissionCategory) => homeMissions.filter((mission) => mission.category === category).length;

function MissionCard({ mission, completed, onOpen }: { mission: HomeMission; completed: boolean; onOpen: (mission: HomeMission) => void }) {
  const info = missionCategoryInfo[mission.category];
  return <li><button type="button" onClick={() => onOpen(mission)} aria-label={`${mission.title}${completed ? ", finished" : ""}`} className={`group relative flex h-full w-full items-center gap-4 rounded-[1.75rem] border-2 p-4 text-left shadow-[0_6px_0_rgba(42,91,145,0.18)] transition hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink sm:flex-col sm:items-start sm:p-5 ${completed ? "border-mint bg-mint/50" : "border-white bg-white"}`}>
    <span aria-hidden="true" className={`grid size-20 shrink-0 place-items-center rounded-3xl text-5xl transition group-hover:scale-105 sm:size-24 sm:text-6xl ${info.tint}`}>{mission.emoji}</span>
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-1.5"><span className="rounded-full bg-cream px-2.5 py-0.5 text-[0.7rem] font-black uppercase tracking-[0.1em] text-muted-ink">{info.short}</span><span className="rounded-full bg-cream px-2.5 py-0.5 text-[0.7rem] font-black text-muted-ink">⏱ {mission.duration}</span></span>
      <span className="mt-2 block text-xl font-black leading-tight text-ink">{mission.title}</span>
      <span className="mt-1 line-clamp-2 block text-sm leading-6 text-muted-ink">{mission.instruction}</span>
    </span>
    {completed ? <span aria-hidden="true" className="mission-stamp absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-sunshine text-xl shadow-[0_3px_0_#d99052]">⭐</span> : null}
  </button></li>;
}

export default function MissionsPage() {
  const [filter, setFilter] = useState<MissionCategory | "all">("all");
  const [completed, setCompleted] = useState<string[]>([]);
  const [now, setNow] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [earnedBadge, setEarnedBadge] = useState<string | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => { setCompleted(readCompletedMissions()); setNow(Date.now()); }, 0); return () => window.clearTimeout(timer); }, []);

  const visibleMissions = useMemo(() => filter === "all" ? homeMissions : homeMissions.filter((mission) => mission.category === filter), [filter]);
  const doneCount = homeMissions.filter((mission) => completed.includes(mission.id)).length;
  const today = now ? missionOfTheDay(completed, now) : null;
  const active = homeMissions.find((mission) => mission.id === activeId) ?? null;

  function save(next: string[]) { setCompleted(next); saveCompletedMissions(next); }
  function open(mission: HomeMission) { setEarnedBadge(null); setActiveId(mission.id); }
  function complete(id: string) {
    if (completed.includes(id)) return;
    const next = [...completed, id];
    const category = homeMissions.find((mission) => mission.id === id)?.category;
    setEarnedBadge(category && categoryDone(category, next) === categoryTotal(category) ? missionCategoryInfo[category].badge : null);
    save(next);
  }
  function undo(id: string) { save(completed.filter((item) => item !== id)); }
  function next() {
    const start = homeMissions.findIndex((mission) => mission.id === activeId);
    const upcoming = [...homeMissions.slice(start + 1), ...homeMissions.slice(0, start + 1)].find((mission) => !completed.includes(mission.id)) ?? homeMissions[(start + 1) % homeMissions.length];
    open(upcoming);
  }

  return <main className="min-h-[calc(100vh-4.5rem)] bg-cream pb-16 pt-8 sm:pt-12"><PageContainer className="max-w-6xl">
    <Link href="/" className="text-sm font-black text-ink underline underline-offset-4">← Back home</Link>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
      <div><p className="text-xs font-black uppercase tracking-[0.2em] text-muted-ink">Little adventures at home</p><h1 className="mt-2 text-4xl font-black tracking-tight text-ink sm:text-6xl">Home Missions <span aria-hidden="true">🏡</span></h1><p className="mt-3 max-w-xl text-lg leading-7 text-muted-ink">Real-world mini adventures to do together, away from the screen. Finish a mission to earn a star!</p></div>
      <Card className="bg-white p-5 lg:w-80">
        <div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-ink">Your stars</p><p className="text-2xl font-black text-ink"><span aria-hidden="true">⭐ </span>{doneCount}<span className="text-base text-muted-ink"> / {homeMissions.length}</span></p></div>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-sky" role="progressbar" aria-label="Missions finished" aria-valuemin={0} aria-valuemax={homeMissions.length} aria-valuenow={doneCount}><div className="h-full rounded-full bg-gradient-to-r from-sunshine to-[#ffb36b] transition-[width] duration-700" style={{ width: `${(doneCount / homeMissions.length) * 100}%` }} /></div>
        <p className="mt-2 text-xs font-bold text-muted-ink">{doneCount === homeMissions.length ? "Every mission done. Amazing!" : `${homeMissions.length - doneCount} more to go`}</p>
      </Card>
    </div>

    {today ? <Card className="mt-8 overflow-hidden bg-gradient-to-br from-sunshine/70 via-[#ffe9b0] to-coral/40 p-5 sm:p-7">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <span aria-hidden="true" className="mission-bob grid size-28 shrink-0 place-items-center rounded-[2rem] border-4 border-white bg-white/70 text-7xl shadow-[0_6px_0_rgba(217,144,82,0.4)]">{today.emoji}</span>
        <div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-[0.2em] text-ink/70"><span aria-hidden="true">✨ </span>Today&apos;s mission</p><h2 className="mt-1 text-3xl font-black text-ink">{today.title}</h2><p className="mt-1 leading-7 text-ink/80">{today.instruction}</p></div>
        <button type="button" onClick={() => open(today)} className="inline-flex min-h-14 w-full shrink-0 items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-7 text-lg font-extrabold text-ink shadow-[0_5px_0_#d99052] transition hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink sm:w-auto">{completed.includes(today.id) ? "Do it again" : "Let's go!"} <span aria-hidden="true">🚀</span></button>
      </div>
    </Card> : null}

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

    <div role="group" aria-label="Mission paths" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
      {(["all", ...missionCategories] as const).map((item) => {
        const selected = filter === item;
        return <button key={item} type="button" aria-pressed={selected} onClick={() => setFilter(item)} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-black transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${selected ? "bg-ink text-white" : "bg-white text-ink hover:bg-sky"}`}><span aria-hidden="true">{item === "all" ? "🌈" : missionCategoryInfo[item].emoji}</span>{item === "all" ? "All" : missionCategoryInfo[item].short}</button>;
      })}
    </div>

    <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleMissions.map((mission) => <MissionCard key={mission.id} mission={mission} completed={completed.includes(mission.id)} onOpen={open} />)}</ul>
    <p className="mt-8 text-center text-sm font-bold text-muted-ink">A grown-up should help choose a safe space and stay nearby during missions.</p>

    <MissionPlayer mission={active} completed={active ? completed.includes(active.id) : false} earnedBadge={earnedBadge} onComplete={complete} onUndo={undo} onClose={() => setActiveId(null)} onNext={next} />
  </PageContainer></main>;
}
