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

test("numbers 1 to 10 with words, and stars as the main theme", () => {
  const { numbers, numberWords, countObjects, meetObjectFor, meetSpeech, countPhrase, isNumber } = load("src/lib/count-data.ts");
  assert.deepEqual([...numbers], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(numberWords[3], "three");
  assert.equal(numberWords[10], "ten");
  assert.deepEqual(Array.from(countObjects, (object) => object.id), ["star", "apple", "balloon", "flower", "toy"]);
  const meet = numbers.map((value) => meetObjectFor(value));
  assert.ok(meet.filter((id) => id === "star").length > numbers.length / 2, "mostly stars");
  assert.ok(new Set(meet).size >= 3, "with occasional other things");
  assert.equal(countPhrase(1, "star"), "one star");
  assert.equal(countPhrase(3, "apple"), "three apples");
  assert.equal(meetSpeech(3), "Three! Three apples.");
  assert.ok(isNumber(10) && !isNumber(0) && !isNumber(11) && !isNumber("3") && !isNumber(2.5));
});

test("at least 20 varied counting questions built from data", () => {
  const { countQuestions } = load("src/lib/count-questions.ts");
  assert.ok(countQuestions.length >= 20);
  assert.equal(new Set(countQuestions.map((question) => question.id)).size, countQuestions.length);
  assert.ok(new Set(countQuestions.map((question) => question.prompt)).size >= 10, "several different prompts");
  for (const question of countQuestions) {
    assert.ok(question.count >= 1 && question.count <= 10, question.id);
    assert.match(question.prompt, /how many|count/i, question.id);
  }
});

test("sessions stay in the level's numbers, never repeat a question, and never repeat a number back to back", () => {
  const { makeCountSession, countLevels, COUNT_SESSION_LENGTH } = load("src/lib/count-questions.ts");
  for (const level of [1, 2, 3]) {
    const orders = new Set();
    for (let seed = 1; seed <= 100; seed++) {
      const session = makeCountSession(level, COUNT_SESSION_LENGTH, seeded(seed));
      assert.equal(session.length, COUNT_SESSION_LENGTH);
      assert.equal(new Set(session.map((question) => question.id)).size, session.length, "no repeated question");
      for (const [position, question] of session.entries()) {
        assert.ok(question.count >= countLevels[level].min && question.count <= countLevels[level].max, `level ${level} range`);
        if (position > 0) assert.notEqual(question.count, session[position - 1].count, "no number twice in a row");
      }
      const perNumber = new Map();
      for (const question of session) perNumber.set(question.count, (perNumber.get(question.count) ?? 0) + 1);
      assert.ok(Math.max(...perNumber.values()) <= Math.ceil(COUNT_SESSION_LENGTH / (countLevels[level].max - countLevels[level].min + 1)), "numbers are spread evenly");
      orders.add(session.map((question) => question.id).join());
    }
    assert.ok(orders.size > 90, `level ${level} rounds are randomized`);
  }
  assert.ok(makeCountSession(1, 10, seeded(3)).every((question) => question.count <= 5), "starts with 1 to 5");
});

test("number choices have exactly one right answer, a fair spread, and move the answer around", () => {
  const { makeCountSession, makeNumberChoices, isCorrectCount, countLevels } = load("src/lib/count-questions.ts");
  const positions = new Set();
  for (const level of [1, 2, 3]) {
    for (let seed = 1; seed <= 100; seed++) {
      const random = seeded(seed);
      let previous = -1;
      for (const question of makeCountSession(level, 10, random)) {
        const choices = makeNumberChoices(question, level, previous, random);
        assert.equal(choices.length, countLevels[level].choices);
        assert.equal(new Set(choices).size, choices.length, "distinct choices");
        assert.equal(choices.filter((choice) => isCorrectCount(question, choice)).length, 1, "one right answer");
        assert.ok(choices.every((choice) => choice >= 1 && choice <= 10));
        const position = choices.indexOf(question.count);
        assert.notEqual(position, previous, "answer moves from the previous slot");
        positions.add(position);
        previous = position;
      }
    }
  }
  assert.equal(positions.size, 4, "answers appear in every position");
  const question = { id: "3-star", count: 3, object: "star", prompt: "" };
  assert.equal(isCorrectCount(question, 3), true);
  assert.equal(isCorrectCount(question, 4), false);
});

test("the quiz scores each question once, however many times it is tapped", () => {
  const { emptyCountProgress, recordAnswer } = load("src/lib/count-progress.ts");
  // Mirrors useQuizSession: a wrong first try, then the right one, counts one attempt and one correct.
  let progress = recordAnswer(emptyCountProgress, true, false);
  progress = recordAnswer(progress, false, true);
  assert.equal(progress.attempted, 1);
  assert.equal(progress.correct, 1);
  assert.deepEqual([...progress.recent], [false], "only the first try feeds difficulty");
  progress = recordAnswer(progress, true, true);
  assert.equal(progress.attempted, 2);
  assert.equal(progress.correct, 2);
  const source = fs.readFileSync(path.join(root, "src/features/games/use-quiz-session.ts"), "utf8");
  assert.match(source, /if \(locked\.current\) return null;/, "locked questions ignore extra taps");
});

test("match rounds pair distinct numbers with groups, and matching scores once per pair", () => {
  const { makeMatchRound, tryMatch, emptyMatchState, isRoundComplete, countLevels } = load("src/lib/count-questions.ts");
  for (const level of [1, 2, 3]) {
    for (let seed = 1; seed <= 50; seed++) {
      const round = makeMatchRound(level, seeded(seed));
      assert.equal(round.groups.length, countLevels[level].choices);
      assert.deepEqual([...round.numbers].sort((a, b) => a - b), Array.from(round.groups, (group) => group.count).sort((a, b) => a - b), "every number has a group");
      assert.equal(new Set(round.numbers).size, round.numbers.length);
      assert.ok(!round.numbers.every((value, position) => value === round.groups[position].count), "cards are not lined up with their groups");
      assert.ok(round.groups.every((group) => group.count >= countLevels[level].min && group.count <= countLevels[level].max));
    }
  }
  const round = { numbers: [2, 3, 1], groups: [{ id: "1-star", count: 1, object: "star" }, { id: "2-apple", count: 2, object: "apple" }, { id: "3-toy", count: 3, object: "toy" }] };
  let step = tryMatch(emptyMatchState, 3, round.groups[0]);
  assert.equal(step.correct, false);
  assert.equal(step.firstAttempt, true);
  step = tryMatch(step.state, 1, round.groups[0]);
  assert.equal(step.correct, true);
  assert.equal(step.firstAttempt, false, "a retry is not a new attempt");
  const repeat = tryMatch(step.state, 1, round.groups[0]);
  assert.equal(repeat.counted, false, "an already-matched pair is not scored again");
  assert.equal(repeat.state, step.state);
  assert.equal(tryMatch(step.state, 1, round.groups[1]).counted, false, "a matched number card can't be reused");
  let state = step.state;
  state = tryMatch(state, 2, round.groups[1]).state;
  assert.ok(!isRoundComplete(round, state));
  state = tryMatch(state, 3, round.groups[2]).state;
  assert.ok(isRoundComplete(round, state));
});

test("adventure challenges have clear goals, fair fields, and never over-count", () => {
  const { adventureChallenges, countingMissions, countingMissionSafety, isChallengeId, isCountingMissionId } = load("src/lib/count-data.ts");
  const { makeChallengeField, collectItem } = load("src/lib/count-questions.ts");
  assert.ok(adventureChallenges.length >= 4);
  for (const id of ["collect-5-stars", "find-3-apples", "teddy-2-toys", "bunny-7-flowers"]) assert.ok(isChallengeId(id), id);
  for (const challenge of adventureChallenges) {
    assert.ok(challenge.goal >= 1 && challenge.goal <= 10, challenge.id);
    assert.ok(challenge.prompt.includes(String(challenge.goal)), `${challenge.id} prompt shows its goal`);
    const field = makeChallengeField(challenge, seeded(7));
    const targets = field.filter((item) => item.object === challenge.object);
    assert.ok(targets.length > challenge.goal, `${challenge.id} has enough to collect`);
    assert.ok(field.some((item) => item.object !== challenge.object), `${challenge.id} has things to skip`);
    assert.equal(new Set(field.map((item) => item.id)).size, field.length);
    let collected = [];
    const decoy = field.find((item) => item.object !== challenge.object);
    assert.equal(collectItem(challenge, collected, decoy).result, "wrong-object");
    for (const item of targets) collected = collectItem(challenge, collected, item).collected;
    assert.equal(collected.length, challenge.goal, `${challenge.id} stops at its goal`);
    assert.equal(collectItem(challenge, collected, targets[0]).result, "already");
    assert.equal(collectItem(challenge, collected, targets.at(-1)).result, "full");
  }
  assert.ok(countingMissions.length >= 3);
  for (const mission of countingMissions) {
    assert.ok(isCountingMissionId(mission.id));
    assert.doesNotMatch(`${mission.instruction} ${mission.tip}`, /photo|camera|record|microphone|location|outside alone/i, mission.id);
  }
  assert.match(countingMissionSafety, /grown-up/);
});

test("difficulty starts at 1 to 5, grows after strong rounds, eases after hard ones, and waits for enough answers", () => {
  const { nextLevel, countLevels } = load("src/lib/count-questions.ts");
  const { emptyCountProgress, adaptLevel, chooseLevel, recordAnswer } = load("src/lib/count-progress.ts");
  assert.equal(emptyCountProgress.level, 1);
  assert.deepEqual([countLevels[1].min, countLevels[1].max], [1, 5]);
  assert.ok(countLevels[2].max === 10 && countLevels[3].min >= 5);
  assert.equal(nextLevel(1, [true, true, true]), 1, "too few answers to decide");
  assert.equal(nextLevel(1, Array(8).fill(true)), 2);
  assert.equal(nextLevel(2, Array(8).fill(true)), 3);
  assert.equal(nextLevel(3, Array(8).fill(true)), 3, "top level stays");
  assert.equal(nextLevel(2, [false, false, false, false, true, true]), 1);
  assert.equal(nextLevel(1, Array(8).fill(false)), 1, "bottom level stays");
  assert.equal(nextLevel(2, [true, false, true, true, false, true, true, false]), 2, "mixed results stay put");

  let progress = emptyCountProgress;
  for (let index = 0; index < 8; index++) progress = recordAnswer(progress, true, true);
  const up = adaptLevel(progress);
  assert.equal(up.change, "up");
  assert.equal(up.progress.level, 2);
  assert.equal(up.progress.recent.length, 0, "starts fresh at the new level");
  assert.equal(adaptLevel(up.progress).change, null);
  assert.equal(chooseLevel(up.progress, 3).level, 3);
  assert.equal(chooseLevel(up.progress, 2), up.progress, "choosing the same level changes nothing");
});

test("progress persists, is sanitized, survives broken storage, and leaves other games alone", () => {
  cache.clear();
  const memory = memoryWindow();
  memory.storage.set("play-learn-color-quest-v1", "{\"keep\":true}");
  const { COUNT_PROGRESS_KEY, emptyCountProgress, readCountProgress, saveCountProgress, withItem, withoutItem, recordAnswer, parseCountProgress } = load("src/lib/count-progress.ts", memory.window);
  assert.equal(COUNT_PROGRESS_KEY, "play-learn-count-stars-v1");
  assert.deepEqual({ ...readCountProgress() }, { ...emptyCountProgress });

  let progress = withItem(emptyCountProgress, "started", "count");
  progress = withItem(progress, "met", 3);
  progress = withItem(progress, "challenges", "collect-5-stars");
  progress = withItem(progress, "missions", "count-claps");
  progress = recordAnswer(progress, true, true);
  progress = withItem(progress, "completed", "count");
  assert.equal(withItem(progress, "met", 3), progress, "adding twice changes nothing");
  saveCountProgress(progress);
  const reloaded = readCountProgress();
  assert.deepEqual([...reloaded.met], [3]);
  assert.deepEqual([...reloaded.completed], ["count"]);
  assert.deepEqual([...reloaded.challenges], ["collect-5-stars"]);
  assert.deepEqual([...reloaded.missions], ["count-claps"]);
  assert.equal(reloaded.attempted, 1);
  assert.equal(reloaded.correct, 1);
  assert.equal(withoutItem(reloaded, "missions", "count-claps").missions.length, 0);
  assert.equal(memory.storage.get("play-learn-color-quest-v1"), "{\"keep\":true}", "other games untouched");
  assert.ok(JSON.parse(memory.storage.get("play-learn-activity-v1"))["count-the-stars"] > 0, "last played is noted");

  const messy = parseCountProgress({ started: ["count", "fly", "count"], met: [11, 2, "3", 2, 0], attempted: 3, correct: 9, challenges: ["nope", "find-3-apples"], missions: [1], level: 7, recent: [true, "yes", false] });
  assert.deepEqual([...messy.started], ["count"]);
  assert.deepEqual([...messy.met], [2]);
  assert.equal(messy.correct, 3, "correct never exceeds attempted");
  assert.deepEqual([...messy.challenges], ["find-3-apples"]);
  assert.deepEqual([...messy.missions], []);
  assert.equal(messy.level, 1);
  assert.deepEqual([...messy.recent], [true, false]);
  assert.deepEqual({ ...parseCountProgress("nonsense") }, { ...emptyCountProgress });

  memory.storage.set(COUNT_PROGRESS_KEY, "{not json");
  assert.equal(readCountProgress().attempted, 0, "corrupt data is ignored");
  cache.clear();
  const broken = load("src/lib/count-progress.ts", { localStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } });
  assert.equal(broken.readCountProgress().attempted, 0);
  assert.doesNotThrow(() => broken.saveCountProgress(broken.emptyCountProgress));
  cache.clear();
  assert.equal(load("src/lib/count-progress.ts").readCountProgress().attempted, 0, "no window (server render) is safe");
});

