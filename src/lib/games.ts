import { MIN_SOUND_ANIMALS, soundAnimals } from "@/lib/animal-questions";

export type GameListing = {
  id: string;
  title: string;
  description: string;
  href: string;
  emoji: string;
  /** Background for the game's art bubble. */
  tint: string;
  /** The ways to play inside the game, shown on the Games page. */
  modes: readonly { emoji: string; label: string; soon?: boolean }[];
};

// Every playable game, in the order shown on the home screen and Games page.
export const games: readonly GameListing[] = [
  { id: "alphabet-adventure", title: "Alphabet Adventure", description: "Letters A to Z", href: "/alphabet-adventure", emoji: "🔤", tint: "bg-lavender/60", modes: [{ emoji: "🔤", label: "Discover" }, { emoji: "🔎", label: "Find" }, { emoji: "🧩", label: "Match" }] },
  { id: "animal-safari", title: "Animal Safari", description: "Meet the animals", href: "/animal-safari", emoji: "🦁", tint: "bg-sunshine/60", modes: [{ emoji: "🐾", label: "Meet" }, { emoji: "🎧", label: "Sounds", soon: soundAnimals().length < MIN_SOUND_ANIMALS }, { emoji: "🔍", label: "Find" }] },
  { id: "color-quest", title: "Color Quest", description: "Colors all around", href: "/color-quest", emoji: "🎨", tint: "bg-coral/50", modes: [{ emoji: "🌈", label: "Meet" }, { emoji: "🔍", label: "Find" }, { emoji: "🖍️", label: "Color" }, { emoji: "🕵️", label: "Detective" }] },
];
