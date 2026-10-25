import type { ReactNode } from "react";
import { MemoryMascot } from "@/features/memory-match/memory-art";
import { SafariMascot } from "@/features/shape-safari/shape-art";
import type { PuzzleArtId } from "@/lib/puzzle-data";

const INK = "#30465d";

/**
 * Every puzzle picture is drawn so each grid cell holds something of its own (a sun, a ladybug, a
 * different wing), so no two pieces look alike. Square pictures are 2×2 or 3×3; wide ones are 3×2.
 */
function Frame({ width, height, sky, children }: { width: number; height: number; sky: string; children: ReactNode }) {
  return <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" className="block h-full w-full" strokeLinejoin="round" strokeLinecap="round"><rect width={width} height={height} fill={sky} />{children}</svg>;
}

function Flower({ x, y, petal, size = 1 }: { x: number; y: number; petal: string; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <path d="M0 0v22" stroke="#4fae7d" strokeWidth="4" />
    {[0, 72, 144, 216, 288].map((angle) => <ellipse key={angle} cx="0" cy="-8" rx="6" ry="9" fill={petal} stroke={INK} strokeWidth="2" transform={`rotate(${angle})`} />)}
    <circle r="5" fill="#ffd968" stroke={INK} strokeWidth="2" />
  </g>;
}

function AppleArt() {
  return <Frame width={200} height={200} sky="#e5f4ff">
    <path d="M0 160C60 150 140 150 200 160V200H0Z" fill="#9be0b6" />
    <path d="M100 52C70 34 30 52 30 104c0 50 34 84 70 84s70-34 70-84c0-52-40-70-70-52Z" fill="#ff5a5f" stroke={INK} strokeWidth="5" />
    <path d="M100 52c0-14 4-26 12-34" fill="none" stroke="#8b5a2b" strokeWidth="7" />
    <path d="M112 34c20-22 52-18 60-6-18 18-44 20-60 6Z" fill="#7ad9a6" stroke={INK} strokeWidth="4" />
    <ellipse cx="60" cy="78" rx="12" ry="20" fill="#fff" opacity=".55" transform="rotate(-20 60 78)" />
    <circle cx="80" cy="92" r="7" fill={INK} /><circle cx="120" cy="92" r="7" fill={INK} />
    <circle cx="82" cy="89" r="2.5" fill="#fff" /><circle cx="122" cy="89" r="2.5" fill="#fff" />
    <path d="M78 130c12 14 32 14 44 0" fill="none" stroke={INK} strokeWidth="5" />
    <circle cx="62" cy="120" r="7" fill="#ff9aa8" opacity=".8" /><circle cx="138" cy="120" r="7" fill="#ff9aa8" opacity=".8" />
    <Flower x={26} y={168} petal="#b49cff" />
    <g transform="translate(172 176)"><ellipse rx="14" ry="11" fill="#e8505b" stroke={INK} strokeWidth="3" /><path d="M0-11V11" stroke={INK} strokeWidth="2" /><circle cx="-6" cy="-2" r="2.5" fill={INK} /><circle cx="6" cy="4" r="2.5" fill={INK} /><circle cx="-14" cy="-6" r="5" fill={INK} /></g>
  </Frame>;
}

function ButterflyArt() {
  return <Frame width={300} height={200} sky="#fff1d6">
    <circle cx="28" cy="170" r="40" fill="#bcefd4" /><circle cx="272" cy="176" r="44" fill="#bcefd4" />
    <path d="M144 70C110 10 30 10 34 60c4 34 60 44 110 30Z" fill="#ffb36b" stroke={INK} strokeWidth="5" />
    {[[70, 46], [100, 60], [62, 72]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="9" fill="#ffd968" stroke={INK} strokeWidth="2" />)}
    <path d="M156 70C190 10 270 10 266 60c-4 34-60 44-110 30Z" fill="#b49cff" stroke={INK} strokeWidth="5" />
    {[[224, 48], [206, 70]].map(([x, y]) => <path key={`${x}${y}`} d={`M${x} ${y + 6}c-10-6-12-16-4-18 4-1 4 3 4 3s0-4 4-3c8 2 6 12-4 18Z`} fill="#ff8fa3" stroke={INK} strokeWidth="2" />)}
    <path d="M144 112c-40-6-90 4-96 34-4 26 40 34 96-14Z" fill="#7ad9a6" stroke={INK} strokeWidth="5" />
    <path d="M70 142h30M76 130h22" stroke="#fff" strokeWidth="5" opacity=".8" />
    <path d="M156 112c40-6 90 4 96 34 4 26-40 34-96-14Z" fill="#76aae0" stroke={INK} strokeWidth="5" />
    <circle cx="214" cy="140" r="10" fill="#fff" opacity=".8" /><circle cx="236" cy="134" r="6" fill="#fff" opacity=".8" />
    <ellipse cx="150" cy="112" rx="10" ry="58" fill="#6b3f2a" stroke={INK} strokeWidth="4" />
    <circle cx="150" cy="48" r="17" fill="#8b5a2b" stroke={INK} strokeWidth="4" />
    <path d="M144 34c-6-14-14-20-22-22M156 34c6-14 14-20 22-22" fill="none" stroke={INK} strokeWidth="3" />
    <circle cx="121" cy="12" r="5" fill="#ff8fa3" /><circle cx="179" cy="12" r="5" fill="#ff8fa3" />
    <circle cx="144" cy="46" r="3" fill="#fff" /><circle cx="156" cy="46" r="3" fill="#fff" />
    <path d="M144 54c4 4 8 4 12 0" fill="none" stroke="#fff" strokeWidth="2.5" />
    <Flower x={150} y={176} petal="#ff8fa3" size={0.9} />
  </Frame>;
}

function FishArt() {
  return <Frame width={300} height={200} sky="#9fd3ff">
    <path d="M0 176c40-8 80 6 150-2s110-6 150 4v22H0Z" fill="#f3d9a4" />
    <path d="M20 200c0-30 10-50 2-80M36 200c0-26-10-40-2-66" fill="none" stroke="#3f9d63" strokeWidth="8" />
    <circle cx="32" cy="30" r="9" fill="#e5f4ff" stroke="#fff" strokeWidth="2" opacity=".9" />
    <circle cx="246" cy="22" r="8" fill="#e5f4ff" stroke="#fff" strokeWidth="2" /><circle cx="270" cy="40" r="5" fill="#e5f4ff" stroke="#fff" strokeWidth="2" />
    <path d="M86 100 30 52v96Z" fill="#ff8a1f" stroke={INK} strokeWidth="5" />
    <path d="M150 52c20-26 50-28 60-10Z" fill="#ffb36b" stroke={INK} strokeWidth="4" />
    <ellipse cx="170" cy="100" rx="96" ry="54" fill="#ffb36b" stroke={INK} strokeWidth="5" />
    <path d="M128 52c-10 30-10 66 0 96M162 47c-10 34-10 72 0 106" fill="none" stroke="#fff" strokeWidth="9" opacity=".75" />
    <circle cx="232" cy="88" r="13" fill="#fff" stroke={INK} strokeWidth="4" /><circle cx="235" cy="88" r="6" fill={INK} />
    <path d="M250 118c-8 6-16 6-22 2" fill="none" stroke={INK} strokeWidth="4" />
    <path d="M168 150c10 18 30 20 38 8Z" fill="#ffb36b" stroke={INK} strokeWidth="4" />
    {[[120, 184], [150, 188], [180, 182]].map(([x, y]) => <ellipse key={x} cx={x} cy={y} rx="9" ry="6" fill="#c9b8a0" stroke={INK} strokeWidth="2" />)}
    <path d="M266 182l6-14 6 14 14 2-10 9 3 14-13-7-13 7 3-14-10-9Z" fill="#ff8fa3" stroke={INK} strokeWidth="2.5" />
  </Frame>;
}

function HouseArt() {
  return <Frame width={300} height={300} sky="#cfeaff">
    <path d="M0 230c60-14 120-10 300-4v74H0Z" fill="#9be0b6" />
    <g fill="#fff" stroke="#b9d9f2" strokeWidth="3"><circle cx="30" cy="40" r="16" /><circle cx="50" cy="32" r="20" /><circle cx="72" cy="42" r="14" /></g>
    <path d="M30 76c6-6 10-6 14 0 4-6 8-6 14 0" fill="none" stroke={INK} strokeWidth="3" />
    <circle cx="258" cy="44" r="24" fill="#ffd968" stroke="#f2b632" strokeWidth="4" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => <path key={angle} d="M258 8v-6" stroke="#f2b632" strokeWidth="4" transform={`rotate(${angle} 258 44)`} />)}
    <rect x="178" y="40" width="22" height="44" fill="#c96a4a" stroke={INK} strokeWidth="4" />
    <path d="M182 34c-6-8 6-12 0-20M194 32c-6-8 6-12 0-20" fill="none" stroke="#c7d3de" strokeWidth="4" />
    <path d="M150 28 262 120H38Z" fill="#e8505b" stroke={INK} strokeWidth="5" />
    <rect x="58" y="118" width="184" height="124" fill="#ffe7b3" stroke={INK} strokeWidth="5" />
    <rect x="76" y="138" width="40" height="36" rx="4" fill="#9fd3ff" stroke={INK} strokeWidth="4" /><path d="M96 138v36M76 156h40" stroke={INK} strokeWidth="3" />
    <rect x="184" y="138" width="40" height="36" rx="4" fill="#9fd3ff" stroke={INK} strokeWidth="4" /><path d="M204 138v36M184 156h40" stroke={INK} strokeWidth="3" />
    <circle cx="150" cy="96" r="12" fill="#fff" stroke={INK} strokeWidth="4" />
    <path d="M130 242v-60a20 20 0 0 1 40 0v60Z" fill="#8b5a2b" stroke={INK} strokeWidth="5" /><circle cx="160" cy="214" r="3.5" fill="#ffd968" />
    <path d="M136 244c-10 20-16 40-20 56h68c-4-16-10-36-20-56Z" fill="#e2c7a0" />
    <rect x="16" y="150" width="14" height="80" fill="#8b5a2b" stroke={INK} strokeWidth="3" /><circle cx="23" cy="140" r="24" fill="#4fae7d" stroke={INK} strokeWidth="4" />
    <Flower x={44} y={262} petal="#ff8fa3" /><Flower x={74} y={270} petal="#ffd968" />
    <circle cx="262" cy="258" r="20" fill="#4fae7d" stroke={INK} strokeWidth="4" /><circle cx="248" cy="250" r="4" fill="#e8505b" /><circle cx="270" cy="262" r="4" fill="#e8505b" />
  </Frame>;
}

