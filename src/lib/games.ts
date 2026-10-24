import { MIN_SOUND_ANIMALS, soundAnimals } from "@/lib/animal-questions";

export type GameListing = {
  id: string;
  title: string;
  description: string;
  /** One word for the home screen's Quick Learning tiles. */
  short: string;
  href: string;
  emoji: string;
  /** Background for the game's art bubble. */
  tint: string;
  /** The ways to play inside the game, shown on the Games page. */
  modes: readonly { emoji: string; label: string; soon?: boolean }[];
};

// Every playable game, in the order shown on the home screen and Games page.
export const games: readonly GameListing[] = [
  { id: "alphabet-adventure", title: "Alphabet Adventure", short: "Letters", description: "Letters A to Z", href: "/alphabet-adventure", emoji: "🔤", tint: "bg-lavender/60", modes: [{ emoji: "🔤", label: "Discover" }, { emoji: "🔎", label: "Find" }, { emoji: "🧩", label: "Match" }] },
  { id: "animal-safari", title: "Animal Safari", short: "Animals", description: "Meet the animals", href: "/animal-safari", emoji: "🦁", tint: "bg-sunshine/60", modes: [{ emoji: "🐾", label: "Meet" }, { emoji: "🎧", label: "Sounds", soon: soundAnimals().length < MIN_SOUND_ANIMALS }, { emoji: "🔍", label: "Find" }] },
  { id: "color-quest", title: "Color Quest", short: "Colors", description: "Colors all around", href: "/color-quest", emoji: "🎨", tint: "bg-coral/50", modes: [{ emoji: "🌈", label: "Meet" }, { emoji: "🔍", label: "Find" }, { emoji: "🖍️", label: "Color" }, { emoji: "🕵️", label: "Detective" }] },
  { id: "count-the-stars", title: "Count the Stars", short: "Numbers", description: "Numbers 1 to 10", href: "/count-the-stars", emoji: "⭐", tint: "bg-sky", modes: [{ emoji: "🔢", label: "Meet" }, { emoji: "👆", label: "Count" }, { emoji: "🧩", label: "Match" }, { emoji: "🚀", label: "Adventure" }] },
  { id: "shape-safari", title: "Shape Safari", short: "Shapes", description: "Circles, squares and more", href: "/shape-safari", emoji: "🔺", tint: "bg-mint", modes: [{ emoji: "👋", label: "Meet" }, { emoji: "🧩", label: "Match" }, { emoji: "🧭", label: "Safari" }] },
];
