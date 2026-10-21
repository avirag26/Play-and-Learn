"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Confetti, type ConfettiHandle } from "@/components/ui/confetti";
import { CountItem } from "@/features/count-the-stars/count-item";
import { adventureChallenges, countingMissions, countingMissionSafety, getCountObject, numberWords, type AdventureChallenge } from "@/lib/count-data";
import { collectItem, makeChallengeField, objectHint, type FieldItem } from "@/lib/count-questions";

type Props = {
  challengesDone: readonly string[];
  missionsDone: readonly string[];
  onChallengeDone: (id: string) => void;
  onToggleMission: (id: string) => void;
  onAnnounce: (text: string) => void;
  onDone: () => void;
};

/** Tap the right things to reach the goal; a basket shows how many are collected. */
function ChallengePlay({ challenge, onComplete, onAnnounce, onNext, onBack, hasNext }: { challenge: AdventureChallenge; onComplete: () => void; onAnnounce: (text: string) => void; onNext: () => void; onBack: () => void; hasNext: boolean }) {
  const [field] = useState<FieldItem[]>(() => makeChallengeField(challenge));
  const [collected, setCollected] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const confetti = useRef<ConfettiHandle>(null);
  const done = collected.length >= challenge.goal;
  const object = getCountObject(challenge.object);

  function tap(item: FieldItem) {
    const result = collectItem(challenge, collected, item);
    if (result.result === "wrong-object") { const text = objectHint(challenge, item); setHint(text); onAnnounce(text); return; }
    if (result.result !== "collected") return;
    setCollected(result.collected);
    setHint("");
    if (result.collected.length === challenge.goal) { onComplete(); confetti.current?.burst(); onAnnounce(challenge.success); }
    else onAnnounce(numberWords[result.collected.length]);
  }

  return <Card className="mt-3 flex flex-1 flex-col gap-3 bg-white p-3 sm:mt-6 sm:gap-5 sm:p-8">
    <Confetti ref={confetti} autoFire={false} />
    <div className="flex items-center gap-3 rounded-3xl bg-sky p-3 sm:p-4">
      <span aria-hidden="true" className={`grid size-16 shrink-0 place-items-center rounded-full bg-white text-4xl sm:size-20 sm:text-5xl ${done ? "game-celebrate" : ""}`}>{challenge.helper.emoji}</span>
      <div className="min-w-0 flex-1"><h3 className="text-xl font-black leading-tight text-ink sm:text-3xl">{challenge.prompt}</h3><p className="mt-1 text-sm font-bold text-muted-ink">{done ? challenge.success : `Tap the ${object.many} to give them to ${challenge.helper.name}.`}</p></div>
    </div>

    <div className="rounded-3xl border-4 border-dashed border-sunshine bg-cream p-2 sm:p-3">
      <div className="flex items-center justify-between gap-2 px-1"><p className="text-sm font-black text-ink">Basket</p><p className="rounded-full bg-white px-3 py-0.5 text-sm font-black text-ink" aria-live="polite">{Math.min(collected.length, challenge.goal)} of {challenge.goal}</p></div>
      <div role="img" aria-label={`${collected.length} of ${challenge.goal} ${object.many} collected`} className="mt-1 flex flex-wrap justify-center gap-1 text-2xl sm:text-3xl">{Array.from({ length: challenge.goal }, (_, position) => <span key={position} className={`grid size-10 place-items-center rounded-xl sm:size-12 ${position < collected.length ? "game-pop bg-sunshine/50" : "bg-white opacity-50"}`}>{position < collected.length ? <CountItem object={challenge.object} /> : <span aria-hidden="true" className="text-base font-black text-muted-ink">{position + 1}</span>}</span>)}</div>
    </div>

    <ul aria-label="Things to tap" className="grid min-h-0 flex-1 grid-cols-4 content-center gap-2 sm:grid-cols-5 sm:gap-3 lg:grid-cols-7">{field.map((item) => {
      const taken = collected.includes(item.id);
      return <li key={item.id}><button type="button" onClick={() => tap(item)} disabled={taken || done} aria-label={taken ? `${getCountObject(item.object).one}, collected` : getCountObject(item.object).one} className={`grid aspect-square w-full min-h-11 place-items-center rounded-2xl text-[clamp(1.75rem,6dvh,2.75rem)] transition focus-visible:outline-3 focus-visible:outline-ink ${taken ? "scale-75 bg-mint/40 opacity-30" : done ? "bg-sky/50" : "bg-sky hover:-translate-y-1"}`}><CountItem object={item.object} /></button></li>;
    })}</ul>

    <p role="status" className={`min-h-6 text-center text-sm font-black ${hint ? "text-ink" : "text-transparent"}`}>{hint || "."}</p>
    <div className="flex flex-wrap justify-center gap-3"><Button variant="secondary" onClick={onBack}>All challenges</Button>{done && hasNext ? <Button onClick={onNext}>Next challenge →</Button> : null}</div>
  </Card>;
}

