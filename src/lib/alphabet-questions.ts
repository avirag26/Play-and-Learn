import { alphabet, type AlphabetEntry } from "@/lib/alphabet-data";

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function makeQuestionOrder(random: () => number = Math.random): number[] {
  return shuffle(alphabet.map((_, index) => index), random);
}

export function makeChoices(targetIndex: number, previousCorrectPosition = -1, random: () => number = Math.random): AlphabetEntry[] {
  const target = alphabet[targetIndex];
  const distractors = shuffle(alphabet.filter((item) => item.upper !== target.upper), random).slice(0, 2);
  const choices = shuffle([target, ...distractors], random);
  const correctPosition = choices.findIndex((item) => item.upper === target.upper);
  if (correctPosition === previousCorrectPosition) {
    const otherPosition = (correctPosition + 1) % choices.length;
    [choices[correctPosition], choices[otherPosition]] = [choices[otherPosition], choices[correctPosition]];
  }
  return choices;
}
