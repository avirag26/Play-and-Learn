import type { ShapeId } from "@/lib/color-questions";

const outline = { stroke: "#30465d", strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points = Array.from({ length: 10 }, (_, position) => {
    const radius = position % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + position * Math.PI / 5;
    return `${(cx + radius * Math.cos(angle)).toFixed(1)} ${(cy + radius * Math.sin(angle)).toFixed(1)}`;
  });
  return `M${points.join("L")}Z`;
}

// Each object is a single color with an ink outline, so white still shows on a light card.
const bodies: Record<ShapeId, { fill: string; lines?: string }> = {
  balloon: { fill: "M50 6C72 6 84 24 84 42C84 62 66 76 50 78C34 76 16 62 16 42C16 24 28 6 50 6ZM45 78H55L50 85Z", lines: "M50 85C44 90 56 94 50 99" },
  star: { fill: starPath(50, 54, 46, 20) },
  heart: { fill: "M50 88C20 66 6 48 10 30C14 14 34 8 50 26C66 8 86 14 90 30C94 48 80 66 50 88Z" },
  ball: { fill: "M10 50a40 40 0 1 0 80 0a40 40 0 1 0-80 0Z", lines: "M28 32C34 24 42 20 50 19" },
  kite: { fill: "M50 4L82 40L50 80L18 40Z", lines: "M50 4V80M18 40H82M50 80C40 88 60 92 50 99" },
};

export const shapeNames: Record<ShapeId, string> = { balloon: "balloon", star: "star", heart: "heart", ball: "ball", kite: "kite" };

export function ColorObject({ shape, hex, className = "" }: { shape: ShapeId; hex: string; className?: string }) {
  const body = bodies[shape];
  return <svg viewBox="0 0 100 100" aria-hidden="true" className={className}><path d={body.fill} fill={hex} {...outline} />{body.lines ? <path d={body.lines} fill="none" {...outline} strokeWidth={2} /> : null}</svg>;
}
