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

/** Loads app modules into one fresh sandbox; `globals` stand in for browser APIs. */
function sandbox(browserWindow, globals = {}) {
  const cache = new Map();
  function load(sourcePath) {
    const filename = path.join(root, sourcePath);
    if (cache.has(filename)) return cache.get(filename);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const loaded = { exports: {} };
    cache.set(filename, loaded.exports);
    const localRequire = (specifier) => specifier.startsWith("@/") ? load(`src/${specifier.slice(2)}.ts`) : requireFromHere(specifier);
    vm.runInNewContext("(function(require,module,exports,window){" + code + "\n})", { console, ...globals })(localRequire, loaded, loaded.exports, browserWindow);
    return loaded.exports;
  }
  return load;
}

/** A pretend browser: settings in storage, one <audio> element, and the speech engine. */
function fakeBrowser(settings = {}) {
  const storage = new Map([["play-learn-settings-v1", JSON.stringify(settings)]]);
  const audio = { src: "", played: [], paused: 0, onended: null, onerror: null, play() { this.played.push(this.src); return Promise.resolve(); }, pause() { this.paused++; } };
  const spoken = [];
  const speechSynthesis = { getVoices: () => [], cancel() {}, resume() {}, speak(utterance) { spoken.push(utterance.text); } };
  class SpeechSynthesisUtterance { constructor(text) { this.text = text; } }
  const window = { localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)) }, Audio: function Audio() { return audio; }, speechSynthesis, SpeechSynthesisUtterance };
  return { window, audio, spoken, globals: { SpeechSynthesisUtterance } };
}

const load = sandbox(undefined);
const { splitSentences, clipKey, clipUrls, voicePreview } = load("src/lib/voice-clips.ts");

test("lines split into sentences, and each sentence has one stable recording name", () => {
  assert.deepEqual([...splitSentences("Great job dear!  The ball is a circle!")], ["Great job dear!", "The ball is a circle!"]);
  assert.deepEqual([...splitSentences("A. Apple.")], ["A.", "Apple."]);
  assert.deepEqual([...splitSentences("   ")], []);
  assert.equal(clipKey("Great job dear!"), clipKey("great  job DEAR!"), "case and spacing don't matter");
  assert.notEqual(clipKey("Great job dear!"), clipKey("Great job dear?"));
  assert.match(clipKey("Hello!"), /^[0-9a-f]{8}$/);
});

test("a line uses recordings only when every sentence was recorded", () => {
  const available = new Set([clipKey("Great job dear!"), clipKey("The ball is a circle!")]);
  assert.deepEqual([...clipUrls("Great job dear! The ball is a circle!", "male", available)], [`/voice/male/${clipKey("Great job dear!")}.mp3`, `/voice/male/${clipKey("The ball is a circle!")}.mp3`]);
  assert.equal(clipUrls("Great job dear! Something new.", "female", available), null, "never mixes a recording with the browser voice in one line");
  assert.equal(clipUrls("", "female", available), null);
});

test("the voice setting is saved, defaults to female, and ignores anything else", () => {
  const { parseSettings, DEFAULT_SETTINGS } = load("src/lib/app-settings.ts");
  assert.equal(DEFAULT_SETTINGS.voice, "female");
  assert.equal(parseSettings({ voice: "male" }).voice, "male");
  assert.equal(parseSettings({ voice: "robot" }).voice, "female");
  assert.equal(parseSettings({ soundOn: false }).voice, "female", "older saved settings keep working");
});

