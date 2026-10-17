"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AudioStatus, ChoiceButton, CompletionCard, GameHero, GameScreen, GameTopBar, ModeCard, ModeHeader, QuizCard, SpeakerButton } from "@/features/games/game-ui";
import { useQuizSession } from "@/features/games/use-quiz-session";
import { BearMascot } from "@/features/home/illustrations";
import { alphabet, type AlphabetEntry } from "@/lib/alphabet-data";
import { emptyAlphabetProgress, readAlphabetProgress, saveAlphabetProgress, type AlphabetMode, type AlphabetProgress } from "@/lib/alphabet-progress";
import { makeChoices, makeQuestionOrder } from "@/lib/alphabet-questions";
import { speakAlphabet, stopAlphabetSpeech } from "@/lib/alphabet-speech";
import { speakableText } from "@/lib/encouragement";

const sessionLength = 8;
const modeNames: Record<AlphabetMode, string> = {
  discover: "Discover the Letters",
  find: "Find the Letter",
  match: "Match the Letter",
};

function ObjectArt({ entry, compact = false }: { entry: AlphabetEntry; compact?: boolean }) {
  return <span role="img" aria-label={entry.object} className={`block select-none leading-none ${compact ? "text-[clamp(2.5rem,8dvh,4.5rem)] sm:text-7xl" : "text-[clamp(3.5rem,8dvh,6rem)] sm:text-9xl"}`}>{entry.illustration}</span>;
}

function AlphabetTrail({ current, discovered }: { current: number; discovered: string[] }) {
  return <div role="img" aria-label={`Alphabet trail: ${discovered.length} of 26 letters discovered`} className="grid grid-cols-13 gap-1">{alphabet.map((entry, position) => <span key={entry.upper} aria-hidden="true" className={`grid aspect-square place-items-center rounded-lg text-xs font-black transition-transform sm:text-sm ${position === current ? "scale-110 bg-sunshine text-ink ring-2 ring-ink" : discovered.includes(entry.upper) ? "bg-mint text-ink" : "bg-cream text-muted-ink/60"}`}>{entry.upper}</span>)}</div>;
}

