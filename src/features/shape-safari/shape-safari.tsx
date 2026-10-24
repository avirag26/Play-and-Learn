"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import { AudioStatus, ChoiceButton, GameScreen, GameTopBar, ModeHeader, QuizCard, SpeakerButton, StarTrail, audioStatusMessage } from "@/features/games/game-ui";
import { useQuizSession } from "@/features/games/use-quiz-session";
import { MeetShapes } from "@/features/shape-safari/meet-shapes";
import { SafariMascot, SafariObjectArt, ShapeArt, ShapeParade } from "@/features/shape-safari/shape-art";
import { speakableText } from "@/lib/encouragement";
import { capitalize, getSafariObject, getShape, meetShapeIds, meetSpeech, safariObjects, shapeColorNames, type SafariObjectId, type ShapeId } from "@/lib/shape-data";
import { emptyShapeProgress, nextLevel, readShapeProgress, recordAnswer, saveShapeProgress, shapeLevels, starsEarned, withItem, type ShapeLevel, type ShapeProgress } from "@/lib/shape-progress";
import { isCorrectShape, makeMatchChoices, makeMatchSession, makeSafariChoices, makeSafariSession, wrongShapeHint, type MatchQuestion, type SafariQuestion, type ShapeChoice } from "@/lib/shape-questions";
import { speak, stopSpeech } from "@/lib/speech";

const levelInfo: Record<ShapeLevel, { number: number; title: string; description: string }> = {
  meet: { number: 1, title: "Meet the Shapes", description: "Say hello to circle, square and triangle." },
  match: { number: 2, title: "Match the Shapes", description: "Find the shape that matches." },
  safari: { number: 3, title: "Shape Safari", description: "Spot shapes in things all around." },
};

function LevelArt({ level, className = "" }: { level: ShapeLevel; className?: string }) {
  if (level === "meet") return <ShapeArt shape="circle" color="coral" face className={className} />;
  if (level === "match") return <span className={`flex items-center gap-[6%] ${className}`}><ShapeArt shape="triangle" color="green" className="w-1/2" /><ShapeArt shape="triangle" color="purple" className="w-1/2" /></span>;
  return <SafariObjectArt object="pizza" className={className} />;
}

type Screen = { kind: "intro" } | { kind: "level"; level: ShapeLevel } | { kind: "level-done"; level: ShapeLevel; newStar: boolean } | { kind: "complete"; newStar: boolean };

