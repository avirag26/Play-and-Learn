export function SimpleObject({ kind, className = "" }: { kind: "apple" | "ball" | "cat" | "dog" | "fish" | "bird"; className?: string }) {
  if (kind === "apple") return <svg viewBox="0 0 100 100" className={className} aria-hidden="true"><path d="M52 29C45 18 49 10 61 7" stroke="#30465D" strokeWidth="6" strokeLinecap="round"/><path d="M53 21C68 6 78 15 82 25C69 27 60 26 53 21Z" fill="#91DBB4"/><path d="M50 28C26 21 11 40 18 65C25 90 45 93 50 77C55 93 75 90 82 65C89 40 74 21 50 28Z" fill="#FF7E76"/><path d="M20 50C21 37 30 29 40 28" stroke="#FFB6A8" strokeWidth="5" strokeLinecap="round"/></svg>;
  if (kind === "ball") return <svg viewBox="0 0 100 100" className={className} aria-hidden="true"><circle cx="50" cy="50" r="36" fill="#FFD968"/><path d="M23 34C39 42 62 42 77 30M21 64C38 57 62 58 79 70" stroke="#FF9E8D" strokeWidth="6" strokeLinecap="round"/></svg>;
  if (kind === "bird") return <svg viewBox="0 0 100 100" className={className} aria-hidden="true"><circle cx="49" cy="51" r="29" fill="#D9CBFF"/><path d="M68 52L88 60L68 67V52Z" fill="#FFD968"/><circle cx="59" cy="43" r="5" fill="#30465D"/><path d="M29 50C14 39 13 63 31 61" fill="#BCEFD4"/></svg>;
  if (kind === "fish") return <svg viewBox="0 0 100 100" className={className} aria-hidden="true"><path d="M20 50C35 24 67 24 82 50C67 76 35 76 20 50Z" fill="#91D8F5"/><path d="M20 50L7 35V65L20 50Z" fill="#BCEFD4"/><circle cx="66" cy="45" r="5" fill="#30465D"/><path d="M43 44C50 51 50 57 43 64" stroke="#30465D" strokeWidth="4" strokeLinecap="round"/></svg>;
  const cat = kind === "cat";
  return <svg viewBox="0 0 100 100" className={className} aria-hidden="true"><path d={cat ? "M25 39L24 16L40 27C54 21 68 24 78 31L91 20L86 49C85 72 70 84 51 84C32 84 18 69 19 48L25 39Z" : "M19 37L17 19L36 28C50 21 67 24 78 33L88 20L87 52C82 76 67 85 50 85C30 85 18 68 19 37Z"} fill={cat ? "#FFB6A8" : "#D99D73"}/><circle cx="38" cy="50" r="5" fill="#30465D"/><circle cx="66" cy="50" r="5" fill="#30465D"/><path d="M45 64C50 69 55 69 60 64" stroke="#30465D" strokeWidth="4" strokeLinecap="round"/></svg>;
}

export function ColorObject({ color, shape }: { color: "yellow" | "blue"; shape: "circle" | "square" | "triangle" }) {
  const fill = color === "yellow" ? "#FFD968" : "#91D8F5";
  if (shape === "circle") return <svg viewBox="0 0 100 80" className="h-20 w-24" aria-hidden="true"><circle cx="50" cy="40" r="27" fill={fill}/><circle cx="40" cy="30" r="6" fill="white" opacity=".55"/></svg>;
  if (shape === "square") return <svg viewBox="0 0 100 80" className="h-20 w-24" aria-hidden="true"><rect x="24" y="14" width="52" height="52" rx="10" fill={fill}/><path d="M35 27H55" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".55"/></svg>;
  return <svg viewBox="0 0 100 80" className="h-20 w-24" aria-hidden="true"><path d="M50 10L83 66H17L50 10Z" fill={fill}/><path d="M42 48L50 34" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".55"/></svg>;
}