/** Number Adventure: short goals to play, plus optional counting missions at home. */
export function NumberAdventure({ challengesDone, missionsDone, onChallengeDone, onToggleMission, onAnnounce, onDone }: Props) {
  const [active, setActive] = useState<number | null>(null);

  function open(index: number) { setActive(index); onAnnounce(adventureChallenges[index].prompt); }

  if (active !== null) {
    const challenge = adventureChallenges[active];
    return <ChallengePlay key={challenge.id} challenge={challenge} onComplete={() => onChallengeDone(challenge.id)} onAnnounce={onAnnounce} onBack={() => setActive(null)} onNext={() => open(active + 1)} hasNext={active + 1 < adventureChallenges.length} />;
  }

  return <div className="mt-3 flex flex-1 flex-col gap-4 sm:mt-6">
    <Card className="bg-white p-3 sm:p-6">
      <ul className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">{adventureChallenges.map((challenge, index) => {
        const done = challengesDone.includes(challenge.id);
        return <li key={challenge.id}><button type="button" onClick={() => open(index)} aria-label={`${challenge.prompt}${done ? " Done." : ""}`} className={`relative flex min-h-20 w-full items-center gap-3 rounded-3xl p-3 text-left transition hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${done ? "bg-mint/60" : "bg-cream shadow-[0_4px_0_rgba(42,91,145,0.15)]"}`}>
          <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-3xl">{challenge.helper.emoji}</span>
          <span className="min-w-0 flex-1"><span className="block font-black leading-tight text-ink">{challenge.prompt}</span><span className="mt-1 flex items-center gap-1 text-sm font-black text-muted-ink"><CountItem object={challenge.object} /> × {challenge.goal}</span></span>
          {done ? <span aria-hidden="true" className="absolute right-3 top-3 text-xl">⭐</span> : null}
        </button></li>;
      })}</ul>
    </Card>

    <Card className="bg-white p-4 sm:p-6">
      <h3 className="text-lg font-black text-ink"><span aria-hidden="true">🏡 </span>Count at home <span className="text-sm font-bold text-muted-ink">(optional, with a grown-up)</span></h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">{countingMissions.map((mission) => {
        const done = missionsDone.includes(mission.id);
        return <li key={mission.id} className={`flex flex-col gap-2 rounded-2xl p-3 ${done ? "bg-mint/60" : "bg-cream"}`}>
          <p className="font-black text-ink">{mission.title}</p>
          <p className="text-sm leading-6 text-ink/80">{mission.instruction}</p>
          <p className="text-xs leading-5 text-muted-ink"><span className="font-black">Grown-up tip:</span> {mission.tip}</p>
          <button type="button" onClick={() => onToggleMission(mission.id)} aria-pressed={done} className={`mt-auto min-h-11 rounded-full px-4 text-sm font-black transition focus-visible:outline-3 focus-visible:outline-ink ${done ? "bg-white text-ink" : "bg-ink text-white shadow-[0_3px_0_#22384c]"}`}>{done ? "Done ✓ (tap to undo)" : "We did it!"}</button>
        </li>;
      })}</ul>
      <p className="mt-3 rounded-2xl bg-sky px-4 py-2 text-xs font-bold leading-5 text-muted-ink">{countingMissionSafety}</p>
    </Card>
    <div className="flex justify-end"><Button onClick={onDone}>I&apos;m done</Button></div>
  </div>;
}
