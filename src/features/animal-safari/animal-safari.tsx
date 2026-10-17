"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimalArt } from "@/features/animal-safari/animal-art";
import { AnimalDetail } from "@/features/animal-safari/animal-detail";
import { AnimalGallery } from "@/features/animal-safari/animal-gallery";
import { AudioStatus, ChoiceButton, CompletionCard, GameHero, GameScreen, GameTopBar, ModeCard, ModeHeader, QuizCard, SpeakerButton } from "@/features/games/game-ui";
import { useQuizSession } from "@/features/games/use-quiz-session";
import { animals, getAnimal, type AnimalEntry, type AnimalId, type Habitat } from "@/lib/animal-data";
import { emptyAnimalProgress, readAnimalProgress, saveAnimalProgress, type AnimalMode, type AnimalProgress } from "@/lib/animal-progress";
import { MIN_SOUND_ANIMALS, makeFindChoices, makeFindSession, makeSoundChoices, makeSoundSession, soundAnimals, type FindQuestion } from "@/lib/animal-questions";
import { animalSoundFiles } from "@/lib/animal-sounds";
import { speakableText } from "@/lib/encouragement";
import { playSound, stopSound } from "@/lib/sound-player";
import { speak, stopSpeech } from "@/lib/speech";

const modeNames: Record<AnimalMode, string> = {
  meet: "Meet the Animals",
  sound: "Guess That Sound",
  find: "Find the Animal",
};

const soundReadyAnimals = soundAnimals();
const soundQuizReady = soundReadyAnimals.length >= MIN_SOUND_ANIMALS;

function stopAllAudio() {
  stopSpeech();
  stopSound();
}

/** Speech never talks over an animal sound: whichever starts last wins. */
function say(text: string, onError?: () => void) {
  stopSound();
  return speak(text, onError);
}

