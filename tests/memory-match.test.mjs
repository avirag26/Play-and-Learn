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

const game = load("src/lib/memory-game.ts");
const { memoryReducer, dealCards, emptyMemoryState, memoryLevels, memoryLevelConfig, totalPairs } = game;

/** A dealt game with its preview already hidden, ready for taps. */
function playing(level, random = seeded(7), round = 1) {
  const dealt = memoryReducer(emptyMemoryState(), { type: "deal", level, round, cards: dealCards(level, random) });
  return memoryReducer(dealt, { type: "hide", round });
}

/** The two card ids of each picture on the table. */
function pairsOf(state) {
  const groups = new Map();
  for (const card of state.cards) groups.set(card.picture, [...(groups.get(card.picture) ?? []), card.id]);
  return [...groups.values()];
}

test("eight distinct pictures with names, plurals and alt text", () => {
  const { memoryPictures, isMemoryPictureId, matchSpeech, pictureSpeech } = load("src/lib/memory-data.ts");
  assert.equal(new Set(memoryPictures.map((picture) => picture.id)).size, memoryPictures.length);
  assert.equal(memoryPictures.length, 8);
  for (const picture of memoryPictures) {
    assert.ok(picture.alt.length > 5, picture.id);
    assert.ok(picture.many.length > 0, picture.id);
  }
  assert.equal(matchSpeech("apple"), "Two apples!");
  assert.equal(matchSpeech("fish"), "Two fish!", "irregular plurals read naturally");
  assert.equal(pictureSpeech("lion"), "Lion!");
  assert.ok(isMemoryPictureId("star") && !isMemoryPictureId("dragon") && !isMemoryPictureId(4));
  // Pictures without an emoji must be drawn by the art component.
  const art = fs.readFileSync(path.join(root, "src/features/memory-match/memory-art.tsx"), "utf8");
  for (const picture of memoryPictures.filter((item) => !item.emoji)) assert.match(art, new RegExp(`picture === "${picture.id}"`), `${picture.id} has a drawing`);
});

test("three levels: 2, 3 and 4 pairs, with the planned pictures", () => {
  assert.deepEqual([...memoryLevels], ["little", "curious", "master"]);
  const expected = { little: 4, curious: 6, master: 8 };
  for (let seed = 1; seed <= 60; seed++) {
    for (const level of memoryLevels) {
      const cards = dealCards(level, seeded(seed));
      assert.equal(cards.length, expected[level], `${level} deals ${expected[level]} cards`);
      assert.equal(new Set(cards.map((card) => card.id)).size, cards.length, "every card has its own id");
      const counts = new Map();
      for (const card of cards) counts.set(card.picture, (counts.get(card.picture) ?? 0) + 1);
      assert.ok([...counts.values()].every((count) => count === 2), "every picture appears exactly twice");
      assert.equal(counts.size, memoryLevelConfig[level].pairs);
      assert.ok(cards.every((card) => !card.faceUp && !card.matched));
    }
  }
  assert.deepEqual([...new Set(dealCards("little", seeded(1)).map((card) => card.picture))].sort(), ["apple", "lion"]);
  assert.deepEqual([...new Set(dealCards("curious", seeded(1)).map((card) => card.picture))].sort(), ["apple", "lion", "star"]);
  const masterSets = new Set(Array.from({ length: 20 }, (_, seed) => [...new Set(dealCards("master", seeded(seed + 1)).map((card) => card.picture))].sort().join()));
  assert.ok(masterSets.size > 5, "Memory Master mixes up its pictures");
  for (const level of memoryLevels) assert.ok(!/time|lives|penalt/i.test(JSON.stringify(memoryLevelConfig[level])), "no timers, lives, or penalties");
});

test("shuffling: positions vary, a replay changes the layout, and Memory Master spreads pairs out", () => {
  const firstPositions = new Set();
  for (let seed = 1; seed <= 40; seed++) {
    const random = seeded(seed);
    const cards = dealCards("curious", random);
    firstPositions.add(cards.findIndex((card) => card.picture === "star"));
    const replay = dealCards("curious", random, cards);
    assert.notDeepEqual(replay.map((card) => card.picture), cards.map((card) => card.picture), "Play again never repeats the last layout");
    const little = dealCards("little", random);
    assert.notDeepEqual(dealCards("little", random, little).map((card) => card.picture), little.map((card) => card.picture), "even with only 4 cards");
    const master = dealCards("master", random);
    for (let index = 1; index < master.length; index++) assert.notEqual(master[index].picture, master[index - 1].picture, "no pair side by side");
  }
  assert.ok(firstPositions.size >= 4, "a picture can land anywhere");
});

