import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SpeakerButton } from "@/features/games/game-ui";
import { AnimalArt } from "@/features/animal-safari/animal-art";
import { habitats, type AnimalEntry } from "@/lib/animal-data";
import type { AudioErrorHandler, AudioResult } from "@/lib/speech";

type Props = {
  animal: AnimalEntry;
  soundFile?: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onBack: () => void;
  onMove: (delta: number) => void;
  say: (text: string, onError: AudioErrorHandler) => AudioResult;
  playSound: (src: string, onError: AudioErrorHandler) => AudioResult;
  onStatus: (message: string) => void;
};

export function AnimalDetail({ animal, soundFile, hasPrevious, hasNext, onBack, onMove, say, playSound, onStatus }: Props) {
  const habitat = habitats.find((item) => item.id === animal.habitat) ?? habitats[0];
  return <Card className="mt-3 flex flex-1 flex-col gap-2 bg-white p-3 sm:mt-6 sm:gap-5 sm:p-8">
    <div key={animal.id} className={`game-pop relative flex min-h-0 flex-1 flex-col items-center justify-center rounded-[2rem] p-3 pt-8 text-center sm:p-6 ${habitat.tint}`}><span className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-black text-ink"><span aria-hidden="true">{habitat.emoji}</span> {habitat.label}</span><AnimalArt animal={animal} size="hero" /><h3 className="mt-1 text-3xl font-black text-ink sm:mt-2 sm:text-4xl">{animal.name}</h3></div>
    <p className="rounded-2xl bg-cream p-2.5 text-center text-[0.95rem] font-bold leading-snug text-ink sm:p-3 sm:text-lg"><span aria-hidden="true">💡 </span>{animal.fact}</p>
    <div className="flex flex-wrap justify-center gap-2">
      <SpeakerButton label={`Hear the name ${animal.name}`} onPlay={(onError) => say(animal.pronunciation, onError)} onStatus={onStatus}>Name</SpeakerButton>
      <SpeakerButton label={`Hear a fact about the ${animal.name.toLowerCase()}`} icon="📖" onPlay={(onError) => say(animal.fact, onError)} onStatus={onStatus}>Fact</SpeakerButton>
      {soundFile ? <SpeakerButton label={`Hear the ${animal.name.toLowerCase()}'s real sound`} icon="🐾" onPlay={(onError) => playSound(soundFile, onError)} onStatus={onStatus}>Sound</SpeakerButton> : null}
    </div>
    <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-between sm:gap-3"><Button variant="secondary" onClick={() => onMove(-1)} disabled={!hasPrevious} className="whitespace-nowrap px-1 text-sm disabled:opacity-50 sm:px-6 sm:text-base">← Previous</Button><Button variant="secondary" onClick={onBack} className="whitespace-nowrap px-1 text-sm sm:px-6 sm:text-base">All animals</Button><Button onClick={() => onMove(1)} disabled={!hasNext} className="whitespace-nowrap px-1 text-sm disabled:opacity-50 sm:px-6 sm:text-base">Next →</Button></div>
  </Card>;
}
