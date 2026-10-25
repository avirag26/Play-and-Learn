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
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loadedModule = { exports: {} };
  cache.set(key, loadedModule.exports);
  const localRequire = (specifier) => specifier.startsWith("@/") ? load(`src/${specifier.slice(2)}.ts`, browserWindow) : requireFromHere(specifier);
  vm.runInNewContext("(function(require,module,exports,window){" + code + "\n})", { console })(localRequire, loadedModule, loadedModule.exports, browserWindow);
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

const data = load("src/lib/puzzle-data.ts");
const { puzzleReducer, emptyPuzzleState, makeTray, placeResult, piecesLeft, hintPiece } = load("src/lib/puzzle-game.ts");
const { puzzles, puzzleLevels, puzzlesIn, slotId } = data;

function started(puzzle, random = seeded(3)) {
  return puzzleReducer(emptyPuzzleState(), { type: "start", round: 1, puzzleId: puzzle.id, tray: makeTray(puzzle, random) });
}

test("every puzzle is well formed, and each level has the planned number of pieces", () => {
  const sizes = { little: [2, 3], explorer: [4, 6], master: [6, 9] };
  assert.equal(new Set(puzzles.map((puzzle) => puzzle.id)).size, puzzles.length, "ids are unique");
  for (const level of puzzleLevels) assert.ok(puzzlesIn(level).length >= 2, `${level} has a choice of pictures`);
  for (const puzzle of puzzles) {
    const cells = puzzle.cols * puzzle.rows;
    assert.ok(puzzle.missing.length >= sizes[puzzle.level][0] && puzzle.missing.length <= sizes[puzzle.level][1], `${puzzle.id} has the right number of pieces`);
    assert.equal(new Set(puzzle.missing).size, puzzle.missing.length, `${puzzle.id} lists each cell once`);
    assert.ok(puzzle.missing.every((cell) => Number.isInteger(cell) && cell >= 0 && cell < cells), `${puzzle.id} cells are on the board`);
    assert.ok(puzzle.intro && puzzle.done && puzzle.name);
  }
  // Every picture is drawn in a box whose shape matches its grid, so pieces are never stretched.
  // Line endings differ by platform (git may check files out with CRLF on Windows).
  const art = fs.readFileSync(path.join(root, "src/features/puzzle-playground/puzzle-art.tsx"), "utf8").replace(/\r\n/g, "\n");
  const frames = { apple: [200, 200], butterfly: [300, 200], fish: [300, 200], house: [300, 300], garden: [300, 300] };
  for (const puzzle of puzzles) {
    if (puzzle.art in frames) {
      const [width, height] = frames[puzzle.art];
      assert.equal(width / height, puzzle.cols / puzzle.rows, `${puzzle.id} picture matches its ${puzzle.cols}×${puzzle.rows} grid`);
      const name = puzzle.art.charAt(0).toUpperCase() + puzzle.art.slice(1);
      assert.match(art, new RegExp(`function ${name}Art\\(\\) \\{\\n  return <Frame width=\\{${width}\\} height=\\{${height}\\}`));
    } else assert.equal(puzzle.cols, puzzle.rows, `${puzzle.id} uses a square mascot`);
  }
});

test("the tray holds each missing piece once, shuffled", () => {
  for (const puzzle of puzzles) {
    for (let seed = 1; seed <= 20; seed++) {
      const tray = makeTray(puzzle, seeded(seed));
      assert.deepEqual([...tray.map((piece) => piece.cell)].sort((a, b) => a - b), [...puzzle.missing].sort((a, b) => a - b));
      assert.equal(new Set(tray.map((piece) => piece.id)).size, tray.length, "stable, unique piece ids");
      if (puzzle.missing.length > 1) assert.notDeepEqual([...tray.map((piece) => piece.cell)], [...puzzle.missing], "never already in order");
    }
  }
});