test("the preview shows every card, then hides them; taps wait until then", () => {
  const cards = dealCards("little", seeded(3));
  const dealt = memoryReducer(emptyMemoryState(), { type: "deal", level: "little", round: 1, cards });
  assert.equal(dealt.status, "preview");
  assert.ok(dealt.cards.every((card) => card.faceUp), "all pictures are shown first");
  assert.equal(memoryReducer(dealt, { type: "flip", id: cards[0].id }), dealt, "taps during the preview are ignored");
  assert.equal(memoryReducer(dealt, { type: "hide", round: 2 }), dealt, "a timer from another round does nothing");
  const ready = memoryReducer(dealt, { type: "hide", round: 1 });
  assert.equal(ready.status, "playing");
  assert.ok(ready.cards.every((card) => !card.faceUp));
  assert.equal(memoryReducer(ready, { type: "hide", round: 1 }), ready, "hiding twice changes nothing");
});

test("a match stays face up, a miss turns back over, and attempts count pairs of taps", () => {
  let state = playing("curious");
  const [[a1, a2], [b1]] = pairsOf(state);

  state = memoryReducer(state, { type: "flip", id: a1 });
  assert.equal(state.first, a1);
  assert.equal(state.attempts, 0, "one card is not an attempt yet");
  assert.equal(memoryReducer(state, { type: "flip", id: a1 }), state, "the same card can't be its own pair");

  state = memoryReducer(state, { type: "flip", id: b1 });
  assert.equal(state.status, "checking");
  assert.equal(state.attempts, 1);
  assert.deepEqual({ ...state.lastResult }, { kind: "miss" });
  assert.equal(memoryReducer(state, { type: "flip", id: a2 }), state, "no third card while two are showing");
  assert.equal(memoryReducer(state, { type: "resolve", round: 99 }), state, "a stale timer is ignored");
  state = memoryReducer(state, { type: "resolve", round: 1 });
  assert.equal(state.status, "playing");
  assert.equal(state.first, null);
  assert.equal(state.second, null);
  assert.ok(state.cards.every((card) => !card.faceUp), "both cards turned back over");
  assert.equal(memoryReducer(state, { type: "resolve", round: 1 }), state, "resolving twice changes nothing");

  state = memoryReducer(memoryReducer(state, { type: "flip", id: a1 }), { type: "flip", id: a2 });
  assert.equal(state.attempts, 2);
  assert.equal(state.pairsFound, 1);
  assert.equal(state.status, "playing");
  assert.deepEqual({ ...state.lastResult }, { kind: "match", picture: state.cards.find((card) => card.id === a1).picture });
  for (const id of [a1, a2]) {
    const card = state.cards.find((item) => item.id === id);
    assert.ok(card.faceUp && card.matched, "a found pair stays face up");
    assert.equal(memoryReducer(state, { type: "flip", id }), state, "a matched card can't be turned again");
  }
  assert.equal(memoryReducer(state, { type: "flip", id: "not-a-card" }), state);
});

test("pairs are compared by picture across two different cards, never by id", () => {
  // Hand-made cards whose ids look alike; only the picture decides a match.
  const cards = [
    { id: "x-1", picture: "apple", faceUp: false, matched: false },
    { id: "x-2", picture: "lion", faceUp: false, matched: false },
    { id: "y-1", picture: "lion", faceUp: false, matched: false },
    { id: "y-2", picture: "apple", faceUp: false, matched: false },
  ];
  let state = memoryReducer(memoryReducer(emptyMemoryState(), { type: "deal", level: "little", round: 1, cards }), { type: "hide", round: 1 });
  state = memoryReducer(memoryReducer(state, { type: "flip", id: "x-1" }), { type: "flip", id: "y-1" });
  assert.equal(state.pairsFound, 0, "apple and lion are not a pair");
  state = memoryReducer(state, { type: "resolve", round: 1 });
  state = memoryReducer(memoryReducer(state, { type: "flip", id: "x-1" }), { type: "flip", id: "y-2" });
  assert.equal(state.pairsFound, 1);
});

