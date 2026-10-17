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
  vm.runInNewContext("(function(require,module,exports,window){" + code + "\n})", { console, SpeechSynthesisUtterance: browserWindow?.SpeechSynthesisUtterance })(localRequire, loadedModule, loadedModule.exports, browserWindow);
  cache.set(key, loadedModule.exports);
  return loadedModule.exports;
}

function seeded(seed) {
  let value = seed;
  return () => { value = (value * 1103515245 + 12345) % 2147483648; return value / 2147483648; };
}

test("24 complete animals, six in each habitat", () => {
  const { animals, habitats } = load("src/lib/animal-data.ts");
  assert.equal(animals.length, 24);
  assert.equal(new Set(animals.map((animal) => animal.id)).size, 24);
  assert.equal(new Set(animals.map((animal) => animal.illustration)).size, 24, "every animal has a distinct picture");
  for (const habitat of habitats) assert.equal(animals.filter((animal) => animal.habitat === habitat.id).length, 6, habitat.id);
  for (const animal of animals) for (const field of ["name", "illustration", "pronunciation", "fact", "alt"]) assert.ok(animal[field], `${animal.id}.${field}`);
});

test("every Find the Animal question has exactly one defensible answer", () => {
  const { findQuestions } = load("src/lib/animal-questions.ts");
  const { isAnimalId } = load("src/lib/animal-data.ts");
  const answersByPrompt = new Map();
  for (const question of findQuestions) answersByPrompt.set(question.prompt, [...(answersByPrompt.get(question.prompt) ?? []), question.answer]);
  assert.equal(new Set(findQuestions.map((question) => question.id)).size, findQuestions.length);
  for (const question of findQuestions) {
    assert.ok(isAnimalId(question.answer), question.id);
    assert.ok(question.distractors.length >= 2, question.id);
    for (const distractor of question.distractors) {
      assert.ok(isAnimalId(distractor), `${question.id}: ${distractor}`);
      assert.ok(!answersByPrompt.get(question.prompt).includes(distractor), `${question.id}: ${distractor} also fits "${question.prompt}"`);
    }
  }
  for (const prompt of ["Can you find the elephant?", "Which animal lives in the ocean?", "Which animal has a long neck?", "Which animal can hop?", "Which animal has feathers?"]) assert.ok(answersByPrompt.has(prompt), prompt);
});

test("find sessions are varied and choices are fair", () => {
  const { makeFindSession, makeFindChoices, SESSION_LENGTH } = load("src/lib/animal-questions.ts");
  for (let seed = 1; seed <= 200; seed++) {
    const random = seeded(seed);
    const session = makeFindSession(SESSION_LENGTH, random);
    assert.equal(session.length, SESSION_LENGTH);
    assert.equal(new Set(session.map((question) => question.prompt)).size, SESSION_LENGTH, "no repeated prompt");
    assert.equal(new Set(session.map((question) => question.answer)).size, SESSION_LENGTH, "no repeated answer animal");
    assert.ok(session.some((question) => question.kind === "name") && session.some((question) => question.kind !== "name"));
    let previous = -1;
    for (const question of session) {
      const choices = makeFindChoices(question, previous, random);
      assert.equal(choices.length, 3);
      assert.equal(new Set(choices.map((choice) => choice.id)).size, 3);
      const position = choices.findIndex((choice) => choice.id === question.answer);
      assert.notEqual(position, -1);
      assert.notEqual(position, previous, "answer moves between questions");
      for (const choice of choices) if (choice.id !== question.answer) assert.ok(question.distractors.includes(choice.id));
      previous = position;
    }
  }
});

test("every listed animal sound file exists, and the sound quiz only uses animals with sounds", () => {
  const { animalSoundFiles } = load("src/lib/animal-sounds.ts");
  for (const [id, src] of Object.entries(animalSoundFiles)) {
    assert.match(src, /^\/sounds\/animals\/[a-z-]+\.(mp3|ogg|wav|m4a)$/, id);
    assert.ok(fs.existsSync(path.join(root, "public", src)), `missing sound file for ${id}: public${src}`);
  }
  const { soundAnimals, makeSoundSession, makeSoundChoices } = load("src/lib/animal-questions.ts");
  const available = soundAnimals({ lion: "/sounds/animals/lion.mp3", cow: "/sounds/animals/cow.mp3", duck: "/sounds/animals/duck.mp3" });
  assert.deepEqual(Array.from(available, (animal) => animal.id).sort(), ["cow", "duck", "lion"]);
  const session = makeSoundSession(available, 8, seeded(3));
  assert.equal(session.length, 3);
  assert.equal(new Set(session.map((animal) => animal.id)).size, 3);
  const choices = makeSoundChoices(session[0], -1, seeded(4));
  assert.equal(choices.filter((choice) => choice.id === session[0].id).length, 1);
});

