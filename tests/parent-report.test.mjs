import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const requireFromHere = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();

function load(sourcePath, browserWindow) {
  const filename = path.join(root, sourcePath);
  const key = `${filename}:${browserWindow ? "browser" : "server"}`;
  if (cache.has(key)) return cache.get(key);
  const source = fs.readFileSync(filename, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loadedModule = { exports: {} };
  cache.set(key, loadedModule.exports);
  const localRequire = (specifier) => specifier.startsWith("@/") ? load(`src/${specifier.slice(2)}.ts`, browserWindow) : requireFromHere(specifier);
  vm.runInNewContext("(function(require,module,exports,window){" + code + "\n})", { console })(localRequire, loadedModule, loadedModule.exports, browserWindow);
  cache.set(key, loadedModule.exports);
  return loadedModule.exports;
}

const report = load("src/lib/parent-report.ts");
const { alphabet } = load("src/lib/alphabet-data.ts");
const { animals } = load("src/lib/animal-data.ts");
const { colors, detectiveMissions } = load("src/lib/color-data.ts");
const { pictures } = load("src/lib/coloring-pictures.ts");
const { MIN_SOUND_ANIMALS, soundAnimals } = load("src/lib/animal-questions.ts");
const { adventureChallenges, numbers } = load("src/lib/count-data.ts");

const emptyAlphabet = { discovered: [], attempted: 0, correct: 0, completed: [] };
const emptyAnimal = { discovered: [], attempted: 0, correct: 0, completed: [] };
const emptyColor = { started: [], completed: [], discovered: [], attempted: 0, correct: 0, colored: [], missions: [] };
const fullAlphabet = { discovered: alphabet.map((entry) => entry.upper), attempted: 10, correct: 9, completed: ["discover", "find", "match"] };
const fullAnimal = { discovered: animals.map((animal) => animal.id), attempted: 8, correct: 8, completed: ["meet", "sound", "find"] };
const fullCount = { started: ["meet", "count", "match", "adventure"], completed: ["meet", "count", "match", "adventure"], met: [...numbers], attempted: 6, correct: 5, challenges: adventureChallenges.map((challenge) => challenge.id), missions: [], level: 2, recent: [] };
const fullShape = { started: ["meet", "match", "safari"], completed: ["meet", "match", "safari"], met: ["circle", "square", "triangle"], spotted: [], attempted: 8, correct: 7, tries: 9 };
const fullMemory = { started: ["little", "curious", "master"], completed: ["little", "curious", "master"], found: ["apple", "lion", "star", "ball", "fish", "frog", "flower", "gift"], games: 3, pairs: 9, attempts: 14 };
const fullPuzzle = { started: ["little", "explorer", "master"], completed: ["little", "explorer", "master"], solved: ["lion", "apple", "owl", "butterfly", "fish", "house", "garden"], games: 7, hints: 1 };
const fullColor = { started: ["meet", "find", "paint", "detective"], completed: ["meet", "find", "paint", "detective"], discovered: colors.map((color) => color.id), attempted: 4, correct: 3, colored: pictures.map((picture) => picture.id), missions: detectiveMissions.map((mission) => mission.id) };

test("a brand-new child shows every game as not started", () => {
  const result = report.buildParentReport({ alphabet: emptyAlphabet, animal: emptyAnimal, color: emptyColor, lastPlayed: {} });
  assert.equal(result.status, "not-started");
  assert.equal(result.percent, 0);
  assert.equal(result.gamesStarted, 0);
  assert.equal(result.accuracy, null);
  assert.equal(result.lastPlayed, null);
  for (const game of result.games) {
    assert.equal(game.status, "not-started", game.id);
    assert.match(game.nextStep, /^Start with /, game.id);
    assert.ok(game.activities.every((activity) => activity.status === "not-started"), game.id);
  }
  assert.equal(result.games[0].stillToMeet.items.length, alphabet.length);
});

test("finishing everything marks each game and the overview as completed", () => {
  const result = report.buildParentReport({ alphabet: fullAlphabet, animal: fullAnimal, color: fullColor, count: fullCount, shape: fullShape, memory: fullMemory, puzzle: fullPuzzle, lastPlayed: { "animal-safari": 2000, "color-quest": 5000 } });
  assert.equal(result.status, "completed");
  assert.equal(result.percent, 100);
  assert.equal(result.gamesCompleted, 7);
  assert.equal(result.activitiesDone, result.activitiesTotal);
  assert.equal(result.attempted, 36);
  assert.equal(result.correct, 32);
  assert.equal(result.lastPlayed, 5000);
  for (const game of result.games) {
    assert.equal(game.status, "completed", game.id);
    assert.equal(game.stillToMeet.items.length, 0, game.id);
    assert.match(game.nextStep, /complete/, game.id);
  }
  assert.equal(result.games[0].lastPlayed, null);
});

test("partial progress is in progress, with an honest percentage and next step", () => {
  const alphabetGame = report.alphabetReport({ discovered: ["A", "B", "C"], attempted: 0, correct: 0, completed: ["discover"] });
  assert.equal(alphabetGame.status, "in-progress");
  // Activities 1/3 and letters 3/26, averaged.
  assert.equal(alphabetGame.percent, Math.round((1 / 3 + 3 / alphabet.length) / 2 * 100));
  assert.deepEqual([...alphabetGame.activities.map((activity) => activity.status)], ["completed", "not-started", "not-started"]);
  assert.equal(alphabetGame.nextStep, "Try Find the Letter together.");
  assert.ok(!alphabetGame.stillToMeet.items.includes("A"));

  const colorGame = report.colorReport({ ...emptyColor, started: ["paint"] });
  assert.equal(colorGame.status, "in-progress", "opening an activity counts as starting the game");
  assert.equal(colorGame.activities[2].status, "in-progress");
  assert.equal(colorGame.nextStep, "Finish Color the World together.");
});

test("a low quiz score suggests practising together, and scores never exceed 100%", () => {
  const struggling = report.animalReport({ ...emptyAnimal, attempted: 10, correct: 3, completed: ["find"] });
  assert.equal(struggling.accuracy, 0.3);
  assert.match(struggling.nextStep, /together/);
  assert.equal(report.animalReport({ ...emptyAnimal, attempted: 2, correct: 5 }).accuracy, 1);
});

test("Guess That Sound only counts when enough sounds are available", () => {
  const labels = report.animalReport(emptyAnimal).activities.map((activity) => activity.label);
  assert.equal(labels.includes("Guess That Sound"), soundAnimals().length >= MIN_SOUND_ANIMALS);
});

test("last played reads as calendar days", () => {
  const now = new Date(2026, 9, 17, 9, 0).getTime();
  assert.equal(report.describeLastPlayed(null, now), "Not played yet");
  assert.equal(report.describeLastPlayed(new Date(2026, 9, 17, 0, 5).getTime(), now), "Today");
  assert.equal(report.describeLastPlayed(new Date(2026, 9, 16, 23, 50).getTime(), now), "Yesterday");
  assert.equal(report.describeLastPlayed(new Date(2026, 9, 13, 12, 0).getTime(), now), "4 days ago");
});

test("last-played times are validated and saved alongside progress", () => {
  const { parseLastPlayed } = load("src/lib/activity.ts");
  assert.deepEqual({ ...parseLastPlayed({ "color-quest": 123, "unknown-game": 5, "animal-safari": -1, "alphabet-adventure": "soon" }) }, { "color-quest": 123 });
  assert.deepEqual({ ...parseLastPlayed(null) }, {});

  const store = new Map();
  const browserWindow = { localStorage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) } };
  const { saveAlphabetProgress } = load("src/lib/alphabet-progress.ts", browserWindow);
  const { ACTIVITY_STORAGE_KEY, readLastPlayed } = load("src/lib/activity.ts", browserWindow);
  saveAlphabetProgress(emptyAlphabet);
  assert.ok(store.has(ACTIVITY_STORAGE_KEY));
  assert.ok(readLastPlayed()["alphabet-adventure"] > 0);
});