function GardenArt() {
  return <Frame width={300} height={300} sky="#d8f1ff">
    <path d="M0 210c80-10 200-10 300 0v90H0Z" fill="#9be0b6" />
    {[["#ff5a5f", 92], ["#ffb36b", 80], ["#ffd968", 68], ["#7ad9a6", 56], ["#76aae0", 44]].map(([color, radius]) => <path key={radius} d={`M${110 - Number(radius)} 120a${radius} ${radius} 0 0 1 ${Number(radius) * 2} 0`} fill="none" stroke={String(color)} strokeWidth="12" />)}
    <g fill="#fff"><circle cx="16" cy="120" r="14" /><circle cx="34" cy="114" r="16" /><circle cx="204" cy="120" r="14" /><circle cx="186" cy="114" r="16" /></g>
    <circle cx="256" cy="46" r="26" fill="#ffd968" stroke="#f2b632" strokeWidth="4" />
    <path d="M246 44c3 4 7 4 10 0M260 44c3 4 7 4 10 0M248 56c6 6 14 6 20 0" fill="none" stroke={INK} strokeWidth="3" />
    <g transform="translate(46 160)"><path d="M0 0c-22-20-34 2-20 12 8 6 20 0 20-12ZM0 0c22-20 34 2 20 12-8 6-20 0-20-12Z" fill="#b49cff" stroke={INK} strokeWidth="3" /><path d="M0-10v20" stroke={INK} strokeWidth="4" /></g>
    <g transform="translate(150 150)">{Array.from({ length: 12 }, (_, index) => <ellipse key={index} cx="0" cy="-26" rx="8" ry="16" fill="#ffd968" stroke={INK} strokeWidth="2" transform={`rotate(${index * 30})`} />)}<circle r="18" fill="#8b5a2b" stroke={INK} strokeWidth="3" /><circle cx="-6" cy="-4" r="3" fill={INK} /><circle cx="6" cy="-4" r="3" fill={INK} /><path d="M-6 6c4 4 8 4 12 0" fill="none" stroke={INK} strokeWidth="2.5" /></g>
    <path d="M150 196v100" stroke="#3f9d63" strokeWidth="8" />
    <path d="M150 240c-20-18-40-10-44 0 20 6 34 6 44 0ZM150 262c20-18 40-10 44 0-20 6-34 6-44 0Z" fill="#7ad9a6" stroke={INK} strokeWidth="3" />
    <g transform="translate(252 160)"><ellipse rx="16" ry="12" fill="#ffd968" stroke={INK} strokeWidth="3" /><path d="M-6-12v24M4-12v24" stroke={INK} strokeWidth="4" /><ellipse cx="-4" cy="-16" rx="8" ry="6" fill="#fff" opacity=".85" stroke={INK} strokeWidth="2" /><ellipse cx="8" cy="-16" rx="8" ry="6" fill="#fff" opacity=".85" stroke={INK} strokeWidth="2" /><circle cx="14" cy="-2" r="2.5" fill={INK} /></g>
    {[[30, "#ff5a5f"], [62, "#ff8fa3"]].map(([x, color]) => <g key={String(x)} transform={`translate(${x} 250)`}><path d="M0 0v40" stroke="#3f9d63" strokeWidth="5" /><path d="M-12-14c0 14 6 18 12 18s12-4 12-18l-6 6-6-8-6 8Z" fill={String(color)} stroke={INK} strokeWidth="3" /></g>)}
    <g transform="translate(250 268)"><ellipse cx="0" cy="12" rx="30" ry="9" fill="#c9b8a0" stroke={INK} strokeWidth="3" /><circle cx="6" cy="-2" r="16" fill="#ffb36b" stroke={INK} strokeWidth="3" /><path d="M6-2m-8 0a8 8 0 1 0 8-8" fill="none" stroke={INK} strokeWidth="3" /><path d="M-24 8c-2-10 0-16 4-18M-20 4v-14" fill="none" stroke={INK} strokeWidth="3" /></g>
  </Frame>;
}