test("a piece fits only its own spot; a wrong spot keeps the piece to try again", () => {
  const puzzle = puzzles.find((item) => item.id === "fish");
  let state = started(puzzle);
  const [first, second] = state.tray;
  state = puzzleReducer(state, { type: "select", pieceId: first.id });
  assert.equal(state.selected, first.id);

  const before = state;
  state = puzzleReducer(state, { type: "place", pieceId: first.id, slotId: slotId(second.cell) });
  assert.equal(placeResult(before, state), "wrong");
  assert.deepEqual({ ...state.placed }, {}, "nothing is placed");
  assert.equal(state.selected, first.id, "the piece is still in hand");
  assert.equal(state.tries, 1);

  const ready = state;
  state = puzzleReducer(state, { type: "place", pieceId: first.id, slotId: slotId(first.cell) });
  assert.equal(placeResult(ready, state), "placed");
  assert.equal(state.placed[slotId(first.cell)], first.id);
  assert.equal(state.selected, null);

  // No second copy, no reuse of a filled spot, no spots that were never missing.
  assert.equal(puzzleReducer(state, { type: "place", pieceId: first.id, slotId: slotId(second.cell) }), state, "a placed piece can't move again");
  assert.equal(puzzleReducer(state, { type: "place", pieceId: second.id, slotId: slotId(first.cell) }), state, "a filled spot takes nothing else");
  const given = [...Array(puzzle.cols * puzzle.rows).keys()].find((cell) => !puzzle.missing.includes(cell));
  assert.equal(puzzleReducer(state, { type: "place", pieceId: second.id, slotId: slotId(given) }), state, "the picture's own parts are not spots");
  assert.equal(puzzleReducer(state, { type: "select", pieceId: first.id }), state, "a placed piece can't be picked up");
  assert.equal(puzzleReducer(state, { type: "place", pieceId: "fish-99", slotId: slotId(first.cell) }), state, "unknown pieces are ignored");
});

test("every puzzle completes exactly when its last piece is placed, then ignores everything", () => {
  for (const puzzle of puzzles) {
    let state = started(puzzle, seeded(puzzle.id.length));
    let completions = 0;
    for (const piece of state.tray) {
      assert.equal(state.status, "playing");
      const before = state;
      state = puzzleReducer(state, { type: "place", pieceId: piece.id, slotId: slotId(piece.cell) });
      if (placeResult(before, state) === "complete") completions++;
    }
    assert.equal(state.status, "complete", puzzle.id);
    assert.equal(completions, 1, `${puzzle.id} finishes once`);
    assert.equal(piecesLeft(state), 0);
    assert.equal(puzzleReducer(state, { type: "hint" }), state);
    assert.equal(puzzleReducer(state, { type: "select", pieceId: state.tray[0].id }), state);
  }
});

test("hints point at the piece in hand (or the next one), and can be cleared only by the same game", () => {
  const puzzle = puzzles.find((item) => item.id === "house");
  let state = started(puzzle);
  state = puzzleReducer(state, { type: "select", pieceId: state.tray[3].id });
  state = puzzleReducer(state, { type: "hint" });
  assert.equal(state.hinted, slotId(state.tray[3].cell), "the hint shows where the held piece goes");
  assert.equal(state.hints, 1);
  assert.equal(puzzleReducer(state, { type: "clear-hint", round: 9 }), state, "an old timer does nothing");
  assert.equal(puzzleReducer(state, { type: "clear-hint", round: 1 }).hinted, null);
  const fresh = puzzleReducer(started(puzzle), { type: "hint" });
  assert.equal(fresh.selected, hintPiece(started(puzzle)).id, "with nothing in hand, the hint picks up the next piece");
});

test("tapping the piece in hand puts it down; restarting starts clean", () => {
  const puzzle = puzzles[0];
  let state = started(puzzle);
  state = puzzleReducer(state, { type: "select", pieceId: state.tray[0].id });
  state = puzzleReducer(state, { type: "select", pieceId: state.tray[0].id });
  assert.equal(state.selected, null);
  state = puzzleReducer(state, { type: "place", pieceId: state.tray[0].id, slotId: slotId(state.tray[0].cell) });
  const again = puzzleReducer(state, { type: "start", round: 2, puzzleId: puzzle.id, tray: makeTray(puzzle, seeded(8)) });
  assert.deepEqual({ ...again.placed }, {});
  assert.equal(again.status, "playing");
  assert.equal(again.tries + again.hints, 0);
});

