"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompletionCard } from "@/features/games/completion-card";
import { Feedback } from "@/features/games/feedback";
import { GameLayout } from "@/features/games/game-layout";
import { SimpleObject } from "@/features/games/game-art";
import { speakText } from "@/features/games/speech";
import { useGameProgress } from "@/features/games/use-game-progress";
import { animalQuestions } from "@/lib/game-data";

export default function AnimalSafariPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [soundMessage, setSoundMessage] = useState<string | null>(null);
  const { recordCompletion } = useGameProgress("animal-safari");
  const question = animalQuestions[questionIndex];
  const isCorrect = selected === question.animal;

  function hearAnimal() { setSoundMessage(speakText(`${question.name}. ${question.sound}`) ? null : "Sound is not available here — a grown-up can make the sound."); }
  function next() { if (questionIndex === animalQuestions.length - 1) { setFinished(true); recordCompletion(animalQuestions.length); return; } setQuestionIndex((value) => value + 1); setSelected(null); setSoundMessage(null); }
  function previous() { if (questionIndex > 0) { setQuestionIndex((value) => value - 1); setSelected(null); setSoundMessage(null); } }
  function playAgain() { setQuestionIndex(0); setSelected(null); setFinished(false); setSoundMessage(null); }

  return <GameLayout title="Animal Safari" eyebrow="Animal Safari" current={finished ? animalQuestions.length : questionIndex + 1} total={animalQuestions.length} dirty={!finished && (questionIndex > 0 || selected !== null)}>{finished ? <CompletionCard title="Safari superstar!" message="You spotted every friendly animal. What will you discover next?" stars={animalQuestions.length} onPlayAgain={playAgain} /> : <Card className="bg-white p-6 sm:p-10"><div className="grid items-center gap-8 md:grid-cols-[.85fr_1.15fr]"><div className="rounded-[2rem] bg-mint/70 p-6 text-center"><p className="text-sm font-black uppercase tracking-[0.2em] text-muted-ink">Animal clue</p><SimpleObject kind={question.animal} className="mx-auto mt-3 size-44" /><h2 className="mt-2 text-3xl font-black text-ink">{question.name}</h2><p className="mt-1 font-bold text-muted-ink">Habitat: {question.habitat}</p><button type="button" onClick={hearAnimal} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-black text-ink shadow-sm focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink">Hear the sound</button>{soundMessage ? <p className="mt-3 text-xs font-bold text-muted-ink">{soundMessage}</p> : null}</div><div><p className="text-xl font-black text-ink sm:text-2xl">{question.prompt}</p><div className="mt-5 grid grid-cols-3 gap-3">{question.choices.map((choice) => <button type="button" key={choice.id} onClick={() => setSelected(choice.animal)} aria-pressed={selected === choice.animal} className={`min-h-36 rounded-3xl border-4 p-3 transition hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${selected === choice.animal ? (choice.animal === question.animal ? "border-mint bg-mint" : "border-coral bg-coral/30") : "border-transparent bg-sky"}`}><SimpleObject kind={choice.animal} className="mx-auto size-20" /><span className="mt-1 block text-sm font-black text-ink">{choice.name}</span></button>)}</div><div className="mt-5 min-h-12">{selected ? isCorrect ? <Feedback tone="success">Wonderful spotting! That&apos;s the {question.name}.</Feedback> : <Feedback tone="try">Almost! Look for the animal that matches the clue.</Feedback> : <Feedback tone="info">Choose an animal to answer.</Feedback>}</div><div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="ghost" onClick={previous} disabled={questionIndex === 0} className="disabled:cursor-not-allowed disabled:opacity-40">← Previous</Button><Button onClick={next} disabled={!isCorrect}>{questionIndex === animalQuestions.length - 1 ? "Finish" : "Next →"}</Button></div></div></div></Card>}</GameLayout>;
}