/** The two mascots already in the app, set on a full square background so every piece has a picture. */
function MascotArt({ sky, children }: { sky: string; children: ReactNode }) {
  return <svg viewBox="0 0 200 200" aria-hidden="true" className="block h-full w-full"><rect width="200" height="200" fill={sky} /><path d="M0 172c60-10 140-10 200 0v28H0Z" fill="#9be0b6" />{children}</svg>;
}

/** A puzzle's whole picture, filling its box. */
export function PuzzleArt({ art }: { art: PuzzleArtId }) {
  if (art === "lion") return <MascotArt sky="#fff1d6"><SafariMascot className="block h-full w-full" /></MascotArt>;
  if (art === "owl") return <MascotArt sky="#e5f4ff"><MemoryMascot className="block h-full w-full" /></MascotArt>;
  if (art === "apple") return <AppleArt />;
  if (art === "butterfly") return <ButterflyArt />;
  if (art === "fish") return <FishArt />;
  if (art === "house") return <HouseArt />;
  return <GardenArt />;
}

/** One puzzle piece shape (a square with a knob and a dent), used as decoration and the mascot. */
const pieceShape = "M14 22h22c-4-12 4-18 10-18s14 6 10 18h22a6 6 0 0 1 6 6v22c12-4 18 4 18 10s-6 14-18 10v22a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V28a6 6 0 0 1 6-6Z";

