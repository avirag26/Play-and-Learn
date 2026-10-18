"use client";

import { useState } from "react";
import { getCountObject, numberWords, type CountObjectId } from "@/lib/count-data";

/** A friendly star with a little face, drawn locally so it looks the same on every phone. */
export function StarIcon({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
    <path d="M32 4.5l7.9 16.4 18 2.4-13.1 12.5 3.3 17.8L32 45l-16.1 8.6 3.3-17.8L6.1 23.3l18-2.4z" fill="#ffd34d" stroke="#e8a317" strokeWidth="3" strokeLinejoin="round" />
    <path d="M22 22.5l4-1" stroke="#fff6c9" strokeWidth="3" strokeLinecap="round" />
    <circle cx="26.5" cy="31" r="2.6" fill="#30465d" />
    <circle cx="37.5" cy="31" r="2.6" fill="#30465d" />
    <path d="M27.5 37c2.6 2.6 6.4 2.6 9 0" fill="none" stroke="#30465d" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="22.5" cy="35.5" r="2.2" fill="#ff9aa8" opacity=".7" />
    <circle cx="41.5" cy="35.5" r="2.2" fill="#ff9aa8" opacity=".7" />
  </svg>;
}

/** One countable thing at the size of its container's font. */
export function CountItem({ object, className = "" }: { object: CountObjectId; className?: string }) {
  return object === "star" ? <StarIcon className={`block h-[1em] w-[1em] ${className}`} /> : <span aria-hidden="true" className={`block leading-none ${className}`}>{getCountObject(object).emoji}</span>;
}

/** Each thing is at most ~1/6 of the group's width (cqw), so a row of five always fits its card. */
const sizes = {
  lg: "text-[min(clamp(2rem,7dvh,3.75rem),15cqw)]",
  md: "text-[min(clamp(1.75rem,5.5dvh,3rem),15cqw)]",
  sm: "text-[min(clamp(1.4rem,4dvh,2.25rem),17cqw)]",
};

/**
 * A group of things in rows of five, like a ten frame, so 6–10 read as "five and some more".
 * With `onCount`, each tap counts one thing out loud and shows its number on it.
 */
export function ObjectGroup({ count, object, size = "md", onCount, label }: { count: number; object: CountObjectId; size?: keyof typeof sizes; onCount?: (spoken: number) => void; label?: string }) {
  const [order, setOrder] = useState<number[]>([]);
  const rows = [Array.from({ length: Math.min(count, 5) }, (_, index) => index), Array.from({ length: Math.max(0, count - 5) }, (_, index) => index + 5)].filter((row) => row.length);

  function tap(position: number) {
    if (!onCount || order.includes(position)) return;
    const next = [...order, position];
    setOrder(next);
    onCount(next.length);
  }

  return <div role={onCount ? "group" : "img"} aria-label={label} className="@container w-full">
    <div className={`mx-auto flex max-w-md flex-col items-center gap-[2cqw] ${sizes[size]}`}>
      {rows.map((row, rowIndex) => <div key={rowIndex} className="flex w-full justify-center gap-[1.5cqw]">{row.map((position) => {
        const spoken = order.indexOf(position) + 1;
        const item = <CountItem object={object} className={spoken ? "game-pop" : ""} />;
        return onCount ? <button key={position} type="button" onClick={() => tap(position)} aria-label={spoken ? `Counted: ${numberWords[spoken]}` : "Tap to count"} className={`relative grid min-h-11 min-w-0 flex-[0_1_19%] place-items-center rounded-2xl py-1 transition focus-visible:outline-3 focus-visible:outline-ink ${spoken ? "bg-sunshine/40" : "hover:bg-sky"}`}>
          {item}
          {spoken ? <span aria-hidden="true" className="game-pop absolute -right-0.5 -top-1 grid size-6 place-items-center rounded-full bg-ink text-xs font-black text-white">{spoken}</span> : null}
        </button> : <span key={position} className="grid min-w-0 flex-[0_1_19%] place-items-center">{item}</span>;
      })}</div>)}
    </div>
  </div>;
}
