"use client";

import { useRef, useState } from "react";
import { alreadyFoundPhrase, cheerPhrases, pickPhrase, retryPhrases } from "@/lib/encouragement";

export type QuizFeedback = "idle" | "retry" | "correct";

/**
 * Shared three-choice quiz state: one locked answer per question, gentle retries,
 * and Previous/Next that revisit questions with their original choices.
 * Questions are solved in order, so every question before `sessionCorrect` is already found.
 */
export function useQuizSession<Choice>() {
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [feedback, setFeedback] = useState<QuizFeedback>("idle");
  const [message, setMessage] = useState("");
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const locked = useRef(false);
  const attempted = useRef(new Set<number>());
  const history = useRef<Choice[][]>([]);

  function start(firstChoices: Choice[]) {
    history.current = [firstChoices];
    attempted.current = new Set();
    locked.current = false;
    setIndex(0);
    setChoices(firstChoices);
    setFeedback("idle");
    setMessage("");
    setSessionCorrect(0);
    setSessionAttempts(0);
  }

  /** Records an answer. Returns null while the question is locked (prevents double scoring). */
  function answer(correct: boolean): { firstAttempt: boolean; message: string } | null {
    if (locked.current) return null;
    const firstAttempt = !attempted.current.has(index);
    attempted.current.add(index);
    const nextMessage = pickPhrase(correct ? cheerPhrases : retryPhrases);
    setSessionAttempts((value) => value + 1);
    setMessage(nextMessage);
    if (correct) {
      locked.current = true;
      setSessionCorrect((value) => value + 1);
      setFeedback("correct");
    } else {
      setFeedback("retry");
    }
    return { firstAttempt, message: nextMessage };
  }

  /** Moves to a question, building its choices from the current ones the first time it is shown. */
  function show(position: number, build: (previousChoices: Choice[]) => Choice[]) {
    let nextChoices = history.current[position];
    if (!nextChoices) {
      nextChoices = build(choices);
      history.current[position] = nextChoices;
    }
    const solved = position < sessionCorrect;
    locked.current = solved;
    setChoices(nextChoices);
    setIndex(position);
    setFeedback(solved ? "correct" : "idle");
    setMessage(solved ? alreadyFoundPhrase : "");
  }

  return { index, choices, feedback, message, sessionCorrect, sessionAttempts, start, answer, show, isLocked: () => locked.current };
}
