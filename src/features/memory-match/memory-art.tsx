import { StarIcon } from "@/features/count-the-stars/count-item";
import { SafariObjectArt } from "@/features/shape-safari/shape-art";
import { getMemoryPicture, type MemoryPictureId } from "@/lib/memory-data";

const INK = "#30465d";

/** One card picture, sized by its container's width. Everything is drawn locally, so it can never fail to load. */
export function MemoryPictureArt({ picture, className = "" }: { picture: MemoryPictureId; className?: string }) {
  if (picture === "star") return <StarIcon className={className} />;
  if (picture === "ball") return <SafariObjectArt object="ball" className={className} />;
  if (picture === "gift") return <SafariObjectArt object="gift" className={className} />;
  // Emoji inside an SVG scale with the card like the drawn pictures do.
  return <svg viewBox="0 0 100 100" aria-hidden="true" className={className}><text x="50" y="54" fontSize="78" textAnchor="middle" dominantBaseline="central">{getMemoryPicture(picture).emoji}</text></svg>;
}

/** The back of every card: Ollie's star on a soft purple pattern. */
export function CardBack({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`grid place-items-center rounded-[inherit] border-4 border-white bg-[#b49cff] bg-[radial-gradient(circle,rgba(255,255,255,.35)_2px,transparent_2.5px)] bg-[length:16px_16px] ${className}`}>
    <span className="grid aspect-square w-[58%] place-items-center rounded-full bg-white/90 shadow-[0_3px_0_rgba(48,70,93,0.18)]"><StarIcon className="block h-auto w-[72%]" /></span>
  </span>;
}

/** The face of a card: the picture on its own tint, so every pair stands out from the others. */
export function CardFace({ picture, className = "" }: { picture: MemoryPictureId; className?: string }) {
  return <span aria-hidden="true" className={`grid place-items-center rounded-[inherit] border-4 border-white bg-white ${className}`}>
    <span className={`grid size-[88%] place-items-center rounded-[1.1rem] ${getMemoryPicture(picture).tint}`}><MemoryPictureArt picture={picture} className="block h-auto w-[78%]" /></span>
  </span>;
}

/** Ollie the owl, who loves remembering where things are. Holds a little memory card. */
export function MemoryMascot({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 200 200" aria-hidden="true" className={className} strokeLinejoin="round" strokeLinecap="round">
    <circle cx="100" cy="108" r="92" fill="#d9cbff" />
    <path d="M58 62 50 30l28 22ZM142 62l8-32-28 22Z" fill="#a8774d" stroke={INK} strokeWidth="4" />
    <ellipse cx="100" cy="118" rx="58" ry="64" fill="#c48d5c" stroke={INK} strokeWidth="4" />
    <ellipse cx="100" cy="140" rx="36" ry="38" fill="#f6e2c2" />
    {[[88, 128], [112, 128], [100, 144], [88, 160], [112, 160]].map(([x, y]) => <path key={`${x}-${y}`} d={`M${x - 6} ${y}q6 6 12 0`} fill="none" stroke="#d9a877" strokeWidth="3" />)}
    <path d="M44 118c-6 22 2 44 18 50 4-20 2-38-18-50ZM156 118c6 22-2 44-18 50-4-20-2-38 18-50Z" fill="#a8774d" stroke={INK} strokeWidth="4" />
    <circle cx="78" cy="96" r="22" fill="#fff" stroke={INK} strokeWidth="4" />
    <circle cx="122" cy="96" r="22" fill="#fff" stroke={INK} strokeWidth="4" />
    <circle cx="80" cy="98" r="10" fill={INK} />
    <circle cx="120" cy="98" r="10" fill={INK} />
    <circle cx="84" cy="94" r="3.5" fill="#fff" />
    <circle cx="124" cy="94" r="3.5" fill="#fff" />
    <path d="M92 112h16l-8 12Z" fill="#ffb36b" stroke={INK} strokeWidth="3" />
    <circle cx="62" cy="120" r="6" fill="#ff9aa8" opacity=".7" />
    <circle cx="138" cy="120" r="6" fill="#ff9aa8" opacity=".7" />
    <path d="M84 180v8M92 180v8M108 180v8M116 180v8" stroke="#ffb36b" strokeWidth="5" />
    <g transform="rotate(14 150 156)">
      <rect x="132" y="132" width="36" height="46" rx="7" fill="#b49cff" stroke={INK} strokeWidth="4" />
      <path d="m150 143 3.4 7 7.6 1-5.5 5.3 1.4 7.6-6.9-3.7-6.9 3.7 1.4-7.6-5.5-5.3 7.6-1Z" fill="#ffd968" stroke={INK} strokeWidth="2" />
    </g>
  </svg>;
}

/** Three cards fanned out on the welcome screen: one still hidden, and a matching pair. */
export function CardFan({ className = "" }: { className?: string }) {
  const cards = [{ rotate: -12, lift: 8, face: null }, { rotate: 0, lift: 0, face: "apple" }, { rotate: 12, lift: 8, face: "apple" }] as const;
  return <div aria-hidden="true" className={`flex items-end justify-center ${className}`}>{cards.map((card, index) => <span key={index} className="-mx-[3%] block w-[28%] max-w-28" style={{ transform: `translateY(${card.lift}px) rotate(${card.rotate}deg)` }}>
    <span className="shape-bob block" style={{ animationDelay: `${index * 220}ms` }}>
      <span className="grid aspect-[4/5] rounded-[1.4rem] shadow-[0_6px_0_rgba(42,91,145,0.2)]">{card.face ? <CardFace picture={card.face} className="h-full w-full" /> : <CardBack className="h-full w-full" />}</span>
    </span>
  </span>)}</div>;
}

/** A level's size at a glance: its cards as little backs, 2×2, 3×2 or 4×2. */
export function LevelCards({ pairs, className = "" }: { pairs: number; className?: string }) {
  const columns = Math.min(pairs, 4);
  return <span aria-hidden="true" className={`grid gap-[6%] ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: pairs * 2 }, (_, index) => <span key={index} className="block aspect-[4/5] rounded-[22%] border-2 border-white bg-[#b49cff] shadow-[0_2px_0_rgba(42,91,145,0.2)]" />)}</span>;
}
