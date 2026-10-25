import type { GameId, LastPlayed } from "@/lib/activity";
import { alphabet } from "@/lib/alphabet-data";
import type { AlphabetMode, AlphabetProgress } from "@/lib/alphabet-progress";
import { animals } from "@/lib/animal-data";
import type { AnimalMode, AnimalProgress } from "@/lib/animal-progress";
import { MIN_SOUND_ANIMALS, soundAnimals } from "@/lib/animal-questions";
import { colors, detectiveMissions } from "@/lib/color-data";
import type { ColorMode, ColorProgress } from "@/lib/color-progress";
import { pictures } from "@/lib/coloring-pictures";
import { adventureChallenges, countingMissions, numbers } from "@/lib/count-data";
import { emptyCountProgress, type CountMode, type CountProgress } from "@/lib/count-progress";
import { games } from "@/lib/games";
import { memoryPictures } from "@/lib/memory-data";
import { memoryLevelConfig, memoryLevels } from "@/lib/memory-game";
import { emptyMemoryProgress, type MemoryProgress } from "@/lib/memory-progress";
import { puzzleLevelConfig, puzzleLevels, puzzles } from "@/lib/puzzle-data";
import { emptyPuzzleProgress, type PuzzleProgress } from "@/lib/puzzle-progress";
import { getShape, meetShapeIds } from "@/lib/shape-data";
import { emptyShapeProgress, type ShapeLevel, type ShapeProgress } from "@/lib/shape-progress";

export type ProgressStatus = "not-started" | "in-progress" | "completed";
export type ActivityReport = { label: string; status: ProgressStatus };
/** One countable goal inside a game; `hint` is the suggestion shown while it is unfinished. */
export type Milestone = { label: string; done: number; total: number; hint: string };

export type GameReport = {
  id: GameId;
  title: string;
  emoji: string;
  tint: string;
  href: string;
  status: ProgressStatus;
  /** 0–100: the average of the game's milestones. */
  percent: number;
  attempted: number;
  correct: number;
  /** Share of quiz questions answered correctly, or null before any quiz. */
  accuracy: number | null;
  activities: ActivityReport[];
  milestones: Milestone[];
  /** Things the child has not met yet, such as letters still to discover. */
  stillToMeet: { label: string; items: string[] };
  nextStep: string;
  lastPlayed: number | null;
  /** Shown instead of the quiz score by games that have no quiz questions. */
  summary?: { label: string; text: string };
};

export type ParentReport = {
  games: GameReport[];
  status: ProgressStatus;
  percent: number;
  gamesStarted: number;
  gamesCompleted: number;
  activitiesDone: number;
  activitiesTotal: number;
  attempted: number;
  correct: number;
  accuracy: number | null;
  lastPlayed: number | null;
};

export type ReportInput = { alphabet: AlphabetProgress; animal: AnimalProgress; color: ColorProgress; count?: CountProgress; shape?: ShapeProgress; memory?: MemoryProgress; puzzle?: PuzzleProgress; lastPlayed: LastPlayed };

const alphabetModes: readonly { id: AlphabetMode; label: string }[] = [{ id: "discover", label: "Discover the Letters" }, { id: "find", label: "Find the Letter" }, { id: "match", label: "Match the Letter" }];
const animalModes: readonly { id: AnimalMode; label: string }[] = [{ id: "meet", label: "Meet the Animals" }, { id: "sound", label: "Guess That Sound" }, { id: "find", label: "Find the Animal" }];
const colorModeLabels: readonly { id: ColorMode; label: string }[] = [{ id: "meet", label: "Meet the Colors" }, { id: "find", label: "Find the Color" }, { id: "paint", label: "Color the World" }, { id: "detective", label: "Color Detective" }];
const countModeLabels: readonly { id: CountMode; label: string }[] = [{ id: "meet", label: "Meet the Numbers" }, { id: "count", label: "Count and Tap" }, { id: "match", label: "Match the Number" }, { id: "adventure", label: "Number Adventure" }];
const shapeLevelLabels: readonly { id: ShapeLevel; label: string }[] = [{ id: "meet", label: "Meet the Shapes" }, { id: "match", label: "Match the Shapes" }, { id: "safari", label: "Shape Safari" }];

