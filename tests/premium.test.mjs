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


const { hasPremium, isGameLocked } = load("src/lib/premium.ts");
const now = Date.UTC(2026, 9, 18);
const day = 24 * 60 * 60 * 1000;

test("premium games lock without an active period and unlock with one", () => {
  const free = { premiumGameIds: ["animal-safari"], premiumUntil: null };
  assert.equal(isGameLocked(free, "animal-safari", now), true);
  assert.equal(isGameLocked(free, "alphabet-adventure", now), false, "free games never lock");

  const paid = { premiumGameIds: ["animal-safari"], premiumUntil: new Date(now + day).toISOString() };
  assert.equal(hasPremium(paid, now), true);
  assert.equal(isGameLocked(paid, "animal-safari", now), false);

  const ended = { premiumGameIds: ["animal-safari"], premiumUntil: new Date(now - 1).toISOString() };
  assert.equal(isGameLocked(ended, "animal-safari", now), true, "expired premium locks again");
});

test("nothing locks before the app knows which games are premium", () => {
  assert.equal(isGameLocked(null, "animal-safari", now), false);
});
