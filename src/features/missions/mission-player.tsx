"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Confetti, type ConfettiHandle } from "@/components/ui/confetti";
import { cheerPhrases, pickPhrase, speakableText } from "@/lib/encouragement";
import { missionCategoryInfo, type HomeMission } from "@/lib/missions";
import { speak, stopSpeech } from "@/lib/speech";

/** A countdown ring for the mission's suggested time. */
function MissionTimer({ minutes }: { minutes: number }) {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (endAt === null) return;
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(tick);
  }, [endAt]);

  const total = minutes * 60_000;
  const left = endAt === null ? total : Math.max(0, endAt - now);
  const done = endAt !== null && left === 0;
  const seconds = Math.ceil(left / 1000);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  function start() { const at = Date.now(); setNow(at); setEndAt(at + total); }

  return <div className="flex items-center gap-4 rounded-3xl bg-white p-3 pr-4">
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--sky)" strokeWidth="7" />
        <circle cx="32" cy="32" r={radius} fill="none" stroke={done ? "#7ad9a6" : "#ffc22e"} strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - left / total)} className="transition-[stroke-dashoffset] duration-300" />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xl" aria-hidden="true">{done ? "🎉" : "⏱️"}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-mono text-2xl font-black text-ink" role="timer" aria-live="off">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</p>
      <p className="text-xs font-bold text-muted-ink">{done ? "Time's up! How did it go?" : endAt === null ? "Use the timer if you like" : "Keep going!"}</p>
    </div>
    <button type="button" onClick={endAt === null || done ? start : () => setEndAt(null)} className="min-h-11 shrink-0 rounded-full bg-cream px-4 text-sm font-black text-ink hover:bg-sky focus-visible:outline-3 focus-visible:outline-ink">{endAt === null ? "Start" : done ? "Again" : "Reset"}</button>
  </div>;
}

/** The mission, step by step: read aloud, tick steps, optional timer, then a celebration. */
export function MissionPlayer({ mission, completed, earnedBadge, onComplete, onUndo, onClose, onNext }: { mission: HomeMission | null; completed: boolean; earnedBadge: string | null; onComplete: (id: string) => void; onUndo: (id: string) => void; onClose: () => void; onNext: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confetti = useRef<ConfettiHandle>(null);
  const id = useId();
  const [ticked, setTicked] = useState<number[]>([]);
  const [cheer, setCheer] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!mission || !dialog) return;
    if (!dialog.open) dialog.showModal();
    const reset = window.setTimeout(() => { setTicked([]); setCheer(null); }, 0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.clearTimeout(reset); stopSpeech(); document.body.style.overflow = previousOverflow; };
  }, [mission]);
  useEffect(() => { if (!mission && dialogRef.current?.open) dialogRef.current.close(); }, [mission]);

  if (!mission) return <dialog ref={dialogRef} className="confirm-dialog" />;
  const info = missionCategoryInfo[mission.category];

  function listen() { if (mission) speak(`${mission.title}. ${mission.steps.map((step, index) => `Step ${index + 1}. ${step}`).join(" ")}`); }
  function toggleStep(index: number) { setTicked((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]); }
  function finish() {
    if (!mission) return;
    const phrase = pickPhrase(cheerPhrases);
    setCheer(phrase);
    onComplete(mission.id);
    confetti.current?.burst();
    speak(speakableText(`${phrase} Mission complete!`));
  }

  return <dialog ref={dialogRef} className="confirm-dialog mission-dialog" aria-labelledby={`${id}-title`} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <Confetti ref={confetti} autoFire={false} />
    <div className={`relative px-5 pb-6 pt-5 sm:px-7 ${info.tint}`}>
      <button type="button" onClick={onClose} aria-label="Close mission" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/80 text-xl font-black text-ink hover:bg-white focus-visible:outline-3 focus-visible:outline-ink">×</button>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-ink"><span aria-hidden="true">{info.emoji}</span>{info.short} · {mission.duration}</p>
      <div className="mt-4 flex items-center gap-4">
        <span aria-hidden="true" className={`grid size-24 shrink-0 place-items-center rounded-[1.75rem] border-4 border-white bg-white/70 text-6xl shadow-[0_6px_0_rgba(42,91,145,0.18)] ${cheer ? "game-celebrate" : ""}`}>{mission.emoji}</span>
        <div className="min-w-0"><h2 id={`${id}-title`} className="text-3xl font-black leading-tight text-ink">{mission.title}</h2><p className="mt-1 text-sm font-bold leading-6 text-ink/75">{mission.instruction}</p></div>
      </div>
    </div>

    {cheer ? <div className="game-pop px-5 py-8 text-center sm:px-7">
      <p aria-hidden="true" className="text-6xl">⭐</p>
      <p role="status" className="mt-3 text-3xl font-black text-ink">{cheer.replace(/\s*\S+$/u, "")}</p>
      <p className="mt-2 font-bold text-muted-ink">Mission complete! You earned a star.</p>
      {earnedBadge ? <p className="game-pop mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-sunshine px-4 py-2 font-black text-ink shadow-[0_4px_0_#d99052]"><span aria-hidden="true">🏅</span>New badge: {earnedBadge}!</p> : null}
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={onNext}>Next mission →</Button>
        <Button type="button" variant="secondary" onClick={onClose}>All missions</Button>
      </div>
    </div> : <div className="grid gap-5 px-5 py-6 sm:px-7">
      <button type="button" onClick={listen} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 font-black text-ink shadow-[0_3px_0_rgba(42,91,145,0.18)] hover:bg-sky focus-visible:outline-3 focus-visible:outline-ink"><span aria-hidden="true">🔊</span>Listen to the mission</button>

      <ol className="grid gap-2.5">{mission.steps.map((step, index) => {
        const done = ticked.includes(index);
        return <li key={step}><button type="button" onClick={() => toggleStep(index)} aria-pressed={done} className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left font-bold text-ink transition focus-visible:outline-3 focus-visible:outline-ink ${done ? "border-mint bg-mint/60" : "border-white bg-white hover:border-sky"}`}>
          <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-black ${done ? "bg-white" : "bg-sunshine"}`}>{done ? "✓" : index + 1}</span>
          <span className={done ? "line-through decoration-2 opacity-70" : ""}>{step}</span>
        </button></li>;
      })}</ol>

      <MissionTimer key={mission.id} minutes={mission.minutes} />

      {mission.safety ? <p className="rounded-2xl bg-coral/25 px-4 py-3 text-sm leading-6 text-ink"><span className="font-black"><span aria-hidden="true">🛡️ </span>For grown-ups:</span> {mission.safety}</p> : null}
      <p className="text-sm leading-6 text-muted-ink"><span className="font-black text-ink">Learning:</span> {mission.objective}</p>

      {completed ? <div className="grid gap-3 text-center">
        <p className="rounded-full bg-mint px-4 py-3 font-black text-ink"><span aria-hidden="true">⭐ </span>You finished this mission!</p>
        <div className="flex flex-wrap justify-center gap-2"><Button type="button" onClick={finish} className="flex-1">Did it again! <span aria-hidden="true">🎉</span></Button></div>
        <button type="button" onClick={() => onUndo(mission.id)} className="min-h-11 text-sm font-black text-muted-ink underline underline-offset-4">Mark as not finished</button>
      </div> : <Button type="button" onClick={finish} className="min-h-14 w-full text-lg">I did it! <span aria-hidden="true">⭐</span></Button>}
    </div>}
  </dialog>;
}