/** Below this score, after enough questions, the next step suggests practising together. */
const PRACTICE_ACCURACY = 0.6;
const PRACTICE_MIN_ATTEMPTS = 5;

const percentOf = (milestones: readonly Milestone[]) => milestones.length ? Math.round(milestones.reduce((sum, item) => sum + (item.total ? Math.min(item.done, item.total) / item.total : 1), 0) / milestones.length * 100) : 0;
const accuracyOf = (correct: number, attempted: number) => attempted > 0 ? Math.min(correct, attempted) / attempted : null;

function activityReports<M extends string>(modes: readonly { id: M; label: string }[], completed: readonly M[], started: readonly M[] = []): ActivityReport[] {
  return modes.map((mode) => ({ label: mode.label, status: completed.includes(mode.id) ? "completed" : started.includes(mode.id) ? "in-progress" : "not-started" }));
}

function activitiesMilestone(activities: readonly ActivityReport[]): Milestone {
  const next = activities.find((item) => item.status === "in-progress") ?? activities.find((item) => item.status !== "completed");
  return { label: "Activities finished", done: activities.filter((item) => item.status === "completed").length, total: activities.length, hint: next ? `${next.status === "in-progress" ? "Finish" : "Try"} ${next.label} together.` : "" };
}

function buildGame(id: GameId, parts: { activities: ActivityReport[]; milestones: Milestone[]; attempted: number; correct: number; stillToMeet: GameReport["stillToMeet"]; practice: string; anyActivity: boolean }, lastPlayed: LastPlayed): GameReport {
  const listing = games.find((game) => game.id === id);
  const percent = percentOf(parts.milestones);
  const accuracy = accuracyOf(parts.correct, parts.attempted);
  const status: ProgressStatus = percent === 100 ? "completed" : parts.anyActivity || parts.attempted > 0 || parts.milestones.some((item) => item.done > 0) ? "in-progress" : "not-started";
  const unfinished = parts.milestones.find((item) => item.done < item.total);
  const needsPractice = accuracy !== null && parts.attempted >= PRACTICE_MIN_ATTEMPTS && accuracy < PRACTICE_ACCURACY;
  const nextStep = status === "not-started" ? `Start with ${parts.activities[0]?.label ?? "the first activity"}.` : needsPractice ? parts.practice : unfinished ? unfinished.hint : "Everything is complete. Replaying favourite activities keeps it fresh.";
  return { id, title: listing?.title ?? id, emoji: listing?.emoji ?? "🎲", tint: listing?.tint ?? "bg-sky", href: listing?.href ?? "/games", status, percent, attempted: parts.attempted, correct: Math.min(parts.correct, parts.attempted), accuracy, activities: parts.activities, milestones: parts.milestones, stillToMeet: parts.stillToMeet, nextStep, lastPlayed: lastPlayed[id] ?? null };
}

export function alphabetReport(progress: AlphabetProgress, lastPlayed: LastPlayed = {}): GameReport {
  const activities = activityReports(alphabetModes, progress.completed);
  const left = alphabet.filter((entry) => !progress.discovered.includes(entry.upper)).map((entry) => entry.upper);
  return buildGame("alphabet-adventure", {
    activities,
    milestones: [activitiesMilestone(activities), { label: "Letters discovered", done: alphabet.length - left.length, total: alphabet.length, hint: `Open Discover the Letters to meet the ${left.length} letters left.` }],
    attempted: progress.attempted, correct: progress.correct,
    stillToMeet: { label: "Letters still to discover", items: left },
    practice: "Play Find the Letter together and say each letter out loud.",
    anyActivity: false,
  }, lastPlayed);
}

