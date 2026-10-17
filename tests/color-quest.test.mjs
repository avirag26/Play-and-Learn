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

function seeded(seed) {
  let value = seed;
  return () => { value = (value * 1103515245 + 12345) % 2147483648; return value / 2147483648; };
}

test("ten complete colors with distinct values", () => {
  const { colors, isColorId } = load("src/lib/color-data.ts");
  assert.deepEqual(Array.from(colors, (color) => color.id), ["red", "blue", "yellow", "green", "orange", "purple", "pink", "brown", "black", "white"]);
  assert.equal(new Set(colors.map((color) => color.hex.toLowerCase())).size, 10);
  for (const color of colors) {
    assert.match(color.hex, /^#[0-9a-f]{6}$/i, color.id);
    assert.ok(color.name && color.sentence && color.objects.length >= 2, color.id);
    assert.ok(color.sentence.toLowerCase().includes(color.id), `${color.id} sentence names the color`);
  }
  assert.equal(isColorId("red"), true);
  assert.equal(isColorId("teal"), false);
  assert.equal(isColorId(3), false);
});

test("look-alike colors are symmetric", () => {
  const { colors, looksAlike } = load("src/lib/color-data.ts");
  for (const a of colors) for (const b of colors) assert.equal(looksAlike(a.id, b.id), looksAlike(b.id, a.id), `${a.id}/${b.id}`);
  assert.ok(looksAlike("red", "pink"));
  assert.ok(looksAlike("blue", "purple"));
  assert.ok(!looksAlike("red", "blue"));
});

test("at least ten question variations, all naming a real color", () => {
  const { colorQuestions } = load("src/lib/color-questions.ts");
  const { isColorId } = load("src/lib/color-data.ts");
  assert.ok(colorQuestions.length >= 10);
  assert.equal(new Set(colorQuestions.map((question) => question.id)).size, colorQuestions.length);
  assert.equal(new Set(colorQuestions.map((question) => question.prompt)).size, colorQuestions.length);
  for (const question of colorQuestions) {
    assert.ok(isColorId(question.color), question.id);
    assert.ok(question.prompt.includes(question.color), `${question.id} prompt says its color`);
  }
});

test("find sessions are randomized, never repeat a color, and choices have exactly one fair answer", () => {
  const { makeColorSession, makeColorChoices, isCorrectChoice, COLOR_SESSION_LENGTH } = load("src/lib/color-questions.ts");
  const { looksAlike } = load("src/lib/color-data.ts");
  const orders = new Set();
  for (let seed = 1; seed <= 200; seed++) {
    const random = seeded(seed);
    const session = makeColorSession(COLOR_SESSION_LENGTH, random);
    assert.equal(session.length, 10);
    assert.equal(new Set(session.map((question) => question.color)).size, 10, "no repeated color");
    orders.add(session.map((question) => question.color).join());
    let previous = -1;
    for (const question of session) {
      const choices = makeColorChoices(question, previous, random);
      assert.equal(choices.length, 3);
      assert.equal(new Set(choices.map((choice) => choice.id)).size, 3);
      assert.equal(new Set(choices.map((choice) => choice.shape)).size, 3, "each choice is a different object");
      assert.equal(choices.filter((choice) => isCorrectChoice(question, choice)).length, 1, "exactly one right answer");
      for (const choice of choices) if (choice.color !== question.color) assert.ok(!looksAlike(choice.color, question.color), `${choice.color} is too close to ${question.color}`);
      const position = choices.findIndex((choice) => isCorrectChoice(question, choice));
      assert.notEqual(position, previous, "answer moves between questions");
      previous = position;
    }
  }
  assert.ok(orders.size > 150, "question order varies");
  const four = makeColorChoices({ id: "x", color: "green", prompt: "Find something green!" }, -1, seeded(9), 4);
  assert.equal(four.length, 4);
});

test("the quiz never double-scores repeated taps", () => {
  const { emptyColorProgress, recordAnswer } = load("src/lib/color-progress.ts");
  // Mirrors useQuizSession: the first try counts as attempted, and a correct answer locks the question.
  let progress = emptyColorProgress;
  let locked = false;
  const attempted = new Set();
  const tap = (index, correct) => {
    if (locked) return;
    const firstAttempt = !attempted.has(index);
    attempted.add(index);
    progress = recordAnswer(progress, firstAttempt, correct);
    if (correct) locked = true;
  };
  tap(0, false); tap(0, false); tap(0, true); tap(0, true); tap(0, true);
  assert.equal(progress.attempted, 1);
  assert.equal(progress.correct, 1);
});

test("color progress persists, is sanitized, and leaves other games alone", () => {
  cache.clear();
  const storage = new Map([["play-learn-animal-safari-v1", JSON.stringify({ discovered: ["lion"] })]]);
  const browserWindow = { localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } };
  const { readColorProgress, saveColorProgress, parseColorProgress, withItem, COLOR_PROGRESS_KEY, emptyColorProgress } = load("src/lib/color-progress.ts", browserWindow);
  assert.equal(readColorProgress().discovered.length, 0);
  let progress = withItem(emptyColorProgress, "started", "find");
  assert.equal(withItem(progress, "started", "find"), progress, "adding twice changes nothing");
  progress = withItem(withItem(withItem(progress, "discovered", "red"), "colored", "flower"), "missions", "three-red");
  saveColorProgress({ ...progress, attempted: 4, correct: 3, completed: ["find"] });
  const saved = readColorProgress();
  assert.deepEqual(Array.from(saved.started), ["find"]);
  assert.deepEqual(Array.from(saved.completed), ["find"]);
  assert.deepEqual(Array.from(saved.discovered), ["red"]);
  assert.deepEqual(Array.from(saved.colored), ["flower"]);
  assert.deepEqual(Array.from(saved.missions), ["three-red"]);
  assert.equal(saved.correct, 3);
  assert.equal(storage.get("play-learn-animal-safari-v1"), JSON.stringify({ discovered: ["lion"] }), "animal progress untouched");
  const cleaned = parseColorProgress({ started: ["meet", "fly", "meet"], discovered: ["red", "teal", 7], attempted: 2, correct: 9, colored: ["flower", "castle"], missions: ["three-red", "go-outside-alone"] });
  assert.deepEqual(Array.from(cleaned.started), ["meet"]);
  assert.deepEqual(Array.from(cleaned.discovered), ["red"]);
  assert.equal(cleaned.correct, 2, "correct never exceeds attempted");
  assert.deepEqual(Array.from(cleaned.colored), ["flower"]);
  assert.deepEqual(Array.from(cleaned.missions), ["three-red"]);
  storage.set(COLOR_PROGRESS_KEY, "{not json");
  assert.equal(readColorProgress().discovered.length, 0, "corrupt storage falls back to empty progress");
  const throwing = load("src/lib/color-progress.ts", undefined);
  assert.equal(throwing.readColorProgress().attempted, 0, "no window (server render) is safe");
  cache.clear();
  const broken = load("src/lib/color-progress.ts", { localStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } });
  assert.equal(broken.readColorProgress().attempted, 0);
  assert.doesNotThrow(() => broken.saveColorProgress(broken.emptyColorProgress));
});

