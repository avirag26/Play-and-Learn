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

const { journeyMissions, journey, recordFinish, dayNumber, parseMissionDays } = load("src/lib/mission-journey.ts");
const { homeMissions } = load("src/lib/missions.ts");
const statuses = (steps) => [...steps.map((step) => step.status)];
const DAY = 20_000;

test("the journey holds every mission once, mixing the paths day by day", () => {
  assert.equal(journeyMissions.length, homeMissions.length);
  assert.equal(new Set(journeyMissions.map((mission) => mission.id)).size, homeMissions.length);
  for (let index = 1; index < journeyMissions.length; index++) assert.notEqual(journeyMissions[index].category, journeyMissions[index - 1].category, "two days in a row are never the same kind of mission");
});

test("day 1 is open from the start and everything else waits", () => {
  const steps = journey([], {}, DAY);
  assert.equal(steps[0].status, "today");
  assert.equal(steps[0].day, 1);
  assert.ok(steps.slice(1).every((step) => step.status === "locked"));
});

test("finishing today's mission opens the next one tomorrow, not straight away", () => {
  const first = journeyMissions[0].id;
  const days = recordFinish({}, first, DAY);
  assert.deepEqual(statuses(journey([first], days, DAY)).slice(0, 3), ["done", "tomorrow", "locked"]);
  assert.deepEqual(statuses(journey([first], days, DAY + 1)).slice(0, 3), ["done", "today", "locked"], "a new day opens it");
  assert.deepEqual(statuses(journey([first], days, DAY + 9)).slice(0, 3), ["done", "today", "locked"], "missed days cost nothing; it simply waits");
});

test("only one new mission a day, however fast the child goes", () => {
  const [a, b] = journeyMissions.map((mission) => mission.id);
  let days = recordFinish({}, a, DAY);
  days = recordFinish(days, b, DAY + 1);
  assert.deepEqual(statuses(journey([a, b], days, DAY + 1)).slice(0, 3), ["done", "done", "tomorrow"]);
  assert.equal(recordFinish(days, a, DAY + 5), days, "playing a finished mission again keeps its first day");
});

test("missions finished before the journey existed still count and never block", () => {
  // Older saves have finishes but no days; they count as finished long ago.
  const old = [journeyMissions[0].id, journeyMissions[1].id, journeyMissions[5].id];
  const steps = journey(old, {}, DAY);
  assert.deepEqual(statuses(steps).slice(0, 7), ["done", "done", "today", "locked", "locked", "done", "locked"]);
  const all = journey(journeyMissions.map((mission) => mission.id), {}, DAY);
  assert.ok(all.every((step) => step.status === "done"), "a finished journey is all stars");
});

test("days follow the device's calendar, and saved days are checked", () => {
  assert.equal(dayNumber(new Date(2026, 9, 25, 23, 59).getTime()) + 1, dayNumber(new Date(2026, 9, 26, 0, 1).getTime()), "midnight starts a new day");
  assert.equal(dayNumber(new Date(2026, 9, 25, 0, 1).getTime()), dayNumber(new Date(2026, 9, 25, 23, 59).getTime()));
  assert.deepEqual({ ...parseMissionDays({ "color-hunt": 5, "made-up": 3, "count-toys": -1, "shape-build": 2.5 }) }, { "color-hunt": 5 });
  assert.deepEqual({ ...parseMissionDays("junk") }, {});
});

test("with Premium missions, the free days open as usual and the next day waits for Premium", () => {
  const ids = journeyMissions.map((mission) => mission.id);
  // Three free days: day 4 onwards needs Premium.
  const fresh = journey([], {}, DAY, 4);
  assert.equal(fresh[0].status, "today");
  assert.ok(fresh.slice(0, 3).every((step) => !step.premium), "free days carry no Premium mark");
  assert.ok(fresh.slice(3).every((step) => step.premium), "later days show they need Premium");

  const threeDone = recordFinish(recordFinish(recordFinish({}, ids[0], DAY - 3), ids[1], DAY - 2), ids[2], DAY - 1);
  const steps = journey(ids.slice(0, 3), threeDone, DAY, 4);
  assert.deepEqual(statuses(steps).slice(0, 5), ["done", "done", "done", "premium", "locked"]);
  // Buying Premium (no lock day) opens day 4 straight away; missions already done never lock again.
  assert.deepEqual(statuses(journey(ids.slice(0, 3), threeDone, DAY, null)).slice(0, 5), ["done", "done", "done", "today", "locked"]);
  assert.deepEqual(statuses(journey(ids.slice(0, 6), {}, DAY, 1)).slice(0, 7), ["done", "done", "done", "done", "done", "done", "premium"], "finished missions stay finished if Premium lapses");
  assert.equal(journey([], {}, DAY, 1)[0].status, "premium", "no free days: day 1 needs Premium too");
});

test("the Premium mission lock follows the plan and the parent's Premium", () => {
  const { firstPremiumMissionDay } = load("src/lib/premium.ts");
  const base = { premiumGameIds: [], premiumUntil: null, missionsPremium: true, freeMissionDays: 3 };
  assert.equal(firstPremiumMissionDay(base, 1000), 4);
  assert.equal(firstPremiumMissionDay({ ...base, missionsPremium: false }, 1000), null, "missions are free when the admin hasn't locked them");
  assert.equal(firstPremiumMissionDay({ ...base, premiumUntil: new Date(5000).toISOString() }, 1000), null, "Premium opens every day");
  assert.equal(firstPremiumMissionDay({ ...base, premiumUntil: new Date(500).toISOString() }, 1000), 4, "an ended Premium locks them again");
  assert.equal(firstPremiumMissionDay(null, 1000), null, "unknown (first visit offline) stays open");
});