test("every level can be finished, completes exactly once, and then ignores taps", () => {
  for (const level of memoryLevels) {
    for (let seed = 1; seed <= 10; seed++) {
      let state = playing(level, seeded(seed));
      const pairs = pairsOf(state);
      let completions = 0;
      // A miss first (when possible), then every pair.
      if (pairs.length > 1) state = memoryReducer(memoryReducer(memoryReducer(state, { type: "flip", id: pairs[0][0] }), { type: "flip", id: pairs[1][0] }), { type: "resolve", round: 1 });
      for (const [first, second] of pairs) {
        const before = state.status;
        state = memoryReducer(memoryReducer(state, { type: "flip", id: first }), { type: "flip", id: second });
        if (before !== "complete" && state.status === "complete") completions++;
      }
      assert.equal(state.status, "complete", level);
      assert.equal(completions, 1, "the finish happens once");
      assert.equal(state.pairsFound, totalPairs(state));
      assert.equal(state.attempts, pairs.length + (pairs.length > 1 ? 1 : 0));
      assert.ok(state.cards.every((card) => card.matched && card.faceUp));
      for (const card of state.cards) assert.equal(memoryReducer(state, { type: "flip", id: card.id }), state);
    }
  }
});

test("a burst of rapid taps never shows more than two unmatched cards", () => {
  for (let seed = 1; seed <= 30; seed++) {
    const random = seeded(seed);
    let state = playing("master", random);
    for (let tap = 0; tap < 400 && state.status !== "complete"; tap++) {
      const card = state.cards[Math.floor(random() * state.cards.length)];
      state = memoryReducer(state, { type: "flip", id: card.id });
      // Sometimes the turn-back timer fires between taps.
      if (state.status === "checking" && random() < 0.3) state = memoryReducer(state, { type: "resolve", round: 1 });
      const showing = state.cards.filter((item) => item.faceUp && !item.matched).length;
      assert.ok(showing <= 2, "at most two unmatched cards face up");
      assert.equal(state.cards.filter((item) => item.matched).length, state.pairsFound * 2);
      if (state.status === "checking") assert.equal(showing, 2);
    }
  }
});

test("a new deal starts clean, so restarting mid-game is safe", () => {
  let state = playing("curious");
  const [[a1], [b1]] = pairsOf(state);
  state = memoryReducer(memoryReducer(state, { type: "flip", id: a1 }), { type: "flip", id: b1 });
  const restarted = memoryReducer(state, { type: "deal", level: "curious", round: 2, cards: dealCards("curious", seeded(5), state.cards) });
  assert.equal(restarted.status, "preview");
  assert.equal(restarted.attempts, 0);
  assert.equal(restarted.pairsFound, 0);
  assert.equal(restarted.first, null);
  assert.equal(restarted.second, null);
  assert.equal(memoryReducer(restarted, { type: "resolve", round: 1 }), restarted, "the old game's timer can't touch the new one");
});

test("progress: one star per level, totals add up, and storage is safe", () => {
  const memory = memoryWindow();
  const { MEMORY_PROGRESS_KEY, emptyMemoryProgress, readMemoryProgress, saveMemoryProgress, withItem, recordGame, starsEarned, nextLevel, parseMemoryProgress } = load("src/lib/memory-progress.ts", memory.window);
  assert.equal(MEMORY_PROGRESS_KEY, "play-learn-memory-match-v1");
  assert.deepEqual({ ...readMemoryProgress() }, { ...emptyMemoryProgress });
  assert.equal(nextLevel(emptyMemoryProgress), "little");

  let progress = withItem(emptyMemoryProgress, "started", "little");
  progress = recordGame(progress, { level: "little", pictures: ["apple", "lion"], pairs: 2, attempts: 3 });
  assert.equal(starsEarned(progress), 1);
  progress = recordGame(progress, { level: "little", pictures: ["apple", "lion"], pairs: 2, attempts: 2 });
  assert.equal(starsEarned(progress), 1, "replaying a level adds no second star");
  assert.deepEqual([...progress.completed], ["little"]);
  assert.deepEqual([...progress.found], ["apple", "lion"], "pictures are listed once");
  assert.equal(progress.games, 2);
  assert.equal(progress.pairs, 4);
  assert.equal(progress.attempts, 5);
  assert.equal(nextLevel(progress), "curious");

  progress = recordGame(recordGame(progress, { level: "curious", pictures: ["apple", "lion", "star"], pairs: 3, attempts: 6 }), { level: "master", pictures: ["ball", "fish", "frog", "gift"], pairs: 4, attempts: 9 });
  assert.equal(starsEarned(progress), 3);
  assert.equal(nextLevel(progress), "little", "all done starts over");

  assert.equal(saveMemoryProgress(progress), true);
  const reloaded = readMemoryProgress();
  assert.equal(starsEarned(reloaded), 3, "progress survives a reload");
  assert.equal(reloaded.attempts, 20);
  assert.ok(JSON.parse(memory.storage.get("play-learn-activity-v1"))["memory-match"] > 0, "last played is noted");

  const cleaned = parseMemoryProgress({ started: ["little", "giant"], completed: ["master", "master", 3], found: ["apple", "dragon"], games: -1, pairs: 6, attempts: 2 });
  assert.deepEqual([...cleaned.started], ["little"]);
  assert.deepEqual([...cleaned.completed], ["master"]);
  assert.deepEqual([...cleaned.found], ["apple"]);
  assert.equal(cleaned.games, 0);
  assert.equal(cleaned.attempts, 6, "attempts are never fewer than pairs");

  memory.storage.set(MEMORY_PROGRESS_KEY, "{not json");
  assert.equal(readMemoryProgress().games, 0, "corrupt data is ignored");
  cache.clear();
  const broken = load("src/lib/memory-progress.ts", { localStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } });
  assert.equal(broken.readMemoryProgress().games, 0);
  assert.equal(broken.saveMemoryProgress(broken.emptyMemoryProgress), false, "a failed save is reported, not thrown");
  cache.clear();
  assert.equal(load("src/lib/memory-progress.ts").readMemoryProgress().games, 0, "no window (server render) is safe");
});

