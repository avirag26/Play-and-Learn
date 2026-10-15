"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompletionCard } from "@/features/games/completion-card";
import { Feedback } from "@/features/games/feedback";
import { GameLayout } from "@/features/games/game-layout";
import { ColorObject } from "@/features/games/game-art";
import { useGameProgress } from "@/features/games/use-game-progress";
import { colorQuestions } from "@/lib/game-data";

export default function ColorQuestPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"success" | "try" | "info">("info");
  const [finished, setFinished] = useState(false);
  const { recordCompletion } = useGameProgress("color-quest");
  const question = colorQuestions[questionIndex];
  const correctIds = question.objects.filter((object) => object.color === question.name).map((object) => object.id);
  const allCorrect = selected.length === correctIds.length && correctIds.every((id) => selected.includes(id));
  const hasWrong = selected.some((id) => !correctIds.includes(id));

  function toggleObject(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); const object = question.objects.find((item) => item.id === id); if (object?.color === question.name) { setFeedback("success"); } else { setFeedback("try"); } }
  function next() { if (questionIndex === colorQuestions.length - 1) { setFinished(true); recordCompletion(colorQuestions.length); return; } setQuestionIndex((value) => value + 1); setSelected([]); setFeedback("info"); }
  function previous() { if (questionIndex > 0) { setQuestionIndex((value) => value - 1); setSelected([]); setFeedback("info"); } }
  function playAgain() { setQuestionIndex(0); setSelected([]); setFeedback("info"); setFinished(false); }

  return <GameLayout title="Color Quest" eyebrow="Color Quest" current={finished ? colorQuestions.length : questionIndex + 1} total={colorQuestions.length} dirty={!finished && (questionIndex > 0 || selected.length > 0)}>{finished ? <CompletionCard title="Color champion!" message="You found the matching colors and made every choice count." stars={colorQuestions.length} onPlayAgain={playAgain} /> : <Card className="bg-white p-6 sm:p-10"><div className="flex flex-col items-center text-center"><p className="text-sm font-black uppercase tracking-[0.2em] text-muted-ink">Target color</p><div className="mt-3 flex items-center gap-4 rounded-full bg-cream px-5 py-3"><span className="size-10 rounded-full border-4 border-white shadow-sm" style={{ backgroundColor: question.hex }} aria-hidden="true" /><span className="text-2xl font-black capitalize text-ink">{question.name}</span></div><p className="mt-5 text-xl font-black text-ink sm:text-2xl">{question.prompt}</p><p className="mt-2 text-sm font-bold text-muted-ink">Tap the objects that match. Each object has a shape and a name too!</p></div><div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">{question.objects.map((object) => { const isSelected = selected.includes(object.id); return <button type="button" key={object.id} onClick={() => toggleObject(object.id)} aria-pressed={isSelected} className={`min-h-36 rounded-3xl border-4 p-3 transition hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${isSelected ? "border-ink bg-sky" : "border-transparent bg-cream"}`}><ColorObject color={object.color} shape={object.shape} /><span className="mt-1 block text-sm font-black capitalize text-ink">{object.label}</span><span className="block text-xs font-bold capitalize text-muted-ink">{object.color} {object.shape}</span></button>; })}</div><div className="mt-6 w-full">{feedback === "success" && !hasWrong ? <Feedback tone="success">Nice match! Keep looking for every {question.name} object.</Feedback> : feedback === "try" || hasWrong ? <Feedback tone="try">Good try! Check the color label and choose only {question.name} objects.</Feedback> : <Feedback tone="info">Choose one or more objects, then check your choices.</Feedback>}</div><div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="ghost" onClick={previous} disabled={questionIndex === 0} className="disabled:cursor-not-allowed disabled:opacity-40">← Previous</Button><Button onClick={next} disabled={!allCorrect || hasWrong}>{questionIndex === colorQuestions.length - 1 ? "Finish" : "Next →"}</Button></div></Card>}</GameLayout>;
}