export function animalReport(progress: AnimalProgress, lastPlayed: LastPlayed = {}): GameReport {
  // Guess That Sound only counts once enough animal recordings are available.
  const modes = soundAnimals().length < MIN_SOUND_ANIMALS ? animalModes.filter((mode) => mode.id !== "sound") : animalModes;
  const activities = activityReports(modes, progress.completed);
  const left = animals.filter((animal) => !progress.discovered.includes(animal.id)).map((animal) => animal.name);
  return buildGame("animal-safari", {
    activities,
    milestones: [activitiesMilestone(activities), { label: "Animals met", done: animals.length - left.length, total: animals.length, hint: `Open Meet the Animals to visit the ${left.length} animals left.` }],
    attempted: progress.attempted, correct: progress.correct,
    stillToMeet: { label: "Animals still to meet", items: left },
    practice: "Look at Meet the Animals together, then try Find the Animal again.",
    anyActivity: false,
  }, lastPlayed);
}

export function colorReport(progress: ColorProgress, lastPlayed: LastPlayed = {}): GameReport {
  const activities = activityReports(colorModeLabels, progress.completed, progress.started);
  const left = colors.filter((color) => !progress.discovered.includes(color.id)).map((color) => color.name);
  const colored = pictures.filter((picture) => progress.colored.includes(picture.id)).length;
  const missions = detectiveMissions.filter((mission) => progress.missions.includes(mission.id)).length;
  return buildGame("color-quest", {
    activities,
    milestones: [
      activitiesMilestone(activities),
      { label: "Colors met", done: colors.length - left.length, total: colors.length, hint: `Open Meet the Colors to meet the ${left.length} colors left.` },
      { label: "Pictures colored", done: colored, total: pictures.length, hint: `Finish coloring ${pictures.length - colored} more pictures in Color the World.` },
      { label: "Detective missions", done: missions, total: detectiveMissions.length, hint: "Do a Color Detective mission together around the home." },
    ],
    attempted: progress.attempted, correct: progress.correct,
    stillToMeet: { label: "Colors still to meet", items: left },
    practice: "Name colors together in Meet the Colors, then try Find the Color again.",
    anyActivity: progress.started.length > 0,
  }, lastPlayed);
}

export function countReport(progress: CountProgress, lastPlayed: LastPlayed = {}): GameReport {
  const activities = activityReports(countModeLabels, progress.completed, progress.started);
  const left = numbers.filter((value) => !progress.met.includes(value)).map(String);
  const challenges = adventureChallenges.filter((challenge) => progress.challenges.includes(challenge.id)).length;
  return buildGame("count-the-stars", {
    activities,
    milestones: [
      activitiesMilestone(activities),
      { label: "Numbers met", done: numbers.length - left.length, total: numbers.length, hint: `Open Meet the Numbers to meet the ${left.length} numbers left.` },
      { label: "Adventure challenges", done: challenges, total: adventureChallenges.length, hint: `Finish ${adventureChallenges.length - challenges} more challenges in Number Adventure.` },
    ],
    attempted: progress.attempted, correct: progress.correct,
    stillToMeet: { label: "Numbers still to meet", items: left },
    practice: "Count real things together, touching each one, then try Count and Tap again.",
    anyActivity: progress.started.length > 0 || progress.missions.some((id) => countingMissions.some((mission) => mission.id === id)),
  }, lastPlayed);
}

export function shapeReport(progress: ShapeProgress, lastPlayed: LastPlayed = {}): GameReport {
  const activities = activityReports(shapeLevelLabels, progress.completed, progress.started);
  const left = meetShapeIds.filter((id) => !progress.met.includes(id)).map((id) => getShape(id).name);
  return buildGame("shape-safari", {
    // Each finished level is one of the stars the child sees in the game.
    activities,
    milestones: [activitiesMilestone(activities), { label: "Shapes met", done: meetShapeIds.length - left.length, total: meetShapeIds.length, hint: `Open Meet the Shapes to meet the ${left.length} shapes left.` }],
    attempted: progress.attempted, correct: progress.correct,
    stillToMeet: { label: "Shapes still to meet", items: left },
    practice: "Spot circles, squares and triangles around the home together, then try Match the Shapes again.",
    anyActivity: progress.started.length > 0,
  }, lastPlayed);
}

