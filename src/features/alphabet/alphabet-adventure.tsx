"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { BearMascot } from "@/features/home/illustrations";
import { alphabet, type AlphabetEntry } from "@/lib/alphabet-data";
import { emptyAlphabetProgress, readAlphabetProgress, saveAlphabetProgress, type AlphabetMode, type AlphabetProgress } from "@/lib/alphabet-progress";
import { makeChoices, makeQuestionOrder } from "@/lib/alphabet-questions";
import { speakAlphabet, stopAlphabetSpeech } from "@/lib/alphabet-speech";

const sessionLength = 8;
const cheerPhrases = ["Great job, dear! 🌟", "Wonderful! You got it! 🎉", "Yay! Well done, dear! ⭐", "Super star! That's right! 🌟", "Amazing work, dear! 🎈"];
const retryPhrases = ["No problem, dear. Try again! 💛", "Good try! Let's try once more. 🙂", "Almost, dear! You can do it! 💪", "That's okay, dear. Try again! 🌈"];

function pickPhrase(phrases: string[]) {
  return phrases[Math.floor(Math.random() * phrases.length)];
}
const modeNames: Record<AlphabetMode, string> = {
  discover: "Discover the Letters",
  find: "Find the Letter",
  match: "Match the Letter",
};

function ProgressBar({ current, total }: { current: number; total: number }) {
  return <div className="mt-3 sm:mt-5"><p className="sr-only text-center text-sm font-black text-ink sm:not-sr-only">{current} of {total}</p><div className="h-3 sm:mt-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-label="Activity progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}><div className="h-full rounded-full bg-[#6ab484] transition-[width]" style={{ width: `${current / total * 100}%` }} /></div></div>;
}

function SpeakerButton({ text, label, onStatus }: { text: string; label: string; onStatus: (message: string) => void }) {
  return <button type="button" onClick={() => { const result = speakAlphabet(text, () => onStatus("Audio is unavailable here. You can keep playing!")); onStatus(result === "muted" ? "Sound is off in grown-up settings. You can keep playing!" : result === "unavailable" ? "Audio is unavailable here. You can keep playing!" : "Playing audio."); }} aria-label={label} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-5 sm:min-h-12 text-sm font-black text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"><span aria-hidden="true">🔊</span> Hear it again</button>;
}

function ObjectArt({ entry, compact = false }: { entry: AlphabetEntry; compact?: boolean }) {
  return <span role="img" aria-label={entry.object} className={`block select-none leading-none ${compact ? "text-[clamp(2.5rem,8dvh,4.5rem)] sm:text-7xl" : "text-[clamp(3.5rem,8dvh,6rem)] sm:text-9xl"}`}>{entry.illustration}</span>;
}

function AlphabetTrail({ current, discovered }: { current: number; discovered: string[] }) {
  return <div role="img" aria-label={`Alphabet trail: ${discovered.length} of 26 letters discovered`} className="grid grid-cols-13 gap-1">{alphabet.map((entry, position) => <span key={entry.upper} aria-hidden="true" className={`grid aspect-square place-items-center rounded-lg text-xs font-black transition-transform sm:text-sm ${position === current ? "scale-110 bg-sunshine text-ink ring-2 ring-ink" : discovered.includes(entry.upper) ? "bg-mint text-ink" : "bg-cream text-muted-ink/60"}`}>{entry.upper}</span>)}</div>;
}

function StarTrail({ earned, total }: { earned: number; total: number }) {
  return <div role="img" aria-label={`${earned} of ${total} stars earned`} className="flex justify-center gap-1 text-xl sm:text-2xl">{Array.from({ length: total }, (_, position) => <span key={position} aria-hidden="true" className={position < earned ? "alphabet-celebrate" : "opacity-25 grayscale"}>⭐</span>)}</div>;
}

