import { isVoiceGender, type VoiceGender } from "@/lib/voice-clips";

export type ReminderInterval = 0 | 15 | 30 | 45 | 60;
export type AgeRange = "3-4" | "5-6";
export type AppSettings = { ageRange: AgeRange; soundOn: boolean; reducedMotion: boolean; warmTheme: boolean; reminderInterval: ReminderInterval; /** The recorded voice that reads to the child. */ voice: VoiceGender };

export const SETTINGS_STORAGE_KEY = "play-learn-settings-v1";
export const MISSIONS_STORAGE_KEY = "play-learn-missions-v1";
export const DEFAULT_SETTINGS: AppSettings = { ageRange: "3-4", soundOn: true, reducedMotion: false, warmTheme: true, reminderInterval: 0, voice: "female" };

function isAgeRange(value: unknown): value is AgeRange { return value === "3-4" || value === "5-6"; }
function isReminderInterval(value: unknown): value is ReminderInterval { return value === 0 || value === 15 || value === 30 || value === 45 || value === 60; }

export function parseSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") return DEFAULT_SETTINGS;
  const candidate = value as Partial<AppSettings>;
  return { ageRange: isAgeRange(candidate.ageRange) ? candidate.ageRange : DEFAULT_SETTINGS.ageRange, soundOn: typeof candidate.soundOn === "boolean" ? candidate.soundOn : DEFAULT_SETTINGS.soundOn, reducedMotion: typeof candidate.reducedMotion === "boolean" ? candidate.reducedMotion : DEFAULT_SETTINGS.reducedMotion, warmTheme: typeof candidate.warmTheme === "boolean" ? candidate.warmTheme : DEFAULT_SETTINGS.warmTheme, reminderInterval: isReminderInterval(candidate.reminderInterval) ? candidate.reminderInterval : DEFAULT_SETTINGS.reminderInterval, voice: isVoiceGender(candidate.voice) ? candidate.voice : DEFAULT_SETTINGS.voice };
}

export function readSettings(): AppSettings { if (typeof window === "undefined") return DEFAULT_SETTINGS; try { return parseSettings(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "null")); } catch { return DEFAULT_SETTINGS; } }
export function saveSettings(settings: AppSettings): void { try { window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)); } catch { /* Storage is optional in private browsing. */ } }
export function readCompletedMissions(): string[] { if (typeof window === "undefined") return []; try { const value: unknown = JSON.parse(window.localStorage.getItem(MISSIONS_STORAGE_KEY) ?? "[]"); return Array.isArray(value) && value.every((item): item is string => typeof item === "string") ? value : []; } catch { return []; } }
export function saveCompletedMissions(ids: string[]): void { try { window.localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(ids)); } catch { /* Storage is optional in private browsing. */ } }