test("progress: a star per level once, puzzles listed once, safe storage", () => {
  const memory = memoryWindow();
  const { PUZZLE_PROGRESS_KEY, emptyPuzzleProgress, readPuzzleProgress, savePuzzleProgress, recordSolved, startLevel, starsEarned, nextPuzzle, parsePuzzleProgress } = load("src/lib/puzzle-progress.ts", memory.window);
  assert.equal(PUZZLE_PROGRESS_KEY, "play-learn-puzzle-playground-v1");
  assert.equal(nextPuzzle(emptyPuzzleProgress), puzzles[0].id);
  let progress = startLevel(emptyPuzzleProgress, "little");
  assert.equal(startLevel(progress, "little"), progress);
  progress = recordSolved(progress, "lion", 1);
  progress = recordSolved(progress, "lion", 0);
  progress = recordSolved(progress, "apple", 2);
  assert.equal(starsEarned(progress), 1, "replaying a level adds no second star");
  assert.deepEqual([...progress.solved], ["lion", "apple"]);
  assert.equal(progress.games, 3);
  assert.equal(progress.hints, 3);
  assert.equal(nextPuzzle(progress), "owl");
  assert.equal(recordSolved(progress, "dragon", 1), progress, "unknown puzzles change nothing");

  assert.equal(savePuzzleProgress(progress), true);
  assert.equal(starsEarned(readPuzzleProgress()), 1, "progress survives a reload");
  assert.ok(JSON.parse(memory.storage.get("play-learn-activity-v1"))["puzzle-playground"] > 0, "last played is noted");
  const cleaned = parsePuzzleProgress({ started: ["little", "giant"], completed: ["master", "master"], solved: ["fish", "dragon"], games: -2, hints: 4 });
  assert.deepEqual([...cleaned.started], ["little"]);
  assert.deepEqual([...cleaned.completed], ["master"]);
  assert.deepEqual([...cleaned.solved], ["fish"]);
  assert.equal(cleaned.games, 0);
  memory.storage.set(PUZZLE_PROGRESS_KEY, "{oops");
  assert.equal(readPuzzleProgress().games, 0, "corrupt data is ignored");
  cache.clear();
  const broken = load("src/lib/puzzle-progress.ts", { localStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } } });
  assert.equal(broken.savePuzzleProgress(broken.emptyPuzzleProgress), false, "a failed save is reported, not thrown");
  cache.clear();
});

test("Puzzle Playground is listed, routed, premium-ready, reported, and asks for nothing personal", () => {
  const { games } = load("src/lib/games.ts");
  const listing = games.find((item) => item.id === "puzzle-playground");
  assert.equal(games.indexOf(listing), 6, "it is game 7");
  assert.equal(listing.href, "/puzzle-playground");
  assert.match(fs.readFileSync(path.join(root, "src/app/puzzle-playground/page.tsx"), "utf8"), /PremiumGate gameId="puzzle-playground"/);
  assert.match(fs.readFileSync(path.join(root, "src/components/layout/app-navigation.tsx"), "utf8"), /"\/puzzle-playground"/);
  assert.match(fs.readFileSync(path.join(root, "src/app/grown-ups/page.tsx"), "utf8"), /removeItem\(PUZZLE_PROGRESS_KEY\)/);
  const catalog = path.join(root, "../play-and-learn-backend/src/billing/game-catalog.ts");
  if (fs.existsSync(catalog)) assert.match(fs.readFileSync(catalog, "utf8"), /'puzzle-playground'/);

  const { puzzleReport } = load("src/lib/parent-report.ts");
  const { emptyPuzzleProgress } = load("src/lib/puzzle-progress.ts");
  assert.equal(puzzleReport(emptyPuzzleProgress).status, "not-started");
  const done = puzzleReport({ started: [...puzzleLevels], completed: [...puzzleLevels], solved: puzzles.map((puzzle) => puzzle.id), games: 9, hints: 2 });
  assert.equal(done.status, "completed");
  assert.equal(done.attempted, 0, "a piece tried in the wrong spot is never a wrong quiz answer");

  const featureDir = path.join(root, "src/features/puzzle-playground");
  for (const file of fs.readdirSync(featureDir)) {
    const source = fs.readFileSync(path.join(featureDir, file), "utf8");
    assert.doesNotMatch(source, /getUserMedia|geolocation|<input|<textarea|<img|https?:\/\//, `${file} uses no camera, typing, remote images, or links out`);
  }
  for (const line of [...Object.values(data.puzzleLines), ...data.fitCheers]) assert.doesNotMatch(line, /\b(wrong|bad|fail|lose|hurry|no)\b/i, `"${line}" is kind`);
});