export function AlphabetAdventure() {
  const [progress, setProgress] = useState<AlphabetProgress>(emptyAlphabetProgress);
  const progressRef = useRef<AlphabetProgress>(emptyAlphabetProgress);
  const [mode, setMode] = useState<AlphabetMode | null>(null);
  const [summary, setSummary] = useState<AlphabetMode | null>(null);
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [choices, setChoices] = useState<AlphabetEntry[]>([]);
  const [feedback, setFeedback] = useState<"idle" | "retry" | "correct">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [audioStatus, setAudioStatus] = useState("");
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const locked = useRef(false);
  const choiceHistory = useRef<AlphabetEntry[][]>([]);
  const questionAttempted = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { const saved = readAlphabetProgress(); progressRef.current = saved; setProgress(saved); }, 0);
    return () => { window.clearTimeout(timer); stopAlphabetSpeech(); };
  }, []);

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
    setIndex(0);
    setFeedback("idle");
    setSessionAttempts(0);
    setSessionCorrect(0);
    locked.current = false;
    questionAttempted.current = false;
    if (nextMode === "discover") {
      setOrder([]);
      setChoices([]);
      markDiscovered(alphabet[0].upper);
    } else {
      const nextOrder = makeQuestionOrder();
      setOrder(nextOrder);
      const firstChoices = makeChoices(nextOrder[0]);
      choiceHistory.current = [firstChoices];
      setChoices(firstChoices);
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
    const next = index + delta;
    if (next >= alphabet.length) { finish(); return; }
    if (next < 0) return;
    setIndex(next);
    markDiscovered(alphabet[next].upper);
  }

  function answer(entry: AlphabetEntry) {
    if (locked.current || !mode || mode === "discover" || order.length === 0) return;
    const target = alphabet[order[index]];
    const correct = entry.upper === target.upper;
    const current = progressRef.current;
    commit({ ...current, attempted: current.attempted + (questionAttempted.current ? 0 : 1), correct: current.correct + (correct ? 1 : 0) });
    questionAttempted.current = true;
    setSessionAttempts((value) => value + 1);
    const message = pickPhrase(correct ? cheerPhrases : retryPhrases);
    setFeedbackMessage(message);
    speakAlphabet(message.replace(/[^\p{L}\p{N}\s,.!?']/gu, ""));
    if (correct) {
      locked.current = true;
      setSessionCorrect((value) => value + 1);
      setFeedback("correct");
    } else {
      setFeedback("retry");
    }
  }

  function nextQuestion() {
    if (!locked.current) return;
    stopAlphabetSpeech();
    if (index + 1 >= sessionLength) { finish(); return; }
    showQuestion(index + 1);
  }

  function previousQuestion() {
    stopAlphabetSpeech();
    if (index === 0) return;
    showQuestion(index - 1);
  }

  // Revisiting a question keeps its original choices; questions are solved in order, so earlier ones show as already found.
  function showQuestion(position: number) {
    let nextChoices = choiceHistory.current[position];
    if (!nextChoices) {
      const previousPosition = choices.findIndex((item) => item.upper === alphabet[order[index]].upper);
      nextChoices = makeChoices(order[position], previousPosition);
      choiceHistory.current[position] = nextChoices;
    }
    const solved = position < sessionCorrect;
    setChoices(nextChoices);
    setIndex(position);
    setFeedback(solved ? "correct" : "idle");
    setFeedbackMessage(solved ? "You found this one already, dear! 🌟" : "");
    setAudioStatus("");
    locked.current = solved;
    questionAttempted.current = solved;
  }

  const target = mode === "discover" ? alphabet[index] : order.length > 0 ? alphabet[order[index]] : null;
  const prompt = target && mode === "find" ? `Can you find ${target.upper}?` : target && mode === "match" ? `What begins with ${target.upper}?` : "";

  return <main data-game-active={mode !== null} className="alphabet-screen flex flex-col bg-cream pt-3 pb-2 sm:py-12"><PageContainer className="flex max-w-5xl flex-1 flex-col">
    <div className="flex flex-wrap items-center justify-between gap-3">{mode || summary ? <button type="button" onClick={backToModes} className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-black text-ink underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">← Games</button> : null}<Link href="/" onClick={stopAlphabetSpeech} className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-black text-ink underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">{mode || summary ? "Home" : "← Home"}</Link></div>
    <div className={`mt-3 rounded-[2rem] bg-sky p-4 sm:mt-5 sm:p-8 ${mode || summary ? "hidden sm:block" : ""}`}><div className="flex items-center gap-3 sm:gap-4"><BearMascot className="w-14 shrink-0 sm:w-28" /><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink">Game 1</p><h1 className="text-xl font-black text-ink sm:text-4xl">Alphabet Adventure</h1><p className="mt-1 text-xs font-bold text-ink/75 sm:text-sm">Explore A to Z with a friendly little bear.</p></div></div></div>

    {summary ? <Card className="mt-4 flex flex-col justify-center bg-white p-5 text-center max-md:flex-1 sm:mt-6 sm:p-10"><div className="relative mx-auto w-32 sm:w-40"><BearMascot className="alphabet-celebrate w-full" /><span aria-hidden="true" className="absolute -right-3 -top-2 text-4xl sm:text-5xl">🌟</span></div><h2 className="mt-2 text-2xl font-black text-ink sm:mt-4 sm:text-3xl">Wonderful work!</h2><p className="mt-1 text-base text-muted-ink sm:mt-3 sm:text-lg">You finished {modeNames[summary]}.</p><div className="mx-auto mt-4 grid max-w-lg grid-cols-2 gap-3 sm:mt-6"><div className="rounded-2xl bg-mint p-3 sm:p-4"><p className="text-2xl font-black text-ink sm:text-3xl">{summary === "discover" ? alphabet.length : sessionCorrect}</p><p className="text-xs font-bold text-ink/75 sm:text-sm">{summary === "discover" ? "letters explored" : "answers found"}</p></div><div className="rounded-2xl bg-sunshine/50 p-3 sm:p-4"><p className="text-2xl font-black text-ink sm:text-3xl">{summary === "discover" ? progress.discovered.length : sessionAttempts}</p><p className="text-xs font-bold text-ink/75 sm:text-sm">{summary === "discover" ? "different letters discovered" : "tries this round"}</p></div></div><div className="mt-5 flex flex-wrap justify-center gap-3 sm:mt-7"><Button onClick={() => start(summary)}>Play again</Button><Button variant="secondary" onClick={backToModes}>Choose a mode</Button></div></Card> : mode === null ? <section className="mt-4 flex flex-col max-md:flex-1 sm:mt-7"><h2 className="text-xl font-black text-ink sm:text-3xl">Choose an adventure</h2><p className="mt-1 text-sm text-muted-ink sm:mt-2 sm:text-base">Pick one way to play. You can change modes anytime.</p><div className="mt-3 grid gap-2 max-md:flex-1 sm:mt-5 sm:gap-4 md:grid-cols-3">{(["discover", "find", "match"] as AlphabetMode[]).map((item) => <Card key={item} className="flex items-center gap-3 bg-white p-3 sm:block sm:p-6"><span aria-hidden="true" className="shrink-0 text-3xl sm:text-5xl">{item === "discover" ? "🔤" : item === "find" ? "🔎" : "🧩"}</span><div className="min-w-0 flex-1"><h3 className="text-base font-black text-ink sm:mt-4 sm:text-xl">{modeNames[item]}</h3><p className="text-xs leading-5 text-muted-ink sm:mt-2 sm:min-h-14 sm:text-sm sm:leading-6">{item === "discover" ? "Meet every letter and hear its word." : item === "find" ? "Spot the letter among three choices." : "Match each letter to its picture."}</p></div><Button onClick={() => start(item)} aria-label={`Start ${modeNames[item]}`} className="min-h-11 shrink-0 px-4 text-sm sm:mt-5 sm:min-h-12 sm:w-full sm:px-6 sm:text-base">Start</Button></Card>)}</div><Card className="mt-3 bg-white p-4 sm:mt-6 sm:p-6"><h2 className="text-base font-black text-ink sm:text-lg">Your alphabet journey</h2><p className="mt-1 text-xs text-muted-ink sm:mt-2 sm:text-sm">{progress.discovered.length} of 26 letters discovered · {progress.correct} correct answers · {progress.completed.length} activities completed</p></Card></section> : target ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3"><h2 className="text-xl font-black text-ink sm:text-2xl">{modeNames[mode]}</h2><span className="rounded-full bg-white px-4 py-1.5 text-sm font-black text-ink sm:py-2">{mode === "discover" ? `Letter ${index + 1} of 26` : `Question ${index + 1} of ${sessionLength}`}</span></div><ProgressBar current={index + 1} total={mode === "discover" ? alphabet.length : sessionLength} />
      {mode === "discover" ? <Card className="mt-3 flex flex-1 flex-col gap-2 bg-white p-4 sm:mt-6 sm:gap-6 sm:p-9">
        <div className="flex flex-1 flex-col gap-3 sm:grid sm:grid-cols-2 sm:items-center sm:gap-5"><div className="flex flex-1 items-center justify-center rounded-[2rem] bg-lavender/50 p-3 text-center sm:p-5"><p className="text-[clamp(3rem,10dvh,8rem)] font-black leading-none text-ink sm:text-[8rem]">{target.upper}<span className="ml-2 text-[clamp(2rem,6dvh,4rem)] text-[#6a4d86] sm:text-6xl">{target.lower}</span></p></div><div className="text-center"><ObjectArt entry={target} /><h3 className="mt-1 text-2xl font-black text-ink sm:mt-3 sm:text-3xl">{target.object}</h3><p className="mt-1 text-base text-muted-ink sm:mt-2 sm:text-lg">{target.sentence}</p><div className="mt-3 sm:mt-5"><SpeakerButton text={target.pronunciation} label={`Hear ${target.upper} and ${target.object}`} onStatus={setAudioStatus} /></div></div></div>
        <AlphabetTrail current={index} discovered={progress.discovered} />
        <div className="flex justify-between gap-3"><Button variant="secondary" onClick={() => moveDiscover(-1)} disabled={index === 0} className="flex-1 whitespace-nowrap px-2 disabled:opacity-50 sm:flex-none sm:px-6">← Previous</Button><Button onClick={() => moveDiscover(1)} className="flex-1 whitespace-nowrap px-2 sm:flex-none sm:px-6">{index === alphabet.length - 1 ? "Finish adventure" : "Next letter →"}</Button></div>
      </Card> : <Card className="mt-3 flex flex-1 flex-col gap-3 bg-white p-4 sm:mt-6 sm:gap-6 sm:p-9">
        <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink">Look, listen, and choose</p><h3 className="mt-2 text-2xl font-black text-ink sm:mt-3 sm:text-4xl">{prompt}</h3>{mode === "match" ? <p className="mt-1 text-sm font-bold text-muted-ink sm:mt-2">Choose the picture that begins with {target.upper}.</p> : null}<div className="mt-3 sm:mt-5"><SpeakerButton text={mode === "find" ? `Can you find the letter ${target.upper}?` : `What begins with the letter ${target.upper}?`} label="Hear the question again" onStatus={setAudioStatus} /></div></div>
        <div className="grid min-h-28 flex-1 grid-cols-3 gap-2 sm:min-h-44 sm:gap-4">{choices.map((entry) => <button key={entry.upper} type="button" onClick={() => answer(entry)} disabled={feedback === "correct"} aria-label={mode === "find" ? `Letter ${entry.upper}` : entry.object} className={`flex min-w-0 flex-col items-center justify-center break-words rounded-3xl border-4 p-2 text-center transition-transform focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-default sm:p-4 ${feedback === "correct" && entry.upper === target.upper ? "border-[#377a4f] bg-mint alphabet-celebrate" : "border-transparent bg-sky hover:-translate-y-1"}`}>{mode === "find" ? <span className="text-[clamp(3rem,10dvh,6rem)] font-black leading-none text-ink sm:text-8xl">{entry.upper}</span> : <><ObjectArt entry={entry} compact /><span className="mt-2 block text-xs font-black text-ink sm:text-lg">{entry.object}</span></>}</button>)}</div>
        <div className="flex items-center gap-3"><BearMascot key={feedback} className={`w-14 shrink-0 sm:w-20 ${feedback === "correct" ? "alphabet-celebrate" : ""}`} /><div aria-live="polite" className={`flex-1 rounded-2xl p-3 text-center font-black sm:p-4 ${feedback === "correct" ? "bg-mint text-ink" : feedback === "retry" ? "bg-coral/40 text-ink" : "bg-cream text-muted-ink"}`}>{feedback === "idle" ? "Tap one answer to try." : feedbackMessage}</div></div>
        <StarTrail earned={sessionCorrect} total={sessionLength} />
        <div className="flex justify-between gap-3 sm:justify-center"><Button variant="secondary" onClick={previousQuestion} disabled={index === 0} className="flex-1 whitespace-nowrap px-2 disabled:opacity-50 sm:flex-none sm:px-6">← Previous</Button><Button onClick={nextQuestion} disabled={feedback !== "correct"} className="flex-1 whitespace-nowrap px-2 disabled:opacity-50 sm:flex-none sm:px-6">{index + 1 === sessionLength ? "See my stars" : "Next question →"}</Button></div>
      </Card>}
      <p role="status" className="mt-2 min-h-5 text-center text-sm font-bold text-muted-ink sm:mt-4 sm:min-h-6">{audioStatus}</p>
    </section> : <Card className="mt-6 bg-white p-6"><p className="font-bold text-ink">Getting the adventure ready…</p><Button onClick={backToModes} className="mt-4">Choose a mode</Button></Card>}
  </PageContainer></main>;
}