export function memoryReport(progress: MemoryProgress, lastPlayed: LastPlayed = {}): GameReport {
  const activities = activityReports(memoryLevels.map((level) => ({ id: level, label: memoryLevelConfig[level].title })), progress.completed, progress.started);
  const left = memoryPictures.filter((picture) => !progress.found.includes(picture.id)).map((picture) => picture.name);
  const summary = { label: "Games played", text: progress.games ? `${progress.games} finished, with ${progress.pairs} pairs found in ${progress.attempts} tries` : "No games finished yet" };
  return { ...buildGame("memory-match", {
    activities,
    milestones: [activitiesMilestone(activities), { label: "Pictures matched", done: memoryPictures.length - left.length, total: memoryPictures.length, hint: `Play Memory Master to find the ${left.length} pictures left.` }],
    // Turning over two different cards is part of playing, not a wrong answer, so it stays out of the quiz score.
    attempted: 0, correct: 0,
    stillToMeet: { label: "Pictures still to match", items: left },
    practice: "",
    anyActivity: progress.started.length > 0 || progress.games > 0,
  }, lastPlayed), summary };
}

export function puzzleReport(progress: PuzzleProgress, lastPlayed: LastPlayed = {}): GameReport {
  const activities = activityReports(puzzleLevels.map((level) => ({ id: level, label: puzzleLevelConfig[level].title })), progress.completed, progress.started);
  const left = puzzles.filter((puzzle) => !progress.solved.includes(puzzle.id)).map((puzzle) => puzzle.name);
  const summary = { label: "Puzzles played", text: progress.games ? `${progress.games} finished, with ${progress.hints} hints used` : "No puzzles finished yet" };
  return { ...buildGame("puzzle-playground", {
    activities,
    milestones: [activitiesMilestone(activities), { label: "Pictures built", done: puzzles.length - left.length, total: puzzles.length, hint: `Build the ${left.length} pictures left together.` }],
    // A piece tried in the wrong spot is part of solving, not a wrong answer, so it stays out of the quiz score.
    attempted: 0, correct: 0,
    stillToMeet: { label: "Pictures still to build", items: left },
    practice: "",
    anyActivity: progress.started.length > 0 || progress.games > 0,
  }, lastPlayed), summary };
}

export function buildParentReport(input: ReportInput): ParentReport {
  const reports = [alphabetReport(input.alphabet, input.lastPlayed), animalReport(input.animal, input.lastPlayed), colorReport(input.color, input.lastPlayed), countReport(input.count ?? emptyCountProgress, input.lastPlayed), shapeReport(input.shape ?? emptyShapeProgress, input.lastPlayed), memoryReport(input.memory ?? emptyMemoryProgress, input.lastPlayed), puzzleReport(input.puzzle ?? emptyPuzzleProgress, input.lastPlayed)];
  const sum = (pick: (report: GameReport) => number) => reports.reduce((total, report) => total + pick(report), 0);
  const attempted = sum((report) => report.attempted);
  const correct = sum((report) => report.correct);
  const percent = Math.round(sum((report) => report.percent) / reports.length);
  const gamesStarted = reports.filter((report) => report.status !== "not-started").length;
  const times = reports.map((report) => report.lastPlayed).filter((time): time is number => time !== null);
  return {
    games: reports,
    status: percent === 100 ? "completed" : gamesStarted > 0 ? "in-progress" : "not-started",
    percent,
    gamesStarted,
    gamesCompleted: reports.filter((report) => report.status === "completed").length,
    activitiesDone: sum((report) => report.activities.filter((item) => item.status === "completed").length),
    activitiesTotal: sum((report) => report.activities.length),
    attempted,
    correct,
    accuracy: accuracyOf(correct, attempted),
    lastPlayed: times.length ? Math.max(...times) : null,
  };
}

/** A short, friendly "last played" phrase measured in calendar days on this device. */
export function describeLastPlayed(time: number | null, now = Date.now()): string {
  if (time === null) return "Not played yet";
  const startOfDay = (value: number) => { const date = new Date(value); date.setHours(0, 0, 0, 0); return date.getTime(); };
  const days = Math.round((startOfDay(now) - startOfDay(time)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(time).toLocaleDateString(undefined, { day: "numeric", month: "short", year: new Date(time).getFullYear() === new Date(now).getFullYear() ? undefined : "numeric" });
}