export function AnimalSafari() {
  const [progress, setProgress] = useState<AnimalProgress>(emptyAnimalProgress);
  const progressRef = useRef<AnimalProgress>(emptyAnimalProgress);
  const [mode, setMode] = useState<AnimalMode | null>(null);
  const [summary, setSummary] = useState<AnimalMode | null>(null);
  const [habitat, setHabitat] = useState<Habitat>("safari");
  const [openAnimal, setOpenAnimal] = useState<AnimalId | null>(null);
  const [metThisVisit, setMetThisVisit] = useState<AnimalId[]>([]);
  const [findSession, setFindSession] = useState<FindQuestion[]>([]);
  const [soundSession, setSoundSession] = useState<AnimalEntry[]>([]);
  const [audioStatus, setAudioStatus] = useState("");
  const quiz = useQuizSession<AnimalEntry>();

  useEffect(() => {
    const timer = window.setTimeout(() => { const saved = readAnimalProgress(); progressRef.current = saved; setProgress(saved); }, 0);
    return () => { window.clearTimeout(timer); stopAllAudio(); };
  }, []);

  // Visited pages stay mounted but hidden (Cache Components); coming back to the game starts on its mode list.
  useLayoutEffect(() => () => { setMode(null); setSummary(null); setOpenAnimal(null); setAudioStatus(""); }, []);

  function commit(next: AnimalProgress) {
    progressRef.current = next;
    setProgress(next);
    saveAnimalProgress(next);
  }

  function start(nextMode: AnimalMode) {
    if (nextMode === "sound" && !soundQuizReady) return;
    stopAllAudio();
    setAudioStatus("");
    setSummary(null);
    setMode(nextMode);
    if (nextMode === "meet") {
      setOpenAnimal(null);
      setMetThisVisit([]);
    } else if (nextMode === "find") {
      const session = makeFindSession();
      setFindSession(session);
      quiz.start(makeFindChoices(session[0]));
    } else {
      const session = makeSoundSession(soundReadyAnimals);
      setSoundSession(session);
      quiz.start(makeSoundChoices(session[0]));
    }
  }

  function finish() {
    stopAllAudio();
    if (!mode) return;
    const current = progressRef.current;
    if (!current.completed.includes(mode)) commit({ ...current, completed: [...current.completed, mode] });
    setSummary(mode);
    setMode(null);
    setOpenAnimal(null);
    setAudioStatus("");
  }

  function backToModes() {
    stopAllAudio();
    setMode(null);
    setSummary(null);
    setOpenAnimal(null);
    setAudioStatus("");
  }

  function meet(id: AnimalId) {
    stopAllAudio();
    setAudioStatus("");
    setOpenAnimal(id);
    setHabitat(getAnimal(id).habitat);
    setMetThisVisit((current) => current.includes(id) ? current : [...current, id]);
    const saved = progressRef.current;
    if (!saved.discovered.includes(id)) commit({ ...saved, discovered: [...saved.discovered, id] });
  }

  function closeAnimal() {
    stopAllAudio();
    setAudioStatus("");
    setOpenAnimal(null);
  }

  const questionCount = mode === "find" ? findSession.length : soundSession.length;
  const answerId = mode === "find" ? findSession[quiz.index]?.answer : mode === "sound" ? soundSession[quiz.index]?.id : undefined;

  function answer(choice: AnimalEntry) {
    if (!answerId) return;
    const correct = choice.id === answerId;
    const result = quiz.answer(correct);
    if (!result) return;
    const current = progressRef.current;
    commit({ ...current, attempted: current.attempted + (result.firstAttempt ? 1 : 0), correct: current.correct + (correct ? 1 : 0) });
    say(speakableText(result.message));
  }

  function showQuestion(position: number) {
    stopAllAudio();
    setAudioStatus("");
    quiz.show(position, (previous) => {
      const previousPosition = previous.findIndex((item) => item.id === answerId);
      return mode === "find" ? makeFindChoices(findSession[position], previousPosition) : makeSoundChoices(soundSession[position], previousPosition);
    });
  }

  function nextQuestion() {
    if (!quiz.isLocked()) return;
    if (quiz.index + 1 >= questionCount) { finish(); return; }
    showQuestion(quiz.index + 1);
  }

  const openEntry = openAnimal ? getAnimal(openAnimal) : null;
  const openPosition = openAnimal ? animals.findIndex((animal) => animal.id === openAnimal) : -1;
  const findQuestion = mode === "find" ? findSession[quiz.index] : undefined;
  const soundFile = mode === "sound" && answerId ? animalSoundFiles[answerId] : undefined;

  // Each new animal or question is introduced once as it appears (always right after a tap); buttons replay it.
  useEffect(() => {
    if (mode === "meet" && openEntry) say(openEntry.pronunciation);
    else if (findQuestion) say(findQuestion.prompt);
    else if (soundFile) playSound(soundFile);
  }, [mode, openEntry, findQuestion, soundFile, quiz.index]);

  const inMode = Boolean(mode || summary);

  return <GameScreen active={mode !== null}>
    <GameTopBar inMode={inMode} onBackToModes={backToModes} onLeave={stopAllAudio} />
    <GameHero eyebrow="Game 2" title="Animal Safari" description="Meet animals, learn fun facts, and find friends." tint="bg-mint" art={<span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-sunshine text-4xl sm:size-28 sm:text-7xl">🦒</span>} hidden={inMode} />

    {summary ? <CompletionCard art={<span aria-hidden="true" className="game-celebrate block text-[7rem] leading-none sm:text-[8.5rem]">🦁</span>} subtitle={summary === "meet" ? "You went on an animal safari!" : `You finished ${modeNames[summary]}.`} stats={summary === "meet" ? [{ value: metThisVisit.length, label: "animals met today" }, { value: `${progress.discovered.length} / ${animals.length}`, label: "animal friends so far" }] : [{ value: quiz.sessionCorrect, label: "animals found" }, { value: quiz.sessionAttempts, label: "tries this round" }]} onPlayAgain={() => start(summary)} onChooseMode={backToModes} />
    : mode === null ? <section className="mt-4 flex flex-col max-md:flex-1 sm:mt-7"><h2 className="text-xl font-black text-ink sm:text-3xl">Choose a safari</h2><p className="mt-1 text-sm text-muted-ink sm:mt-2 sm:text-base">Pick one way to play. You can change anytime.</p><div className="mt-3 grid gap-2 max-md:flex-1 sm:mt-5 sm:gap-4 md:grid-cols-3">
      <ModeCard emoji="🐾" title={modeNames.meet} description="Tap animals to hear their names and fun facts." onStart={() => start("meet")} />
      <ModeCard emoji="🎧" title={modeNames.sound} description="Listen to a real animal sound and pick who made it." onStart={() => start("sound")} disabledNote={soundQuizReady ? undefined : "Real animal sounds are on their way! 🎧"} />
      <ModeCard emoji="🔍" title={modeNames.find} description="Answer fun questions by tapping the right animal." onStart={() => start("find")} />
    </div><Card className="mt-3 bg-white p-4 sm:mt-6 sm:p-6"><h2 className="text-base font-black text-ink sm:text-lg">Your safari journey</h2><p className="mt-1 text-xs text-muted-ink sm:mt-2 sm:text-sm">{progress.discovered.length} of {animals.length} animals met · {progress.correct} correct answers · {progress.completed.length} activities completed</p></Card></section>
    : mode === "meet" ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><div className={openEntry ? "[@media(max-height:700px)]:hidden" : ""}><ModeHeader title={modeNames.meet} counter={`${progress.discovered.length} of ${animals.length} met`} current={progress.discovered.length} total={animals.length} /></div>
      {openEntry ? <AnimalDetail animal={openEntry} soundFile={animalSoundFiles[openEntry.id]} hasPrevious={openPosition > 0} hasNext={openPosition < animals.length - 1} onBack={closeAnimal} onMove={(delta) => meet(animals[openPosition + delta].id)} say={say} playSound={playSound} onStatus={setAudioStatus} />
      : <AnimalGallery habitat={habitat} onHabitat={setHabitat} discovered={progress.discovered} onOpen={meet} onDone={finish} />}
      <AudioStatus message={audioStatus} />
    </section>
    : answerId ? <section className="mt-3 flex flex-1 flex-col sm:mt-6"><ModeHeader title={modeNames[mode]} counter={`Question ${quiz.index + 1} of ${questionCount}`} current={quiz.index + 1} total={questionCount} />
      <QuizCard prompt={mode === "find" ? findQuestion?.prompt ?? "" : "Who makes this sound?"} helper={mode === "sound" ? "Listen, then tap the animal." : undefined} feedback={quiz.feedback} message={quiz.message} earned={quiz.sessionCorrect} total={questionCount} index={quiz.index} onPrevious={() => showQuestion(quiz.index - 1)} onNext={nextQuestion}
        audio={mode === "find" ? <SpeakerButton label="Hear the question again" onPlay={(onError) => say(findQuestion?.prompt ?? "", onError)} onStatus={setAudioStatus} /> : <SpeakerButton label="Play the animal sound" icon="🎧" onPlay={(onError) => soundFile ? playSound(soundFile, onError) : "unavailable"} onStatus={setAudioStatus}>Play the sound</SpeakerButton>}
        choices={quiz.choices.map((choice) => <ChoiceButton key={choice.id} label={choice.name} found={quiz.feedback === "correct" && choice.id === answerId} disabled={quiz.feedback === "correct"} onClick={() => answer(choice)}><AnimalArt animal={choice} size="choice" /><span className="mt-2 block text-xs font-black text-ink sm:text-lg">{choice.wrapName ?? choice.name}</span></ChoiceButton>)} />
      <AudioStatus message={audioStatus} />
    </section>
    : <Card className="mt-6 bg-white p-6"><p className="font-bold text-ink">Getting the safari ready…</p><Button onClick={backToModes} className="mt-4">Choose a mode</Button></Card>}
  </GameScreen>;
}
