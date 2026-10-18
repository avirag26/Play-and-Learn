"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ObjectGroup, StarIcon } from "@/features/count-the-stars/count-item";
import { MatchNumbers } from "@/features/count-the-stars/match-numbers";
import { NumberDetail, NumberGallery } from "@/features/count-the-stars/meet-numbers";
import { NumberAdventure } from "@/features/count-the-stars/number-adventure";
import { AudioStatus, ChoiceButton, CompletionCard, GameHero, GameScreen, GameTopBar, ModeCard, ModeHeader, QuizCard, SpeakerButton, audioStatusMessage } from "@/features/games/game-ui";
import { useQuizSession } from "@/features/games/use-quiz-session";
import { adventureChallenges, countingMissions, countPhrase, meetSpeech, numbers, numberWords } from "@/lib/count-data";
import { adaptLevel, chooseLevel, emptyCountProgress, readCountProgress, recordAnswer, saveCountProgress, withItem, withoutItem, type CountMode, type CountProgress } from "@/lib/count-progress";
import { countLevels, isCorrectCount, makeCountSession, makeNumberChoices, type CountLevel, type CountQuestion } from "@/lib/count-questions";
import { speakableText } from "@/lib/encouragement";
import { speak, stopSpeech } from "@/lib/speech";

const modeNames: Record<CountMode, string> = {
  meet: "Meet the Numbers",
  count: "Count and Tap",
  match: "Match the Number",
  adventure: "Number Adventure",
};

const levelChoices: readonly { level: CountLevel; short: string }[] = [{ level: 1, short: "1–5" }, { level: 2, short: "1–10" }, { level: 3, short: "5–10" }];

