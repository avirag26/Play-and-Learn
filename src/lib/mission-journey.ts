import { homeMissions, missionCategories, type HomeMission } from "@/lib/missions";

/**
 * Home Missions as a daily journey: one path of missions, a new one each day. Day 1 is open from
 * the start; finishing a mission opens the next one on the next calendar day. Missing days costs
 * nothing: the next mission simply waits. Finished missions can always be played again.
 */
export const MISSION_DAYS_KEY = "play-learn-mission-days-v1";

/** The path mixes the paths (colors, counting, shapes, …) so each day feels different. */
export const journeyMissions: readonly HomeMission[] = (() => {
  const byCategory = missionCategories.map((category) => homeMissions.filter((mission) => mission.category === category));
  const order: HomeMission[] = [];
  for (let round = 0; order.length < homeMissions.length; round++) for (const list of byCategory) if (list[round]) order.push(list[round]);
  return order;
})();

/** The local calendar day as a whole number, so "tomorrow" starts at midnight on this device. */
export function dayNumber(time: number): number {
  const date = new Date(time);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/** The day each mission was first finished. Older saves (no day) count as finished long ago. */
export type MissionDays = Record<string, number>;

export function parseMissionDays(value: unknown): MissionDays {
  if (!value || typeof value !== "object") return {};
  const ids = new Set(homeMissions.map((mission) => mission.id));
  return Object.fromEntries(Object.entries(value).filter(([id, day]) => ids.has(id) && Number.isSafeInteger(day) && (day as number) >= 0)) as MissionDays;
}

export function readMissionDays(): MissionDays {
  if (typeof window === "undefined") return {};
  try { return parseMissionDays(JSON.parse(window.localStorage.getItem(MISSION_DAYS_KEY) ?? "null")); }
  catch { return {}; }
}

export function saveMissionDays(days: MissionDays): void {
  try { window.localStorage.setItem(MISSION_DAYS_KEY, JSON.stringify(days)); }
  catch { /* Storage is optional; the journey still works for this visit. */ }
}

export type JourneyStep = {
  mission: HomeMission;
  /** 1 for the first mission on the path. */
  day: number;
  /** done: finished; today: ready to play now; tomorrow: opens tomorrow; locked: further along the path. */
  status: "done" | "today" | "tomorrow" | "locked";
};

/**
 * Where the child is on the path. The next mission is the first one not finished; it is open if it is
 * the very first, or if the mission before it was finished on an earlier day.
 */
export function journey(completed: readonly string[], days: MissionDays, today: number): JourneyStep[] {
  const nextIndex = journeyMissions.findIndex((mission) => !completed.includes(mission.id));
  return journeyMissions.map((mission, index) => {
    const step = { mission, day: index + 1 };
    if (completed.includes(mission.id)) return { ...step, status: "done" };
    if (index !== nextIndex) return { ...step, status: "locked" };
    const previous = journeyMissions[index - 1];
    const ready = !previous || (days[previous.id] ?? 0) < today;
    return { ...step, status: ready ? "today" : "tomorrow" };
  });
}

/** Records a first finish (the day it happened); finishing again keeps the original day. */
export function recordFinish(days: MissionDays, id: string, today: number): MissionDays {
  return id in days ? days : { ...days, [id]: today };
}
