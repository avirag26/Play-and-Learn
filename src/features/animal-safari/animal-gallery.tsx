import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimalArt } from "@/features/animal-safari/animal-art";
import { animals, habitats, type AnimalId, type Habitat } from "@/lib/animal-data";

export function AnimalGallery({ habitat, onHabitat, discovered, onOpen, onDone }: { habitat: Habitat; onHabitat: (habitat: Habitat) => void; discovered: readonly AnimalId[]; onOpen: (id: AnimalId) => void; onDone: () => void }) {
  const current = habitats.find((item) => item.id === habitat) ?? habitats[0];
  return <Card className="mt-3 flex flex-1 flex-col gap-3 bg-white p-3 sm:mt-6 sm:gap-5 sm:p-8 [@media(max-height:700px)]:gap-2">
    <div role="tablist" aria-label="Animal homes" className="grid grid-cols-4 gap-1.5 sm:gap-3">{habitats.map((item) => <button key={item.id} type="button" role="tab" aria-selected={item.id === habitat} onClick={() => onHabitat(item.id)} className={`flex min-h-14 [@media(max-height:700px)]:min-h-12 min-w-0 flex-col items-center justify-center rounded-2xl border-2 px-1 text-[0.7rem] font-black leading-tight text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink sm:text-sm ${item.id === habitat ? `border-ink ${item.tint}` : "border-transparent bg-cream"}`}><span aria-hidden="true" className="text-xl sm:text-2xl">{item.emoji}</span>{item.label}</button>)}</div>
    <div role="tabpanel" aria-label={`${current.label} animals`} className={`grid min-h-0 flex-1 grid-cols-3 gap-2 rounded-3xl p-2 sm:gap-4 sm:p-4 ${current.tint}`}>{animals.filter((animal) => animal.habitat === habitat).map((animal) => {
      const met = discovered.includes(animal.id);
      return <button key={animal.id} type="button" onClick={() => onOpen(animal.id)} aria-label={`Meet the ${animal.name.toLowerCase()}${met ? ", already met" : ""}`} className="relative flex min-h-24 [@media(max-height:700px)]:min-h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl bg-white p-1 text-center shadow-[0_4px_0_rgba(42,91,145,0.15)] transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"><AnimalArt animal={animal} size="tile" /><span className="block max-w-full truncate text-xs font-black text-ink sm:text-base">{animal.name}</span>{met ? <span aria-hidden="true" className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-mint text-[0.65rem] font-black text-ink">✓</span> : null}</button>;
    })}</div>
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-muted-ink">Tap an animal to say hello!</p><Button onClick={onDone} className="shrink-0 whitespace-nowrap px-4 text-sm sm:px-6 sm:text-base">I&apos;m done</Button></div>
  </Card>;
}