test("Count the Stars is listed, routed, in the parent report, and never asks for device permissions", () => {
  cache.clear();
  const { games } = load("src/lib/games.ts");
  const listing = games.find((game) => game.id === "count-the-stars");
  assert.ok(listing);
  assert.equal(listing.href, "/count-the-stars");
  assert.equal(listing.modes.length, 4);
  assert.ok(fs.existsSync(path.join(root, "src/app/count-the-stars/page.tsx")));
  assert.match(fs.readFileSync(path.join(root, "src/components/layout/app-navigation.tsx"), "utf8"), /"\/count-the-stars"/);
  const { countReport } = load("src/lib/parent-report.ts");
  const { emptyCountProgress } = load("src/lib/count-progress.ts");
  const empty = countReport(emptyCountProgress);
  assert.equal(empty.status, "not-started");
  assert.equal(empty.activities.length, 4);
  assert.equal(empty.stillToMeet.items.length, 10);
  const featureDir = path.join(root, "src/features/count-the-stars");
  for (const file of fs.readdirSync(featureDir)) {
    assert.doesNotMatch(fs.readFileSync(path.join(featureDir, file), "utf8"), /getUserMedia|geolocation|navigator\.mediaDevices|new Audio\(/, `${file} uses no camera, microphone, location, or recorded sounds`);
  }
});
