export type CountObjectId = "star" | "apple" | "balloon" | "flower" | "toy";

export type CountObject = {
  id: CountObjectId;
  /** Platform emoji for everything except stars, which are drawn as an SVG. */
  emoji: string;
  one: string;
  many: string;
};

export const countObjects: readonly CountObject[] = [
  { id: "star", emoji: "⭐", one: "star", many: "stars" },
  { id: "apple", emoji: "🍎", one: "apple", many: "apples" },
  { id: "balloon", emoji: "🎈", one: "balloon", many: "balloons" },
  { id: "flower", emoji: "🌸", one: "flower", many: "flowers" },
  { id: "toy", emoji: "🧸", one: "toy", many: "toys" },
];

export const MAX_NUMBER = 10;
export const numbers: readonly number[] = Array.from({ length: MAX_NUMBER }, (_, index) => index + 1);
export const numberWords: readonly string[] = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

const objectIds = new Set<string>(countObjects.map((object) => object.id));
export function isCountObjectId(value: unknown): value is CountObjectId { return typeof value === "string" && objectIds.has(value); }
export function getCountObject(id: CountObjectId): CountObject { return countObjects.find((object) => object.id === id) ?? countObjects[0]; }
export function isNumber(value: unknown): value is number { return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= MAX_NUMBER; }

/** "one star", "three apples". */
export function countPhrase(count: number, id: CountObjectId): string {
  const object = getCountObject(id);
  return `${numberWords[count] ?? count} ${count === 1 ? object.one : object.many}`;
}

export function capitalize(text: string): string { return text.charAt(0).toUpperCase() + text.slice(1); }

/** Meet the Numbers is mostly stars, with an occasional apple, balloon, flower, or toy. */
const meetObjects: readonly CountObjectId[] = ["star", "star", "apple", "star", "balloon", "star", "flower", "star", "toy", "star"];
export function meetObjectFor(count: number): CountObjectId { return meetObjects[(count - 1) % meetObjects.length]; }

/** What Meet the Numbers says for a number: "Three! Three apples." */
export function meetSpeech(count: number): string {
  return `${capitalize(numberWords[count])}! ${capitalize(countPhrase(count, meetObjectFor(count)))}.`;
}

export type AdventureChallenge = {
  id: string;
  /** Short words a child can follow, also read aloud. */
  prompt: string;
  goal: number;
  object: CountObjectId;
  /** The friend being helped. */
  helper: { emoji: string; name: string };
  /** Said when the goal is reached. */
  success: string;
};

/** Short playful goals, getting a little bigger as they go. */
export const adventureChallenges: readonly AdventureChallenge[] = [
  { id: "collect-5-stars", prompt: "Collect 5 stars!", goal: 5, object: "star", helper: { emoji: "🚀", name: "the rocket" }, success: "Five stars for the rocket. Blast off!" },
  { id: "find-3-apples", prompt: "Find 3 apples!", goal: 3, object: "apple", helper: { emoji: "🐛", name: "the caterpillar" }, success: "Three apples. The caterpillar says thank you!" },
  { id: "teddy-2-toys", prompt: "Give the teddy bear 2 toys!", goal: 2, object: "toy", helper: { emoji: "🐻", name: "the teddy bear" }, success: "Two toys. The teddy bear is so happy!" },
  { id: "catch-4-balloons", prompt: "Catch 4 balloons!", goal: 4, object: "balloon", helper: { emoji: "🦊", name: "the fox" }, success: "Four balloons for the party!" },
  { id: "bunny-7-flowers", prompt: "Help the bunny collect 7 flowers!", goal: 7, object: "flower", helper: { emoji: "🐰", name: "the bunny" }, success: "Seven flowers. What a pretty bunch!" },
  { id: "collect-10-stars", prompt: "Fill the sky with 10 stars!", goal: 10, object: "star", helper: { emoji: "🌙", name: "the moon" }, success: "Ten stars! The sky is sparkling!" },
];

export type CountingMission = { id: string; title: string; instruction: string; tip: string };

/** Optional real-world counting a grown-up supervises. Nothing is photographed or recorded. */
export const countingMissions: readonly CountingMission[] = [
  { id: "count-fingers", title: "Finger count", instruction: "Hold up one hand and count your fingers with a grown-up.", tip: "Then try counting all ten fingers together." },
  { id: "count-spoons", title: "Spoon count", instruction: "Ask a grown-up for 4 spoons. Line them up and count them.", tip: "A grown-up hands over and collects the spoons." },
  { id: "count-claps", title: "Clap and count", instruction: "Clap 6 times and count each clap out loud.", tip: "Take turns: you clap, then the child counts." },
  { id: "count-toys", title: "Toy line-up", instruction: "Line up 3 soft toys and count them from left to right.", tip: "Choose toys with no small loose parts." },
];

export const countingMissionSafety = "A grown-up stays nearby, chooses safe objects, and confirms each mission.";

const challengeIds = new Set(adventureChallenges.map((challenge) => challenge.id));
const missionIds = new Set(countingMissions.map((mission) => mission.id));
export function isChallengeId(value: unknown): value is string { return typeof value === "string" && challengeIds.has(value); }
export function isCountingMissionId(value: unknown): value is string { return typeof value === "string" && missionIds.has(value); }
