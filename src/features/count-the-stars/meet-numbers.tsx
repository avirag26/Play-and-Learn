import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountItem, ObjectGroup } from "@/features/count-the-stars/count-item";
import { SpeakerButton } from "@/features/games/game-ui";
import { capitalize, countPhrase, meetObjectFor, meetSpeech, numbers, numberWords } from "@/lib/count-data";
import type { AudioErrorHandler, AudioResult } from "@/lib/speech";

/** Every number 1–10 as a big tappable card; a tick marks numbers already met. */
export function NumberGallery({ met, onOpen, onDone }: { met: readonly number[]; onOpen: (value: number) => void; onDone: () => void }) {
  return <Card className="mt-3 flex flex-1 flex-col gap-3 bg-white p-3 sm:mt-6 sm:gap-5 sm:p-8">
    <ul className="grid min-h-0 flex-1 grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:gap-4 md:grid-cols-5">{numbers.map((value) => {
      const done = met.includes(value);
      return <li key={value} className="min-w-0"><button type="button" onClick={() => onOpen(value)} aria-label={`Meet the number ${numberWords[value]}${done ? ", already met" : ""}`} className="relative flex h-full min-h-24 w-full flex-col items-center justify-center gap-1 rounded-3xl bg-cream p-2 text-center shadow-[0_4px_0_rgba(42,91,145,0.15)] transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink">
        <span className="text-4xl font-black leading-none text-ink sm:text-5xl">{value}</span>
        <span className="flex items-center gap-1 text-lg" aria-hidden="true"><CountItem object={meetObjectFor(value)} /><span className="text-xs font-black text-muted-ink">× {value}</span></span>
        {done ? <span aria-hidden="true" className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-mint text-[0.65rem] font-black text-ink">✓</span> : null}
      </button></li>;
    })}</ul>
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-muted-ink">Tap a number to meet it!</p><Button onClick={onDone} className="shrink-0 whitespace-nowrap px-4 text-sm sm:px-6 sm:text-base">I&apos;m done</Button></div>
  </Card>;
}

type DetailProps = {
  value: number;
  onBack: () => void;
  onMove: (delta: number) => void;
  /** Says a number word as the child taps each thing. */
  onCount: (spoken: number) => void;
  say: (text: string, onError: AudioErrorHandler) => AudioResult;
  onStatus: (message: string) => void;
};

/** One big number, its word, and that many things to tap and count. */
export function NumberDetail({ value, onBack, onMove, onCount, say, onStatus }: DetailProps) {
  const object = meetObjectFor(value);
  const hasPrevious = value > numbers[0];
  const hasNext = value < numbers[numbers.length - 1];
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" && hasPrevious) onMove(-1);
    else if (event.key === "ArrowRight" && hasNext) onMove(1);
  }
  return <Card className="mt-3 flex flex-1 flex-col gap-2 bg-white p-3 sm:mt-6 sm:gap-4 sm:p-8" onKeyDown={onKeyDown}>
    <div key={value} className="game-pop flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-[2rem] bg-gradient-to-b from-sky to-cream p-3 text-center sm:gap-4 sm:p-6">
      <div className="flex items-end gap-3"><span className="text-[clamp(4.5rem,16dvh,9rem)] font-black leading-none text-ink">{value}</span><span className="mb-2 rounded-full bg-white px-4 py-1 text-xl font-black text-ink shadow-sm sm:text-3xl">{numberWords[value]}</span></div>
      <ObjectGroup key={value} count={value} object={object} size="lg" onCount={onCount} label={`${countPhrase(value, object)}. Tap each one to count.`} />
    </div>
    <p className="rounded-2xl bg-cream p-2.5 text-center text-[0.95rem] font-bold leading-snug text-ink sm:p-3 sm:text-lg"><span aria-hidden="true">👆 </span>{capitalize(countPhrase(value, object))}. Tap each one and count!</p>
    <div className="flex justify-center"><SpeakerButton label={`Hear the number ${numberWords[value]}`} onPlay={(onError) => say(meetSpeech(value), onError)} onStatus={onStatus}>Hear the number</SpeakerButton></div>
    <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-between sm:gap-3"><Button variant="secondary" onClick={() => onMove(-1)} disabled={!hasPrevious} className="whitespace-nowrap px-1 text-sm disabled:opacity-50 sm:px-6 sm:text-base">← Back</Button><Button variant="secondary" onClick={onBack} className="whitespace-nowrap px-1 text-sm sm:px-6 sm:text-base">All numbers</Button><Button onClick={() => onMove(1)} disabled={!hasNext} className="whitespace-nowrap px-1 text-sm disabled:opacity-50 sm:px-6 sm:text-base">Next →</Button></div>
  </Card>;
}
