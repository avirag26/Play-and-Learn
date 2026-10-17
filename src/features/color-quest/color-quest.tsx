"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ColorDetective } from "@/features/color-quest/color-detective";
import { ColorObject, shapeNames } from "@/features/color-quest/color-object";
import { ColoringBoard } from "@/features/color-quest/coloring-board";
import { ColorDetail, ColorGallery, colorSpeech } from "@/features/color-quest/meet-colors";
import { AudioStatus, ChoiceButton, CompletionCard, GameHero, GameScreen, GameTopBar, ModeCard, ModeHeader, QuizCard, SpeakerButton, audioStatusMessage } from "@/features/games/game-ui";
import { useQuizSession } from "@/features/games/use-quiz-session";
import { colors, detectiveMissions, getColor, type ColorId } from "@/lib/color-data";
import { emptyColorProgress, readColorProgress, recordAnswer, saveColorProgress, withItem, type ColorMode, type ColorProgress } from "@/lib/color-progress";
import { isCorrectChoice, makeColorChoices, makeColorSession, type ColorChoice, type ColorQuestion } from "@/lib/color-questions";
import { pictures, type PictureId } from "@/lib/coloring-pictures";
import { speakableText } from "@/lib/encouragement";
import { speak, stopSpeech } from "@/lib/speech";

const modeNames: Record<ColorMode, string> = {
  meet: "Meet the Colors",
  find: "Find the Color",
  paint: "Color the World",
  detective: "Color Detective",
};

