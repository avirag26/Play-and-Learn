import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { audioStatusMessage } from "@/features/games/game-ui";
import { detectiveKidRule, detectiveMissions, detectiveSafety, getColor, type DetectiveMission } from "@/lib/color-data";
import type { AudioErrorHandler, AudioResult } from "@/lib/speech";

type Props = {
  done: readonly string[];
  onToggle: (id: string) => void;
  onDone: () => void;
  /** Reads a mission aloud when it appears. */
  onAnnounce: (text: string) => void;
  say: (text: string, onError: AudioErrorHandler) => AudioResult;
  onStatus: (message: string) => void;
};

/** Each find circle shows the mission's colors in turn (red, yellow, blue for the toy rainbow). */
function circleColor(mission: DetectiveMission, position: number) {
  return getColor(mission.colors.length === mission.count ? mission.colors[position] : mission.colors[0]);
}

/**
 * Real-world color hunts, one big mission at a time so a child can follow along and press Next.
 * A grown-up confirms each find; nothing is photographed or recorded.
 */
export function ColorDetective({ done, onToggle, onDone, onAnnounce, say, onStatus }: Props) {
  const [index, setIndex] = useState(0);
  const [found, setFound] = useState<Record<string, number>>({});
  const mission = detectiveMissions[index];
  const solved = done.includes(mission.id);
  const filled = solved ? mission.count : found[mission.id] ?? 0;
  const last = index === detectiveMissions.length - 1;

  function go(next: number) {
    if (next < 0 || next >= detectiveMissions.length) return;
    setIndex(next);
    onAnnounce(detectiveMissions[next].short);
  }

  function tapCircle(position: number) {
    if (solved) return;
    const next = position + 1 === filled ? position : position + 1;
    setFound((current) => ({ ...current, [mission.id]: next }));
    if (next === mission.count && filled < mission.count) onAnnounce(mission.count === 1 ? "You found it! Tap we found it!" : "You found them all! Tap we found it!");
  }

  function toggle() {
    if (solved) setFound((current) => ({ ...current, [mission.id]: 0 }));
    onToggle(mission.id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLElement && event.target.closest("summary, details[open]")) return;
    if (event.key === "ArrowLeft") go(index - 1);
    else if (event.key === "ArrowRight") go(index + 1);
  }

  return <Card className="mt-3 flex flex-1 flex-col gap-2 bg-white p-3 sm:mt-6 sm:gap-4 sm:p-6" onKeyDown={onKeyDown}>
    <div className="flex items-center justify-between gap-2">
      <span className="whitespace-nowrap rounded-full bg-sky px-3 py-1 text-sm font-black text-ink sm:text-base">Mission {index + 1} of {detectiveMissions.length}</span>
      <ol aria-label="Missions" className="flex justify-end gap-0.5 max-[399px]:hidden sm:gap-1">{detectiveMissions.map((item, position) => <li key={item.id}><button type="button" onClick={() => go(position)} aria-label={`Mission ${position + 1}${done.includes(item.id) ? ", done" : ""}`} aria-current={position === index ? "step" : undefined} className={`grid size-5 place-items-center rounded-full text-[0.6rem] font-black focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-ink sm:size-7 ${done.includes(item.id) ? "bg-mint text-ink" : "bg-cream text-muted-ink"} ${position === index ? "ring-3 ring-ink" : ""}`}>{done.includes(item.id) ? "✓" : position + 1}</button></li>)}</ol>
    </div>

    <div key={mission.id} className={`game-pop flex flex-1 flex-col items-center justify-center gap-2 rounded-[2rem] p-3 text-center sm:gap-4 sm:p-6 ${solved ? "bg-mint/70" : "bg-cream"}`}>
      <div aria-hidden="true" className="flex justify-center gap-3">{mission.colors.map((id) => { const color = getColor(id); return <span key={id} className="flex flex-col items-center gap-1"><span className="block size-11 rounded-full border-4 border-ink/20 shadow-[0_4px_0_rgba(42,91,145,0.15)] sm:size-20" style={{ backgroundColor: color.hex }} /><span className="text-xs font-black text-ink sm:text-base">{color.name}</span></span>; })}</div>
      <h3 className="text-[clamp(1.45rem,6.5vw,2.5rem)] font-black leading-tight text-ink">{mission.short}</h3>
      <div className="flex items-center justify-center gap-3">
        <p className="flex items-center gap-2 text-base font-black text-muted-ink sm:text-lg">Like <span aria-hidden="true" className="flex gap-1.5 text-[clamp(1.75rem,5dvh,3rem)] leading-none">{mission.examples.map((emoji) => <span key={emoji}>{emoji}</span>)}</span></p>
        <button type="button" onClick={() => onStatus(audioStatusMessage(say(mission.short, (reason) => onStatus(audioStatusMessage("unavailable", reason)))))} aria-label={`Read it to me: ${mission.short}`} title="Read it to me" className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-white text-xl focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"><span aria-hidden="true">🔊</span></button>
      </div>
    </div>

    <div className="text-center">
      <p className="text-sm font-black text-ink sm:text-base">{solved ? "You did it! ⭐" : mission.count === 1 ? "Found it? Tap the circle!" : `Tap a circle for each one you find!`}</p>
      <div className="mt-1.5 flex justify-center gap-3">{Array.from({ length: mission.count }, (_, position) => {
        const color = circleColor(mission, position);
        const on = position < filled;
        return <button key={position} type="button" onClick={() => tapCircle(position)} disabled={solved} aria-pressed={on} aria-label={`Found ${color.name.toLowerCase()} thing ${position + 1}`} className={`grid size-14 place-items-center rounded-full border-4 text-2xl sm:size-16 font-black transition-transform focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-default ${on ? "game-celebrate border-ink" : "border-dashed border-ink/40 bg-white hover:-translate-y-0.5"}`} style={on ? { backgroundColor: color.hex, color: color.id === "white" || color.id === "yellow" || color.id === "pink" ? "#30465d" : "white" } : undefined}>{on ? "✓" : <span className="text-base text-muted-ink">{position + 1}</span>}</button>;
      })}</div>
    </div>

    {solved
      ? <div className="flex min-h-12 items-center justify-center gap-3 rounded-full bg-mint px-4 py-1"><span className="whitespace-nowrap text-lg font-black text-ink">Done! 🔎</span><button type="button" onClick={toggle} className="min-h-11 whitespace-nowrap rounded-full bg-white px-4 text-sm font-black text-ink underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-ink">Not yet</button></div>
      : <button type="button" onClick={toggle} className={`min-h-12 w-full rounded-full px-5 text-lg font-black transition sm:min-h-14 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink ${filled >= mission.count ? "game-celebrate bg-ink text-white shadow-[0_5px_0_#22384c]" : "border-2 border-ink bg-white text-ink"}`}>We found it! 🎉</button>}

    <div className="grid grid-cols-2 gap-3">
      <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0} className="min-h-12 text-lg disabled:opacity-50 sm:min-h-14">← Back</Button>
      {last ? <Button onClick={onDone} className="min-h-12 text-lg sm:min-h-14">Finish 🏁</Button> : <Button onClick={() => go(index + 1)} className="min-h-12 text-lg sm:min-h-14">Next →</Button>}
    </div>

    <p className="text-center text-sm font-black text-ink"><span aria-hidden="true">👀 </span>{detectiveKidRule}</p>
    <details className="rounded-2xl bg-sunshine/40 px-4 py-2 text-sm text-ink">
      <summary className="flex min-h-11 cursor-pointer items-center font-black">For grown-ups</summary>
      <p className="mt-1 leading-6"><span className="font-black">Read along:</span> {mission.instruction}</p>
      <p className="mt-1 leading-6"><span className="font-black">Tip:</span> {mission.tip}</p>
      {mission.safety ? <p className="mt-1 leading-6"><span className="font-black">Safety first:</span> {mission.safety}</p> : null}
      <p className="mt-1 pb-1 leading-6 text-muted-ink">{detectiveSafety} Tap “We found it!” together when the mission is done.</p>
    </details>
  </Card>;
}
