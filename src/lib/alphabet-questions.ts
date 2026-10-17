import { alphabet, type AlphabetEntry } from "@/lib/alphabet-data";
import { arrangeChoices, shuffle } from "@/lib/random";

export { shuffle };

export function makeQuestionOrder(random: () => number = Math.random): number[] {
  return shuffle(alphabet.map((_, index) => index), random);
}

export function makeChoices(targetIndex: number, previousCorrectPosition = -1, random: () => number = Math.random): AlphabetEntry[] {
  const target = alphabet[targetIndex];
  const distractors = shuffle(alphabet.filter((item) => item.upper !== target.upper), random).slice(0, 2);
  return arrangeChoices(target, distractors, previousCorrectPosition, random);
}