/** Pip, a smiling puzzle piece who loves fitting things together. */
export function PuzzleMascot({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 110 104" aria-hidden="true" className={className} strokeLinejoin="round" strokeLinecap="round">
    <path d={pieceShape} fill="#7ad9a6" stroke={INK} strokeWidth="4" />
    <circle cx="34" cy="56" r="5" fill={INK} /><circle cx="58" cy="56" r="5" fill={INK} />
    <circle cx="36" cy="54" r="1.6" fill="#fff" /><circle cx="60" cy="54" r="1.6" fill="#fff" />
    <path d="M36 70c6 6 14 6 20 0" fill="none" stroke={INK} strokeWidth="4" />
    <circle cx="24" cy="66" r="4.5" fill="#ff9aa8" opacity=".8" /><circle cx="68" cy="66" r="4.5" fill="#ff9aa8" opacity=".8" />
  </svg>;
}

/** Colorful pieces tumbling together, for the welcome card. */
export function PieceParade({ className = "" }: { className?: string }) {
  const pieces = [{ fill: "#ffb36b", rotate: -14 }, { fill: "#76aae0", rotate: 8 }, { fill: "#ff8fa3", rotate: -6 }, { fill: "#ffd968", rotate: 12 }];
  return <div aria-hidden="true" className={`flex items-end justify-center gap-[2%] ${className}`}>{pieces.map((piece, index) => <span key={piece.fill} className="block w-[20%] max-w-20" style={{ transform: `rotate(${piece.rotate}deg)` }}><span className="shape-bob block" style={{ animationDelay: `${index * 200}ms` }}><svg viewBox="0 0 110 104" className="block h-auto w-full" strokeLinejoin="round"><path d={pieceShape} fill={piece.fill} stroke={INK} strokeWidth="4" /></svg></span></span>)}</div>;
}
