import { colors, looksAlike, type ColorId } from "@/lib/color-data";
import { arrangeChoices, shuffle } from "@/lib/random";

export type ShapeId = "balloon" | "star" | "heart" | "ball" | "kite";
export const shapes: readonly ShapeId[] = ["balloon", "star", "heart", "ball", "kite"];

export type ColorQuestion = { id: string; color: ColorId; prompt: string };
export type ColorChoice = { id: string; color: ColorId; shape: ShapeId };

const promptTemplates: readonly ((color: string) => string)[] = [
  (color) => `Find something ${color}!`,
  (color) => `Which one is ${color}?`,
  (color) => `Tap the ${color} one!`,
];

/** Every prompt for every color: 30 variations. */
export const colorQuestions: readonly ColorQuestion[] = colors.flatMap((color) => promptTemplates.map((template, position): ColorQuestion => ({ id: `${color.id}-${position}`, color: color.id, prompt: template(color.name.toLowerCase()) })));

export const COLOR_SESSION_LENGTH = 10;

/** One question per color (so no color repeats), each with a random prompt, in random order. */
export function makeColorSession(length = COLOR_SESSION_LENGTH, random: () => number = Math.random): ColorQuestion[] {
  return shuffle(colors, random).slice(0, Math.min(length, colors.length)).map((color) => {
    const options = colorQuestions.filter((question) => question.color === color.id);
    return options[Math.floor(random() * options.length)];
  });
}

/** The answer plus wrong answers in clearly different colors, each drawn as a different shape. */
export function makeColorChoices(question: ColorQuestion, previousCorrectPosition = -1, random: () => number = Math.random, count = 3): ColorChoice[] {
  const pickedShapes = shuffle(shapes, random).slice(0, count);
  const wrongColors = shuffle(colors.filter((color) => !looksAlike(color.id, question.color)), random).slice(0, count - 1);
  const answer: ColorChoice = { id: `${question.color}-${pickedShapes[0]}`, color: question.color, shape: pickedShapes[0] };
  const distractors = wrongColors.map((color, position): ColorChoice => ({ id: `${color.id}-${pickedShapes[position + 1]}`, color: color.id, shape: pickedShapes[position + 1] }));
  return arrangeChoices(answer, distractors, previousCorrectPosition, random);
}

export function isCorrectChoice(question: ColorQuestion, choice: ColorChoice): boolean {
  return choice.color === question.color;
}
