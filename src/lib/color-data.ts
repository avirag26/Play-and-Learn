export type ColorId = "red" | "blue" | "yellow" | "green" | "orange" | "purple" | "pink" | "brown" | "black" | "white";

export type ColorEntry = {
  id: ColorId;
  name: string;
  /** The true color, used for swatches, quiz objects, and paint. */
  hex: string;
  /** Platform-rendered emoji: local placeholders that show things of this color. The swatch shows the real color. */
  objects: readonly { emoji: string; name: string }[];
  /** Shown and spoken on the color's card. */
  sentence: string;
};

export const colors: readonly ColorEntry[] = [
  { id: "red", name: "Red", hex: "#e53935", objects: [{ emoji: "🍎", name: "apple" }, { emoji: "🍓", name: "strawberry" }, { emoji: "🚒", name: "fire truck" }], sentence: "Apples, strawberries, and fire trucks can be red." },
  { id: "blue", name: "Blue", hex: "#1e6fd9", objects: [{ emoji: "🐳", name: "whale" }, { emoji: "💧", name: "water drop" }, { emoji: "🧢", name: "cap" }], sentence: "Whales, water drops, and caps can be blue." },
  { id: "yellow", name: "Yellow", hex: "#ffd21f", objects: [{ emoji: "🍌", name: "banana" }, { emoji: "🌻", name: "sunflower" }, { emoji: "🐤", name: "chick" }], sentence: "Bananas, sunflowers, and baby chicks can be yellow." },
  { id: "green", name: "Green", hex: "#2fa84f", objects: [{ emoji: "🐸", name: "frog" }, { emoji: "🥦", name: "broccoli" }, { emoji: "🍀", name: "clover" }], sentence: "Frogs, broccoli, and clover leaves can be green." },
  { id: "orange", name: "Orange", hex: "#ff8a1f", objects: [{ emoji: "🍊", name: "orange" }, { emoji: "🥕", name: "carrot" }, { emoji: "🎃", name: "pumpkin" }], sentence: "Oranges, carrots, and pumpkins can be orange." },
  { id: "purple", name: "Purple", hex: "#8e44c9", objects: [{ emoji: "🍇", name: "grapes" }, { emoji: "🍆", name: "eggplant" }, { emoji: "💜", name: "heart" }], sentence: "Grapes and eggplants can be purple." },
  { id: "pink", name: "Pink", hex: "#ff8fc7", objects: [{ emoji: "🌸", name: "blossom" }, { emoji: "🐷", name: "pig" }, { emoji: "🦩", name: "flamingo" }], sentence: "Blossoms, pigs, and flamingos can be pink." },
  { id: "brown", name: "Brown", hex: "#8b5a2b", objects: [{ emoji: "🐻", name: "bear" }, { emoji: "🧸", name: "teddy bear" }, { emoji: "🍪", name: "cookie" }], sentence: "Bears, teddy bears, and cookies can be brown." },
  { id: "black", name: "Black", hex: "#222222", objects: [{ emoji: "🎩", name: "top hat" }, { emoji: "🕶️", name: "sunglasses" }, { emoji: "🎱", name: "ball" }], sentence: "Top hats and sunglasses can be black." },
  { id: "white", name: "White", hex: "#ffffff", objects: [{ emoji: "☁️", name: "cloud" }, { emoji: "⛄", name: "snowman" }, { emoji: "🥚", name: "egg" }], sentence: "Clouds, snowmen, and eggs can be white." },
];

const colorIds = new Set<string>(colors.map((color) => color.id));
export function isColorId(value: unknown): value is ColorId { return typeof value === "string" && colorIds.has(value); }
export function getColor(id: ColorId): ColorEntry { return colors.find((color) => color.id === id) ?? colors[0]; }

/** Pairs a young child could reasonably mix up; they never appear together as answer and wrong answer. */
const lookAlikePairs: readonly [ColorId, ColorId][] = [["red", "pink"], ["red", "orange"], ["red", "brown"], ["orange", "yellow"], ["orange", "brown"], ["blue", "purple"], ["purple", "pink"], ["brown", "black"]];

export function looksAlike(first: ColorId, second: ColorId): boolean {
  return first === second || lookAlikePairs.some(([a, b]) => (a === first && b === second) || (a === second && b === first));
}

export type DetectiveMission = {
  id: string;
  title: string;
  /** Big, simple words a child can read; also read aloud. */
  short: string;
  /** Picture hints of things that could count. */
  examples: readonly string[];
  /** How many things to find; the child taps one circle per thing. */
  count: number;
  /** The fuller instruction for the grown-up to read along. */
  instruction: string;
  colors: readonly ColorId[];
  /** For the grown-up helping. */
  tip: string;
  safety?: string;
};

export const detectiveSafety = "Look and point. No climbing, no tasting, and ask a grown-up before you touch.";
/** The same rule in a few words a child can read. */
export const detectiveKidRule = "Look and point. Ask before you touch!";

// Indoor, adult-assisted missions: nothing is photographed or recorded.
export const detectiveMissions: readonly DetectiveMission[] = [
  { id: "three-red", title: "Three red things", short: "Find 3 red things!", examples: ["🍎", "🚒", "🍓"], count: 3, instruction: "Find three red things in your room. Point to each one and say red!", colors: ["red"], tip: "Count together on your fingers as each red thing is found." },
  { id: "yellow-room", title: "Something yellow", short: "Find something yellow!", examples: ["🍌", "🌻", "⭐"], count: 1, instruction: "Find something yellow in your room.", colors: ["yellow"], tip: "If nothing is yellow, try a book or a toy box together." },
  { id: "blue-clothes", title: "Blue clothes", short: "Find blue clothes!", examples: ["👕", "👖", "🧢"], count: 1, instruction: "Find something blue that you or your grown-up are wearing.", colors: ["blue"], tip: "Socks, shirts, and buttons all count." },
  { id: "green-window", title: "Green outside", short: "Look outside for green!", examples: ["🌳", "🌿", "🍃"], count: 1, instruction: "Look out of a window with your grown-up and find something green.", colors: ["green"], tip: "Talk about why plants are green.", safety: "Stay back from open windows and never climb to look out." },
  { id: "toy-rainbow", title: "Toy rainbow", short: "Find a red, a yellow, and a blue toy!", examples: ["🔴", "🟡", "🔵"], count: 3, instruction: "Find one red toy, one yellow toy, and one blue toy. Put them in a row.", colors: ["red", "yellow", "blue"], tip: "Choose large toys with no small loose parts." },
  { id: "two-white", title: "Two white things", short: "Find 2 white things!", examples: ["📄", "🥚", "☁️"], count: 2, instruction: "Find two white things, like a sock or a piece of paper.", colors: ["white"], tip: "Ask: is it white all over, or just a little?" },
  { id: "book-hunt", title: "Picture book hunt", short: "Find orange and purple in a book!", examples: ["📖", "🍊", "🍇"], count: 2, instruction: "Open a picture book and point to something orange and something purple.", colors: ["orange", "purple"], tip: "Name the things you find together." },
  { id: "snack-colors", title: "Snack colors", short: "Say the colors of your snack!", examples: ["🥦", "🥕", "🍪"], count: 3, instruction: "At snack time, tell your grown-up the colors of your food.", colors: ["green", "orange", "brown"], tip: "Any snack works: name each color out loud.", safety: "Only eat food a grown-up gives you." },
];

const missionIds = new Set(detectiveMissions.map((mission) => mission.id));
export function isDetectiveMissionId(value: unknown): value is string { return typeof value === "string" && missionIds.has(value); }
