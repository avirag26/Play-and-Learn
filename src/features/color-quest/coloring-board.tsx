import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { colors, getColor, type ColorId } from "@/lib/color-data";
import { coloredCount, emptyColoring, fillRegion, isPictureComplete, resetColoring, undoColoring, type ColoringState } from "@/lib/coloring";
import { getPicture, pictures, type PictureId } from "@/lib/coloring-pictures";

const ink = "#30465d";
// Uncolored areas are a very light cream, so painting them white still shows a change.
const blank = "#fdf8ee";

/** One numbered "how to play" step; narrow phones show the short label so each step stays on one line. */
function Step({ number, short, swatch, children }: { number: number; short: string; swatch?: string; children: ReactNode }) {
  return <li className="flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-sky px-1.5 py-1 sm:gap-1.5 sm:px-3"><span aria-hidden="true" className="grid size-4 shrink-0 place-items-center rounded-full bg-ink text-[0.6rem] text-white sm:size-5 sm:text-xs">{number}</span><span className="sr-only">Step {number}: {children}</span><span aria-hidden="true" className="min-[400px]:hidden">{short}</span><span aria-hidden="true" className="max-[399px]:hidden">{children}</span>{swatch ? <span aria-hidden="true" className="inline-block size-3 shrink-0 rounded-full border border-ink/30 sm:size-3.5" style={{ backgroundColor: swatch }} /> : null}</li>;
}