const secondaryLink = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-cream px-6 text-base font-extrabold text-ink shadow-[0_4px_0_#d99052] transition-all hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";

export function ShapeSafari() {
  const [progress, setProgress] = useState<ShapeProgress>(emptyShapeProgress);
  const progressRef = useRef<ShapeProgress>(emptyShapeProgress);
  const [loaded, setLoaded] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [screen, setScreen] = useState<Screen>({ kind: "intro" });
  const [meetIndex, setMeetIndex] = useState(0);
  const [matchSession, setMatchSession] = useState<MatchQuestion[]>([]);
  const [safariSession, setSafariSession] = useState<SafariQuestion[]>([]);
  /** The hint after a wrong answer, or what was found after a right one. */
  const [note, setNote] = useState("");
  const [firstTry, setFirstTry] = useState(0);
  const [audioStatus, setAudioStatus] = useState("");
  const quiz = useQuizSession<ShapeChoice>();

  useEffect(() => {
    const timer = window.setTimeout(() => { const saved = readShapeProgress(); progressRef.current = saved; setProgress(saved); setLoaded(true); }, 0);
    return () => { window.clearTimeout(timer); stopSpeech(); };
  }, []);

  // Visited pages stay mounted but hidden (Cache Components); coming back to the game starts on its welcome screen.
  useLayoutEffect(() => () => { stopSpeech(); setScreen({ kind: "intro" }); setNote(""); setAudioStatus(""); }, []);

  function commit(next: ShapeProgress) {
    if (next === progressRef.current) return;
    progressRef.current = next;
    setProgress(next);
    if (!saveShapeProgress(next)) setSaveNote("This device isn't saving progress right now, so stars may not be kept. You can keep playing!");
  }

  /** Speaks something the child just triggered; only a real failure (not "sound off") shows a note. */
  function announce(text: string) {
    const result = speak(text, (reason) => setAudioStatus(audioStatusMessage("unavailable", reason)));
    setAudioStatus(result === "unsupported" || result === "unavailable" ? audioStatusMessage(result) : "");
  }

  const level = screen.kind === "level" ? screen.level : null;
  const matchQuestion = level === "match" ? matchSession[quiz.index] : undefined;
  const safariQuestion = level === "safari" ? safariSession[quiz.index] : undefined;
  const target: ShapeId | undefined = matchQuestion?.target.shape ?? safariQuestion?.shape;
  const sessionLength = level === "match" ? matchSession.length : safariSession.length;

  function meetShape(index: number, intro = "") {
    const position = Math.max(0, Math.min(meetShapeIds.length - 1, index));
    const shape = meetShapeIds[position];
    stopSpeech();
    setMeetIndex(position);
    commit(withItem(progressRef.current, "met", shape));
    announce(`${intro}${meetSpeech(shape)}`);
  }

  function startLevel(next: ShapeLevel) {
    stopSpeech();
    setAudioStatus("");
    setNote("");
    setFirstTry(0);
    commit(withItem(progressRef.current, "started", next));
    setScreen({ kind: "level", level: next });
    if (next === "meet") {
      meetShape(0, "Let's meet the shapes! ");
    } else if (next === "match") {
      const session = makeMatchSession();
      setMatchSession(session);
      quiz.start(makeMatchChoices(session[0]));
      announce(`Match the shapes! ${session[0].prompt}`);
    } else {
      const session = makeSafariSession();
      setSafariSession(session);
      quiz.start(makeSafariChoices(session[0]));
      announce(`Shape safari! ${session[0].prompt}`);
    }
  }

  /** A level's star is earned once; finishing it again is practice and adds nothing. */
  function finishLevel(done: ShapeLevel) {
    if (screen.kind !== "level" || screen.level !== done) return;
    stopSpeech();
    setAudioStatus("");
    const newStar = !progressRef.current.completed.includes(done);
    commit(withItem(progressRef.current, "completed", done));
    if (done === "safari") {
      setScreen({ kind: "complete", newStar });
      announce(starsEarned(progressRef.current) === shapeLevels.length ? "Amazing shape explorer! You found all the shapes!" : "Great shape spotting!");
    } else {
      setScreen({ kind: "level-done", level: done, newStar });
      announce(newStar ? "Hooray! You earned a star!" : "Great practice!");
    }
  }

  function backToIntro() {
    stopSpeech();
    setScreen({ kind: "intro" });
    setNote("");
    setAudioStatus("");
  }

  function answer(picked: ShapeChoice) {
    if (!target) return;
    const correct = isCorrectShape(picked, target);
    const result = quiz.answer(correct);
    if (!result) return;
    commit(recordAnswer(progressRef.current, result.firstAttempt, correct));
    if (correct && result.firstAttempt) setFirstTry((value) => value + 1);
    if (correct && safariQuestion) commit(withItem(progressRef.current, "spotted", safariQuestion.object));
    const name = getShape(target).name;
    const detail = correct
      ? safariQuestion ? `The ${getSafariObject(safariQuestion.object).name} is a ${name}!` : `That's a ${name} too!`
      : wrongShapeHint(picked.shape, safariQuestion ? getSafariObject(safariQuestion.object).hint : getShape(target).hint);
    setNote(detail);
    announce(`${speakableText(result.message)} ${detail}`);
  }

  function showQuestion(position: number) {
    stopSpeech();
    setAudioStatus("");
    setNote("");
    if (level === "match") {
      const previousShape = matchQuestion?.target.shape;
      quiz.show(position, (previous) => makeMatchChoices(matchSession[position], previous.findIndex((item) => item.shape === previousShape)));
      announce(matchSession[position].prompt);
    } else if (level === "safari") {
      const previousShape = safariQuestion?.shape;
      quiz.show(position, (previous) => makeSafariChoices(safariSession[position], previous.findIndex((item) => item.shape === previousShape)));
      announce(safariSession[position].prompt);
    }
  }

  function nextQuestion() {
    if (!level || !quiz.isLocked()) return;
    if (quiz.index + 1 >= sessionLength) { finishLevel(level); return; }
    showQuestion(quiz.index + 1);
  }

  const stars = starsEarned(progress);
  const choiceArt = "block h-auto w-[min(100%,17dvh,8.5rem)]";
  const quizChoices = target ? quiz.choices.map((item) => {
    const shape = getShape(item.shape);
    return <ChoiceButton key={item.id} label={level === "safari" ? capitalize(shape.name) : `${shapeColorNames[item.color]} ${shape.name}`} found={quiz.feedback === "correct" && item.shape === target} disabled={quiz.feedback === "correct"} onClick={() => answer(item)}>
      <ShapeArt shape={item.shape} color={item.color} className={choiceArt} />
      {level === "safari" ? <span className="mt-1 text-sm font-black text-ink sm:text-xl">{capitalize(shape.name)}</span> : null}
    </ChoiceButton>;
  }) : [];
  const quizMessage = note ? `${quiz.message} ${note}` : quiz.message;

  return <GameScreen active={screen.kind !== "intro"}>
    <GameTopBar inMode={screen.kind !== "intro"} onBackToModes={backToIntro} onLeave={stopSpeech} />

    {screen.kind === "intro" ? <section className="mt-3 flex flex-col gap-3 max-md:flex-1 sm:mt-5 sm:gap-6">
      <div className="rounded-[2rem] bg-mint p-4 text-center sm:p-8">
        <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-6 sm:text-left">
          <SafariMascot className="game-pop w-24 shrink-0 sm:w-36" />
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink">Game 5</p><h1 className="text-3xl font-black text-ink sm:text-5xl">Shape Safari</h1><p className="mt-1 text-lg font-black text-ink/80 sm:text-2xl">Let&apos;s explore shapes!</p></div>
        </div>
        <ShapeParade className="mx-auto mt-3 max-w-md sm:mt-6" />
        <Button onClick={() => startLevel(nextLevel(progressRef.current))} className="mt-4 min-h-14 px-10 text-xl sm:mt-6 sm:min-h-16 sm:text-2xl">Let&apos;s Play! <span aria-hidden="true">▶</span></Button>
        <p className="mt-3 min-h-6 text-sm font-black text-ink" aria-live="polite">{loaded ? <><span aria-hidden="true">⭐ </span>{stars} of {shapeLevels.length} stars</> : null}</p>
      </div>
      <h2 className="sr-only">Levels</h2>
      <ul className="grid grid-cols-3 gap-2 sm:gap-4">{shapeLevels.map((item) => {
        const info = levelInfo[item];
        const done = progress.completed.includes(item);
        return <li key={item} className="min-w-0"><button type="button" onClick={() => startLevel(item)} aria-label={`Level ${info.number}: ${info.title}${done ? ". Star earned." : ""}`} className={`flex h-full w-full flex-col items-center gap-1 rounded-3xl p-2 text-center shadow-[0_4px_0_rgba(42,91,145,0.15)] transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink sm:gap-2 sm:p-5 ${done ? "bg-sunshine/40" : "bg-white"}`}>
          <span className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted-ink sm:text-xs">Level {info.number}</span>
          <LevelArt level={item} className="block h-auto w-12 sm:w-20" />
          <span className="text-sm font-black leading-tight text-ink sm:text-lg">{info.title}</span>
          <span className="hidden text-sm leading-5 text-muted-ink sm:block">{info.description}</span>
          <span aria-hidden="true" className={`mt-auto text-xl sm:text-2xl ${done ? "" : "opacity-25 grayscale"}`}>⭐</span>
        </button></li>;
      })}</ul>
      {saveNote ? <p role="status" className="text-center text-sm font-bold text-muted-ink">{saveNote}</p> : null}
    </section>

    : screen.kind === "level" && screen.level === "meet" ? <section className="mt-3 flex flex-1 flex-col sm:mt-6">
      <ModeHeader title={`Level 1 · ${levelInfo.meet.title}`} counter={`${meetIndex + 1} of ${meetShapeIds.length}`} current={meetIndex + 1} total={meetShapeIds.length} />
      <MeetShapes shape={meetShapeIds[meetIndex]} index={meetIndex} total={meetShapeIds.length} onMove={(delta) => meetShape(meetIndex + delta)} onFinish={() => finishLevel("meet")} onTap={(shape) => announce(`${capitalize(getShape(shape).name)}!`)} say={speak} onStatus={setAudioStatus} />
      <AudioStatus message={audioStatus} />
    </section>

    : matchQuestion ? <section className="mt-3 flex flex-1 flex-col sm:mt-6">
      <ModeHeader title={`Level 2 · ${levelInfo.match.title}`} counter={`Question ${quiz.index + 1} of ${matchSession.length}`} current={quiz.index + 1} total={matchSession.length} />
      <QuizCard eyebrow="Find the same shape" prompt={matchQuestion.prompt} feedback={quiz.feedback} message={quizMessage} earned={quiz.sessionCorrect} total={matchSession.length} index={quiz.index} onPrevious={() => showQuestion(quiz.index - 1)} onNext={nextQuestion}
        audio={<SpeakerButton label="Hear the question again" onPlay={(onError) => speak(matchQuestion.prompt, onError)} onStatus={setAudioStatus} />}
        picture={<div role="img" aria-label={`A ${shapeColorNames[matchQuestion.target.color]} ${getShape(matchQuestion.target.shape).name}`} className="flex justify-center rounded-3xl bg-cream p-2 sm:p-4"><span key={matchQuestion.id} className="shape-reveal block w-[min(34vw,16dvh,9rem)]"><ShapeArt shape={matchQuestion.target.shape} color={matchQuestion.target.color} face className="block h-auto w-full" /></span></div>}
        choices={quizChoices} />
      <AudioStatus message={audioStatus} />
    </section>

    : safariQuestion ? <section className="mt-3 flex flex-1 flex-col sm:mt-6">
      <ModeHeader title={`Level 3 · ${levelInfo.safari.title}`} counter={`Question ${quiz.index + 1} of ${safariSession.length}`} current={quiz.index + 1} total={safariSession.length} />
      <QuizCard eyebrow="Look, then pick the shape" prompt={safariQuestion.prompt} feedback={quiz.feedback} message={quizMessage} earned={quiz.sessionCorrect} total={safariSession.length} index={quiz.index} onPrevious={() => showQuestion(quiz.index - 1)} onNext={nextQuestion}
        audio={<SpeakerButton label="Hear the question again" onPlay={(onError) => speak(safariQuestion.prompt, onError)} onStatus={setAudioStatus} />}
        picture={<SafariPicture object={safariQuestion.object} questionId={safariQuestion.id} />}
        choices={quizChoices} />
      <AudioStatus message={audioStatus} />
    </section>

    : screen.kind === "level-done" ? <LevelDone level={screen.level} newStar={screen.newStar} stars={stars} firstTry={firstTry} questions={screen.level === "match" ? matchSession.length : 0} onNext={() => startLevel(shapeLevels[shapeLevels.indexOf(screen.level) + 1] ?? "safari")} onLevels={backToIntro} />

    : screen.kind === "complete" ? <Card className="mt-4 flex flex-col items-center justify-center bg-white p-5 text-center max-md:flex-1 sm:mt-6 sm:p-10">
      <Confetti />
      <div className="relative w-32 sm:w-40"><SafariMascot className="game-celebrate block w-full" /><span aria-hidden="true" className="absolute -right-3 -top-2 text-4xl sm:text-5xl">🌟</span></div>
      <h2 className="mt-2 text-2xl font-black text-ink sm:mt-4 sm:text-4xl">{stars === shapeLevels.length ? "Amazing Shape Explorer!" : "Great shape spotting!"}</h2>
      <p className="mt-1 text-base text-muted-ink sm:mt-2 sm:text-lg">{stars === shapeLevels.length ? "You finished all three levels." : "Play the other levels to earn every star."}{screen.newStar ? " You earned a new star!" : ""}</p>
      <div className="mt-3"><StarTrail earned={stars} total={shapeLevels.length} /><p className="mt-1 text-sm font-black text-ink">{stars} of {shapeLevels.length} stars</p></div>
      <ul className="mx-auto mt-4 grid w-full max-w-lg gap-2 text-left">{shapeLevels.map((item) => {
        const done = progress.completed.includes(item);
        return <li key={item} className={`flex items-center gap-3 rounded-2xl p-2.5 sm:p-3 ${done ? "bg-mint" : "bg-cream"}`}>
          <LevelArt level={item} className="block h-auto w-10 shrink-0" />
          <span className="min-w-0 flex-1 font-black text-ink">Level {levelInfo[item].number}: {levelInfo[item].title}</span>
          {done ? <span className="shrink-0 font-black text-ink"><span aria-hidden="true">⭐ </span>Done</span> : <Button variant="secondary" onClick={() => startLevel(item)} className="min-h-11 shrink-0 px-4 text-sm">Play</Button>}
        </li>;
      })}</ul>
      <div className="mx-auto mt-4 grid w-full max-w-lg grid-cols-2 gap-3">
        <div className="rounded-2xl bg-sunshine/50 p-3"><p className="text-2xl font-black text-ink">{firstTry} / {safariSession.length}</p><p className="text-xs font-bold text-ink/75 sm:text-sm">named on the first try</p></div>
        <div className="rounded-2xl bg-sky p-3"><p className="text-2xl font-black text-ink">{progress.spotted.length} / {safariObjects.length}</p><p className="text-xs font-bold text-ink/75 sm:text-sm">things spotted so far</p></div>
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3 sm:mt-7"><Button onClick={() => startLevel("meet")}>Play again</Button><Link href="/games" onClick={stopSpeech} className={secondaryLink}>Back to Games</Link></div>
    </Card>

    : <Card className="mt-6 bg-white p-6"><p className="font-bold text-ink">Getting the shapes ready…</p><Button onClick={backToIntro} className="mt-4">Back to the start</Button></Card>}
  </GameScreen>;
}

function SafariPicture({ object, questionId }: { object: SafariObjectId; questionId: string }) {
  const { name } = getSafariObject(object);
  return <div role="img" aria-label={`A ${name}`} className="flex items-center justify-center gap-3 rounded-3xl bg-cream p-2 sm:p-4">
    <span key={questionId} className="shape-reveal block w-[min(34vw,16dvh,9rem)]"><SafariObjectArt object={object} className="block h-auto w-full" /></span>
    <span aria-hidden="true" className="rounded-full bg-white px-4 py-1 text-lg font-black text-ink shadow-sm sm:text-2xl">{capitalize(name)}</span>
  </div>;
}

function LevelDone({ level, newStar, stars, firstTry, questions, onNext, onLevels }: { level: ShapeLevel; newStar: boolean; stars: number; firstTry: number; questions: number; onNext: () => void; onLevels: () => void }) {
  const info = levelInfo[level];
  const next = levelInfo[shapeLevels[shapeLevels.indexOf(level) + 1] ?? "safari"];
  return <Card className="mt-4 flex flex-col items-center justify-center gap-2 bg-white p-5 text-center max-md:flex-1 sm:mt-6 sm:gap-3 sm:p-10">
    {newStar ? <Confetti /> : null}
    <SafariMascot className="game-celebrate w-28 sm:w-36" />
    <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink">Level {info.number} done!</p>
    <h2 className="text-2xl font-black text-ink sm:text-4xl">{newStar ? "You earned a star!" : "Great practice!"}</h2>
    <p className="text-base text-muted-ink sm:text-lg">{newStar ? `${info.title} is complete.` : "You already have this star. Playing again keeps your shapes strong!"}</p>
    {questions ? <p className="rounded-full bg-sunshine/50 px-4 py-1 text-sm font-black text-ink">{firstTry} of {questions} matched on the first try</p> : null}
    <StarTrail earned={stars} total={shapeLevels.length} />
    <div className="mt-3 flex flex-wrap justify-center gap-3"><Button onClick={onNext}>Next: {next.title} →</Button><Button variant="secondary" onClick={onLevels}>All levels</Button></div>
  </Card>;
}
