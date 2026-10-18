"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "closed" | "opening" | "open";

/**
 * A padlock for Premium. Shows closed while `locked`; when it becomes unlocked while on screen (or mounts
 * with `celebrate`), it starts closed and springs open after `delay` ms with a little sparkle.
 */
export function Padlock({ locked, celebrate = false, delay = 400, label, className = "" }: { locked: boolean; celebrate?: boolean; delay?: number; label?: string; className?: string }) {
  const [phase, setPhase] = useState<Phase>(locked || celebrate ? "closed" : "open");
  // Whether the next unlock should play the opening animation. Latched at mount so a later `celebrate=false` doesn't cancel it.
  const pendingOpen = useRef(locked || celebrate);

  useEffect(() => {
    if (locked) { pendingOpen.current = true; const timer = window.setTimeout(() => setPhase("closed"), 0); return () => window.clearTimeout(timer); }
    if (!pendingOpen.current) { const timer = window.setTimeout(() => setPhase("open"), 0); return () => window.clearTimeout(timer); }
    const timer = window.setTimeout(() => { pendingOpen.current = false; setPhase("opening"); }, delay);
    return () => window.clearTimeout(timer);
  }, [locked, delay]);

  const open = phase !== "closed";
  return <span role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={`padlock relative inline-block ${phase === "opening" ? "padlock-opening" : ""} ${className}`} data-open={open}>
    <svg viewBox="0 0 48 56" className="block h-full w-full overflow-visible">
      <path className="padlock-shackle" d="M14 27V17a10 10 0 0 1 20 0v10" fill="none" stroke="#30465d" strokeWidth="6" strokeLinecap="round" />
      <g className="padlock-body">
        <rect x="5" y="24" width="38" height="29" rx="9" stroke="#30465d" strokeWidth="3" className="padlock-fill" />
        <rect x="10" y="28" width="9" height="4" rx="2" fill="#fff" opacity=".55" />
        <circle cx="24" cy="36.5" r="4" fill="#30465d" />
        <rect x="22" y="38" width="4" height="8" rx="2" fill="#30465d" />
      </g>
    </svg>
    {phase === "opening" ? <span className="padlock-sparkles pointer-events-none absolute inset-0">{["✨", "⭐", "✨", "⭐"].map((spark, index) => <span key={index} className={`padlock-spark padlock-spark-${index}`}>{spark}</span>)}</span> : null}
  </span>;
}
