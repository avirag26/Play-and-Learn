"use client";

import { useEffect, useRef } from "react";
import { Padlock } from "@/components/ui/padlock";
import { BearMascot } from "@/features/home/illustrations";
import type { JourneyStep } from "@/lib/mission-journey";
import { missionCategoryInfo } from "@/lib/missions";

/** Across the path: left, middle, right, middle… so the road winds down the screen. */
const columns = [22, 50, 78, 50];
const ROW = 118;
// Little scenery beside the road, every few days.
const scenery = ["🌲", "🌼", "🏡", "🌳", "⛺", "🌻", "🪁", "🌈"];

function nodeX(index: number) { return columns[index % columns.length]; }

/** The day-by-day mission path. Finished days glow green, today's bounces, the rest wait behind padlocks. */
export function MissionMap({ steps, onOpen, onLocked }: { steps: readonly JourneyStep[]; onOpen: (step: JourneyStep) => void; onLocked: (step: JourneyStep) => void }) {
  const current = useRef<HTMLButtonElement>(null);
  const height = steps.length * ROW + 40;
  // The road through every node centre, as gentle S-curves.
  const road = steps.map((_, index) => ({ x: nodeX(index), y: index * ROW + 60 })).reduce((path, point, index, points) => {
    if (index === 0) return `M${point.x} ${point.y}`;
    const before = points[index - 1];
    const middle = (before.y + point.y) / 2;
    return `${path} C${before.x} ${middle} ${point.x} ${middle} ${point.x} ${point.y}`;
  }, "");

  // Bring today's mission into view when the page opens.
  useEffect(() => { current.current?.scrollIntoView({ block: "center", behavior: "smooth" }); }, []);

  return <div className="mission-map relative overflow-hidden rounded-[2rem] p-3 sm:p-6">
    <div className="relative mx-auto max-w-md" style={{ height }}>
      <svg aria-hidden="true" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={road} fill="none" stroke="#c9bdf7" strokeWidth="34" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d={road} fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="3" strokeDasharray="10 12" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {steps.map((step, index) => index % 2 === 1 ? <span key={`scenery-${step.day}`} aria-hidden="true" className="absolute text-3xl opacity-90" style={{ left: `${nodeX(index) > 50 ? 8 : 82}%`, top: index * ROW + 40 }}>{scenery[Math.floor(index / 2) % scenery.length]}</span> : null)}
      <ol className="relative h-full">{steps.map((step, index) => {
        const info = missionCategoryInfo[step.mission.category];
        const title = step.mission.title;
        const open = step.status === "done" || step.status === "today";
        const label = step.status === "done" ? `Day ${step.day}: ${title}, finished`
          : step.status === "today" ? `Day ${step.day}: ${title}, today's mission`
          : step.status === "tomorrow" ? `Day ${step.day}, opens tomorrow`
          : step.premium ? `Day ${step.day}, needs Premium`
          : `Day ${step.day}, locked`;
        const size = step.status === "today" ? "size-24" : "size-[4.5rem]";
        return <li key={step.mission.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${nodeX(index)}%`, top: index * ROW + 60 }}>
          <div className="relative flex flex-col items-center">
            {step.status === "today" ? <span aria-hidden="true" className="absolute -top-9 whitespace-nowrap rounded-full bg-sunshine px-3 py-1 text-xs font-black text-ink shadow-[0_3px_0_#d99052]">Today!</span> : null}
            <button ref={step.status === "today" || step.status === "tomorrow" || step.status === "premium" ? current : undefined} type="button" aria-label={label} onClick={() => open ? onOpen(step) : onLocked(step)}
              className={`relative grid ${size} place-items-center rounded-full border-4 text-4xl shadow-[0_6px_0_rgba(30,40,90,0.35)] transition-transform focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white ${step.status === "done" ? `${info.tint} border-[#7ad9a6] hover:-translate-y-1` : step.status === "today" ? `mission-bob ${info.tint} border-white text-5xl ring-4 ring-sunshine hover:-translate-y-1` : "border-white/60 bg-[#6d6a9c]"}`}>
              {open ? <span aria-hidden="true">{step.mission.emoji}</span> : <Padlock locked className="size-9" />}
              {step.status === "done" ? <span aria-hidden="true" className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-sunshine text-sm shadow-[0_2px_0_#d99052]">⭐</span> : null}
              {step.status === "tomorrow" ? <span aria-hidden="true" className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-[#2b356f] text-sm">🌙</span> : null}
              {step.premium && step.status !== "done" ? <span aria-hidden="true" className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full border-2 border-white bg-sunshine text-xs">⭐</span> : null}
            </button>
            <span aria-hidden="true" className={`mt-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-black ${open ? "bg-white text-ink" : "bg-white/25 text-white"}`}>Day {step.day}</span>
            {step.status === "today" ? <span aria-hidden="true" className={`absolute top-2 w-16 ${nodeX(index) > 50 ? "right-full mr-2" : "left-full ml-2"}`}><BearMascot className="block h-auto w-full drop-shadow-[0_4px_0_rgba(30,40,90,0.3)]" /></span> : null}
          </div>
        </li>;
      })}</ol>
    </div>
  </div>;
}
