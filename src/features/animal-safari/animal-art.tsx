import type { AnimalEntry } from "@/lib/animal-data";

const sizes = {
  hero: "text-[clamp(3.5rem,14dvh,9rem)] sm:text-[9rem]",
  choice: "text-[clamp(2.5rem,8dvh,4.5rem)] sm:text-7xl",
  tile: "text-[clamp(2.25rem,6.5dvh,3.75rem)] sm:text-6xl",
};

/** Emoji illustration with real alt text; emoji are rendered locally, so they can never show as broken images. */
export function AnimalArt({ animal, size }: { animal: AnimalEntry; size: keyof typeof sizes }) {
  return <span role="img" aria-label={animal.alt} className={`block select-none leading-none ${sizes[size]}`}>{animal.illustration}</span>;
}
