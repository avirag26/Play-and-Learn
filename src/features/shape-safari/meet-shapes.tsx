"use client";

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SpeakerButton } from "@/features/games/game-ui";
import { ShapeArt } from "@/features/shape-safari/shape-art";
import { capitalize, getShape, meetFacts, meetSpeech, type ShapeId } from "@/lib/shape-data";
import type { AudioErrorHandler, AudioResult } from "@/lib/speech";

type Props = {
  shape: ShapeId;
  index: number;
  total: number;
  onMove: (delta: number) => void;
  onFinish: () => void;
  /** Says the shape's name when the child taps it. */
  onTap: (shape: ShapeId) => void;
  say: (text: string, onError: AudioErrorHandler) => AudioResult;
  onStatus: (message: string) => void;
};

/** One big friendly shape at a time, with its name; tap it to hear the name again. */
export function MeetShapes({ shape, index, total, onMove, onFinish, onTap, say, onStatus }: Props) {
  // Taps on the shape now showing; each one replays the wiggle.
  const [taps, setTaps] = useState<{ shape: ShapeId; count: number }>({ shape, count: 0 });
  const wiggles = taps.shape === shape ? taps.count : 0;
  const { name, color } = getShape(shape);
  const last = index + 1 >= total;

  function tap() {
    setTaps({ shape, count: wiggles + 1 });
    onTap(shape);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" && index > 0) onMove(-1);
    else if (event.key === "ArrowRight" && !last) onMove(1);
  }

  return <Card className="mt-3 flex flex-1 flex-col gap-3 bg-white p-3 sm:mt-6 sm:gap-5 sm:p-8" onKeyDown={onKeyDown}>
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-[2rem] bg-gradient-to-b from-mint/70 to-cream p-3 text-center sm:gap-4 sm:p-6">
      <button type="button" onClick={tap} aria-label={`${capitalize(name)}. Tap to hear it again.`} className="grid w-[min(62vw,34dvh,17rem)] place-items-center rounded-[2rem] p-2 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ink">
        <span key={shape} className="shape-reveal block w-full"><span key={wiggles} className={`block w-full ${wiggles ? "shape-wiggle" : ""}`}><ShapeArt shape={shape} color={color} face className="block h-auto w-full drop-shadow-[0_6px_0_rgba(48,70,93,0.15)]" /></span></span>
      </button>
      <p key={`name-${shape}`} className="game-pop rounded-full bg-white px-6 py-1 text-[clamp(2rem,7dvh,3.5rem)] font-black leading-tight text-ink shadow-sm">{capitalize(name)}</p>
    </div>
    <p className="rounded-2xl bg-cream p-2.5 text-center text-[0.95rem] font-bold leading-snug text-ink sm:p-3 sm:text-lg">{meetFacts[shape]}</p>
    <div className="flex justify-center"><SpeakerButton label={`Hear about the ${name} again`} onPlay={(onError) => say(meetSpeech(shape), onError)} onStatus={onStatus}>Hear it again</SpeakerButton></div>
    <div className="flex items-center justify-between gap-3">
      <Button variant="secondary" onClick={() => onMove(-1)} disabled={index === 0} className="min-w-0 flex-1 whitespace-nowrap px-2 text-sm disabled:opacity-50 sm:flex-none sm:px-6 sm:text-base">← Back</Button>
      <span className="shrink-0 rounded-full bg-cream px-3 py-1 text-sm font-black text-ink" aria-label={`Shape ${index + 1} of ${total}`}>{index + 1} / {total}</span>
      <Button onClick={last ? onFinish : () => onMove(1)} className="min-w-0 flex-1 whitespace-nowrap px-2 text-sm sm:flex-none sm:px-6 sm:text-base">{last ? "All done ✓" : "Next →"}</Button>
    </div>
  </Card>;
}
