"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import { AudioStatus, FeedbackBubble, GameScreen, GameTopBar, StarTrail, audioStatusMessage } from "@/features/games/game-ui";
import { PieceParade, PuzzleArt, PuzzleMascot } from "@/features/puzzle-playground/puzzle-art";
import { PuzzleBoard } from "@/features/puzzle-playground/puzzle-board";
import { pickPhrase } from "@/lib/encouragement";
import { fitCheers, getPuzzle, puzzleLevelConfig, puzzleLevels, puzzleLines, puzzles, puzzlesIn, type Puzzle, type PuzzleLevel } from "@/lib/puzzle-data";
import { emptyPuzzleState, makeTray, piecesLeft, placeResult, puzzleReducer, type PuzzleAction, type PuzzleState } from "@/lib/puzzle-game";
import { emptyPuzzleProgress, nextPuzzle, readPuzzleProgress, recordSolved, savePuzzleProgress, startLevel, starsEarned, type PuzzleProgress } from "@/lib/puzzle-progress";
import { speak, stopSpeech } from "@/lib/speech";

/** How long the finished picture shows on the board before the celebration screen. */
const FINISH_DELAY_MS = 1600;
const HINT_MS = 3000;
const NUDGE_MS = 450;

type Screen = { kind: "intro" } | { kind: "choose"; level: PuzzleLevel } | { kind: "play" } | { kind: "complete"; puzzleId: string; newStar: boolean; hints: number };
type Timer = "finish" | "hint" | "wrong" | "fitted";

