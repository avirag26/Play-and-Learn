export type PictureId = "flower" | "house" | "balloons" | "butterfly" | "rainbow";

/** A tappable area. Regions are drawn in order, so later regions sit on top. */
export type PictureRegion = { id: string; label: string; d: string; transform?: string };

export type ColoringPicture = {
  id: PictureId;
  name: string;
  emoji: string;
  regions: readonly PictureRegion[];
  /** Outline-only lines drawn on top that cannot be colored (strings, antennae). */
  lines?: readonly string[];
};

export function circlePath(cx: number, cy: number, r: number): string {
  return ellipsePath(cx, cy, r, r);
}

export function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;
}

/** A half-ring from radius `inner` to `outer`, centred on (cx, cy). */
function arcBand(cx: number, cy: number, outer: number, inner: number): string {
  return `M${cx - outer} ${cy}A${outer} ${outer} 0 0 1 ${cx + outer} ${cy}L${cx + inner} ${cy}A${inner} ${inner} 0 0 0 ${cx - inner} ${cy}Z`;
}

/** A puffy cloud with a flat bottom, as one outline. */
function cloud(cx: number, cy: number): string {
  return `M${cx - 26} ${cy + 15}A12 12 0 0 1 ${cx - 22} ${cy - 6}A16 16 0 0 1 ${cx + 6} ${cy - 14}A13 13 0 0 1 ${cx + 25} ${cy - 1}A9 9 0 0 1 ${cx + 26} ${cy + 15}Z`;
}

// Original, simple outline pictures in a 200 × 200 box.
export const pictures: readonly ColoringPicture[] = [
  {
    id: "flower", name: "Flower", emoji: "🌼",
    regions: [
      { id: "sky", label: "Sky", d: "M0 0H200V200H0Z" },
      { id: "grass", label: "Grass", d: "M0 172C40 162 70 168 100 170C130 172 160 160 200 168V200H0Z" },
      { id: "stem", label: "Stem", d: "M96 100H104V186H96Z" },
      { id: "leaf-left", label: "Left leaf", d: "M96 150C80 128 58 128 46 140C60 156 80 158 96 150Z" },
      { id: "leaf-right", label: "Right leaf", d: "M104 162C120 140 142 140 154 152C140 168 120 170 104 162Z" },
      ...[0, 60, 120, 180, 240, 300].map((angle, position): PictureRegion => ({ id: `petal-${position + 1}`, label: `Petal ${position + 1}`, d: ellipsePath(100, 42, 15, 25), transform: `rotate(${angle} 100 70)` })),
      { id: "middle", label: "Flower middle", d: circlePath(100, 70, 17) },
    ],
  },
  {
    id: "house", name: "House", emoji: "🏠",
    regions: [
      { id: "sky", label: "Sky", d: "M0 0H200V200H0Z" },
      { id: "sun", label: "Sun", d: circlePath(170, 30, 16) },
      { id: "grass", label: "Grass", d: "M0 168H200V200H0Z" },
      { id: "chimney", label: "Chimney", d: "M128 44H146V86H128Z" },
      { id: "walls", label: "Walls", d: "M46 94H154V176H46Z" },
      { id: "roof", label: "Roof", d: "M34 100L100 40L166 100Z" },
      { id: "door", label: "Door", d: "M87 128H113V176H87Z" },
      { id: "window-left", label: "Left window", d: "M58 110H80V132H58Z" },
      { id: "window-right", label: "Right window", d: "M120 110H142V132H120Z" },
    ],
  },
  {
    id: "balloons", name: "Balloons", emoji: "🎈",
    regions: [
      { id: "sky", label: "Sky", d: "M0 0H200V200H0Z" },
      { id: "cloud", label: "Cloud", d: cloud(160, 170) },
      { id: "balloon-left", label: "Left balloon", d: ellipsePath(60, 78, 27, 34) },
      { id: "balloon-right", label: "Right balloon", d: ellipsePath(140, 78, 27, 34) },
      { id: "balloon-middle", label: "Middle balloon", d: ellipsePath(100, 58, 27, 34) },
    ],
    lines: ["M60 112C66 140 90 150 100 176", "M140 112C134 140 110 150 100 176", "M100 92C96 120 104 150 100 176"],
  },
  {
    id: "butterfly", name: "Butterfly", emoji: "🦋",
    regions: [
      { id: "sky", label: "Sky", d: "M0 0H200V200H0Z" },
      { id: "wing-top-left", label: "Top left wing", d: "M100 96C72 40 24 42 32 90C38 112 78 112 100 102Z" },
      { id: "wing-top-right", label: "Top right wing", d: "M100 96C128 40 176 42 168 90C162 112 122 112 100 102Z" },
      { id: "wing-bottom-left", label: "Bottom left wing", d: "M100 106C74 110 44 126 54 156C64 176 94 152 100 118Z" },
      { id: "wing-bottom-right", label: "Bottom right wing", d: "M100 106C126 110 156 126 146 156C136 176 106 152 100 118Z" },
      { id: "spot-left", label: "Left wing spot", d: circlePath(60, 80, 11) },
      { id: "spot-right", label: "Right wing spot", d: circlePath(140, 80, 11) },
      { id: "body", label: "Body", d: ellipsePath(100, 112, 8, 40) },
    ],
    lines: ["M96 76C92 58 86 50 78 44", "M104 76C108 58 114 50 122 44"],
  },
  {
    id: "rainbow", name: "Rainbow", emoji: "🌈",
    regions: [
      { id: "sky", label: "Sky", d: "M0 0H200V200H0Z" },
      ...[92, 79, 66, 53, 40].map((outer, position): PictureRegion => ({ id: `stripe-${position + 1}`, label: `Rainbow stripe ${position + 1}`, d: arcBand(100, 150, outer, outer - 13) })),
      { id: "cloud-left", label: "Left cloud", d: cloud(28, 148) },
      { id: "cloud-right", label: "Right cloud", d: cloud(172, 148) },
    ],
  },
];

const pictureIds = new Set<string>(pictures.map((picture) => picture.id));
export function isPictureId(value: unknown): value is PictureId { return typeof value === "string" && pictureIds.has(value); }
export function getPicture(id: PictureId): ColoringPicture { return pictures.find((picture) => picture.id === id) ?? pictures[0]; }