test("five coloring pictures with unique, well-formed regions", () => {
  const { pictures } = load("src/lib/coloring-pictures.ts");
  assert.ok(pictures.length >= 5);
  for (const id of ["flower", "house", "balloons", "butterfly", "rainbow"]) assert.ok(pictures.some((picture) => picture.id === id), id);
  for (const picture of pictures) {
    assert.ok(picture.regions.length >= 4, picture.id);
    assert.equal(new Set(picture.regions.map((region) => region.id)).size, picture.regions.length, `${picture.id} region ids are unique`);
    for (const region of picture.regions) {
      assert.match(region.d, /^M[-\d.]/, `${picture.id}/${region.id} path`);
      assert.doesNotMatch(region.d, /NaN|undefined/, `${picture.id}/${region.id} path`);
      assert.ok(region.label, `${picture.id}/${region.id} label`);
    }
  }
});

test("coloring fills, undoes, and resets correctly", () => {
  const { pictures } = load("src/lib/coloring-pictures.ts");
  const { emptyColoring, fillRegion, undoColoring, resetColoring, isPictureComplete, coloredCount, MAX_UNDO } = load("src/lib/coloring.ts");
  const flower = pictures.find((picture) => picture.id === "flower");
  let state = fillRegion(emptyColoring, flower, "middle", "yellow");
  assert.equal(state.fills.middle, "yellow");
  assert.equal(state.history.length, 1);
  assert.equal(fillRegion(state, flower, "middle", "yellow"), state, "same color again is not a new undo step");
  assert.equal(fillRegion(state, flower, "chimney", "red"), state, "regions from another picture are ignored");
  state = fillRegion(state, flower, "middle", "orange");
  assert.equal(state.fills.middle, "orange");
  state = undoColoring(state);
  assert.equal(state.fills.middle, "yellow");
  state = undoColoring(state);
  assert.equal(state.fills.middle, undefined);
  assert.equal(undoColoring(state), state, "nothing to undo");
  assert.equal(resetColoring(state), state, "nothing to reset");

  for (const region of flower.regions) state = fillRegion(state, flower, region.id, "pink");
  assert.ok(isPictureComplete(flower, state.fills));
  assert.equal(coloredCount(flower, state.fills), flower.regions.length);
  const reset = resetColoring(state);
  assert.equal(Object.keys(reset.fills).length, 0);
  assert.ok(!isPictureComplete(flower, reset.fills));
  assert.ok(isPictureComplete(flower, undoColoring(reset).fills), "undo brings colors back after a reset");

  let long = emptyColoring;
  for (let step = 0; step < MAX_UNDO + 20; step++) long = fillRegion(long, flower, "middle", step % 2 ? "red" : "blue");
  assert.equal(long.history.length, MAX_UNDO, "undo history is capped");
});

