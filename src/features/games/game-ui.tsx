"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FillScreenMarker } from "@/components/layout/fill-screen-marker";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { BearMascot } from "@/features/home/illustrations";
import type { QuizFeedback } from "@/features/games/use-quiz-session";
import type { AudioResult } from "@/lib/speech";

const pillLink = "inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-black text-ink underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";

/** Full-height game page: fills the phone screen between the header and the bottom menu. */
export function GameScreen({ active, children }: { active: boolean; children: ReactNode }) {
  return <main data-game-active={active} className="game-screen flex flex-col bg-cream pt-3 pb-2 sm:py-12"><FillScreenMarker /><PageContainer className="flex max-w-5xl flex-1 flex-col">{children}</PageContainer></main>;
}

export function GameTopBar({ inMode, onBackToModes, onLeave }: { inMode: boolean; onBackToModes: () => void; onLeave: () => void }) {
  // Games page → a game's modes → a mode: "← Back" always goes one step up.
  return <div className="flex flex-wrap items-center justify-between gap-3">{inMode ? <button type="button" onClick={onBackToModes} className={pillLink}>← Back</button> : <Link href="/games" onClick={onLeave} className={pillLink}>← All games</Link>}<Link href={inMode ? "/games" : "/"} onClick={onLeave} className={pillLink}>{inMode ? "All games" : "Home"}</Link></div>;
}

export function GameHero({ eyebrow, title, description, art, hidden, tint = "bg-sky" }: { eyebrow: string; title: string; description: string; art: ReactNode; hidden: boolean; tint?: string }) {
  return <div className={`mt-3 rounded-[2rem] p-4 sm:mt-5 sm:p-8 ${tint} ${hidden ? "hidden sm:block" : ""}`}><div className="flex items-center gap-3 sm:gap-4">{art}<div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink">{eyebrow}</p><h1 className="text-xl font-black text-ink sm:text-4xl">{title}</h1><p className="mt-1 text-xs font-bold text-ink/75 sm:text-sm">{description}</p></div></div></div>;
}

export function ModeCard({ emoji, title, description, onStart, disabledNote }: { emoji: string; title: string; description: string; onStart: () => void; disabledNote?: string }) {
  return <Card className={`flex items-center gap-3 p-3 sm:block sm:p-6 ${disabledNote ? "bg-white/70" : "bg-white"}`}><span aria-hidden="true" className={`shrink-0 text-3xl sm:text-5xl ${disabledNote ? "opacity-60" : ""}`}>{emoji}</span><div className="min-w-0 flex-1"><h3 className="text-base font-black text-ink sm:mt-4 sm:text-xl">{title}</h3><p className="text-xs leading-5 text-muted-ink sm:mt-2 sm:min-h-14 sm:text-sm sm:leading-6">{disabledNote ?? description}</p></div><Button onClick={onStart} disabled={Boolean(disabledNote)} aria-label={disabledNote ? `${title} is coming soon` : `Start ${title}`} className="min-h-11 shrink-0 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:mt-5 sm:min-h-12 sm:w-full sm:px-6 sm:text-base">{disabledNote ? "Soon" : "Start"}</Button></Card>;
}

export function ModeHeader({ title, counter, current, total }: { title: string; counter: string; current: number; total: number }) {
  return <><div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 [@media(max-height:700px)]:hidden"><h2 className="text-xl font-black text-ink sm:text-2xl">{title}</h2><span className="rounded-full bg-white px-4 py-1.5 text-sm font-black text-ink sm:py-2">{counter}</span></div><ProgressBar current={current} total={total} /></>;
}