/** Pick a picture and a paint color, then tap areas to fill them. Pictures keep their colors until the mode is closed. */
export function ColoringBoard({ onPickColor, onPictureComplete, onDone }: { onPickColor: (color: ColorId) => void; onPictureComplete: (id: PictureId) => void; onDone: () => void }) {
  const [pictureId, setPictureId] = useState<PictureId>(pictures[0].id);
  const [states, setStates] = useState<Partial<Record<PictureId, ColoringState>>>({});
  const [selected, setSelected] = useState<ColorId>("red");
  const picture = getPicture(pictureId);
  const state = states[pictureId] ?? emptyColoring;
  const complete = isPictureComplete(picture, state.fills);
  const paint = getColor(selected);

  function update(next: ColoringState) {
    if (next === state) return;
    setStates((current) => ({ ...current, [pictureId]: next }));
    if (!complete && isPictureComplete(picture, next.fills)) onPictureComplete(pictureId);
  }

  function pick(color: ColorId) {
    setSelected(color);
    onPickColor(color);
  }

  function onRegionKey(event: KeyboardEvent<SVGPathElement>, regionId: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    update(fillRegion(state, picture, regionId, selected));
  }

  const controls = <>
    <Button variant="secondary" onClick={() => update(undoColoring(state))} disabled={state.history.length === 0} className="min-h-11 whitespace-nowrap px-2 text-sm disabled:opacity-50"><span aria-hidden="true">↩</span> Undo</Button>
    <Button variant="secondary" onClick={() => update(resetColoring(state))} disabled={Object.keys(state.fills).length === 0} className="min-h-11 whitespace-nowrap px-2 text-sm disabled:opacity-50">Start over</Button>
    <Button onClick={onDone} className="min-h-11 whitespace-nowrap px-2 text-sm sm:text-base">I&apos;m done</Button>
  </>;

  return <Card className="mt-3 flex flex-1 flex-col gap-2 bg-white p-3 sm:mt-6 sm:gap-4 sm:p-6">
    <ol aria-label="How to play" className="grid grid-cols-3 gap-1 text-[0.7rem] font-black leading-tight text-ink sm:gap-2 sm:text-sm">
      <Step number={1} short="Picture">Pick a picture</Step>
      <Step number={2} short="Color">Pick a color</Step>
      <Step number={3} short="Paint" swatch={paint.hex}>Tap to paint</Step>
    </ol>

    <div role="group" aria-label="Step 1: choose a picture" className="grid grid-cols-5 gap-1.5 sm:gap-3">{pictures.map((item) => {
      const done = isPictureComplete(item, states[item.id]?.fills ?? {});
      return <button key={item.id} type="button" onClick={() => setPictureId(item.id)} aria-pressed={item.id === pictureId} aria-label={`${item.name} picture${done ? ", all colored" : ""}`} className={`relative flex min-h-12 min-w-0 flex-col items-center justify-center rounded-2xl border-2 px-1 py-1 text-[0.65rem] font-black leading-tight text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink sm:min-h-16 sm:text-sm ${item.id === pictureId ? "border-ink bg-sunshine/60" : "border-transparent bg-cream"}`}><span aria-hidden="true" className="text-xl sm:text-2xl">{item.emoji}</span><span className="max-w-full truncate max-[359px]:sr-only">{item.name}</span>{done ? <span aria-hidden="true" className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-mint text-[0.6rem]">✓</span> : null}</button>;
    })}</div>

    {/* Most phones: palette beside the picture. Tall, narrow phones: palette under it, which leaves a bigger picture. Both size the picture to the screen height. */}
    <div className="flex min-h-0 items-start justify-center gap-2 sm:gap-4 md:gap-6 tall-phone:flex-col tall-phone:items-stretch">
      <div className="min-w-0 flex-1 tall-phone:flex-none md:max-w-[36rem]">
        <svg viewBox="0 0 200 200" role="group" aria-label={`Step 3: ${picture.name} picture. Tap a part to paint it ${paint.name.toLowerCase()}.`} className="mx-auto block aspect-square w-[min(100%,max(9rem,calc(100dvh-26rem)))] touch-manipulation select-none overflow-hidden rounded-3xl border-4 border-ink/25 bg-white shadow-[0_4px_0_rgba(42,91,145,0.15)] tall-phone:w-[min(100%,calc(100dvh-36.5rem))] md:w-[min(100%,max(18rem,calc(100dvh-24rem)))]">
          {picture.regions.map((region) => {
            const fill = state.fills[region.id];
            return <path key={region.id} d={region.d} transform={region.transform} fill={fill ? getColor(fill).hex : blank} stroke={ink} strokeWidth={3.5} strokeLinejoin="round" role="button" tabIndex={0} aria-label={`${region.label}, ${fill ? getColor(fill).name.toLowerCase() : "not colored yet"}`} onClick={() => update(fillRegion(state, picture, region.id, selected))} onKeyDown={(event) => onRegionKey(event, region.id)} className="cursor-pointer outline-none transition-[fill] focus-visible:[stroke-width:7]" />;
          })}
          {picture.lines ? <path d={picture.lines.join("")} fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" pointerEvents="none" /> : null}
        </svg>
        <p role="status" className={`mt-2 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl px-2 py-1 text-center text-xs font-black text-ink sm:text-sm ${complete ? "game-pop bg-mint" : "bg-cream"}`}>{complete ? `You colored the whole ${picture.name.toLowerCase()}! 🎉` : <><span aria-hidden="true" className="inline-block size-3.5 shrink-0 rounded-full border border-ink/30" style={{ backgroundColor: paint.hex }} />{paint.name} · {coloredCount(picture, state.fills)}/{picture.regions.length} done</>}</p>
      </div>

      <div className="flex shrink-0 flex-col gap-3 md:w-64">
        <div role="group" aria-label="Step 2: choose a paint color" className="grid grid-cols-2 gap-1.5 tall-phone:grid-cols-5 tall-phone:justify-items-center tall-phone:gap-2 md:grid-cols-5 md:gap-2">{colors.map((color) => <button key={color.id} type="button" onClick={() => pick(color.id)} aria-pressed={color.id === selected} aria-label={color.name} title={color.name} className={`grid size-11 place-items-center rounded-full border-4 text-lg font-black focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink tall-phone:size-12 md:aspect-square md:size-auto md:min-h-11 md:w-full ${color.id === selected ? "border-ink shadow-[0_0_0_2px_white,0_0_0_4px_#30465d]" : "border-ink/15"}`} style={{ backgroundColor: color.hex, color: color.id === "white" || color.id === "yellow" || color.id === "pink" ? ink : "white" }}>{color.id === selected ? <span aria-hidden="true">✓</span> : null}</button>)}</div>
        <div className="hidden flex-col gap-2 md:flex">{controls}</div>
      </div>
    </div>
    <div className="mt-auto grid grid-cols-3 gap-2 md:hidden">{controls}</div>
  </Card>;
}