test("safari progress is sanitized and kept separate from alphabet progress", () => {
  const storage = new Map([["play-learn-alphabet-v1", JSON.stringify({ discovered: ["A"] })]]);
  const browserWindow = { localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } };
  const { readAnimalProgress, saveAnimalProgress, parseAnimalProgress, ANIMAL_PROGRESS_KEY } = load("src/lib/animal-progress.ts", browserWindow);
  assert.equal(readAnimalProgress().discovered.length, 0);
  saveAnimalProgress({ discovered: ["lion"], attempted: 2, correct: 1, completed: ["find"] });
  const saved = readAnimalProgress();
  assert.deepEqual(Array.from(saved.discovered), ["lion"]);
  assert.equal(saved.correct, 1);
  assert.equal(storage.get("play-learn-alphabet-v1"), JSON.stringify({ discovered: ["A"] }), "alphabet progress untouched");
  assert.notEqual(ANIMAL_PROGRESS_KEY, "play-learn-alphabet-v1");
  const cleaned = parseAnimalProgress({ discovered: ["lion", "dragon", "lion", 3], attempted: -1, correct: 1.5, completed: ["find", "fly"] });
  assert.deepEqual(Array.from(cleaned.discovered), ["lion"]);
  assert.equal(cleaned.attempted, 0);
  assert.equal(cleaned.correct, 0);
  assert.deepEqual(Array.from(cleaned.completed), ["find"]);
  storage.set(ANIMAL_PROGRESS_KEY, "{not json");
  assert.equal(readAnimalProgress().discovered.length, 0);
});

test("sound player reuses one element, ignores sounds it stopped on purpose, and reports real failures", () => {
  cache.clear();
  const storage = new Map();
  const created = [];
  class FakeAudio {
    constructor() { this.src = ""; this.paused = true; this.rejections = []; created.push(this); }
    play() { this.paused = false; return { catch: (handler) => { this.rejections.push(handler); } }; }
    pause() { this.paused = true; }
  }
  const browserWindow = { localStorage: { getItem: (key) => storage.get(key) ?? null }, Audio: FakeAudio };
  const { playSound, stopSound } = load("src/lib/sound-player.ts", browserWindow);
  let lionFailed = 0, cowFailed = 0;
  assert.equal(playSound("/sounds/animals/lion.mp3", () => lionFailed++), "playing");
  assert.equal(playSound("/sounds/animals/cow.mp3", () => cowFailed++), "playing");
  assert.equal(created.length, 1, "one shared element (iOS only lets an unlocked element play later)");
  assert.equal(created[0].src, "/sounds/animals/cow.mp3");
  created[0].rejections[0]({ name: "AbortError" });
  created[0].rejections[0]({ name: "NotAllowedError" });
  created[0].onerror();
  assert.equal(lionFailed, 0, "a sound replaced on purpose never reports a failure");
  assert.equal(cowFailed, 1, "the current sound's error is reported");
  created[0].rejections[1]({ name: "AbortError" });
  assert.equal(cowFailed, 1, "AbortError is not a failure");
  created[0].rejections[1]({ name: "NotAllowedError" });
  assert.equal(cowFailed, 2);
  stopSound();
  assert.equal(created[0].paused, true);
  created[0].rejections[1]({ name: "NotAllowedError" });
  assert.equal(cowFailed, 2, "no failure reported after stopping");
  storage.set("play-learn-settings-v1", JSON.stringify({ soundOn: false }));
  assert.equal(playSound("/sounds/animals/lion.mp3"), "muted");
  cache.clear();
  const noAudio = load("src/lib/sound-player.ts", { localStorage: { getItem: () => null } });
  assert.equal(noAudio.playSound("/sounds/animals/lion.mp3"), "unavailable");
});

test("speech ignores cancelled sentences and retries a failing voice with the default voice", () => {
  cache.clear();
  const spoken = [];
  const voice = { name: "Google US English", lang: "en-US", localService: false };
  const browserWindow = {
    localStorage: { getItem: () => null },
    speechSynthesis: { cancel: () => {}, resume: () => {}, speak: (utterance) => spoken.push(utterance), getVoices: () => [voice] },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
  };
  const { speak } = load("src/lib/speech.ts", browserWindow);
  let failures = 0;
  assert.equal(speak("Lion", () => failures++), "spoken");
  assert.equal(spoken[0].voice, voice);
  spoken[0].onerror({ error: "interrupted" });
  spoken[0].onerror({ error: "canceled" });
  assert.equal(spoken.length, 1, "a cancelled sentence is not retried");
  assert.equal(failures, 0, "a cancelled sentence is not a failure");
  spoken[0].onerror({ error: "synthesis-failed" });
  assert.equal(spoken.length, 2, "retries once");
  assert.equal(spoken[1].voice, undefined, "the retry uses the phone's default voice");
  assert.equal(spoken[1].text, "Lion");
  spoken[1].onerror({ error: "synthesis-failed" });
  assert.equal(failures, 1, "reports a failure only when the default voice fails too");
});