export function ProgressBar({ current, total }: { current: number; total: number }) {
  return <div className="mt-3 sm:mt-5"><p className="sr-only text-center text-sm font-black text-ink sm:not-sr-only">{current} of {total}</p><div className="h-3 overflow-hidden rounded-full bg-white sm:mt-2" role="progressbar" aria-label="Activity progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}><div className="h-full rounded-full bg-[#6ab484] transition-[width]" style={{ width: `${current / total * 100}%` }} /></div></div>;
}

export function audioStatusMessage(result: AudioResult): string {
  return result === "muted" ? "Sound is off in grown-up settings. You can keep playing!" : result === "unavailable" ? "Audio is unavailable here. You can keep playing!" : "Playing audio.";
}

/** A large audio button. `onPlay` starts speech or a sound and reports how it went. */
export function SpeakerButton({ label, onPlay, onStatus, icon = "🔊", children = "Hear it again" }: { label: string; onPlay: (onError: () => void) => AudioResult; onStatus: (message: string) => void; icon?: string; children?: ReactNode }) {
  return <button type="button" onClick={() => onStatus(audioStatusMessage(onPlay(() => onStatus(audioStatusMessage("unavailable")))))} aria-label={label} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-5 text-sm font-black text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink sm:min-h-12"><span aria-hidden="true">{icon}</span> {children}</button>;
}

export function AudioStatus({ message }: { message: string }) {
  return <p role="status" className="mt-2 min-h-5 text-center text-sm font-bold text-muted-ink sm:mt-4 sm:min-h-6">{message}</p>;
}

export function StarTrail({ earned, total }: { earned: number; total: number }) {
  return <div role="img" aria-label={`${earned} of ${total} stars earned`} className="flex justify-center gap-1 text-xl sm:text-2xl">{Array.from({ length: total }, (_, position) => <span key={position} aria-hidden="true" className={position < earned ? "game-celebrate" : "opacity-25 grayscale"}>⭐</span>)}</div>;
}

export function FeedbackBubble({ feedback, message, idleText = "Tap one answer to try." }: { feedback: QuizFeedback; message: string; idleText?: string }) {
  return <div className="flex items-center gap-3"><BearMascot key={feedback} className={`w-14 shrink-0 sm:w-20 [@media(max-height:700px)]:w-11 ${feedback === "correct" ? "game-celebrate" : ""}`} /><div aria-live="polite" className={`flex-1 rounded-2xl p-3 text-center font-black sm:p-4 [@media(max-height:700px)]:p-2 ${feedback === "correct" ? "bg-mint text-ink" : feedback === "retry" ? "bg-coral/40 text-ink" : "bg-cream text-muted-ink"}`}>{feedback === "idle" ? idleText : message}</div></div>;
}

/** A big answer button; the correct answer glows green once found. */
export function ChoiceButton({ label, found, disabled, onClick, children }: { label: string; found: boolean; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} lang="en" className={`flex min-w-0 flex-col items-center justify-center hyphens-auto [overflow-wrap:anywhere] rounded-3xl border-4 p-2 text-center transition-transform focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-default sm:p-4 ${found ? "game-celebrate border-[#377a4f] bg-mint" : "border-transparent bg-sky hover:-translate-y-1"}`}>{children}</button>;
}

export function QuizCard({ eyebrow = "Look, listen, and choose", prompt, helper, audio, choices, feedback, message, earned, total, index, onPrevious, onNext }: { eyebrow?: string; prompt: string; helper?: string; audio: ReactNode; choices: ReactNode; feedback: QuizFeedback; message: string; earned: number; total: number; index: number; onPrevious: () => void; onNext: () => void }) {
  return <Card className="mt-3 flex flex-1 flex-col gap-3 bg-white p-4 sm:mt-6 sm:gap-6 sm:p-9 [@media(max-height:700px)]:gap-2 [@media(max-height:700px)]:p-3">
    <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink [@media(max-height:700px)]:hidden">{eyebrow}</p><h3 className="mt-2 text-2xl font-black text-ink sm:mt-3 sm:text-4xl [@media(max-height:700px)]:mt-0 [@media(max-height:700px)]:text-xl">{prompt}</h3>{helper ? <p className="mt-1 text-sm font-bold text-muted-ink sm:mt-2">{helper}</p> : null}<div className="mt-3 sm:mt-5 [@media(max-height:700px)]:mt-2">{audio}</div></div>
    <div className="grid min-h-28 [@media(max-height:700px)]:min-h-20 flex-1 grid-cols-3 gap-2 sm:min-h-44 sm:gap-4">{choices}</div>
    <FeedbackBubble feedback={feedback} message={message} />
    <div className="[@media(max-height:700px)]:hidden"><StarTrail earned={earned} total={total} /></div>
    <div className="flex justify-between gap-3 sm:justify-center"><Button variant="secondary" onClick={onPrevious} disabled={index === 0} className="min-w-0 flex-1 whitespace-nowrap px-2 text-sm disabled:opacity-50 sm:flex-none sm:px-6 sm:text-base">← Previous</Button><Button onClick={onNext} disabled={feedback !== "correct"} className="min-w-0 flex-1 whitespace-nowrap px-2 text-sm disabled:opacity-50 sm:flex-none sm:px-6 sm:text-base">{index + 1 === total ? "See my stars" : "Next question →"}</Button></div>
  </Card>;
}

export function CompletionCard({ art, subtitle, stats, onPlayAgain, onChooseMode }: { art: ReactNode; subtitle: string; stats: { value: ReactNode; label: string }[]; onPlayAgain: () => void; onChooseMode: () => void }) {
  const tones = ["bg-mint", "bg-sunshine/50", "bg-sky", "bg-lavender/50"];
  return <Card className="mt-4 flex flex-col justify-center bg-white p-5 text-center max-md:flex-1 sm:mt-6 sm:p-10"><div className="relative mx-auto w-32 sm:w-40">{art}<span aria-hidden="true" className="absolute -right-3 -top-2 text-4xl sm:text-5xl">🌟</span></div><h2 className="mt-2 text-2xl font-black text-ink sm:mt-4 sm:text-3xl">Wonderful work!</h2><p className="mt-1 text-base text-muted-ink sm:mt-3 sm:text-lg">{subtitle}</p><div className="mx-auto mt-4 grid w-full max-w-lg grid-cols-2 gap-3 sm:mt-6">{stats.map((stat, position) => <div key={stat.label} className={`rounded-2xl p-3 sm:p-4 ${tones[position % tones.length]}`}><p className="text-2xl font-black text-ink sm:text-3xl">{stat.value}</p><p className="text-xs font-bold text-ink/75 sm:text-sm">{stat.label}</p></div>)}</div><div className="mt-5 flex flex-wrap justify-center gap-3 sm:mt-7"><Button onClick={onPlayAgain}>Play again</Button><Button variant="secondary" onClick={onChooseMode}>Choose a mode</Button></div></Card>;
}
