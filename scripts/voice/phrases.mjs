// Every line the games can say, built from the app's own data so recordings stay in step with it.
// When a game gets new speech, add it here and run `npm run generate` in this folder.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const requireFromApp = createRequire(path.join(appRoot, "package.json"));
const ts = requireFromApp("typescript");
const cache = new Map();

/** Loads one of the app's TypeScript modules (the same way the app's tests do). */
export function load(sourcePath) {
  const filename = path.join(appRoot, sourcePath);
  if (cache.has(filename)) return cache.get(filename);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loaded = { exports: {} };
  cache.set(filename, loaded.exports);
  const localRequire = (specifier) => specifier.startsWith("@/") ? load(`src/${specifier.slice(2)}.ts`) : requireFromApp(specifier);
  vm.runInNewContext("(function(require,module,exports,window){" + code + "\n})", { console })(localRequire, loaded, loaded.exports, undefined);
  return loaded.exports;
}

export function allLines() {
  const { cheerPhrases, retryPhrases, alreadyFoundPhrase, speakableText } = load("src/lib/encouragement.ts");
  const { voicePreview } = load("src/lib/voice-clips.ts");
  const lines = [voicePreview, ...[...cheerPhrases, ...retryPhrases, alreadyFoundPhrase].map(speakableText)];

  // Alphabet Adventure
  const { alphabet } = load("src/lib/alphabet-data.ts");
  for (const entry of alphabet) lines.push(entry.pronunciation, `Can you find the letter ${entry.upper}?`, `What begins with the letter ${entry.upper}?`);

  // Animal Safari
  const { animals } = load("src/lib/animal-data.ts");
  const { findQuestions } = load("src/lib/animal-questions.ts");
  for (const animal of animals) lines.push(animal.pronunciation, animal.fact);
  for (const question of findQuestions) lines.push(question.prompt);

  // Color Quest
  const { colors, detectiveMissions } = load("src/lib/color-data.ts");
  const { colorQuestions } = load("src/lib/color-questions.ts");
  for (const color of colors) lines.push(`${color.name}! ${color.sentence}`, color.name, `That is ${color.name.toLowerCase()}!`);
  for (const question of colorQuestions) lines.push(question.prompt);
  for (const mission of detectiveMissions) lines.push(mission.short);
  lines.push("You found it! Tap we found it!", "You found them all! Tap we found it!", "Beautiful! You colored the whole picture!", "Great detective work!");

  // Count the Stars
  const { numbers, numberWords, countObjects, countPhrase, meetSpeech, adventureChallenges } = load("src/lib/count-data.ts");
  const { countQuestions, objectHint } = load("src/lib/count-questions.ts");
  lines.push("Let's meet the numbers! Tap a number.", "Let's count!", "Match the numbers!", "Number adventure! Pick a challenge.", "Tap each one to count.", "Count them again.", "Great counting!");
  for (const value of numbers) {
    lines.push(meetSpeech(value), numberWords[value]);
    for (const object of countObjects) lines.push(`${countPhrase(value, object.id)}!`);
  }
  for (const question of countQuestions) lines.push(question.prompt);
  for (const challenge of adventureChallenges) {
    lines.push(challenge.prompt, challenge.success);
    for (const object of countObjects) if (object.id !== challenge.object) lines.push(objectHint(challenge, { id: "x", object: object.id }));
  }

  // Home Missions
  const { homeMissions } = load("src/lib/missions.ts");
  for (const mission of homeMissions) lines.push(`${mission.title}. ${mission.steps.map((step, index) => `Step ${index + 1}. ${step}`).join(" ")}`);
  lines.push("Mission complete!");

  // Shape Safari
  const { shapes, meetShapeIds, meetSpeech: shapeSpeech, safariObjects, capitalize } = load("src/lib/shape-data.ts");
  const { matchPrompts, safariPrompt, wrongShapeHint } = load("src/lib/shape-questions.ts");
  lines.push("Let's meet the shapes!", "Match the shapes!", "Shape safari!", "Amazing shape explorer! You found all the shapes!", "Great shape spotting!", "Hooray! You earned a star!", "Great practice!");
  for (const id of meetShapeIds) lines.push(shapeSpeech(id));
  for (const shape of shapes) {
    lines.push(`${capitalize(shape.name)}!`, `That's a ${shape.name} too!`, wrongShapeHint(shape.id, shape.hint));
    for (const prompt of matchPrompts) lines.push(prompt(shape.name));
  }
  for (const object of safariObjects) lines.push(safariPrompt(object.id), `The ${object.name} is a ${shapes.find((shape) => shape.id === object.shape).name}!`, object.hint);
  return lines;
}

/** Each distinct sentence once, keyed the way the app looks recordings up. */
export function allSentences() {
  const { splitSentences, clipKey } = load("src/lib/voice-clips.ts");
  const sentences = new Map();
  for (const line of allLines()) for (const sentence of splitSentences(line)) if (!sentences.has(clipKey(sentence))) sentences.set(clipKey(sentence), sentence);
  return sentences;
}

const letterNames = { A: "Ay", B: "Bee", C: "See", D: "Dee", E: "Ee", F: "Eff", G: "Jee", H: "Aitch", I: "Eye", J: "Jay", K: "Kay", L: "El", M: "Em", N: "En", O: "Oh", P: "Pee", Q: "Cue", R: "Ar", S: "Ess", T: "Tee", U: "You", V: "Vee", W: "Double you", X: "Ex", Y: "Why", Z: "Zee" };

/** What the voice actually reads: letters are spelled out so "A." is the letter, not the word "a". */
export function spokenForm(sentence) {
  const lone = sentence.match(/^([A-Z])\.$/);
  if (lone) return `${letterNames[lone[1]]}.`;
  return sentence.replace(/\bletter ([A-Z])\b/g, (_, letter) => `letter ${letterNames[letter]}`);
}
