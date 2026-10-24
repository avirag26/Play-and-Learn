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

function memoryWindow() {
  const storage = new Map();
  return { storage, window: { localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) } } };
}

test("five shapes with names and hints, and three to meet first", () => {
  const { shapes, meetShapeIds, meetSpeech, isShapeId, shapeColors, shapeColorNames } = load("src/lib/shape-data.ts");
  assert.deepEqual(Array.from(shapes, (shape) => shape.id), ["circle", "square", "triangle", "rectangle", "star"]);
  assert.deepEqual([...meetShapeIds], ["circle", "square", "triangle"]);
  assert.equal(meetSpeech("circle"), "Look! This is a circle. Can you say circle?");
  for (const shape of shapes) {
    assert.ok(shape.hint.length > 10, shape.id);
    assert.ok(shapeColors[shape.color], `${shape.id} has a color`);
  }
  assert.deepEqual(Object.keys(shapeColorNames).sort(), Object.keys(shapeColors).sort());
  assert.ok(isShapeId("star") && !isShapeId("oval") && !isShapeId(3));
});

test("every safari object stands for one shape, and every shape has objects", () => {
  const { shapes, safariObjects, isSafariObjectId } = load("src/lib/shape-data.ts");
  assert.equal(new Set(safariObjects.map((object) => object.id)).size, safariObjects.length, "ids are unique");
  for (const shape of shapes) assert.ok(safariObjects.filter((object) => object.shape === shape.id).length >= 2, `${shape.id} has at least two objects`);
  const expected = { ball: "circle", window: "square", pizza: "triangle", book: "rectangle", ornament: "star" };
  for (const [id, shape] of Object.entries(expected)) assert.equal(safariObjects.find((object) => object.id === id).shape, shape, id);
  assert.ok(isSafariObjectId("ball") && !isSafariObjectId("banana"));
  // The last object (starfish) is the drawing's fallback branch; every other one has its own.
  const art = fs.readFileSync(path.join(root, "src/features/shape-safari/shape-art.tsx"), "utf8");
  for (const object of safariObjects.slice(0, -1)) assert.match(art, new RegExp(`object === "${object.id}"`), `${object.id} has a drawing`);
});

test("Match the Shapes: varied rounds where only the same shape is right", () => {
  const { MATCH_SESSION_LENGTH, makeMatchSession, makeMatchChoices, isCorrectShape } = load("src/lib/shape-questions.ts");
  for (let seed = 1; seed <= 40; seed++) {
    const random = seeded(seed);
    const session = makeMatchSession(MATCH_SESSION_LENGTH, random);
    assert.equal(session.length, MATCH_SESSION_LENGTH);
    assert.equal(new Set(session.map((question) => question.id)).size, session.length, "stable, unique question ids");
    assert.equal(new Set(session.map((question) => question.target.shape)).size, 5, "every shape comes up");
    for (let index = 1; index < session.length; index++) assert.notEqual(session[index].target.shape, session[index - 1].target.shape, "never the same shape twice in a row");
    let previous = -1;
    for (const question of session) {
      assert.match(question.prompt, new RegExp(question.target.shape));
      const choices = makeMatchChoices(question, previous, random);
      assert.equal(choices.length, 3);
      assert.equal(new Set(choices.map((choice) => choice.id)).size, 3);
      const right = choices.filter((choice) => isCorrectShape(choice, question.target.shape));
      assert.equal(right.length, 1, "exactly one matching shape");
      assert.notEqual(right[0].color, question.target.color, "the match is another color, so it is the shape that matters");
      const position = choices.indexOf(right[0]);
      assert.notEqual(position, previous, "the answer moves");
      previous = position;
    }
  }
  const positions = new Set();
  for (let seed = 1; seed <= 30; seed++) { const random = seeded(seed); const [question] = makeMatchSession(8, random); positions.add(makeMatchChoices(question, -1, random).findIndex((choice) => choice.shape === question.target.shape)); }
  assert.equal(positions.size, 3, "the answer appears in every position");
});

test("Shape Safari: one object per shape plus one, with no look-alike answers", () => {
  const { SAFARI_SESSION_LENGTH, makeSafariSession, makeSafariChoices, isCorrectShape } = load("src/lib/shape-questions.ts");
  for (let seed = 1; seed <= 40; seed++) {
    const random = seeded(seed);
    const session = makeSafariSession(SAFARI_SESSION_LENGTH, random);
    assert.equal(session.length, SAFARI_SESSION_LENGTH);
    assert.equal(new Set(session.map((question) => question.object)).size, session.length, "no object twice");
    assert.equal(new Set(session.map((question) => question.shape)).size, 5, "every shape comes up");
    for (let index = 1; index < session.length; index++) assert.notEqual(session[index].shape, session[index - 1].shape);
    for (const question of session) {
      assert.match(question.prompt, /^What shape is the .+\?$/);
      const choices = makeSafariChoices(question, -1, random);
      assert.equal(choices.length, 3);
      assert.equal(choices.filter((choice) => isCorrectShape(choice, question.shape)).length, 1);
      const offered = choices.map((choice) => choice.shape);
      const lookAlike = { square: "rectangle", rectangle: "square" }[question.shape];
      if (lookAlike) assert.ok(!offered.includes(lookAlike), `${question.id}: a ${question.shape} is never asked with a ${lookAlike} to choose from`);
    }
  }
});

