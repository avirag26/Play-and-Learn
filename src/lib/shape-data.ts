export type ShapeId = "circle" | "square" | "triangle" | "rectangle" | "star";

export type Shape = {
  id: ShapeId;
  name: string;
  /** Short and concrete; used as the gentle hint after a wrong answer. */
  hint: string;
  /** The shape's own color in Meet the Shapes. */
  color: ShapeColorId;
};

export const shapes: readonly Shape[] = [
  { id: "circle", name: "circle", hint: "A circle is round, with no corners.", color: "coral" },
  { id: "square", name: "square", hint: "A square has 4 sides, all the same size.", color: "blue" },
  { id: "triangle", name: "triangle", hint: "A triangle has 3 sides and 3 corners.", color: "green" },
  { id: "rectangle", name: "rectangle", hint: "A rectangle has 2 long sides and 2 short sides.", color: "purple" },
  { id: "star", name: "star", hint: "A star has 5 pointy points.", color: "yellow" },
];

/** Level 1 introduces the three first shapes; Match and Safari use all five. */
export const meetShapeIds: readonly ShapeId[] = ["circle", "square", "triangle"];

export type ShapeColorId = "coral" | "blue" | "green" | "purple" | "yellow" | "orange";
/** Bright fills; every shape also has a dark outline, so it stands out on any card. */
export const shapeColors: Record<ShapeColorId, string> = { coral: "#ff8fa3", blue: "#76aae0", green: "#7ad9a6", purple: "#b49cff", yellow: "#ffd968", orange: "#ffb36b" };
export const shapeColorIds = Object.keys(shapeColors) as ShapeColorId[];
/** For screen readers: "pink triangle". */
export const shapeColorNames: Record<ShapeColorId, string> = { coral: "pink", blue: "blue", green: "green", purple: "purple", yellow: "yellow", orange: "orange" };

const shapeIds = new Set<string>(shapes.map((shape) => shape.id));
export function isShapeId(value: unknown): value is ShapeId { return typeof value === "string" && shapeIds.has(value); }
export function getShape(id: ShapeId): Shape { return shapes.find((shape) => shape.id === id) ?? shapes[0]; }

export function capitalize(text: string): string { return text.charAt(0).toUpperCase() + text.slice(1); }

/** "Look! This is a circle. Can you say circle?" */
export function meetSpeech(id: ShapeId): string {
  const { name } = getShape(id);
  return `Look! This is a ${name}. Can you say ${name}?`;
}

/** What Meet the Shapes shows and says under each shape. */
export const meetFacts: Record<ShapeId, string> = {
  circle: "A circle is round. It has no corners.",
  square: "A square has 4 sides. They are all the same.",
  triangle: "A triangle has 3 sides and 3 corners.",
  rectangle: "A rectangle has 4 sides. 2 are long and 2 are short.",
  star: "A star has 5 points.",
};

export type SafariObjectId = "ball" | "clock" | "cookie" | "window" | "gift" | "pizza" | "tent" | "book" | "envelope" | "ornament" | "starfish";

export type SafariObject = {
  id: SafariObjectId;
  /** "ball": read as "the ball". */
  name: string;
  shape: ShapeId;
  /** Said after a wrong answer, pointing at what to look for. */
  hint: string;
};

/**
 * Familiar things drawn so their outline is exactly one shape (rectangles are always drawn wide,
 * like the rectangle answer card, and squares exactly square).
 */
export const safariObjects: readonly SafariObject[] = [
  { id: "ball", name: "ball", shape: "circle", hint: "The ball is round all the way around." },
  { id: "clock", name: "clock", shape: "circle", hint: "The clock is round, with no corners." },
  { id: "cookie", name: "cookie", shape: "circle", hint: "The cookie is round, with no corners." },
  { id: "window", name: "window", shape: "square", hint: "The window has 4 sides, all the same size." },
  { id: "gift", name: "present", shape: "square", hint: "The present has 4 sides, all the same size." },
  { id: "pizza", name: "pizza slice", shape: "triangle", hint: "The pizza slice has 3 sides and 3 corners." },
  { id: "tent", name: "tent", shape: "triangle", hint: "The tent has 3 sides and 3 corners." },
  { id: "book", name: "book", shape: "rectangle", hint: "The book has 2 long sides and 2 short sides." },
  { id: "envelope", name: "envelope", shape: "rectangle", hint: "The envelope has 2 long sides and 2 short sides." },
  { id: "ornament", name: "star decoration", shape: "star", hint: "The decoration has 5 pointy points." },
  { id: "starfish", name: "starfish", shape: "star", hint: "The starfish has 5 pointy arms." },
];

const objectIds = new Set<string>(safariObjects.map((object) => object.id));
export function isSafariObjectId(value: unknown): value is SafariObjectId { return typeof value === "string" && objectIds.has(value); }
export function getSafariObject(id: SafariObjectId): SafariObject { return safariObjects.find((object) => object.id === id) ?? safariObjects[0]; }