const secondaryLink = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-cream px-6 text-base font-extrabold text-ink shadow-[0_4px_0_#d99052] transition-all hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";
const toolButton = "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 text-sm font-black text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";

/** A puzzle's finished picture in a rounded frame, keeping its shape. */
function PictureCard({ puzzle, className = "" }: { puzzle: Puzzle; className?: string }) {
  return <span aria-hidden="true" className={`block overflow-hidden rounded-2xl border-4 border-white shadow-[0_4px_0_rgba(42,91,145,0.18)] ${className}`} style={{ aspectRatio: `${puzzle.cols} / ${puzzle.rows}` }}><PuzzleArt art={puzzle.art} /></span>;
}

export function PuzzlePlayground() {
  const [progress, setProgress] = useState<PuzzleProgress>(emptyPuzzleProgress);
  const progressRef = useRef<PuzzleProgress>(emptyPuzzleProgress);
  const [loaded, setLoaded] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [screen, setScreen] = useState<Screen>({ kind: "intro" });
  // The puzzle lives in a ref as well as state, so a drop and a tap before a re-render still see the latest board.
  const [game, setGame] = useState<PuzzleState>(emptyPuzzleState);
  const gameRef = useRef<PuzzleState>(emptyPuzzleState());
  const finishedRound = useRef(0);
  const timers = useRef<Partial<Record<Timer, number>>>({});
  const [message, setMessage] = useState("");
  const [cheering, setCheering] = useState(false);
  const [wrongSlot, setWrongSlot] = useState<string | null>(null);
  const [fittedSlot, setFittedSlot] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState("");

  function clearTimers() {
    for (const id of Object.values(timers.current)) window.clearTimeout(id);
    timers.current = {};
  }

  function later(name: Timer, run: () => void, delay: number) {
    window.clearTimeout(timers.current[name]);
    timers.current[name] = window.setTimeout(() => { delete timers.current[name]; run(); }, delay);
  }

  useEffect(() => {
    const load = window.setTimeout(() => { const saved = readPuzzleProgress(); progressRef.current = saved; setProgress(saved); setLoaded(true); }, 0);
    const pending = timers.current;
    return () => { window.clearTimeout(load); for (const id of Object.values(pending)) window.clearTimeout(id); stopSpeech(); };
  }, []);

  // Visited pages stay mounted but hidden (Cache Components); coming back to the game starts on its welcome screen.
  useLayoutEffect(() => () => { for (const id of Object.values(timers.current)) window.clearTimeout(id); timers.current = {}; stopSpeech(); setScreen({ kind: "intro" }); setMessage(""); setAudioStatus(""); }, []);

  function dispatch(action: PuzzleAction): PuzzleState {
    const next = puzzleReducer(gameRef.current, action);
    if (next !== gameRef.current) { gameRef.current = next; setGame(next); }
    return next;
  }

  function commit(next: PuzzleProgress) {
    if (next === progressRef.current) return;
    progressRef.current = next;
    setProgress(next);
    if (!savePuzzleProgress(next)) setSaveNote("This device isn't saving progress right now, so stars may not be kept. You can keep playing!");
  }

  /** Speaks something the child just triggered; only a real failure (not "sound off") shows a note. */
  function announce(text: string) {
    const result = speak(text, (reason) => setAudioStatus(audioStatusMessage("unavailable", reason)));
    setAudioStatus(result === "unsupported" || result === "unavailable" ? audioStatusMessage(result) : "");
  }

  function say(text: string, cheer = false, aloud = true) {
    setMessage(text);
    setCheering(cheer);
    if (aloud) announce(text);
  }

  function start(id: string) {
    const puzzle = getPuzzle(id);
    if (!puzzle) return;
    clearTimers();
    stopSpeech();
    setAudioStatus("");
    setWrongSlot(null);
    setFittedSlot(null);
    dispatch({ type: "start", round: gameRef.current.round + 1, puzzleId: id, tray: makeTray(puzzle) });
    commit(startLevel(progressRef.current, puzzle.level));
    setScreen({ kind: "play" });
    setMessage(puzzleLines.start);
    setCheering(false);
    announce(`${puzzle.intro} ${puzzleLines.start}`);
  }

  function select(pieceId: string | null) {
    const before = gameRef.current;
    const next = dispatch({ type: "select", pieceId });
    if (next !== before && next.selected) say(puzzleLines.picked, false, false);
  }

  function place(pieceId: string, slotId: string) {
    const before = gameRef.current;
    const after = dispatch({ type: "place", pieceId, slotId });
    const result = placeResult(before, after);
    if (result === "wrong") {
      setWrongSlot(slotId);
      later("wrong", () => setWrongSlot(null), NUDGE_MS);
      say(puzzleLines.wrong);
      return;
    }
    if (result === "ignored") return;
    setFittedSlot(slotId);
    later("fitted", () => setFittedSlot(null), NUDGE_MS);
    if (result === "complete") { say(puzzleLines.complete, true); finish(after); return; }
    say(piecesLeft(after) === 1 ? `${pickPhrase(fitCheers)} ${puzzleLines.oneMore}` : pickPhrase(fitCheers), true);
  }

  function hint() {
    const next = dispatch({ type: "hint" });
    if (!next.hinted) return;
    say(puzzleLines.hint);
    const round = next.round;
    later("hint", () => dispatch({ type: "clear-hint", round }), HINT_MS);
  }

  /** Saves the finished puzzle once (its level's star only the first time), then celebrates. */
  function finish(done: PuzzleState) {
    if (finishedRound.current === done.round) return;
    finishedRound.current = done.round;
    const puzzle = getPuzzle(done.puzzleId);
    if (!puzzle) return;
    const newStar = !progressRef.current.completed.includes(puzzle.level);
    commit(recordSolved(progressRef.current, puzzle.id, done.hints));
    later("finish", () => {
      setScreen({ kind: "complete", puzzleId: puzzle.id, newStar, hints: done.hints });
      announce(newStar ? `${puzzle.done} Hooray! You earned a star!` : puzzle.done);
    }, FINISH_DELAY_MS);
  }

  function backToIntro() {
    clearTimers();
    stopSpeech();
    setScreen({ kind: "intro" });
    setMessage("");
    setAudioStatus("");
  }

  const stars = starsEarned(progress);
  const puzzle = getPuzzle(game.puzzleId);
  const level = puzzle ? puzzleLevelConfig[puzzle.level] : null;
  const placedCount = Object.keys(game.placed).length;

  return <GameScreen active={screen.kind !== "intro"}>
    <GameTopBar inMode={screen.kind !== "intro"} onBackToModes={backToIntro} onLeave={stopSpeech} />

    {screen.kind === "intro" ? <section className="mt-3 flex flex-col gap-3 max-md:flex-1 sm:mt-5 sm:gap-6">
      <div className="rounded-[2rem] bg-sunshine/40 p-4 text-center sm:p-8">
        <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-6 sm:text-left">
          <PuzzleMascot className="game-pop w-20 shrink-0 sm:w-32" />
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink">Game 7</p><h1 className="text-3xl font-black text-ink sm:text-5xl">Puzzle Playground</h1><p className="mt-1 text-lg font-black text-ink/80 sm:text-2xl">Think, Fit, Discover!</p></div>
        </div>
        <PieceParade className="mx-auto mt-3 max-w-xs sm:mt-6" />
        <Button onClick={() => start(nextPuzzle(progressRef.current))} className="mt-5 min-h-14 px-10 text-xl sm:mt-7 sm:min-h-16 sm:text-2xl">Let&apos;s Play! <span aria-hidden="true">▶</span></Button>
        <p className="mt-3 min-h-6 text-sm font-black text-ink" aria-live="polite">{loaded ? <><span aria-hidden="true">⭐ </span>{stars} of {puzzleLevels.length} stars</> : null}</p>
      </div>
      <h2 className="sr-only">Levels</h2>
      <ul className="grid grid-cols-3 gap-2 sm:gap-4">{puzzleLevels.map((item) => {
        const info = puzzleLevelConfig[item];
        const done = progress.completed.includes(item);
        return <li key={item} className="min-w-0"><button type="button" onClick={() => setScreen({ kind: "choose", level: item })} aria-label={`Level ${info.number}: ${info.title}${done ? ". Star earned." : ""}`} className={`flex h-full w-full flex-col items-center gap-1 rounded-3xl p-2 text-center shadow-[0_4px_0_rgba(42,91,145,0.15)] transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink sm:gap-2 sm:p-5 ${done ? "bg-sunshine/40" : "bg-white"}`}>
          <span className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted-ink sm:text-xs">Level {info.number}</span>
          <PictureCard puzzle={puzzlesIn(item)[0]} className="w-14 sm:w-24" />
          <span className="text-sm font-black leading-tight text-ink sm:text-lg">{info.title}</span>
          <span className="hidden text-sm leading-5 text-muted-ink sm:block">{info.description}</span>
          <span aria-hidden="true" className={`mt-auto text-xl sm:text-2xl ${done ? "" : "opacity-25 grayscale"}`}>⭐</span>
        </button></li>;
      })}</ul>
      {saveNote ? <p role="status" className="text-center text-sm font-bold text-muted-ink">{saveNote}</p> : null}
    </section>

    : screen.kind === "choose" ? <section className="mt-3 flex flex-1 flex-col sm:mt-6">
      <h2 className="text-xl font-black text-ink sm:text-3xl">Level {puzzleLevelConfig[screen.level].number} · {puzzleLevelConfig[screen.level].title}</h2>
      <p className="mt-1 text-sm text-muted-ink sm:text-base">Pick a picture to build.</p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">{puzzlesIn(screen.level).map((item) => {
        const solved = progress.solved.includes(item.id);
        return <li key={item.id} className="min-w-0"><button type="button" onClick={() => start(item.id)} aria-label={`${item.name}, ${item.missing.length} pieces${solved ? ". Finished before." : ""}`} className="relative flex h-full w-full flex-col items-center gap-2 rounded-3xl bg-white p-3 text-center shadow-[0_5px_0_rgba(42,91,145,0.15)] transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink sm:p-4">
          <span className="flex aspect-square w-full items-center justify-center"><PictureCard puzzle={item} className="w-full" /></span>
          <span className="font-black leading-tight text-ink sm:text-lg">{item.name}</span>
          <span className="text-xs font-bold text-muted-ink sm:text-sm">{item.missing.length} pieces</span>
          {solved ? <span aria-hidden="true" className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-sunshine text-base shadow-[0_2px_0_#d99052]">⭐</span> : null}
        </button></li>;
      })}</ul>
    </section>

    : screen.kind === "play" && puzzle && level ? <section className="mt-3 flex flex-1 flex-col sm:mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-0 basis-full text-base font-black leading-tight text-ink sm:flex-1 sm:basis-auto sm:text-2xl"><span className="max-sm:sr-only">Level {level.number} · </span>{puzzle.name}</h2>
        <span className="mr-auto rounded-full bg-white px-3 py-1.5 text-sm font-black text-ink sm:mr-0 sm:px-4 sm:py-2"><span aria-hidden="true">🧩 </span>{placedCount} of {game.tray.length} pieces</span>
        <button type="button" onClick={hint} disabled={game.status === "complete"} className={`${toolButton} disabled:opacity-50`}><span aria-hidden="true">💡</span>Hint</button>
        <button type="button" onClick={() => start(puzzle.id)} aria-label="Start this puzzle again" className={toolButton}><span aria-hidden="true">🔄</span><span className="max-sm:hidden">Start again</span></button>
      </div>
      <div className="flex flex-1 flex-col justify-center py-3 sm:py-6">
        <PuzzleBoard puzzle={puzzle} state={game} guide={level.guide} wrongSlot={wrongSlot} fittedSlot={fittedSlot} onSelect={select} onPlace={place} />
      </div>
      <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-2 shadow-[0_4px_0_rgba(42,91,145,0.12)] sm:p-3"><FeedbackBubble feedback={cheering ? "correct" : "idle"} message={message} idleText={message || puzzleLines.start} /></div>
      <AudioStatus message={audioStatus} />
    </section>

    : screen.kind === "complete" ? <CompleteCard puzzle={getPuzzle(screen.puzzleId) ?? puzzles[0]} newStar={screen.newStar} hints={screen.hints} stars={stars} saveNote={saveNote} onAgain={() => start(screen.puzzleId)} onChoose={() => setScreen({ kind: "choose", level: (getPuzzle(screen.puzzleId) ?? puzzles[0]).level })} />

    : <Card className="mt-6 bg-white p-6"><p className="font-bold text-ink">Getting the puzzle ready…</p><Button onClick={backToIntro} className="mt-4">Back to the start</Button></Card>}
  </GameScreen>;
}

