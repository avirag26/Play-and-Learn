export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

// Shuffles the answer in with its distractors, nudging it off the slot the previous answer used.
export function arrangeChoices<T>(answer: T, distractors: readonly T[], previousCorrectPosition = -1, random: () => number = Math.random): T[] {
  const choices = shuffle([answer, ...distractors], random);
  const correctPosition = choices.indexOf(answer);
  if (correctPosition === previousCorrectPosition) {
    const otherPosition = (correctPosition + 1) % choices.length;
    [choices[correctPosition], choices[otherPosition]] = [choices[otherPosition], choices[correctPosition]];
  }
  return choices;
}
