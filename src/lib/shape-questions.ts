import { getSafariObject, getShape, safariObjects, shapeColorIds, shapes, type SafariObjectId, type ShapeColorId, type ShapeId } from "@/lib/shape-data";
import { arrangeChoices, shuffle } from "@/lib/random";

/** One answer card: a shape drawn in a color. The id is stable for the same shape and color. */
export type ShapeChoice = { id: string; shape: ShapeId; color: ShapeColorId };

const choice = (shape: ShapeId, color: ShapeColorId): ShapeChoice => ({ id: `${shape}-${color}`, shape, color });

export function isCorrectShape(picked: ShapeChoice, shape: ShapeId): boolean {
  return picked.shape === shape;
}

/** Picks `length` items, never the same key twice in a row, spreading keys evenly (shuffled order breaks ties). */
function spread<T>(pool: readonly T[], length: number, key: (item: T) => string, random: () => number): T[] {
  const used = new Map<string, number>();
  const result: T[] = [];
  while (result.length < length) {
    const previous = result.length ? key(result[result.length - 1]) : null;
    const candidates = shuffle(pool, random).filter((item) => key(item) !== previous && !result.includes(item));
    if (!candidates.length) break;
    const least = Math.min(...candidates.map((item) => used.get(key(item)) ?? 0));
    const picked = candidates.find((item) => (used.get(key(item)) ?? 0) === least) ?? candidates[0];
    used.set(key(picked), (used.get(key(picked)) ?? 0) + 1);
    result.push(picked);
  }
  return result;
}

export type MatchQuestion = { id: string; target: ShapeChoice; prompt: string };
export const MATCH_SESSION_LENGTH = 8;

export const matchPrompts: readonly ((name: string) => string)[] = [
  (name) => `Can you find another ${name}?`,
  (name) => `Which one is a ${name} too?`,
  (name) => `Find the matching ${name}!`,
];

/** Every shape at least once, the same shape never twice in a row; the target's color changes each time. */
export function makeMatchSession(length = MATCH_SESSION_LENGTH, random: () => number = Math.random): MatchQuestion[] {
  const targets = shapes.flatMap((shape) => shapeColorIds.map((color) => choice(shape.id, color)));
  return spread(targets, length, (target) => target.shape, random).map((target, index) => ({ id: `match-${target.id}`, target, prompt: matchPrompts[index % matchPrompts.length](getShape(target.shape).name) }));
}

/**
 * The same shape in another color, plus two different shapes. One wrong card usually shares the
 * target's color, so the child has to look at the shape, not the color.
 */
export function makeMatchChoices(question: MatchQuestion, previousCorrectPosition = -1, random: () => number = Math.random): ShapeChoice[] {
  const { shape, color } = question.target;
  const answer = choice(shape, shuffle(shapeColorIds.filter((id) => id !== color), random)[0]);
  const [first, second] = shuffle(shapes.filter((item) => item.id !== shape), random);
  const otherColors = shuffle(shapeColorIds.filter((id) => id !== answer.color), random);
  const sameColorAsTarget = random() < 0.75;
  const distractors = [choice(first.id, sameColorAsTarget ? color : otherColors[0]), choice(second.id, otherColors[1])];
  return arrangeChoices(answer, distractors, previousCorrectPosition, random);
}

export type SafariQuestion = { id: string; object: SafariObjectId; shape: ShapeId; prompt: string };
export const SAFARI_SESSION_LENGTH = 6;

export function safariPrompt(object: SafariObjectId): string {
  return `What shape is the ${getSafariObject(object).name}?`;
}

/** One object for every shape plus one more, never the same object twice and no shape twice in a row. */
export function makeSafariSession(length = SAFARI_SESSION_LENGTH, random: () => number = Math.random): SafariQuestion[] {
  return spread(safariObjects, length, (object) => object.shape, random).map((object) => ({ id: `safari-${object.id}`, object: object.id, shape: object.shape, prompt: safariPrompt(object.id) }));
}

/** Square and rectangle look alike in a drawing of a real thing, so Shape Safari never offers both. */
const lookAlikes: Partial<Record<ShapeId, ShapeId>> = { square: "rectangle", rectangle: "square" };

/** The object's shape and two clearly different ones, each in its own color with its name. */
export function makeSafariChoices(question: SafariQuestion, previousCorrectPosition = -1, random: () => number = Math.random): ShapeChoice[] {
  const others = shuffle(shapes.filter((item) => item.id !== question.shape && item.id !== lookAlikes[question.shape]), random).slice(0, 2);
  const own = (id: ShapeId) => choice(id, getShape(id).color);
  return arrangeChoices(own(question.shape), others.map((item) => own(item.id)), previousCorrectPosition, random);
}

/** "That's a square. A triangle has 3 sides and 3 corners." Follows a "try again" phrase. */
export function wrongShapeHint(picked: ShapeId, hint: string): string {
  return `That's a ${getShape(picked).name}. ${hint}`;
}
