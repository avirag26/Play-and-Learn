import { animals, getAnimal, type AnimalEntry, type AnimalId } from "@/lib/animal-data";
import { animalSoundFiles } from "@/lib/animal-sounds";
import { arrangeChoices, shuffle } from "@/lib/random";

export type FindQuestion = {
  id: string;
  kind: "name" | "habitat" | "trait";
  prompt: string;
  answer: AnimalId;
  /** Animals that clearly do NOT fit the prompt; two are picked as wrong answers. */
  distractors: readonly AnimalId[];
};

const ocean: AnimalId[] = ["dolphin", "whale", "turtle", "octopus", "crab", "fish"];
const farm: AnimalId[] = ["cow", "horse", "sheep", "pig", "chicken", "duck"];
const forest: AnimalId[] = ["fox", "owl", "bear"];

// Distractor lists leave out borderline animals (e.g. ducks and frogs for "ocean", monkeys for "forest").
const traitAndHabitatSets: { id: string; kind: "habitat" | "trait"; prompt: string; answers: AnimalId[]; distractors: AnimalId[] }[] = [
  { id: "ocean", kind: "habitat", prompt: "Which animal lives in the ocean?", answers: ocean, distractors: ["lion", "elephant", "giraffe", "zebra", "monkey", "cow", "horse", "sheep", "pig", "chicken", "rabbit", "fox", "owl", "bear", "butterfly"] },
  { id: "farm", kind: "habitat", prompt: "Which animal lives on a farm?", answers: farm, distractors: ["lion", "elephant", "giraffe", "zebra", "hippopotamus", "monkey", "dolphin", "whale", "octopus", "crab", "bear"] },
  { id: "forest", kind: "habitat", prompt: "Which animal lives in the forest?", answers: forest, distractors: ["dolphin", "whale", "octopus", "crab", "fish", "zebra", "giraffe", "cow", "sheep", "pig"] },
  { id: "long-neck", kind: "trait", prompt: "Which animal has a long neck?", answers: ["giraffe"], distractors: ["pig", "sheep", "cow", "rabbit", "frog", "crab", "fish", "octopus", "lion", "bear", "owl", "monkey"] },
  { id: "hop", kind: "trait", prompt: "Which animal can hop?", answers: ["rabbit", "frog"], distractors: ["cow", "elephant", "giraffe", "whale", "fish", "octopus", "turtle", "pig", "hippopotamus"] },
  { id: "feathers", kind: "trait", prompt: "Which animal has feathers?", answers: ["owl", "chicken", "duck"], distractors: ["pig", "cow", "fish", "elephant", "frog", "dolphin", "lion", "crab", "sheep", "zebra", "rabbit", "octopus"] },
  { id: "trunk", kind: "trait", prompt: "Which animal has a long trunk?", answers: ["elephant"], distractors: ["giraffe", "lion", "cow", "rabbit", "duck", "fish", "frog", "owl", "pig", "zebra"] },
  { id: "stripes", kind: "trait", prompt: "Which animal has black and white stripes?", answers: ["zebra"], distractors: ["elephant", "pig", "frog", "dolphin", "crab", "duck", "sheep", "owl", "rabbit", "monkey"] },
  { id: "eight-arms", kind: "trait", prompt: "Which animal has eight arms?", answers: ["octopus"], distractors: ["lion", "cow", "duck", "rabbit", "giraffe", "elephant", "fish", "frog", "owl", "pig"] },
  { id: "fly", kind: "trait", prompt: "Which animal can fly?", answers: ["owl", "butterfly"], distractors: ["pig", "cow", "elephant", "fish", "crab", "frog", "turtle", "giraffe", "hippopotamus", "sheep", "octopus", "whale"] },
  { id: "shell", kind: "trait", prompt: "Which animal has a hard shell?", answers: ["turtle", "crab"], distractors: ["lion", "cow", "rabbit", "owl", "horse", "sheep", "giraffe", "elephant", "pig", "fox", "monkey", "zebra"] },
  { id: "wool", kind: "trait", prompt: "Which animal has a woolly coat?", answers: ["sheep"], distractors: ["pig", "fish", "frog", "lion", "dolphin", "duck", "elephant", "crab", "giraffe", "owl"] },
  { id: "moo", kind: "trait", prompt: "Which animal says moo?", answers: ["cow"], distractors: ["lion", "duck", "fish", "owl", "frog", "elephant", "rabbit", "crab", "butterfly"] },
  { id: "bushy-tail", kind: "trait", prompt: "Which animal has a big, bushy tail?", answers: ["fox"], distractors: ["fish", "frog", "crab", "elephant", "octopus", "duck", "owl", "whale", "turtle", "pig"] },
];

export const findQuestions: readonly FindQuestion[] = [
  ...animals.map((animal): FindQuestion => ({ id: `name-${animal.id}`, kind: "name", prompt: `Can you find the ${animal.name.toLowerCase()}?`, answer: animal.id, distractors: animals.filter((other) => other.id !== animal.id).map((other) => other.id) })),
  ...traitAndHabitatSets.flatMap((set) => set.answers.map((answer): FindQuestion => ({ id: `${set.id}-${answer}`, kind: set.kind, prompt: set.prompt, answer, distractors: set.distractors }))),
];

export const SESSION_LENGTH = 8;
export const MIN_SOUND_ANIMALS = 3;

/** Mixes name, habitat and trait questions; no prompt or answer animal repeats within a session. */
export function makeFindSession(length = SESSION_LENGTH, random: () => number = Math.random): FindQuestion[] {
  const names = shuffle(findQuestions.filter((question) => question.kind === "name"), random);
  const others = shuffle(findQuestions.filter((question) => question.kind !== "name"), random);
  const picked: FindQuestion[] = [];
  const usedAnswers = new Set<AnimalId>();
  const usedPrompts = new Set<string>();
  const take = (pool: FindQuestion[], count: number) => {
    for (const question of pool) {
      if (picked.length >= length || count === 0) return;
      if (usedAnswers.has(question.answer) || usedPrompts.has(question.prompt)) continue;
      picked.push(question);
      usedAnswers.add(question.answer);
      usedPrompts.add(question.prompt);
      count--;
    }
  };
  take(others, length - Math.floor(length / 3));
  take(names, length - picked.length);
  return shuffle(picked, random);
}

export function makeFindChoices(question: FindQuestion, previousCorrectPosition = -1, random: () => number = Math.random): AnimalEntry[] {
  const distractors = shuffle(question.distractors, random).slice(0, 2).map(getAnimal);
  return arrangeChoices(getAnimal(question.answer), distractors, previousCorrectPosition, random);
}

export function soundAnimals(files: Partial<Record<AnimalId, string>> = animalSoundFiles): AnimalEntry[] {
  return animals.filter((animal) => Boolean(files[animal.id]));
}

export function makeSoundSession(available: readonly AnimalEntry[], length = SESSION_LENGTH, random: () => number = Math.random): AnimalEntry[] {
  return shuffle(available, random).slice(0, Math.min(length, available.length));
}

export function makeSoundChoices(answer: AnimalEntry, previousCorrectPosition = -1, random: () => number = Math.random): AnimalEntry[] {
  const distractors = shuffle(animals.filter((animal) => animal.id !== answer.id), random).slice(0, 2);
  return arrangeChoices(answer, distractors, previousCorrectPosition, random);
}
