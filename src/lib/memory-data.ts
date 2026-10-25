export type MemoryPictureId = "apple" | "lion" | "star" | "ball" | "fish" | "frog" | "flower" | "gift";

export type MemoryPicture = {
  id: MemoryPictureId;
  name: string;
  /** Said when a pair is found: "Two apples!". */
  many: string;
  /** Platform emoji for pictures not drawn as SVG; rendered locally, so never a broken image. */
  emoji?: string;
  /** Describes the picture for screen readers. */
  alt: string;
  /** The card face behind the picture, so each one stands out from the others. */
  tint: string;
};

// Each picture has its own main color, so no two look alike even on a small card.
export const memoryPictures: readonly MemoryPicture[] = [
  { id: "apple", name: "apple", many: "apples", emoji: "🍎", alt: "a red apple", tint: "bg-coral/40" },
  { id: "lion", name: "lion", many: "lions", emoji: "🦁", alt: "a lion with a golden mane", tint: "bg-sunshine/50" },
  { id: "star", name: "star", many: "stars", alt: "a smiling yellow star", tint: "bg-sky" },
  { id: "ball", name: "ball", many: "balls", alt: "a striped ball", tint: "bg-lavender/50" },
  { id: "fish", name: "fish", many: "fish", emoji: "🐟", alt: "a blue fish", tint: "bg-sky" },
  { id: "frog", name: "frog", many: "frogs", emoji: "🐸", alt: "a green frog", tint: "bg-mint" },
  { id: "flower", name: "flower", many: "flowers", emoji: "🌸", alt: "a pink flower", tint: "bg-mint" },
  { id: "gift", name: "present", many: "presents", alt: "a purple present with a bow", tint: "bg-sunshine/50" },
];

const pictureIds = new Set<string>(memoryPictures.map((picture) => picture.id));
export function isMemoryPictureId(value: unknown): value is MemoryPictureId { return typeof value === "string" && pictureIds.has(value); }
export function getMemoryPicture(id: MemoryPictureId): MemoryPicture { return memoryPictures.find((picture) => picture.id === id) ?? memoryPictures[0]; }
export function capitalize(text: string): string { return text.charAt(0).toUpperCase() + text.slice(1); }

// Short, kind lines only: turning over two different cards is part of playing, never a mistake.
export const memoryLines = {
  welcome: "Look, remember, match!",
  preview: "Look closely and remember!",
  start: "Let's find a match!",
  findOther: "Where is the other one?",
  miss: "Keep exploring!",
  done: "You did it! Amazing memory explorer!",
} as const;
export const matchCheers = ["You found it!", "Wonderful!", "Great job! You found a match!", "Amazing memory!", "Hooray! A match!"];

/** Said when a card is turned over, e.g. "Apple!". */
export function pictureSpeech(id: MemoryPictureId): string {
  return `${capitalize(getMemoryPicture(id).name)}!`;
}

/** Said when a pair is found, e.g. "Two apples!". */
export function matchSpeech(id: MemoryPictureId): string {
  return `Two ${getMemoryPicture(id).many}!`;
}