export function CountTheStars() {
  const [progress, setProgress] = useState<CountProgress>(emptyCountProgress);
  const progressRef = useRef<CountProgress>(emptyCountProgress);
  const [mode, setMode] = useState<CountMode | null>(null);
  const [summary, setSummary] = useState<CountMode | null>(null);
  const [levelNote, setLevelNote] = useState("");
  const [openNumber, setOpenNumber] = useState<number | null>(null);
  const [metThisVisit, setMetThisVisit] = useState<number[]>([]);
  const [challengesThisVisit, setChallengesThisVisit] = useState<string[]>([]);
  const [matchStats, setMatchStats] = useState({ rounds: 0, firstTry: 0 });
  const [session, setSession] = useState<CountQuestion[]>([]);
  const [sessionLevel, setSessionLevel] = useState<CountLevel>(1);
  const [audioStatus, setAudioStatus] = useState("");
  const quiz = useQuizSession<number>();

  useEffect(() => {
    const timer = window.setTimeout(() => { const saved = readCountProgress(); progressRef.current = saved; setProgress(saved); }, 0);
    return () => { window.clearTimeout(timer); stopSpeech(); };
  }, []);

  // Visited pages stay mounted but hidden (Cache Components); coming back to the game starts on its mode list.
  useLayoutEffect(() => () => { stopSpeech(); setMode(null); setSummary(null); setOpenNumber(null); setAudioStatus(""); }, []);

  function commit(next: CountProgress) {
    if (next === progressRef.current) return;
    progressRef.current = next;
    setProgress(next);
    saveCountProgress(next);
  }

  /** Speaks something the child just triggered; only a real failure (not "sound off") shows a note. */
  function announce(text: string) {
    const result = speak(text, (reason) => setAudioStatus(audioStatusMessage("unavailable", reason)));
    setAudioStatus(result === "unsupported" || result === "unavailable" ? audioStatusMessage(result) : "");
  }

  function start(nextMode: CountMode) {
    stopSpeech();
    setAudioStatus("");
    setSummary(null);
    setLevelNote("");
    setMode(nextMode);
    commit(withItem(progressRef.current, "started", nextMode));
    const level = progressRef.current.level;
    setSessionLevel(level);
    if (nextMode === "meet") {
      setOpenNumber(null);
      setMetThisVisit([]);
      announce("Let's meet the numbers! Tap a number.");
    } else if (nextMode === "count") {
      const next = makeCountSession(level);
      setSession(next);
      quiz.start(makeNumberChoices(next[0], level));
      announce(`Let's count! ${next[0].prompt}`);
    } else if (nextMode === "match") {
      setMatchStats({ rounds: 0, firstTry: 0 });
      announce("Match the numbers!");
    } else {
      setChallengesThisVisit([]);
      announce("Number adventure! Pick a challenge.");
    }
  }

  function finish() {
    stopSpeech();
    if (!mode) return;
    let next = withItem(progressRef.current, "completed", mode);
    if (mode === "count" || mode === "match") {
      const adapted = adaptLevel(next);
      next = adapted.progress;
      setLevelNote(adapted.change === "up" ? `You're ready for bigger numbers! Next time: ${countLevels[next.level].label.toLowerCase()}.` : adapted.change === "down" ? `Next time we'll practise ${countLevels[next.level].label.toLowerCase()} together.` : "");
    }
    commit(next);
    setSummary(mode);
    setMode(null);
    setOpenNumber(null);
    setAudioStatus("");
  }

  function backToModes() {
    stopSpeech();
    setMode(null);
    setSummary(null);
    setOpenNumber(null);
    setAudioStatus("");
  }

  function meet(value: number) {
    stopSpeech();
    setOpenNumber(value);
    setMetThisVisit((current) => current.includes(value) ? current : [...current, value]);
    commit(withItem(progressRef.current, "met", value));
    announce(meetSpeech(value));
  }

  function closeNumber() {
    stopSpeech();
    setAudioStatus("");
    setOpenNumber(null);
  }

  const question = mode === "count" ? session[quiz.index] : undefined;

  function answer(choice: number) {
    if (!question) return;
    const correct = isCorrectCount(question, choice);
    const result = quiz.answer(correct);
    if (!result) return;
    commit(recordAnswer(progressRef.current, result.firstAttempt, correct));
    announce(correct ? `${speakableText(result.message)} ${countPhrase(question.count, question.object)}!` : `${speakableText(result.message)} Tap each one to count.`);
  }

  function showQuestion(position: number) {
    stopSpeech();
    setAudioStatus("");
    const answerValue = question?.count;
    quiz.show(position, (previous) => makeNumberChoices(session[position], sessionLevel, previous.indexOf(answerValue ?? -1)));
    announce(session[position].prompt);
  }

  function nextQuestion() {
    if (!quiz.isLocked()) return;
    if (quiz.index + 1 >= session.length) { finish(); return; }
    showQuestion(quiz.index + 1);
  }

  function challengeDone(id: string) {
    setChallengesThisVisit((current) => current.includes(id) ? current : [...current, id]);
    commit(withItem(progressRef.current, "challenges", id));
  }

  function toggleMission(id: string) {
    const current = progressRef.current;
    const done = current.missions.includes(id);
    commit(done ? withoutItem(current, "missions", id) : withItem(current, "missions", id));
    if (!done) announce("Great counting!");
  }

  const inMode = Boolean(mode || summary);
  const summaryStats: Record<CountMode, { value: string | number; label: string }[]> = {
    meet: [{ value: metThisVisit.length, label: "numbers met today" }, { value: `${progress.met.length} / ${numbers.length}`, label: "numbers met so far" }],
    count: [{ value: quiz.sessionCorrect, label: "groups counted" }, { value: quiz.sessionAttempts, label: "tries this round" }],
    match: [{ value: matchStats.rounds, label: "rounds matched" }, { value: matchStats.firstTry, label: "matched on the first try" }],
    adventure: [{ value: challengesThisVisit.length, label: "challenges today" }, { value: `${progress.challenges.length} / ${adventureChallenges.length}`, label: "challenges so far" }],
  };

  return <GameScreen active={mode !== null}>
    <GameTopBar inMode={inMode} onBackToModes={backToModes} onLeave={stopSpeech} />
    <GameHero eyebrow="Game 4" title="Count the Stars" description="Meet numbers 1 to 10, count, match, and go on number adventures." tint="bg-sky" art={<span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-sunshine p-2 sm:size-28 sm:p-4"><StarIcon className="size-full" /></span>} hidden={inMode} />

    {summary ? <CompletionCard art={<StarIcon className="game-celebrate mx-auto block w-28 sm:w-36" />} subtitle={`${summary === "meet" ? "You met so many numbers!" : `You finished ${modeNames[summary]}.`}${levelNote ? ` ${levelNote}` : ""}`} stats={summaryStats[summary]} onPlayAgain={() => start(summary)} onChooseMode={backToModes} />
    : mode === null ? <section className="mt-4 flex flex-col max-md:flex-1 sm:mt-7"><h2 className="text-xl font-black text-ink sm:text-3xl">Choose a counting game</h2><p className="mt-1 text-sm text-muted-ink sm:mt-2 sm:text-base">Pick one way to play. You can change anytime.</p><div className="mt-3 grid gap-2 max-md:flex-1 sm:mt-5 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
      <ModeCard emoji="🔢" title={modeNames.meet} description="See each number from 1 to 10 and tap to count the stars." onStart={() => start("meet")} />
      <ModeCard emoji="👆" title={modeNames.count} description="Count the things, then tap the right number." onStart={() => start("count")} />
      <ModeCard emoji="🧩" title={modeNames.match} description="Match each number card to the group with that many." onStart={() => start("match")} />
      <ModeCard emoji="🚀" title={modeNames.adventure} description="Collect stars, find apples, and help friends." onStart={() => start("adventure")} />
    </div>
    <Card className="mt-3 bg-white p-4 sm:mt-6 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-base font-black text-ink sm:text-lg">Numbers to play with</h2><p className="mt-1 text-xs text-muted-ink sm:text-sm">Count and Match grow with your child. A grown-up can change it here.</p></div>
        <div role="radiogroup" aria-label="Numbers to play with" className="grid grid-cols-3 gap-1.5 rounded-full bg-cream p-1.5">{levelChoices.map((choice) => <button key={choice.level} type="button" role="radio" aria-checked={progress.level === choice.level} aria-label={countLevels[choice.level].label} onClick={() => commit(chooseLevel(progressRef.current, choice.level))} className={`min-h-11 rounded-full px-4 text-sm font-black transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${progress.level === choice.level ? "bg-ink text-white" : "text-ink hover:bg-white"}`}>{choice.short}</button>)}</div>
      </div>
      <p className="mt-3 border-t border-ink/10 pt-3 text-xs text-muted-ink sm:text-sm">{progress.met.length} of {numbers.length} numbers met · {progress.correct} correct answers · {progress.challenges.length} of {adventureChallenges.length} challenges · {progress.missions.length} of {countingMissions.length} home missions</p>
    </Card></section>
    : mode === "meet" ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><div className={openNumber ? "[@media(max-height:700px)]:hidden" : ""}><ModeHeader title={modeNames.meet} counter={`${progress.met.length} of ${numbers.length} met`} current={progress.met.length} total={numbers.length} /></div>
      {openNumber ? <NumberDetail value={openNumber} onBack={closeNumber} onMove={(delta) => meet(openNumber + delta)} onCount={(spoken) => announce(numberWords[spoken])} say={speak} onStatus={setAudioStatus} />
      : <NumberGallery met={progress.met} onOpen={meet} onDone={finish} />}
      <AudioStatus message={audioStatus} />
    </section>
    : mode === "count" && question ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><ModeHeader title={modeNames.count} counter={`Question ${quiz.index + 1} of ${session.length}`} current={quiz.index + 1} total={session.length} />
      <QuizCard eyebrow="Count, then tap the number" prompt={question.prompt} feedback={quiz.feedback} message={quiz.message} earned={quiz.sessionCorrect} total={session.length} index={quiz.index} onPrevious={() => showQuestion(quiz.index - 1)} onNext={nextQuestion}
        audio={<SpeakerButton label="Hear the question again" onPlay={(onError) => speak(question.prompt, onError)} onStatus={setAudioStatus} />}
        picture={<div className="rounded-3xl bg-cream p-2 sm:p-4"><ObjectGroup key={`${question.id}-${quiz.index}`} count={question.count} object={question.object} onCount={(spoken) => announce(numberWords[spoken])} label={`A group of ${question.object === "star" ? "stars" : "things"} to count. Tap each one to count it.`} /><p className="mt-1 text-center text-xs font-bold text-muted-ink">Tap each one to count it.</p></div>}
        choiceColumns={quiz.choices.length === 4 ? "grid-cols-4" : "grid-cols-3"}
        choices={quiz.choices.map((choice) => <ChoiceButton key={choice} label={`${numberWords[choice]}`} found={quiz.feedback === "correct" && choice === question.count} disabled={quiz.feedback === "correct"} onClick={() => answer(choice)}><span className="text-[clamp(2.25rem,8dvh,4rem)] font-black leading-none text-ink">{choice}</span></ChoiceButton>)} />
      <AudioStatus message={audioStatus} />
    </section>
    : mode === "match" ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><h2 className="hidden text-2xl font-black text-ink md:block">{modeNames.match}</h2>
      <MatchNumbers level={sessionLevel} onAnswer={(firstAttempt, correct) => commit(recordAnswer(progressRef.current, firstAttempt, correct))} onAnnounce={announce} onDone={(stats) => { setMatchStats(stats); finish(); }} />
      <AudioStatus message={audioStatus} />
    </section>
    : mode === "adventure" ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><div className="hidden md:block"><ModeHeader title={modeNames.adventure} counter={`${progress.challenges.length} of ${adventureChallenges.length} done`} current={progress.challenges.length} total={adventureChallenges.length} /></div>
      <NumberAdventure challengesDone={progress.challenges} missionsDone={progress.missions} onChallengeDone={challengeDone} onToggleMission={toggleMission} onAnnounce={announce} onDone={finish} />
      <AudioStatus message={audioStatus} />
    </section>
    : <Card className="mt-6 bg-white p-6"><p className="font-bold text-ink">Getting the stars ready…</p><Button onClick={backToModes} className="mt-4">Choose a mode</Button></Card>}
  </GameScreen>;
}