export function AlphabetAdventure() {
  const [progress, setProgress] = useState<AlphabetProgress>(emptyAlphabetProgress);
  const progressRef = useRef<AlphabetProgress>(emptyAlphabetProgress);
  const [mode, setMode] = useState<AlphabetMode | null>(null);
  const [summary, setSummary] = useState<AlphabetMode | null>(null);
  const [discoverIndex, setDiscoverIndex] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [audioStatus, setAudioStatus] = useState("");
  const quiz = useQuizSession<AlphabetEntry>();

  useEffect(() => {
    const timer = window.setTimeout(() => { const saved = readAlphabetProgress(); progressRef.current = saved; setProgress(saved); }, 0);
    return () => { window.clearTimeout(timer); stopAlphabetSpeech(); };
  }, []);

  // Visited pages stay mounted but hidden (Cache Components); coming back to the game starts on its mode list.
  useLayoutEffect(() => () => { setMode(null); setSummary(null); setAudioStatus(""); }, []);

  function commit(next: AlphabetProgress) {
    progressRef.current = next;
    setProgress(next);
    saveAlphabetProgress(next);
  }

  function markDiscovered(letter: string) {
    const current = progressRef.current;
    if (!current.discovered.includes(letter)) commit({ ...current, discovered: [...current.discovered, letter] });
  }

  function start(nextMode: AlphabetMode) {
    stopAlphabetSpeech();
    setAudioStatus("");
    setSummary(null);
    setMode(nextMode);
    if (nextMode === "discover") {
      setDiscoverIndex(0);
      markDiscovered(alphabet[0].upper);
    } else {
      const nextOrder = makeQuestionOrder();
      setOrder(nextOrder);
      quiz.start(makeChoices(nextOrder[0]));
    }
  }

  function finish() {
    stopAlphabetSpeech();
    if (!mode) return;
    const current = progressRef.current;
    if (!current.completed.includes(mode)) commit({ ...current, completed: [...current.completed, mode] });
    setSummary(mode);
    setMode(null);
    setAudioStatus("");
  }

  function backToModes() {
    stopAlphabetSpeech();
    setMode(null);
    setSummary(null);
    setAudioStatus("");
  }

  function moveDiscover(delta: number) {
    stopAlphabetSpeech();
    setAudioStatus("");
    const next = discoverIndex + delta;
    if (next >= alphabet.length) { finish(); return; }
    if (next < 0) return;
    setDiscoverIndex(next);
    markDiscovered(alphabet[next].upper);
  }

  function answer(entry: AlphabetEntry) {
    if (!mode || mode === "discover" || order.length === 0) return;
    const correct = entry.upper === alphabet[order[quiz.index]].upper;
    const result = quiz.answer(correct);
    if (!result) return;
    const current = progressRef.current;
    commit({ ...current, attempted: current.attempted + (result.firstAttempt ? 1 : 0), correct: current.correct + (correct ? 1 : 0) });
    speakAlphabet(speakableText(result.message));
  }

  function showQuestion(position: number) {
    stopAlphabetSpeech();
    setAudioStatus("");
    quiz.show(position, (previous) => makeChoices(order[position], previous.findIndex((item) => item.upper === alphabet[order[quiz.index]].upper)));
  }

  function nextQuestion() {
    if (!quiz.isLocked()) return;
    if (quiz.index + 1 >= sessionLength) { finish(); return; }
    showQuestion(quiz.index + 1);
  }

  const index = mode === "discover" ? discoverIndex : quiz.index;
  const target = mode === "discover" ? alphabet[discoverIndex] : order.length > 0 ? alphabet[order[quiz.index]] : null;
  const prompt = target && mode === "find" ? `Can you find ${target.upper}?` : target && mode === "match" ? `What begins with ${target.upper}?` : "";
  const spokenPrompt = !target || !mode ? "" : mode === "discover" ? target.pronunciation : mode === "find" ? `Can you find the letter ${target.upper}?` : `What begins with the letter ${target.upper}?`;

  // Read each new letter or question aloud as soon as it appears; "Hear it again" repeats it.
  useEffect(() => {
    if (spokenPrompt) speakAlphabet(spokenPrompt);
  }, [spokenPrompt, index]);

  const speaker = (label: string) => <SpeakerButton label={label} onPlay={(onError) => speakAlphabet(spokenPrompt, onError)} onStatus={setAudioStatus} />;

  return <GameScreen active={mode !== null}>
    <GameTopBar inMode={Boolean(mode || summary)} onBackToModes={backToModes} onLeave={stopAlphabetSpeech} />
    <GameHero eyebrow="Game 1" title="Alphabet Adventure" description="Explore A to Z with a friendly little bear." art={<BearMascot className="w-14 shrink-0 sm:w-28" />} hidden={Boolean(mode || summary)} />

    {summary ? <CompletionCard art={<BearMascot className="game-celebrate w-full" />} subtitle={`You finished ${modeNames[summary]}.`} stats={summary === "discover" ? [{ value: alphabet.length, label: "letters explored" }, { value: progress.discovered.length, label: "different letters discovered" }] : [{ value: quiz.sessionCorrect, label: "answers found" }, { value: quiz.sessionAttempts, label: "tries this round" }]} onPlayAgain={() => start(summary)} onChooseMode={backToModes} />
    : mode === null ? <section className="mt-4 flex flex-col max-md:flex-1 sm:mt-7"><h2 className="text-xl font-black text-ink sm:text-3xl">Choose an adventure</h2><p className="mt-1 text-sm text-muted-ink sm:mt-2 sm:text-base">Pick one way to play. You can change modes anytime.</p><div className="mt-3 grid gap-2 max-md:flex-1 sm:mt-5 sm:gap-4 md:grid-cols-3">
      <ModeCard emoji="🔤" title={modeNames.discover} description="Meet every letter and hear its word." onStart={() => start("discover")} />
      <ModeCard emoji="🔎" title={modeNames.find} description="Spot the letter among three choices." onStart={() => start("find")} />
      <ModeCard emoji="🧩" title={modeNames.match} description="Match each letter to its picture." onStart={() => start("match")} />
    </div><Card className="mt-3 bg-white p-4 sm:mt-6 sm:p-6"><h2 className="text-base font-black text-ink sm:text-lg">Your alphabet journey</h2><p className="mt-1 text-xs text-muted-ink sm:mt-2 sm:text-sm">{progress.discovered.length} of 26 letters discovered · {progress.correct} correct answers · {progress.completed.length} activities completed</p></Card></section>
    : target ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><ModeHeader title={modeNames[mode]} counter={mode === "discover" ? `Letter ${index + 1} of 26` : `Question ${index + 1} of ${sessionLength}`} current={index + 1} total={mode === "discover" ? alphabet.length : sessionLength} />
      {mode === "discover" ? <Card className="mt-3 flex flex-1 flex-col gap-2 bg-white p-4 sm:mt-6 sm:gap-6 sm:p-9">
        <div className="flex flex-1 flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-center sm:gap-5"><div className="flex flex-1 items-center justify-center rounded-[2rem] bg-lavender/50 p-3 text-center sm:p-5"><p className="text-[clamp(3rem,10dvh,8rem)] font-black leading-none text-ink sm:text-[8rem]">{target.upper}<span className="ml-2 text-[clamp(2rem,6dvh,4rem)] text-[#6a4d86] sm:text-6xl">{target.lower}</span></p></div><div className="text-center"><ObjectArt entry={target} /><h3 className="mt-1 text-2xl font-black text-ink sm:mt-3 sm:text-3xl">{target.object}</h3><p className="mt-1 text-base text-muted-ink sm:mt-2 sm:text-lg">{target.sentence}</p><div className="mt-3 sm:mt-5">{speaker(`Hear ${target.upper} and ${target.object}`)}</div></div></div>
        <AlphabetTrail current={discoverIndex} discovered={progress.discovered} />
        <div className="flex justify-between gap-3"><Button variant="secondary" onClick={() => moveDiscover(-1)} disabled={discoverIndex === 0} className="flex-1 whitespace-nowrap px-2 disabled:opacity-50 sm:flex-none sm:px-6">← Previous</Button><Button onClick={() => moveDiscover(1)} className="flex-1 whitespace-nowrap px-2 sm:flex-none sm:px-6">{discoverIndex === alphabet.length - 1 ? "Finish adventure" : "Next letter →"}</Button></div>
      </Card> : <QuizCard prompt={prompt} helper={mode === "match" ? `Choose the picture that begins with ${target.upper}.` : undefined} audio={speaker("Hear the question again")} feedback={quiz.feedback} message={quiz.message} earned={quiz.sessionCorrect} total={sessionLength} index={quiz.index} onPrevious={() => showQuestion(quiz.index - 1)} onNext={nextQuestion}
        choices={quiz.choices.map((entry) => <ChoiceButton key={entry.upper} label={mode === "find" ? `Letter ${entry.upper}` : entry.object} found={quiz.feedback === "correct" && entry.upper === target.upper} disabled={quiz.feedback === "correct"} onClick={() => answer(entry)}>{mode === "find" ? <span className="text-[clamp(3rem,10dvh,6rem)] font-black leading-none text-ink sm:text-8xl">{entry.upper}</span> : <><ObjectArt entry={entry} compact /><span className="mt-2 block text-xs font-black text-ink sm:text-lg">{entry.object}</span></>}</ChoiceButton>)} />}
      <AudioStatus message={audioStatus} />
    </section> : <Card className="mt-6 bg-white p-6"><p className="font-bold text-ink">Getting the adventure ready…</p><Button onClick={backToModes} className="mt-4">Choose a mode</Button></Card>}
  </GameScreen>;
}
