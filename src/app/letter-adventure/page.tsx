"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback } from "@/features/games/feedback";
import { CompletionCard } from "@/features/games/completion-card";
import { GameLayout } from "@/features/games/game-layout";
import { SimpleObject } from "@/features/games/game-art";
import { speakText } from "@/features/games/speech";
import { useGameProgress } from "@/features/games/use-game-progress";
import { letterQuestions } from "@/lib/game-data";

export default function LetterAdventurePage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const { recordCompletion } = useGameProgress("letter-adventure");
  const question = letterQuestions[questionIndex];
  const isCorrect = selected === question.letter.toLowerCase();

  function hearWord() { setSpeechMessage(speakText(`${question.letter}. ${question.word}.`) ? null : "Sound is not available here — a grown-up can read it aloud."); }
  function choose(choice: string) { setSelected(choice); }
  function next() { if (questionIndex === letterQuestions.length - 1) { setFinished(true); recordCompletion(letterQuestions.length); return; } setQuestionIndex((value) => value + 1); setSelected(null); setSpeechMessage(null); }
  function previous() { if (questionIndex > 0) { setQuestionIndex((value) => value - 1); setSelected(null); setSpeechMessage(null); } }
  function playAgain() { setQuestionIndex(0); setSelected(null); setFinished(false); setSpeechMessage(null); }

  return <GameLayout title="Letter Adventure" eyebrow="Letter Adventure" current={finished ? letterQuestions.length : questionIndex + 1} total={letterQuestions.length} dirty={!finished && (questionIndex > 0 || selected !== null)}>{finished ? <CompletionCard title="You found the letters!" message="A, B, and C are proud of you. Ready for another round?" stars={letterQuestions.length} onPlayAgain={playAgain} /> : <Card className="bg-white p-6 sm:p-10"><div className="grid items-center gap-8 md:grid-cols-[.9fr_1.1fr]"><div className="rounded-[2rem] bg-coral/40 p-6 text-center"><p className="text-sm font-black uppercase tracking-[0.2em] text-muted-ink">Meet the letter</p><p className="mt-2 text-[9rem] font-black leading-none text-ink sm:text-[11rem]">{question.letter}</p><SimpleObject kind={question.art} className="mx-auto size-24" /><p className="mt-2 text-xl font-black text-ink">{question.word}</p><button type="button" onClick={hearWord} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-black text-ink shadow-sm focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">🔊 Hear it</button>{speechMessage ? <p className="mt-3 text-xs font-bold text-muted-ink">{speechMessage}</p> : null}</div><div><p className="text-xl font-black text-ink sm:text-2xl">{question.prompt}</p><div className="mt-5 grid grid-cols-3 gap-3">{question.choices.map((choice) => <button key={choice.id} type="button" onClick={() => choose(choice.label.toLowerCase())} aria-pressed={selected === choice.label.toLowerCase()} className={`min-h-28 rounded-3xl border-4 p-3 text-4xl font-black transition hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${selected === choice.label.toLowerCase() ? (choice.label.toLowerCase() === question.letter.toLowerCase() ? "border-mint bg-mint" : "border-coral bg-coral/30") : "border-transparent bg-sky"}`}><span className="block">{choice.label}</span><span className="mt-1 block text-xs font-black uppercase tracking-wider text-muted-ink">letter</span></button>)}</div><div className="mt-5 min-h-12">{selected ? isCorrect ? <Feedback tone="success">That&apos;s it! {question.letter} says {question.word}.</Feedback> : <Feedback tone="try">Good try! Listen for the first sound in {question.word}.</Feedback> : <Feedback tone="info">Tap a letter to answer.</Feedback>}</div><div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="ghost" onClick={previous} disabled={questionIndex === 0} className="disabled:cursor-not-allowed disabled:opacity-40">← Previous</Button><Button onClick={next} disabled={!isCorrect}>{questionIndex === letterQuestions.length - 1 ? "Finish" : "Next →"}</Button></div></div></div></Card>}</GameLayout>;
}
