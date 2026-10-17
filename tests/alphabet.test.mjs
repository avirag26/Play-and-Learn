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
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) return load(`src/${specifier.slice(2)}.ts`, browserWindow);
    return requireFromHere(specifier);
  };
  vm.runInNewContext("(function(require,module,exports,window){" + code + "\n})", { console, SpeechSynthesisUtterance: browserWindow?.SpeechSynthesisUtterance })(localRequire, loadedModule, loadedModule.exports, browserWindow);
  cache.set(key, loadedModule.exports);
  return loadedModule.exports;
}

test("A–Z content has 26 complete, ordered entries", () => {
  const { alphabet } = load("src/lib/alphabet-data.ts");
  assert.equal(alphabet.length, 26);
  assert.equal(alphabet.map((item) => item.upper).join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  for (const item of alphabet) {
    assert.equal(item.lower, item.upper.toLowerCase());
    for (const field of ["object", "sentence", "pronunciation", "illustration"]) assert.ok(item[field]);
  }
});

test("every letter can be asked without a repeated target or answer position", () => {
  const { alphabet } = load("src/lib/alphabet-data.ts");
  const { makeQuestionOrder, makeChoices } = load("src/lib/alphabet-questions.ts");
  let seed = 42;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const order = makeQuestionOrder(random);
  assert.equal(new Set(order).size, 26);
  let previousPosition = -1;
  for (const index of order) {
    const choices = makeChoices(index, previousPosition, random);
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices.map((item) => item.upper)).size, 3);
    const correctPosition = choices.findIndex((item) => item.upper === alphabet[index].upper);
    assert.ok(correctPosition >= 0);
    assert.notEqual(correctPosition, previousPosition);
    previousPosition = correctPosition;
  }
});

test("progress survives reload and malformed storage falls back safely", () => {
  const storage = new Map();
  const browserWindow = { localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } };
  const { ALPHABET_PROGRESS_KEY, parseAlphabetProgress, readAlphabetProgress, saveAlphabetProgress } = load("src/lib/alphabet-progress.ts", browserWindow);
  const progress = { discovered: ["A", "B"], attempted: 3, correct: 2, completed: ["find"] };
  saveAlphabetProgress(progress);
  assert.deepEqual(JSON.parse(JSON.stringify(readAlphabetProgress())), progress);
  storage.set(ALPHABET_PROGRESS_KEY, "{broken");
  assert.equal(readAlphabetProgress().attempted, 0);
  const sanitized = parseAlphabetProgress({ discovered: ["A", "A", "?"], attempted: -2, correct: "5", completed: ["match", "wrong"] });
  assert.deepEqual(Array.from(sanitized.discovered), ["A"]);
  assert.equal(sanitized.attempted, 0);
  assert.equal(sanitized.correct, 0);
  assert.deepEqual(Array.from(sanitized.completed), ["match"]);
});

test("speech gracefully handles muted and unsupported browsers", () => {
  const storage = new Map();
  const browserWindow = { localStorage: { getItem: (key) => storage.get(key) ?? null } };
  const { speakAlphabet } = load("src/lib/alphabet-speech.ts", browserWindow);
  assert.equal(speakAlphabet("A. Apple."), "unsupported");
  storage.set("play-learn-settings-v1", JSON.stringify({ soundOn: false }));
  assert.equal(speakAlphabet("A. Apple."), "muted");
});

test("speech uses browser synthesis and reports a playback failure", () => {
  cache.clear();
  let spoken;
  let reported = false;
  const browserWindow = {
    localStorage: { getItem: () => null },
    speechSynthesis: { cancel: () => {}, speak: (utterance) => { spoken = utterance; } },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
  };
  const { speakAlphabet } = load("src/lib/alphabet-speech.ts", browserWindow);
  assert.equal(speakAlphabet("A. Apple.", () => { reported = true; }), "spoken");
  assert.equal(spoken.text, "A. Apple.");
  assert.equal(spoken.rate, 0.82);
  spoken.onerror();
  assert.equal(reported, true);
});