test("Memory Match is listed, routed, premium-ready, in the parent report, and asks for nothing personal", () => {
  cache.clear();
  const { games } = load("src/lib/games.ts");
  const listing = games.find((item) => item.id === "memory-match");
  assert.ok(listing);
  assert.equal(games.indexOf(listing), 5, "it is game 6");
  assert.equal(listing.href, "/memory-match");
  assert.equal(listing.modes.length, 3);
  assert.match(fs.readFileSync(path.join(root, "src/app/memory-match/page.tsx"), "utf8"), /PremiumGate gameId="memory-match"/);
  assert.match(fs.readFileSync(path.join(root, "src/components/layout/app-navigation.tsx"), "utf8"), /"\/memory-match"/);
  const catalog = path.join(root, "../play-and-learn-backend/src/billing/game-catalog.ts");
  if (fs.existsSync(catalog)) assert.match(fs.readFileSync(catalog, "utf8"), /'memory-match'/, "the admin can mark it as Premium");
  const grownUps = fs.readFileSync(path.join(root, "src/app/grown-ups/page.tsx"), "utf8");
  assert.match(grownUps, /removeItem\(MEMORY_PROGRESS_KEY\)/, "Reset progress clears it too");

  const { memoryReport } = load("src/lib/parent-report.ts");
  const { emptyMemoryProgress } = load("src/lib/memory-progress.ts");
  const empty = memoryReport(emptyMemoryProgress);
  assert.equal(empty.status, "not-started");
  assert.deepEqual([...empty.activities.map((activity) => activity.label)], ["Little Explorer", "Curious Explorer", "Memory Master"]);
  assert.equal(empty.stillToMeet.items.length, 8);
  assert.equal(empty.summary.text, "No games finished yet");
  const done = memoryReport({ started: ["little", "curious", "master"], completed: ["little", "curious", "master"], found: ["apple", "lion", "star", "ball", "fish", "frog", "flower", "gift"], games: 5, pairs: 15, attempts: 24 });
  assert.equal(done.status, "completed");
  assert.equal(done.percent, 100);
  assert.equal(done.attempted, 0, "misses are part of playing, so they never count as wrong quiz answers");
  assert.equal(done.accuracy, null);
  assert.match(done.summary.text, /5 finished, with 15 pairs found in 24 tries/);

  const featureDir = path.join(root, "src/features/memory-match");
  for (const file of fs.readdirSync(featureDir)) {
    const source = fs.readFileSync(path.join(featureDir, file), "utf8");
    assert.doesNotMatch(source, /getUserMedia|geolocation|navigator\.mediaDevices|new Audio\(|<input|<textarea|<img/, `${file} uses no camera, microphone, location, typing, or remote images`);
    assert.doesNotMatch(source, /https?:\/\//, `${file} has no external links or images`);
  }
  const { memoryLines, matchCheers } = load("src/lib/memory-data.ts");
  for (const line of [...Object.values(memoryLines), ...matchCheers]) assert.doesNotMatch(line, /(wrong|no|oops|bad|fail|lose|hurry)/i, `"${line}" is always kind`);
});
