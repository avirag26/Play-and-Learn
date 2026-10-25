"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import { AudioStatus, FeedbackBubble, GameScreen, GameTopBar, StarTrail, audioStatusMessage } from "@/features/games/game-ui";
import { CardFan, LevelCards, MemoryMascot } from "@/features/memory-match/memory-art";
import { MemoryCard } from "@/features/memory-match/memory-card";
import { readSettings, saveSettings } from "@/lib/app-settings";
import { pickPhrase } from "@/lib/encouragement";
import { matchCheers, matchSpeech, memoryLines, pictureSpeech } from "@/lib/memory-data";
import { MISMATCH_DELAY_MS, dealCards, emptyMemoryState, memoryLevelConfig, memoryLevels, memoryReducer, totalPairs, type MemoryAction, type MemoryLevel, type MemoryState } from "@/lib/memory-game";
import { emptyMemoryProgress, nextLevel, readMemoryProgress, recordGame, saveMemoryProgress, starsEarned, withItem, type MemoryProgress } from "@/lib/memory-progress";
import { speak, stopSpeech } from "@/lib/speech";

/** How long the last pair celebrates on the table before the finish screen. */
const FINISH_DELAY_MS = 2000;

// Each board is as wide as the screen allows while every card still fits above the feedback bubble.
const boardLayout: Record<MemoryLevel, string> = {
  little: "grid-cols-2 w-[min(100%,33dvh,22rem)]",
  curious: "grid-cols-3 w-[min(100%,50dvh,32rem)]",
  master: "grid-cols-4 w-[min(100%,68dvh,40rem)]",
};

type Screen = { kind: "intro" } | { kind: "play" } | { kind: "complete"; level: MemoryLevel; pairs: number; attempts: number; newStar: boolean };