function CompleteCard({ puzzle, newStar, hints, stars, saveNote, onAgain, onChoose }: { puzzle: Puzzle; newStar: boolean; hints: number; stars: number; saveNote: string; onAgain: () => void; onChoose: () => void }) {
  return <Card className="mt-4 flex flex-col items-center justify-center bg-white p-5 text-center max-md:flex-1 sm:mt-6 sm:p-10">
    <Confetti />
    <div className="relative w-[min(60vw,14rem)]"><PictureCard puzzle={puzzle} className="game-celebrate w-full" /><PuzzleMascot className="absolute -bottom-4 -right-6 w-16 sm:w-20" /></div>
    <h2 className="mt-5 text-2xl font-black text-ink sm:text-4xl">Amazing Puzzle Explorer!</h2>
    <p className="mt-1 text-base text-muted-ink sm:mt-2 sm:text-lg">{puzzle.done}{newStar ? " You earned a new star!" : ""}</p>
    <div className="mx-auto mt-4 grid w-full max-w-md grid-cols-2 gap-3">
      <div className="rounded-2xl bg-mint p-3"><p className="text-2xl font-black text-ink sm:text-3xl">{puzzle.missing.length}</p><p className="text-xs font-bold text-ink/75 sm:text-sm">pieces placed</p></div>
      <div className="rounded-2xl bg-sky p-3"><p className="text-2xl font-black text-ink sm:text-3xl">{hints}</p><p className="text-xs font-bold text-ink/75 sm:text-sm">hints used</p></div>
    </div>
    <div className="mt-4"><StarTrail earned={stars} total={puzzleLevels.length} /><p className="mt-1 text-sm font-black text-ink">{stars} of {puzzleLevels.length} stars</p></div>
    <div className="mt-5 flex flex-wrap justify-center gap-3 sm:mt-7">
      <Button onClick={onAgain}>Play Again</Button>
      <Button variant="secondary" onClick={onChoose}>Choose Another Puzzle</Button>
      <Link href="/games" onClick={stopSpeech} className={secondaryLink}>Back to Games</Link>
    </div>
    {saveNote ? <p role="status" className="mt-3 text-sm font-bold text-muted-ink">{saveNote}</p> : null}
  </Card>;
}