test("every sentence the games say is recorded in both voices", () => {
  const { voiceClipKeys } = load("src/lib/voice-manifest.ts");
  const listed = new Set(voiceClipKeys.split(" ").filter(Boolean));
  assert.ok(listed.size > 500, `the manifest lists the recordings (${listed.size})`);
  for (const gender of ["female", "male"]) {
    const folder = path.join(root, "public", "voice", gender);
    for (const key of listed) assert.ok(fs.existsSync(path.join(folder, `${key}.mp3`)), `${gender}/${key}.mp3`);
  }
  // Lines built at play time from the games' own data.
  const { cheerPhrases, retryPhrases, speakableText } = load("src/lib/encouragement.ts");
  const { matchPrompts, safariPrompt, wrongShapeHint } = load("src/lib/shape-questions.ts");
  const { shapes, safariObjects, meetSpeech } = load("src/lib/shape-data.ts");
  const { countQuestions } = load("src/lib/count-questions.ts");
  const { findQuestions } = load("src/lib/animal-questions.ts");
  const { memoryPictures, memoryLines, matchCheers, pictureSpeech, matchSpeech } = load("src/lib/memory-data.ts");
  const samples = [voicePreview, ...cheerPhrases.map(speakableText), ...retryPhrases.map(speakableText), meetSpeech("triangle"), ...shapes.map((shape) => matchPrompts[1](shape.name)), ...safariObjects.map((object) => safariPrompt(object.id)), wrongShapeHint("square", shapes[2].hint), ...countQuestions.map((question) => question.prompt), ...findQuestions.map((question) => question.prompt), "A. Apple.", "Can you find the letter Q?", ...Object.values(memoryLines), `${memoryLines.done} Hooray! You earned a star!`, ...memoryPictures.flatMap((picture) => [`${pictureSpeech(picture.id)} ${memoryLines.findOther}`, `${pictureSpeech(picture.id)} ${memoryLines.miss}`, ...matchCheers.map((cheer) => `${cheer} ${matchSpeech(picture.id)}`)])];
  for (const line of samples) assert.ok(clipUrls(line, "female", listed), `recorded: "${line}"`);
});

test("speak plays the chosen voice's recordings one after another", () => {
  const browser = fakeBrowser({ voice: "male" });
  const run = sandbox(browser.window, browser.globals);
  const { speak } = run("src/lib/speech.ts");
  const line = speakableText("Great job dear! 🌟") + " " + voicePreview;
  assert.equal(speak(line), "spoken");
  const keys = splitSentences(line).map(clipKey);
  assert.deepEqual([...browser.audio.played], [`/voice/male/${keys[0]}.mp3`]);
  browser.audio.onended();
  browser.audio.onended();
  assert.deepEqual([...browser.audio.played], [...keys.map((key) => `/voice/male/${key}.mp3`)]);
  assert.deepEqual(browser.spoken, [], "the browser voice stays quiet");
});

test("unrecorded lines and clips that fail to load fall back to the browser voice", () => {
  const browser = fakeBrowser();
  const run = sandbox(browser.window, browser.globals);
  const { speak, stopSpeech } = run("src/lib/speech.ts");
  assert.equal(speak("A sentence nobody recorded."), "spoken");
  assert.deepEqual(browser.spoken, ["A sentence nobody recorded."]);
  assert.deepEqual(browser.audio.played, []);

  speak(`Great job dear! ${voicePreview}`);
  browser.audio.onended();
  browser.audio.onerror();
  // "Great job dear!" played, then "Hello!" failed: the browser reads from "Hello!" on.
  assert.deepEqual(browser.spoken.slice(1), [voicePreview], "the rest of the line is still read");

  speak(voicePreview);
  stopSpeech();
  const before = browser.audio.played.length;
  browser.audio.onended();
  assert.equal(browser.audio.played.length, before, "stopping speech stops the clips that were queued");
});

test("sound off keeps everything quiet", () => {
  const browser = fakeBrowser({ soundOn: false });
  const { speak } = sandbox(browser.window, browser.globals)("src/lib/speech.ts");
  assert.equal(speak(voicePreview), "muted");
  assert.deepEqual(browser.audio.played, []);
  assert.deepEqual(browser.spoken, []);
});

const { speakableText } = load("src/lib/encouragement.ts");