test("hints are gentle and name what was picked", () => {
  const { wrongShapeHint } = load("src/lib/shape-questions.ts");
  assert.equal(wrongShapeHint("square", "A triangle has 3 sides and 3 corners."), "That's a square. A triangle has 3 sides and 3 corners.");
});

test("progress: stars once per level, honest counts, safe storage", () => {
  const memory = memoryWindow();
  const { SHAPE_PROGRESS_KEY, emptyShapeProgress, readShapeProgress, saveShapeProgress, withItem, recordAnswer, starsEarned, nextLevel, parseShapeProgress } = load("src/lib/shape-progress.ts", memory.window);
  assert.equal(SHAPE_PROGRESS_KEY, "play-learn-shape-safari-v1");
  assert.deepEqual({ ...readShapeProgress() }, { ...emptyShapeProgress });
  assert.equal(nextLevel(emptyShapeProgress), "meet");

  let progress = withItem(emptyShapeProgress, "completed", "meet");
  assert.equal(withItem(progress, "completed", "meet"), progress, "replaying a level adds no second star");
  assert.equal(starsEarned(progress), 1);
  assert.equal(nextLevel(progress), "match");

  progress = recordAnswer(progress, true, false);
  progress = recordAnswer(progress, false, true);
  progress = recordAnswer(progress, true, true);
  assert.equal(progress.attempted, 2, "questions counted once");
  assert.equal(progress.correct, 1, "only first tries count as correct");
  assert.equal(progress.tries, 3, "every tap is a try");

  progress = withItem(withItem(progress, "completed", "match"), "completed", "safari");
  assert.equal(starsEarned(progress), 3);
  assert.equal(nextLevel(progress), "meet", "all done starts over");

  assert.equal(saveShapeProgress(progress), true);
  const reloaded = readShapeProgress();
  assert.equal(starsEarned(reloaded), 3, "progress survives a reload");
  assert.equal(reloaded.tries, 3);
  assert.ok(JSON.parse(memory.storage.get("play-learn-activity-v1"))["shape-safari"] > 0, "last played is noted");

  const cleaned = parseShapeProgress({ started: ["meet", "fly"], completed: ["safari", "safari", 7], met: ["circle", "oval"], spotted: ["ball", "banana"], attempted: 3, correct: 9, tries: 1 });
  assert.deepEqual([...cleaned.started], ["meet"]);
  assert.deepEqual([...cleaned.completed], ["safari"]);
  assert.deepEqual([...cleaned.met], ["circle"]);
  assert.deepEqual([...cleaned.spotted], ["ball"]);
  assert.equal(cleaned.correct, 3, "correct never exceeds attempted");
  assert.equal(cleaned.tries, 3, "tries are never fewer than attempted");

  memory.storage.set(SHAPE_PROGRESS_KEY, "{not json");
  assert.equal(readShapeProgress().attempted, 0, "corrupt data is ignored");
  cache.clear();
  const broken = load("src/lib/shape-progress.ts", { localStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } });
  assert.equal(broken.readShapeProgress().attempted, 0);
  assert.equal(broken.saveShapeProgress(broken.emptyShapeProgress), false, "a failed save is reported, not thrown");
  cache.clear();
  assert.equal(load("src/lib/shape-progress.ts").readShapeProgress().attempted, 0, "no window (server render) is safe");
});

test("Shape Safari is listed, routed, premium-ready, in the parent report, and never asks for device permissions", () => {
  cache.clear();
  const { games } = load("src/lib/games.ts");
  const listing = games.find((game) => game.id === "shape-safari");
  assert.ok(listing);
  assert.equal(games.indexOf(listing), 4, "it is game 5");
  assert.equal(listing.href, "/shape-safari");
  assert.equal(listing.modes.length, 3);
  assert.match(fs.readFileSync(path.join(root, "src/app/shape-safari/page.tsx"), "utf8"), /PremiumGate gameId="shape-safari"/);
  assert.match(fs.readFileSync(path.join(root, "src/components/layout/app-navigation.tsx"), "utf8"), /"\/shape-safari"/);
  const catalog = path.join(root, "../play-and-learn-backend/src/billing/game-catalog.ts");
  if (fs.existsSync(catalog)) assert.match(fs.readFileSync(catalog, "utf8"), /'shape-safari'/, "the admin can mark it as Premium");

  const { shapeReport } = load("src/lib/parent-report.ts");
  const { emptyShapeProgress } = load("src/lib/shape-progress.ts");
  const empty = shapeReport(emptyShapeProgress);
  assert.equal(empty.status, "not-started");
  assert.deepEqual([...empty.activities.map((activity) => activity.label)], ["Meet the Shapes", "Match the Shapes", "Shape Safari"]);
  assert.equal(empty.stillToMeet.items.length, 3);
  const done = shapeReport({ ...emptyShapeProgress, started: ["meet", "match", "safari"], completed: ["meet", "match", "safari"], met: ["circle", "square", "triangle"], attempted: 14, correct: 12, tries: 17 });
  assert.equal(done.status, "completed");
  assert.equal(done.percent, 100);
  assert.equal(done.accuracy, 12 / 14);

  const featureDir = path.join(root, "src/features/shape-safari");
  for (const file of fs.readdirSync(featureDir)) {
    const source = fs.readFileSync(path.join(featureDir, file), "utf8");
    assert.doesNotMatch(source, /getUserMedia|geolocation|navigator\.mediaDevices|new Audio\(|<input|<textarea/, `${file} uses no camera, microphone, location, recorded sounds, or typing`);
    assert.doesNotMatch(source, /href="https?:/, `${file} has no external links`);
  }
});
