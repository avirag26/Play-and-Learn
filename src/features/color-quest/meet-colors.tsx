import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SpeakerButton, audioStatusMessage } from "@/features/games/game-ui";
import { colors, type ColorEntry, type ColorId } from "@/lib/color-data";
import type { AudioErrorHandler, AudioResult } from "@/lib/speech";

/** Every color as a big tappable swatch; a tick marks colors already met. */
export function ColorGallery({ discovered, onOpen, onDone }: { discovered: readonly ColorId[]; onOpen: (id: ColorId) => void; onDone: () => void }) {
  return <Card className="mt-3 flex flex-1 flex-col gap-3 bg-white p-3 sm:mt-6 sm:gap-5 sm:p-8">
    <ul className="grid min-h-0 flex-1 grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:gap-4 md:grid-cols-5">{colors.map((color) => {
      const met = discovered.includes(color.id);
      return <li key={color.id} className="min-w-0"><button type="button" onClick={() => onOpen(color.id)} aria-label={`Meet the color ${color.name.toLowerCase()}${met ? ", already met" : ""}`} className="relative flex h-full min-h-24 w-full flex-col items-center justify-center gap-1.5 rounded-3xl bg-cream p-2 text-center shadow-[0_4px_0_rgba(42,91,145,0.15)] transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink">
        <span aria-hidden="true" className="grid size-14 place-items-center rounded-full border-4 border-ink/15 text-2xl sm:size-16" style={{ backgroundColor: color.hex }}>{color.objects[0].emoji}</span>
        <span className="text-sm font-black text-ink sm:text-base">{color.name}</span>
        {met ? <span aria-hidden="true" className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-mint text-[0.65rem] font-black text-ink">✓</span> : null}
      </button></li>;
    })}</ul>
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-muted-ink">Tap a color to hear its name!</p><Button onClick={onDone} className="shrink-0 whitespace-nowrap px-4 text-sm sm:px-6 sm:text-base">I&apos;m done</Button></div>
  </Card>;
}

type DetailProps = {
  color: ColorEntry;
  hasPrevious: boolean;
  hasNext: boolean;
  onBack: () => void;
  onMove: (delta: number) => void;
  say: (text: string, onError: AudioErrorHandler) => AudioResult;
  onStatus: (message: string) => void;
};

export function colorSpeech(color: ColorEntry): string {
  return `${color.name}! ${color.sentence}`;
}

export function ColorDetail({ color, hasPrevious, hasNext, onBack, onMove, say, onStatus }: DetailProps) {
  function hear() { onStatus(audioStatusMessage(say(colorSpeech(color), (reason) => onStatus(audioStatusMessage("unavailable", reason))))); }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" && hasPrevious) onMove(-1);
    else if (event.key === "ArrowRight" && hasNext) onMove(1);
  }
  return <Card className="mt-3 flex flex-1 flex-col gap-2 bg-white p-3 sm:mt-6 sm:gap-5 sm:p-8" onKeyDown={onKeyDown}>
    <button key={color.id} type="button" onClick={hear} aria-label={`${color.name}. Tap to hear the color name.`} className="game-pop flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-[2rem] border-4 border-ink/15 p-3 text-center sm:gap-3 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink sm:p-8" style={{ backgroundColor: color.hex }}>
      <span className="rounded-full bg-white px-6 py-1.5 text-3xl font-black text-ink shadow-sm sm:py-2 sm:text-5xl">{color.name}</span>
      <span className="grid w-full max-w-md grid-cols-3 gap-1.5 sm:gap-3">{color.objects.map((object) => <span key={object.name} className="flex min-w-0 flex-col items-center rounded-2xl bg-white/90 px-1 py-1.5 sm:px-4 sm:py-2"><span aria-hidden="true" className="text-[clamp(1.75rem,6dvh,3.5rem)] leading-none">{object.emoji}</span><span className="mt-1 text-[0.7rem] font-black leading-tight text-ink sm:text-sm">{object.name}</span></span>)}</span>
    </button>
    <p className="rounded-2xl bg-cream p-2.5 text-center text-[0.95rem] font-bold leading-snug text-ink sm:p-3 sm:text-lg"><span aria-hidden="true">🎨 </span>{color.sentence}</p>
    <div className="flex justify-center"><SpeakerButton label={`Hear the color name ${color.name}`} onPlay={(onError) => say(colorSpeech(color), onError)} onStatus={onStatus}>Hear the name</SpeakerButton></div>
    <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-between sm:gap-3"><Button variant="secondary" onClick={() => onMove(-1)} disabled={!hasPrevious} className="whitespace-nowrap px-1 text-sm disabled:opacity-50 sm:px-6 sm:text-base">← Previous</Button><Button variant="secondary" onClick={onBack} className="whitespace-nowrap px-1 text-sm sm:px-6 sm:text-base">All colors</Button><Button onClick={() => onMove(1)} disabled={!hasNext} className="whitespace-nowrap px-1 text-sm disabled:opacity-50 sm:px-6 sm:text-base">Next →</Button></div>
  </Card>;
}