export function ColorQuest() {
  const [progress, setProgress] = useState<ColorProgress>(emptyColorProgress);
  const progressRef = useRef<ColorProgress>(emptyColorProgress);
  const [mode, setMode] = useState<ColorMode | null>(null);
  const [summary, setSummary] = useState<ColorMode | null>(null);
  const [openColor, setOpenColor] = useState<ColorId | null>(null);
  const [metThisVisit, setMetThisVisit] = useState<ColorId[]>([]);
  const [paintedThisVisit, setPaintedThisVisit] = useState<PictureId[]>([]);
  const [missionsThisVisit, setMissionsThisVisit] = useState<string[]>([]);
  const [session, setSession] = useState<ColorQuestion[]>([]);
  const [audioStatus, setAudioStatus] = useState("");
  const quiz = useQuizSession<ColorChoice>();

  useEffect(() => {
    const timer = window.setTimeout(() => { const saved = readColorProgress(); progressRef.current = saved; setProgress(saved); }, 0);
    return () => { window.clearTimeout(timer); stopSpeech(); };
  }, []);

  // Visited pages stay mounted but hidden (Cache Components); coming back to the game starts on its mode list.
  useLayoutEffect(() => () => { stopSpeech(); setMode(null); setSummary(null); setOpenColor(null); setAudioStatus(""); }, []);

  function commit(next: ColorProgress) {
    if (next === progressRef.current) return;
    progressRef.current = next;
    setProgress(next);
    saveColorProgress(next);
  }

  /** Speaks something the child just triggered; only a real failure (not "sound off") shows a note. */
  function announce(text: string) {
    const result = speak(text, (reason) => setAudioStatus(audioStatusMessage("unavailable", reason)));
    setAudioStatus(result === "unsupported" || result === "unavailable" ? audioStatusMessage(result) : "");
  }

  function start(nextMode: ColorMode) {
    stopSpeech();
    setAudioStatus("");
    setSummary(null);
    setMode(nextMode);
    commit(withItem(progressRef.current, "started", nextMode));
    if (nextMode === "meet") {
      setOpenColor(null);
      setMetThisVisit([]);
    } else if (nextMode === "find") {
      const next = makeColorSession();
      setSession(next);
      quiz.start(makeColorChoices(next[0]));
      announce(next[0].prompt);
    } else if (nextMode === "paint") {
      setPaintedThisVisit([]);
    } else {
      setMissionsThisVisit([]);
      announce(detectiveMissions[0].short);
    }
  }

  function finish() {
    stopSpeech();
    if (!mode) return;
    commit(withItem(progressRef.current, "completed", mode));
    setSummary(mode);
    setMode(null);
    setOpenColor(null);
    setAudioStatus("");
  }

  function backToModes() {
    stopSpeech();
    setMode(null);
    setSummary(null);
    setOpenColor(null);
    setAudioStatus("");
  }

  function meet(id: ColorId) {
    stopSpeech();
    setOpenColor(id);
    setMetThisVisit((current) => current.includes(id) ? current : [...current, id]);
    commit(withItem(progressRef.current, "discovered", id));
    announce(colorSpeech(getColor(id)));
  }

  function closeColor() {
    stopSpeech();
    setAudioStatus("");
    setOpenColor(null);
  }

  const question = mode === "find" ? session[quiz.index] : undefined;

  function answer(choice: ColorChoice) {
    if (!question) return;
    const correct = isCorrectChoice(question, choice);
    const result = quiz.answer(correct);
    if (!result) return;
    commit(recordAnswer(progressRef.current, result.firstAttempt, correct));
    announce(correct ? `${speakableText(result.message)} That is ${getColor(question.color).name.toLowerCase()}!` : speakableText(result.message));
  }

  function showQuestion(position: number) {
    stopSpeech();
    setAudioStatus("");
    const answerColor = question?.color;
    quiz.show(position, (previous) => makeColorChoices(session[position], previous.findIndex((item) => item.color === answerColor)));
    announce(session[position].prompt);
  }

  function nextQuestion() {
    if (!quiz.isLocked()) return;
    if (quiz.index + 1 >= session.length) { finish(); return; }
    showQuestion(quiz.index + 1);
  }

  function pictureComplete(id: PictureId) {
    setPaintedThisVisit((current) => current.includes(id) ? current : [...current, id]);
    commit(withItem(progressRef.current, "colored", id));
    announce("Beautiful! You colored the whole picture!");
  }

  function toggleMission(id: string) {
    const current = progressRef.current;
    const solved = current.missions.includes(id);
    commit({ ...current, missions: solved ? current.missions.filter((item) => item !== id) : [...current.missions, id] });
    setMissionsThisVisit((list) => solved ? list.filter((item) => item !== id) : list.includes(id) ? list : [...list, id]);
    if (!solved) announce("Great detective work!");
  }

  const openPosition = openColor ? colors.findIndex((color) => color.id === openColor) : -1;
  const openEntry = openColor ? getColor(openColor) : null;
  const inMode = Boolean(mode || summary);

  const summaryStats: Record<ColorMode, { value: string | number; label: string }[]> = {
    meet: [{ value: metThisVisit.length, label: "colors met today" }, { value: `${progress.discovered.length} / ${colors.length}`, label: "colors met so far" }],
    find: [{ value: quiz.sessionCorrect, label: "colors found" }, { value: quiz.sessionAttempts, label: "tries this round" }],
    paint: [{ value: paintedThisVisit.length, label: "pictures colored today" }, { value: `${progress.colored.length} / ${pictures.length}`, label: "pictures colored so far" }],
    detective: [{ value: missionsThisVisit.length, label: "missions solved today" }, { value: `${progress.missions.length} / ${detectiveMissions.length}`, label: "missions solved so far" }],
  };

  return <GameScreen active={mode !== null}>
    <GameTopBar inMode={inMode} onBackToModes={backToModes} onLeave={stopSpeech} />
    <GameHero eyebrow="Game 3" title="Color Quest" description="Meet colors, find them, paint pictures, and hunt for colors at home." tint="bg-coral/50" art={<span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-sunshine text-4xl sm:size-28 sm:text-7xl">🎨</span>} hidden={inMode} />

    {summary ? <CompletionCard art={<span aria-hidden="true" className="game-celebrate block text-[7rem] leading-none sm:text-[8.5rem]">🌈</span>} subtitle={summary === "meet" ? "You met so many colors!" : `You finished ${modeNames[summary]}.`} stats={summaryStats[summary]} onPlayAgain={() => start(summary)} onChooseMode={backToModes} />
    : mode === null ? <section className="mt-4 flex flex-col max-md:flex-1 sm:mt-7"><h2 className="text-xl font-black text-ink sm:text-3xl">Choose a color game</h2><p className="mt-1 text-sm text-muted-ink sm:mt-2 sm:text-base">Pick one way to play. You can change anytime.</p><div className="mt-3 grid gap-2 max-md:flex-1 sm:mt-5 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
      <ModeCard emoji="🌈" title={modeNames.meet} description="Tap colors to hear their names and see colorful things." onStart={() => start("meet")} />
      <ModeCard emoji="🔍" title={modeNames.find} description="Listen to the color, then tap the thing that matches." onStart={() => start("find")} />
      <ModeCard emoji="🖍️" title={modeNames.paint} description="Pick a paint color and tap the picture to fill it in." onStart={() => start("paint")} />
      <ModeCard emoji="🕵️" title={modeNames.detective} description="Hunt for colors at home with a grown-up helper." onStart={() => start("detective")} />
    </div><Card className="mt-3 bg-white p-4 sm:mt-6 sm:p-6"><h2 className="text-base font-black text-ink sm:text-lg">Your color journey</h2><p className="mt-1 text-xs text-muted-ink sm:mt-2 sm:text-sm">{progress.discovered.length} of {colors.length} colors met · {progress.correct} correct answers · {progress.colored.length} pictures colored · {progress.missions.length} missions solved</p></Card></section>
    : mode === "meet" ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><div className={openEntry ? "[@media(max-height:700px)]:hidden" : ""}><ModeHeader title={modeNames.meet} counter={`${progress.discovered.length} of ${colors.length} met`} current={progress.discovered.length} total={colors.length} /></div>
      {openEntry ? <ColorDetail color={openEntry} hasPrevious={openPosition > 0} hasNext={openPosition < colors.length - 1} onBack={closeColor} onMove={(delta) => meet(colors[openPosition + delta].id)} say={speak} onStatus={setAudioStatus} />
      : <ColorGallery discovered={progress.discovered} onOpen={meet} onDone={finish} />}
      <AudioStatus message={audioStatus} />
    </section>
    : mode === "find" && question ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><ModeHeader title={modeNames.find} counter={`Question ${quiz.index + 1} of ${session.length}`} current={quiz.index + 1} total={session.length} />
      <QuizCard eyebrow="Look, listen, and tap" prompt={question.prompt} feedback={quiz.feedback} message={quiz.message} earned={quiz.sessionCorrect} total={session.length} index={quiz.index} onPrevious={() => showQuestion(quiz.index - 1)} onNext={nextQuestion}
        audio={<SpeakerButton label="Hear the question again" onPlay={(onError) => speak(question.prompt, onError)} onStatus={setAudioStatus} />}
        choices={quiz.choices.map((choice) => { const color = getColor(choice.color); return <ChoiceButton key={choice.id} label={`${color.name} ${shapeNames[choice.shape]}`} found={quiz.feedback === "correct" && choice.color === question.color} disabled={quiz.feedback === "correct"} onClick={() => answer(choice)}><ColorObject shape={choice.shape} hex={color.hex} className="h-[clamp(4rem,14dvh,8rem)] w-full max-w-32" />{quiz.feedback === "correct" && choice.color === question.color ? <span className="mt-1 block text-xs font-black text-ink sm:text-lg">{color.name}</span> : null}</ChoiceButton>; })} />
      <AudioStatus message={audioStatus} />
    </section>
    : mode === "paint" ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><h2 className="hidden text-2xl font-black text-ink md:block">{modeNames.paint}</h2>
      <ColoringBoard onPickColor={(id) => announce(getColor(id).name)} onPictureComplete={pictureComplete} onDone={finish} />
      <AudioStatus message={audioStatus} />
    </section>
    : mode === "detective" ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><div className="hidden md:block"><ModeHeader title={modeNames.detective} counter={`${progress.missions.length} of ${detectiveMissions.length} solved`} current={progress.missions.length} total={detectiveMissions.length} /></div>
      <ColorDetective done={progress.missions} onToggle={toggleMission} onDone={finish} onAnnounce={announce} say={speak} onStatus={setAudioStatus} />
      <AudioStatus message={audioStatus} />
    </section>
    : <Card className="mt-6 bg-white p-6"><p className="font-bold text-ink">Getting the colors ready…</p><Button onClick={backToModes} className="mt-4">Choose a mode</Button></Card>}
  </GameScreen>;
}