test("detective missions are unique, need a grown-up, and never ask for camera or recordings", () => {
  const { detectiveMissions, detectiveSafety, isColorId, isDetectiveMissionId } = load("src/lib/color-data.ts");
  assert.ok(detectiveMissions.length >= 5);
  assert.equal(new Set(detectiveMissions.map((mission) => mission.id)).size, detectiveMissions.length);
  for (const mission of detectiveMissions) {
    assert.ok(mission.colors.length >= 1 && mission.colors.every(isColorId), mission.id);
    assert.ok(mission.tip, mission.id);
    assert.ok(mission.short && mission.short.length <= 40, `${mission.id} has short words a child can read`);
    assert.ok(Number.isInteger(mission.count) && mission.count >= 1 && mission.count <= 3, `${mission.id} count`);
    assert.ok(mission.colors.length === 1 || mission.colors.length === mission.count, `${mission.id}: one circle per color`);
    assert.ok(mission.examples.length >= 2, `${mission.id} picture hints`);
    assert.doesNotMatch(`${mission.instruction} ${mission.tip}`, /photo|camera|picture of|record|microphone|location|outside alone/i, mission.id);
    assert.ok(isDetectiveMissionId(mission.id));
  }
  assert.ok(detectiveMissions.some((mission) => /three red/i.test(mission.instruction)));
  assert.ok(detectiveMissions.some((mission) => /yellow in your room/i.test(mission.instruction)));
  assert.match(detectiveSafety, /grown-up/);
});

test("Color Quest is listed as a game and its route exists", () => {
  cache.clear();
  const { games } = load("src/lib/games.ts");
  const listing = games.find((game) => game.id === "color-quest");
  assert.ok(listing);
  assert.equal(listing.href, "/color-quest");
  assert.equal(listing.modes.length, 4);
  assert.ok(fs.existsSync(path.join(root, "src/app/color-quest/page.tsx")));
  assert.match(fs.readFileSync(path.join(root, "src/components/layout/app-navigation.tsx"), "utf8"), /"\/color-quest"/);
});