const secondaryLink = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-cream px-6 text-base font-extrabold text-ink shadow-[0_4px_0_#d99052] transition-all hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";
const toolButton = "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 text-sm font-black text-ink focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";

export function MemoryMatch() {
  const [progress, setProgress] = useState<MemoryProgress>(emptyMemoryProgress);
  const progressRef = useRef<MemoryProgress>(emptyMemoryProgress);
  const [loaded, setLoaded] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [screen, setScreen] = useState<Screen>({ kind: "intro" });
  // The game lives in a ref as well as state, so two taps before a re-render still see the latest cards.
  const [game, setGame] = useState<MemoryState>(emptyMemoryState);
  const gameRef = useRef<MemoryState>(emptyMemoryState());
  const finishedRound = useRef(0);
  /** The one pending timer: hiding the preview, turning two cards back, or showing the finish screen. */
  const timer = useRef(0);
  const [message, setMessage] = useState("");
  const [cheering, setCheering] = useState(false);
  const [audioStatus, setAudioStatus] = useState("");
  const [soundOn, setSoundOn] = useState(true);

  function clearTimer() {
    window.clearTimeout(timer.current);
    timer.current = 0;
  }

  function later(run: () => void, delay: number) {
    clearTimer();
    timer.current = window.setTimeout(() => { timer.current = 0; run(); }, delay);
  }

  useEffect(() => {
    const load = window.setTimeout(() => { const saved = readMemoryProgress(); progressRef.current = saved; setProgress(saved); setSoundOn(readSettings().soundOn); setLoaded(true); }, 0);
    return () => { window.clearTimeout(load); window.clearTimeout(timer.current); timer.current = 0; stopSpeech(); };
  }, []);

  // Visited pages stay mounted but hidden (Cache Components); coming back to the game starts on its welcome screen.
  useLayoutEffect(() => () => { window.clearTimeout(timer.current); timer.current = 0; stopSpeech(); setScreen({ kind: "intro" }); setMessage(""); setAudioStatus(""); }, []);

  function dispatch(action: MemoryAction): MemoryState {
    const next = memoryReducer(gameRef.current, action);
    if (next !== gameRef.current) { gameRef.current = next; setGame(next); }
    return next;
  }

  function commit(next: MemoryProgress) {
    if (next === progressRef.current) return;
    progressRef.current = next;
    setProgress(next);
    if (!saveMemoryProgress(next)) setSaveNote("This device isn't saving progress right now, so stars may not be kept. You can keep playing!");
  }

  /** Speaks something the child just triggered; only a real failure (not "sound off") shows a note. */
  function announce(text: string) {
    const result = speak(text, (reason) => setAudioStatus(audioStatusMessage("unavailable", reason)));
    setAudioStatus(result === "unsupported" || result === "unavailable" ? audioStatusMessage(result) : "");
  }

  /** Shows a line in the feedback bubble (read by screen readers) and says it aloud. */
  function say(text: string, cheer = false) {
    setMessage(text);
    setCheering(cheer);
    announce(text);
  }

  function startLevel(level: MemoryLevel) {
    clearTimer();
    stopSpeech();
    setAudioStatus("");
    const previous = gameRef.current.level === level ? gameRef.current.cards : [];
    const round = gameRef.current.round + 1;
    dispatch({ type: "deal", level, round, cards: dealCards(level, Math.random, previous) });
    commit(withItem(progressRef.current, "started", level));
    setScreen({ kind: "play" });
    say(memoryLines.preview);
    later(() => { dispatch({ type: "hide", round }); say(memoryLines.start); }, memoryLevelConfig[level].previewMs);
  }

  function flip(id: string) {
    const before = gameRef.current;
    const next = dispatch({ type: "flip", id });
    if (next === before) return;
    const card = next.cards.find((item) => item.id === id);
    if (!card) return;
    if (next.pairsFound > before.pairsFound) {
      say(`${pickPhrase(matchCheers)} ${matchSpeech(card.picture)}`, true);
      if (next.status === "complete") finish(next);
    } else if (next.status === "checking") {
      say(`${pictureSpeech(card.picture)} ${memoryLines.miss}`);
      const round = next.round;
      later(() => dispatch({ type: "resolve", round }), MISMATCH_DELAY_MS);
    } else {
      say(`${pictureSpeech(card.picture)} ${memoryLines.findOther}`);
    }
  }

  /** Saves the finished game once (its star only the first time), then shows the finish screen. */
  function finish(done: MemoryState) {
    if (finishedRound.current === done.round) return;
    finishedRound.current = done.round;
    const newStar = !progressRef.current.completed.includes(done.level);
    commit(recordGame(progressRef.current, { level: done.level, pictures: [...new Set(done.cards.map((card) => card.picture))], pairs: done.pairsFound, attempts: done.attempts }));
    later(() => {
      setScreen({ kind: "complete", level: done.level, pairs: done.pairsFound, attempts: done.attempts, newStar });
      announce(newStar ? `${memoryLines.done} Hooray! You earned a star!` : memoryLines.done);
    }, FINISH_DELAY_MS);
  }

  function backToIntro() {
    clearTimer();
    stopSpeech();
    setScreen({ kind: "intro" });
    setMessage("");
    setAudioStatus("");
  }

  /** The same switch as "Sound effects and spoken words" in the grown-up settings. */
  function toggleSound() {
    const settings = readSettings();
    const next = { ...settings, soundOn: !settings.soundOn };
    saveSettings(next);
    setSoundOn(next.soundOn);
    setAudioStatus("");
    if (!next.soundOn) stopSpeech();
  }

  const stars = starsEarned(progress);
  const pairs = totalPairs(game);
  const config = memoryLevelConfig[game.level];

  return <GameScreen active={screen.kind !== "intro"}>
    <GameTopBar inMode={screen.kind !== "intro"} onBackToModes={backToIntro} onLeave={stopSpeech} />

    {screen.kind === "intro" ? <section className="mt-3 flex flex-col gap-3 max-md:flex-1 sm:mt-5 sm:gap-6">
      <div className="rounded-[2rem] bg-lavender/60 p-4 text-center sm:p-8">
        <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-6 sm:text-left">
          <MemoryMascot className="game-pop w-24 shrink-0 sm:w-36" />
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-muted-ink">Game 6</p><h1 className="text-3xl font-black text-ink sm:text-5xl">Memory Match</h1><p className="mt-1 text-lg font-black text-ink/80 sm:text-2xl">{memoryLines.welcome}</p></div>
        </div>
        <CardFan className="mx-auto mt-3 max-w-xs sm:mt-6" />
        <Button onClick={() => startLevel(nextLevel(progressRef.current))} className="mt-5 min-h-14 px-10 text-xl sm:mt-8 sm:min-h-16 sm:text-2xl">Play <span aria-hidden="true">▶</span></Button>
        <p className="mt-3 min-h-6 text-sm font-black text-ink" aria-live="polite">{loaded ? <><span aria-hidden="true">⭐ </span>{stars} of {memoryLevels.length} stars</> : null}</p>
      </div>
      <h2 className="sr-only">Levels</h2>
      <ul className="grid grid-cols-3 gap-2 sm:gap-4">{memoryLevels.map((level) => {
        const info = memoryLevelConfig[level];
        const done = progress.completed.includes(level);
        return <li key={level} className="min-w-0"><button type="button" onClick={() => startLevel(level)} aria-label={`Level ${info.number}: ${info.title}, ${info.pairs} pairs${done ? ". Star earned." : ""}`} className={`flex h-full w-full flex-col items-center gap-1 rounded-3xl p-2 text-center shadow-[0_4px_0_rgba(42,91,145,0.15)] transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink sm:gap-2 sm:p-5 ${done ? "bg-sunshine/40" : "bg-white"}`}>
          <span className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted-ink sm:text-xs">Level {info.number}</span>
          <span className="flex h-10 items-center sm:h-16"><LevelCards pairs={info.pairs} className={info.pairs === 2 ? "w-7 sm:w-11" : info.pairs === 3 ? "w-10 sm:w-16" : "w-12 sm:w-20"} /></span>
          <span className="text-sm font-black leading-tight text-ink sm:text-lg">{info.title}</span>
          <span className="hidden text-sm leading-5 text-muted-ink sm:block">{info.description}</span>
          <span aria-hidden="true" className={`mt-auto text-xl sm:text-2xl ${done ? "" : "opacity-25 grayscale"}`}>⭐</span>
        </button></li>;
      })}</ul>
      {saveNote ? <p role="status" className="text-center text-sm font-bold text-muted-ink">{saveNote}</p> : null}
    </section>

    : screen.kind === "play" && game.cards.length ? <section className="mt-3 flex flex-1 flex-col sm:mt-6">
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 text-base font-black leading-tight text-ink sm:text-2xl"><span className="max-sm:sr-only">Level {config.number} · </span>{config.title}</h2>
        <span className="rounded-full bg-white px-3 py-1.5 text-sm font-black text-ink sm:px-4 sm:py-2"><span aria-hidden="true">⭐ </span>{game.pairsFound} of {pairs} pairs</span>
        <button type="button" onClick={toggleSound} aria-pressed={!soundOn} aria-label={soundOn ? "Turn sound off" : "Turn sound on"} className={toolButton}><span aria-hidden="true">{soundOn ? "🔊" : "🔇"}</span></button>
        <button type="button" onClick={() => startLevel(game.level)} aria-label="Shuffle the cards and start again" className={toolButton}><span aria-hidden="true">🔀</span><span className="max-sm:hidden">New cards</span></button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center py-3 sm:py-6">
        <h3 className="sr-only">Cards</h3>
        <ul className={`grid gap-3 sm:gap-4 ${boardLayout[game.level]}`}>{game.cards.map((card, position) => <li key={`${game.round}-${card.id}`} className="min-w-0"><MemoryCard card={card} position={position} total={game.cards.length} canFlip={game.status === "playing"} onFlip={flip} /></li>)}</ul>
      </div>
      <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-2 shadow-[0_4px_0_rgba(42,91,145,0.12)] sm:p-3"><FeedbackBubble feedback={cheering ? "correct" : "idle"} message={message} idleText={message || memoryLines.start} /></div>
      <AudioStatus message={audioStatus} />
    </section>

    : screen.kind === "complete" ? <Card className="mt-4 flex flex-col items-center justify-center bg-white p-5 text-center max-md:flex-1 sm:mt-6 sm:p-10">
      <Confetti />
      <div className="relative w-28 sm:w-40"><MemoryMascot className="game-celebrate block w-full" /><span aria-hidden="true" className="absolute -right-3 -top-2 text-4xl sm:text-5xl">🌟</span></div>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-muted-ink">Level {memoryLevelConfig[screen.level].number} finished</p>
      <h2 className="mt-1 text-2xl font-black text-ink sm:text-4xl">Amazing Memory Explorer!</h2>
      <p className="mt-1 text-base text-muted-ink sm:mt-2 sm:text-lg">You found every pair in {memoryLevelConfig[screen.level].title}.{screen.newStar ? " You earned a new star!" : " Playing again keeps your memory strong!"}</p>
      <div className="mx-auto mt-4 grid w-full max-w-md grid-cols-2 gap-3">
        <div className="rounded-2xl bg-mint p-3"><p className="text-2xl font-black text-ink sm:text-3xl">{screen.pairs}</p><p className="text-xs font-bold text-ink/75 sm:text-sm">pairs matched</p></div>
        <div className="rounded-2xl bg-sky p-3"><p className="text-2xl font-black text-ink sm:text-3xl">{screen.attempts}</p><p className="text-xs font-bold text-ink/75 sm:text-sm">tries</p></div>
      </div>
      <div className="mt-4"><StarTrail earned={stars} total={memoryLevels.length} /><p className="mt-1 text-sm font-black text-ink">{stars} of {memoryLevels.length} stars</p></div>
      <div className="mt-5 flex flex-wrap justify-center gap-3 sm:mt-7">
        <Button onClick={() => startLevel(screen.level)}>Play again</Button>
        {screen.level !== "master" ? <Button variant="secondary" onClick={() => startLevel(memoryLevels[memoryLevels.indexOf(screen.level) + 1])}>Next: {memoryLevelConfig[memoryLevels[memoryLevels.indexOf(screen.level) + 1]].title} →</Button> : null}
        <Link href="/games" onClick={stopSpeech} className={secondaryLink}>Back to Games</Link>
      </div>
      {saveNote ? <p role="status" className="mt-3 text-sm font-bold text-muted-ink">{saveNote}</p> : null}
    </Card>

    : <Card className="mt-6 bg-white p-6"><p className="font-bold text-ink">Getting the cards ready…</p><Button onClick={backToIntro} className="mt-4">Back to the start</Button></Card>}
  </GameScreen>;
}
