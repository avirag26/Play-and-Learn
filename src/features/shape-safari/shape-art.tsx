import { shapeColors, type SafariObjectId, type ShapeColorId, type ShapeId } from "@/lib/shape-data";

const INK = "#30465d";

/** A five-pointed star around (cx, cy), drawn the same on every phone. */
function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  return Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 ? inner : outer;
    const angle = (index * Math.PI) / 5 - Math.PI / 2;
    return `${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`;
  }).join(" ");
}

/** Where each shape's little face sits, so it stays inside the outline. */
const faceCenter: Record<ShapeId, [number, number]> = { circle: [50, 52], square: [50, 52], triangle: [50, 66], rectangle: [50, 52], star: [50, 56] };

function Face({ shape }: { shape: ShapeId }) {
  const [x, y] = faceCenter[shape];
  return <g>
    <circle cx={x - 9} cy={y - 4} r="3.6" fill={INK} />
    <circle cx={x + 9} cy={y - 4} r="3.6" fill={INK} />
    <path d={`M${x - 6} ${y + 4}c3.5 4 8.5 4 12 0`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    <circle cx={x - 15} cy={y + 3} r="3" fill="#ff9aa8" opacity=".7" />
    <circle cx={x + 15} cy={y + 3} r="3" fill="#ff9aa8" opacity=".7" />
  </g>;
}

/** One shape, filled with a bright color and outlined in ink. Sized by its container. */
export function ShapeArt({ shape, color, face = false, className = "" }: { shape: ShapeId; color: ShapeColorId; face?: boolean; className?: string }) {
  const fill = shapeColors[color];
  const outline = { fill, stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const };
  return <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
    {shape === "circle" ? <circle cx="50" cy="50" r="42" {...outline} />
      : shape === "square" ? <rect x="10" y="10" width="80" height="80" rx="5" {...outline} />
      : shape === "triangle" ? <path d="M50 8 92 88H8Z" {...outline} />
      : shape === "rectangle" ? <rect x="3" y="27" width="94" height="46" rx="4" {...outline} />
      : <polygon points={starPoints(50, 54, 46, 19)} {...outline} />}
    {face ? <Face shape={shape} /> : null}
  </svg>;
}

/** Familiar things, each drawn so its outline is clearly one shape. */
export function SafariObjectArt({ object, className = "" }: { object: SafariObjectId; className?: string }) {
  return <svg viewBox="0 0 120 120" aria-hidden="true" className={className} strokeLinejoin="round" strokeLinecap="round">
    {object === "ball" ? <>
      <circle cx="60" cy="60" r="48" fill="#ff8a7a" stroke={INK} strokeWidth="4" />
      <path d="M60 12c-16 14-16 82 0 96" fill="none" stroke="#fff" strokeWidth="8" />
      <path d="M60 12c16 14 16 82 0 96" fill="none" stroke="#ffd968" strokeWidth="8" />
      <path d="M14 48c28 9 64 9 92 0" fill="none" stroke="#76aae0" strokeWidth="8" />
      <circle cx="60" cy="60" r="48" fill="none" stroke={INK} strokeWidth="4" />
      <circle cx="40" cy="34" r="6" fill="#fff" opacity=".6" />
    </> : object === "clock" ? <>
      <circle cx="60" cy="60" r="48" fill="#fff" stroke={INK} strokeWidth="6" />
      {Array.from({ length: 12 }, (_, hour) => { const angle = hour * Math.PI / 6; return <line key={hour} x1={60 + Math.sin(angle) * 36} y1={60 - Math.cos(angle) * 36} x2={60 + Math.sin(angle) * 41} y2={60 - Math.cos(angle) * 41} stroke={INK} strokeWidth={hour % 3 ? 2.5 : 4} />; })}
      <path d="M60 60V32M60 60l18 10" stroke={INK} strokeWidth="5" />
      <circle cx="60" cy="60" r="4.5" fill="#ff8fa3" stroke={INK} strokeWidth="2" />
    </> : object === "cookie" ? <>
      <circle cx="60" cy="60" r="48" fill="#e2a65f" stroke={INK} strokeWidth="4" />
      <circle cx="60" cy="60" r="40" fill="none" stroke="#f3c88a" strokeWidth="3" opacity=".7" />
      {[[42, 40], [72, 36], [56, 58], [82, 64], [38, 72], [64, 84]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="6" ry="5" fill="#6b3f2a" />)}
    </> : object === "window" ? <>
      <rect x="12" y="12" width="96" height="96" rx="4" fill="#e9f6ff" stroke={INK} strokeWidth="5" />
      <rect x="20" y="20" width="80" height="80" fill="#9fd3ff" />
      <path d="M26 46c10-8 18-8 26 0" fill="none" stroke="#fff" strokeWidth="4" opacity=".9" />
      <circle cx="82" cy="34" r="8" fill="#ffd968" />
      <path d="M60 20v80M20 60h80" stroke="#fff" strokeWidth="7" />
      <rect x="12" y="12" width="96" height="96" rx="4" fill="none" stroke={INK} strokeWidth="5" />
    </> : object === "gift" ? <>
      <rect x="14" y="14" width="92" height="92" rx="4" fill="#b49cff" stroke={INK} strokeWidth="4" />
      <path d="M60 14v92M14 60h92" stroke="#ffd968" strokeWidth="12" />
      <path d="M60 60c-10-14-24-12-22-2 1 6 12 4 22 2Zm0 0c10-14 24-12 22-2-1 6-12 4-22 2Z" fill="#ff8fa3" stroke={INK} strokeWidth="3" />
      <rect x="14" y="14" width="92" height="92" rx="4" fill="none" stroke={INK} strokeWidth="4" />
    </> : object === "pizza" ? <>
      <path d="M12 18h96L60 110Z" fill="#ffd968" stroke={INK} strokeWidth="4" />
      <polygon points="12,18 108,18 101.7,31 18.3,31" fill="#d9904a" />
      <path d="M12 18h96L60 110Z" fill="none" stroke={INK} strokeWidth="4" />
      {[[44, 42], [74, 44], [58, 66], [60, 90]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={y > 80 ? 5 : 8} fill="#e8505b" stroke={INK} strokeWidth="2" />)}
    </> : object === "tent" ? <>
      <path d="M60 10 112 104H8Z" fill="#7ad9a6" stroke={INK} strokeWidth="4" />
      <path d="M60 10 86 104H34Z" fill="#4fae7d" />
      <path d="M60 50 74 104H46Z" fill="#30465d" opacity=".85" />
      <path d="M60 10 112 104H8Z" fill="none" stroke={INK} strokeWidth="4" />
    </> : object === "book" ? <>
      <rect x="6" y="28" width="108" height="64" rx="4" fill="#76aae0" stroke={INK} strokeWidth="4" />
      <rect x="6" y="28" width="16" height="64" fill="#4f8bd0" />
      <rect x="36" y="42" width="62" height="18" rx="3" fill="#fff9ec" />
      <path d="M44 51h46" stroke={INK} strokeWidth="3" />
      <path d="M38 76h38" stroke="#fff9ec" strokeWidth="4" />
      <rect x="6" y="28" width="108" height="64" rx="4" fill="none" stroke={INK} strokeWidth="4" />
    </> : object === "envelope" ? <>
      <rect x="6" y="28" width="108" height="64" rx="4" fill="#fff9ec" stroke={INK} strokeWidth="4" />
      <path d="M8 31 60 66l52-35" fill="none" stroke={INK} strokeWidth="4" />
      <rect x="88" y="36" width="16" height="18" rx="2" fill="#ff8fa3" stroke={INK} strokeWidth="2" />
    </> : object === "ornament" ? <>
      <path d="M60 4v12" stroke={INK} strokeWidth="3" />
      <circle cx="60" cy="4" r="3" fill="none" stroke={INK} strokeWidth="2" />
      <polygon points={starPoints(60, 66, 50, 21)} fill="#ffd968" stroke={INK} strokeWidth="4" />
      <polygon points={starPoints(60, 66, 26, 11)} fill="#fff6c9" />
      <circle cx="40" cy="44" r="3" fill="#fff" />
      <circle cx="86" cy="88" r="2.5" fill="#fff" />
    </> : <>
      <polygon points={starPoints(60, 64, 52, 24)} fill="#ffb36b" stroke={INK} strokeWidth="5" />
      {[[60, 30], [92, 54], [80, 92], [40, 92], [28, 54], [60, 50], [70, 70], [50, 70]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#fff3d6" />)}
      <circle cx="54" cy="62" r="3" fill={INK} />
      <circle cx="66" cy="62" r="3" fill={INK} />
    </>}
  </svg>;
}

/** Leo the safari lion, made of shapes: a star mane, circle face, triangle nose and a safari hat. */
export function SafariMascot({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 200 200" aria-hidden="true" className={className} strokeLinejoin="round" strokeLinecap="round">
    <circle cx="100" cy="108" r="92" fill="#bcefd4" />
    <polygon points={Array.from({ length: 24 }, (_, index) => { const radius = index % 2 ? 62 : 76; const angle = (index * Math.PI) / 12; return `${(100 + Math.cos(angle) * radius).toFixed(1)},${(116 + Math.sin(angle) * radius).toFixed(1)}`; }).join(" ")} fill="#e8923f" stroke={INK} strokeWidth="4" />
    <circle cx="62" cy="80" r="14" fill="#f7c873" stroke={INK} strokeWidth="4" />
    <circle cx="138" cy="80" r="14" fill="#f7c873" stroke={INK} strokeWidth="4" />
    <circle cx="100" cy="118" r="52" fill="#f7c873" stroke={INK} strokeWidth="4" />
    <ellipse cx="100" cy="138" rx="28" ry="20" fill="#fff1d2" />
    <circle cx="82" cy="110" r="6" fill={INK} />
    <circle cx="118" cy="110" r="6" fill={INK} />
    <circle cx="84" cy="108" r="2" fill="#fff" />
    <circle cx="120" cy="108" r="2" fill="#fff" />
    <path d="M91 127h18l-9 10Z" fill={INK} />
    <path d="M90 145c6 6 14 6 20 0" fill="none" stroke={INK} strokeWidth="4" />
    <circle cx="70" cy="132" r="6" fill="#ff9aa8" opacity=".7" />
    <circle cx="130" cy="132" r="6" fill="#ff9aa8" opacity=".7" />
    <path d="M56 70c0-34 88-34 88 0Z" fill="#e6d3a3" stroke={INK} strokeWidth="4" />
    <rect x="38" y="64" width="124" height="14" rx="7" fill="#d4bb80" stroke={INK} strokeWidth="4" />
    <rect x="56" y="58" width="88" height="8" fill="#7ad9a6" stroke={INK} strokeWidth="3" />
  </svg>;
}

/** The five shapes scattered around the welcome card. */
export function ShapeParade({ className = "" }: { className?: string }) {
  const parade: { shape: ShapeId; color: ShapeColorId; rotate: number }[] = [
    { shape: "circle", color: "coral", rotate: 0 },
    { shape: "square", color: "blue", rotate: -8 },
    { shape: "triangle", color: "green", rotate: 6 },
    { shape: "rectangle", color: "purple", rotate: -4 },
    { shape: "star", color: "yellow", rotate: 10 },
  ];
  // The tilt sits on the outer span so the bobbing animation (a transform) doesn't replace it.
  return <div aria-hidden="true" className={`flex items-end justify-center gap-[3%] ${className}`}>{parade.map((item, index) => <span key={item.shape} className="block w-[17%] max-w-20" style={{ transform: `rotate(${item.rotate}deg)` }}><span className="shape-bob block" style={{ animationDelay: `${index * 180}ms` }}><ShapeArt shape={item.shape} color={item.color} face className="block h-auto w-full" /></span></span>)}</div>;
}
