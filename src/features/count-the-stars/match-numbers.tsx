"use client";

import { useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ObjectGroup } from "@/features/count-the-stars/count-item";
import { FeedbackBubble, StarTrail } from "@/features/games/game-ui";
import type { QuizFeedback } from "@/features/games/use-quiz-session";
import { countPhrase, numberWords } from "@/lib/count-data";
import { emptyMatchState, isRoundComplete, makeMatchRound, MATCH_ROUNDS, tryMatch, type CountLevel, type MatchGroup, type MatchRound } from "@/lib/count-questions";
import { cheerPhrases, pickPhrase, retryPhrases, speakableText } from "@/lib/encouragement";

type Props = {
  level: CountLevel;
  /** Each pair's first try is scored once. */
  onAnswer: (firstAttempt: boolean, correct: boolean) => void;
  onAnnounce: (text: string) => void;
  onDone: (stats: { rounds: number; firstTry: number }) => void;
};

/**
 * Pair number cards with groups of things. Tap a number, then its group (either order works);
 * on a computer the number cards can also be dragged onto a group.
 */
export function MatchNumbers({ level, onAnswer, onAnnounce, onDone }: Props) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState<MatchRound>(() => makeMatchRound(level));
  const [state, setState] = useState(emptyMatchState);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<QuizFeedback>("idle");
  const [message, setMessage] = useState("");
  const [firstTry, setFirstTry] = useState(0);
  const complete = isRoundComplete(round, state);
  const last = roundIndex + 1 >= MATCH_ROUNDS;

  function attempt(number: number, group: MatchGroup) {
    const result = tryMatch(state, number, group);
    setSelectedNumber(null);
    setSelectedGroup(null);
    if (!result.counted) return;
    setState(result.state);
    onAnswer(result.firstAttempt, result.correct);
    if (result.correct && result.firstAttempt) setFirstTry((value) => value + 1);
    const phrase = pickPhrase(result.correct ? cheerPhrases : retryPhrases);
    const done = result.correct && isRoundComplete(round, result.state);
    setFeedback(result.correct ? "correct" : "retry");
    setMessage(done ? `${phrase} All matched!` : phrase);
    onAnnounce(result.correct ? `${speakableText(phrase)} ${countPhrase(group.count, group.object)}!` : `${speakableText(phrase)} Count them again.`);
  }

  function pickNumber(number: number) {
    if (state.matched.includes(number)) return;
    const group = round.groups.find((item) => item.id === selectedGroup);
    if (group) { attempt(number, group); return; }
    setSelectedNumber((current) => current === number ? null : number);
    onAnnounce(numberWords[number]);
  }

  function pickGroup(group: MatchGroup) {
    if (state.matched.includes(group.count)) return;
    if (selectedNumber !== null) { attempt(selectedNumber, group); return; }
    setSelectedGroup((current) => current === group.id ? null : group.id);
  }

  function onDrop(event: DragEvent<HTMLButtonElement>, group: MatchGroup) {
    event.preventDefault();
    const number = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isInteger(number) && number > 0) attempt(number, group);
  }

  function nextRound() {
    if (last) { onDone({ rounds: MATCH_ROUNDS, firstTry }); return; }
    setRoundIndex((value) => value + 1);
    setRound(makeMatchRound(level));
    setState(emptyMatchState);
    setFeedback("idle");
    setMessage("");
    onAnnounce("Match the numbers!");
  }

  // Wide rows on small phones so every thing stays big enough to count.
  const columns = round.groups.length === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 min-[520px]:grid-cols-3";
  return <Card className="mt-3 flex flex-1 flex-col gap-3 bg-white p-3 sm:mt-6 sm:gap-5 sm:p-8">
    <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink">Round {roundIndex + 1} of {MATCH_ROUNDS}</p><h3 className="mt-1 text-xl font-black text-ink sm:text-3xl">Match each number to its group</h3><p className="mt-1 text-sm font-bold text-muted-ink">Tap a number, then tap the group with that many.</p></div>

    <div role="group" aria-label="Number cards" className={`grid gap-2 sm:gap-3 ${round.numbers.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>{round.numbers.map((number) => {
      const matched = state.matched.includes(number);
      const selected = selectedNumber === number;
      return <button key={number} type="button" draggable={!matched} onDragStart={(event) => { event.dataTransfer.setData("text/plain", String(number)); setSelectedNumber(number); }} onClick={() => pickNumber(number)} disabled={matched} aria-pressed={selected} aria-label={`Number ${numberWords[number]}${matched ? ", matched" : ""}`} className={`min-h-16 rounded-3xl border-4 text-4xl font-black text-ink transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink sm:min-h-20 sm:text-5xl ${matched ? "border-transparent bg-mint/60 opacity-60" : selected ? "-translate-y-1 border-ink bg-sunshine shadow-[0_5px_0_#d99052]" : "border-transparent bg-sunshine/60 hover:-translate-y-1"}`}>{number}</button>;
    })}</div>

    <div role="group" aria-label="Groups to match" className={`grid min-h-0 flex-1 gap-2 sm:gap-3 ${columns}`}>{round.groups.map((group) => {
      const matched = state.matched.includes(group.count);
      const selected = selectedGroup === group.id;
      return <button key={group.id} type="button" onClick={() => pickGroup(group)} onDragOver={(event) => { if (!matched) event.preventDefault(); }} onDrop={(event) => onDrop(event, group)} disabled={matched} aria-pressed={selected} aria-label={`${countPhrase(group.count, group.object)}${matched ? ", matched" : ""}`} className={`relative flex min-h-20 flex-col items-center justify-center rounded-3xl border-4 p-2 transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${matched ? "game-celebrate border-[#377a4f] bg-mint" : selected ? "border-ink bg-sky" : "border-transparent bg-sky hover:-translate-y-1"}`}>
        <ObjectGroup count={group.count} object={group.object} size="sm" />
        {matched ? <span className="game-pop absolute -right-1 -top-1 grid size-9 place-items-center rounded-full bg-ink text-lg font-black text-white">{group.count}</span> : null}
      </button>;
    })}</div>

    <FeedbackBubble feedback={feedback} message={message} idleText="Pick a number to start." />
    <StarTrail earned={roundIndex + (complete ? 1 : 0)} total={MATCH_ROUNDS} />
    <div className="flex justify-center"><Button onClick={nextRound} disabled={!complete} className="disabled:opacity-50">{last ? "See my stars" : "Next round →"}</Button></div>
  </Card>;
}
